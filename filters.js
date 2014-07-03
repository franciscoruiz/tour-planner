
var filters = angular.module('planner.filters', []);

// Routes


filters.filter('displayDistance', function () {
  return function (meters) {
    var distanceText;
    if (meters < 1000) {
      distanceText = meters.toString() + 'm';
    } else {
      var kilometers = meters / 1000;
      distanceText = kilometers.toString() + 'km';
    }
    return distanceText;
  };
});


filters.filter('displayDuration', function () {
  return function (seconds) {
    var hours = Math.round(seconds / 3600);
    var minutes = Math.round((seconds % 3600) / 60);
    return '' + hours + 'h ' + minutes + 'm';
  };
});


filters.filter('getStepsDistance', function ($filter) {
  return function (steps) {
    var distance = 0;
    angular.forEach(steps, function (step) {
      distance += step.distance;
    });
    return distance;
  };
});


filters.filter('getStepsDuration', function ($filter) {
  return function (steps) {
    var duration = 0;
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


filters.filter('getRouteSteps', function () {
  return function (route) {
    var steps = route.legs.reduce(function (a, b) { return a.concat(b.steps); }, []);
    return steps;
  };
});


// Generic


filters.filter('getResourceID', function () {
  return function (resource) {
    return resource._id.$oid;
  };
});
