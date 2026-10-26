(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluff = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const FULL_DECK = Object.freeze([0, 1, 2, 3, 5, 10].flatMap(n => Array(4).fill(n)));
  function shuffle(cards, rng) {
    const deck = cards.slice();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function deal(state, rng) {
    const deck = state.deck.slice(), discard = state.discard.slice();
    if (deck.length < 2) deck.push(...shuffle(discard.splice(0), rng));
    return { ...state, deck, discard, hands: [deck.pop(), deck.pop()],
      bid: null, last: -1, turn: state.round % 2, round: state.round + 1,
      phase: 'play', result: null };
  }
  function newMatch(rng = Math.random) {
    return deal({ deck: shuffle(FULL_DECK, rng), discard: [], hands: [],
      life: [3, 3], round: 0 }, rng);
  }
  function nextRound(state, rng = Math.random) {
    if (state.phase !== 'reveal') return state;
    return state.life.includes(0) ? newMatch(rng) : deal(state, rng);
  }
  function declare(state, who, value) {
    if (state.phase !== 'play' || state.turn !== who || !Number.isSafeInteger(value)
      || value < 0 || (state.bid !== null && value <= state.bid)) return state;
    return { ...state, bid: value, last: who, turn: 1 - who };
  }
  function challenge(state, who) {
    if (state.phase !== 'play' || state.turn !== who || state.bid === null) return state;
    const sum = state.hands[0] + state.hands[1];
    const loser = state.bid > sum ? state.last : who;
    const life = state.life.slice();
    life[loser]--;
    return { ...state, phase: 'reveal', life, hands: [],
      discard: [...state.discard, ...state.hands],
      result: { cards: state.hands.slice(), sum, loser, winner: life[loser] === 0 ? 1 - loser : null } };
  }
  function parseBid(raw) {
    const normalized = String(raw).replace(/[０-９]/g, c => String(c.charCodeAt(0) - 65296)).trim();
    return /^\d{1,8}$/.test(normalized) ? Number(normalized) : null;
  }
  // Deliberately contains neither the BOT's own card nor the shuffled deck.
  function botView(state) {
    return { phase: state.phase, turn: state.turn, bid: state.bid,
      visibleCard: state.hands[0], discard: state.discard.slice() };
  }
  function chooseBotAction(view, rng = Math.random) {
    if (view.phase !== 'play' || view.turn !== 1) return null;
    const unknown = FULL_DECK.slice();
    for (const seen of [...view.discard, view.visibleCard]) {
      const i = unknown.indexOf(seen);
      if (i >= 0) unknown.splice(i, 1);
    }
    const expected = unknown.reduce((a, b) => a + b, 0) / Math.max(1, unknown.length) + view.visibleCard;
    const guess = expected + (rng() - .5) * 4;
    if (view.bid !== null && view.bid > guess + (rng() * 3 - 1)) return { type: 'challenge' };
    return { type: 'declare', value: Math.max(view.bid === null ? 0 : view.bid + 1,
      Math.floor(guess) - (rng() < .25 ? 2 : 0)) };
  }
  return { FULL_DECK, newMatch, nextRound, declare, challenge, parseBid, botView, chooseBotAction };
});
