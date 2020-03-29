// Constants
let constants = require("../constants");

// Get game rounds structure
exports.getGameRoundsStructure = (playersLength) => {

    switch (playersLength) {

        case 3:
            return constants.rounds_3_players;
        case 4:
            return constants.rounds_4_players;
        case 5:
            return constants.rounds_5_players;
        case 6:
            return constants.rounds_6_players;
        case 7:
            return "";
        default:
            return "";

    }

}