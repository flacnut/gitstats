var klass = require('klass'),
  BaseRes = require('./base_res'),
  _ = require('underscore'),
  passport = require('passport'),
  GitHubStrategy = require('passport-github').Strategy;

var GithubRes = module.exports = BaseRes.extend({
  // constructor
}).methods({
  route: function (app) {

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (user, done) {
      done(null, user);
    });

    var settings = this.getSettings(),
      self = this;
    console.log('settings are ', settings);
    // Use the GitHubStrategy within Passport.
    //   Strategies in Passport require a `verify` function, which accept
    //   credentials (in this case, an accessToken, refreshToken, and GitHub
    //   profile), and invoke a callback with a user object.
    passport.use(new GitHubStrategy({
      clientID: settings.Github.clientID,
      clientSecret: settings.Github.clientSecret,
      callbackURL: settings.Github.authCallbackUri
    }, self.onAuthenticated));

    // GET /auth/github
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in GitHub authentication will involve redirecting
    //   the user to github.com.  After authorization, GitHub will redirect the user
    //   back to this application at /auth/github/callback
    app.get('/auth/github', passport.authenticate('github', {
      scope: 'repo'
    }), this.nullFunction);

    app.get('/auth/github/callback',
      passport.authenticate('github', {
        failureRedirect: '/'
      }), self.onSuccess);
  },

  onAuthenticated: function (accessToken, refreshToken, profile, done) {
    var context = {
      token: accessToken,
      profile: profile
    };
    return done(null, context);
  },

  onSuccess: function (req, res) {
    debugger;
    res.redirect('/stats/' + req.user.profile.username);
  },

  nullFunction: function (req, res) {

  },

  getSettings: function () {
    return require('../../settings.json');
  }
});
