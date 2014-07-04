
var controllers = angular.module('planner.controllers', []);


controllers.controller('RoutesCtrl', function ($scope, mapService, Route) {
  $scope.routes = Route.query();

  $scope.reloadRoutes = function () {
    $scope.routes = Route.query();
  };
});


controllers.controller('RouteViewCtrl', function ($scope, $routeParams, Route) {
  Route.get({id: $routeParams.route}, function (route) {
    $scope.route = route;
  });
});


controllers.controller('RouteCtrl', function ($scope, $log, $location, mapService, Route) {
  this.logRouteDetails = function () {
    $log.debug($scope.route);
  };
  this.showRoute = function () {
    mapService.addRoute($scope.route);
  };
  this.hideRoute = function () {
    mapService.removeRoute($scope.route);
  };
  this.isRouteOnMap = function () {
    return mapService.isRouteOnMap($scope.route);
  };

  this.saveRoute = function () {
    $scope.route.$save();
  };

  this.deleteRoute = function () {
    var routeName = $scope.route.name || "Unnamed route";
    if (confirm("Delete \"" + routeName + "\"?")) {
      if (this.isRouteOnMap()) {
        this.hideRoute();
      }
      $scope.route.destroy(function () {
        $location.path('/routes/');
      });
    }
  };

  // Steps-related logic

  this.breakLeg = function (leg, step) {
    var legIndex = $scope.route.legs.indexOf(leg);
    var stepIndex = leg.steps.indexOf(step);
    var steps = leg.steps.splice(stepIndex, leg.steps.length - stepIndex);
    $scope.route.legs.splice(legIndex + 1, 0, {summary: 'New', steps: steps});
  };

  var MARKER_SYMBOL_CIRCLE = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    strokeWeight: 4,
    fillColor: 'white',
    fillOpacity: 1
  };

  this.routeStepMarker = new google.maps.Marker({
    icon: MARKER_SYMBOL_CIRCLE,
    map: mapService.map,
    visible: false
  });

  this.showRouteStep = function (step) {
    this.showRoute($scope.route);

    this.routeStepMarker.setPosition(step.start_location);
    this.routeStepMarker.setTitle(step.instructions);
    this.routeStepMarker.setVisible(true);

    mapService.map.panTo(step.start_location);
    mapService.map.setZoom(16);
  };

});


controllers.controller('RouteEditCtrl', function ($scope, $location, $filter) {
  this.saveRoute = function () {
    $scope.route.$save(function (route) {
      var routeId = $filter('getResourceID')(route);
      $location.path('/routes/' + routeId);
    });
  };
});


controllers.controller('NewRouteCtrl', function ($scope, $location, $filter, mapService, Route) {
  $scope.origin;
  $scope.points;

  var directionsRenderer;

  this.reset = function () {
    resetDirectionsRenderer();
    $scope.origin = null;
    $scope.points = [];
  };

  var resetDirectionsRenderer = function () {
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }
    directionsRenderer = new google.maps.DirectionsRenderer({draggable: true});
  };

  this.showRoute = function () {
    var destination = $scope.points[$scope.points.length - 1].location;
    var intermediatePoints = $scope.points.slice(0, -1);
    var waypoints = [];
    angular.forEach(intermediatePoints, function (point) {
      if (!point.location) {
        return;
      }
      waypoints.push({location: point.location, stopover: false});
    });

    resetDirectionsRenderer();
    mapService.renderDirections($scope.origin, destination, waypoints, directionsRenderer);
  };

  this.addPoint = function () {
    $scope.points.push(new Point());
  };

  this.saveRoute = function () {
    var route = new Route();
    route.updateFromDirectionsResult(directionsRenderer.getDirections());
    route.name = "From " + route.origin + " to " + route.destination;
    route.$save(function (route) {
      var routeId = $filter('getResourceID')(route);
      $location.path('/routes/' + routeId);
    });

    this.reset();
  };

  var Point = function (location) {
    this.location = location;
  };

  mapService.addEventListener('rightclick', function (event) {
    var location = event.latLng;
    if (!$scope.origin) {
      $scope.origin = location;
    } else {
      $scope.points.push(new Point(location));
    }
  });


  this.reset();
});


controllers.controller('NewMapCtrl', function ($scope, $location, $filter, mapService, Map) {
  $scope.title = null;
  $scope.rectangles = [];

  mapService.startDrawing();

  this.saveMap = function () {
    var self = this;
    Map.create($scope.title, $scope.rectangles)
      .then(function (map) {
        var mapId = $filter('getResourceID')(map);
        self.reset();
        $location.path('/maps/' + mapId);
      });
  };

  this.reset = function () {
    mapService.stopDrawing();
    angular.forEach($scope.rectangles, function (rectangle) {
      rectangle.setMap(null);
    });
  };

  this.deleteRectangle = function (rectangle) {
    rectangle.setMap(null);

    var index = $scope.rectangles.indexOf(rectangle);
    $scope.rectangles.splice(index, 1);
  };
});


controllers.controller('MapsCtrl', function ($scope, Map, mapService) {
  $scope.maps = Map.query();
});


controllers.controller('MapCtrl', function ($scope, mapService) {
  var rectangles = $scope.map.getBoundsAsRectangles();

  this.showMap = function () {
    angular.forEach(rectangles, function (rectangle) {
      rectangle.setMap(mapService.map);
    });
  };

  this.hideMap = function () {
    angular.forEach(rectangles, function (rectangle) {
      rectangle.setMap(null);
    });
  };

  this.isMapVisible = function () {
    var isVisible = rectangles.length && rectangles[0].getMap();
    return !!isVisible;
  };

});
