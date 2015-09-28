angular.module("socially").controller("RoutesListCtrl", ['$scope', '$meteor', '$rootScope', '$state', '$mdDialog',
  function($scope, $meteor, $rootScope, $state, $mdDialog){

    $scope.sort = { name: 1 };
    $scope.orderProperty = '1';

    $scope.users = $meteor.collection(Meteor.users, false).subscribe('users');

    $scope.routes = $meteor.collection(function() {
      return Routes.find({}, {
        sort : $scope.getReactively('sort')
      });
    });

    $meteor.autorun($scope, function() {
      $meteor.subscribe('routes',
        {sort: $scope.getReactively('sort')},
        $scope.getReactively('search')
      ).then(function() {
        $scope.routes.forEach( function (route) {
          route.onClicked = function () {
            $state.go('routeDetails', {routeId: route._id});
          };
        });

        var styles1 = [{
          "featureType": "landscape.natural",
          "elementType": "geometry.fill",
          "stylers": [{"visibility": "on"}, {"color": "#e0efef"}]
        }, {
          "featureType": "poi",
          "elementType": "geometry.fill",
          "stylers": [{"visibility": "on"}, {"hue": "#1900ff"}, {"color": "#c0e8e8"}]
        }, {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{"lightness": 100}, {"visibility": "simplified"}]
        }, {
          "featureType": "road",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [{"visibility": "on"}, {"lightness": 700}]
        }, {"featureType": "water", "elementType": "all", "stylers": [{"color": "#7dcdcd"}]}];
        var styles2 = [{
          "featureType": "administrative",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#444444"}]
        }, {
          "featureType": "landscape",
          "elementType": "all",
          "stylers": [{"color": "#f2f2f2"}]
        }, {
          "featureType": "poi",
          "elementType": "all",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "road",
          "elementType": "all",
          "stylers": [{"saturation": -100}, {"lightness": 45}]
        }, {
          "featureType": "road.highway",
          "elementType": "all",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "road.arterial",
          "elementType": "labels.icon",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "transit",
          "elementType": "all",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "water",
          "elementType": "all",
          "stylers": [{"color": "#46bcec"}, {"visibility": "on"}]
        }];


        $scope.map = {
          center: {
            latitude: 45,
            longitude: -73
          },
          options: {
            styles: styles2,
            maxZoom: 10
          },
          zoom: 8
        };
      });
    });

    $scope.remove = function(route){
      $scope.routes.splice( $scope.routes.indexOf(route), 1 );
    };

    $scope.$watch('orderProperty', function(){
      if ($scope.orderProperty)
        $scope.sort = {name: parseInt($scope.orderProperty)};
    });

    $scope.getUserById = function(userId){
      return Meteor.users.findOne(userId);
    };

    $scope.creator = function(route){
      if (!route)
        return;
      var owner = $scope.getUserById(route.owner);
      if (!owner)
        return "nobody";

      if ($rootScope.currentUser)
        if ($rootScope.currentUser._id)
          if (owner._id === $rootScope.currentUser._id)
            return "me";

      return owner;
    };

    $scope.openAddNewRouteModal = function(){
      $mdDialog.show({
        controller: 'AddNewRouteCtrl',
        templateUrl: 'client/routes/views/add-new-route-modal.ng.html',
        clickOutsideToClose:true,
        resolve: {
          routes: function () {
            return $scope.routes;
          }
        }
      })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
        });
    };
  }]);
