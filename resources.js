angular.module('planner.resources', ['ngResource']).
  factory('Route', function ($resource) {
    var Route = $resource(
      'https://api.mongolab.com/api/1/databases/tour-planner/collections/routes/:id',
      { apiKey: SETTINGS.MONGODB_API_KEY },
      { update: { method: 'PUT' } }
    );

    Route.prototype.update = function (callback) {
      return Route.update(
        {id: this._id.$oid},
        angular.extend({}, this, {_id: undefined}),
        callback
      );
    };

    Route.prototype.destroy = function (callback) {
      return Route.remove({id: this._id.$oid}, callback);
    };

    return Route;
  });
