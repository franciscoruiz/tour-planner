Meteor.publish("routes", function (options, searchString) {
  if (searchString == null) {
    searchString = '';
  }

  return Routes.find({
    'name' : { '$regex' : '.*' + searchString || '' + '.*', '$options' : 'i' },
    $or:[
      {$and:[
        {owner: this.userId},
        {owner: {$exists: true}}
      ]}
    ]}, options);
});
