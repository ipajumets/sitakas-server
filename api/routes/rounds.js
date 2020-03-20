let express = require("express");
let router = express.Router();

let controller = require("../controllers/rounds");

router.get("/all", controller.return_all);

router.post("/create-round", controller.create_round);

router.post("/get-round", controller.get_round);

router.post("/add-bet", controller.add_bet);

module.exports = router;