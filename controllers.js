
var controllers = angular.module('planner.controllers', []);

controllers.controller('RoutesCtrl', function ($scope, Route) {
  $scope.routes = Route.query();
});

controllers.controller('RouteCtrl', function ($scope, mapService, retrieveRouteDirections) {
  this.showRouteDetails = function () {
    console.log($scope.route);
  };
  this.showRoute = function () { mapService.addRoute($scope.route); };
  this.hideRoute = function () { mapService.removeRoute($scope.route); };
  this.isRouteOnMap = function () { return mapService.isRouteOnMap($scope.route); };

  this.deleteRoute = function () {
    var routeName = $scope.route.name || "Unnamed route";
    if (confirm("Delete \"" + routeName + "\"?")) {
      $scope.route.destroy(function () {
        $scope.routes.splice($scope.routes.indexOf($scope.route), 1);
      });
    }
  };

  // Editing-related logic

  $scope.isEditingMode = false;

  this.editRoute = function () {
    $scope.isEditingMode = true;
    $scope.edited = angular.copy($scope.route);
  };
  this.saveRoute = function () {
    $scope.isEditingMode = false;
    angular.extend($scope.route, $scope.edited);
    $scope.route.$save();
  };
  this.cancelEditing = function () {
    $scope.isEditingMode = false;
  };
});

controllers.controller('NewRouteFormCtrl', function ($scope, mapService, Route) {
  $scope.route;

  var directionsRenderer;



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
    if (!waypoints) {
      console.debug("No waypoints");
      return;
    }
    console.log("updateWaypoints", waypoints);
    $scope.$apply(function () {
      $scope.route.waypoints = waypoints;
    });
  };

  this.showRoute = function (route) {
    var waypoints = [];
    angular.forEach(route.waypoints, function (waypoint) {
      if (!waypoint.location) {
        return;
      }
      this.push({location: waypoint.location, stopover: waypoint.stopover});
    }, waypoints);
    route.waypoints = waypoints;

    resetDirectionsRenderer();
    mapService.renderRoute(route, directionsRenderer).then(function () {
      google.maps.event.addListener(directionsRenderer, 'directions_changed', updateWaypoints);
    });
  };

  this.addWaypoint = function (route) {
    route.waypoints.push({location: '', stopover: false});
  };

  this.saveRoute = function (route) {
    route.name = "From " + route.origin + " to " + route.destination;
    route.updateFromDirectionsResult(directionsRenderer.getDirections());
    route.$save(function (route) { $scope.routes.push(route); });

    this.reset();
  };

  this.reset();
});
