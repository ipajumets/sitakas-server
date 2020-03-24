let express = require("express");
let router = express.Router();

let controller = require("../controllers/rooms");

router.get("/all", controller.return_all);

router.get("/check/:code", controller.check);

router.post("/create-new-room", controller.create_new_room);

module.exports = router;