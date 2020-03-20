const mongoose = require("mongoose");

const gamesSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    room_code: { type: String, required: true },
    players: { type: [{ uid: String, image: String, name: String, points: Number }], required: true },
    round: { type: Number, required: true },
    hand: { type: Number, required: true },
    dealer: { type: String, required: true },
    turn: { type: String, required: true },
    action: { type: String, required: true },
    trump: { type: { value: Number, suit: String } },
});

module.exports = mongoose.model("Games", gamesSchema);