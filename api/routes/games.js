let express = require("express");
let router = express.Router();

let controller = require("../controllers/games");
let roomsController = require("../controllers/rooms");
let usersController = require("../controllers/users");
let roundsController = require("../controllers/rounds");
let handsController = require("../controllers/hands");
let cardsController = require("../controllers/cards");

router.get("/all", controller.return_all);

router.get("/return/:code", controller.get_game);

router.get("/create-game/:code", usersController.get_all_players_from_room, roomsController.change_room_state, controller.create_game, cardsController.divide_cards, roundsController.create_round, handsController.create_hands);

router.get("/get-game-data/:code/:uid", roomsController.get_room_data, usersController.check_if_player, controller.get_game, roundsController.get_previous_round, roundsController.get_round, handsController.get_previous_hand, handsController.get_hand, cardsController.get_my_cards);

router.delete("/delete-all", controller.delete_all_games);

router.delete("/delete/:id", controller.delete_a_game);

module.exports = router;