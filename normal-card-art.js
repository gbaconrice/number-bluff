(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    root.NumberBluffNormalArt = factory();
    // Warm public art only; never block engine input or wait for private cards.
    root.NumberBluffNormalArt.preload(root.Image);
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const assets = Object.freeze({ cloud: 'assets/blue-cloud.webp', cat: 'assets/moon-cat.webp', bunny: 'assets/cloud-bunny.webp', star: 'assets/star-sprite.webp' });
  // Alpha > 5 bounds plus a 16px antialiasing margin. SVG crops only empty
  // source canvas; the canonical raster pixels, colours and face are unchanged.
  const crops = Object.freeze({
    bunny: Object.freeze({ width: 1254, height: 1254, viewBox: '137 140 975 959' }),
    cat: Object.freeze({ width: 1254, height: 1254, viewBox: '127 146 1091 962' }),
    cloud: Object.freeze({ width: 1584, height: 993, viewBox: '99 160 1393 689' }),
    star: Object.freeze({ width: 1254, height: 1254, viewBox: '76 132 1104 961' })
  });
  let preloadPromise = null;
  const pendingImages = new Set();
  function preload(ImageClass) {
    if (preloadPromise) return preloadPromise;
    if (typeof ImageClass !== 'function') return Promise.resolve([]);
    // Each closure retains its Image until decode/load settles, including errors.
    preloadPromise = Promise.all(Object.values(assets).map(src => new Promise(resolve => {
      let image;
      let settled = false;
      const done = loaded => {
        if (settled) return;
        settled = true;
        if (image) { image.onload = null; image.onerror = null; pendingImages.delete(image); }
        resolve({ src, loaded });
      };
      try {
        image = new ImageClass(); pendingImages.add(image);
        image.onload = () => done(true); image.onerror = () => done(false);
        image.src = src;
        if (typeof image.decode === 'function') Promise.resolve(image.decode()).then(() => done(true), () => done(false));
        else if (image.complete) done(image.naturalWidth > 0);
      } catch { done(false); }
    })));
    return preloadPromise;
  }
  const values = Object.freeze([-10, -5, 0, 1, 2, 3, 4, 5, 10, 15, 20]);
  // Pure, deterministic composition. No seat, card ID, randomness or private state.
  function layout(value) {
    if (!values.includes(value)) throw new RangeError('Unsupported normal card value');
    const character = value < 0 ? 'cloud' : value === 0 ? 'cat' : value <= 5 ? 'bunny' : 'star';
    const mood = value === -10 ? 'storm' : value === -5 ? 'wind' : value === 0 ? 'rest' : character === 'bunny' ? 'meadow' : 'constellation';
    let boxes;
    if (character === 'star') {
      const rows = value / 5, height = 20, gap = 3, start = (100 - rows * height - (rows - 1) * gap) / 2;
      boxes = Array.from({ length: value }, (_, i) => ({ x: .5 + i % 5 * 20, y: start + Math.floor(i / 5) * 23, width: 19, height }));
    } else if (character === 'bunny') {
      const arrangements = {
        1: [[7, 8, 86, 85]],
        2: [[1, 14, 48, 78], [51, 14, 48, 78]],
        3: [[29, 5, 42, 42], [6, 54, 42, 42], [52, 54, 42, 42]],
        4: [[6, 5, 42, 42], [52, 5, 42, 42], [6, 54, 42, 42], [52, 54, 42, 42]],
        5: [[17, 5, 31, 42], [52, 5, 31, 42], [0, 54, 31, 42], [34.5, 54, 31, 42], [69, 54, 31, 42]]
      };
      boxes = arrangements[value].map(([x, y, width, height]) => ({ x, y, width, height }));
    } else boxes = [{ x: 6, y: 10, width: 88, height: 82 }];
    return Object.freeze({ value, character, mood, asset: assets[character], figures: Object.freeze(boxes.map((box, index) => Object.freeze({ ...box, index, delay: -3.1 - (index % 5) * .28 }))) });
  }
  function create(document, value) {
    const model = layout(value), scene = document.createElement('span');
    scene.className = 'normal-art-scene normal-art-' + model.mood;
    scene.setAttribute('aria-hidden', 'true');
    scene.dataset.character = model.character;
    const ambience = document.createElement('span'); ambience.className = 'normal-art-ambience';
    if (value < 0) {
      const ns = 'http:' + '//www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('focusable', 'false');
      const paths = value === -10 ? ['M15 72l-4 9m25-5l-4 9m32-8l-4 9m24-14l-4 9', 'M62 60l-7 14h9l-7 15'] : ['M6 68c12-7 21 7 35 0s20-7 29-2', 'M25 82c13-6 26 5 43-1s22-4 24-2'];
      paths.forEach((d, i) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'normal-weather-line weather-' + i); svg.append(p); }); ambience.append(svg);
    }
    scene.append(ambience);
    const group = document.createElement('span'); group.className = 'normal-art-figures';
    model.figures.forEach(figure => {
      const holder = document.createElement('span'); holder.className = 'normal-art-figure';
      for (const key of ['x', 'y', 'width', 'height']) holder.style.setProperty('--figure-' + key, figure[key] + '%');
      holder.style.setProperty('--figure-delay', figure.delay + 's');
      const ns = 'http:' + '//www.w3.org/2000/svg', crop = crops[model.character];
      const sprite = document.createElementNS(ns, 'svg');
      sprite.setAttribute('class', 'normal-art-character');
      sprite.setAttribute('viewBox', crop.viewBox); sprite.setAttribute('preserveAspectRatio', 'xMidYMid meet'); sprite.setAttribute('focusable', 'false');
      const image = document.createElementNS(ns, 'image');
      image.setAttribute('href', model.asset); image.setAttribute('width', crop.width); image.setAttribute('height', crop.height);
      sprite.append(image); holder.append(sprite); group.append(holder);
    });
    scene.append(group);
    return scene;
  }
  return Object.freeze({ assets, crops, values, layout, create, preload });
});
