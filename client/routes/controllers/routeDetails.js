angular.module("socially").controller("RouteDetailsCtrl", ['$scope', '$stateParams', '$meteor',
  function ($scope, $stateParams, $meteor) {

    $scope.route = $meteor.object(Routes, $stateParams.routeId);

    var subscriptionHandle;
    $meteor.subscribe('routes').then(function (handle) {
      subscriptionHandle = handle;
    });

    $scope.users = $meteor.collection(Meteor.users, false).subscribe('users');

    $scope.$on('$destroy', function () {
      subscriptionHandle.stop();
    });

    $scope.map = {
      center: {
        latitude: 45,
        longitude: -73
      },
      zoom: 8,
      events: {
        click: function (mapModel, eventName, originalEventArgs) {
          if (!$scope.route)
            return;

          if (!$scope.route.location)
            $scope.route.location = {};

          $scope.route.location.latitude = originalEventArgs[0].latLng.lat();
          $scope.route.location.longitude = originalEventArgs[0].latLng.lng();
          //scope apply required because this event handler is outside of the angular domain
          $scope.$apply();
        }
      },
      marker: {
        options: {draggable: true},
        events: {
          dragend: function (marker, eventName, args) {
            if (!$scope.route.location)
              $scope.route.location = {};

            $scope.route.location.latitude = marker.getPosition().lat();
            $scope.route.location.longitude = marker.getPosition().lng();
          }
        }
      }
    };

  }]);
