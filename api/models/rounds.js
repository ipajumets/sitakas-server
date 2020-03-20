const mongoose = require("mongoose");

const roundsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    room_code: { type: String, required: true },
    results: { type: [{ uid: String, wins: Number, won: Number }], required: true },
    round: { type: Number, required: true },
});

module.exports = mongoose.model("Rounds", roundsSchema);