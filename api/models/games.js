const mongoose = require("mongoose");

const gamesSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    room_code: { type: String, required: true },
    players: { type: [{ uid: String, image: String, name: String, points: Number }], required: true },
    jokers: { type: Boolean, required: true },
    round: { type: Number, required: true },
    hand: { type: Number, required: true },
    dealer: { type: String, required: true },
    isOver: { type: Boolean, required: true },
    dateCreated: { type: Date, required: true },
});

module.exports = mongoose.model("Games", gamesSchema);