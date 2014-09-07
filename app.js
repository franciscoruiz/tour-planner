angular.module('planner', [
  'ngRoute',
  'planner.resources',
  'planner.controllers',
  'planner.filters',
  'planner.directives',
  'map.services'
]).config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'templates/index.html',
      controller: 'IndexCtrl',
      controllerAs: 'indexCtrl'
    })
    .when('/new-route/', {
      templateUrl: 'templates/route-creation.html',
      controller: 'NewRouteCtrl',
      controllerAs: 'newRouteCtrl'
    })
    .when('/routes/:route/', {
      templateUrl: 'templates/route.html',
      controller: 'RouteViewCtrl'
    })
    .when('/routes/:route/edit/', {
      templateUrl: 'templates/route-editing.html',
      controller: 'RouteViewCtrl'
    });

  $routeProvider
    .when('/new-map/', {
      templateUrl: 'templates/map-creation.html',
      controller: 'NewMapCtrl',
      controllerAs: 'newMapCtrl'
    })
    .when('/maps/', {
      templateUrl: 'templates/maps.html',
      controller: 'MapsCtrl',
      controllerAs: 'mapsCtrl'
    });

  $routeProvider.otherwise({redirectTo: '/'});
});
