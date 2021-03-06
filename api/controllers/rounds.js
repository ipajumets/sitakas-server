let mongoose = require("mongoose");
let server = require("../../Server");

// Models
const Rounds = require("../models/rounds");

// Helpers
const globalHelpers = require("../../helpers/global");
const roundHelpers = require("../../helpers/rounds");

// Get all rounds
exports.return_all = (req, res) => {

    Rounds.find({}).sort({ $natural: -1 })
        .select("_id room_code round hand results turn action trump dateCreated")
        .exec()
        .then(rounds => {
            res.status(201).json({
                count: rounds.length,
                rounds: rounds.slice(0, 50).map(round => {
                    return {
                        _id: round._id,
                        room_code: round.room_code,
                        round: round.round,
                        hand: round.hand,
                        results: round.results,
                        turn: round.turn,
                        action: round.action,
                        trump: round.trump,
                        created: globalHelpers.timeSince(round.dateCreated),
                    }
                }),
            });
        })
        .catch(err => console.log(err));

}

// Get all rounds
exports.get_all_for_game = (req, res) => {

    Rounds.find({ room_code: req.params.code }).sort({ $natural: -1 })
        .select("_id room_code round hand results turn action trump dateCreated")
        .exec()
        .then(rounds => {
            res.status(201).json({
                count: rounds.length,
                rounds: rounds.map(round => {
                    return {
                        _id: round._id,
                        room_code: round.room_code,
                        round: round.round,
                        hand: round.hand,
                        results: round.results,
                        turn: round.turn,
                        action: round.action,
                        trump: round.trump,
                        created: globalHelpers.timeSince(round.dateCreated),
                    }
                }),
            });
        })
        .catch(err => console.log(err));

}

// Create new round
exports.create_round = (req, res, next) => {

    const round = new Rounds({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.params.code,
        round: req.body.round,
        hand: req.body.hand,
        results: [],
        turn: req.body.turn,
        action: req.body.action,
        trump: req.body.trump,
        dateCreated: new Date().toISOString(),
    });

    round.save()
        .then(_ => {
            console.log("Round tehtud");
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

// Get round
exports.get_round = (req, res, next) => {

    let gameOver = globalHelpers.isGameOver(req.body.game.players.length, req.body.game.round);

    Rounds.findOne({ room_code: req.params.code, round: gameOver ? req.body.game.round-1 : req.body.game.round })
        .select("_id room_code round hand results turn action trump dateCreated")
        .exec()
        .then(round => {
            if (round) {
                req.body.round = {
                    _id: round._id,
                    room_code: round.room_code,
                    round: round.round,
                    hand: round.hand,
                    results: round.results,
                    turn: round.turn,
                    action: round.action,
                    trump: round.trump,
                    created: globalHelpers.timeSince(round.dateCreated),
                };
                next();
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: req.body.game,
                    users: req.body.users,
                    round: null,
                });
            }
        })
        .catch(err => console.log(err));

}

// Get previous round
exports.get_previous_round = (req, res, next) => {

    Rounds.findOne({ room_code: req.params.code, round: req.body.game.round-1 })
        .select("_id results")
        .exec()
        .then(round => {
            if (round) {
                req.body.previousRound = {
                    _id: round._id,
                    results: round.results,
                };
                next();
            } else {
                req.body.previousRound = null;
                next();
            }
        })
        .catch(err => console.log(err));

}

// Find round
exports.find_round = (req, res, next) => {

    Rounds.findOne({ room_code: req.params.code, round: req.body.game.round })
        .select("_id room_code round hand results turn action trump dateCreated")
        .exec()
        .then(round => {
            if (round) {
                req.body.round = {
                    _id: round._id,
                    room_code: round.room_code,
                    round: round.round,
                    hand: round.hand,
                    results: round.results,
                    turn: round.turn,
                    action: round.action,
                    trump: round.trump,
                    created: globalHelpers.timeSince(round.dateCreated),
                };
                next();
            } else {
                return res.status(500).json({
                    error: true,
                    message: "Roundi ei leitud.",
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

// Add bet
exports.add_bet = (req, res) => {

    const bet = { uid: req.body.uid, won: 0, wins: req.body.wins },
        winsTotal = (req.body.round.results.reduce((a, b) => +a + +b.wins, 0))+req.body.wins,
        cardsInRound = roundHelpers.getCardsInRound(req.body.game.players.length, req.body.round.round),
        lastPlayerToBet = roundHelpers.lastPlayerToBet(req.body.round.results, req.body.game.players),
        nextPlayer = roundHelpers.getNextPlayer(req.body.game.players, req.body.uid),
        nextAction = roundHelpers.getNextAction(lastPlayerToBet);
    
    if (winsTotal === cardsInRound && lastPlayerToBet) {
        return res.status(500).json({
            error: true,
            message: `${req.body.wins} ei saa pakkuda.`,
            wins: req.body.wins,
        });
    }

    Rounds.findOne({ room_code: req.params.code, round: req.body.round.round }) 
        .select("_id results")
        .exec()
        .then(r => {

            let check = r.results.filter(resu => {
                return resu.uid === bet.uid;
            });

            if (check.length < 1) {
                Rounds.updateOne({ room_code: req.params.code, round: req.body.round.round }, { $set: { turn: nextPlayer, action: nextAction }, $addToSet: { results: bet } })
                    .exec()
                    .then(_ => {

                        server.io.emit(`${req.params.code}_bet_done`, {
                            ...req.body.round,
                            results: [...req.body.round.results, bet],
                            turn: nextPlayer,
                            action: nextAction,
                        });

                        return res.status(201).json({
                            success: true,
                            message: "Pakkumine edukalt lisatud!",
                        });
                    })
                    .catch(err => {
                        return res.status(500).json({
                            error: true,
                            message: "Midagi läks valesti, palun proovige uuesti!",
                            fullMessage: err,
                        });
                    });
            } else {

                if (req.body.game.players.length === r.results.length) {
                    Rounds.updateOne({ room_code: req.params.code, round: req.body.round.round }, { $set: { turn: r.results[0].uid, action: "call" } })
                        .exec()
                        .then(_ => {

                            server.io.emit(`${req.params.code}_bet_done`, {
                                ...req.body.round,
                                turn: r.results[0].uid,
                                action: "call",
                            });

                            return res.status(201).json({
                                success: true,
                                message: "Pakkumine edukalt lisatud!",
                            });
                        })
                        .catch(err => {
                            return res.status(500).json({
                                error: true,
                                message: "Midagi läks valesti, palun proovige uuesti!",
                                fullMessage: err,
                            });
                        });
                } else {

                    Rounds.updateOne({ room_code: req.params.code, round: req.body.round.round }, { $set: { turn: nextPlayer, action: "guess" } })
                        .exec()
                        .then(_ => {

                            server.io.emit(`${req.params.code}_bet_done`, {
                                ...req.body.round,
                                turn: nextPlayer,
                                action: "guess",
                            });

                            return res.status(201).json({
                                success: true,
                                message: "Pakkumine edukalt lisatud!",
                            });
                        })
                        .catch(err => {
                            return res.status(500).json({
                                error: true,
                                message: "Midagi läks valesti, palun proovige uuesti!",
                                fullMessage: err,
                            });
                        });

                }

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

// Update round after new card
exports.update_round = (req, res, next) => {

    const nextPlayer = roundHelpers.getNextPlayer(req.body.game.players, req.body.card.uid),
        lastHandOfTheRound = roundHelpers.lastHandOfTheRound(req.body.game.players.length, req.body.game.round, req.body.game.hand),
        filter = { room_code: req.params.code, round: req.body.game.round },
        nextHand = req.body.game.hand+1;
    
    let update,
        updatedResults;

    if (!req.body.lastCardOfTheHand) {
        update = { $set: { turn: nextPlayer, action: "call" } };
    } else {
        updatedResults = req.body.round.results.map(result => {
            return {
                uid: result.uid,
                won: result.uid === req.body.hand.winner.uid ? result.won+1 : result.won,
                wins: result.wins,
            };
        });
        if (!lastHandOfTheRound) {
            update = { $set: { hand: nextHand, turn: req.body.hand.winner.uid, action: "call", results: updatedResults } };
        } else {
            update = { $set: { results: updatedResults } };
        }
    }

    Rounds.updateOne(filter, update)
        .exec()
        .then(_ => {

            if (!req.body.lastCardOfTheHand) {
                server.io.emit(`${req.params.code}_update_round`, {
                    ...req.body.round,
                    turn: nextPlayer,
                    action: "call",
                });
                res.status(201).json({
                    success: true,
                    message: "Round edukalt uuendatud...",
                });
            } else {
                if (!lastHandOfTheRound) {
                    req.body.nextHand = nextHand,
                    req.body.round = {
                        ...req.body.round,
                        turn: req.body.hand.winner.uid,
                        action: "call",
                        results: updatedResults,
                        hand: nextHand,
                    };
                    next();
                } else {
                    req.body.round = {
                        ...req.body.round,
                        results: updatedResults,
                    };
                    server.io.emit(`${req.params.code}_update_round`, req.body.round);
                    next();
                }
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
exports.delete_all_rounds = (req, res) => {

    Rounds.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}