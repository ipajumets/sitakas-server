const mongoose = require("mongoose");

const handsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    room_code: { type: String, required: true },
    round: { type: Number, required: true },
    hand: { type: Number, required: true },
    cards: { type: [{ uid: String, value: Number, suit: String }], required: true },
    base: { type: { uid: String, value: Number, suit: String } },
    winner: { type: { uid: String, value: Number, suit: String } },
});

module.exports = mongoose.model("Hands", handsSchema);