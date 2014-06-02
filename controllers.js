
var controllers = angular.module('planner.controllers', []);

controllers.controller('RoutesCtrl', function ($scope, Route) {
  $scope.routes = Route.query();
});

controllers.controller('RouteCtrl', function ($scope, mapService, retrieveRouteDirections) {
  this.showRouteDetails = function (route) {
    console.log(route);
  };
  this.showRoute = function (route) { mapService.addRoute(route); };
  this.hideRoute = function (route) { mapService.removeRoute(route); };
  this.isRouteOnMap = function (route) { return mapService.isRouteOnMap(route); };

  this.deleteRoute = function (route) {
    var routeName = route.name || "Unnamed route";
    if (confirm("Delete \"" + routeName + "\"?")) {
      route.destroy();
    }
  };
});

controllers.controller('NewRouteFormCtrl', function ($scope, mapService, Route) {
  $scope.route = new Route({origin: null, destination: null, waypoints: []});

  var directionsRenderer = null;

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

    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }
    directionsRenderer = new google.maps.DirectionsRenderer({draggable: true});
    mapService.renderRoute(route, directionsRenderer).then(function () {
      google.maps.event.addListener(directionsRenderer, 'directions_changed', updateWaypoints);
    });
  };

  this.addWaypoint = function (route) {
    route.waypoints.push({location: '', stopover: false});
  };

  this.saveRoute = function (route) {
    route.name = "From " + route.origin + " to " + route.destination;
    route.$save();
  };
});
