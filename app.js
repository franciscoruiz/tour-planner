angular.module('planner', [
  'ngRoute',
  'planner.resources',
  'planner.controllers',
  'planner.filters',
  'map.services'
]).config(function ($routeProvider) {
  $routeProvider
    .when('/routes/', {
      templateUrl: 'templates/routes.html',
      controller: 'RoutesCtrl'
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
    })
    .otherwise({redirectTo: '/routes/'});
});
