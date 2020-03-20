let express = require("express");
let router = express.Router();

let controller = require("../controllers/users");

router.get("/all", controller.return_all);

router.post("/join-room", controller.join_room);

router.post("/check-my-waiting-status", controller.check_my_waiting_status);

router.post("/am-i-in", controller.am_i_in);

router.post("/double-check", controller.double_check);

router.post("/get-players/:code", controller.get_players);

router.post("/leave-room/:code", controller.leave_room);

module.exports = router;