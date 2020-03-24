let mongoose = require("mongoose");

// Models
let Cards = require("../models/cards");

// Constants
let constants = require("../../constants");

// Helpers
let globalHelpers = require("../../helpers/global");
let cardsHelpers = require("../../helpers/cards");

// Get all cards
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

// Get my cards
exports.get_my_cards = (req, res) => {

    Cards.findOne({ room_code: req.body.code, round: req.body.round, uid: req.body.uid })
        .exec()
        .then(cards => {
            res.status(201).json(cards);
        })
        .catch(err => console.log(err));

}

// Divide cards
exports.divide_cards = (req, res, next) => {

    let deck_of_cards;
        deck_of_cards = constants.deck_of_cards,
        rounds = globalHelpers.getGameRoundsStructure(req.body.players.length);

    let promises = req.body.players.map(player => {

        let result = cardsHelpers.shuffle(deck_of_cards, req.body.round, rounds);
            deck_of_cards = result.pack;

        let cards = new Cards({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.body.code,
            uid: player.browser_id,
            round: req.body.round,
            active: result.my_cards,
            not_active: [],
        });
    
        return cards.save()
            .then(_ => {
                return;
            })
            .catch(err => {
                console.log(err);
                res.status(403).json({
                    success: false,
                    err: err,
                });
            });

    });

    Promise.all(promises)
        .then(_ => {

            let random_card = deck_of_cards[Math.floor(Math.random() * deck_of_cards.length)],
                trump_card = { value: random_card.value, suit: random_card.suit };
                req.body.trump = trump_card;

            next();

        });

}