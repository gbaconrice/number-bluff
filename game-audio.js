(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffAudio = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Small, original synthesized cues: no downloads, music loop or stored sound setting.
  // Each tuple is [frequency, seconds, offset, endFrequency, waveform, gain].
  const cues = {
    tap: [[780, .055, 0, 620, 'sine', .13]],
    deal: [[330, .10, 0, 650, 'triangle', .11], [440, .10, .065, 880, 'triangle', .10], [660, .14, .13, 990, 'sine', .10]],
    declare: [[440, .12, 0, 660, 'triangle', .16], [880, .18, .07, 880, 'sine', .08]],
    challenge: [[196, .22, 0, 98, 'triangle', .20], [392, .20, .035, 196, 'sine', .13], [784, .11, .09, 440, 'sine', .07]],
    reveal: [[880, .085, 0, 1320, 'triangle', .10]],
    extra: [[523, .12, 0, 587, 'sine', .12], [784, .15, .09, 880, 'sine', .12], [1175, .22, .18, 1568, 'sine', .08]],
    max: [[880, .25, 0, 220, 'triangle', .12], [1760, .16, .04, 440, 'sine', .05]],
    sum: [[660, .07, 0, 740, 'sine', .09]],
    multiply: [[262, .25, 0, 523, 'triangle', .13], [392, .25, .06, 784, 'sine', .10], [523, .25, .12, 1047, 'sine', .08]],
    reset: [[523, .18, 0, 262, 'triangle', .09], [392, .18, .09, 784, 'sine', .09], [523, .20, .18, 1047, 'sine', .08]],
    compare: [[392, .16, 0, 392, 'sine', .12], [587, .16, .08, 587, 'sine', .09]],
    win: [[523, .22, 0, 523, 'triangle', .11], [659, .24, .11, 659, 'sine', .12], [784, .30, .22, 784, 'sine', .12], [1047, .40, .33, 1047, 'sine', .08]],
    loss: [[392, .20, 0, 349, 'triangle', .10], [294, .25, .12, 262, 'sine', .10]],
    outcome: [[523, .18, 0, 523, 'sine', .10], [659, .26, .10, 659, 'sine', .09]]
  };
  function create({ contextFactory, document: doc = typeof document === 'object' ? document : null,
    window: win = typeof window === 'object' ? window : null } = {}) {
    let context = null, master = null, destroyed = false, resumePending = false;
    const voices = new Set(), lastPlayed = new Map();
    const hidden = () => !!doc?.hidden;
    function stop() {
      for (const voice of [...voices]) {
        try { voice.oscillator.stop(); } catch {}
        try { voice.oscillator.disconnect(); voice.gain.disconnect(); } catch {}
        voices.delete(voice);
      }
      lastPlayed.clear();
    }
    function unlock(event) {
      // Only the trusted interaction handler may create/resume the device context.
      if (destroyed || hidden() || event?.isTrusted === false) return false;
      try {
        if (!context || context.state === 'closed') {
          const Constructor = win?.AudioContext || win?.webkitAudioContext;
          if (!contextFactory && !Constructor) return false;
          context = contextFactory ? contextFactory() : new Constructor();
          master = context.createGain(); master.gain.value = .28; master.connect(context.destination);
        }
        if (context.state !== 'running' && !resumePending) {
          resumePending = true;
          Promise.resolve(context.resume()).catch(() => {}).finally(() => { resumePending = false; });
        }
        return true;
      } catch { resumePending = false; return false; }
    }
    function play(kind) {
      if (destroyed || hidden() || !context || context.state !== 'running' || !cues[kind]) return false;
      const now = context.currentTime;
      // Dense renders/clicks cannot stack unbounded voices. No delayed queue on resume.
      if (now - (lastPlayed.get(kind) ?? -Infinity) < .035) return false;
      lastPlayed.set(kind, now);
      try {
        for (const [frequency, duration, offset, end, type, volume] of cues[kind]) {
          if (voices.size >= 28) break;
          const oscillator = context.createOscillator(), gain = context.createGain();
          const start = now + offset, finish = start + duration;
          oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(end, finish);
          gain.gain.setValueAtTime(.0001, start);
          gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.012, duration / 4));
          gain.gain.exponentialRampToValueAtTime(.0001, finish);
          oscillator.connect(gain); gain.connect(master);
          const voice = { oscillator, gain }; voices.add(voice);
          oscillator.onended = () => { voices.delete(voice); oscillator.disconnect(); gain.disconnect(); };
          oscillator.start(start); oscillator.stop(finish + .01);
        }
        return true;
      } catch { stop(); return false; } // Audio failure never interrupts a turn.
    }
    function suspend() {
      stop();
      if (context && context.state !== 'closed') {
        try { Promise.resolve(context.suspend()).catch(() => {}); } catch {}
      }
    }
    const visibility = () => { if (hidden()) suspend(); };
    // touchend is retained for older iOS WebViews; pointerdown covers modern devices.
    const gestures = ['pointerdown', 'touchend', 'keydown'];
    for (const type of gestures) doc?.addEventListener?.(type, unlock, { capture: true, passive: true });
    doc?.addEventListener?.('visibilitychange', visibility);
    win?.addEventListener?.('pagehide', suspend);
    function destroy() {
      if (destroyed) return;
      destroyed = true; stop();
      for (const type of gestures) doc?.removeEventListener?.(type, unlock, { capture: true });
      doc?.removeEventListener?.('visibilitychange', visibility); win?.removeEventListener?.('pagehide', suspend);
      try { Promise.resolve(context?.close()).catch(() => {}); } catch {}
    }
    return Object.freeze({ unlock, play, stop, destroy });
  }
  return Object.freeze({ create });
});
