const mongoose = require("mongoose");

const cardsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    room_code: { type: String, required: true },
    uid: { type: String, required: true },
    round: { type: Number, required: true },
    active: { type: [{ value: Number, suit: String }], required: true },
    not_active: { type: [{ value: Number, suit: String }], required: true },
});

module.exports = mongoose.model("Cards", cardsSchema);