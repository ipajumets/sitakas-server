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
        .select("_id browser_id room_code name dateCreated isReady socket active")
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
                        isReady: doc.isReady,
                        socket: doc.socket,
                        active: doc.active,
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

exports.check_max_players = (req, res, next) => {

    Users.find({ room_code: req.body.code }, (err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err,
            });
        }
        Rooms.findOne({ code: req.body.code }, (err, room) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err,
                });
            }

            if (room.maxPlayers === users.length) {
                return res.status(201).json({
                    exceeded: true,
                });
            } else {
                next();
            }

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
        isReady: false,
    });

    user.save()
        .then(added => {

            Users.find({ room_code: req.body.code })
                .select("_id browser_id room_code name dateCreated isReady")
                .exec()
                .then(players => {

                    server.io.emit(`${req.body.code}_joined`, {
                        data: added,
                    });
                    server.io.emit("refresh_public_rooms_list");

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
            setTimeout(() => {
                server.io.emit("refresh_public_rooms_list");
            }, 1000);
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
        .select("_id browser_id room_code name dateCreated isReady")
        .exec()
        .then(user => {
            if (user) {
                req.body.user = {
                    _id: user._id,
                    browser_id: user.browser_id,
                    name: user.name,
                    dateCreated: globalHelpers.timeSince(user.dateCreated),
                    isReady: user.isReady,
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
        .select("_id code host_browser_id state dateCreated privacy jokers maxPlayers sport")
        .exec()
        .then(room => {

            if (room) {

                Users.findOne({ browser_id: req.body.id, room_code: req.body.code })
                    .select("_id browser_id room_code name dateCreated isReady")
                    .exec()
                    .then(doc => {
                        if (doc) {

                            Users.find({ room_code: req.body.code })
                                .select("_id browser_id room_code name dateCreated isReady")
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
        .select("_id browser_id name dateCreated isReady")
        .exec()
        .then(docs => {
            req.body.players = docs.map(doc => {
                return {
                    uid: doc.browser_id,
                    name: doc.name,
                    dateCreated: globalHelpers.timeSince(doc.dateCreated),
                    isReady: doc.isReady,
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

// Update readiness status
exports.update_is_ready = (req, res) => {

    Users.updateOne({ browser_id: req.params.uid, room_code: req.params.code }, { $set: { isReady: req.body.status } })
        .exec()
        .then(_ => {

            Users.find({ room_code: req.params.code })
                .select("_id browser_id name dateCreated isReady")
                .exec()
                .then(players => {

                    server.io.emit(`${req.params.code}_player_status_updated`, {
                        players: players.map(player => {
                            return {
                                uid: player.browser_id,
                                name: player.name,
                                dateCreated: globalHelpers.timeSince(player.dateCreated),
                                isReady: player.isReady,
                            };
                        }),
                    });

                    res.status(201).json({
                        success: true,
                    });
                })
                .catch(err => console.log(err));

        })  
        .catch(err => console.log(err));

}

// Update socket and active status
exports.update_socket = (data, sid, status) => {

    Users.updateOne({ browser_id: data.uid, room_code: data.code }, { $set: { socket: sid, active: status } })
        .exec()
        .then(_ => {
            Users.find({ room_code: data.code }, (err, users) => {
                if (err) return err;
                let connections = users.map(user => {
                    return {
                        _id: user._id,
                        uid: user.browser_id,
                        socket: user.socket,
                        active: user.active,
                    }
                });
                server.io.emit(`${data.code}_update_connections`, connections);
            }); 
        })
        .catch(err => console.log(err));

}

// Update socket and active status
exports.remove_socket = (sid) => {

    Users.findOneAndUpdate({ socket: sid }, { $set: { socket: null, active: false } })
        .exec()
        .then(result => {
            if (result) {
                Users.find({ room_code: result.room_code }, (err, users) => {
                    if (err) return err;
                    let connections = users.map(user => {
                        return {
                            _id: user._id,
                            uid: user.browser_id,
                            socket: user.socket,
                            active: user.active,
                        }
                    });
                    server.io.emit(`${result.room_code}_update_connections`, connections);
                });
            }
        })  
        .catch(err => console.log(err));

}

exports.get_users_with_status = (req, res, next) => {

    Users.find({ room_code: req.body.game.room_code })
        .select("_id browser_id socket active")
        .exec()
        .then(users => {
            if (users.length > 0) {
                req.body.users = users.map(user => {
                    return {
                        _id: user._id,
                        uid: user.browser_id,
                        socket: user.socket,
                        active: user.active,
                    }
                });
                next();
            } else {
                res.status(201).json({
                    room: req.body.room,
                    user: req.body.user,
                    game: req.body.game,
                    users: null,
                });
            }
        })
        .catch(err => console.log(err));

}