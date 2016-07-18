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


// I tried replacing this with Snap.svg but all in all it looks like
// my solution's better (works on mobiles too for example)
function makeDraggableSVG(selector, to_edit, additional) {

    to_edit = to_edit || {x: ['x'], y: ['y']};
    additional = additional || {};

    var drag_obj = $(selector);
    var svg = drag_obj.closest('svg');
    drag_obj.addClass('draggable-svgel');

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
        if (evt.type == 'touchstart') {
            var tX = evt.originalEvent.touches[0].clientX;
            var tY = evt.originalEvent.touches[0].clientY;
        }
        else {
            var tX = evt.clientX;
            var tY = evt.clientY;
        }

        drag_obj.data('currentX', tX);
        drag_obj.data('currentY', tY);           

        // Assign a mousemove event
        svg.on('mousemove touchmove', function(evt) {

            evt.stopPropagation();
            evt.preventDefault();
        
            newattr = {}

            if (evt.type == 'touchmove') {
                var tX = evt.originalEvent.touches[0].clientX;
                var tY = evt.originalEvent.touches[0].clientY;
            }
            else {
                var tX = evt.clientX;
                var tY = evt.clientY;
            }

            dx = tX - drag_obj.data('currentX');
            dy = tY - drag_obj.data('currentY');

            dcoords = {x: dx, y: dy};
            for (coord in to_edit) {
                for (var i = 0; i < to_edit[coord].length; ++i) {
                    obj = edit_objs[coord][i];
                    a = edit_attrs[coord][i];
                    newattr[to_edit[coord][i]] = parseFloat(obj.attr(a))+dcoords[coord]; 
                    obj.attr(a, newattr[to_edit[coord][i]]);               
                }
            }

            drag_obj.data('currentX', tX);
            drag_obj.data('currentY', tY);

            if (additional.onMoveCallback != null) {
                additional.onMoveCallback(newattr);
            }
        });

        // This one is in common for UP and LEAVE
        var end_drag = function(evt) {
            svg.off('mousemove touchmove');
            svg.off('mouseup mouseleave touchend touchleave');
        }

        svg.on('mouseup mouseleave touchend touchleave', end_drag);
    });
}

function makeUndraggableSVG(selector) {
    // Delete everything
    var drag_obj = $(selector);
    var svg = drag_obj.closest('svg');
    drag_obj.removeClass('draggable-svgel');

    drag_obj.off('mousedown touchstart');
}