let mongoose = require("mongoose");
let server = require("../../Server");

// Models
let Hands = require("../models/hands");
let Games = require("../models/games");
let Rounds = require("../models/rounds");
let Cards = require("../models/cards");

// Constants
let constants = require("../../constants");

//  Helpers
let globalHelpers = require("../../helpers/global");
let handsHelpers = require("../../helpers/hands");
const cards = require("../models/cards");

// Get all hands
exports.return_all = (req, res) => {

    Hands.find({}).sort({ $natural: -1 })
        .select("_id room_code round hand cards winner base")
        .exec()
        .then(hands => {
            res.status(201).json({
                count: hands.length,
                hands: hands.slice(0, 50).map(hand => {
                    return {
                        _id: hand._id,
                        room_code: hand.room_code,
                        round: hand.round,
                        hand: hand.hand,
                        cards: hand.cards,
                        winner: hand.winner,
                        base: hand.base,
                    };
                }),
            });
        })
        .catch(err => console.log(err));

}

// Get one hand
exports.get_hand = (req, res, next) => {

    let gameOver = globalHelpers.isGameOver(req.body.game.players.length, req.body.game.round);

    Hands.findOne({ room_code: req.params.code, round: gameOver ? req.body.game.round-1 : req.body.game.round, hand: req.body.game.hand })
        .select("_id room_code round hand cards winner base")
        .exec()
        .then(hand => {
            if (hand) {
                req.body.hand = {
                    _id: hand._id,
                    room_code: hand.room_code,
                    round: hand.round,
                    hand: hand.hand,
                    cards: hand.cards,
                    winner: hand.winner,
                    base: hand.base,
                };
                next();
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: req.body.game,
                    users: req.body.users,
                    round: req.body.round,
                    hand: null,
                });
            }
        })
        .catch(err => console.log(err));

}

// Get one hand
exports.get_previous_hand = (req, res, next) => {

    Hands.findOne({ room_code: req.params.code, round: req.body.game.round, hand: req.body.game.hand-1 })
        .select("_id room_code round hand cards winner base")
        .exec()
        .then(hand => {
            if (hand) {
                req.body.previousHand = {
                    _id: hand._id,
                    room_code: hand.room_code,
                    round: hand.round,
                    hand: hand.hand,
                    cards: hand.cards,
                    winner: hand.winner,
                    base: hand.base,
                };
                next();
            } else {

                Hands.findOne({ room_code: req.params.code, round: req.body.game.round-1 }).sort({ $natural: -1})
                    .select("_id room_code round hand cards winner base")
                    .exec()
                    .then(hand => {
                        if (hand) {
                            req.body.previousHand = {
                                _id: hand._id,
                                room_code: hand.room_code,
                                round: hand.round,
                                hand: hand.hand,
                                cards: hand.cards,
                                winner: hand.winner,
                                base: hand.base,
                            };
                            next();
                        } else {
                            req.body.previousHand = null;
                            next();
                        }
                    })
                    .catch(err => console.log(err));
            }
        })
        .catch(err => console.log(err));

}

// Create new hand for bugs
exports.create_new_hand = (req, res, next) => {

    let hand = new Hands({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.code,
        round: req.body.round,
        hand: req.body.hand,
        cards: [],
        base: null,
        winner: null,
    });

    return hand.save()
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

// Add last card of the hand
exports.add_last_card = (req, res, next) => {

    let winner = { uid: req.body.winner.uid, value: req.body.winner.value, suit: req.body.winner.suit },
        card = { uid: req.body.uid, value: req.body.value, suit: req.body.suit },
        rounds = globalHelpers.getGameRoundsStructure(req.body.players.length);

        req.body.isLastHandOfTheRound = handsHelpers.isLastHandOfTheRound(req.body.round, req.body.hand, rounds);
    
    Hands.updateOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand }, { $set: { winner: winner }, $addToSet: { cards: card } })
        .exec()
        .then(_ => {
            server.io.emit(`${req.body.code}_last_card_added`, {
                card: card,
                winner: winner,
            });
            next();
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// v2 callbacks

// Create new hands
exports.create_hands = (req, res, next) => {

    const arr = handsHelpers.createHands(req.body.round, constants[`rounds_${req.body.players.length}_players`]);

    const promises = arr.map(a => {

        const hand = new Hands({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.params.code,
            round: req.body.round,
            hand: a,
            cards: [],
            base: null,
            winner: null,
        });
    
        return hand.save()
            .then(_ => {
                return;
            })
            .catch(err => {
                return res.status(500).json({
                    error: true,
                    message: "Midagi läks valesti, palun proovige uuesti!",
                    fullMessage: err,
                });
            });

    });

    Promise.all(promises)
        .then(_ => {

            if (req.body.newRound) {
                setTimeout(() => {
                    server.io.emit(`${req.params.code}_new_round`, {
                        code: req.params.code,
                    });
                }, 3000);
            } else {
                server.io.emit(`${req.params.code}_started`, {
                    code: req.params.code,
                });
            }

            console.log("Käed tehtud, läks minna!");
            
            res.status(201).json({
                success: true,
                message: "Läks minna!",
            });

        });

}

// Find hand
exports.find_hand = (req, res, next) => {

    Hands.findOne({ room_code: req.params.code, round: req.body.game.round, hand: req.body.game.hand })
        .select("_id room_code round hand cards base winner")
        .exec()
        .then(hand => {
            if (hand) {
                req.body.hand = {
                    _id: hand._id,
                    room_code: hand.room_code,
                    round: hand.round,
                    hand: hand.hand,
                    cards: hand.cards,
                    base: hand.base,
                    winner: hand.winner,
                };
                next();
            } else {
                return res.status(500).json({
                    error: true,
                    message: "Kätt ei leitud.",
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

// Add card
exports.add_card = (req, res, next) => {

    const firstCardOfTheHand = handsHelpers.firstCardOfTheHand(req.body.hand.cards);
    const lastCardOfTheHand = handsHelpers.lastCardOfTheHand(req.body.hand.cards, req.body.game.players);
    const winner = lastCardOfTheHand ? handsHelpers.determineWinner(req.body.round, req.body.hand, req.body.card) : null;
    const update = handleUpdate(firstCardOfTheHand, lastCardOfTheHand, req.body.card, winner, req.body.hand.cards);

    Hands.updateOne({ room_code: req.body.hand.room_code, round: req.body.hand.round, hand: req.body.hand.hand }, update)
        .exec()
        .then(_ => {

            let cards = [...req.body.hand.cards, req.body.card];

            req.body.firstCardOfTheHand = firstCardOfTheHand,
            req.body.lastCardOfTheHand = lastCardOfTheHand,
            req.body.hand = {
                ...req.body.hand,
                cards: cards,
                base: handleBase(firstCardOfTheHand, req.body.card, cards, req.body.hand.base),
                winner: winner,
            };
            server.io.emit(`${req.params.code}_update_hand`, req.body.hand);
            next();
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
exports.delete_all_hands = (req, res) => {

    Hands.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}

const handleBase = (firstCardOfTheHand, card, cards, base) => {

    if (base) return base;
    if (firstCardOfTheHand && card.value !== 15) return card;
    if (cards.length !== 0) return cards.filter(card => card.value !== 15)[0];

    return null;

}

const handleUpdate = (firstCardOfTheHand, lastCardOfTheHand, card, winner, cards) => {

    if (firstCardOfTheHand && card.value !== 15) {
        return { $set: { base: card }, $addToSet: { cards: card } };
    }

    if (lastCardOfTheHand) {
        return { $set: { winner: winner }, $addToSet: { cards: card } };
    }

    if (cards.length === 1 && cards[0].value === 15) {
        return { $set: { base: card }, $addToSet: { cards: card } };
    }

    if (cards.length === 2 && cards[0].value === 15 && cards[1].value === 15) {
        return { $set: { base: card }, $addToSet: { cards: card } };
    }

    return { $addToSet: { cards: card } };

}