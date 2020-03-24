// Constants
let constants = require("../constants");

// Get game rounds structure
exports.getGameRoundsStructure = (playersLength) => {

    switch (playersLength) {

        case 3:
            return "";
        case 4:
            return constants.rounds_4_players;
        case 5:
            return "";
        case 6:
            return "";
        case 7:
            return "";
        default:
            return "";

    }

}