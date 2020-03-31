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

// Is game over?
exports.isGameOver = (players, round) => {

    if (players === 3 && round > 29) {
        return true;
    }

    if (players === 4 && round > 26) {
        return true;
    }

    if (players === 5 && round > 25) {
        return true;
    }

    if (players === 6 && round > 26) {
        return true;
    }

    return false;

}