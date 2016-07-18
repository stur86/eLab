var Applet = function() {

    this.name = "Test Applet";
    this.shname = "testApp";

    this.x = 100;

    this.do_thing = function() {
        alert('yup');
    }

    this.parameters = {
        "motion": 
        {
            'name': "Motion",
            'type': "check",
            'value': true,
        },
        "motion2": 
        {
            'name': "Also",
            'type': "check",
            'value': true,
        },
        "tradio":
        {
            'name': "Test Radio",
            'type': "radio",
            'value': 'opt0',
            'options': {
                'opt0': 'One option',
                'opt1': 'Another option'
            }
        },
        "speed":
        {
            'name': "Speed",
            'type': "slide",
            'value': 50.0,
            'min': 10.0,
            'max': 80.0,
            'step': 1.0,
        },
        "number":
        {
            'name': "Thing",
            'type': "text",
            'value': 1.0,
            'default_value': 1.0,
        },
        "button":
        {
            'name': "Trigger",
            'type': 'trigger',
            'binding': this.do_thing,
            'button_name': "Click me"
        },

    };

    this.svgurl = 'test_applet.svg';

    this.description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod \
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\
                        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo\
                        consequat.\n\
                        Duis aute irure dolor in reprehenderit in voluptate velit esse\
                        cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non\
                        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    this.update = function() {
        this.x += this.parameters.speed.value*this.dt/1000.0*this.parameters.motion.value*(this.parameters.tradio.value == "opt0"? 1 : -1)*this.parameters.number.value;
    }

    this.loaded = function() {
        Snap.select('#testdot').drag().addClass('draggable-svgel');        
        Snap.select('#testrect').drag().addClass('draggable-svgel');        
    }
}

Applet.prototype = new AppletBase();