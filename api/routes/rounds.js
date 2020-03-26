let express = require("express");
let router = express.Router();

let controller = require("../controllers/rounds");
let gamesController = require("../controllers/games");

router.get("/all", controller.return_all);

router.post("/create-round", controller.create_round);

router.post("/bugs/create-new-round", controller.create_new_round_for_bugs);

router.post("/get-round", controller.get_round);

router.post("/add-bet", controller.add_bet, gamesController.set_next_turn);

module.exports = router;