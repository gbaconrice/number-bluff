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
