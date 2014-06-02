
var mapServices = angular.module('map.services', []);

mapServices.factory('retrieveRouteDirections', function ($q, $log) {
  var directionsService = new google.maps.DirectionsService();

  var REQUEST_DEFAULT_OPTIONS = {
    optimizeWaypoints: false,
    travelMode: google.maps.TravelMode.DRIVING
  };

  var retrieveRouteDirections = function (route) {
    var deferred = $q.defer();

    var routeParameters = {
      origin: route.origin,
      destination: route.destination,
      waypoints: route.waypoints
    };

    var request = angular.extend({}, REQUEST_DEFAULT_OPTIONS, routeParameters);
    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        deferred.resolve(response);
      } else {
        deferred.reject(response, status);
        $log.log(status, route);
      }
    });

    return deferred.promise;
  };

  return retrieveRouteDirections;
});

mapServices.factory('mapService', function (retrieveRouteDirections) {

  var MapService = function (element, options) {
    this.map = new google.maps.Map(element, options);

    this.routeRenderers = {};
  };

  MapService.prototype.addRoute = function (route) {
    if (this.isRouteOnMap(route)) {
      return;
    }

    var routeRenderer = this.getRouteRenderer(route);
    this.renderRoute(route, routeRenderer);
  };

  MapService.prototype.renderRoute = function (route, renderer) {
    var self = this;
    return retrieveRouteDirections(route).then(function (response) {
      renderer.setDirections(response);
      renderer.setMap(self.map);
    });
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
    return routeRenderer && routeRenderer.getMap();
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
