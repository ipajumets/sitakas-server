let express = require("express");
let router = express.Router();

let controller = require("../controllers/games");
let roomsController = require("../controllers/rooms");
let roundsController = require("../controllers/rounds");
let handsController = require("../controllers/hands");
let cardsController = require("../controllers/cards");

router.get("/all", controller.return_all);

router.get("/return/:code", controller.get_game);

router.post("/create-game", roomsController.change_room_state, controller.create_game, roundsController.create_round, handsController.create_hands, cardsController.divide_cards, controller.set_trump_card_and_start_game);

module.exports = router;