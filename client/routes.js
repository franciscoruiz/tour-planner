angular.module("socially").run(["$rootScope", "$location", function($rootScope, $state) {
  $rootScope.$on("$stateChangeError", function(event, next, previous, error) {
    // We can catch the error thrown when the $requireUser promise is rejected
    // and redirect the user back to the main page
    if (error === "AUTH_REQUIRED") {
      $state.go("/routes");
    }
  });
}]);

angular.module("socially").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $stateProvider
      .state('routes', {
        url: '/routes',
        templateUrl: 'client/routes/views/routes-list.ng.html',
        controller: 'RoutesListCtrl'
      })
      .state('routeDetails', {
        url: '/routes/:routeId',
        templateUrl: 'client/routes/views/route-details.ng.html',
        controller: 'RouteDetailsCtrl',
        resolve: {
          "currentUser": ["$meteor", function($meteor){
            return $meteor.requireUser();
          }]
        }
      })
      .state('login', {
        url: '/login',
        templateUrl: 'client/users/views/login.ng.html',
        controller: 'LoginCtrl',
        controllerAs: 'lc'
      })
      .state('register',{
        url: '/register',
        templateUrl: 'client/users/views/register.ng.html',
        controller: 'RegisterCtrl',
        controllerAs: 'rc'
      })
      .state('resetpw', {
        url: '/resetpw',
        templateUrl: 'client/users/views/reset-password.ng.html',
        controller: 'ResetCtrl',
        controllerAs: 'rpc'
      })
      .state('logout', {
        url: '/logout',
        resolve: {
          "logout": ['$meteor', '$state', function($meteor, $state) {
            return $meteor.logout().then(function(){
              $state.go('routes');
            }, function(err){
              console.log('logout error - ', err);
            });
          }]
        }
      });

    $urlRouterProvider.otherwise("/routes");
  }]);
