let mongoose = require("mongoose");
let server = require("../../Server");

// Models
const Rooms = require("../models/rooms");
const Users = require("../models/users");

// Helpers
const helpers = require("../../helpers/rooms");
const globalHelpers = require("../../helpers/global");

// Get all rooms
exports.return_all = (req, res) => {

    Rooms.find({}).limit(20).sort({ $natural: -1 })
        .select("_id code host_browser_id state dateCreated")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                count: docs.length,
                data: docs.map(doc => {
                    return {
                        _id: doc._id,
                        code: doc.code,
                        host: doc.host_browser_id,
                        state: doc.state,
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

// Get room data
exports.get_room_data = (req, res, next) => {

    Rooms.findOne({ code: req.params.code })
        .select("_id code host_browser_id state dateCreated")
        .exec()
        .then(room => {
            if (room) {
                req.body.room = {
                    _id: room._id,
                    code: room.code,
                    host_browser_id: room.host_browser_id,
                    state: room.state,
                    created: globalHelpers.timeSince(room.dateCreated),
                };
                next();
            } else {
                res.status(201).json({
                    room: null,
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

// Change room state
exports.change_room_state = (req, res, next) => {

    Rooms.updateOne({ code: req.params.code }, { $set: { state: req.body.state } })
        .exec()
        .then(_ => {
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

// Check if new host needed
exports.check_if_new_host_needed = (req, res, next) => {

    Rooms.findOne({ code: req.params.code })
        .select("_id host_browser_id")
        .exec()
        .then(room => {
            if (room.host_browser_id !== req.body.id) {

                server.io.emit(`${req.params.code}_left`, {
                    data: {
                        id: req.body.id,
                    }
                });
                res.status(201).json({
                    success: true,
                });

            } else {
                next();
            }   
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Check if new host needed
exports.make_new_host = (req, res) => {

    Users.find({ room_code: req.params.code })
        .select("_id browser_id")
        .exec()
        .then(users => {
            if (users.length !== 0) {

                Rooms.updateOne({ code: req.params.code }, { $set: { host_browser_id: users[0].browser_id } })
                    .exec()
                    .then(_ => {

                        setTimeout(() => {
                            server.io.emit(`${req.params.code}_new_host`, {
                                data: {
                                    id: req.body.id,
                                },
                            });
                        }, 667);

                        res.status(201).json({
                            success: true,
                        }); 

                    })
                    .catch(err => console.log(err));

            } else {

                Rooms.deleteOne({ code: req.params.code })
                    .exec()
                    .then(_ => {
                        res.status(201).json({
                            success: true,
                        });
                    })
                    .catch(err => console.log(err));

            }
        })
        .catch(err => console.log(err));

}

// Create new room
exports.create_new_room = (req, res) => {

    let room = new Rooms({
        _id: new mongoose.Types.ObjectId(),
        code: helpers.generateCode(6),
        host_browser_id: req.body.id,
        state: "pre",
        dateCreated: new Date().toISOString(),
    });

    room.save()
        .then(added => {
            res.status(201).json({
                success: true,
                data: added,
            });
        })
        .catch(err => {
            res.status(403).json({
                success: false,
                err: err,
            });
        });

}

// Delete all cards
exports.delete_all_rooms = (req, res) => {

    Rooms.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}