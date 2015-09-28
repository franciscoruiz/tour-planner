Routes = new Mongo.Collection("routes");

Routes.allow({
  insert: function (userId, route) {
    return userId && route.owner === userId;
  },
  update: function (userId, route, fields, modifier) {
    return userId && route.owner === userId;
  },
  remove: function (userId, route) {
    return userId && route.owner === userId;
  }
});
