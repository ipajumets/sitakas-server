let mongoose = require("mongoose");
let server = require("../../Server");

// Models
const Rounds = require("../models/rounds");

// Get all rounds
exports.return_all = (req, res) => {

    Rounds.find()
        .exec()
        .then(rounds => {
            res.status(201).json({
                count: rounds.length,
                rounds,
            });
        })
        .catch(err => console.log(err));

}

// Get one round
exports.get_previous_round = (req, res, next) => {

    Rounds.findOne({ room_code: req.body.code, round: req.body.game.round-1 })
        .select("_id room_code results round")
        .exec()
        .then(round => {
            if (round) {
                req.body.previousRound = {
                    _id: round._id,
                    room_code: round.room_code,
                    results: round.results,
                    round: round.round,
                };
                next();
            } else {
                req.body.previousRound = null;
                next();
            }
        })
        .catch(err => console.log(err));

}

// Get one round
exports.get_round = (req, res, next) => {

    let gameOver = isGameOver(req.body.game.players.length, req.body.game.round);

    Rounds.findOne({ room_code: req.body.code, round: gameOver ? req.body.game.round-1 : req.body.game.round })
        .select("_id room_code results round")
        .exec()
        .then(round => {
            if (round) {
                req.body.round = {
                    _id: round._id,
                    room_code: round.room_code,
                    results: round.results,
                    round: round.round,
                };
                next();
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: req.body.game,
                    round: null,
                });
            }
        })
        .catch(err => console.log(err));

}

// Create new round
exports.create_round = (req, res, next) => {

    let round = new Rounds({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.code,
        results: [],
        round: req.body.round,
    });

    round.save()
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

// Create new round for bugs
exports.create_new_round_for_bugs = (req, res, next) => {

    let round = new Rounds({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.code,
        results: [],
        round: req.body.round,
    });

    round.save()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Add bet
exports.add_bet = (req, res, next) => {

    let bet = { uid: req.body.uid, wins: req.body.wins, won: 0 };

    Rounds.updateOne({ room_code: req.body.code, round: req.body.round }, { $addToSet: { results: bet } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.body.code}_bet_added`, {
                uid: req.body.next_uid,
                action: req.body.next_action,
                bet: bet,
            });

            next();
        })
        .catch(err => console.log(err));

}

// Add bet
exports.update_results = (req, res, next) => {

    Rounds.updateOne({ room_code: req.body.code, round: req.body.round }, { $set: { results: req.body.results } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.body.code}_update_results`, {
                data: req.body.results,
            });

            next();
            
        })
        .catch(err => console.log(err));

}

// helpers
let isGameOver = (players, round) => {

    if (players === 3 && round > 29) {
        return true;
    }

    if (players === 4 && round > 26) {
        return true;
    }

    if (players === 5 && round > 25) {
        return true;
    }

    return false;

}