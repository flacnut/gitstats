var Github = require('github'),
  _ = require('underscore'),
  Languages = require('./languages.json'),
  async = require('async');

var GitStats = function () {
  this.client = new Github({
    'version': '3.0.0',
    'protocol': 'https',
    'host': this.host,
    'port': 443
  });
  this.isAuthenticated = false;
};

GitStats.prototype.authenticateClient = function (token) {
  var self = this;
  if (token && token.length > 0) {
    self.client.authenticate({
      type: 'oauth',
      token: token
    });
    this.isAuthenticated = true;
  }
};

GitStats.prototype.getRepos = function (userName, pageNumber, done) {
  this.client.repos.getFromUser({
    user: userName,
    page: pageNumber,
    per_page: 50,
    direction: 'asc'
  }, function (err, repos) {
    if (err) {
      return done(err, repos);
    }

    return done(err, repos);
  });
};

GitStats.prototype.getProfile = function (userName, token, done) {
  var self = this;
  self.authenticateClient(token);
  self.client.user.getFrom({
    user: userName
  }, function (err, user) {
    return done(err, user);
  });
};

GitStats.prototype.getAllCommits = function (userName, repoName, done) {
  var self = this,
    commits = [],
    pageNumber = 0,
    hasNextPage = true;

  async.whilst(
    function () {
      return hasNextPage !== undefined;
    },
    function (wCallback) {
      self.client.repos.getCommits({
        user: userName,
        repo: repoName,
        page: pageNumber,
        per_page: 50,
        author: userName
      }, function (e, gitCommits) {
        if (e) {
          return wCallback(e);
        }

        commits = commits.concat(gitCommits);
        hasNextPage = self.client.hasNextPage(gitCommits.meta.link);
        pageNumber++;
        return wCallback();
      });
    },
    function (err) {
      console.log(repoName, '/commits/', commits.length);
      done(err, commits)
    }
  );
};

GitStats.prototype.getCommits = function (userName, repoName, done) {
  var self = this,
    repoCommitStats = {
      name: repoName,
      languages: [],
      stats: {}
    };
  async.waterfall([
    function (callback) {
      self.getAllCommits(userName, repoName, callback);
    },
    function (commits, callback) {
      //console.log('got commits for ', repoName);
      // for each commit, get the commit body.
      async.each(commits, function (commit, ic) {
          //console.log('getting commit body for repo', repoName, 'sha ', commit.sha);
          self.getCommit(userName, repoName, commit.sha,
            function (err, commit) {
              //console.log(userName, '/', repoName, '/', commit.sha);
              if (err) {
                console.log('error getting commit ', err);
                return ic(err);
              }
              _.each(commit.files, function (file) {
                if (file.filename.lastIndexOf('.') < 0) {
                  return;
                }

                var extension = file.filename.substring(file.filename.lastIndexOf('.') +
                  1);
                /*console.log(
                  extension,
                  " : ",
                  file.additions);
                  */
                if (!repoCommitStats.stats[extension]) {
                  repoCommitStats.stats[extension] = 0;
                  repoCommitStats.languages.push(extension);
                }

                repoCommitStats.stats[extension] += parseInt(file.additions, 10);
              });

              ic();

            });
        },
        callback);
    }
  ], function (err) {
    //console.log('repo ', repoName, ' stats ', repoCommitStats);
    done(err, repoCommitStats);
  });
};

GitStats.prototype.getCommit = function (userName, repoName, sha, done) {
  var self = this;
  self.client.repos.getCommit({
    user: userName,
    repo: repoName,
    sha: sha
  }, done);
};

GitStats.prototype.getAllRepos = function (userName, done) {
  var self = this,
    hasNextPage = true,
    pageNumber = 0,
    allRepos = [];

  async.whilst(
    function () {
      return hasNextPage !== undefined;
    },
    function (wCallback) {
      self.getRepos(userName, pageNumber, function (e, gitRepos) {
        if (e) {
          return wCallback(e);
        }
        hasNextPage = undefined;
        //self.client.hasNextPage(gitRepos.meta.link);
        allRepos = allRepos.concat(gitRepos);
        pageNumber++;
        wCallback();
      });
    },
    function (err) {
      done(err, allRepos);
    }
  );
};

GitStats.prototype.getRepoPageStatistics = function (userName, pageNumber, done) {
  var self = this,
    stats = [];
  async.waterfall([
      function (callback) {
        self.getAllRepos(userName, callback);
      },
      function (repos, callback) {
        console.log('got repos', repos.length);
        async.each(repos, function (repo, cb) {
          //console.log('getting commits for repo ', repo.name);
          self.getCommits(userName, repo.name, function (err, repoStats) {
            stats.push(repoStats);
            cb();
          });
        }, callback);
      }
    ],
    function (err, result) {
      if (err) {
        console.log('error ', err);
        return done(err, result);
      }
      var totalStats = self.getTotalStatsByLanguage(stats);
      return done(err, totalStats);
    });
};

GitStats.prototype.getTotalStatsByLanguage = function (stats) {
  var totalStats = {};

  _.each(stats, function (repoStats) {
    _.each(repoStats.languages, function (lang) {
      if (!totalStats[lang]) {
        totalStats[lang] = 0;
      }

      totalStats[lang] += parseInt(repoStats.stats[lang], 10);
    });
  });

  return totalStats;
};

GitStats.prototype.prepareStatsForUX = function (totalStatsByLanguage) {
  var groupedStats = [];
  for (var lang in totalStatsByLanguage) {

    if (!Languages[lang]) {
      continue;
    }

    groupedStats.push({
      language: lang,
      icon: Languages[lang],
      lines: totalStatsByLanguage[lang]
    });
  }

  groupedStats = _.sortBy(groupedStats, function (stat) {
    return parseInt(stat.lines, 10);
  }).reverse();

  return groupedStats;
};

GitStats.prototype.getStatistics = function (userName, token, done) {
  var self = this;
  self.authenticateClient(token);

  async.waterfall([
      function (callback) {
        console.log('getting repos for ', userName);
        self.getRepoPageStatistics(userName, 0, callback);
      },
      function (totalStats, callback) {
        var groupedStats = self.prepareStatsForUX(totalStats);

        callback(null, {
          stats: groupedStats
        })
    }
    ],
    done);
};

module.exports = GitStats;