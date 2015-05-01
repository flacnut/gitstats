var BaseRes = require('./base_res'),
  GitClient = require('../sdk/githubClient.js'),
  async = require('async'),
  _ = require('underscore');

var AppRes = module.exports = BaseRes.extend({
  route: function (app) {

    app.get('/', _.bind(this.home, this));
    app.get('/stats/:username', _.bind(this.all, this));
  },

  home: function (req, res) {
    res.render('app/home');
  },

  all: function (req, res) {
    var client = new GitClient(),
      user = {
        gitUser: {},
        properties: {
          stats: []
        },
        username: req.params.username
      },
      token = '';

    user.isAuthenticated = false;
    if (req.isAuthenticated()) {
      console.log('user ', username, 'is authenticated');
      user.isAuthenticated = true;
      token = req.user.token;
    } else {
      return res.render('app/index', user);
    }

    async.waterfall([
      function (callback) {
          client.getProfile(user.username, token, callback);
      },
      function (gitHubUser, callback) {
          user.gitUser = gitHubUser;
          client.getStatistics(user.username, token, callback);
      }
    ],
      function (err, stats) {
        if (err) {
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