/* Decorative only: no game state, random source, network, timers or RAF. */
(function () {
  'use strict';
  if (window.NumberBluffBackground) window.NumberBluffBackground.destroy();
  var enabled = true;
  var destroyed = false;
  var layer = null;
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function snapshot() {
    return Object.freeze({
      enabled: enabled,
      reducedMotion: media.matches,
      hidden: document.hidden,
      running: Boolean(layer && enabled && !media.matches && !document.hidden && !destroyed),
      mounted: Boolean(layer),
      destroyed: destroyed
    });
  }
  function sync() {
    if (!layer) return;
    var state = snapshot();
    layer.dataset.motion = state.running ? 'running' : 'paused';
    layer.dataset.static = (!enabled || media.matches) ? 'true' : 'false';
  }
  function mount() {
    if (destroyed || layer || !document.body) return;
    layer = document.createElement('div');
    layer.className = 'nb-background';
    layer.setAttribute('aria-hidden', 'true');
    // Positions are a fixed decorative pattern, never the game's random stream.
    for (var i = 0; i < 16; i += 1) {
      var star = document.createElement('i');
      star.className = 'nb-background__star';
      star.style.setProperty('--star-x', (4 + ((i * 37) % 92)) + '%');
      star.style.setProperty('--star-y', (3 + ((i * 23) % 82)) + '%');
      star.style.setProperty('--star-size', (i % 4 === 0 ? 4 : 2) + 'px');
      star.style.setProperty('--star-cycle', (8 + (i % 8)) + 's');
      star.style.setProperty('--star-delay', (-i * 1.7) + 's');
      layer.appendChild(star);
    }
    var shooting = document.createElement('i');
    shooting.className = 'nb-background__shooting-star';
    layer.appendChild(shooting);
    var clouds = document.createElement('div');
    clouds.className = 'nb-background__clouds';
    layer.appendChild(clouds);
    document.body.insertBefore(layer, document.body.firstChild);
    sync();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    document.removeEventListener('DOMContentLoaded', mount);
    document.removeEventListener('visibilitychange', sync);
    if (media.removeEventListener) media.removeEventListener('change', sync);
    else if (media.removeListener) media.removeListener(sync);
    if (layer) layer.remove();
    layer = null;
  }
  var api = {
    setEnabled: function (value) {
      if (!destroyed) { enabled = Boolean(value); sync(); }
      return snapshot();
    },
    destroy: destroy
  };
  Object.defineProperty(api, 'state', { enumerable: true, get: snapshot });
  window.NumberBluffBackground = Object.freeze(api);
  document.addEventListener('visibilitychange', sync);
  if (media.addEventListener) media.addEventListener('change', sync);
  else if (media.addListener) media.addListener(sync);
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
}());
