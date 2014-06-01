
angular.module('planner.map', [])
  .controller('RoutesCtrl', ['$scope', 'Route', function ($scope, Route) {
    $scope.routes = Route.query();

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
    $scope.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    var showRoute = function (route) {
      if (isRouteShown(route)) {
        return;
      }

      var routeRenderer = getRouteRenderer(route);
      var directions = routeRenderer.getDirections();
      if (!directions || !directions.routes) {
        retrieveRouteDirections(route, routeRenderer, function () {
          showRoute(route);
        });

      } else {
        routeRenderer.setMap($scope.map); 
      }
    };

    var hideRoute = function (route) {
      if (!isRouteShown(route)) {
        return;
      }
      var routeRenderer = getRouteRenderer(route);
      routeRenderer.setMap(null);
    };

    var isRouteShown = function (route) {
      return route.renderer && route.renderer.getMap();
    };

    var getRouteRenderer = function (route) {
      var routeRenderer = route.renderer;
      if (angular.isUndefined(routeRenderer)) {
        routeRenderer = new google.maps.DirectionsRenderer({preserveViewport: true});
        route.renderer = routeRenderer;
      }
      return routeRenderer;
    };

    var retrieveRouteDirections = function (route, routeRenderer, callback) {
      var request = {
        origin: route.origin,
        destination: route.destination,
        waypoints: route.waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING
      };
      
      var directionsService = new google.maps.DirectionsService();  
      directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          routeRenderer.setDirections(response);
          callback.call();

        } else {
          console.log(status, route);
        }
      });
    };

    $scope.showRoute = showRoute;
    $scope.hideRoute = hideRoute;
    $scope.isRouteShown = isRouteShown;
    $scope.getRouteRenderer = getRouteRenderer;
    $scope.retrieveRouteDirections = retrieveRouteDirections;
    
  }])
  .controller('RouteCtrl', ['$scope', function ($scope) {

    var showRouteDetails = function (route) {
      var routeRenderer = $scope.getRouteRenderer(route);
      // renderer.setPanel(document.getElementById('directionsSummaryPanel'));

      var directions = routeRenderer.getDirections();
      if (!routeRenderer.getDirections()) {
        $scope.retrieveRouteDirections(route, routeRenderer, function () {
          showRouteDetails(route);
        });
        return;
      }

      if (directions.routes.length !== 1) {
        console.error('More than one route retrieved');
        return;
      }

      var routeLegs = directions.routes[0].legs;
      var routeDuration, routeDuration = 0;
      for (var i = 0; i < routeLegs.length; i++) {
        routeDuration = routeLegs[i].duration.value;
        routeDistance = routeLegs[i].distance.value;
      }
      console.log(
        'Duration: %ss\nDistance: %sm\nWarnings: %s',
        routeDuration,
        routeDistance,
        route.warnings || 'N/A'
      );
    };

    $scope.showRouteDetails = showRouteDetails;

  }])
  .controller('NewRouteFormCtrl', ['$scope', function ($scope) {
    $scope.route = {};

    var directionsRenderer = new google.maps.DirectionsRenderer({draggable: true});
    google.maps.event.addListener(directionsRenderer, 'directions_changed', updateWaypoints);

    var updateWaypoints = function () {
      $scope.$apply(function () {
        $scope.route.waypoints = [];
        var waypoints = directionsRenderer.directions.Tb.waypoints;
        if (!waypoints) {
          console.debug("No waypoints");
          return;
        }
        angular.forEach(waypoints, function (waypoint) {
          var location;
          if (angular.isUndefined(waypoint.location.k)) {
            location = waypoint.location;
          } else {
            location = new google.maps.LatLng(waypoint.location.k, waypoint.location.A);
          }
          this.push({location: location, stopover: false});
        }, $scope.route.waypoints);
        console.debug($scope.route.waypoints);
      });
    };

    var calculateRoute = function () {
      var waypoints = [];
      angular.forEach($scope.route.waypoints, function (waypoint) {
        if (!waypoint.location) {
          return;
        }
        this.push({
          location: waypoint.location,
          stopover: waypoint.stopover
        });
      }, waypoints);

      directionsRenderer.setMap(null);
      directionsRenderer = new google.maps.DirectionsRenderer({draggable: true});
      google.maps.event.addListener(directionsRenderer, 'directions_changed', updateWaypoints);
      
      var route = {
        origin: $scope.route.origin,
        destination: $scope.route.destination,
        waypoints: waypoints,
        renderer: directionsRenderer
      };

      console.log(route);
      $scope.showRoute(route);
    };

    var addWaypoint = function () {
      $scope.route.waypoints.push({location: '', stopover: false});
    };

    $scope.calculateRoute = calculateRoute;
    $scope.addWaypoint = addWaypoint;
    $scope.waypoints = [];
  }]);
