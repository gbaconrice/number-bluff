const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { assets, crops, values, layout, create } = require('../normal-card-art');
function fakeDocument() {
  function node(tag) { return { tag, children: [], attributes: {}, dataset: {}, style: { setProperty(k,v) { this[k] = v; } }, setAttribute(k,v) { this.attributes[k] = v; }, append(...children) { this.children.push(...children); } }; }
  return { createElement: node, createElementNS: (_, tag) => node(tag) };
}
test('all eleven approved values map to exact canonical assets and counts', () => {
  assert.deepEqual(values, [-10,-5,0,1,2,3,4,5,10,15,20]);
  for (const value of values) {
    const model = layout(value);
    const character = value < 0 ? 'cloud' : value === 0 ? 'cat' : value <= 5 ? 'bunny' : 'star';
    assert.equal(model.character, character);
    assert.equal(model.asset, assets[character]);
    assert.equal(model.figures.length, value > 0 ? value : 1);
    assert.deepEqual(layout(value), model, 'deterministic composition');
    assert.ok(Object.isFrozen(model) && Object.isFrozen(model.figures));
  }
  for (const value of [null, undefined, '5', NaN, 6, -1, 30]) assert.throws(() => layout(value), RangeError);
});
test('figure boxes are inside the art field and never overlap', () => {
  for (const value of values) {
    const figures = layout(value).figures;
    for (const a of figures) {
      assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= 100 && a.y + a.height <= 100, `${value}: bounds`);
      for (const b of figures) if (a.index < b.index) {
        assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, `${value}: overlap`);
      }
    }
  }
});
test('high values have exactly five stars in each stable row', () => {
  for (const value of [10,15,20]) {
    const rows = new Map();
    for (const f of layout(value).figures) rows.set(f.y, (rows.get(f.y) || 0) + 1);
    assert.equal(rows.size, value / 5);
    assert.deepEqual([...rows.values()], Array(value / 5).fill(5));
  }
});
test('DOM contains only the specified canonical figures and marks art decorative', () => {
  for (const value of values) {
    const scene = create(fakeDocument(), value), model = layout(value);
    assert.equal(scene.attributes['aria-hidden'], 'true');
    assert.equal(scene.dataset.character, model.character);
    const figures = scene.children.find(n => n.className === 'normal-art-figures').children;
    assert.equal(figures.length, model.figures.length);
    figures.forEach(n => { assert.equal(n.children.length, 1); assert.equal(n.children[0].tag, 'svg'); assert.equal(n.children[0].attributes.viewBox, crops[model.character].viewBox); assert.equal(n.children[0].attributes.preserveAspectRatio, 'xMidYMid meet'); assert.equal(n.children[0].children[0].attributes.href, model.asset); });
  }
});
test('public-face hook follows hidden/out guards and legacy normal artwork is not runtime referenced', () => {
  const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const start = app.indexOf('function cardNode('), end = app.indexOf('function clearError()', start), body = app.slice(start,end);
  assert.ok(body.indexOf('if (hidden || !card)') < body.indexOf('NumberBluffNormalArt.create'));
  assert.ok(body.indexOf('if (out)') < body.indexOf('NumberBluffNormalArt.create'));
  assert.doesNotMatch(body, /skin-(?:ice|cream|pink|gold)/);
  const css = fs.readFileSync(require.resolve('../styles.css'), 'utf8');
  assert.doesNotMatch(css, /assets\/card-(?:ice-cloud|cream-star|pink-bunny|gold-cat)/);
  const art = fs.readFileSync(require.resolve('../normal-card-art.css'), 'utf8');
  assert.match(art, /top: 38%/);
  assert.doesNotMatch(art, /filter\s*:/);
});
test('animated positive formations retain bounded non-overlapping envelopes', () => {
  for (const value of [1,2,3,4,5,10,15,20]) {
    const model = layout(value);
    const envelopes = model.figures.map(f => ({
      x: f.x, width: f.width,
      y: f.y - (model.character === 'bunny' ? f.height * .08 : 3),
      bottom: f.y + f.height * (model.character === 'bunny' ? 1.02 : 1)
    }));
    envelopes.forEach((a,i) => {
      assert.ok(a.y >= 0 && a.bottom <= 100, `${value}: animated bounds`);
      envelopes.slice(i+1).forEach(b => assert.ok(a.x+a.width <= b.x || b.x+b.width <= a.x || a.bottom <= b.y || b.bottom <= a.y, `${value}: animated overlap`));
    });
    assert.ok(model.figures[0].delay <= -3.1, 'first movement starts immediately, not after a three-second wait');
  }
});
test('public sprite preload is nonblocking, deduplicated and handles decode rejection', async () => {
  const { preload } = require('../normal-card-art');
  const requests = [], images = [];
  class MockImage {
    constructor() { images.push(this); }
    set src(value) { requests.push(value); }
    decode() { return requests.length === 2 ? Promise.reject(new Error('decode failed')) : Promise.resolve(); }
  }
  const first = preload(MockImage), second = preload(MockImage);
  assert.equal(first, second);
  assert.deepEqual(requests, Object.values(assets));
  const result = await first;
  assert.equal(result.length, 4); assert.equal(result.filter(x => x.loaded).length, 3);
  assert.ok(images.every(image => image.onload === null && image.onerror === null));
  assert.equal(preload(MockImage), first); assert.equal(requests.length, 4);
});
