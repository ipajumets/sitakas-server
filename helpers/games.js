// Constants
let constants = require("../constants");

// Get random image for profile
exports.getRandomImage = (index) => {

    if (index === 0) {
        return constants.images_1_player[Math.floor(Math.random() * constants.images_1_player.length)];
    } else if (index === 1) {
        return constants.images_2_player[Math.floor(Math.random() * constants.images_2_player.length)];
    } else if (index === 2) {
        return constants.images_3_player[Math.floor(Math.random() * constants.images_3_player.length)];
    } else if (index === 3) {
        return constants.images_4_player[Math.floor(Math.random() * constants.images_4_player.length)];
    } else {
        return constants.images_1_player[Math.floor(Math.random() * constants.images_1_player.length)];
    }
 
}