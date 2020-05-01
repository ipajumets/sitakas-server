let mongoose = require("mongoose");
let server = require("../../Server");

// Models
let Messages = require("../models/messages");

// Get all messages
exports.return_all = (req, res) => {

    Messages.find({}).limit(20).sort({ $natural: -1 })
        .select("_id rid uid name text created")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                count: docs.length,
                data: docs.map(doc => {
                    return {
                        _id: doc._id,
                        rid: doc.rid,
                        uid: doc.uid,
                        name: doc.name,
                        text: doc.text,
                        created: doc.created,
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

// Get all messages
exports.return_all_room_messages = (req, res) => {

    Messages.find({ rid: req.params.rid })
        .select("_id rid uid name text created")
        .exec()
        .then(docs => {
            res.status(201).json({
                success: true,
                count: docs.length,
                data: docs.map(doc => {
                    return {
                        _id: doc._id,
                        rid: doc.rid,
                        uid: doc.uid,
                        name: doc.name,
                        text: doc.text,
                        created: doc.created,
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

// Add message
exports.add_message = (req, res) => {

    let message = new Messages({
        _id: new mongoose.Types.ObjectId(),
        rid: req.body.rid,
        uid: req.body.uid,
        name: req.body.name,
        text: req.body.text,
        created: new Date().toISOString(),
    });

    message.save()
        .then(_ => {

            server.io.emit(`message_${req.body.rid}`, {
                rid: req.body.rid,
                uid: req.body.uid,
                name: req.body.name,
                text: req.body.text,
                created: new Date().toISOString(),
            });

            res.status(201).json({
                success: true,
                message: "Sõnum edukalt lisatud...",
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

// Delete all messages
exports.delete_all_messages = (req, res) => {

    Messages.deleteMany({})
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}

// Delete a message
exports.delete_a_message = (req, res) => {

    Messages.deleteOne({ _id: req.params.id })
        .exec()
        .then(_ => {
            res.status(201).json({
                success: true,
            });
        })  
        .catch(err => console.log(err));

}