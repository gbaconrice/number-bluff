const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
async function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'number-bluff-package-'));
  t.after(() => fs.rmSync(root, { recursive:true, force:true }));
  for (const [name, content] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, name)), {recursive:true}); fs.writeFileSync(path.join(root, name), content); }
  return {root, ...(await import('../tools/build-single-html.mjs'))};
}
test('single HTML is deterministic, ordered, inline, with absolute owned assets', async t => {
  const {root, build, ASSET_BASE} = await fixture(t, {
    'index.html':'<link rel="stylesheet" href="css/site.css"><img src="assets/a.webp"><script src="a.js"></script><script src="b.js"></script>',
    'css/site.css':'.a{background:url(../assets/bg.webp)} @font-face{src:url(../assets/font.ttf)}',
    'a.js':"window.first = 'assets/a.webp';", 'b.js':'window.second = `assets/${name}.webp`;'
  });
  const output = build(root);
  assert.equal(output, build(root));
  assert.ok(output.indexOf('window.first') < output.indexOf('window.second'));
  assert.ok(output.includes(ASSET_BASE+'assets/font.ttf'));
  assert.ok(output.includes(ASSET_BASE+'assets/${name}.webp'));
  assert.doesNotMatch(output, /<script[^>]*src=|<link/);
});
test('packaging refuses external scripts and CSS imports', async t => {
  const {root, build} = await fixture(t, {'index.html':'<script src="https://cdn.example/a.js"></script>'});
  assert.throws(() => build(root), /External runtime/);
  fs.writeFileSync(path.join(root,'index.html'), '<link rel="stylesheet" href="a.css">');
  fs.writeFileSync(path.join(root,'a.css'), '@import "remote.css";');
  assert.throws(() => build(root), /@import/);
});
test('final audit rejects unresolved and unowned runtime assets', async t => {
  const {auditHTML} = await fixture(t, {});
  for (const html of ['<img src="a.png">','<script src="app.js"></script>',"const x='assets/a.png'",'<style>a{background:url(https://cdn.example/a.png)}</style>']) assert.throws(() => auditHTML(html));
});
