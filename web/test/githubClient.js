var rewire = require('rewire'),
  sinon = require('sinon'),
  should = require('should'),
  GithubClient = rewire('../app/sdk/githubClient');

describe("github client tests", function (done) {
  it("can authenticate client", function () {
    var mockGitClient = {
      authenticate: sinon.stub()
    };

    GithubClient.__set__({
      'Github': sinon.stub().returns(mockGitClient)
    });

    var client = new GithubClient();
    client.authenticateClient('my-token');
    mockGitClient.authenticate.calledOnce.should.be.true;
    client.isAuthenticated.should.be.true;
  });

  it("does not authenticate if token is empty", function () {
    var mockGitClient = {
      authenticate: sinon.stub()
    };

    GithubClient.__set__({
      'Github': sinon.stub().returns(mockGitClient)
    });

    var client = new GithubClient();
    client.authenticateClient('');
    mockGitClient.authenticate.calledOnce.should.be.false;
    client.isAuthenticated.should.be.false;
  });

  it("Can get repos for user", function (done) {
    var mockGitClient = {
      repos: {
        getFromUser: sinon.stub().callsArgWith(1, null, [])
      }
    };

    GithubClient.__set__({
      'Github': sinon.stub().returns(mockGitClient)
    });

    var client = new GithubClient();
    client.getRepos('phanatic', 7, function (err, repos) {
      mockGitClient.repos.getFromUser.calledWith({
        user: 'phanatic',
        page: 7,
        per_page: 50,
        direction: 'asc'
      }).should.be.true;
      done();
    });
  });

  it("Can add up language stats across repos", function () {
    var stats = [
      {
        name: 'node-env',
        languages: ['js', 'c#'],
        stats: {
          'js': 15,
          'c#': 17
        }
      },
      {
        name: 'php-env',
        languages: ['js', 'c#'],
        stats: {
          'js': 15,
          'c#': 17
        }
      }];

    var client = new GithubClient(),
      statsByLanguage = client.getTotalStatsByLanguage(stats);
    statsByLanguage['js'].should.be.equal(30);
    statsByLanguage['c#'].should.be.equal(34);
  });

  it("Can group statistics for display", function () {
    var statsByLanguage = {
        js: 30,
        'cs': 34
      },
      client = new GithubClient(),
      stats = client.prepareStatsForUX(statsByLanguage);
      
    stats[0].language.should.be.equal('cs');
    stats[0].lines.should.be.equal(34);
  });
});
