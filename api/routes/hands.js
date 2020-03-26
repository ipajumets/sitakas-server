let express = require("express");
let router = express.Router();

let controller = require("../controllers/hands");
let cardsController = require("../controllers/cards");
let gamesController = require("../controllers/games");
let roundsController = require("../controllers/rounds");

router.get("/all", controller.return_all);

router.post("/get-hand", controller.get_hand);

router.post("/bugs/create-new-hand", controller.create_new_hand);

router.post("/add-card", controller.add_card, cardsController.remove_card, gamesController.set_next_turn);

router.post("/add-last-card", controller.add_last_card, cardsController.remove_card, roundsController.update_results, gamesController.update_game_after_finishing_hand, roundsController.create_round, controller.create_hands, cardsController.divide_cards, gamesController.set_trump_card_and_continue);

module.exports = router;