// Prototype-only guard. Run explicitly while the older technique tests coexist.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'special-svg-motion.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'special-svg-motion.css'), 'utf8');
// Verified against the immutable originals in main commit 6b247203, not generated art.
const originals = {
  double: '30a934fac409ab9794ec0a3ded162a624482bf6b2153974c81d990017287da91',
  extra: '05b195451d6d2451c17bc7c808e330bd9355514a6b9013d8e1754eb71e63cd57',
  max0: 'd87557aa91617ff2c06d989c34f2bc838c3651658d9d6369491d6d57fc01fcce',
  reset: '99eacc9e011d7d07f02a80b7bd1d4b74e72854a0be50315682c921384aa7b533'
};
const dimensions = { double: [1051,1496], extra: [1049,1500], max0: [1049,1499], reset: [1062,1482] };
const markupContext = {};
vm.runInNewContext(source.slice(source.indexOf('const ART='), source.indexOf('\nfunction createManager(')) + '\nthis.renderMarkup = markup;', markupContext);
const markup = kind => markupContext.renderMarkup(kind, 'prototype');
function fixture(kind, useCurrentSrc = true) {
  const attrs = () => ({ attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } });
  let svg;
  const doc = {
    baseURI: 'https://tanabe0422.github.io/number-bluff/', hidden: false,
    addEventListener() {}, removeEventListener() {}, querySelector() { return null; },
    createElement() { return { dataset: {}, style: { setProperty(k,v) { this[k]=v; } }, setAttribute() {}, removeAttribute() {}, append(child) { this.child=child; }, remove() {} }; },
    createElementNS() { svg = { ...attrs(), images: [], set innerHTML(value) { this.markup=value; this.images=[...value.matchAll(/<image\b[^>]*>/g)].map(() => attrs()); }, querySelectorAll(selector) { return selector==='image'?this.images:[]; } }; return svg; }
  };
  const face = { isConnected: true, clientWidth: 180, clientHeight: 270, offsetWidth: 180, offsetHeight: 270,
    classList: { add() {}, remove() {}, contains(name) { return name==='card-content'; } },
    closest() { return null; }, append(node) { this.layer=node; }, getBoundingClientRect() { return {left:0,top:0,right:180,bottom:270,width:180,height:270}; }
  };
  const originalURL = `https://tanabe0422.github.io/number-bluff/assets/card-${kind}.webp`;
  const image = { parentElement: face, currentSrc: useCurrentSrc?originalURL:'', src: originalURL, closest() { return face; } };
  const win = { addEventListener() {}, removeEventListener() {} };
  vm.runInNewContext(source, { window: win, document: doc, URL, innerWidth: 390, innerHeight: 844,
    matchMedia: () => ({matches:false,addEventListener(){},removeEventListener(){}}),
    getComputedStyle: element => ({visibility:'visible',width:'180px',height:element===image?'256px':'270px'}),
    ResizeObserver: class { observe(){} unobserve(){} disconnect(){} },
    IntersectionObserver: class { observe(){} unobserve(){} disconnect(){} }, setTimeout, clearTimeout
  });
  const manager=win.NumberBluffSpecialSVG.createManager();manager.attach(face,kind,{imageElement:image});
  return {manager,face,image,svg,originalURL};
}
test('all four special raster originals remain byte-identical to approved main', () => {
  for (const [kind, expected] of Object.entries(originals)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,`assets/card-${kind}.webp`))).digest('hex'), expected, kind);
});
test('visible glow pixels derive only from the original image, never painted strokes or extra shapes', () => {
  for (const kind of Object.keys(originals)) {
    const rendered=markup(kind), visible=rendered.slice(rendered.lastIndexOf('</defs>')+7);
    assert.match(visible, /^<g class="art-derived-light" mask="url\(#prototype-reveal\)">/);
    assert.doesNotMatch(rendered, /painted-track|contrast-track|light-track|reset-card|orbit-card|cross.?plane|radiance/);
    assert.doesNotMatch(visible, /<(?:path|ellipse|circle|rect|polygon|polyline|text|use)\b/);
    const [width,height]=dimensions[kind];
    const images=[...rendered.matchAll(/<image\b([^>]*)\/>/g)];assert.equal(images.length,3);
    for(const [,attributes] of images){assert.match(attributes,new RegExp(`x="0" y="0" width="${width}" height="${height}"`));assert.doesNotMatch(attributes,/transform=|style=/);}
  }
});
test('luminance and feathered selection are masks, not visible geometry', () => {
  for(const kind of Object.keys(originals)){
    const rendered=markup(kind);
    assert.match(rendered, /<mask id="prototype-painted-light"[^>]*style="mask-type:luminance">/);
    assert.match(rendered, /<feColorMatrix type="saturate" values="0"\/>/);
    assert.match(rendered, /<mask id="prototype-region"[^>]*style="mask-type:luminance">/);
    assert.match(rendered, /<rect class="art-light-sweep"/);
    assert.match(rendered, /<g mask="url\(#prototype-region\)"><g mask="url\(#prototype-painted-light\)">/);
  }
});
test('every overlay image uses exactly the displayed original URL for currentSrc and src fallback', () => {
  for(const kind of Object.keys(originals))for(const current of [true,false]){
    const f=fixture(kind,current);assert.equal(f.svg.images.length,3);for(const image of f.svg.images)assert.equal(image.attributes.href,f.originalURL);
    assert.equal(f.svg.attributes.viewBox,`0 0 ${dimensions[kind].join(' ')}`);f.manager.destroy();
  }
});
test('prototype retains shared CSS art coordinates and animates the mask, not the raster geometry', () => {
  for(const kind of Object.keys(originals)){
    const f=fixture(kind);assert.equal(f.face.layer.style.left,'0px');assert.equal(f.face.layer.style.top,'auto');assert.equal(f.face.layer.style.bottom,'0px');assert.equal(f.face.layer.style.width,'100%');assert.equal(f.face.layer.style.height,'var(--card-source-height,100%)');f.manager.destroy();
  }
  assert.doesNotMatch(css,/\.(?:art-derived-light|art-bloom-source|art-sheen-source|art-luminance-source)\s*\{[^}]*(?:animation|transform)\s*:/);
  assert.match(css,/\.art-light-sweep\{animation:/);
  assert.match(css,/\[data-playing=false\]\s*\*\{animation-play-state:paused!important\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
