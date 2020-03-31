const constants = require("../constants");

// Is this last hand of the round?
exports.lastPlayerToBet = (bets, players) => {

    if (bets.length+1 !== players.length) {
        return false;
    } else {
        return true;
    }

}

// How many cards in hand?
exports.getCardsInRound = (players, round) => {

    return constants[`rounds_${players}_players`].filter(r => r.round === round)[0].amount;

}

// Who is the next player to move?
exports.getNextPlayer = (players, uid) => {

    const nextIndex = (players.findIndex(player => player.uid === uid))+1;

    if (players[nextIndex]) {
        return players[nextIndex].uid;
    } else {
        return players[0].uid;
    }

}

// What is the next action?
exports.getNextAction = (lastPlayerToBet) => {

    return lastPlayerToBet ? "call" : "guess";

}

// Is it the last hand of the round?
exports.lastHandOfTheRound = (players, round, hand) => {

    let maxHands = constants[`rounds_${players}_players`].filter(r => r.round === round)[0].amount,
        lastHand = maxHands === hand;

    return lastHand;

}