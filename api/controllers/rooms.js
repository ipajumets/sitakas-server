let mongoose = require("mongoose");

// Models
const Rooms = require("../models/rooms");
const Users = require("../models/users");

// Get all rooms
exports.return_all = (req, res) => {

    Rooms.find()
        .select("_id code host_browser_id state")
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

// Change room state
exports.change_room_state = (req, res, next) => {

    Rooms.updateOne({ code: req.body.code }, { $set: { state: req.body.state } })
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



exports.check = (req, res) => {

    Rooms.findOne({ code: req.params.code })
        .select("_id code host_browser_id state")
        .exec()
        .then(result => {
            if (result) {
                res.status(201).json({
                    success: true,
                    data: result,
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

exports.create_new_room = (req, res) => {

    let room = new Rooms({
        _id: new mongoose.Types.ObjectId(),
        code: generateCode(6),
        host_browser_id: req.body.id,
        state: "pre",
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

// helpers

let generateCode = (length) => {

    let result = "";
    let characters = "0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;

}