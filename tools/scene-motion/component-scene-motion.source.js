import 'number-flow';
import { canAnimate } from 'number-flow';
import confetti from 'canvas-confetti';

// Presentation adapter only. Values, victory and the stable result key must come
// from the host's authorized game state. This module performs no game arithmetic.
const win = window;
const doc = document;
if (win.NumberBluffSceneMotion) win.NumberBluffSceneMotion.destroy();
let singleton = null;

function create() {
  if (singleton && !singleton.state.destroyed) return singleton;
  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  const numbers = new Map();
  const seenWins = new Set(); let latestScope=null;
  function advanceScope(key){const m=/^(\d+):(\d+):(\d+)(?::|$)/.exec(key);if(!m)return true;const next=m.slice(1).map(Number);if(!next.every(Number.isSafeInteger))return true;if(latestScope){for(let i=0;i<3;i++){if(next[i]<latestScope[i])return false;if(next[i]>latestScope[i]){seenWins.clear();latestScope=next;return true;}}return true;}latestScope=next;return true;}
  let currentKey = null, active = false, suppressed = false, enabled = true;
  let destroyed = false, canvas = null, cannon = null, burstCount = 0;
  let running = false, generation = 0;
  const allowed = () => !destroyed && enabled && active && !suppressed && !media.matches && !doc.hidden;
  const validKey = key => typeof key === 'string' && key.length > 0;

  function stopConfetti() {
    generation += 1;
    if (cannon) cannon.reset();
    running = false;
    if (canvas) canvas.style.visibility = 'hidden';
  }
  function finishNumbers() {
    for (const record of numbers.values()) if (record.flow) record.flow.animated = false;
  }
  function halt() { suppressed = true; stopConfetti(); finishNumbers(); }
  function visibility() { if (doc.hidden) halt(); }
  function motionPreference() { if (media.matches) halt(); }
  function pruneNumbers() {
    for (const [element, record] of numbers) {
      if (!element.isConnected) { if (record.flow) record.flow.animated = false; numbers.delete(element); }
    }
  }
  function makeRecord(element, previousText) {
    const fallback = doc.createElement('span');
    fallback.className = 'nb-scene-number__fallback';
    fallback.textContent = previousText;
    const flow = canAnimate ? doc.createElement('number-flow') : null;
    if (flow) {
      flow.setAttribute('aria-hidden', 'true');
      flow.className = 'nb-scene-number__visual';
      flow.respectMotionPreference = true;
      flow.trend = 0;
      flow.transformTiming = { duration: 180, easing: 'cubic-bezier(.22,1,.36,1)' };
      flow.spinTiming = { duration: 180, easing: 'cubic-bezier(.22,1,.36,1)' };
      flow.opacityTiming = { duration: 100, easing: 'ease-out' };
      // Never install the continuous plugin or generate intermediate values.
      flow.plugins = [];
    }
    element.classList.add('nb-scene-number');
    element.replaceChildren(fallback);
    if (flow) element.append(flow);
    const record = { fallback, flow, value: null, text: previousText };
    numbers.set(element, record);
    return record;
  }

  const api = {
    begin(key) {
      if (destroyed || !validKey(key) || !advanceScope(key)) return false;
      if (currentKey !== key) {
        stopConfetti(); finishNumbers(); currentKey = key; suppressed = false;
      }
      active = true;
      return true;
    },
    setNumber(element, value, { instant = false } = {}) {
      if (destroyed || !element || element.ownerDocument !== doc || !element.isConnected) return false;
      if (value !== null && !Number.isSafeInteger(value)) return false;
      pruneNumbers();
      let record = numbers.get(element);
      if (!record || record.fallback.parentNode !== element || (record.flow && record.flow.parentNode !== element)) {
        if (record?.flow) record.flow.animated = false;
        record = makeRecord(element, value === null ? '…' : String(value));
      }
      const text = value === null ? '…' : String(value);
      // This is the sole accessible number, updated only from authoritative input.
      record.fallback.textContent = text; record.text = text;
      if (!record.flow || value === null) {
        if (record.flow) { record.flow.animated = false; record.flow.style.display = 'none'; }
        element.dataset.numberMotion = 'fallback'; record.value = value;
        return true;
      }
      try {
        record.flow.style.display = '';
        record.flow.animated = !instant && allowed() && record.value !== null;
        if (record.value !== value) record.flow.update(value);
        element.dataset.numberMotion = 'ready'; record.value = value;
      } catch {
        // Failed custom-element support must never lose the real visible value.
        record.flow.animated = false; record.flow.remove(); record.flow = null;
        element.dataset.numberMotion = 'fallback'; record.value = value;
      }
      return true;
    },
    celebrate({ key, confirmed = false, won = false } = {}) {
      if (destroyed || confirmed !== true || won !== true || !validKey(key) || currentKey !== key) return false;
      if (seenWins.has(key)) return false;
      // Consume the result even when hidden, skipped or reduced-motion. Repeated
      // rendering / reconnects must not produce a delayed or duplicate reward.
      seenWins.add(key);if(seenWins.size>128)seenWins.delete(seenWins.values().next().value);
      if (!allowed()) return false;
      if (!canvas) {
        canvas = doc.createElement('canvas');
        canvas.className = 'nb-scene-confetti';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.setAttribute('role', 'presentation');
        canvas.style.pointerEvents = 'none';
        doc.body.append(canvas);
        if (!canvas.getContext('2d')) { canvas.remove(); canvas = null; return false; }
        // One Canvas2D surface. No Worker/blob, WebGL or external runtime.
        cannon = confetti.create(canvas, { resize: true, useWorker: false, disableForReducedMotion: true });
      }
      const ticket = ++generation;
      canvas.style.visibility = 'visible'; running = true; burstCount += 1;
      const completion = cannon({
        particleCount: 34, spread: 64, angle: 90, startVelocity: 23,
        gravity: 0.83, decay: 0.925, ticks: 110, scalar: 0.72,
        origin: { x: 0.5, y: 0.64 },
        colors: ['#E9C46A', '#FFF8E8', '#BBA6ED'],
        shapes: ['star', 'circle'], disableForReducedMotion: true
      });
      if (completion && typeof completion.then === 'function') completion.then(() => {
        if (destroyed || generation !== ticket) return;
        running = false; canvas.style.visibility = 'hidden';
      });
      return true;
    },
    skip() { if (!destroyed) halt(); },
    leave() { if (!destroyed) { halt(); active = false; } },
    reset() {
      if (destroyed) return;
      halt(); active = false; currentKey = null;
      for (const [element, record] of numbers) {
        if (record.fallback.parentNode === element) element.textContent = record.text;
        element.classList.remove('nb-scene-number'); delete element.dataset.numberMotion;
      }
      numbers.clear();
      // Preserve seenWins: reset/navigation is not a new authorized victory.
    },
    setEnabled(value) { enabled = Boolean(value); if (!enabled) halt(); },
    destroy() {
      if (destroyed) return;
      api.reset(); destroyed = true;
      doc.removeEventListener('visibilitychange', visibility);
      win.removeEventListener('pagehide', api.leave);
      if (media.removeEventListener) media.removeEventListener('change', motionPreference);
      else media.removeListener(motionPreference);
      if (canvas) canvas.remove(); canvas = null; cannon = null;
      seenWins.clear();
    },
    get state() {
      return Object.freeze({ key: currentKey, active, suppressed, enabled, destroyed,
        reducedMotion: media.matches, hidden: doc.hidden, canAnimate,
        numberCount: numbers.size, canvasCount: canvas ? 1 : 0, running,
        burstCount, seenWinCount: seenWins.size });
    }
  };
  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('pagehide', api.leave);
  if (media.addEventListener) media.addEventListener('change', motionPreference);
  else media.addListener(motionPreference);
  singleton = Object.freeze(api);
  return singleton;
}

win.NumberBluffSceneMotion = Object.freeze({
  create,
  destroy() { if (singleton) singleton.destroy(); },
  version: '1.0.0'
});
