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

    let gameOver = isGameOver(req.body.game.players.length, req.body.game.round);

    Cards.findOne({ room_code: req.body.code, round: gameOver ? req.body.game.round-1 : req.body.game.round, uid: req.body.user.browser_id })
        .select("_id room_code uid round active not_active")
        .exec()
        .then(card => {
            if (card) {
                req.body.myCards = {
                    _id: card._id,
                    room_code: card.room_code,
                    uid: card.uid,
                    round: card.round,
                    active: card.active,
                    not_active: card.not_active,
                };

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

            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: req.body.game,
                    game: {
                        ...req.body.game,
                        round: gameOver ? req.body.game.round-1 : req.body.game.round,
                        over: gameOver,
                    },
                    round: req.body.round,
                    previousRound: req.body.previousRound,
                    previousHand: req.body.previousHand,
                    hand: req.body.hand,
                    myCards: null,
                });
            }
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
            uid: player.browser_id ? player.browser_id : player.uid,
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

            let random_card,
                trump_card;

            if (deck_of_cards.length < 1) {
                random_card = constants.trumps[Math.floor(Math.random() * constants.trumps.length)];
            } else {
                random_card = deck_of_cards[Math.floor(Math.random() * deck_of_cards.length)];
            }

            trump_card = { value: random_card.value, suit: random_card.suit },
            req.body.trump = trump_card;

            next();

        });

}

// Remove card
exports.remove_card = (req, res, next) => {

    Cards.updateOne({ room_code: req.body.code, uid: req.body.uid, round: req.body.round }, { $pull: { active: { value: req.body.value, suit: req.body.suit } }, $addToSet: { not_active: { value: req.body.value, suit: req.body.suit } } })
        .then(_ => {
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

    if (players === 6 && round > 26) {
        return true;
    }

    return false;

}