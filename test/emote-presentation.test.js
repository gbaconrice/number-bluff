'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');

test('reaction stickers read as independent pop stickers without changing player layout',()=>{
 assert.match(app,/avatar\.append\(playerAvatar\(p\.id\),el\('div','emote-slot'\)\)/);
 assert.match(app,/const vitals=el\('div','player-vitals'\)/);
 assert.match(app,/block\.querySelector\('\.emote-slot'\)\?\.append\(stamp\)/);
 assert.match(css,/\.emote-slot\{position:absolute/);
 assert.match(css,/\.emote-slot:has\(\.emote-stamp\)::before\{content:"";position:absolute;inset:2px;border:2px solid #[a-f\d]+;border-radius:/i);
 assert.match(css,/\.player-info \.emote-slot \.emote-stamp\{position:relative;z-index:1;display:block;width:54px;height:54px/);
 assert.match(css,/\.emote-slot:has\(\.emote-stamp\)::before\{[^}]*animation:emote-pop 2\.2s ease-out both\}/);
 assert.match(css,/\.player-info \.emote-slot \.emote-stamp\{[^}]*animation:emote-pop 2\.2s ease-out both\}/);
 assert.doesNotMatch(css,/emote-anchor:has\(\.emote-stamp\).*visibility:hidden/);
 assert.match(css,/\.battle-grid\.many \.emote-slot\{width:64px;height:64px\}/);
 assert.match(css,/\.battle-grid\.many \.player-info \{ height: 99px;[^}]*grid-template-rows: 11px 64px 20px;/);
 assert.match(css,/\.player-vitals\{display:grid;grid-row:3;grid-template-columns:minmax\(0,1fr\);grid-template-rows:14px 10px;/);
 assert.match(css,/\.battle-grid:not\(\.many\) \.emote-slot\{width:64px;height:64px\}/);
});

test('random lobby avatar is a bare question mark and the home captions share type sizing',()=>{
 assert.match(html,/<button id="randomBot"[^>]*>？<\/button>/);
 assert.match(css,/\.lobby-seat \.bot-avatar-missing\{background:transparent;border:0;border-radius:0;box-shadow:none\}/);
 assert.match(css,/\.home-icons \.icon-caption \{[^}]*font-size: 12px; font-weight: 800; line-height: 1\.3;/);
});
