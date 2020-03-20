let express = require("express");
let router = express.Router();

let controller = require("../controllers/cards");

router.get("/all", controller.get_all_cards);

router.post("/get-my-cards", controller.get_my_cards);

router.post("/divide-cards", controller.divide_cards);

module.exports = router;