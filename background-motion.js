/*!
Magic UI Meteors — adapted head/tail structure; React Bits Galaxy — Star() optical sprite, sampled offline.

MIT License

Copyright (c) Magic UI

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
/* Scene/cloud parallax is unchanged. Overlay adapted from Magic UI Meteors,
   with optical star sprites sampled from React Bits Galaxy (not drawn SVG).
   See THIRD_PARTY_NOTICES and SOURCES. No game state or game RNG is accessed. */
(function () {
  'use strict';
  if (window.NumberBluffBackground) window.NumberBluffBackground.destroy();
  var enabled = true, destroyed = false, layer = null, pool = [], active = new Set(), timers = new Set();
  var sequence = 0, started = false, small = window.innerWidth < 480;
  var seed = (Date.now() ^ 0x91e10da5) >>> 0;
  try { var entropy = new Uint32Array(1); window.crypto.getRandomValues(entropy); seed = entropy[0] || seed; } catch (_) {}
  function random() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }
  function range(min, max) { return min + random() * (max - min); }
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function snapshot() {
    return Object.freeze({ enabled:enabled, reducedMotion:media.matches, hidden:document.hidden,
      running:Boolean(layer && enabled && !media.matches && !document.hidden && !destroyed),
      mounted:Boolean(layer), destroyed:destroyed, starCount:small ? 4 : 6,
      poolSize:pool.length, activeMeteorCount:active.size, timerCount:timers.size });
  }
  function later(callback, delay, ticket) {
    var id = setTimeout(function () {
      timers.delete(id);
      if (ticket === sequence && snapshot().running) callback();
    }, delay);
    timers.add(id);
  }
  function stopOverlay() {
    sequence++; started = false;
    timers.forEach(function (id) { clearTimeout(id); }); timers.clear();
    active.forEach(function (animation) { animation.cancel(); }); active.clear();
    pool.forEach(function (node) { node.dataset.busy = 'false'; });
  }
  function launch(ticket) {
    if (ticket !== sequence || !snapshot().running) return;
    var node = pool.find(function (item) { return item.dataset.busy !== 'true'; });
    if (!node || typeof node.animate !== 'function') return;
    var width = window.innerWidth, height = window.innerHeight;
    var angle = range(144, 162), radians = angle * Math.PI / 180;
    var distance = range(width * .48, Math.min(width * .95, 900));
    var x = range(width * .28, width * 1.09), y = range(height * .025, height * .36);
    var duration = range(1350, 2350), length = range(small ? 58 : 82, small ? 115 : 172);
    node.style.left = x + 'px'; node.style.top = y + 'px';
    node.style.setProperty('--meteor-length', length + 'px');
    node.style.setProperty('--meteor-core', range(23, 34) + 'px');
    node.style.setProperty('--meteor-warmth', random() < .25 ? '#fff0c7' : '#e4edff');
    node.dataset.busy = 'true';
    var rotate = ' rotate(' + angle + 'deg)';
    var animation = node.animate([
      { transform:'translate3d(0,0,0)' + rotate, opacity:0, offset:0 },
      { opacity:range(.55,.85), offset:.15 },
      { opacity:.48, offset:.68 },
      { transform:'translate3d(' + Math.cos(radians)*distance + 'px,' + Math.sin(radians)*distance + 'px,0)' + rotate, opacity:0, offset:1 }
    ], { duration:duration, easing:'linear', fill:'none' });
    active.add(animation);
    function done() { active.delete(animation); if (ticket === sequence) node.dataset.busy = 'false'; }
    animation.onfinish = done; animation.oncancel = done;
  }
  function group(ticket) {
    if (ticket !== sequence || !snapshot().running) return;
    // Short, nonperiodic conversations: a pair, sometimes a third, then quiet.
    var count = small ? 2 : (random() < .38 ? 3 : 2);
    launch(ticket);
    for (var i=1;i<count;i++) later(function () { launch(ticket); }, i * range(280,620), ticket);
    later(function () { group(ticket); }, range(6800,11200), ticket);
  }
  function sync() {
    if (!layer) return;
    var state = snapshot();
    layer.dataset.motion = state.running ? 'running' : 'paused';
    layer.dataset.static = (!enabled || media.matches) ? 'true' : 'false';
    if (!state.running) { stopOverlay(); return; }
    if (!started) { started = true; var ticket = ++sequence; later(function () { group(ticket); }, range(650,1450), ticket); }
  }
  function mount() {
    if (destroyed || layer || !document.body) return;
    layer = document.createElement('div'); layer.className = 'nb-background'; layer.setAttribute('aria-hidden','true');
    var scene = document.createElement('div'); scene.className = 'nb-background__scene'; layer.appendChild(scene);
    var stars = document.createElement('div'); stars.className = 'nb-sky-glints';
    // Four/six optical blooms, not sixteen uniform moving dots. Central logo/UI
    // area stays quiet; the original illustrated stars remain the primary art.
    for (var i=0;i<(small?4:6);i++) {
      var star = document.createElement('span'); star.className = 'nb-sky-glint';
      star.style.left = (i%2 ? range(72,95) : range(5,26)) + '%';
      star.style.top = range(6,65) + '%';
      star.style.setProperty('--glint-size',range(26,43)+'px');
      star.style.setProperty('--glint-duration',range(4800,9300)+'ms');
      star.style.setProperty('--glint-delay',(-range(0,9000))+'ms');
      stars.appendChild(star);
    }
    layer.appendChild(stars);
    var nebula = document.createElement('div'); nebula.className = 'nb-background__nebula'; layer.appendChild(nebula);
    var distantClouds = document.createElement('div'); distantClouds.className = 'nb-background__clouds-back'; layer.appendChild(distantClouds);
    var meteors = document.createElement('div'); meteors.className = 'nb-meteor-pool';
    for (var j=0;j<(small?2:3);j++) {
      var meteor = document.createElement('span'); meteor.className = 'nb-meteor'; meteor.dataset.busy = 'false';
      ['wake','tail','head'].forEach(function (part) { var n=document.createElement('span'); n.className='nb-meteor__'+part; meteor.appendChild(n); });
      meteors.appendChild(meteor); pool.push(meteor);
    }
    layer.appendChild(meteors);
    var clouds = document.createElement('div'); clouds.className = 'nb-background__clouds'; layer.appendChild(clouds);
    document.body.insertBefore(layer,document.body.firstChild); sync();
  }
  function destroy() {
    if (destroyed) return; destroyed = true; stopOverlay();
    document.removeEventListener('DOMContentLoaded',mount); document.removeEventListener('visibilitychange',sync);
    if (media.removeEventListener) media.removeEventListener('change',sync); else if (media.removeListener) media.removeListener(sync);
    if (layer) layer.remove(); layer=null; pool=[];
  }
  var api = { setEnabled:function(value) { if (!destroyed) { enabled=Boolean(value); sync(); } return snapshot(); }, destroy:destroy };
  Object.defineProperty(api,'state',{enumerable:true,get:snapshot}); window.NumberBluffBackground=Object.freeze(api);
  document.addEventListener('visibilitychange',sync);
  if (media.addEventListener) media.addEventListener('change',sync); else if (media.addListener) media.addListener(sync);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded',mount,{once:true});
}());
