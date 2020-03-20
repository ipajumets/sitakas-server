let mongoose = require("mongoose");
let server = require("../../Server");

const Hands = require("../models/hands");
const Games = require("../models/games");
const Rounds = require("../models/rounds");
const Cards = require("../models/cards");

exports.return_all = (req, res) => {

    Hands.find()
        .exec()
        .then(hands => {
            res.status(201).json({
                count: hands.length,
                hands,
            });
        })
        .catch(err => console.log(err));

}

exports.get_hand = (req, res) => {

    Hands.findOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand })
        .select("_id room_code round hand cards winner base")
        .exec()
        .then(hand => {
            res.status(201).json({
                _id: hand._id,
                room_code: hand.room_code,
                round: hand.round,
                hand: hand.hand,
                cards: hand.cards,
                winner: hand.winner,
                base: hand.base,
            });
        })
        .catch(err => console.log(err));

}

exports.add_card = (req, res) => {

    let card = { uid: req.body.uid, value: req.body.value, suit: req.body.suit };

    if (req.body.first) {

        Hands.updateOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand }, { $set: { base: card }, $addToSet: { cards: card } })
            .exec()
            .then(_ => {
                Games.updateOne({ room_code: req.body.code }, { $set: { turn: req.body.next_uid, action: "call" } })
                    .exec()
                    .then(_ => {
                        Cards.updateOne({ room_code: req.body.code, uid: req.body.uid, round: req.body.round }, { $pull: { active: { value: req.body.value, suit: req.body.suit } }, $addToSet: { not_active: { value: req.body.value, suit: req.body.suit } } })
                            .then(_ => {
                                server.io.emit(`${req.body.code}_card_added`, {
                                    uid: req.body.next_uid,
                                    action: "call",
                                    card: card,
                                });
                                res.status(201).json({
                                    success: true,
                                });
                            })
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));

            })
            .catch(err => console.log(err));

    } else {

        Hands.updateOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand }, { $addToSet: { cards: card } })
            .exec()
            .then(_ => {
                Games.updateOne({ room_code: req.body.code }, { $set: { turn: req.body.next_uid, action: "call" } })
                    .exec()
                    .then(_ => {
                        Cards.updateOne({ room_code: req.body.code, uid: req.body.uid, round: req.body.round }, { $pull: { active: { value: req.body.value, suit: req.body.suit } }, $addToSet: { not_active: { value: req.body.value, suit: req.body.suit } } })
                            .then(_ => {
                                server.io.emit(`${req.body.code}_card_added`, {
                                    uid: req.body.next_uid,
                                    action: "call",
                                    card: card,
                                });
                                res.status(201).json({
                                    success: true,
                                });
                            })
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));

            })
            .catch(err => console.log(err));

    }

}

exports.add_last_card = (req, res, next) => {

    let isLastRound = is_last_round(req.body.round, req.body.hand);

    if (isLastRound) {

        let winner = { uid: req.body.winner.uid, value: req.body.winner.value, suit: req.body.winner.suit },
            card = { uid: req.body.uid, value: req.body.value, suit: req.body.suit };

        Hands.updateOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand }, { $set: { winner: winner }, $addToSet: { cards: card } })
            .exec()
            .then(_ => {
                Cards.updateOne({ room_code: req.body.code, uid: req.body.uid, round: req.body.round }, { $pull: { active: { value: req.body.value, suit: req.body.suit } }, $addToSet: { not_active: { value: req.body.value, suit: req.body.suit } } })
                    .then(_ => {

                        Rounds.updateOne({ room_code: req.body.code, round: req.body.round }, { $set: { results: req.body.results } })
                            .exec()
                            .then(_ => {

                                server.io.emit(`${req.body.code}_hand_winner`, {
                                    card: card,
                                    winner: winner,
                                });

                                Games.findOne({ room_code: req.body.code })
                                    .select("_id players")
                                    .exec()
                                    .then(g => {

                                        let p = g.players.map(s => {
                                            return {
                                                uid: s.uid,
                                                name: s.name,
                                                image: s.image,
                                                points: s.points,
                                            };
                                        });

                                        let updated_players = sumPoints(req.body.results, p);

                                        Games.updateOne({ room_code: req.body.code }, { $set: { players: updated_players, round: req.body.round+1, hand: 1, dealer: req.body.next_dealer, turn: req.body.next_uid, action: req.body.next_action } })
                                            .exec()
                                            .then(_ => {

                                                next();

                                            })
                                            .catch(err => console.log(err));

                                    })
                                    .catch(err => console.log(err));

                            })
                            .catch(err => console.log(err));

                    })
                    .catch(err => console.log(err));

            })
            .catch(err => console.log(err));

    } else {

        let winner = { uid: req.body.winner.uid, value: req.body.winner.value, suit: req.body.winner.suit },
            card = { uid: req.body.uid, value: req.body.value, suit: req.body.suit };

        Hands.updateOne({ room_code: req.body.code, round: req.body.round, hand: req.body.hand }, { $set: { winner: winner }, $addToSet: { cards: card } })
            .exec()
            .then(_ => {
                Cards.updateOne({ room_code: req.body.code, uid: req.body.uid, round: req.body.round }, { $pull: { active: { value: req.body.value, suit: req.body.suit } }, $addToSet: { not_active: { value: req.body.value, suit: req.body.suit } } })
                    .then(_ => {

                        Rounds.updateOne({ room_code: req.body.code, round: req.body.round }, { $set: { results: req.body.results } })
                            .exec()
                            .then(_ => {

                                server.io.emit(`${req.body.code}_hand_winner`, {
                                    card: card,
                                    winner: winner,
                                });

                                Games.updateOne({ room_code: req.body.code }, { $set: { hand: req.body.hand+1, turn: req.body.next_uid, action: req.body.next_action } })
                                    .exec()
                                    .then(_ => {

                                        setTimeout(() => {
                                            server.io.emit(`${req.body.code}_next_hand`, {
                                                code: req.body.code,
                                            });
                                        }, 1500);

                                        res.status(201).json({
                                            success: true,
                                        });

                                    })
                                    .catch(err => console.log(err));

                            })
                            .catch(err => console.log(err));

                    })
                    .catch(err => console.log(err));

            })
            .catch(err => console.log(err));

    }

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

// Create new hands

exports.create_new_hands = (req, res, next) => {

    let arr = createHands(req.body.round+1);

    console.log("Array:", arr)

    let promises = arr.map(a => {

        let hand = new Hands({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.code,
            round: req.body.round+1,
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

function createHands(round) {

    let arr = [];
    let hands = rounds.filter(r => r.round === round)[0].amount;

    for (var i = 1; i <= hands; i++) {
        arr = [...arr, i];
    }

    return arr;

}

// Determine if last round

function is_last_round(round, hand) {

    let amount = rounds.filter(r => r.round === round)[0].amount;

    return hand === amount ? true : false;

}

// Make points

function sumPoints(results, players) {

    let newPoints = players.map(player => {
        return {
            ...player,
            points: addPoints(player.uid, player.points, results),
        }
    });

    return newPoints;

}

function addPoints(uid, points, results) {

    let find = results.filter(result => {
        return result.uid === uid;
    });

    let user = find[0];

    if (user.wins === user.won) {
        return points+user.won+5;
    } else {
        return points+user.won;
    }

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