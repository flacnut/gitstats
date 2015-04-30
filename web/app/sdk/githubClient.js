var Github = require('github'),
  _ = require('underscore'),
  async = require('async');

var GitStats = function () {
  this.client = new Github({
    'version': '3.0.0',
    'protocol': 'https',
    'host': this.host,
    'port': 443
  });
  // 30ef8d7370f7c559c6fba671a386398abba3212c
  this.client.authenticate({
    type: 'oauth',
    token: '30ef8d7370f7c559c6fba671a386398abba3212c'
  });
};

GitStats.prototype.getRepos = function (userName, pageNumber, done) {
  this.client.repos.getFromUser({
    user: userName,
    page: pageNumber,
    per_page: 10,
    direction: 'asc'
  }, function (err, repos) {
    if (err) {
      return done(err, repos);
    }

    return done(err, repos);
  });
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
      self.client.repos.getCommits({
        user: userName,
        repo: repoName,
        author: userName
      }, callback);
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

GitStats.prototype.getStatistics = function (userName, done) {
  var self = this,
    stats = [];

  async.waterfall([
      function (callback) {
        //console.log('getting repos for ', userName);
        self.getRepos(userName, 0, callback);
      },
      function (repos, callback) {
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

      var totalStats = {

        },
        groupedStats = [];


      _.each(stats, function (repoStats) {
        _.each(repoStats.languages, function (lang) {
          if (!totalStats[lang]) {
            totalStats[lang] = 0;
          }

          totalStats[lang] += parseInt(repoStats.stats[lang], 10);
        });
      });

      for (var lang in totalStats) {
        groupedStats.push({
          language : lang,
          lines : totalStats[lang]
        });
      }
      console.log(groupedStats);
      done(err, { stats : groupedStats});
    });

  return {
    stats: [{
      extension: "js",
      lines: 12567
        }, {
      extension: "cs",
      lines: 125
        }]
  };
};

module.exports = GitStats;
