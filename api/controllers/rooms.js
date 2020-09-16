let mongoose = require("mongoose");
let server = require("../../Server");

// Models
const Rooms = require("../models/rooms");
const Users = require("../models/users");

// Helpers
const helpers = require("../../helpers/rooms");
const globalHelpers = require("../../helpers/global");

Date.prototype.addMinutes = function(minutes) {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
};

// Get all rooms
exports.return_all = (req, res) => {

    Rooms.find({}).sort({ $natural: -1 })
        .select("_id code host_browser_id state dateCreated privacy jokers maxPlayers sport")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                count: docs.length,
                data: docs.slice(0, 20).map(doc => {
                    return {
                        _id: doc._id,
                        code: doc.code,
                        host: doc.host_browser_id,
                        state: doc.state,
                        created: globalHelpers.timeSince(doc.dateCreated),
                        privacy: doc.privacy,
                        jokers: doc.jokers,
                        maxPlayers: doc.maxPlayers,
                        sport: doc.sport,
                    };
                }),
            });
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                err: err,
            });
        });

}

let get_public_room_players = (room) => {

    return Users.find({ room_code: room.code })
        .select("_id name")
        .exec()
        .then(users => {
            return {
                _id: room._id,
                code: room.code,
                host: room.host_browser_id,
                state: room.state,
                created: room.dateCreated,
                privacy: room.privacy,
                jokers: room.jokers,
                maxPlayers: room.maxPlayers,
                players: users.map(user => {
                    return {
                        _id: user._id,
                        name: user.name,
                    };
                }),
                sport: room.sport,
            };
        })
        .catch(err => {
            console.log(err);
            return {};
        });

}

// Get all rooms
exports.return_public_games = (req, res) => {

    let now = new Date(),
        limit = now.addMinutes(-45);

    Rooms.find({ privacy: "public", state: "pre", dateCreated: { $gte: limit } }).sort({ $natural: -1 })
        .select("_id code host_browser_id state dateCreated privacy jokers maxPlayers sport")
        .exec()
        .then(docs => {
            let promises = docs.map(doc => {
                return get_public_room_players(doc);
            });
            Promise.all(promises)   
                .then(result => {
                    res.status(201).json({
                        success: true,
                        count: result.length,
                        rooms: result,
                    });
                });
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                err: err,
            });
        });

}

// Get room data
exports.get_room_data = (req, res, next) => {

    Rooms.findOne({ code: req.params.code })
        .select("_id code host_browser_id state dateCreated privacy jokers maxPlayers sport")
        .exec()
        .then(room => {
            if (room) {
                req.body.room = {
                    _id: room._id,
                    code: room.code,
                    host_browser_id: room.host_browser_id,
                    state: room.state,
                    created: globalHelpers.timeSince(room.dateCreated),
                    privacy: room.privacy,
                    jokers: room.jokers,
                    maxPlayers: room.maxPlayers,
                    sport: room.sport,
                };
                next();
            } else {
                res.status(201).json({
                    room: null,
                });
            }
        })
        .catch(err => {
            res.status(500).json({
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
            res.status(500).json({
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
        privacy: "private",
        jokers: false,
        maxPlayers: 4,
        sport: "basketball",
    });

    room.save()
        .then(added => {
            res.status(201).json({
                success: true,
                data: added,
            });
        })
        .catch(err => {
            res.status(500).json({
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

// Update room privacy
exports.update_privacy = (req, res) =>  {

    Rooms.updateOne({ code: req.params.code }, { $set: { privacy: req.body.privacy } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.params.code}_privacy_updated`, {
                privacy: req.body.privacy,
            });
            server.io.emit("refresh_public_rooms_list");

            res.status(201).json({
                success: true,
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

// Update room jokers
exports.update_jokers = (req, res) =>  {

    Rooms.updateOne({ code: req.params.code }, { $set: { jokers: req.body.jokers } })
        .exec()
        .then(_ => { 

            server.io.emit(`${req.params.code}_jokers_updated`, {
                jokers: req.body.jokers,
            });
            server.io.emit("refresh_public_rooms_list");

            res.status(201).json({
                success: true,
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

// Update room max players
exports.update_max_players = (req, res, next) =>  {

    Rooms.updateOne({ code: req.params.code }, { $set: { maxPlayers: req.body.amount } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.params.code}_max_players_updated`, {
                amount: req.body.amount,
            });
            server.io.emit("refresh_public_rooms_list");

            res.status(201).json({
                success: true,
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

// Update room sport
exports.update_sport = (req, res, next) =>  {

    Rooms.updateOne({ code: req.params.code }, { $set: { sport: req.body.sport } })
        .exec()
        .then(_ => {

            server.io.emit(`${req.params.code}_sport_updated`, {
                sport: req.body.sport,
            });
            server.io.emit("refresh_public_rooms_list");

            res.status(201).json({
                success: true,
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