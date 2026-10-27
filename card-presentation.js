(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffPresentation = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Presentation reads an already-authorized core result. It never draws cards,
  // decides a loser, changes game state, or publishes private hands.
  // Future room adapters should pass their stable result ID as key, not a local
  // render count. Synchronizing server time is adapter work (not implemented here).
  function plan(result, players = []) {
    if (!result || !result.cards) throw new TypeError('An authorized reveal result is required');
    const seats = [...players.map(p => p.id), ...Object.keys(result.cards)];
    const ids = [...new Set(seats)].filter(id => result.cards[id]);
    const cards = ids.map(id => result.cards[id]);
    const hasExtra = cards.some(c => c.kind === 'extra') && !!result.extraCard;
    const all = [...cards, ...(hasExtra ? [result.extraCard] : [])];
    const steps = [];
    let at = 0;
    let state = {phase:'hold', revealedIds:[], cardId:null, extraVisible:false,
      removedCardId:null, terms:[], runningTotal:null, multiplierApplied:false,
      compareVisible:false, outcomeVisible:false, complete:false};
    function add(phase, patch = {}) {
      state = {...state, ...patch, phase};
      steps.push(Object.freeze({at, ...state,
        revealedIds:Object.freeze(state.revealedIds.slice()),
        terms:Object.freeze(state.terms.map(term => Object.freeze({...term})))}));
    }
    add('hold'); at = 300;
    for (const card of cards) {
      add('reveal', {cardId:card.id, revealedIds:[...state.revealedIds,card.id]}); at += 80;
    }
    at += 200;
    if (hasExtra) { add('extra', {cardId:result.extraCard.id,extraVisible:true}); at += 400; }
    if (all.some(c => c.kind === 'max0')) {
      add('max', {cardId:result.removedCard?.id || null,removedCardId:result.removedCard?.id || null}); at += 400;
    }
    const numeric = all.filter(c => c.kind === 'number');
    let subtotal = 0;
    for (const card of numeric) {
      const value = card.id === result.removedCard?.id ? 0 : card.value;
      subtotal += value;
      add('sum', {cardId:card.id, runningTotal:subtotal,terms:[...state.terms,{cardId:card.id,value}]});
      at += numeric.length <= 3 ? 220 : 110;
    }
    if (!numeric.length) { add('sum',{cardId:null,runningTotal:result.baseSum}); at += 220; }
    if (result.multiplier === 2) {
      add('multiply',{cardId:null,multiplierApplied:true,runningTotal:result.sum}); at += 400;
    }
    // The authoritative total wins; the arithmetic above only stages its terms.
    add('compare', {cardId:null,runningTotal:result.sum,compareVisible:true}); at += 350;
    add('outcome', {outcomeVisible:true}); at += 180;
    // Reset refreshes the deck after judgement; it never zeros the total.
    if (result.reset) { add('reset', {cardId:null,runningTotal:result.sum}); at += 350; }
    add('complete', {complete:true});
    return Object.freeze(steps);
  }

  function createPresenter({clock = {}, onPhase = () => {}, onComplete = () => {}, reducedMotion = false} = {}) {
    const set = clock.setTimeout ? clock.setTimeout.bind(clock) : setTimeout;
    const clear = clock.clearTimeout ? clock.clearTimeout.bind(clock) : clearTimeout;
    let token = 0, pending = [], destroyed = false, key = null, frames = null, current = null, active = false;
    const seen = new Set();
    function cancel() {
      token++; pending.forEach(clear); pending = []; active = false; frames = null; current = null; key = null;
    }
    function emit(frame, ticket) {
      if (destroyed || ticket !== token || !active) return;
      current = frame;
      onPhase(frame, key);
      // A callback may synchronously cancel, destroy, or start another result.
      if (destroyed || ticket !== token || !active) return;
      if (frame.complete) { active = false; pending.forEach(clear); pending = []; onComplete(frame, key); }
    }
    function play(nextKey, result, players = []) {
      if (destroyed || seen.has(nextKey)) return false;
      const nextFrames = plan(result, players);
      cancel(); key = nextKey; seen.add(nextKey); frames = nextFrames; active = true;
      const ticket = token;
      if (reducedMotion) { emit(frames[frames.length - 1], ticket); return true; }
      emit(frames[0],ticket);
      if (destroyed || ticket !== token || !active) return true;
      for (const frame of frames.slice(1)) pending.push(set(() => emit(frame,ticket),frame.at));
      return true;
    }
    function skip() {
      if (destroyed || !active || !frames) return false;
      const final = frames[frames.length - 1];
      token++; pending.forEach(clear); pending = [];
      emit(final, token); return true;
    }
    function destroy() { if (destroyed) return; cancel(); destroyed = true; seen.clear(); }
    return {play, skip, cancel, destroy, get active(){return active;}, get state(){return current;}};
  }
  return {plan, createPresenter};
});
