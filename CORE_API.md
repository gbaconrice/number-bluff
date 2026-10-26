# Number Bluff — offline core / multiplayer adapter boundary

`engine.js` is dependency-free UMD: `window.NumberBluff` in browser, `require('./engine')` in Node. It has no DOM, network, timers, global randomness, persistence or backend. Every transition returns a new state; invalid transitions return the original object. Random operations require an explicit `rng(): number` in `[0,1)`; the browser shell may inject `Math.random`, tests inject seeded RNG.

## Physical deck and evaluation

36 unique physical IDs: 1–5 each four; 10 three; 15 two; 20 one; 0 three; −5 two; −10 one; ×2 / MAX→0 / ? / reset-zero each one. `FULL_DECK` is a frozen array of frozen `{id, kind, value, label}` cards. Special kinds are `double`, `max0`, `extra`, `reset`; numeric kind is `number`.

At challenge: `?` adds exactly one available physical card, drawing from discard only if the draw pile is empty. Its special effect applies. Then MAX→0 removes **one highest positive numeric card** (one only in a tie), numeric values are summed, and ×2 doubles the whole sum, including a negative result. Reset is value zero, **not** a total-reset effect: all 36 cards are collected and shuffled after resolving that round. Otherwise round cards and the extra card enter discard. A round refill never includes cards currently in play. Results hold display references to immutable cards, not additional physical cards.

## Lobby and lifecycle

```js
let state = NumberBluff.createLobby({name:'YOU', botCount:3, difficulty:'normal'});
state = NumberBluff.startGame(state, Math.random);
const view = NumberBluff.publicView(state, 'p1');
```

- `createLobby({name='YOU',botCount=1,difficulty='normal'}={})`: exactly one local human (`p1`) and 0–7 bots. Invalid initial configuration throws.
- `addBot(state,difficulty='normal')`, `removeBot(state,id)`, `setDifficulty(state,id,difficulty)`: lobby only, minimum one host / maximum eight seats. All bots may be removed. Difficulty `easy|normal|hard`.
- `startGame(state,rng)`: lobby → play only with 2–8 players; a host-alone lobby is returned unchanged without drawing cards. **First seat/host starts every new game**, explicitly an offline default. Three lives, zero-life eliminated. All survivors receive one card per round.
- `declare(state,playerId,value)`: active turn only; safe integer ≥0; strictly greater than previous bid.
- `challenge(state,playerId,rng)`: active turn only, after a bid. Bid > actual total loses bidder; otherwise challenger loses, including a tie.
- `nextRound(state,rng)`: reveal → play; loser starts if still alive, otherwise next surviving seat clockwise.
- `rematch(state,rng)`: finished → new game; resets lives/cards, preserves each seat's room wins, including bots.
- `returnToLobby(state)`: play/reveal/finished → same-room lobby. Preserves seat IDs, names, kind, difficulty, room wins, and game count; resets round/lives/cards/turn/result/history. Active-play abandonment must be explicitly confirmed by the UI. No victory is awarded; an existing lobby is unchanged. `createLobby` is a genuinely new room and resets wins.
- Match ends when one survivor remains. Winner's room wins increment exactly once. Repeated challenge/nextRound/rematch in invalid phases is a no-op.

Players are `{id,name,kind:'human'|'bot',difficulty,life,wins,eliminated}`. Seat IDs are stable string IDs `p1`…`p8`. The transitions themselves do not depend on `kind`, so a future authoritative adapter can supply human actors; offline lobby intentionally does not fake online humans.

State fields: `phase:'lobby'|'play'|'reveal'|'finished'`, `revision`, `game`, `round`, `players`, private `deck`, `discard`, private `hands`, `bid`, `last`, `turn`, `starter`, `result`, `history`. `turn`, `last`, `starter` are player IDs or null. Histories contain this round's public declarations/challenge only.

## Rendering and bots — never hand raw state to clients

`publicView(state,viewerId)` returns a public DTO, without draw-pile contents. `hands` maps IDs to cards, but the viewer's own card is null during play. Other survivors' cards are visible. An eliminated spectator has no own card in play. At result, all round cards are revealed. View includes public player information, phase/revision/game/round/bid/turn/last/starter/history, `deckCount`, public `discard`, `viewerId`, and revealed `result` only.

Result:
```js
{cards: {[playerId]: card}, extraCard: card|null,
 sum, baseSum, multiplier, removedCard: card|null, reset: boolean,
 loser, challenger, bidder, bid, winner: playerId|null}
```

`botView(state,botId)` returns only that same sanitized DTO. `chooseBotAction(view,rng)` returns `{type:'declare',value}` / `{type:'challenge'}` or null when not a bot's turn. The strategy sees neither its own card nor the real total nor deck order. `possibleTotals(view)` enumerates equally weighted legal hidden-card/extra-card outcomes from the known deck and public exclusions. It handles extra-special effects and public discard refill. Difficulty changes decision thresholds/quantiles and bid increments, not access to hidden information.

```js
const id = state.turn;
const action = NumberBluff.chooseBotAction(NumberBluff.botView(state,id),Math.random);
state = NumberBluff.dispatch(state,{...action,player:id,revision:state.revision},Math.random);
```

`dispatch(state,action,rng)` requires exact `action.revision` and supports declare/challenge/nextRound/rematch. Use this guard for replayed/stale actions. Direct transition helpers still validate phase/turn/bid. Authentication, authorization of progression/rematch, seat admission and command deduplication belong to the future authoritative multiplayer adapter. Do not trust a client-supplied player ID. Disconnect behavior, networking, host migration, SDK and service choices are intentionally unspecified.

`scheduler.js` exports `NumberBluffScheduler(setTimeoutFn?,clearTimeoutFn?)`: `{schedule(callback,delay),cancel()}`. Scheduling cancels the previous ticket; generation guards invalidate queued, canceled and already-fired callbacks. The UI should cancel on confirmed exit, restart, or state changes and capture a revision for bot actions. Opening a guide or an unconfirmed exit dialog intentionally does not pause bots or steal focus; cancel only when an exit is confirmed.

## Verification

`npm test`: Node built-in test runner, no install needed. Tests cover exact physical deck, all 16 special subsets, negative totals, MAX ties, extra specials/reset, discard refill, legal actions/ties, elimination/next starter/wins/rematch, host-alone lobby/no-op start, lobby caps and 2–8 playing seats, sanitized views, BOT hidden-hand/deck-order noninterference, deterministic replay, RNG validation, immutability, stale revisions, scheduler replays and 10,000 challenge rounds with conservation checks.

`assertInvariant(state)` verifies physical deck conservation, seat/life constraints and active hands/turn. Result display references are deliberately excluded from physical conservation counting. `parseBid(raw)` normalizes full-width digits and accepts nonnegative safe integers only.
