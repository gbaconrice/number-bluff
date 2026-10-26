(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffScheduler = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Invalidate even callbacks already queued by the browser before clearTimeout.
  return function createScheduler(set = setTimeout, clear = clearTimeout) {
    let generation = 0, pending = null;
    function cancel() {
      generation++;
      if (pending !== null) clear(pending);
      pending = null;
    }
    function schedule(callback, delay) {
      cancel();
      const ticket = generation;
      pending = set(() => {
        if (ticket !== generation) return;
        pending = null;
        generation++;
        callback();
      }, delay);
    }
    return { cancel, schedule };
  };
});
