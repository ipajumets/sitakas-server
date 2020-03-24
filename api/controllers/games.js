let mongoose = require("mongoose");
let server = require("../../Server");

// Models
let Games = require("../models/games");

// Helpers
let helpers = require("../../helpers/games");

// Get all games
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

// Get one game
exports.get_game = (req, res) => {

    Games.findOne({ room_code: req.params.code })
        .select("_id room_code players round hand dealer turn action trump")
        .exec()
        .then(game => {
            res.status(201).json({
                _id: game._id,
                room_code: game.room_code,
                players: game.players,
                round: game.round,
                hand: game.dealer,
                turn: game.turn,
                action: game.action,
                trump: game.trump,
            });
        })
        .catch(err => console.log(err));

}

// Create new game
exports.create_game = (req, res, next) => {

    let game = new Games({
        _id: new mongoose.Types.ObjectId(),
        room_code: req.body.code,
        players: req.body.players.map((player, index) => {
            return {
                uid: player.browser_id,
                image: helpers.getRandomImage(index),
                name: player.name,
                points: 0,
            };
        }),
        round: req.body.round,
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

// Set trump card and start game
exports.set_trump_card_and_start_game = (req, res) => {

    Games.updateOne({ room_code: req.body.code }, { $set: { trump: req.body.trump } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.body.code}_started`, {
                code: req.body.code,
            });

            res.status(201).json({
                success: true,
                message: "Game has started",
            });

        })
        .catch(err => console.log(err));

}