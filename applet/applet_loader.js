// Applet base class
var AppletBase = function(scope, ngApp) {

    this.name = "Applet";
    this.shname = "app";
    this.scope = scope;
    this.ngApp = ngApp;

    // Time parameters
    this.fps = 60.0;
    this.dt = 1000.0/this.fps;
    this.timescale = 1;

    this.parameters = {
    }; // Empty by default

    this.colors = {
        "background": "#111517",
        "world": "#090909",
        "controls_bkg": "#224444",
        "text": "#eeffff",
        "text_dark": "#111111",
        "controls_0": "#eeffff",
        "controls_1": "#5599ff",
        "glow": "#bbbbef",
    } // Default colors

    this.svgurl = null; // Empty by default

    this.description = ""; // Empty by default

    this.loaded = function() {
        // Run after the SVG has been loaded
    }

    this.start = function() {
        // For now, nothing        
    }

    this.update = function() {
        // For now, nothing
    }

    this.stop = function() {
        // For now, nothing        
    }

}

// Applet loader and Angular handler
var ElabApplet = function(AppEngine) {

    this.worldApp = angular.module(AppEngine.prototype.shname, []);
    worldApp = this.worldApp;
    this.worldCtrl = this.worldApp.controller(AppEngine.prototype.shname + 'Ctrl', function($scope, $interval, $compile) {

        $scope.engine = new AppEngine($scope, worldApp);
        engine = $scope.engine;

        var appWorld = $('#AppletWorld')
        appWorld.load(engine.svgurl, '', function() {
            $compile(appWorld.contents())($scope);
            engine.loaded();
        });

        // Create getters/setters for engine parameters that need them
        for (p in engine.parameters) {
            if (engine.parameters[p].type == 'text') {
                var par = engine.parameters[p];
                par._value = par.value;
                Object.defineProperty(par, 'value', {
                    get: function() {
                        return par._value;
                    },
                    set: function(v) {
                        par._value = parseFloat(v) || par.default_value;
                    }
                });
            }
        }

        $scope.start_simul = function() {
            if ($scope.simul !== undefined)
                return;
            $scope.engine.start();
            $scope.simul = $interval(function() {
                $scope.engine.update();
            }, $scope.engine.dt);
        };

        $scope.stop_simul = function() {
            if ($scope.simul === undefined)
                return;
            $interval.cancel($scope.simul);
            $scope.engine.stop();
            $scope.simul = undefined;
        }

        // Description
        $scope.show_description = false;
        $scope.switch_description = function() {
            $scope.show_description = !$scope.show_description;
        }

        // Graphic decor

        $scope.decor_id = '';
        $scope.decor_id_totlen = 10;
        $scope.decor_id_t = 0;
        $scope.decor_id_frames = 10;

        $scope.decor_id_intv = $interval(function() {            
            $scope.decor_id_t = $scope.decor_id_t%$scope.decor_id_frames;
            if ($scope.decor_id_t == 0) {
                if ($scope.decor_id.length >= $scope.decor_id_totlen) {
                    $interval.cancel($scope.decor_id_intv);
                }
                $scope.decor_id += (parseInt(Math.random()*10));
            }
            else {
                var i = $scope.decor_id.length-1;
                $scope.decor_id = $scope.decor_id.substr(0, i)+(parseInt(Math.random()*10));
            }
            $scope.decor_id_t += 1;
        }, 30);

        // Audio SFX

        $scope.confirm_sfx = new Audio('../sfx/Blip_Select.wav');
        $scope.play_confirm = function() {
            $scope.confirm_sfx.play();
        }
    });
}