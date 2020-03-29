let mongoose = require("mongoose");
let server = require("../../Server");

// Models
let Games = require("../models/games");

// Helpers
let helpers = require("../../helpers/games");

// Get all games
exports.return_all = (req, res) => {

    Games.find()
        .select("_id room_code players round hand dealer turn action trump")
        .exec()
        .then(result => {
            res.status(201).json({
                success: true,
                count: result.length,
                data: result,
            });
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Get one game
exports.get_game = (req, res, next) => {

    Games.findOne({ room_code: req.body.code })
        .select("_id room_code players round hand dealer turn action trump")
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
                    turn: game.turn,
                    action: game.action,
                    trump: game.trump,
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

// Create new game
exports.create_game = (req, res, next) => {

    let game = new Games({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.code,
        players: req.body.players.map((player, index) => {
            return {
                uid: player.browser_id,
                image: helpers.getRandomImage(index),
                name: player.name,
                points: 0,
            };
        }),
        round: req.body.round,
        hand: 1,
        dealer: req.body.players[0].browser_id,
        turn: req.body.players[1].browser_id,
        action: "guess",
    });

    game.save()
        .then(_ => {
            next();
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Set trump card and start game
exports.set_trump_card_and_start_game = (req, res) => {

    Games.updateOne({ room_code: req.body.code }, { $set: { trump: req.body.trump } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.body.code}_started`, {
                code: req.body.code,
            });

            res.status(201).json({
                success: true,
                message: "Game has started",
            });

        })
        .catch(err => console.log(err));

}

// Set trump card and continue
exports.set_trump_card_and_continue = (req, res) => {

    Games.updateOne({ room_code: req.body.code }, { $set: { trump: req.body.trump } })
        .exec()
        .then(_ => {

            setTimeout(() => {
                server.io.emit(`${req.body.code}_new_round`, {
                    code: req.body.code,
                });
            }, 2000);

            res.status(201).json({
                success: true,
                message: "Game continues!",
            });

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

// Update game object after finishing hand
exports.update_game_after_finishing_hand = (req, res, next) => {

    let options,
        updated_players;

    if (req.body.isLastHandOfTheRound) {
        updated_players = helpers.sumPoints(req.body.results, req.body.players),
        options = { $set: { players: updated_players, round: req.body.round+1, hand: 1, dealer: req.body.next_dealer, turn: req.body.next_uid, action: req.body.next_action } };
    } else {
        options = { $set: { hand: req.body.hand+1, turn: req.body.next_uid, action: req.body.next_action } };
    }

    let isLast = isLastRoundOfTheGame(req.body.players.length, req.body.round+1);

    Games.updateOne({ room_code: req.body.code }, options)
        .exec()
        .then(_ => {

            if (req.body.isLastHandOfTheRound) {
                if (!isLast) {
                    req.body.round = req.body.round+1;
                    req.body.hand = 1;
                    next();
                } else {
                    setTimeout(() => {
                        server.io.emit(`${req.body.code}_game_over`, {
                            code: req.body.code,
                        });
                    }, 3333);
                    res.status(201).json({
                        success: true,
                        message: "Game over",
                    });
                }

            } else {

                setTimeout(() => {
                    server.io.emit(`${req.body.code}_next_hand`, {
                        code: req.body.code,
                    });
                }, 2000);

                res.status(201).json({
                    success: true,
                    message: "Next turn",
                });
            }

        })
        .catch(err => console.log(err));

}

let isLastRoundOfTheGame = (players, round) => {

    if (players === 3 && round > 29) {
        return true;
    }

    if (players === 4 && round > 26) {
        return true;
    }

    if (players === 5 && round > 25) {
        return true;
    }

    if (players === 6 && round > 26) {
        return true;
    }

    return false;

}