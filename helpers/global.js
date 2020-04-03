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

// Time since certain date
exports.timeSince = (d) => {

    var date = new Date(d);

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " aastat tagasi";
    } else if (interval === 1) {
        return interval + " aasta tagasi";
    }

    interval = Math.floor(seconds / 2592000);

    if (interval > 1) {
        return interval + " kuud tagasi";
    } else if (interval === 1) {
        return interval + " kuu tagasi";
    }

    interval = Math.floor(seconds / 86400);

    if (interval > 1) {
        return interval + " päeva tagasi";
    } else if (interval === 1) {
        return interval + " päev tagasi";
    }

    interval = Math.floor(seconds / 3600);

    if (interval > 1) {
        return interval + " tundi tagasi";
    } else if (interval === 1) {
        return interval + " tund tagasi";
    }

    interval = Math.floor(seconds / 60);

    if (interval > 1) {
        return interval + " minutit tagasi";
    } else if (interval === 1) {
        return interval + " minut tagasi";
    }

    if (Math.floor(seconds) === 0) {
        return "Just nüüd";
    }

    return Math.floor(seconds) + " sekundit tagasi";
  
}