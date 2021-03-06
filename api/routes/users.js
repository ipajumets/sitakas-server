let express = require("express");
let router = express.Router();

let controller = require("../controllers/users");
let roomsController = require("../controllers/rooms");

router.get("/all", controller.return_all);

router.post("/join-room", controller.check_max_players, controller.join_room);

router.post("/check-my-waiting-status", controller.check_my_waiting_status);

router.post("/update-status/:code/:uid", controller.update_is_ready);

router.post("/update-socket/:code/:uid", controller.update_socket);

router.post("/leave-room/:code", controller.leave_room, roomsController.check_if_new_host_needed, roomsController.make_new_host);

router.delete("/delete-all", controller.delete_all_users);

module.exports = router;