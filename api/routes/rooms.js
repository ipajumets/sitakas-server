let express = require("express");
let router = express.Router();

let controller = require("../controllers/rooms");

router.get("/all", controller.return_all);

router.get("/check/:code", controller.check);

router.post("/change-state/:code", controller.change_state);

router.post("/create-new-room", controller.create_new_room);

router.post("/onboarding/:code", controller.onboarding);

module.exports = router;