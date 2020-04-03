let mongoose = require("mongoose");
let server = require("../../Server");

// Models
const Users = require("../models/users");
const Rooms = require("../models/rooms");

// Helpers
const globalHelpers = require("../../helpers/global");

// Get all users
exports.return_all = (req, res) => {

    Users.find({}).limit(50).sort({ $natural: -1 })
        .select("_id browser_id room_code name dateCreated")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                count: docs.length,
                data: docs.map(doc => {
                    return {
                        _id: doc._id,
                        code: doc.room_code,
                        uid: doc.browser_id,
                        name: doc.name,
                        created: globalHelpers.timeSince(doc.dateCreated),
                    };
                }),
            });
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Join room
exports.join_room = (req, res) => {

    let user = new Users({
        _id: new mongoose.Types.ObjectId(),
        browser_id: req.body.id,
        room_code: req.body.code,
        name: req.body.name,
        dateCreated: new Date().toISOString(),
    });

    user.save()
        .then(added => {

            Users.find({ room_code: req.body.code })
                .select("_id browser_id room_code name dateCreated")
                .exec()
                .then(players => {

                    server.io.emit(`${req.body.code}_joined`, {
                        data: added,
                    });

                    res.status(201).json({
                        success: true,
                        user: added,
                        players: players,
                    });

                })
                .catch(err => console.log(err));

        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Leave room
exports.leave_room = (req, res, next) => {

    Users.deleteOne({ browser_id: req.body.id, room_code: req.params.code })
        .exec()
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

// Check if player is in this room?
exports.check_if_player = (req, res, next) => {

    Users.findOne({ room_code: req.params.code, browser_id: req.params.uid })
        .select("_id browser_id room_code name dateCreated")
        .exec()
        .then(user => {
            if (user) {
                req.body.user = {
                    _id: user._id,
                    browser_id: user.browser_id,
                    name: user.name,
                    dateCreated: globalHelpers.timeSince(user.dateCreated),
                };
                next();
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: null,
                });
            }
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Check my status
exports.check_my_waiting_status = (req, res) => {

    Rooms.findOne({ code: req.body.code })
        .select("_id code host_browser_id state dateCreated")
        .exec()
        .then(room => {

            if (room) {

                Users.findOne({ browser_id: req.body.id, room_code: req.body.code })
                    .select("_id browser_id room_code name dateCreated")
                    .exec()
                    .then(doc => {
                        if (doc) {

                            Users.find({ room_code: req.body.code })
                                .select("_id browser_id room_code name dateCreated")
                                .exec()
                                .then(players => {

                                    res.status(201).json({
                                        room: room,
                                        user: doc,
                                        players: players,
                                    });

                                })
                                .catch(err => console.log(err));

                        } else {
                            res.status(201).json({
                                room: room,
                            });
                        }
                    })
                    .catch(err => {
                        res.status(403).json({
                            success: false,
                            err: err,
                        });
                    });

            } else {
                res.status(201).json({
                    room: null,
                });
            }

        })
        .catch(err => console.log(err));

}

// Get all players
exports.get_all_players_from_room = (req, res, next) => {

    Users.find({ room_code: req.params.code })
        .select("_id browser_id name dateCreated")
        .exec()
        .then(docs => {
            req.body.players = docs.map(doc => {
                return {
                    uid: doc.browser_id,
                    name: doc.name,
                    dateCreated: globalHelpers.timeSince(doc.dateCreated),
                };
            }),
            req.body.state = "game_on";
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

// Delete all cards
exports.delete_all_users = (req, res) => {

    Users.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}