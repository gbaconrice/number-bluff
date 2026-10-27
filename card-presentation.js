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
  // Fixed, decorative scene fragments. No card values, IDs, or game state enter
  // this markup. The caller only invokes this after its hidden/out early return.
  const artScenes = Object.freeze({
    double: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="galaxy-plane" transform="translate(50 51) rotate(-30) scale(1 .48)"><ellipse class="galaxy-stream stream-a" rx="43" ry="37"/><ellipse class="galaxy-stream stream-b" rx="32" ry="27"/><g class="galaxy-travellers"><circle cx="43" cy="0" r="2.3"/><circle cx="-32" cy="0" r="1.8"/><circle cx="0" cy="-37" r="1"/></g></g><path class="galaxy-infall" d="M12 20 Q62 5 53 50 M87 83 Q34 98 48 53"/><circle class="galaxy-core" cx="50" cy="51" r="5"/></svg>`,
    max0: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="crown-trace" d="M46 18 L48 5 L55 11 L61 1 L65 13 L70 9 L68 22 Z"/><g class="crown-rays"><path d="M48 3 L43 -5 M61 0 L62 -9 M71 8 L80 2"/></g><g class="crown-gems"><path d="M48 1 L49 4 L52 5 L49 6 L48 9 L47 6 L44 5 L47 4Z"/><path d="M61 -3 L62 0 L65 1 L62 2 L61 5 L60 2 L57 1 L60 0Z"/><path d="M70 5 L71 8 L74 9 L71 10 L70 13 L69 10 L66 9 L69 8Z"/></g><path class="royal-stardust" d="M28 30 Q9 48 25 75 M79 28 Q97 50 78 80"/><g class="royal-star"><path d="M20 52 L22 57 L27 59 L22 61 L20 66 L18 61 L13 59 L18 57Z"/><path d="M83 67 L85 70 L88 72 L85 74 L83 77 L81 74 L78 72 L81 70Z"/></g></svg>`,
    extra: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="orb-nebula"><path d="M30 65 C12 35 64 15 71 43 S25 78 40 42 S83 40 64 69"/></g><ellipse class="orb-refraction" cx="50" cy="51" rx="28" ry="35"/><g class="orb-seeds"><circle cx="25" cy="65" r="2"/><circle cx="76" cy="36" r="1.5"/><circle cx="67" cy="78" r="1"/></g><g class="orb-premonition"><rect x="42" y="40" width="16" height="23" rx="3"/><path d="M50 45 L52 49 L56 51 L52 53 L50 57 L48 53 L44 51 L48 49Z"/></g><path class="orb-glass" d="M29 33 Q35 21 46 22"/></svg>`,
    reset: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="reset-current" d="M31 30 C62 10 91 45 73 72 C57 96 18 76 22 49"/><path class="reset-arrowlight" d="M31 30 L44 23 M31 30 L41 39"/><g class="reset-card-orbit" transform="translate(50 53)"><g class="reset-deck-cards"><rect x="-4" y="-45" width="8" height="12" rx="1.5"/><rect x="33" y="12" width="8" height="12" rx="1.5" transform="rotate(30 37 18)"/><rect x="-40" y="17" width="8" height="12" rx="1.5" transform="rotate(-30 -36 23)"/></g></g><path class="reset-startrail" d="M12 38 Q3 77 42 92 M88 64 Q96 23 58 14"/></svg>`
  });
  function createArtMotion(doc, kind) {
    const motion = doc.createElement('span');
    motion.className = 'card-art-motion'; motion.setAttribute('aria-hidden', 'true');
    if (!Object.prototype.hasOwnProperty.call(artScenes, kind)) return motion;
    motion.innerHTML = artScenes[kind];
    const fragment = doc.createDocumentFragment();
    const illustration = doc.createElement('span');
    illustration.className = 'card-illustration'; illustration.setAttribute('aria-hidden', 'true');
    fragment.append(illustration, motion);
    return fragment;
  }

  return {plan, createPresenter, createArtMotion};
});
