'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
test('declaration is one native button containing the noneditable digit display', () => {
  assert.match(html, /<button id="declare"[^>]*>[\s\S]*?<span id="number"[^>]*><\/span>[\s\S]*?<span class="declare-label">宣言<\/span><\/button>/);
  assert.doesNotMatch(html, /<input[^>]*id="number"/);
  assert.doesNotMatch(app, /\$\('number'\)\.value|\$\('number'\)\.addEventListener/);
  assert.match(app, /\$\('declare'\)\.disabled \|\| event.detail > 1/);
});
test('round and survivor information replaces the old battle heading', () => {
  assert.match(html, /id="battleTitle">[\s\S]*?id="roundLabel"[\s\S]*?id="survivorCount"[\s\S]*?<\/h1>/);
  assert.doesNotMatch(app, /active \? '対戦中'/);
  assert.match(app, /active && view.turnClock/);
});
test('total is centered including fallback digits and active border is inset', () => {
  assert.match(css, /\.final-total \{[^}]*align-items: center/);
  assert.match(css, /\.final-total strong \{[^}]*justify-content: center/);
  assert.match(css, /\.final-total > span \{/);
  assert.doesNotMatch(css, /\.final-total span \{/);
  assert.match(css, /\.battle-player\.active \.player-info \{[^}]*box-shadow: inset/);
});
test('sound controls are direct buttons rather than a settings screen', () => {
  for (const id of ['homeSoundToggle','battleSoundToggle']) assert.match(html, new RegExp('<button id="'+id+'"[^>]*data-sound-toggle'));
});
