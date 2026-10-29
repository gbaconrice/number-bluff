/*!

Source: https://uiverse.io/Javierrocadev/funny-cobra-5
https://github.com/uiverse-io/galaxy/blob/main/Cards/Javierrocadev_funny-cobra-5.html
MIT License
Copyright - 2026 Javierrocadev (Javier Roca)
 *
Source: https://www.vengenceui.com/components/glow-border-card
https://github.com/Ashutoshx7/VengeanceUI/blob/main/src/app/globals.css
https://github.com/Ashutoshx7/VengeanceUI/blob/main/public/r/glow-border-card.json
MIT License
Copyright (c) 2025-2026 Ashutoshx7
 *
The following MIT terms apply to both sources above:
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 *
Modifications: Uiverse's 1.1s hover flip/25deg roll/UNO styling replaced with
a public-event-only 400ms Y flip of the existing nodes. Vengeance's thick,
blurred, rainbow infinite border replaced with a 1.5px gold-only masked rim,
GPU-transform rotation and a single 650ms pass. No third-party artwork used.
All geometry/opacity motion is finite. Images/numerals are not transformed
independently, filtered, repainted, recolored, or replaced.


*/
/*
 * Number Bluff: event-only card reveal and one-card gold rim.
 * Source and full MIT notices: component-card-reveal.css and THIRD_PARTY_NOTICES.txt.
 * Uiverse Javierrocadev: https://uiverse.io/Javierrocadev/funny-cobra-5
 * Vengeance UI: https://www.vengenceui.com/components/glow-border-card
 * Adaptation: no React, Tailwind, hover trigger, logo, raster processing, or rule logic.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffCardReveal = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const REVEAL_MS = 400, GOLD_MS = 650;
  function createController(options = {}) {
    const doc = options.document || (typeof document !== 'undefined' ? document : null);
    const win = options.window || doc?.defaultView;
    const clock = options.clock || win || globalThis;
    const set = clock.setTimeout.bind(clock), clear = clock.clearTimeout.bind(clock);
    const media = win?.matchMedia?.('(prefers-reduced-motion: reduce)');
    const seenReveal = new Set(), seenGold = new Set(), active = new Set();
    let destroyed = false, goldEffect = null;
    const quiet = () => destroyed || !doc || doc.hidden || options.reducedMotion === true || !!media?.matches;
    const validKey = key => (typeof key === 'string' && key.length > 0) || typeof key === 'number';
    const attached = node => node && node.isConnected !== false && !!node.parentNode;
    function settleAll() { for (const effect of [...active]) effect.settle(); }
    function watch(animation, effect, ms) {
      // Timer is a bound, not a new presentation phase. The game never awaits us.
      effect.timer = set(() => effect.settle(), ms);
      if (animation) {
        effect.animation = animation;
        animation.onfinish = () => effect.settle();
        animation.oncancel = () => effect.settle();
      }
    }
    function reveal({ key, back, face, authorized = false } = {}) {
      // The caller must have received the public reveal event. There is no card
      // data input, image lookup, pre-rendered secret face, or engine reference.
      if (destroyed || !validKey(key) || !authorized || !back || !face || back === face ||
          face.parentNode || !attached(back) || !back.classList.contains('hidden') ||
          face.classList.contains('hidden') || face.classList.contains('out') ||
          face.dataset.revealed !== 'true') return false;
      const duplicate = seenReveal.has(key);
      seenReveal.add(key);
      if (duplicate || quiet() || typeof face.animate !== 'function') {
        back.replaceWith(face); return false;
      }
      // Do not carry a gold ring onto the rear face or duplicate its effect.
      if (goldEffect?.node === back) goldEffect.settle();
      const stage = doc.createElement('div'), rotor = doc.createElement('div');
      stage.className = 'nb-card-reveal-stage'; rotor.className = 'nb-card-reveal-rotor';
      // The actual front node stays first: existing .player-card lookups still
      // find the live face, including numeral and later zero-stamp updates.
      back.replaceWith(stage);
      back.removeAttribute('id'); back.setAttribute('aria-hidden', 'true');
      back.removeAttribute('aria-label'); back.removeAttribute('tabindex');
      back.classList.add('nb-card-reveal-back'); face.classList.add('nb-card-reveal-face');
      stage.append(rotor); rotor.append(face, back);
      const effect = { settled: false, timer: null, animation: null, settle() {
        if (effect.settled) return;
        effect.settled = true; active.delete(effect);
        if (effect.timer !== null) clear(effect.timer);
        if (effect.animation) {
          effect.animation.onfinish = null; effect.animation.oncancel = null;
          effect.animation.cancel();
        }
        face.classList.remove('nb-card-reveal-face');
        if (stage.parentNode) stage.replaceWith(face);
        // A rerender may have discarded the stage; never replace a newer node.
        back.remove();
      }};
      active.add(effect);
      try {
        const animation = rotor.animate([
          { transform: 'rotateY(-180deg)' },
          { transform: 'rotateY(0deg)' }
        ], { duration: REVEAL_MS, easing: 'cubic-bezier(.22,.68,.18,1)', fill: 'both' });
        watch(animation, effect, REVEAL_MS);
      } catch (_) { effect.settle(); return false; }
      return true;
    }
    function gold({ key, node } = {}) {
      // Caller chooses exactly the turn/challenge card; this controller never
      // searches for every card or derives a private value from its appearance.
      if (destroyed || !validKey(key) || !attached(node) ||
          !node.classList.contains('player-card') || node.classList.contains('out')) return false;
      if (seenGold.has(key)) {
        // A replacement rerender must not leave an orphaned old-node animation.
        if (goldEffect && goldEffect.node !== node) goldEffect.settle();
        return false;
      }
      seenGold.add(key);
      if (goldEffect) goldEffect.settle();
      if (quiet() || typeof node.animate !== 'function') return false;
      const rim = doc.createElement('span'), light = doc.createElement('span');
      rim.className = 'nb-card-gold-rim'; light.className = 'nb-card-gold-light';
      rim.setAttribute('aria-hidden', 'true'); rim.append(light); node.append(rim);
      const effect = { node, settled: false, timer: null, animation: null, settle() {
        if (effect.settled) return;
        effect.settled = true; active.delete(effect);
        if (goldEffect === effect) goldEffect = null;
        if (effect.timer !== null) clear(effect.timer);
        if (effect.animation) {
          effect.animation.onfinish = null; effect.animation.oncancel = null;
          effect.animation.cancel();
        }
        rim.remove();
      }};
      active.add(effect); goldEffect = effect;
      try {
        const animation = light.animate([
          { transform: 'rotate(0deg)', opacity: 0, offset: 0 },
          { transform: 'rotate(30deg)', opacity: .85, offset: .1 },
          { transform: 'rotate(300deg)', opacity: .65, offset: .83 },
          { transform: 'rotate(360deg)', opacity: 0, offset: 1 }
        ], { duration: GOLD_MS, easing: 'linear', fill: 'both' });
        watch(animation, effect, GOLD_MS);
      } catch (_) { effect.settle(); return false; }
      return true;
    }
    const onVisibility = () => { if (doc.hidden) settleAll(); };
    const onPreference = () => { if (media.matches) settleAll(); };
    doc?.addEventListener?.('visibilitychange', onVisibility);
    if (media?.addEventListener) media.addEventListener('change', onPreference);
    else media?.addListener?.(onPreference);
    function destroy() {
      if (destroyed) return;
      destroyed = true; settleAll();
      doc?.removeEventListener?.('visibilitychange', onVisibility);
      if (media?.removeEventListener) media.removeEventListener('change', onPreference);
      else media?.removeListener?.(onPreference);
      seenReveal.clear(); seenGold.clear();
    }
    return Object.freeze({ reveal, gold, settleAll, destroy, get activeCount() { return active.size; } });
  }
  return Object.freeze({ createController, REVEAL_MS, GOLD_MS });
});
