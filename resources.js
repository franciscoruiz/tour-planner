var resources = angular.module('planner.resources', ['ngResource']);

resources.factory('Route', function ($resource) {
  var Route = $resource(
    'https://api.mongolab.com/api/1/databases/tour-planner/collections/routes/:id',
    { apiKey: SETTINGS.MONGOLAB_API_KEY },
    { update: { method: 'PUT' } }
  );

  Route.prototype.update = function (callback) {
    return Route.update(
      {id: this._id.$oid},
      angular.extend({}, this, {_id: undefined}),
      callback
    );
  };

  Route.prototype.updateFromDirectionsResult = function (directionsResult) {
    if (directionsResult.routes.length > 1) {
      throw new Exception('More than one route retrieved');
    }

    var routeDetails = directionsResult.routes[0];
    angular.forEach(this.waypoints, function (waypoint) {
      filterObjectKeys(waypoint, ['location', 'stopover']);
      waypoint.location = convertLatLngToJSON(waypoint.location);
    });

    this.bounds = convertBoundsToJSON(routeDetails.bounds);

    this.legs = [];
    angular.forEach(routeDetails.legs, function (leg) {
      var legData = {
        distance: leg.distance.value,
        duration: leg.duration.value,
        start_address: leg.start_address,
        end_address: leg.end_address,
        start_location: convertLatLngToJSON(leg.start_location),
        end_location: convertLatLngToJSON(leg.end_location),
        steps: []
      };

      angular.forEach(leg.steps, function (step) {
        var stepData = {
          distance: step.distance.value,
          duration: step.duration.value,
          start_location: convertLatLngToJSON(step.start_location),
          end_location: convertLatLngToJSON(step.end_location),
          maneuver: step.maneuver,
          instructions: step.instructions,
          travel_mode: step.travel_mode
        };
        this.push(stepData);
      }, legData.steps);

      this.push(legData);
    }, this.legs);

    var firstLeg = this.legs[0];
    var lastLeg = this.legs.slice(-1)[0];
    this.origin = firstLeg.start_address || firstLeg.start_location;
    this.destination = lastLeg.end_address || lastLeg.end_location;
  };

  Route.prototype.destroy = function (callback) {
    return Route.remove({id: this._id.$oid}, callback);
  };

  var convertBoundsToJSON = function (bounds) {
    return {
      northEast: convertLatLngToJSON(bounds.getNorthEast()),
      southWest: convertLatLngToJSON(bounds.getSouthWest())
    };
  };

  var convertLatLngToJSON = function (latLng) {
    return {lat: latLng.lat(), lng: latLng.lng()};
  };

  var filterObjectKeys = function (obj, keys) {
    angular.forEach(obj, function (value, key) {
      if (keys.indexOf(key) === -1) {
        delete obj[key];
      }
    });
    return obj;
  };

  return Route;
});
