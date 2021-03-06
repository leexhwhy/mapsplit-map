require('../node_modules/osm-pbf-leaflet/lib/OSMReader.js');
require('../node_modules/osm-pbf-leaflet/PBFParser.js');
require('./mapcss/jsmapcss.js');
require('./mapcss/Filter.js');

var request = null,
    mapcss,
    mapZoom;

function fire(type) {
    self.postMessage({ event: type, time: Date.now() });
}

function log(msg) {
    //self.postMessage({ log: msg, time: Date.now() });
}

function get(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
        // status 0 + response check for file:// URLs
        if (this.status === 200 || (this.status === 0 && this.response)) {
            callback(null, this.response);
        } else {
            callback(this.status + ': ' + this.statusText);
        }
    };
    xhr.onerror = function(e) {
        callback(this.status + ': ' + this.statusText);
    };
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    
    return xhr;
}

function filter(features) {
    var startTime = Date.now(),
        filtered = [],
        mapCssFilter = new styleparser.Filter();

    mapCssFilter.init(mapZoom);
    mapCssFilter.parse('' + mapcss);

    for (var i = 0, length = features.length; i < length; i++) {
        if (mapCssFilter.filter(features[i])) {
            filtered.push(features[i]);
        }
    }
    return filtered;
}

function parse(err, buffer) {
    var reader = new OSM.Reader(OSM.PBFParser),
        parsed = null;

    request = null;

    if (!err) {
        fire('tileresponse');

        parsed = reader.buildFeatures(buffer);

        // pre-filter entities for current MapCSS style and zoom
        parsed = filter(parsed);

        // use stringify/parse instead of structured cloning, as it takes
        // only half the time on Chrome (slightly slower on Firefox)
        parsed = JSON.stringify(parsed);

        self.postMessage({
            parsed: parsed
        });
    } else {
        self.postMessage({
            err: err
        });
    }

    parsed = null;
    log('close');
    self.close();
}

self.addEventListener('message', function(e) {
    var buffer = e.data.buffer;

    log('message: ' + (e.data.abort ? ('abort request = ' + (!!request)) : (buffer ? 'parse' : 'get')));

    mapcss = e.data.mapcss;
    mapZoom = e.data.mapZoom;

    if (e.data.abort) {
        if (request) {
            request.abort();
            fire('tilerequestabort');
        }
        log('close abort');
        self.postMessage({
            aborted: true
        });
        self.close();
    } else if (!buffer) {
        request = get(e.data.url, parse);
    } else {
        parse(null, buffer);
    }
}, false);
