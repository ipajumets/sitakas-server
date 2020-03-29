let mongoose = require("mongoose");
let server = require("../../Server");

// Models
let Hands = require("../models/hands");
let Games = require("../models/games");
let Rounds = require("../models/rounds");
let Cards = require("../models/cards");

//  Helpers
let globalHelpers = require("../../helpers/global");
let handsHelpers = require("../../helpers/hands");

// Get all hands
exports.return_all = (req, res) => {

    Hands.find({}).sort({ $natural: -1 }).limit(50)
        .select("_id room_code round hand cards winner base")
        .exec()
        .then(hands => {
            res.status(201).json({
                count: hands.length,
                hands,
            });
        })
        .catch(err => console.log(err));

}

// Get one hand
exports.get_hand = (req, res, next) => {

    let gameOver = isGameOver(req.body.game.players.length, req.body.game.round);

    Hands.findOne({ room_code: req.body.code, round: gameOver ? req.body.game.round-1 : req.body.game.round, hand: req.body.game.hand })
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
                    round: req.body.round,
                    hand: null,
                });
            }
        })
        .catch(err => console.log(err));

}

// Get one hand
exports.get_previous_hand = (req, res, next) => {

    Hands.findOne({ room_code: req.body.code, round: req.body.game.round, hand: req.body.game.hand-1 })
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

                Hands.findOne({ room_code: req.body.code, round: req.body.game.round-1 }).sort({ $natural: -1})
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

// Create new hands
exports.create_hands = (req, res, next) => {

    let rounds = globalHelpers.getGameRoundsStructure(req.body.players.length),
        arr = handsHelpers.createHands(req.body.round, rounds);

    let promises = arr.map(a => {

        let hand = new Hands({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.code,
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
                res.status(403).json({
                    success: false,
                    err: err,
                });
            });

    });

    Promise.all(promises)
        .then(_ => {
            next();
        });

}

// Add card on the table
exports.add_card = (req, res, next) => {

    let card = { uid: req.body.uid, value: req.body.value, suit: req.body.suit },
        action = req.body.first ? { $set: { base: card }, $addToSet: { cards: card } } : { $addToSet: { cards: card } };

    Hands.updateOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand }, action)
        .exec()
        .then(_ => {
            server.io.emit(`${req.body.code}_card_added`, {
                uid: req.body.next_uid,
                action: "call",
                card: card,
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

// Create new round
exports.create_new_round = (req, res, next) => {

    let round = new Rounds({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.code,
        results: [],
        round: req.body.round+1,
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

// Divide first round cards
exports.divide_cards = (req, res) => {

    let deck;
    deck = full_deck;

    let promises = req.body.results.map(player => {

        let result = shuffle(deck, req.body.round+1);
        deck = result.pack;

        let cards = new Cards({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.code,
            uid: player.uid,
            round: req.body.round+1,
            active: result.my_cards,
            not_active: [],
        });
    
        return cards.save()
            .then(added_cards => {
    
                return added_cards;
    
            })
            .catch(err => {
                res.status(403).json({
                    success: false,
                    err: err,
                });
            });

    });

    Promise.all(promises)
        .then(result => {

            let random_card;
            let trump_card;

            if (deck.length > 0) {
                random_card = deck[Math.floor(Math.random() * deck.length)],
                trump_card = { value: random_card.value, suit: random_card.suit };
            } else {

                let trumps;
                trumps = full_trumps;

                random_card = trumps[Math.floor(Math.random() * trumps.length)],
                trump_card = { value: random_card.value, suit: random_card.suit };
            }
            

            Games.updateOne({ room_code: req.body.code }, { $set: { trump: trump_card } })
                .exec()
                .then(_ => {

                    server.io.emit(`${req.body.code}_new_round`, {
                        code: req.body.code,
                    });
        
                    res.status(201).json(result);

                })
                .catch(err => console.log(err));

        });

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

    if (players === 6 && round > 26) {
        return true;
    }

    return false;

}

let shuffle = (cards, round) => {

    let pack;
    pack = cards;
    pack = pack.map((p, index) => {
        return {
            ...p,
            index: index,
        };
    });


    let my_cards = [],
        amount = rounds.filter(r => r.round === round)[0].amount;

    for (var i = 0; i < amount; i++) {
        let random_card = pack[Math.floor(Math.random() * pack.length)];
        my_cards = [{value: random_card.value, suit: random_card.suit}, ...my_cards];
        pack = pack.filter((p) => p.index !== random_card.index);
        pack = pack.map((p, index) => {
            return {
                ...p,
                index: index,
            };
        });
    }

    return {
        my_cards: my_cards,
        pack: pack,
    };

}

// Full card deck
let full_deck = [
    {
        value: 6,
        suit: "hearts",
    },
    {
        value: 7,
        suit: "hearts",
    },
    {
        value: 8,
        suit: "hearts",
    },
    {
        value: 9,
        suit: "hearts",
    },
    {
        value: 10,
        suit: "hearts",
    },
    {
        value: 11,
        suit: "hearts",
    },
    {
        value: 12,
        suit: "hearts",
    },
    {
        value: 13,
        suit: "hearts",
    },

    {
        value: 14,
        suit: "hearts",
    },
    {
        value: 6,
        suit: "diamonds",
    },
    {
        value: 7,
        suit: "diamonds",
    },
    {
        value: 8,
        suit: "diamonds",
    },
    {
        value: 9,
        suit: "diamonds",
    },
    {
        value: 10,
        suit: "diamonds",
    },
    {
        value: 11,
        suit: "diamonds",
    },
    {
        value: 12,
        suit: "diamonds",
    },
    {
        value: 13,
        suit: "diamonds",
    },

    {
        value: 14,
        suit: "diamonds",
    },
    {
        value: 6,
        suit: "clubs",
    },
    {
        value: 7,
        suit: "clubs",
    },
    {
        value: 8,
        suit: "clubs",
    },
    {
        value: 9,
        suit: "clubs",
    },
    {
        value: 10,
        suit: "clubs",
    },
    {
        value: 11,
        suit: "clubs",
    },
    {
        value: 12,
        suit: "clubs",
    },
    {
        value: 13,
        suit: "clubs",
    },

    {
        value: 14,
        suit: "clubs",
    },
    {
        value: 6,
        suit: "spades",
    },
    {
        value: 7,
        suit: "spades",
    },
    {
        value: 8,
        suit: "spades",
    },
    {
        value: 9,
        suit: "spades",
    },
    {
        value: 10,
        suit: "spades",
    },
    {
        value: 11,
        suit: "spades",
    },
    {
        value: 12,
        suit: "spades",
    },
    {
        value: 13,
        suit: "spades",
    },

    {
        value: 14,
        suit: "spades",
    },
];

let full_trumps = [
    {
        value: 1,
        suit: "hearts",
    },
    {
        value: 1,
        suit: "clubs",
    },
    {
        value: 1,
        suit: "spades",
    },
    {
        value: 1,
        suit: "diamonds",
    },
];

let rounds = [
    {
        round: 1,
        amount: 1,
    },
    {
        round: 2,
        amount: 1,
    },
    {
        round: 3,
        amount: 1,
    },
    {
        round: 4,
        amount: 1,
    },
    {
        round: 5,
        amount: 2,
    },
    {
        round: 6,
        amount: 3,
    },
    {
        round: 7,
        amount: 4,
    },
    {
        round: 8,
        amount: 5,
    },
    {
        round: 9,
        amount: 6,
    },
    {
        round: 10,
        amount: 7,
    },
    {
        round: 11,
        amount: 8,
    },
    {
        round: 12,
        amount: 9,
    },
    {
        round: 13,
        amount: 9,
    },
    {
        round: 14,
        amount: 9,
    },
    {
        round: 15,
        amount: 9,
    },
    {
        round: 16,
        amount: 8,
    },
    {
        round: 17,
        amount: 7,
    },
    {
        round: 18,
        amount: 6,
    },
    {
        round: 19,
        amount: 5,
    },
    {
        round: 20,
        amount: 4,
    },
    {
        round: 21,
        amount: 3,
    },
    {
        round: 22,
        amount: 2,
    },
    {
        round: 23,
        amount: 1,
    },
    {
        round: 24,
        amount: 1,
    },
    {
        round: 25,
        amount: 1,
    },
    {
        round: 26,
        amount: 1,
    },
];