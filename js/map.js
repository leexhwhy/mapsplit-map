(function() {
    var lat=47.722302000;
    var lon=9.385398000;
    var zoom=13;
    var map;
    var points;
    var renderers = ["SVGX"]; // Canvas SVG
    
    var getFeatureInfoHtml = function(feature) {
        var tags = feature.attributes;
        var infoHtml = "<table>";
        for (var key in tags) {
           infoHtml += "<tr><td>" + key + "</td><td>" + tags[key] + "</td></tr>";
        }
        infoHtml += "</table>";
        return infoHtml;
    };
    
    OpenLayers.Renderer.SVGX = OpenLayers.Class(OpenLayers.Renderer.SVG, {
    
        initialize: function(options) {
            OpenLayers.Renderer.SVG.prototype.initialize.apply(this, [options]);
        },
    
        setStyle: function(node, style, options) {
            var node = OpenLayers.Renderer.SVG.prototype.setStyle.apply(this, [node, style, options]);
            if (style.visibility) {
                node.style.visibility = style.visibility;
            }
            return node;
        },
    
        CLASS_NAME: "OpenLayers.Renderer.SVGX" 
    });     
    
    function initFeaturePopupsControl(layer) {
        var fpControl = new OpenLayers.Control.FeaturePopups({
            popupSingleOptions: {
                popupClass: OpenLayers.Popup.Anchored,
                panMapIfOutOfView: false
            },
            popupHoverOptions: {
                followCursor: false
            },
            selectOptions: {
                clickout: true
            }
        });
    
        // allow map panning while feature hovered or selected
        fpControl.controls.hover.handlers.feature.stopDown = false;
        fpControl.controls.select.handlers.feature.stopDown = false;
    
        fpControl.addLayer(layer, {
            templates: {
                hover: getFeatureInfoHtml,
                single: getFeatureInfoHtml
            }
        });
        map.addControl(fpControl);
    }
    
    function init() {
        var options = {
            controls: [],
            projection: "EPSG:900913",
            displayProjection: "EPSG:4326",
            /* turn off animated zooming, slow on my old machine */
            zoomMethod: null
        };
    
        map = new OpenLayers.Map('map', options);
    
        map.addControl(new OpenLayers.Control.Attribution());
        map.addControl(new OpenLayers.Control.Permalink());
        //map.addControl(new OpenLayers.Control.LayerSwitcher());
        map.addControl(new OpenLayers.Control.Navigation(
            {dragPanOptions: {enableKinetic: false}}
        ));
        map.addControl(new OpenLayers.Control.PanZoomBar());
    
        map.addLayer(new OpenLayers.Layer.OSM(null, null, {
            //opacity: 0.5,
            transitionEffect: null
        }));
    
        // transparent layer (~ no base layer)
        //map.addLayer(new OpenLayers.Layer("Leer", {isBaseLayer: true}));
    
        var displayNoneStyle = new OpenLayers.Style({
            visibility: 'hidden'
        });
        var defaultBlueStyle = new OpenLayers.Style({
            strokeColor: "blue",
            strokeWidth: 2,
            strokeOpacity: 0.5,
            pointRadius: 8,
            fillColor: "blue",
            fillOpacity: 0.2,
            visibility: 'hidden',
            pointerEvents: 'painted'
        });
        var myStyles = new OpenLayers.StyleMap({
            "default": defaultBlueStyle, 
            //"default": displayNoneStyle,
            "select": new OpenLayers.Style({
                strokeColor: "red",
                strokeWidth: 2,
                strokeOpacity: 0.8,
                pointRadius: 8,
                fillColor: "red",
                fillOpacity: 0.2,
                visibility: 'visible'
            })
        });
    
       var grid = new OpenLayers.Strategy.Grid();
       grid.buffer = 0;
       var vector = new OpenLayers.Layer.Vector("tiles", {
            // setting layer projection does not work with Grid.js (wrong x/y calculation)
            //projection: map.displayProjection,
            strategies: [grid],
            protocol: new OpenLayers.Protocol.HTTP({
                // 13 / 4309 / 2857 = 4309_2857.pbf
                url: "tiles/${x}_${y}.pbf",
                format: new OpenLayers.Format.PBF({internalProjection: map.getProjectionObject()})
            }),
            visibility: true,
            styleMap: myStyles,
            renderers: renderers
        });
        
        vector.events.register("loadend", vector,
          function() {
            console.log('loadend');
         }
        );
       map.addLayer(vector);
       
       initFeaturePopupsControl(vector);
    
       // hover only: hide features, render only on select 
       // works in Chrome, not in Firefox?
       //vector.renderer.rendererRoot.style.visibility = 'hidden';
    
       if (!map.getCenter()) {
           map.setCenter(
               new OpenLayers.LonLat(lon, lat).transform(
                   new OpenLayers.Projection("EPSG:4326"),
                   map.getProjectionObject()
               ), zoom
           );                
       }
    }

    init();
})();
