var Github = require('github');

module.exports = function () {
  this.getRepos = function (userName) {

  };

  this.getCommits = function (userName, repoName) {

  };

  this.getCommit = function (userName, repoName, commit) {

  };

  this.getStatistics = function ()
  {
    return {
      stats : [
        {
          extension : "js",
          lines : 12567
        },
        {
          extension : "cs",
          lines : 125
        }
      ]
    };
  };
};
