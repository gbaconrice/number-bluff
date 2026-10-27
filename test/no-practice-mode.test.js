'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('runtime UI and handoff do not invent a practice mode for BOT matches', () => {
 const root = path.join(__dirname, '..');
 const files = fs.readdirSync(root).filter(name => /\.(?:js|html)$/.test(name));
 files.push('README.md', 'GRAVITY_ADAPTER.md', 'AI_STUDIO_HANDOFF.md');
 for (const name of files) {
  assert.doesNotMatch(fs.readFileSync(path.join(root, name), 'utf8'), /練習|practice/i, name);
 }
});

test('card label shows reset value and turn explanation stays neutral', () => {
 const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
 assert.match(app, /リセット（0）/);
 assert.match(app, /'1手30秒。/);
 assert.doesNotMatch(app, /人間の手番/);
 const css = fs.readFileSync(path.join(__dirname, '../card-art.css'), 'utf8');
 assert.match(css, /kind-reset:not\(.hidden\):not\(.out\) .card-value \{ font-size: 11cqw;/);
});
