const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../special-svg-motion.js'), 'utf8');
const css = fs.readFileSync(require.resolve('../special-svg-motion.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Exercise the production pure markup function, without adding a runtime test hook.
const pureMarkup = source.slice(source.indexOf('function markup('), source.indexOf('\nfunction createManager('));
const context = {};
vm.runInNewContext(pureMarkup + '\nthis.renderMarkup = markup;', context);
const markup = kind => context.renderMarkup(kind, 'fixture');
const kinds = ['double', 'extra', 'max0', 'reset'];
function keyframes(text) {
  const result = new Map(), pattern = /@keyframes\s+([\w-]+)\s*\{/g;
  let match;
  while ((match = pattern.exec(text))) {
    const start = pattern.lastIndex; let depth = 1, end = start;
    for (; end < text.length && depth; end++) { if (text[end] === '{') depth++; if (text[end] === '}') depth--; }
    assert.equal(depth, 0, 'CSS keyframes must be balanced');
    result.set(match[1], text.slice(start, end - 1).replace(/\s/g, '')); pattern.lastIndex = end;
  }
  return result;
}
test('special artwork adds no rejected free-standing shapes, cards, halos or spatial geometry', () => {
  for (const kind of kinds) {
    const rendered = markup(kind);
    assert.doesNotMatch(rendered, /halo|cross.?plane|radiance|expanding|wave|reset-card|orbit-card|card-back|premonition|particle|sweat/i, kind);
    assert.doesNotMatch(rendered, /<(?:animate|animateTransform|animateMotion|filter|feGaussianBlur|image|foreignObject)\b/i, kind);
    const transforms = [...rendered.matchAll(/\btransform="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(transforms, kind === 'double' ? ['translate(535 963) rotate(-28)'] : [], 'only the fixed original galaxy orientation is allowed');
  }
});
test('painted tracks retain source-aligned geometry and normalized light travel', () => {
  const expected = {
    double: ['rx="390" ry="129" pathLength="100"', 'rx="296" ry="98" pathLength="100"'],
    extra: ['cx="535" cy="994" rx="268" ry="275" pathLength="100"', 'd="M411 844 C470 898 641 895 601 973 S435 1070 513 1110" pathLength="100"'],
    reset: ['d="M343 965 C304 1097 418 1216 553 1200 C716 1180 779 1007 683 880 C628 807 548 795 469 812" pathLength="100"']
  };
  for (const [kind, attributes] of Object.entries(expected)) {
    const rendered = markup(kind), tracks = [...rendered.matchAll(/<(path|ellipse) class="([^"]*painted-track[^"]*)" ([^>]+)\/>/g)];
    assert.equal(tracks.length, attributes.length * 2, kind + ': one light and contrast trace per painted feature');
    attributes.forEach((geometry, index) => {
      assert.ok(tracks[index * 2][3].startsWith(geometry)); assert.ok(tracks[index * 2 + 1][3].startsWith(geometry));
      assert.match(tracks[index * 2][2], /contrast-track/); assert.match(tracks[index * 2 + 1][2], /light-track/);
    });
  }
});
test('crown shine is clipped inside the existing crown rather than floating around the cat', () => {
  const rendered = markup('max0');
  assert.match(rendered, /<clipPath id="fixture-crown"><path d="M509 723 L516 654 L550 679 L609 628 L647 695 L688 683 L672 746 Q590 716 509 723Z"\/><\/clipPath>/);
  assert.match(rendered, /<g clip-path="url\(#fixture-crown\)"><rect class="crown-metal-sweep"[^>]+\/><\/g>$/);
  assert.equal((rendered.match(/<rect\b/g) || []).length, 1);
  assert.doesNotMatch(rendered, /painted-track|circle|ellipse/);
});
test('sphere highlights stay clipped to its original glass outline', () => {
  assert.match(markup('extra'), /<clipPath id="fixture-orb"><ellipse cx="535" cy="994" rx="282" ry="286"\/><\/clipPath>/);
  assert.match(markup('extra'), /<g clip-path="url\(#fixture-orb\)">/);
  assert.doesNotMatch(markup('extra'), /<rect\b|\btransform=/);
});
test('CSS animates only travelling dash light and the clipped crown sweep', () => {
  const frames = keyframes(css);
  assert.deepEqual([...frames.keys()].sort(), ['nbsv-crown-sweep', 'nbsv-painted-light']);
  assert.equal(frames.get('nbsv-painted-light'), 'to{stroke-dashoffset:-100}');
  assert.equal(frames.get('nbsv-crown-sweep'), 'from{transform:translateX(0)}to{transform:translateX(300px)}');
  assert.doesNotMatch(css, /rotate\(|scale\(|translateY\(|filter\s*:|box-shadow\s*:|radial-gradient\(/i);
  assert.match(css, /\.painted-track\{[^}]*animation:nbsv-painted-light\s+[^}]*infinite/);
  assert.match(css, /\.crown-metal-sweep\{animation:nbsv-crown-sweep\s+[^}]*infinite/);
});
test('aligned highlights retain noninteractive layering and motion-stop safeguards', () => {
  assert.match(css, /\.nb-special-svg\{[^}]*pointer-events:none/);
  assert.match(css, /\.nb-special-svg\[data-playing=false\]\s+\*\{animation-play-state:paused!important\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.nb-special-svg\{display:none!important\}/);
  assert.match(source, /viewBox',`0 0 \$\{a.width\} \$\{a.height\}`/);
});
