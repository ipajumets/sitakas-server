const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    code: { type: String, required: true },
    host_browser_id: { type: String, required: true },
    state: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    privacy: { type: String, required: true },
    maxPlayers: { type: Number, required: true },
});

module.exports = mongoose.model("Rooms", roomSchema);