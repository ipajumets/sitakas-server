let express = require("express");
let router = express.Router();

let controller = require("../controllers/rooms");

router.get("/all", controller.return_all);

router.get("/public", controller.return_public_games);

router.post("/create-new-room", controller.create_new_room);

router.post("/update-privacy/:code", controller.update_privacy);

router.post("/update-max-players/:code", controller.update_max_players);

router.delete("/delete-all", controller.delete_all_rooms);

module.exports = router;