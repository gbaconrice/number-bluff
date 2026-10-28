const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
test('compact export is deterministic, auditable and keeps third-party notices', async () => {
  const { buildCompact } = await import('../tools/build-compact-html.mjs');
  const { build, auditHTML } = await import('../tools/build-single-html.mjs');
  const output = await buildCompact();
  assert.equal(output, await buildCompact());
  assert.equal(output, fs.readFileSync(path.resolve(__dirname, '../ai-studio.compact.html'), 'utf8').replace(/\r\n/g, '\n'));
  assert.equal(build().replace(/\r\n/g, '\n'), fs.readFileSync(path.resolve(__dirname, '../ai-studio.html'), 'utf8').replace(/\r\n/g, '\n'));
  assert.doesNotThrow(() => auditHTML(output));
  assert.ok(Buffer.byteLength(output) < Buffer.byteLength(build()));
  for (const text of ['Javierrocadev', 'number-flow@0.6.2', 'canvas-confetti']) assert.ok(output.includes(text), text);
  const vm = require('node:vm');
  for (const match of output.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1]);
});
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

test('release asset manifest contains only available, hash-verified runtime artwork', () => {
  const crypto = require('node:crypto');
  const root = path.resolve(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/provenance.json'), 'utf8'));
  assert.equal(new Set(manifest.assets.map(a => a.file)).size, manifest.assets.length);
  for (const asset of manifest.assets) {
    assert.match(asset.file, /^[a-z0-9-]+\.(?:webp|png)$/);
    const bytes = fs.readFileSync(path.join(root, 'assets', asset.file));
    assert.equal(bytes.length, asset.bytes, asset.file + ' byte count');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file + ' hash');
  }
  const publicMetadata = JSON.stringify(manifest);
  assert.doesNotMatch(publicMetadata, /CalpicoFile_|libfile_|\/workspace\/|\/tmp\/|sediment:\/\//);
  assert.equal(manifest.font, undefined, 'system fonts need no obsolete font bundle');
});

test('release sources do not retain removed UI hooks or obsolete asset references', () => {
  const root = path.resolve(__dirname, '..');
  const source = ['index.html','app.js','styles.css','background-motion.css','card-presentation.css']
    .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /resultCards|hanging-stars|TitleMochiy|title-mochiy\.ttf|hero-platform\.webp|celestial-background\.webp/);
  assert.doesNotMatch(source, /\.(?:home-logo|hero-main|hero-friend|galaxy-pool|entry-row)(?![\w-])/);
});


test('license source comments survive packaging without allowing executable external URLs', async t => {
  const {root,build,auditHTML}=await fixture(t,{'index.html':'<script src="a.js"></script>','a.js':'/*! Source: https://example.org/license */\nwindow.ok=true;'});
  assert.ok(build(root).includes('https://example.org/license'));
  assert.throws(()=>auditHTML('<script>window.url="/* https://evil.example/x */";</script>'),/Unowned runtime URL/);
  assert.throws(()=>auditHTML('<script src="evil.js"></script>'),/Unresolved external script/);
  assert.doesNotThrow(()=>auditHTML('<script>URL.createObjectURL(new Blob([]))</script>'));
});

test('CSS ownership audit does not mistake JavaScript URL constructors for CSS functions',async()=>{
 const {auditHTML}=await import('../tools/build-single-html.mjs');
 assert.doesNotThrow(()=>auditHTML('<script>const u=new URL(value); const a=new URL(image.src,document.baseURI)</script>'));
});

test('the real single HTML preserves URL constructors used by avatar resolution',async()=>{
 const {build}=await import('../tools/build-single-html.mjs');
 const html=build();
 assert.ok(html.includes('new URL(value)'));
 assert.ok(!html.includes('new url('));
});

test('SVG namespace identifiers are not runtime network dependencies',async()=>{const {auditHTML}=await import('../tools/build-single-html.mjs');assert.doesNotThrow(()=>auditHTML("<script>const ns='http://www.w3.org/2000/svg';</script>"));assert.throws(()=>auditHTML("<img src='http://www.w3.org/2000/svg/evil.png'>"),/Unowned runtime URL/);});
