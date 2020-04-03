let express = require("express");
let router = express.Router();

let controller = require("../controllers/hands");
let cardsController = require("../controllers/cards");
let gamesController = require("../controllers/games");
let roundsController = require("../controllers/rounds");

router.get("/all", controller.return_all);

router.post("/get-hand", controller.get_hand);

router.post("/bugs/create-new-hand", controller.create_new_hand);

router.post("/add-card/:code", gamesController.find_game, roundsController.find_round, controller.find_hand, controller.add_card, cardsController.remove_card, roundsController.update_round, gamesController.update_game, cardsController.divide_cards, roundsController.create_round, controller.create_hands);

router.delete("/delete-all", controller.delete_all_hands);

module.exports = router;