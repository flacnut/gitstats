var BaseRes = require('./base_res'),
  GitClient = require('../sdk/githubClient.js'),
  async = require('async'),
  _ = require('underscore');

var AppRes = module.exports = BaseRes.extend({
  route: function (app) {
    app.get('/stats/:username', _.bind(this.all, this));
  },

  all: function (req, res) {
    var client = new GitClient(),
      user = {
        username: req.params.username
      };

    async.waterfall([
      function (callback) {
          client.getProfile(user.username, callback);
      },
      function (gitHubUser, callback) {
          user.gitUser = gitHubUser;
          client.getStatistics(user.username, callback);
      }
    ],
      function (err, stats) {
        if (err) {
          console.log('load error ', err);
          if (err.code === 403) {
            return res.render('app/error', {
              "title": "Github API Rate limit exceeded",
              "body": "Looks like we were unable to generate this report anonymously. Maybe try signing in?"
            });
          } else if (err.code === 404) {
            return res.render('app/error', {
              "title": "Unable to find user " + user.username,
              "body": "Looks like we were unable to find this user. Maybe try correcting their user name and try again.?"
            });
          }
        }
        user.properties = stats;
        res.render('app/index', user);
      });
  }
});