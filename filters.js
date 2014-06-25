
var filters = angular.module('planner.filters', []);

filters.filter('displayDistance', function () {
  return function (meters) {
    return '' + meters / 1000 + 'km';
  };
});


filters.filter('displayDuration', function () {
  return function (seconds) {
    var hours = Math.round(seconds / 3600);
    var minutes = Math.round((seconds % 3600) / 60);
    return '' + hours + 'h ' + minutes + 'm';
  };
});


filters.filter('getRouteDistance', function ($filter) {
  return function (route) {
    var distance = 0;
    var steps = $filter('getRouteSteps')(route);
    angular.forEach(steps, function (step) {
      distance += step.distance;
    });
    return distance;
  };
});


filters.filter('getRouteDuration', function ($filter) {
  return function (route) {
    var duration = 0;
    var steps = $filter('getRouteSteps')(route);
    angular.forEach(steps, function (step) {
      duration += step.duration;
    });
    return duration;
  };
});


filters.filter('htmlToText', function () {
  return function (instructions) {
    return String(instructions).replace(/<[^>]+>/gm, '');
  };
});


filters.filter('getRouteId', function () {
  return function (route) {
    return route._id.$oid;
  };
});


filters.filter('getRouteSteps', function () {
  return function (route) {
    return route.legs[0].steps;
  };
});
