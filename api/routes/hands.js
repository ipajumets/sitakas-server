let express = require("express");
let router = express.Router();

let controller = require("../controllers/hands");

router.get("/all", controller.return_all);

router.post("/get-hand", controller.get_hand);

router.post("/add-card", controller.add_card);

// router.post("/add-last-card", controller.add_last_card, controller.create_new_round, controller.create_new_hands, controller.divide_cards);

module.exports = router;