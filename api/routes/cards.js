let express = require("express");
let router = express.Router();

let controller = require("../controllers/cards");
let gamesController = require("../controllers/games");

router.get("/all", controller.get_all_cards);

router.post("/get-my-cards", controller.get_my_cards);

router.post("/divide-cards", controller.divide_cards);

router.post("/bugs/divide-cards", controller.divide_cards, gamesController.set_trump_card_and_continue);

router.delete("/delete-all", controller.delete_all_cards);

module.exports = router;