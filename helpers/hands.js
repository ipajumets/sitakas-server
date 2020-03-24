// How many hands in this round?
exports.createHands = (round, rounds) => {

    let arr = [];
    let hands = rounds.filter(r => r.round === round)[0].amount;

    for (var i = 1; i <= hands; i++) {
        arr = [...arr, i];
    }

    return arr;

}