function extractURLpars() {

    var urlpars = location.search.substr(1).split('&');

    var pars = {};
    for (var i = 0; i < urlpars.length; ++i) {
        var par = urlpars[i].split('=');
        if (par.length == 2) {
            pars[par[0]] = par[1];
        }
    }

    return pars;
}

function makeDraggableSVG(selector, to_edit, additional) {

    to_edit = to_edit || {x: ['x'], y: ['y']};
    additional = additional || {};

    var drag_obj = $(selector);
    var svg = drag_obj.closest('svg');
    drag_obj.css('cursor', 'pointer');
    drag_obj.prop('draggable', true);

    // Grab objects to perform operations on
    var edit_objs = {};
    var edit_attrs = {};
    for (coord in to_edit) {
        edit_objs[coord] = [];
        edit_attrs[coord] = [];
        for (var i = 0; i < to_edit[coord].length; ++i) {
            spl = to_edit[coord][i].split('$');
            if (spl.length == 1) {
                edit_objs[coord].push(drag_obj);
                edit_attrs[coord].push(spl[0]);
            }
            else {
                edit_objs[coord].push($(spl[0]));
                edit_attrs[coord].push(spl[1]);
            }
        }
    }

    drag_obj.on('mousedown touchstart', function(evt) {

        evt.stopPropagation();
        evt.preventDefault();

        // Store the zero position
        drag_obj.data('currentX', evt.clientX);
        drag_obj.data('currentY', evt.clientY);

        // Assign a mousemove event
        svg.on('mousemove touchmove', function(evt) {

            evt.stopPropagation();
            evt.preventDefault();
        
            newattr = {}

            dx = evt.clientX - drag_obj.data('currentX');
            dy = evt.clientY - drag_obj.data('currentY');

            dcoords = {x: dx, y: dy};
            for (coord in to_edit) {
                for (var i = 0; i < to_edit[coord].length; ++i) {
                    obj = edit_objs[coord][i];
                    a = edit_attrs[coord][i];
                    newattr[to_edit[coord][i]] = parseFloat(obj.attr(a))+dcoords[coord]; 
                    obj.attr(a, newattr[to_edit[coord][i]]);               
                }
            }

            drag_obj.data('currentX', evt.clientX);
            drag_obj.data('currentY', evt.clientY);

            if (additional.onMoveCallback != null) {
                additional.onMoveCallback(newattr);
            }
        });

        // This one is in common for UP and LEAVE
        var end_drag = function(evt) {
            svg.off('mousemove touchmove');
        }

        svg.on('mouseup mouseleave touchend touchleave', end_drag);
    });
}