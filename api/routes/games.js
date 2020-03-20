let express = require("express");
let router = express.Router();

let controller = require("../controllers/games");

router.get("/all", controller.return_all);

router.get("/return/:code", controller.get_game);

router.post("/create-game", controller.create_game, controller.create_first_round, controller.create_first_round_hands, controller.divide_first_round_cards);

module.exports = router;