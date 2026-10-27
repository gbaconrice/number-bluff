(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffLocalTurnClock = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  return function create({ expire, now = Date.now, set = setTimeout, clear = clearTimeout }) {
    let clock = null, pending = null, generation = 0;
    function pause() { generation++; if (pending !== null) clear(pending); pending = null; }
    function cancel() { pause(); clock = null; }
    function check() {
      if (!clock || now() < clock.localDeadline) return false;
      const elapsed = clock; cancel(); expire(elapsed); return true;
    }
    function resume() {
      pause(); if (check() || !clock) return;
      const ticket = generation;
      pending = set(() => { if (ticket !== generation) return; pending = null; if (!check()) resume(); }, Math.max(0, clock.localDeadline - now()));
    }
    function sync(state, human) {
      if (!state || state.phase !== 'play' || state.turn !== human) { cancel(); return null; }
      const token = JSON.stringify([state.game, state.round, state.turn, state.history.length]);
      if (clock?.token !== token) { cancel(); clock = { token, player: human, localDeadline: now() + 30000 }; }
      resume(); return clock;
    }
    return { sync, check, pause, resume, cancel, get: () => clock };
  };
});
