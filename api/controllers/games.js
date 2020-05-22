let mongoose = require("mongoose");
let server = require("../../Server");

// Models
let Games = require("../models/games");

// Constants
let constants = require("../../constants");

// Helpers
let helpers = require("../../helpers/games");
let globalHelpers = require("../../helpers/global");

// Get all games
exports.return_all = (req, res) => {

    Games.find({}).sort({ $natural: -1 })
        .select("_id room_code players round hand dealer dateCreated")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                count: docs.length,
                data: docs.slice(0, 20).map(doc => {
                    return {
                        _id: doc._id,
                        code: doc.room_code,
                        round: doc.round,
                        hand: doc.hand,
                        dealer: doc.dealer,
                        players: doc.players.map(player => player.name+", "+player.points),
                        created: globalHelpers.timeSince(doc.dateCreated),
                    };
                }),
            });
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                err: err,
            });
        });

}

// Get game
exports.get_a_game = (req, res, next) => {

    Games.findOne({ room_code: req.params.code })
        .select("_id room_code players round hand dealer isOver dateCreated")
        .exec()
        .then(game => {
            if (game) {
                res.status(201).json({
                    _id: game._id,
                    room_code: game.room_code,
                    players: game.players,
                    round: game.round,
                    hand: game.hand,
                    dealer: game.dealer,
                    isOver: game.isOver,
                    dateCreated: globalHelpers.timeSince(game.dateCreated),
                });
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: null,
                });
            }
        })
        .catch(err => console.log(err));

}

// Get one game
exports.get_game = (req, res, next) => {

    Games.findOne({ room_code: req.params.code })
        .select("_id room_code players round hand dealer isOver dateCreated")
        .exec()
        .then(game => {
            if (game) {
                req.body.game = {
                    _id: game._id,
                    room_code: game.room_code,
                    players: game.players,
                    round: game.round,
                    hand: game.hand,
                    dealer: game.dealer,
                    isOver: game.isOver,
                    dateCreated: globalHelpers.timeSince(game.dateCreated),
                };
                next();
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: null,
                });
            }
        })
        .catch(err => console.log(err));

}

// Next turn
exports.set_next_turn = (req, res, next) => {

    Games.updateOne({ room_code: req.body.code }, { $set: { turn: req.body.next_uid, action: req.body.next_action } })
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
                message: "Next turn is set",
            });
        })
        .catch(err => console.log(err));

}

// Create new game
exports.create_game = (req, res, next) => {

    let players_images;
    players_images = constants.players_images.map((item, index) => {
        return {
            index: index,
            ...item,
        };
    });

    const players = req.body.players.map((player) => {

        let random = players_images[Math.floor(Math.random() * players_images.length)];

        let p = {
            uid: player.uid,
            image: random.image,
            name: player.name,
            points: 0,
        };

        let new_pack = players_images.filter((_, index) => {
            return index !== random.index;
        });
        
        players_images = new_pack.map((item, index) => {
            return {
                ...item,
                index: index,
            };
        });

        return p;

    });

    let game = new Games({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.params.code,
        players: players,
        round: 1,
        hand: 1,
        dealer: req.body.players[0].uid,
        isOver: false,
        dateCreated: new Date().toISOString(),
    });

    game.save()
        .then(_ => {
            req.body.round = 1,
            req.body.hand = 1,
            req.body.turn = req.body.players[1].uid,
            req.body.action = "guess";
            server.io.emit("refresh_public_rooms_list");
            return next();
        })
        .catch(err => {
            return res.status(500).json({
                error: true,
                message: "Midagi läks valesti, palun proovige uuesti!",
                fullMessage: err,
            });
        });

}

// Get players of current game
exports.get_players = (req, res, next) => {

    Games.findOne({ room_code: req.params.code })
        .select("_id players")
        .exec()
        .then(game => {
            if (game) {
                req.body.game = {
                    _id: game._id,
                    players: game.players,
                };
                next();
            } else {
                return res.status(500).json({
                    error: true,
                    message: "Mängu ei leitud.",
                });
            }
        })
        .catch(err => {
            return res.status(500).json({
                error: true,
                message: "Midagi läks valesti, palun proovige uuesti!",
                fullMessage: err,
            });
        });

}

// Find game
exports.find_game = (req, res, next) => {

    Games.findOne({ room_code: req.params.code })
        .select("_id room_code players round hand dealer dateCreated")
        .exec()
        .then(game => {
            if (game) {
                req.body.game = {
                    _id: game._id,
                    room_code: game.room_code,
                    players: game.players,
                    round: game.round,
                    hand: game.hand,
                    dealer: game.dealer,
                    dateCreated: globalHelpers.timeSince(game.dateCreated),
                };
                next();
            } else {
                return res.status(500).json({
                    error: true,
                    message: "Mängu ei leitud.",
                });
            }
        })
        .catch(err => {
            return res.status(500).json({
                error: true,
                message: "Midagi läks valesti, palun proovige uuesti!",
                fullMessage: err,
            });
        });

}

// Update game
exports.update_game = (req, res, next) => {

    let update;
    const nextDealer = helpers.getNextDealer(req.body.game.players, req.body.game.dealer),
        nextPlayer = helpers.getNextDealer(req.body.game.players, nextDealer),
        updatedPlayers = helpers.sumPoints(req.body.round.results, req.body.game.players),
        nextRound = req.body.game.round+1,
        isOver = helpers.isLastRoundOfTheGame(req.body.game.players.length, req.body.game.round);

    if (!isOver) {
        if (!req.body.nextHand) {
            update = { $set: { players: updatedPlayers, round: nextRound, hand: 1, dealer: nextDealer } };
        } else {
            update = { $set: { hand: req.body.nextHand } };
        }
    } else {
        update = { $set: { isOver: true, players: updatedPlayers } };
    }

    Games.updateOne({ room_code: req.params.code }, update)
        .exec()
        .then(_ => {
            if (!isOver) {
                if (!req.body.nextHand) {
                    req.body.game = {
                        ...req.body.game,
                        players: updatedPlayers,
                        round: nextRound,
                        hand: 1,
                        dealer: nextDealer,
                    },
                    req.body.players = req.body.game.players,
                    req.body.round = req.body.game.round,
                    req.body.hand = 1;
                    req.body.turn = nextPlayer,
                    req.body.action = "guess",
                    req.body.newRound = true;
                    next();
                } else {
                    setTimeout(() => {
                        server.io.emit(`${req.params.code}_new_hand`);
                    }, 2000);
                    res.status(201).json({
                        success: true,
                        message: "Round edukalt uuendatud...",
                    });
                }
            } else {
                setTimeout(() => {
                    server.io.emit(`${req.params.code}_new_hand`);
                }, 2000);
                res.status(201).json({
                    success: true,
                    message: "Round edukalt uuendatud...",
                });
            }
        })
        .catch(err => {
            return res.status(500).json({
                error: true,
                message: "Midagi läks valesti, palun proovige uuesti!",
                fullMessage: err,
            });
        });

}


// Delete all cards
exports.delete_all_games = (req, res) => {

    Games.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}

// Delete a game
exports.delete_a_game = (req, res) => {

    Games.deleteOne({ _id: req.params.id })
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}