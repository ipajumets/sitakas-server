// Constants
let constants = require("../constants");

// Get random image for profile
exports.getRandomImage = (index) => {

    if (index === 0) {
        return constants.images_1_player[Math.floor(Math.random() * constants.images_1_player.length)].image;
    } else if (index === 1) {
        return constants.images_2_player[Math.floor(Math.random() * constants.images_2_player.length)].image;
    } else if (index === 2) {
        return constants.images_3_player[Math.floor(Math.random() * constants.images_3_player.length)].image;
    } else if (index === 3) {
        return constants.images_4_player[Math.floor(Math.random() * constants.images_4_player.length)].image;
    } else if (index === 4) {
        return constants.images_5_player[Math.floor(Math.random() * constants.images_5_player.length)].image;
    } else {
        return constants.images_1_player[Math.floor(Math.random() * constants.images_1_player.length)].image;
    }
 
}

// Sum player points after round ends
exports.sumPoints = (results, players) => {

    let newPoints = players.map(player => {
        return {
            ...player,
            points: addPoints(player.uid, player.points, results),
        }
    });

    return newPoints;

}

let addPoints = (uid, points, results) => {

    let find = results.filter(result => {
        return result.uid === uid;
    });

    let user = find[0];

    if (user.wins === user.won) {
        return points+user.won+5;
    } else {
        return points+user.won;
    }

}