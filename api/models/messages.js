const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    rid: { type: String, required: true },
    uid: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    created: { type: Date, required: true },
});

module.exports = mongoose.model("Message", messageSchema);