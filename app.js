var express = require('express');
var path = require('path');
var jsonwebtoken = require('jsonwebtoken');

//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
//var jwt = require('express-jwt');
var cors = require('cors');

var http = require('http').Server(app);
var io = require('socket.io')(http);

//redis for room cashing
var redis = require('socket.io-redis');

var fs = require('fs');


var games = require("./routes/games");
var jokes = require("./routes/jokes");

var keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));


app.use(cors());
var redisClient, redisAdapter;
console.log(process.env.REDIS_HOST)
if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    redisClient = require("redis").createClient(rtg.port, rtg.hostname);
    redisClient.auth(rtg.auth.split(":")[1]);
}
else if (process.env.REDIS_HOST === 'docker') {
    redisAdapter = require("redis").createClient(6379, 'redis');
} else {
    redisAdapter = require("redis").createClient(6379, 'localhost');
}
var redisMain = redisAdapter ? redisAdapter : redisClient;



app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.use('/api/v1/', games);
app.use(express.static('dist'))

app.get('/*', function (req, res) {
res.sendFile(path.join(__dirname + "/dist/",'index.html'));
// catch 404 and forward to error handler
})
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

var mainHall = io.of('/main-hall');
var gameHall = io.of('/game');

games.emitter.on('create', function(game) {
    mainHall.emit('created-game', {type: 'created-game', data: game});
})

games.emitter.on('delete', function(game_id) {
    mainHall.emit('deleted-game', {type: 'deleted-game', data: game_id});
})

games.emitter.on('user-connected', function(game) {
    let socket = findSocketByUserId(game.user_id);
    if (socket) {
        redisMain.exists('gameroom#' + game._id,
            (err, reply) => {
            if (reply === 0) {
                redisMain.hmset('gameroom#' + game._id, {
                    'user_id': game.user_id,
                    'connected_user_id': game.connected_user_id,
                    'game': JSON.stringify(game)
                }, (err, data) => {
                    socket.emit('second-connected', game)
                    mainHall.emit('deleted-game', {type: 'deleted-game', data: game._id});
                });
            }
        })
    }
})

mainHall.on('connection', (socket)=> {
    console.log('User connected...');

    if (socket.handshake.query.user_data && authSocketAlreadyOnline(socket.handshake.query.user_data)) {
        socket.emit('user-already-online');
        socket.disconnect(true)
        return;
    }

    mainHall.emit('users-amount-changed', {amount: Object.keys(mainHall.sockets).length});

    if (socket.handshake.query.user_nickname) {
        mainHall.emit('message', {type: 'new-message', data: {
            timestap: Date.now(),
            author: "",
            is_system: true,
            text:`${socket.handshake.query.user_nickname} connected to chat`
        }});
    }

    socket.on('disconnect', () => {
        games.emitter.emit("userleft", socket.handshake.query.user_data)
        mainHall.emit('users-amount-changed', {amount: Object.keys(mainHall.sockets).length})
        if (socket.handshake.query.user_nickname) {
            mainHall.emit('message', {type: 'new-message', data: {
                timestap: Date.now(),
                author: "",
                is_system: true,
                text:`${socket.handshake.query.user_nickname} disconnected from chat`
            }});
        }
        console.log('User disconnected...')
    })

    socket.on('add-message', (message)=> {
        message.timestap = Date.now();
        validateToken(socket.handshake.query.token, onSuccess, onError);
        function onSuccess() {
            mainHall.emit('message', {type: 'new-message', data: message});
        }
        function onError(err) {
            socket.emit('message', {type: 'new-message', error: err.message});
        }
    })
})
redisMain.on('error', error => console.log(error))
gameHall.on('connection', (socket) => {
    console.log('User connected game hall...');

    validateToken(socket.handshake.query.token, onSuccess, onError);

    function onSuccess() {
        const ROOMNAME = 'gameroom#' + socket.handshake.query.game_id;

        socket.join(ROOMNAME, (data) => {
            let room = gameHall.in(ROOMNAME);
            console.log('join - ' + ROOMNAME + ' user - ' + socket.handshake.query.user_data);

            socket.on('loaded-to-game', data => {
                let key = 'user_loaded-' + data.game_id + '-' + socket.handshake.query.user_data
                let enemyKey = 'user_loaded-' + data.game_id + '-' + data.enemy_user_id
                // When user connects to game - stash his id and game id as a new key in Redis
                // Then check if enemy redis key already exists, if it does - emmit event that users
                // ready to game, after that clear both keys. To prevent storing some trash in Redis
                // set expiration time of each player loading key to 5 min
                // TODO: Promisify this boiler-plate code //
                redisMain.set(key, true, (er, item) =>
                {
                    redisMain.expire(key, 60 * 5) //5 min expiration time
                    redisMain.exists(enemyKey,
                        (err, reply) => {
                        if (reply === 1) {
                            room.emit('users-ready', {success: true});
                            deleteKeysFromRedis([key, enemyKey])
                        }
                    })
                });
            })

            socket.on('ships-landed', () => {
                redisMain.hgetall('gameroom#' + socket.handshake.query.game_id, function(err, game) {
                    let players = [game.connected_user_id, game.user_id]
                    let randomIndex = Math.round(Math.random())
                    room.emit('player-landed-ships', { player_id: socket.handshake.query.user_data, players_turn: players[randomIndex] })
                });
            })

            socket.on('fire', data => {
                room.emit('player-fire', { player_id: socket.handshake.query.user_data, event:  data})
            })

            socket.on("fire-result", data => {
                data.timestap = Date.now()
                room.emit('player-fire-result', { player_id: socket.handshake.query.user_data, event:  data})
            })

            socket.on("lost", data => {
                games.saveGameState(socket.handshake.query.game_id, socket.handshake.query.user_data);
                deleteKeysFromRedis(['gameroom#' + socket.handshake.query.game_id]);
                room.emit('player-lost', { player_id: socket.handshake.query.user_data, event:  data})
            })

            socket.on('add-message', (message) => {
                message.timestap = Date.now();
                room.emit('message', {type: 'gamechat-message', data: message});
            })

            socket.on('joke', (data) => {
                room.emit('message', {type: 'gamechat-message', data: {
                    timestap: Date.now(),
                    author: "SYSTEM",
                    text: `*${data.author} asks captain to tell a joke*`
                }});
                jokes.getJoke()
                    .then(data => {
                        room.emit('new-joke', {type: 'new-joke', data: data});
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })

            socket.on('disconnect', () => {
                room.emit('player-leave', { player_id: socket.handshake.query.user_data})
                deleteKeysFromRedis(['gameroom#' + socket.handshake.query.game_id]);
                console.log('Disconnented from game hall...')
            })
        });
    }
    function onError(err) {
        console.log('ERROR')
        socket.emit('message', {type: 'gamechat-message', error: err.message});
    }
})

var port = process.env.PORT || 3000;
http.listen(port, function () {
    console.log(`App listening on port ${port}!`);
});

function deleteKeysFromRedis(keys) {
    keys.forEach(key => {
        redisMain.del(key, function(err, reply) {
            if (err) console.log(err);
        });
    })
}

function findSocketByUserId(userId) {
    return mainHall.sockets[Object.keys(mainHall.sockets).find((item, index) => mainHall.sockets[item].handshake.query.user_data === userId)];
}

function validateToken(token, onSuccess, onError) {
    try {
        let decoded = jsonwebtoken.verify(token,
            new Buffer(keys.auth0_secret_key, 'base64'));
        if (decoded) onSuccess();
    } catch (err) {
        onError(err);
    };
}

function getGameFromRedis(gameId) {
    return new Promise((resolve, reject) => {
        redisMain.hgetall('gameroom#' + gameId,
            (err, game) => {
            if (err) {
                reject(err)
            } else {
                resolve(game)
            }
        })
    })
}

function findClientsSocket(roomId, namespace) {
    let res = [],
    ns = io.of(namespace ||"/");

    if (ns)
    {
        Object.keys(ns.connected).forEach((id)=>{
            if(roomId) {
                if (ns.connected[id].rooms[roomId]) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        })
    }
    return res;
}

function authSocketAlreadyOnline(user_id) {
    return Object.keys(io.sockets.connected).filter((socketId) => {
        return io.sockets.connected[socketId].handshake.query.user_data === user_id;
    }).length > 1;
}

module.exports = app;
