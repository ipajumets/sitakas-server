// Get random image for profile
exports.getRandomImage = (images) => {

    return images[Math.floor(Math.random() * images.length)].image;
 
}

// Sum player points after round ends
exports.sumPoints = (results, players) => {

    let newPoints = players.map(player => {
        return {
            uid: player.uid,
            image: player.image,
            name: player.name,
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

// Who is the next dealer?
exports.getNextDealer = (players, uid) => {

    const nextIndex = (players.findIndex(player => player.uid === uid))+1;

    if (players[nextIndex]) {
        return players[nextIndex].uid;
    } else {
        return players[0].uid;
    }

}

// Is it last round of the game?
exports.isLastRoundOfTheGame = (players, round) => {

    if (players === 3 && round === 29) {
        return true;
    }

    if (players === 4 && round === 26) {
        return true;
    }

    if (players === 5 && round === 25) {
        return true;
    }

    if (players === 6 && round === 26) {
        return true;
    }

    return false;

}