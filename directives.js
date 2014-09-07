var directives = angular.module('planner.directives', []);


directives.directive('menu', function ($window, $log) {
  var link = function (scope, element, attrs) {
    var windowHeight = $window.innerHeight;
    element.css('max-height', windowHeight + 'px');
    $log.debug('Limited menu height to %spx', windowHeight);
  };

  return {link: link};
});
