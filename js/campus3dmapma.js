{require([
      "esri/Map",
      "esri/views/SceneView",
      "esri/layers/SceneLayer",
      "esri/Camera",
      "esri/renderers/SimpleRenderer",     
      "esri/widgets/Popup",
      "esri/symbols/MeshSymbol3D",
      "esri/symbols/FillSymbol3DLayer",
      "esri/layers/MapImageLayer",
      "esri/layers/GraphicsLayer",
      "dojo/query",

      // Bootstrap
      "bootstrap/Dropdown",
      "bootstrap/Collapse",

      // Calcite Maps
      "calcite-maps/calcitemaps-v0.3",
      
      "dojo/domReady!"
    ], function(Map, SceneView, SceneLayer, Camera, SimpleRenderer, Popup, MeshSymbol3D,
      FillSymbol3DLayer, MapImageLayer, GraphicsLayer, query) {

      var mapUrl ="https://webgis.labzone.dce.harvard.edu/arcgis/rest/services/Hosted/campus3dweb/SceneServer/layers/0";
      var baseUrl = "https://hppm-dev.cadm.harvard.edu/arcgis/rest/services/campus3d/campus3dbaseweb/MapServer";
      // The clipping extent for the scene
      var cambridgeExtent = { // autocasts as new Extent()
        xmax: -7914200.975201687,
        xmin: -7920756.430593854,
        ymax: 5219264.044744534,
        ymin: 5213541.028132325,
        
        spatialReference: { // autocasts as new SpatialReference()
          wkid: 102100
        }
      };

      var bGraphicsLayer = new GraphicsLayer();

      var campusTemplate = { // autocasts as new PopupTemplate()
        title: "Info Building",
        content: "<b>{building_name}</b>, {address}<br><div class='new'></div>" +
          "<b>Root: </b> {root}<br>" +
          "<img src='{aa2_photo}'><br>"+
          "<b>Use: </b> {use}<br>" +
          "<b>Tub: </b> {tub}<br>" +
          "<b>Construction year: </b> {construction_year}<br>" +
          "<b>Height SL: </b> {height_sl} feet<br>" +
          "<b>Height GL: </b> {height_gl} feet<br>" +
          "<b>Owner: </b> {owner}<br>"
          /*+
          "<b>Operator: </b> {CURR_OPERATOR} km<br>" +
          "<b>Drilled: </b> {SPUD}<br>" +
          "<b>Completed: </b> {COMPLETION}<br>" +
          "<b>Status: </b> {STATUS2}<br>" +
          "<b>Depth: </b> {DEPTH} meters<br>"*/,
        /*fieldInfos: [{
          fieldName: "SPUD",
          format: {
            dateFormat: "short-date"
          }
        }, {
          fieldName: "COMPLETION",
          format: {
            dateFormat: "short-date"
          }
        }, {
          fieldName: "DEPTH",
          format: {
            places: 0,
            digitSeparator: true
          }
        }]*/
      };

      /******************************************************************
       *
       * Create the map, view and widgets
       * 
       ******************************************************************/

      // Map
      var map = new Map({
        //basemap: "gray",
        ground: "world-elevation"
      });

      var view = new SceneView({
        container: "mapViewDiv",
        map: map,
        padding: {
          top: 50,
          bottom: 0
        }, 
        breakpoints: {
          xsmall: 768,
          small: 769,
          medium: 992,
          large: 1200
        },
        // Indicates to create a local scene
        viewingMode: "local",
        // Use the exent defined in clippingArea to define the bounds of the scene
        clippingArea: cambridgeExtent,
        extent: cambridgeExtent,
        popup: {
          dockEnabled: true,
          dockOptions: {
            // Disables the dock button from the popup
            buttonEnabled: false,
            // Ignore the default sizes that trigger responsive docking
            breakpoint: false,
            position: 'top-right'
          }
        },
        breakpoints: {
          xsmall: 768,
          small: 769,
          medium: 992,
          large: 1200
        }       
      });

      var cam = new Camera({
        heading: 6, // face due east
        tilt: 55, // looking from a bird's eye view
        position: [-71.1285, 42.315, 5000]  // creates a point instance (x,y,z)
      });

      view.camera = cam;

      // Create SceneLayer and add to the map
      var sceneLayer = new SceneLayer({
        url: mapUrl,
        popupEnabled: true,
        id: 'bg'
      });

      var layer = new MapImageLayer({url: baseUrl});
      
      map.add(layer);
      
      map.add(sceneLayer);

      sceneLayer.popupTemplate = campusTemplate;
      // Create MeshSymbol3D for symbolizing SceneLayer
      var symbol = new MeshSymbol3D(
        new FillSymbol3DLayer({
          // If the value of material is not assigned, the default color will be grey
          material: {
            color: [255, 239, 214]
          }
        })
      );

      var symbol1 = new MeshSymbol3D(
        new FillSymbol3DLayer({
          // If the value of material is not assigned, the default color will be grey
          material: {
            color: [255,255,0]
          }
        })
      );
      // Add the renderer to sceneLayer
      sceneLayer.renderer = new SimpleRenderer({
        symbol: symbol
      });

      view.on("click", function(evt){
        var screenPoint = {
          x: evt.x,
          y: evt.y
        };
        view.hitTest(screenPoint)
          .then(function(response){
             // do something with the result graphic
             var graphic = response.results[0].graphic;
             console.log(response.results[0])
             graphic.setSymbol(symbol1);
             bGraphicsLayer.add(graphic);
             console.log(bGraphicsLayer)
             map.add(bGraphicsLayer);
          });
      });

      
      
      /******************************************************************
       *
       * Synchronize popup and Bootstrap panels
       * 
       ******************************************************************/

      // Popup - dock top-right desktop, bottom for mobile
      view.watch("widthBreakpoint", function(breakPoint){        
        if (breakPoint === "medium" || breakPoint === "large" || breakPoint === "xlarge") {
         view.popup.dockOptions.position = "top-right";
        } else {
         view.popup.dockOptions.position = "bottom-center";
        }
      });
      
      // Popup - show/hide panels when popup is docked
      view.popup.watch(["visible", "currentDockPosition"], function(){
        var docked = view.popup.visible && view.popup.currentDockPosition;
        if (docked) {
          query(".calcite-panels").addClass("invisible");
        } else {
          query(".calcite-panels").removeClass("invisible");
        }
      });

      // Panels - undock popup when panel shows
      query(".calcite-panels .panel").on("show.bs.collapse", function(e) {
        if (view.popup.currentDockPosition) {
          view.popup.dockEnabled = false;
        }
      });

    });}