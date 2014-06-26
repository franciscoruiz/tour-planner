
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


controllers.controller('RouteCtrl', function ($scope, $log, $location, mapService, Route, retrieveRouteDirections) {
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


controllers.controller('RouteEditCtrl', function ($scope, $log, $route, mapService, Route, retrieveRouteDirections) {
  var currentRouteId = $route.current.params.route;

  $scope.route = Route.$get({_id: {$oid: currentRouteId}})

  this.editRoute = function () {
    $scope.isEditingMode = true;
    $scope.edited = angular.copy($scope.route);
  };
  this.saveRoute = function () {
    $scope.isEditingMode = false;
    angular.extend($scope.route, $scope.edited);
    $scope.route.update();
  };
  this.cancelEditing = function () {
    $scope.isEditingMode = false;
  };
});


controllers.controller('NewRouteCtrl', function ($scope, $location, $filter, mapService, Route) {
  $scope.route;

  var directionsRenderer;

  mapService.addEventListener('rightclick', function (event) {
    $scope.$apply(function () {
      if ($scope.route.origin === null) {
        $scope.route.origin = event.latLng;
      } else if ($scope.route.destination === null) {
        $scope.route.destination = event.latLng;
      } else {
        $scope.route.waypoints.push({location: event.latLng, stopover: false});
      }
    });
  });

  this.reset = function () {
    resetDirectionsRenderer();
    $scope.route = new Route({origin: null, destination: null, waypoints: []});
  };

  var resetDirectionsRenderer = function () {
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }
    directionsRenderer = new google.maps.DirectionsRenderer({draggable: true});
  };

  var updateWaypoints = function () {
    var waypoints = [];
    angular.forEach(
      directionsRenderer.directions.Tb.waypoints,
      function (waypoint) {
        waypoints.push({location: waypoint.location, stopover: false});
      }
    );
    $scope.$apply(function () {
      $scope.route.waypoints = waypoints;
    });
  };

  this.showRoute = function () {
    var waypoints = [];
    angular.forEach($scope.route.waypoints, function (waypoint) {
      if (!waypoint.location) {
        return;
      }
      this.push({location: waypoint.location, stopover: waypoint.stopover});
    }, waypoints);
    $scope.route.waypoints = waypoints;

    resetDirectionsRenderer();
    mapService.renderRoute($scope.route, directionsRenderer).then(function () {
      google.maps.event.addListener(directionsRenderer, 'directions_changed', updateWaypoints);
    });
  };

  this.addWaypoint = function () {
    $scope.route.waypoints.push({location: '', stopover: false});
  };

  this.saveRoute = function () {
    $scope.route.updateFromDirectionsResult(directionsRenderer.getDirections());
    $scope.route.name = "From " + $scope.route.origin + " to " + $scope.route.destination;
    $scope.route.$save(function (route) {
      var routeId = $filter('getRouteId')(route);
      $location.path('/routes/' + routeId);
    });

    this.reset();
  };

  this.reset();
});
