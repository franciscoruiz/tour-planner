
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


filters.filter('htmlToText', function () {
  return function (instructions) {
    return String(instructions).replace(/<[^>]+>/gm, '');
  };
});
