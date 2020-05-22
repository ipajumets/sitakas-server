require("dotenv/config");

const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

let rooms_router = require("./api/routes/rooms");
let users_router = require("./api/routes/users");
let games_router = require("./api/routes/games");
let rounds_router = require("./api/routes/rounds");
let hands_router = require("./api/routes/hands");
let cards_router = require("./api/routes/cards");
let messages_router = require("./api/routes/messages");

// mongoose.connect("mongodb+srv://ipajumets:"+process.env.MONGO_PW+"@cluster0-pg1n6.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true });

/* Connect to MongoDB */
mongoose.connect(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_SECRET}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}`, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true })
    .then(_ => {
        console.log("Database connected!");
    })
    .catch(err => console.log(err));

mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

app.enable("trust proxy");

app.use("/api/rooms", rooms_router);
app.use("/api/users", users_router);
app.use("/api/games", games_router);
app.use("/api/rounds", rounds_router);
app.use("/api/hands", hands_router);
app.use("/api/cards", cards_router);
app.use("/api/messages", messages_router);

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: true,
        error_message: {
            message: error.message,
            status: error.status,
        }
    });
});

module.exports = app;