'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('../game-audio.js');
function target() {
  const listeners = new Map();
  return { hidden: false, listeners,
    addEventListener(type, fn) { const set = listeners.get(type) || new Set(); set.add(fn); listeners.set(type, set); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event = { isTrusted: true }) { for (const fn of listeners.get(type) || []) fn(event); }
  };
}
function fixture({ rejectResume = false } = {}) {
  const doc = target(), win = target(), notes = [], gains = [];
  let created = 0, resumed = 0, suspended = 0, closed = 0;
  const param = () => ({ value: 0, events: [], setValueAtTime(...args) { this.events.push(['set', ...args]); }, exponentialRampToValueAtTime(...args) { this.events.push(['ramp', ...args]); } });
  const context = { state: 'suspended', currentTime: 1, destination: {},
    createGain() { const node = { gain: param(), connect() {}, disconnect() { this.disconnected = true; } }; gains.push(node); return node; },
    createOscillator() { const node = { frequency: param(), connect() {}, disconnect() { this.disconnected = true; }, start(time) { this.startTime = time; }, stop(time) { if (time !== undefined) this.stopTime = time; this.stops = (this.stops || 0) + 1; } }; notes.push(node); return node; },
    resume() { resumed++; if (rejectResume) return Promise.reject(new Error('blocked')); context.state = 'running'; return Promise.resolve(); },
    suspend() { suspended++; context.state = 'suspended'; return Promise.resolve(); },
    close() { closed++; context.state = 'closed'; return Promise.resolve(); }
  };
  const audio = create({ document: doc, window: win, contextFactory: () => { created++; return context; } });
  return { audio, context, doc, win, notes, gains, counts: () => ({ created, resumed, suspended, closed }) };
}
test('sound is lazy, starts with trusted gesture, not a removed saved setting', () => {
  const f = fixture(); assert.equal(f.audio.play('declare'), false); assert.equal(f.counts().created, 0);
  f.doc.emit('pointerdown', { isTrusted: false }); assert.equal(f.counts().created, 0);
  f.doc.emit('pointerdown'); assert.equal(f.counts().created, 1); assert.equal(f.audio.play('declare'), true);
  assert.equal(f.gains[0].gain.value, .28); assert.equal(f.notes.length, 2);
  assert.ok(f.notes.every(n => n.startTime >= 1 && n.stopTime > n.startTime));
  assert.ok(f.gains.slice(1).every(n => n.gain.events.at(-1)[1] === .0001));
});
test('all original cues use finite positive frequencies and stop after a bounded envelope', () => {
  const f = fixture(); f.audio.unlock();
  for (const name of ['tap','deal','declare','challenge','reveal','extra','max','sum','multiply','reset','compare','win','loss','outcome']) {
    f.audio.stop(); assert.equal(f.audio.play(name), true, name);
  }
  for (const note of f.notes) {
    assert.ok(note.stopTime - note.startTime < 1);
    assert.ok(note.frequency.events.every(e => Number.isFinite(e[1]) && e[1] > 0));
  }
  assert.equal(f.audio.play('unknown'), false);
});
test('identical dense events are throttled and active voices are bounded', () => {
  const f = fixture(); f.audio.unlock(); assert.equal(f.audio.play('win'), true);
  assert.equal(f.audio.play('win'), false);
  for (let i = 0; i < 100; i++) { f.context.currentTime += .04; f.audio.play('win'); }
  assert.equal(f.notes.length, 28);
  f.notes[0].onended(); f.context.currentTime += .04; f.audio.play('win'); assert.equal(f.notes.length, 29);
});
test('hidden and pagehide immediately stop pending notes, do not queue old effects', async () => {
  const f = fixture(); f.audio.unlock(); await new Promise(resolve => setImmediate(resolve)); f.audio.play('win');
  f.doc.hidden = true; f.doc.emit('visibilitychange'); assert.equal(f.counts().suspended, 1);
  assert.ok(f.notes.every(n => n.stops === 2 && n.disconnected));
  assert.equal(f.audio.play('deal'), false); f.doc.hidden = false;
  f.doc.emit('visibilitychange'); assert.equal(f.context.state, 'suspended');
  assert.equal(f.audio.play('deal'), false); f.doc.emit('touchend');
  assert.equal(f.notes.length, 4); assert.equal(f.audio.play('deal'), true);
  f.win.emit('pagehide'); assert.equal(f.counts().suspended, 2);
});
test('blocked resume is swallowed and a later trusted gesture can retry', async () => {
  const f = fixture({ rejectResume: true }); f.doc.emit('pointerdown');
  await new Promise(resolve => setImmediate(resolve)); assert.equal(f.audio.play('deal'), false);
  f.doc.emit('touchend'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.counts().created, 1); assert.equal(f.counts().resumed, 2);
});
test('destroy removes listeners, stops sound, and is idempotent', () => {
  const f = fixture(); f.audio.unlock(); f.audio.play('declare'); f.audio.destroy(); f.audio.destroy();
  assert.equal(f.counts().closed, 1); assert.equal(f.audio.play('tap'), false); assert.equal(f.audio.unlock(), false);
  for (const listeners of [...f.doc.listeners.values(), ...f.win.listeners.values()]) assert.equal(listeners.size, 0);
});
test('unsupported or failing audio device never throws into gameplay', () => {
  const a = create({ window: {}, document: null }); assert.equal(a.unlock(), false); assert.equal(a.play('tap'), false);
  const b = create({ contextFactory: () => { throw new Error('no device'); }, document: null, window: null });
  assert.equal(b.unlock(), false); assert.doesNotThrow(() => { b.play('deal'); b.stop(); b.destroy(); });
});
