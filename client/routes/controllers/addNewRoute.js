angular.module("socially").controller("AddNewRouteCtrl", ['$scope', '$meteor', '$rootScope', '$state', '$mdDialog', 'routes',
  function ($scope, $meteor, $rootScope, $state, $mdDialog, routes) {
    $scope.newRoute = {};
    $scope.addNewRoute = function () {
      if($scope.newRoute.name){
        $scope.newRoute.owner = $rootScope.currentUser._id;
        routes.push($scope.newRoute);
        $scope.newRoute = '';
        $mdDialog.hide();
      }
    }
    $scope.close = function () {
      $mdDialog.hide();
    }
  }]);
