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

  return Route;
});


resources.factory('Point', function ($resource) {
  var Point = $resource(
    'https://api.mongolab.com/api/1/databases/tour-planner/collections/points/:id',
    { apiKey: SETTINGS.MONGOLAB_API_KEY },
    { update: { method: 'PUT' } }
  );

  Point.create = function (location) {
    var point = new Point({location: location});
    return point.$save();
  };

  Point.prototype.update = function (callback) {
    return Point.update(
      {id: this._id.$oid},
      angular.extend({}, this, {_id: undefined}),
      callback
    );
  };

  return Point;
});


resources.factory('Map', function ($resource) {
  var Map = $resource(
    'https://api.mongolab.com/api/1/databases/tour-planner/collections/maps/:id',
    { apiKey: SETTINGS.MONGOLAB_API_KEY },
    { update: { method: 'PUT' } }
  );

  Map.create = function (title, rectangles) {
    var bounds = [];
    angular.forEach(rectangles, function (rectangle) {
      bounds.push(convertBoundsToJSON(rectangle.getBounds()));
    });
    var map = new Map({title: title, bounds: bounds});
    return map.$save();
  };

  Map.prototype.update = function (callback) {
    return Map.update(
      {id: this._id.$oid},
      angular.extend({}, this, {_id: undefined}),
      callback
    );
  };

  Map.prototype.destroy = function (callback) {
    return Map.remove({id: this._id.$oid}, callback);
  };

  Map.prototype.getBoundsAsRectangles = function () {
    var rectangles = [];
    angular.forEach(this.bounds, function (bound) {
      var rectangle = new google.maps.Rectangle({
        bounds: convertJSONToBounds(bound)
      });
      rectangles.push(rectangle);
    });
    return rectangles;
  };

  return Map;
});


resources.factory('KmlLayer', function ($resource) {
  var KmlLayer = $resource(
    'https://api.mongolab.com/api/1/databases/tour-planner/collections/kml-layers/:id',
    { apiKey: SETTINGS.MONGOLAB_API_KEY },
    { update: { method: 'PUT' } }
  );

  return KmlLayer;
});


/*
 * Utilities
 */
var convertBoundsToJSON = function (bounds) {
  return {
    northEast: convertLatLngToJSON(bounds.getNorthEast()),
    southWest: convertLatLngToJSON(bounds.getSouthWest())
  };
};

var convertJSONToBounds = function (boundsJSON) {
  var bounds = new google.maps.LatLngBounds(
    convertJSONToLatLng(boundsJSON.southWest),
    convertJSONToLatLng(boundsJSON.northEast)
  );
  return bounds;
};

var convertLatLngToJSON = function (latLng) {
  var jsonValue;
  if (latLng instanceof google.maps.LatLng) {
    jsonValue = {lat: latLng.lat(), lng: latLng.lng()};
  } else {
    jsonValue = latLng;
  }
  return jsonValue;
};

var convertJSONToLatLng = function (latLngJSON) {
  var latLng = new google.maps.LatLng(latLngJSON.lat, latLngJSON.lng);
  return latLng;
};

var filterObjectKeys = function (obj, keys) {
  angular.forEach(obj, function (value, key) {
    if (keys.indexOf(key) === -1) {
      delete obj[key];
    }
  });
  return obj;
};
