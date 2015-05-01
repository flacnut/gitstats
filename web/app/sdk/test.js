var G = require('./githubClient.js'),
  c = new G();

c.getProfile('phanatic', function (e, u) {
  console.log(e, u);
});