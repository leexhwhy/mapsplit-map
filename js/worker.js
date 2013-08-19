require('../node_modules/osm-pbf-leaflet/lib/OSMReader.js');
require('../node_modules/osm-pbf-leaflet/PBFParser.js');

self.addEventListener('message', function(e) {
    var reader = new OSM.Reader(OSM.PBFParser);
    var parsed = reader.buildFeatures(e.data);

    // use stringify/parse instead of structured cloning, as it takes
    // only half the time on Chrome (slightly slower on Firefox)
    parsed = JSON.stringify(parsed);

    self.postMessage({parsed: parsed});

    parsed = null;
    self.close();
}, false);
