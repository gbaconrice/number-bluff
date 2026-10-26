const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../engine');
const createScheduler = require('../scheduler');
function rng(seed = 123) { return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }
function conserve(s) {
  assert.deepEqual([...s.deck, ...s.discard, ...s.hands].sort((a,b)=>a-b), [...g.FULL_DECK].sort((a,b)=>a-b));
}
test('strict UI bids including fullwidth and whitespace', () => {
  for (const bad of ['', ' ', '-1', '+1', '1.0', '1e2', '12x', '123456789', '1 2']) assert.equal(g.parseBid(bad), null);
  assert.equal(g.parseBid(' １２３ '), 123); assert.equal(g.parseBid('000'), 0);
});
test('engine rejects invalid, equal, lower, out-of-turn bids without mutation', () => {
  let s = g.newMatch(rng()); const snapshot = JSON.stringify(s);
  for (const n of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', null]) assert.equal(g.declare(s, 0, n), s);
  assert.equal(g.declare(s, 1, 1), s); assert.equal(g.challenge(s, 0), s);
  assert.equal(JSON.stringify(s), snapshot);
  s = g.declare(s, 0, 5);
  assert.equal(g.declare(s, 1, 5), s); assert.equal(g.declare(s, 1, 4), s);
  assert.equal(g.declare(s, 1, 6).bid, 6);
});
test('tie loses challenge; overbid loses declarer; only one life per reveal', () => {
  for (const over of [0, 1]) {
    const s = g.newMatch(rng()); const sum = s.hands.reduce((a,b)=>a+b);
    const result = g.challenge(g.declare(s, 0, sum + over), 1);
    assert.equal(result.result.loser, over ? 0 : 1);
    assert.equal(result.life[over ? 0 : 1], 2);
    assert.equal(g.challenge(result, 1), result);
    assert.equal(g.declare(result, 0, 99), result); conserve(result);
  }
});
test('round advances only from reveal; alternates; zero life replays fresh', () => {
  let s = g.newMatch(rng()); assert.equal(g.nextRound(s), s);
  for (let i = 0; i < 3; i++) {
    s = g.declare(s, s.turn, s.turn === 0 ? 99 : 0);
    s = g.challenge(s, s.turn); // Always player 0 loses.
    assert.equal(s.life[0], 2-i);
    if (i < 2) { s = g.nextRound(s, rng()); assert.equal(s.turn, (i+1)%2); }
  }
  assert.equal(s.result.winner, 1);
  s = g.nextRound(s, rng()); assert.deepEqual(s.life, [3,3]); assert.equal(s.round, 1); conserve(s);
});
test('deck conservation across refill and deterministic action replay', () => {
  function replay() {
    const random = rng(19); let s = g.newMatch(random); const history = [];
    for (let i=0; i<100; i++) {
      conserve(s);
      // Alternate losers to keep this match alive through multiple reshuffles.
      s = {...s, life:[3,3]};
      s = g.challenge(g.declare(s,s.turn,i%21),1-s.turn); conserve(s);
      history.push(s); s = g.nextRound(s, random);
    }
    return history;
  }
  assert.deepEqual(replay(), replay());
});
test('BOT view and decisions cannot inspect its own card or deck', () => {
  const s = g.declare(g.newMatch(rng()), 0, 3);
  const changed = {...s, hands:[s.hands[0], 999], deck:[999]};
  assert.deepEqual(g.botView(s), g.botView(changed));
  assert.deepEqual(Object.keys(g.botView(s)).sort(), ['bid','discard','phase','turn','visibleCard']);
  assert.deepEqual(g.chooseBotAction(g.botView(s), rng()), g.chooseBotAction(g.botView(changed), rng()));
  const view = g.botView(s); view.discard.push(999); assert.ok(!s.discard.includes(999));
});
test('scheduler invalidates callbacks crossing reset/round and repeated callbacks', () => {
  const callbacks = [], cancelled = []; let calls = 0;
  const timer = createScheduler(cb => (callbacks.push(cb), callbacks.length), id => cancelled.push(id));
  timer.schedule(() => calls++, 1); timer.cancel();
  timer.schedule(() => calls += 10, 1);
  callbacks[0](); assert.equal(calls,0);
  callbacks[1](); callbacks[1](); assert.equal(calls,10);
  timer.schedule(() => calls += 100, 1); timer.schedule(() => calls += 1000, 1);
  callbacks[2](); callbacks[3](); assert.equal(calls,1010);
  assert.deepEqual(cancelled,[1,3]);
});
test('BOT choice preserves original estimator and random-consumption sequence', () => {
  function original(s, random) {
    const unknown = g.FULL_DECK.slice();
    for (const seen of [...s.discard, s.hands[0]]) {
      const i = unknown.indexOf(seen); if (i >= 0) unknown.splice(i, 1);
    }
    const expected = unknown.reduce((a,b)=>a+b,0)/Math.max(1,unknown.length)+s.hands[0];
    const guess = expected + (random()-.5)*4;
    if(s.bid!==null && s.bid>guess+(random()*3-1)) return {type:'challenge'};
    return {type:'declare',value:Math.max(s.bid===null?0:s.bid+1,Math.floor(guess)-(random()<.25?2:0))};
  }
  for(let seed=0;seed<100;seed++) {
    const random=rng(seed); let s=g.newMatch(random);
    for(let round=0;round<15;round++) {
      s={...s,turn:1,bid:round===0?null:round,life:[3,3]};
      const a=rng(seed+round), b=rng(seed+round);
      assert.deepEqual(g.chooseBotAction(g.botView(s),a),original(s,b));
      assert.equal(a(),b());
      s=g.nextRound(g.challenge(g.declare({...s,bid:null},1,round),0),random);
    }
  }
});
test('transitions do not mutate frozen state or input arrays', () => {
  function freeze(s) {
    for(const value of Object.values(s)) if(value && typeof value==='object') Object.freeze(value);
    return Object.freeze(s);
  }
  const s=freeze(g.newMatch(rng()));
  const declared=freeze(g.declare(s,0,99));
  const revealed=freeze(g.challenge(declared,1));
  conserve(g.nextRound(revealed,rng()));
  assert.equal(s.bid,null); assert.deepEqual(s.life,[3,3]);
});
