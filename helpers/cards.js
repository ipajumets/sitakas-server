// Shuffle cards
exports.shuffle = (cards, round, rounds) => {

    let pack;
        pack = cards;
        pack = pack.map((p, index) => {
            return {
                ...p,
                index: index,
            };
        });


    let my_cards = [],
        amount = rounds.filter(r => r.round === round)[0].amount;

    for (var i = 0; i < amount; i++) {
        let random_card = pack[Math.floor(Math.random() * pack.length)];
        my_cards = [{value: random_card.value, suit: random_card.suit}, ...my_cards];
        pack = pack.filter((p) => p.index !== random_card.index);
        pack = pack.map((p, index) => {
            return {
                ...p,
                index: index,
            };
        });
    }

    return {
        my_cards: my_cards,
        pack: pack,
    };

}