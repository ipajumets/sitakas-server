let mongoose = require("mongoose");
let server = require("../../Server");

const Games = require("../models/games");
const Rounds = require("../models/rounds");
const Hands = require("../models/hands");
const Cards = require("../models/cards");

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

exports.get_game = (req, res) => {

    Games.findOne({ room_code: req.params.code })
        .select("_id room_code players round hand dealer turn action trump")
        .exec()
        .then(game => {
            res.status(201).json(game);
        })
        .catch(err => console.log(err));

}

exports.create_game = (req, res, next) => {

    let game = new Games({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.room_code,
        players: req.body.players.map((player, index) => {
            return {
                uid: player.browser_id,
                image: getRandomImage(index),
                name: player.name,
                points: 0,
            };
        }),
        round: 1,
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

// Create first round

exports.create_first_round = (req, res, next) => {

    let round = new Rounds({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.room_code,
        results: [],
        round: 1,
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

// Create first round

exports.create_first_round_hands = (req, res, next) => {

    let hand = new Hands({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.room_code,
        round: 1,
        hand: 1,
        cards: [],
        base: null,
        winner: null,
    });

    hand.save()
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

exports.divide_first_round_cards = (req, res) => {

    let deck;
    deck = full_deck;

    let promises = req.body.players.map(player => {

        let result = shuffle(deck, 1);
        deck = result.pack;

        let cards = new Cards({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.room_code,
            uid: player.browser_id,
            round: 1,
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

            let random_card = deck[Math.floor(Math.random() * deck.length)],
                trump_card = { value: random_card.value, suit: random_card.suit };
            

            Games.updateOne({ room_code: req.body.room_code }, { $set: { trump: trump_card } })
                .exec()
                .then(_ => {

                    server.io.emit(`${req.body.room_code}_started`, {
                        code: req.body.room_code,
                    });
        
                    res.status(201).json(result);

                })
                .catch(err => console.log(err));

        });

}

let getRandomImage = (index) => {

    if (index === 0) {
        return images_1[Math.floor(Math.random() * images_1.length)];
    } else if (index === 1) {
        return images_2[Math.floor(Math.random() * images_2.length)];
    } else if (index === 2) {
        return images_3[Math.floor(Math.random() * images_3.length)];
    } else if (index === 3) {
        return images_4[Math.floor(Math.random() * images_4.length)];
    } else {
        return images_1[Math.floor(Math.random() * images_1.length)];
    }
 
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

//  Images

let images_1 = [
    "https://i.imgur.com/wtwBZhy.jpg",
    "https://i.imgur.com/Wh1Slxo.jpg",
    "https://i.imgur.com/aStfDCv.jpg",
    "https://i.imgur.com/Atx0eSH.jpg",
    "https://i.imgur.com/1C5lU1K.jpg",
];

let images_2 = [
    "https://i.imgur.com/XsIreZQ.jpg",
    "https://i.imgur.com/Jfv555A.jpg",
    "https://i.imgur.com/zA02Ayt.jpg",
    "https://i.imgur.com/BdfcDd3.jpg",
    "https://i.imgur.com/7XJNep1.jpg",
];

let images_3 = [
    "https://i.imgur.com/lqFBpqZ.jpg",
    "https://i.imgur.com/hUrVYmd.jpg",
    "https://i.imgur.com/WaLUrQb.jpg",
    "https://i.imgur.com/sFcZJEx.jpg",
    "https://i.imgur.com/EbafOYv.jpg",
];

let images_4 = [
    "https://i.imgur.com/QKGgFFf.jpg",
    "https://i.imgur.com/LAU07FM.jpg",
    "https://i.imgur.com/yBodMJH.jpg",
    "https://i.imgur.com/HzH2eBI.jpg",
    "https://i.imgur.com/53XdKq5.jpg",
];