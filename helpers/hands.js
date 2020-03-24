// How many hands in this round?
exports.createHands = (round, rounds) => {

    let arr = [];
    let hands = rounds.filter(r => r.round === round)[0].amount;

    for (var i = 1; i <= hands; i++) {
        arr = [...arr, i];
    }

    return arr;

}

// Is this last hand of the round?
exports.isLastHandOfTheRound = (round, hand, rounds) => {

    let amount = rounds.filter(r => r.round === round)[0].amount;

    return hand === amount;

}