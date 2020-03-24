let mongoose = require("mongoose");
let server = require("../../Server");

// Models
const Rounds = require("../models/rounds");
const Games = require("../models/games");

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
exports.get_round = (req, res) => {

    Rounds.findOne({ room_code: req.body.code, round: req.body.round })
        .select("_id room_code results round")
        .exec()
        .then(round => {
            res.status(201).json({
                _id: round._id,
                room_code: round.room_code,
                results: round.results,
                round: round.round,
            });
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
























// Add bet
exports.add_bet = (req, res) => {

    Rounds.updateOne({ room_code: req.body.code, round: req.body.round }, { $addToSet: { results: { uid: req.body.uid, wins: req.body.wins, won: 0 } } })
        .exec()
        .then(_ => {

            if (req.body.last) {

                Games.updateOne({ room_code: req.body.code }, { $set: { turn: req.body.next_uid, action: "call" } })
                    .exec()
                    .then(_ => {

                        server.io.emit(`${req.body.code}_bet_added`, {
                            uid: req.body.next_uid,
                            action: "call",
                            bet: { uid: req.body.uid, wins: req.body.wins, won: 0 },
                        });

                        res.status(201).json({
                            success: true,
                        });

                    })
                    .catch(err => console.log(err));

            } else {

                Games.updateOne({ room_code: req.body.code }, { $set: { turn: req.body.next_uid } })
                    .exec()
                    .then(_ => {

                        server.io.emit(`${req.body.code}_bet_added`, {
                            uid: req.body.next_uid,
                            action: "guess",
                            bet: { uid: req.body.uid, wins: req.body.wins, won: 0 },
                        });

                        res.status(201).json({
                            success: true,
                        });

                    })
                    .catch(err => console.log(err));

            }

        })
        .catch(err => console.log(err));

}