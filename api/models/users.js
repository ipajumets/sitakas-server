const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    browser_id: { type: String, required: true },
    room_code: { type: String, required: true },
    name: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    isReady: { type: Boolean, required: true },
    socket: { type: String },
    active: { type: Boolean },
});

module.exports = mongoose.model("Users", userSchema);