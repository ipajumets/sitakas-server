let mongoose = require("mongoose");
let server = require("../../Server");

const Users = require("../models/users");
const Rooms = require("../models/rooms");

exports.return_all = (req, res) => {

    Users.find()
        .select("_id browser_id room_code name points active")
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

exports.join_room = (req, res) => {

    let user = new Users({
        _id: new mongoose.Types.ObjectId(),
        browser_id: req.body.id,
        room_code: req.body.code,
        name: req.body.name,
        points: 0,
        active: true,
    });

    user.save()
        .then(added => {

            Users.find({ room_code: req.body.code })
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

exports.check_my_waiting_status = (req, res) => {

    Rooms.findOne({ code: req.body.code })
        .select("_id code host_browser_id state")
        .exec()
        .then(room => {

            if (room) {

                Users.findOne({ browser_id: req.body.id, room_code: req.body.code })
                    .select("_id browser_id room_code name points active")
                    .exec()
                    .then(doc => {
                        if (doc) {

                            Users.find({ room_code: req.body.code })
                                .select("_id browser_id room_code name points active")
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

exports.double_check = (req, res) => {

    Users.findOne({ browser_id: req.body.id, room_code: req.body.code })
        .select("_id browser_id room_code name points active")
        .exec()
        .then(doc => {
            if (doc) {
                res.status(201).json({
                    success: true,
                    data: doc,
                });
            } else {
                res.status(201).json({
                    success: true,
                    data: null,
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

exports.get_players = (req, res) => {

    Users.find({ browser_id: { $ne: req.body.id }, room_code: req.params.code })
        .select("_id browser_id room_code name points active")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                data: docs,
            });
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

exports.leave_room = (req, res) => {

    Users.deleteOne({ browser_id: req.body.id, room_code: req.params.code })
        .exec()
        .then(_ => {

            server.io.emit(`${req.params.code}_left`, {
                data: {
                    id: req.body.id,
                }
            });

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

exports.am_i_in = (req, res) => {

    Users.findOne({ browser_id: req.body.id, room_code: req.body.code })
        .select("_id")
        .exec()
        .then(doc => {
            if (doc) {
                res.status(201).json({
                    success: true,
                });
            } else {
                res.status(201).json({
                    success: false,
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