let mongoose = require("mongoose");

const Cards = require("../models/cards");

exports.get_all_cards = (req, res) => {

    Cards.find()
        .exec()
        .then(cards => {
            res.status(201).json({
                count: cards.length,
                cards,
            });
        })
        .catch(err => console.log(err));

}

exports.get_my_cards = (req, res) => {

    Cards.findOne({ room_code: req.body.code, round: req.body.round, uid: req.body.uid })
        .exec()
        .then(cards => {
            res.status(201).json(cards);
        })
        .catch(err => console.log(err));

}

exports.divide_cards = (req, res) => {

    let deck;
    deck = full_deck;

    let promises = req.body.players.map(player => {

        let result = shuffle(deck, req.body.round);
        deck = result.pack;

        let cards = new Cards({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.code,
            uid: player.browser_id,
            round: req.body.round,
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
            res.status(201).json(result);
        });

}

exports.divide_cards = (req, res) => {

    let deck;
    deck = full_deck;

    let promises = req.body.players.map(player => {

        let result = shuffle(deck, req.body.round);
        deck = result.pack;

        let cards = new Cards({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.code,
            uid: player.browser_id,
            round: req.body.round,
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
            res.status(201).json(result);
        });

}

// Functions

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