const express = require('express');
const request = require('superagent');
const redis = require('redis');
const access_token = `???`

const insta_endpoint = ``

// Set port
const port = 3000;

// // Redis client
let client = redis.createClient();

client.on('connect', function () {
  console.log('Connected to Redis...')
})

// Init app
const app = express();

function respond(username, follows, followed_by) {
  return `User "${username}" has ${follows} follows and ${followed_by} followers.`;
}

function cache(req, res, next) {
  var m = client.multi();
  m.get("username");
  m.get("follows");
  m.get("followed_by");
  m.exec(function (err, data) {
    if (err) throw err;
    if (data[0] != null) res.send(respond(data[0],data[1],data[2]));
    else next();
  });
};

app.get('/', cache, function(req, res, next) {
  request.get(`https://api.instagram.com/v1/users/self/?access_token=${access_token}`, function (err, resp) {
    if (err) throw err;
    let data = JSON.parse(resp.text).data;
    let username = data.username;
    let follows = data.counts.follows;
    let followed_by = data.counts.followed_by;
    
    var m = client.multi()
    m.setex("username", 5, username);
    m.setex("follows", 5, follows);
    m.setex("followed_by", 5, followed_by);
    m.exec(function(err, data) {
      if (err) throw err;
      else console.log(data);
    });
    res.send(respond(username, follows, followed_by))
  });
});

app.listen(port, function() {
  console.log('app listening on port ' + port);
});
