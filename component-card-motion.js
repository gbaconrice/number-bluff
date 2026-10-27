/*!
React Bits Glare Hover — used within Number Bluff, not distributed as a standalone component.
Retrieved: 2026-10-27 UTC
Source JS: https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Animations/GlareHover/GlareHover.jsx
Source CSS: https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Animations/GlareHover/GlareHover.css
License: https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md
Adaptations: vanilla lifecycle; shared one-pass scheduler; white-only low-opacity band; visibility/reduced-motion cleanup; no rim; no pointer interception.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
/* Number Bluff integration adapted from React Bits Glare Hover, David Haz (2026).
 * Source: https://github.com/DavidHDev/react-bits/tree/main/src/content/Animations/GlareHover
 * MIT + Commons Clause; full notice: THIRD_PARTY_NOTICES.card-motion.txt.
 * Retains original profile/easing/diagonal geometry; replaces React lifecycle with
 * one shared vanilla manager. Only embed as part of the game, not a component pack.
 */
(function (global) {
  'use strict';
  const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);
  const bump = (t, center, half) => {
    const distance = Math.abs(t - center);
    return distance >= half ? 0 : smootherstep(1 - distance / half);
  };
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2;
  // Same 33-sample streak profile as upstream; rgba avoids color-mix dependency.
  function whiteGradient(opacity) {
    const stops = Array.from({ length: 33 }, (_, i) => {
      const t = i / 32;
      const profile = bump(t, .5, .06 + .16 * .6) + .32 * bump(t, .5, .5);
      const alpha = Math.round(Math.min(1, profile * opacity) * 1000) / 1000;
      return `rgba(255,255,255,${alpha}) ${(t * 100).toFixed(1)}%`;
    });
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }
  function createManager(options = {}) {
    const doc = options.document || document;
    const win = doc.defaultView || global;
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    const touch = win.matchMedia('(hover: none), (pointer: coarse)');
    const cards = new Map();
    const duration = Math.max(480, Math.min(1200, options.duration || 780));
    const interval = Math.max(2000, options.touchInterval || 3500);
    const opacity = Math.max(0, Math.min(.24, options.opacity ?? .17));
    let active = null, raf = 0, timer = 0, paused = false, destroyed = false;
    let lastCard = null, nextAllowed = 0;
    const globallyAllowed = () => !destroyed && !paused && !doc.hidden && !reduced.matches;
    const eligible = record => globallyAllowed() && record.visible && record.el.isConnected &&
      !record.el.matches('.hidden, .out, [hidden], [aria-hidden="true"]') &&
      !record.el.closest('[hidden], [inert], [aria-hidden="true"], .screen.hidden, [data-revealed="false"]') &&
      record.el.getClientRects().length > 0 && win.getComputedStyle(record.el).visibility !== 'hidden';
    function stop() {
      win.cancelAnimationFrame(raf); raf = 0;
      if (active) { active.record.overlay.style.opacity = '0'; active.record.band.style.willChange = ''; }
      active = null;
    }
    function clearTimer() { win.clearTimeout(timer); timer = 0; }
    function measure(record) {
      const width = record.el.clientWidth, height = record.el.clientHeight;
      const angle = -45, radians = angle * Math.PI / 180;
      const diagonal = Math.hypot(width, height), band = Math.max(8, diagonal * .26);
      const reach = (Math.abs(width * Math.sin(radians)) + Math.abs(height * -Math.cos(radians))) / 2 + band / 2 + 2;
      record.reach = reach;
      record.band.style.width = `${band}px`;
      record.band.style.height = `${diagonal + band}px`;
    }
    function frame(now) {
      if (!active || !eligible(active.record)) { stop(); schedule(); return; }
      const t = Math.min(1, (now - active.start) / duration);
      const position = -active.record.reach + 2 * active.record.reach * ease(t);
      active.record.band.style.transform = `translate(-50%, -50%) rotate(-135deg) translateX(${position.toFixed(2)}px)`;
      // Fade the outer 12% of the pass; white profile itself remains below 0.24.
      active.record.overlay.style.opacity = String(Math.min(1, t / .12, (1 - t) / .12));
      if (t < 1) raf = win.requestAnimationFrame(frame);
      else { stop(); schedule(); }
    }
    function play(el) {
      const record = cards.get(el);
      if (!record || !eligible(record) || active || win.performance.now() < nextAllowed) return false;
      measure(record);
      if (!record.el.clientWidth || !record.el.clientHeight) return false;
      clearTimer();
      active = { record, start: win.performance.now() };
      lastCard = el;
      nextAllowed = active.start + duration + 500;
      record.band.style.willChange = 'transform';
      raf = win.requestAnimationFrame(frame);
      return true;
    }
    function schedule() {
      clearTimer();
      if (!globallyAllowed() || !touch.matches || active) return;
      if (![...cards.values()].some(eligible)) return;
      timer = win.setTimeout(() => {
        timer = 0;
        for (const [el] of cards) if (!el.isConnected) detach(el);
        const candidates = [...cards.values()].filter(eligible);
        if (!candidates.length) return;
        const index = candidates.findIndex(r => r.el === lastCard);
        if (!play(candidates[(index + 1) % candidates.length].el)) schedule();
      }, interval);
    }
    const intersection = typeof win.IntersectionObserver === 'function' ? new win.IntersectionObserver(entries => {
      for (const entry of entries) {
        const record = cards.get(entry.target);
        if (record) record.visible = entry.isIntersecting && entry.intersectionRatio >= .4;
      }
      if (active && !eligible(active.record)) stop();
      schedule();
    }, { threshold: [0, .4, 1] }) : null;
    const resize = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(entries => {
      for (const entry of entries) { const record = cards.get(entry.target); if (record) measure(record); }
    }) : null;
    function attach(el, { faceUp = true } = {}) {
      if (destroyed || !el) return;
      if (!faceUp) { detach(el); return; }
      if (cards.has(el)) return;
      const overlay = doc.createElement('span');
      overlay.className = 'nb-card-glare'; overlay.setAttribute('aria-hidden', 'true');
      const band = doc.createElement('span'); band.className = 'nb-card-glare__band';
      band.style.background = whiteGradient(opacity); overlay.append(band);
      el.classList.add('nb-glare-host'); el.append(overlay);
      const onEnter = event => { if (event.pointerType !== 'touch') play(el); };
      const onDown = event => { if (event.pointerType !== 'mouse') play(el); };
      const onFocus = event => { if (event.target.matches?.(':focus-visible')) play(el); };
      const record = { el, overlay, band, visible: !intersection, reach: 0, onEnter, onDown, onFocus };
      cards.set(el, record);
      el.addEventListener('pointerenter', onEnter, { passive: true });
      el.addEventListener('pointerdown', onDown, { passive: true });
      el.addEventListener('focusin', onFocus);
      measure(record); intersection?.observe(el); resize?.observe(el); schedule();
    }
    function detach(el) {
      const record = cards.get(el); if (!record) return;
      if (active?.record === record) stop();
      intersection?.unobserve(el); resize?.unobserve(el);
      el.removeEventListener('pointerenter', record.onEnter);
      el.removeEventListener('pointerdown', record.onDown);
      el.removeEventListener('focusin', record.onFocus);
      record.overlay.remove(); el.classList.remove('nb-glare-host'); cards.delete(el);
      schedule();
    }
    function refresh() { if (!globallyAllowed()) stop(); schedule(); }
    const listen = (media, cb) => media.addEventListener ? media.addEventListener('change', cb) : media.addListener(cb);
    const unlisten = (media, cb) => media.removeEventListener ? media.removeEventListener('change', cb) : media.removeListener(cb);
    listen(reduced, refresh); listen(touch, refresh); doc.addEventListener('visibilitychange', refresh);
    return {
      attach, detach, play,
      pause() { paused = true; stop(); clearTimer(); },
      resume() { paused = false; refresh(); },
      destroy() {
        destroyed = true; stop(); clearTimer();
        for (const el of [...cards.keys()]) detach(el);
        intersection?.disconnect(); resize?.disconnect();
        unlisten(reduced, refresh); unlisten(touch, refresh); doc.removeEventListener('visibilitychange', refresh);
      },
      // Diagnostic only: no card values or identities are read by this module.
      status() { return { attached: cards.size, active: !!active, scheduled: !!timer, reduced: reduced.matches, paused }; }
    };
  }
  global.NumberBluffCardMotion = Object.freeze({ createManager });
})(typeof window !== 'undefined' ? window : globalThis);
