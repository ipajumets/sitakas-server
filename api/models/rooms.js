const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    code: { type: String, required: true },
    host_browser_id: { type: String, required: true },
    state: { type: String, required: true },
});

module.exports = mongoose.model("Rooms", roomSchema);