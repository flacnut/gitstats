var BaseRes = require('./base_res'),
  GitClient = require('../sdk/githubClient.js'),
  _ = require('underscore');

var AppRes = module.exports = BaseRes.extend({
  route: function (app) {
    app.get('/stats/:username', _.bind(this.all, this));
  },

  all: function (req, res) {
    var client = new GitClient(),
      stats = client.getStatistics(),
      user = {
        username : req.params.username,
        properties : stats
      };

    res.render('app/index', user);
  }
});
