const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'test/data'), {
  setHeaders: function (res) {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('http://%s:%s', host, port);
});
module.exports = app;
