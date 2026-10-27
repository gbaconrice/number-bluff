(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffNormalArt = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const assets = Object.freeze({ cloud: 'assets/blue-cloud.webp', cat: 'assets/moon-cat.webp', bunny: 'assets/cloud-bunny.webp', star: 'assets/star-sprite.webp' });
  const values = Object.freeze([-10, -5, 0, 1, 2, 3, 4, 5, 10, 15, 20]);
  // Pure, deterministic composition. No seat, card ID, randomness or private state.
  function layout(value) {
    if (!values.includes(value)) throw new RangeError('Unsupported normal card value');
    const character = value < 0 ? 'cloud' : value === 0 ? 'cat' : value <= 5 ? 'bunny' : 'star';
    const mood = value === -10 ? 'storm' : value === -5 ? 'wind' : value === 0 ? 'rest' : character === 'bunny' ? 'meadow' : 'constellation';
    let boxes;
    if (character === 'star') {
      const rows = value / 5, height = 20, gap = 3, start = (100 - rows * height - (rows - 1) * gap) / 2;
      boxes = Array.from({ length: value }, (_, i) => ({ x: 1 + i % 5 * 20, y: start + Math.floor(i / 5) * 23, width: 18, height }));
    } else if (character === 'bunny') {
      const arrangements = {
        1: [[22, 8, 56, 82]],
        2: [[5, 18, 43, 70], [52, 18, 43, 70]],
        3: [[32, 5, 36, 42], [10, 54, 36, 42], [54, 54, 36, 42]],
        4: [[10, 5, 36, 42], [54, 5, 36, 42], [10, 54, 36, 42], [54, 54, 36, 42]],
        5: [[17, 5, 31, 42], [52, 5, 31, 42], [0, 54, 31, 42], [34.5, 54, 31, 42], [69, 54, 31, 42]]
      };
      boxes = arrangements[value].map(([x, y, width, height]) => ({ x, y, width, height }));
    } else boxes = [{ x: 10, y: 12, width: 80, height: 76 }];
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
      const img = document.createElement('img'); img.src = model.asset; img.alt = ''; img.draggable = false; img.decoding = 'async';
      holder.append(img); group.append(holder);
    });
    scene.append(group);
    return scene;
  }
  return Object.freeze({ assets, values, layout, create });
});
