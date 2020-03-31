const mongoose = require("mongoose");

const roundsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    room_code: { type: String, required: true },
    round: { type: Number, required: true },
    hand: { type: Number, required: true },
    results: { type: [
        { 
            uid: String,
            won: Number,
            wins: Number,
        }
    ], required: true },
    turn: { type: String, required: true },
    action: { type: String, required: true },
    trump: { type: { value: Number, suit: String }, required: true },
});

module.exports = mongoose.model("Rounds", roundsSchema);