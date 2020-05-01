let express = require("express");
let router = express.Router();

let controller = require("../controllers/messages");

router.get("/all", controller.return_all);

router.get("/all-for/:rid", controller.return_all_room_messages);

router.post("/add-message", controller.add_message);

router.delete("/delete/:id", controller.delete_a_message);

router.delete("/delete-all", controller.delete_all_messages);

module.exports = router;