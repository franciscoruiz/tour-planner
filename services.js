
var mapServices = angular.module('map.services', []);

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

mapServices.factory('mapService', function ($rootScope, directionsService) {

  var MapService = function (element, options) {
    this.map = new google.maps.Map(element, options);

    this.routeRenderers = {};
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
    return this.renderDirections(route.origin, route.destination, route.waypoints, renderer);
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

  // Generic

  MapService.prototype.addEventListener = function (eventName, handler) {
    return google.maps.event.addListener(this.map, eventName, function () {
      var handlerArguments = arguments;
      $rootScope.$apply(function () {
        handler.apply({}, handlerArguments);
      });
    });
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
