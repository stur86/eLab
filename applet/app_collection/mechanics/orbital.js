var Applet = function(scope, ngApp) {

    this.name = "Orbital Mechanics";
    this.shname = "orbMechApp";
    this.scope = scope;
    this.ngApp = ngApp;

    this.running = false;

    this._G0 = 1e5;

    this.explode_sfx = new Audio('../sfx/explosion.wav');

    this.origin = [$('#AppletWorld').width()/2.0, $('#AppletWorld').height()/2.0];
    var that = this;
    $(window).resize(function() {
        that.grab_moon_xy();
        that.origin = [$('#AppletWorld').width()/2.0, $('#AppletWorld').height()/2.0];
        that.set_moon_xy();
        that.set_moonspeed_xy();
        this.eval_orbit();
        that.scope.$apply();
    });

    this.grab_moon_xy = function() {
        this.moon_xy = [parseFloat(this.moon.attr('cx'))-this.origin[0],
                        parseFloat(this.moon.attr('cy'))-this.origin[1]];        
    }
    this.grab_moonspeed_xy = function() {
        this.moonspeed_xy = [parseFloat(this.moonspeed.attr('x2'))-parseFloat(this.moonspeed.attr('x1')),
                             parseFloat(this.moonspeed.attr('y2'))-parseFloat(this.moonspeed.attr('y1'))];        
    }

    this.set_moon_xy = function() {
        this.moon.attr('cx', this.moon_xy[0]+this.origin[0]);
        this.moon.attr('cy', this.moon_xy[1]+this.origin[1]);
    }
    this.set_moonspeed_xy = function() {
        this.moonspeed.attr('x1', this.moon_xy[0]+this.origin[0]);
        this.moonspeed.attr('y1', this.moon_xy[1]+this.origin[1]);
        this.moonspeed.attr('x2', this.moon_xy[0]+this.origin[0]+this.moonspeed_xy[0]);
        this.moonspeed.attr('y2', this.moon_xy[1]+this.origin[1]+this.moonspeed_xy[1]);
        this.mspeedhandle.attr('cx', this.moon_xy[0]+this.origin[0]+this.moonspeed_xy[0]);
        this.mspeedhandle.attr('cy', this.moon_xy[1]+this.origin[1]+this.moonspeed_xy[1]);        
    }

    this.moon_drag_on = function() {
        makeDraggableSVG('#moon', {x: ['cx'], y: ['cy']}, {
            onMoveCallback: function(attrs) {
                that.grab_moonspeed_xy();
                that.moon_xy = [attrs['cx']-that.origin[0], attrs['cy']-that.origin[1]];
                that.set_moonspeed_xy();
            },
        });
    }


    this.reset_system = function() {
        // Moon coordinates
        if (!that.running) {
            that.moon_xy = [that.origin[0]/2.0, 0];
            that.moonspeed_xy = [0, -that.origin[0]/4.0];            
        }
        that.set_moon_xy();
        that.set_moonspeed_xy();
    }    

    this.moon_explode = function() {
        // In this eventuality, use D3 for an animation
        var moon = d3.select('#moon');
        // Immediately stop running
        this.running = false;
        // Start a transition
        var startcol = moon.style('fill');
        that.explode_sfx.play();
        moon.transition()
        .duration(750)
        .style({
            'r': 150,
            'fill': '#ff0000',
            'opacity': 0
        })
        .each('end', function() {
            // Restore and reset everything
            that.reset_system();
            moon.style({
                'fill': startcol,
                'opacity': 1,
                'r': null,
            });
            that.scope.stop_simul();            
            that.scope.$apply();
        });
    }

    this.orbit = {};
    this.eval_orbit = function()
    {
        /* In polar coordinates, the orbital equation can be written as
        *
        *   r = l²/(m²gamma)*1/(1+e*cos(th))
        *
        * where l is the angular momentum of the small body, m its mass, theta the angle with respect to the periapsis axis (the parameter)
        * and e the eccentricity, which can be found as follows:
        *       _____________________
        *   e =√{1+[2El²/(m³gamma²)]}
        *
        * E being the energy of the orbit, kinetic+potential.
        * Gamma is a simple constant, _G0*M
        */

        var m = parseFloat(this.parameters.moon_mass.value);
        var M = parseFloat(this.parameters.planet_mass.value);
        var r_x = this.moon_xy[0];
        var r_y = this.moon_xy[1];
        var m_vx = this.moonspeed_xy[0];
        var m_vy = this.moonspeed_xy[1];

        r = Math.sqrt(r_x*r_x+r_y*r_y);

        gamma = this._G0*M;

        // First calculate the relevant quantities, i.e. momentum and energy of orbit
        // l is defined as r x mv, being the vector product. So we have

        l = r_x*m*m_vy - r_y*m*m_vx;
        l2 = l*l;

        m2 = m*m;
        v2 = m_vx*m_vx+m_vy*m_vy;

        //console.log(m, M, m_vx, m_vy, r_0);
        // Now the energy
        K = 0.5*m*v2;    // Kinetic
        P = -gamma*m/r;                     // And potential
        E = K + P;                          // Total

        this.orbit.E = E;
        this.orbit.l = l;
        this.orbit.gamma = gamma;

        // What kind of orbit are we on?
        this.orbit.state = Math.sign(E); // 1 = escape orbit, 0 = parabolic orbit, -1 = elliptic orbit (stable or impact)

        this.orbit.e = Math.sqrt(1+2.0*E*l2/(m*m*m*gamma*gamma));

        // What's our current theta then?
        theta = Math.acos((l2/(r*m2*gamma)-1)/this.orbit.e); // We still don't know the sign though...
        // The convention is simple: if we're getting FURTHER AWAY from the centre, then theta is between 0 and 180, otherwise 180-360
        r_v = (r_x*m_vx+r_y*m_vy)/r; // Derivative of r in time
        if (r_v < 0)
        {
            theta = 2.0*Math.PI - theta;
        }

        // Finally, find alpha
        if (l > 0)
        {
            this.orbit.alpha = Math.atan2(r_y, r_x) - theta;
        }
        else
        {
            this.orbit.alpha = Math.atan2(r_y, r_x) + theta;
        }

        var _orbit_points = 100;
        var orbit_data = [];
        switch(this.orbit.state)
        {
            case -1:
                // A good ol' ellipse
                for (var t_i = 0; t_i <= _orbit_points; ++t_i)
                {
                    var theta_i = t_i*2.0*Math.PI/_orbit_points;
                    var r_i = l2/(m2*gamma)*1.0/(1.0+this.orbit.e*Math.cos(theta_i));
                    var x_i = r_i*Math.cos(theta_i+this.orbit.alpha);
                    var y_i = r_i*Math.sin(theta_i+this.orbit.alpha);
                    if (Math.abs(x_i) > 10000 || Math.abs(y_i) > 10000)
                        continue;
                    orbit_data.push({x: x_i, y: y_i});
                }
                // Also the foci
                var rmin = l2/(m2*gamma)*1.0/(1.0-this.orbit.e);
                var rmax = l2/(m2*gamma)*1.0/(1.0+this.orbit.e);
                this.orbit.foci = [
                    [0,0],    // Always first focus
                    [(rmax-rmin)*Math.cos(this.orbit.alpha), (rmax-rmin)*Math.sin(this.orbit.alpha)],
                ];
                break;
            case 0:
                // A parabola. Avoid theta = pi
                for (var t_i = 0; t_i <= _orbit_points; ++t_i)
                {
                    var theta_i = t_i*2.0*Math.PI/_orbit_points;
                    if (theta_i == Math.PI)
                    {
                        continue;
                    }
                    else
                    {
                        var r_i = l2/(m2*gamma)*1.0/(1.0+this.orbit.e*Math.cos(theta_i));
                        var x_i = r_i*Math.cos(theta_i+this.orbit.alpha);
                        var y_i = r_i*Math.sin(theta_i+this.orbit.alpha);
                        if (Math.abs(x_i) > 10000 || Math.abs(y_i) > 10000)
                            continue;
                        orbit_data.push({x: x_i, y: y_i});
                    }
                }
                // Put one of the foci out of the picture
                this.orbit.foci = [[0, 0], [-10000,-10000]];
                break;
            case 1:
                // An hyperbola. lots of stuff goes completely out of the window
                var delta = Math.acos(-1.0/this.orbit.e);  // Asymptote angle
                for (var t_i = 0; t_i <= _orbit_points; ++t_i)
                {
                    var theta_i = t_i*2.0*delta/_orbit_points-delta;
                    var r_i = l2/(m2*gamma)*1.0/(1.0+this.orbit.e*Math.cos(theta_i));
                    var x_i = r_i*Math.cos(theta_i+this.orbit.alpha);
                    var y_i = r_i*Math.sin(theta_i+this.orbit.alpha);
                    if (Math.abs(x_i) > 10000 || Math.abs(y_i) > 10000)
                        continue;
                    orbit_data.push({x: x_i, y: y_i});
                }
                // Put one of the foci out of the picture
                this.orbit.foci = [[0, 0], [-10000,-10000]];
                break;
        }

        // And apply the thing to drawing
        d3.select('#orbit_path').attr('d', d3.svg.line().x(function(d) {return d.x})
                                                        .y(function(d) {return d.y})
                                                        .interpolate('quadratic')(orbit_data));
    }

    this.parameters = {
        "planet_mass":
        {
            'name': "Planet mass",
            'type': "slide",
            'value': 100.0,
            'min': 50.0,
            'max': 150.0,
            'step': 1.0,
        },
        "moon_mass":
        {
            'name': "Moon mass",
            'type': "slide",
            'value': 20.0,
            'min': 10.0,
            'max': 30.0,
            'step': 1.0,
        },
        "startbutton":
        {
            'name': "Start simulation",
            'type': 'trigger',
            'binding': function() {
                scope.start_simul();
            },
            'button_name': "START"
        },       
        "resetbutton":
        {
            'name': "Reset simulation",
            'type': 'trigger',
            'binding': this.reset_system,
            'button_name': "RESET"
        },
        "stopbutton":
        {
            'name': "Stop simulation",
            'type': 'trigger',
            'binding': function() {
                scope.stop_simul();
            },
            'button_name': "STOP"
        },              
        "show_orbit":
        {
            'name': "Show orbit and foci",
            'type': 'check',
            'value': true,
        },              
    };

    this.svgurl = 'app_collection/mechanics/orbital.svg';

    this.description = "Newtonian gravity experiment.";

    this.start = function() {
        this.running = true;
        // Disengage dragging
        this.grab_moon_xy();
        this.grab_moonspeed_xy();
        this.eval_orbit();
        this.moon.off('mousedown');
        this.moonspeed.css('display', 'none');
        this.mspeedhandle.css('display', 'none');
        this._planetmass0 = parseFloat(this.parameters.planet_mass.value); // Necessary for future checks
    }

    this.update = function() {
        if (this.running) {            
            var dts = this.dt/1000.0;
            this.moon_xy[0] += this.moonspeed_xy[0]*dts/2;
            this.moon_xy[1] += this.moonspeed_xy[1]*dts/2;
            // Calculate forces...
            var r2 = this.moon_xy[0]*this.moon_xy[0]+this.moon_xy[1]*this.moon_xy[1];
            var r = Math.sqrt(r2);
            var Fmag = this._G0*this.parameters.planet_mass.value/r2;
            var Fvec = [-this.moon_xy[0]/r*Fmag, -this.moon_xy[1]/r*Fmag];
            this.moonspeed_xy[0] += Fvec[0]*dts;
            this.moonspeed_xy[1] += Fvec[1]*dts;
            this.moon_xy[0] += this.moonspeed_xy[0]*dts/2;
            this.moon_xy[1] += this.moonspeed_xy[1]*dts/2;        
            this.set_moon_xy();

            var pmass = parseFloat(this.parameters.planet_mass.value);
            if (this._planetmass0 != pmass) {
                this._planetmass0 = pmass;
                this.eval_orbit();
            }

            // Check position
            var min_r = pmass + parseFloat(this.parameters.moon_mass.value);
            if (r <= min_r) {
                this.moon_explode();
            }
        }
    }

    this.stop = function() {
        this.running = false;
        this.moon_drag_on();
        this.set_moonspeed_xy();
        this.moonspeed.css('display', 'block');
        this.mspeedhandle.css('display', 'block');
    }

    this.loaded = function() {
        this.moon_drag_on();
        makeDraggableSVG('#moonspeed_handle', {x: ['#moonspeed$x2', 'cx'], y: ['#moonspeed$y2', 'cy']});
        // Set statically the starting coordinates to that
        this.moon = $('#moon');
        this.moonspeed = $('#moonspeed');
        this.mspeedhandle = $('#moonspeed_handle');
        this.reset_system();
    }
}

Applet.prototype = new AppletBase();