var http = require('http');

var jokes = {};

jokes.getJoke = function() {
    return new Promise((resolve, reject) => {
        var req = http.get({
            host: "api.icndb.com",
            path: '/jokes/random?firstName=Sea&lastName=Captain&escape=javascript'
        }, function(res) {
            var bodyChunks = [];
            res
            .on('data', function(chunk) {
                bodyChunks.push(chunk);
            })
            .on('end', function() {
                var body = Buffer.concat(bodyChunks);
                resolve(JSON.parse(body.toString()));
            })
        });
        req.on('error', function(e) {
            console.error(e.message);
            reject(e.message)
        });
    })
}

module.exports = jokes;
