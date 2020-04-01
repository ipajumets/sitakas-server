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

// Remove card
exports.remove_card = (req, res, next) => {

    Cards.updateOne({ room_code: req.params.code, uid: req.body.card.uid, round: req.body.game.round }, { $pull: { active: { value: req.body.card.value, suit: req.body.card.suit } }, $addToSet: { not_active: { value: req.body.card.value, suit: req.body.card.suit } } })
        .then(_ => {
            next();
        })
        .catch(err => console.log(err));

}

// v2 callbacks

// Divide cards
exports.divide_cards = (req, res, next) => {

    let deck_of_cards;
        deck_of_cards = constants.deck_of_cards,
        rounds = globalHelpers.getGameRoundsStructure(req.body.players.length);

    const promises = req.body.players.map(player => {

        let result = cardsHelpers.shuffle(deck_of_cards, req.body.round, rounds);
            deck_of_cards = result.pack;

        const cards = new Cards({
            _id: new mongoose.Types.ObjectId(),
            room_code: req.params.code,
            uid: player.uid,
            round: req.body.round,
            active: result.my_cards,
            not_active: [],
        });
    
        return cards.save()
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

            let random_card,
                trump_card;

            if (deck_of_cards.length < 1) {
                random_card = constants.trumps[Math.floor(Math.random() * constants.trumps.length)];
            } else {
                random_card = deck_of_cards[Math.floor(Math.random() * deck_of_cards.length)];
            }

            trump_card = { value: random_card.value, suit: random_card.suit },
            req.body.trump = trump_card;

            console.log("Kaardid jagatud");
            return next();

        });

}

// Get my cards
exports.get_my_cards = (req, res) => {

    let gameOver = globalHelpers.isGameOver(req.body.game.players.length, req.body.game.round);

    Cards.findOne({ room_code: req.params.code, round: gameOver ? req.body.game.round-1 : req.body.game.round, uid: req.params.uid })
        .select("_id room_code uid round active not_active")
        .exec()
        .then(card => {
            req.body.myCards = card ? {
                _id: card._id,
                room_code: card.room_code,
                uid: card.uid,
                round: card.round,
                active: card.active,
                not_active: card.not_active,
            } : null;

            res.status(201).json({
                room: req.body.room,
                user: req.body.user,
                game: {
                    ...req.body.game,
                    round: gameOver ? req.body.game.round-1 : req.body.game.round,
                    over: gameOver,
                },
                previousRound: req.body.previousRound,
                round: req.body.round,
                previousHand: req.body.previousHand,
                hand: req.body.hand,
                myCards: req.body.myCards,
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

// Delete all cards
exports.delete_all_cards = (req, res) => {

    Cards.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}