let express = require("express");
let router = express.Router();

let controller = require("../controllers/rounds");
let gamesController = require("../controllers/games");

router.get("/all", controller.return_all);

router.post("/create-round", controller.create_round);

router.post("/get-round", controller.get_round);

router.post("/add-bet/:code", gamesController.find_game, controller.find_round, gamesController.get_players, controller.add_bet);

router.delete("/delete-all", controller.delete_all_rounds);

module.exports = router;