var express = require("express");
var router = express.Router();
var mongojs = require("mongojs");
var fs = require('fs');
var keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
var db = mongojs(`mongodb+srv://${keys.db_login}:${keys.db_password}@cluster0.xewpt.mongodb.net/sea_wars?retryWrites=true&w=majority`, ['games']);
var EventEmitter = require('events').EventEmitter;

router.emitter = new EventEmitter();


// Get stack of games

router.emitter.on('userleft', function(user_id){
    db.games.remove({
        "user_id": {$eq: user_id},
        "in_lobby": {$eq: true}
    })
})

router.get('/games', function(req, res, next){
    db.games.find({"in_lobby": true}).limit(20, function(err, games){
        if (err) {
            res.send(err);
        } else {
            res.json(games);
        }
    })
})

router.get('/user-games/:user_id', function(req, res, next){
    var user_id = req.params.user_id;
    db.games.find({
        $or:
            [
                {
                    user_id: { $eq: user_id },
                    finished: true
                },
                {
                    connected_user_id: { $eq: user_id },
                    finished: true
                },
            ]
    }).limit(20, function(err, games){
        if (err) {
            res.send(err);
        } else {
            res.json(games);
        }
    })
})

// Get Single game
router.get('/game/:id', function(req, res, next){
    db.games.findOne({
        _id: mongojs.ObjectId(req.params.id)
    }, function(err, game){
        if(err){
           res.send(err);
        } else {
           res.json(game);
        }
    });
});

// Save game
router.post('/game', function(req, res, next){
    var game = req.body;
    game.time_stamp = Date.now();
    db.games.findOne({
        "user_id": {$eq: game.user_id},
        "in_lobby": {$eq: true}
    }, function(err, gameExisted){
        if(gameExisted || err){
            res.status(err ? 500 : 400);
            res.json({error: err || "Bad request"});
        } else {
            db.games.save(game, function(err, result){
                if(err){
                    res.send(err);
                } else {
                    router.emitter.emit('create', result);
                    res.json(result);
                }
            });
        }
    });
});

// Update game
router.put('/game/:id', function(req, res, next){
    var game = req.body;
    var updObj = {};

    if(game.isCompleted){
       updObj.isCompleted = game.isCompleted;
    }

    if(game.text){
        updObj.text = game.text;
    }

    if(!updObj){
        res.status(400);
        res.json({
            "error": "Invalid Data"
        });
    } else {
        db.games.update({
            _id: mongojs.ObjectId(req.params.id)
        },updObj, {}, function(err, result){
            if(err){
                res.send(err);
            } else {
                res.json(result);
            }
        });
    }
});

// Update game
router.put('/game-connect/:id', function(req, res, next){
    var connectInfo = req.body;

    if(!connectInfo.user_id && !connectInfo.nickname){
        res.status(400);
        res.json({
            "error": "Invalid Data"
        });
    } else {
        db.games.findAndModify({
            query: { _id: mongojs.ObjectId(req.params.id) },
            update: { $set: {
                connected_user_id: connectInfo.user_id,
                connected_user_nickname: connectInfo.nickname,
                players: 2,
                in_lobby: false
            } },
            new: true
        }, function(err, result) {
            if(err){
                res.send(err);
            } else {
                res.json(result);
                router.emitter.emit('user-connected', result);
            }
        });
    }
});
// save results
router.put('/save-result/:id', function(req, res, next){
    var results = req.body;

    if(!results.stats && !results.logs){
        res.status(400);
        res.json({
            "error": "Invalid Data"
        });
    } else {
        db.games.findAndModify({
            query: { _id: mongojs.ObjectId(req.params.id) },
            update: { $set: {
                stats: results.stats,
                logs: results.logs,
                results: true
            } },
            new: true
        }, function(err, result) {
            if(err){
                res.send(err);
            } else {
                res.json(result);
            }
        });
    }
});

// Delete game
router.delete('/game/:id', function(req, res, next){
    db.games.remove({
        _id: mongojs.ObjectId(req.params.id)
    },'', function(err, result){
        if(err){
            res.send(err);
        } else {
            router.emitter.emit('delete', req.params.id);
            res.json(result);
        }
    });
});

// Get game from BD

router.getGameFromBD = function(game_id) {
    return new Promise(function(resolve, reject){
        db.games.findOne({
            _id: mongojs.ObjectId(game_id)
        }, function(err, foundGame){
            if(err || !foundGame) {
                reject()
            } else {
                resolve(foundGame)
            }
        });
    })
}

router.saveGameState = function(game_id, loser_id){
    db.games.findAndModify({
        query: { _id: mongojs.ObjectId(game_id) },
        update: { $set: {
            finished: true,
            loser: loser_id
        } },
        new: true
    }, function(err, result) {
        if(err){
            console.error(err)
        } else {
            console.log('gamesaved', result)
        }
    });
};

module.exports = router;
