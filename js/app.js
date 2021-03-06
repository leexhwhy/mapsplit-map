/**
 * Side panel Controls
 */

var mm = require('./map.js');

var map = mm.map,
    oldZoom = null,
    oldLanduse = true,
    styles = {
        'custom': ''
    };

function updateVisibility(evt) {
    var ele = evt.target || evt.srcElement;
    mm.updateVisibility(ele.value);
}

function handleLanduse(evt) {
    var ele = evt.target || evt.srcElement;
    mm.showLanduse(ele.checked);
    oldLanduse = ele.checked;
}

function handleStyle(evt) {
    var name = this.value,
        mapcss = "";
    if (!styles[name]) {
        styles[name] = mm.loadStyle(name);
    }
    mapcss = styles[name];
    updateMapCSS(mapcss, false); //name !== 'custom');
    mm.applyStyle(mapcss);
}

function handleApply(evt) {
    var mapcss = document.getElementById('mapcss').value;
    var messageEle = document.getElementById('message');
    styles['custom'] = mapcss;
    var error = mm.validateStyle(mapcss);
    if (!error) {
        messageEle.classList.add('hidden');
        mm.applyStyle(mapcss);
    } else {
        messageEle.innerText = error.message;
        messageEle.classList.remove('hidden');
    }
}

function updateMapCSS(mapcss, disabled) {
    var mapcssEle = document.getElementById('mapcss');
    mapcssEle.value = mapcss;
    mapcssEle.disabled = disabled;
    document.getElementById('apply').disabled = disabled;
}

function updateLanduse() {
    var zoom = map.getZoom(),
        ele = document.getElementById('landuse');

    if (zoom >= 17 && (!oldZoom || oldZoom < 17) && ele.checked) {
        ele.checked = false;
        mm.showLanduse(false);
    } else if (zoom < 17 && (!oldZoom || oldZoom >= 17) && !ele.checked && oldLanduse) {
        ele.checked = true;
        mm.showLanduse(true);
    }
}

function updateZoomHint() {
    var zoom = map.getZoom(),
        ele = document.getElementById('zoomhint');

    if (zoom >= 13 && (!oldZoom || oldZoom < 13)) {
        ele.classList.add('hidden');
        mm.restoreBaseLayer();
    } else if (zoom < 13 && (!oldZoom || oldZoom >= 13)) {
        ele.classList.remove('hidden');
        mm.activateBaseLayer();
    }
}

function handleMapResize(evt) {
    var large = this.id === 'largemap';

    var mapEle = document.getElementById('map');
    mapEle.style.height = large ? '' : '400px';
    mapEle.style.bottom = large ? '20px' : '';

    var footer = document.getElementById('footer');
    footer.style.top = large ? '' : '420px';
    footer.style.height = large ? '20px' : '';
    
    document.getElementById('largemap').classList.toggle('hidden');
    document.getElementById('smallmap').classList.toggle('hidden');
    
    map.invalidateSize();
}

function updateRenderer(evt) {
    mm.updateRenderer(this.value);
}

function init() {
    var radios = document.getElementsByName('visibility');
    for (var i = 0; i < radios.length; i++) {
        radios[i].onclick = updateVisibility;
    }
    
    document.getElementById('landuse').onclick = handleLanduse;

    var rendererRadios = document.getElementsByName('renderer');
    for (var i = 0; i < rendererRadios.length; i++) {
        rendererRadios[i].onclick = updateRenderer;
    }

    document.getElementById('style').onchange = handleStyle;
    document.getElementById('apply').onclick = handleApply;
    updateMapCSS(mm.mapcss, false);

    function registerMapResize(id) {
        var link = document.getElementById(id);
        L.DomEvent
            .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', handleMapResize);
    }
    registerMapResize('largemap');
    registerMapResize('smallmap');

    mm.map.on('zoomstart', function() {
        oldZoom = map.getZoom();
    }, this);

    mm.map.on('zoomend', updateZoomHint, this);
    updateZoomHint();

    mm.map.on('zoomend', updateLanduse, this);
    updateLanduse();
}

init();
