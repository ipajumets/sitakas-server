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

// v2 helpers

// Is it the first card of the hand?
exports.firstCardOfTheHand = (cards) => {

    return cards.length < 1;

}

// Is it the last card of the hand?
exports.lastCardOfTheHand = (cards, players) => {

    return (cards.length+1) === players.length;

}

// Determine winner
exports.determineWinner = (round, hand, c) => {

    let trump = round.trump,
        cards = [...hand.cards, c],
        base = hand.base;

    let playersWithTrump = cards.filter(card => card.suit === trump.suit);

    if (playersWithTrump.length === 1) {
        return playersWithTrump[0];
    } else if (playersWithTrump.length > 1) {
        let sorted = playersWithTrump.sort((a, b) => b.value - a.value);
        return sorted[0];
    }

    let playersWithBase = cards.filter(card => card.suit === base.suit);

    if (playersWithBase.length === 1) {
        return playersWithBase[0];
    } else if (playersWithBase.length > 1) {
        let sorted = playersWithBase.sort((a, b) => b.value - a.value);
        return sorted[0];
    }

}