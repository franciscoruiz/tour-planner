angular.module("socially").controller("ResetCtrl", ['$meteor', '$state',
  function ($meteor, $state) {
    var vm = this;

    vm.credentials = {
      email: ''
    };

    vm.error = '';

    vm.reset = function () {
      $meteor.forgotPassword(vm.credentials.email).then(
        function () {
          $state.go('routes');
        },
        function (err) {
          vm.error = 'Error sending forgot password email - ' + err;
        }
      );
    };
  }
]);
