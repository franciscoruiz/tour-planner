
var mapServices = angular.module('map.services', []);


mapServices.factory('geocoderService', function ($q, $log) {
  var geocoder = new google.maps.Geocoder();

  var geocode = function (address) {
    var deferred = $q.defer();

    var request = {address: address};
    geocoder.geocode(request, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        deferred.resolve(results);
      } else {
        deferred.reject(results, status);
        $log.log(status, request);
      }
    });

    return deferred.promise;
  };

  return {geocode: geocode};
});


mapServices.factory('directionsService', function ($q, $log) {
  var directionsService = new google.maps.DirectionsService();

  var REQUEST_DEFAULT_OPTIONS = {
    optimizeWaypoints: false,
    provideRouteAlternatives: false,
    travelMode: google.maps.TravelMode.DRIVING
  };

  var retrieveDirections = function (origin, destination, waypoints) {
    var deferred = $q.defer();

    var routeParameters = {
      origin: origin,
      destination: destination,
      waypoints: waypoints
    };

    var request = angular.extend({}, REQUEST_DEFAULT_OPTIONS, routeParameters);
    directionsService.route(request, function (directionsResult, directionsStatus) {
      if (directionsStatus == google.maps.DirectionsStatus.OK) {
        deferred.resolve(directionsResult);
      } else {
        deferred.reject(directionsResult, directionsStatus);
        $log.log(directionsStatus, request);
      }
    });

    return deferred.promise;
  };

  return {route: retrieveDirections};
});


mapServices.factory('mapService', function (
  $rootScope,
  $log,
  $q,
  $templateCache,
  $compile,
  $window,
  geocoderService,
  directionsService
) {

  var MapService = function (element, options) {
    this.map = new google.maps.Map(element, options);

    this.drawingManager = initDrawingManager();

    this.routeRenderers = {};
    this.kmlLayerRenderers = {};
  };

  // Points

  var MARKER_ICON_OUTSIDE_VIEWPORT = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 5,
    strokeWeight: 1,
    fillColor: 'red',
    fillOpacity: 1
  };

  MapService.prototype.searchForAddress = function (address, markerOptions, infoWindowOptions) {
    var deferred = $q.defer();

    var self = this;
    geocoderService.geocode(address).then(function (geocoderResults) {
      var viewportBounds = self.map.getBounds();
      var searchResults = [];
      angular.forEach(geocoderResults, function (geocoderResult) {
        var location = geocoderResult.geometry.location;
        var markerForcedOptions = {position: location, map: self.map};
        if (!viewportBounds.contains(location)) {
          markerForcedOptions.icon = MARKER_ICON_OUTSIDE_VIEWPORT;
        }
        markerOptions = angular.extend({}, markerOptions || {}, markerForcedOptions);
        var marker = new google.maps.Marker(markerOptions);

        searchResults.push({geocoderResult: geocoderResult, marker: marker});
      });
      deferred.resolve(searchResults);
    });

    var promise = deferred.promise;

    // Attach default behaviour: on click present InfoWindow
    promise.then(function (searchResults) {
      angular.forEach(searchResults, function (searchResult) {
        var infoWindow = self.createInfoWindow(
          infoWindowOptions.templateId,
          infoWindowOptions.templateContext(searchResult.geocoderResult)
        );
        var marker = searchResult.marker;
        self.addEventListener(marker, 'click', function () {
          self.openInfoWindow(infoWindow, marker);
        });
      });
    });

    return promise;
  };

  MapService.prototype.addMarker = function (location, options) {
    var markerForcedOptions = {position: location, map: this.map, draggagle: true};
    var markerOptions = angular.extend({}, options || {}, markerForcedOptions);
    var marker = new google.maps.Marker(markerOptions);
  };

  // Directions

  MapService.prototype.addRoute = function (route) {
    if (this.isRouteOnMap(route)) {
      return;
    }

    var routeRenderer = this.getRouteRenderer(route);
    this.renderRoute(route, routeRenderer);
  };

  MapService.prototype.renderRoute = function (route, renderer) {
    var waypoints = [];
    angular.forEach(route.waypoints, function (w) {
      var location = w.location;
      if (angular.isObject(location) && ! (location instanceof google.maps.LatLng)) {
        location = new google.maps.LatLng(location.lat, location.lng);
      }
      waypoints.push({
        location: location,
        stopover: w.stopover
      });
    });
    return this.renderDirections(route.origin, route.destination, waypoints, renderer);
  };

  MapService.prototype.renderDirections = function (origin, destination, waypoints, renderer) {
    var self = this;
    var directionsResultPromise = directionsService.route(origin, destination, waypoints);
    directionsResultPromise.then(function (directionsResult) {
      renderer.setDirections(directionsResult);
      renderer.setMap(self.map);
    });
    return directionsResultPromise;
  };

  MapService.prototype.removeRoute = function (route) {
    if (!this.isRouteOnMap(route)) {
      return;
    }

    var routeRenderer = this.getRouteRenderer(route);
    routeRenderer.setMap(null);
  };

  MapService.prototype.getRouteRenderer = function (route) {
    var routeId = route._id.$oid;
    var routeRenderer = this.routeRenderers[routeId];
    if (angular.isUndefined(routeRenderer)) {
      routeRenderer = new google.maps.DirectionsRenderer({preserveViewport: true});
      this.routeRenderers[routeId] = routeRenderer;
    }
    return routeRenderer;
  };

  MapService.prototype.isRouteOnMap = function (route) {
    var routeRenderer = this.getRouteRenderer(route);
    return !!(routeRenderer && routeRenderer.getMap());
  };

  // InfoWindows

  MapService.prototype.createInfoWindow = function (templateId, templateContext, options) {
    var infoWindowTemplate = $compile($templateCache.get(templateId));

    var scope = $rootScope.$new(true);

    angular.extend(scope, templateContext);

    var compiledTemplate = infoWindowTemplate(scope);
    var infoWindowContentElement;
    if (compiledTemplate.length === 1) {
      infoWindowContentElement = compiledTemplate[0];
    } else {
      $log.error('Template must contain a single element (tip: add top-level <div>)');
    }

    var maxWidth = $window.innerWidth - 55;
    var infoWindowOptions = angular.extend(
      {maxWidth: maxWidth},
      options,
      {content: compiledTemplate[0]}
    );
    var infoWindow = new google.maps.InfoWindow(infoWindowOptions);
    return infoWindow;
  };

  MapService.prototype.openInfoWindow = function (infoWindow, anchor) {
    infoWindow.open(this.map, anchor);
    return infoWindow;
  };

  // KML layers

  MapService.prototype.addKmlLayer = function (kmlLayer, infoWindowOptions) {
    if (this.isLayerOnMap(kmlLayer)) {
      return;
    }

    var renderer = this.getLayerRenderer(kmlLayer);
    if (angular.isUndefined(renderer)) {
      renderer = this.createLayerRenderer(kmlLayer, infoWindowOptions);
    }
    renderer.setMap(this.map);
  };

  MapService.prototype.removeKmlLayer = function (kmlLayer) {
    if (!this.isLayerOnMap(kmlLayer)) {
      return;
    }

    var renderer = this.getLayerRenderer(kmlLayer);
    renderer.setMap(null);
  };

  MapService.prototype.isLayerOnMap = function (kmlLayer) {
    var renderer = this.getLayerRenderer(kmlLayer);
    return !!(renderer && renderer.getMap());
  };

  MapService.prototype.getLayerRenderer = function (kmlLayer) {
    var kmlLayerId = kmlLayer.url;
    return this.kmlLayerRenderers[kmlLayerId];
  };

  MapService.prototype.createLayerRenderer = function (kmlLayer, infoWindowOptions) {
    var kmlLayerId = kmlLayer.url;
    var renderer = new google.maps.KmlLayer({
      url: kmlLayer.url,
      suppressInfoWindows: true
    });
    this.kmlLayerRenderers[kmlLayerId] = renderer;

    var self = this;
    var infoWindows = {};
    this.addEventListener(renderer, 'click', function (kmlMouseEvent) {
      var featureData = kmlMouseEvent.featureData;

      var infoWindow = infoWindows[featureData.id];
      if (angular.isUndefined(infoWindow)) {
        infoWindow = self.createInfoWindow(
          infoWindowOptions.templateId,
          infoWindowOptions.templateContext(kmlMouseEvent),
          {position: kmlMouseEvent.latLng}
        );
        infoWindows[featureData.id] = infoWindow;
      }

      self.openInfoWindow(infoWindow);
    });

    return renderer;
  };

  // Drawing

  var initDrawingManager = function () {
    // https://developers.google.com/maps/documentation/javascript/drawinglayer
    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.RECTANGLE
        ]
      }
    });

    google.maps.event.addListener(drawingManager, 'rectanglecomplete', function (rectangle) {
      $log.debug('Created rectangle: %s', rectangle.getBounds().toString());
      rectangle.setEditable(true);
      rectangle.setDraggable(true);
      google.maps.event.addListener(rectangle, 'bounds_changed', function () {
        $log.debug('Updated rectangle: %s', rectangle.getBounds().toString());
      });
    });

    return drawingManager;
  };

  MapService.prototype.startDrawing = function () {
    this.drawingManager.setMap(this.map);
  };

  MapService.prototype.stopDrawing = function () {
    this.drawingManager.setMap(null);
  };

  // Generic

  MapService.prototype.addEventListener = function (target, eventName, handler) {
    return google.maps.event.addListener(target, eventName, function () {
      var handlerArguments = arguments;
      $rootScope.$apply(function () {
        handler.apply({}, handlerArguments);
      });
    });
  };

  MapService.prototype.addMapEventListener = function (eventName, handler) {
    return this.addEventListener(this.map, eventName, handler);
  };

  MapService.prototype.removeEventListener = function (listener) {
    return google.maps.event.removeListener(listener);
  };


  var norway = new google.maps.LatLng(60.0, 7.0);
  var mapOptions = {
    zoom: 4,
    center: norway,
    panControl: false,
    zoomControl: false,
    scaleControl: false,
    streetViewControl: false,
    mapTypeControl: false
  };

  return new MapService(document.getElementById('map-canvas'), mapOptions);
});
