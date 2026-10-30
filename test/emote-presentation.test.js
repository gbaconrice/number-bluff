'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');

test('reaction sticker pops over the fixed avatar without moving player layout',()=>{
 assert.match(app,/avatar\.append\(playerAvatar\(p\.id\),el\('div','emote-slot'\)\)/);
 assert.match(app,/info\.append\(playerName, avatar, vitals\)/);
 assert.match(app,/const vitals=el\('div','player-vitals'\)/);
 assert.match(app,/block\.querySelector\('\.emote-slot'\)\?\.append\(stamp\)/);
 assert.match(css,/\.emote-anchor\{position:relative;display:flex;grid-row:2;[^}]*height:64px/);
 assert.match(css,/\.emote-slot\{position:absolute;z-index:2;top:50%;left:50%;[^}]*width:64px;height:64px;transform:translate\(-50%,-50%\)/);
 assert.match(css,/\.battle-grid \.player-info \.emote-slot img\.emote-stamp\{[^}]*width:60px;height:60px[^}]*object-fit:contain[^}]*animation:emote-pop 2\.2s ease-out both\}/);
 assert.doesNotMatch(css,/\.emote-slot:has\(\.emote-stamp\)::before/,'transparent art effects must not be hidden by a generic round badge');
 assert.doesNotMatch(css,/\.emote-slot\{[^}]*background:|\.emote-slot\{[^}]*clip-path:/,'the artwork keeps its complete transparent silhouette');
 assert.doesNotMatch(css,/emote-anchor:has\(\.emote-stamp\).*visibility:hidden/);
 assert.match(css,/\.battle-grid\.many \.emote-slot\{width:64px;height:64px\}/);
 assert.match(css,/\.battle-grid\.many \.player-info \{ height: 99px;[^}]*grid-template-rows: 11px 64px 20px;/);
 assert.match(css,/\.player-vitals\{display:grid;grid-row:3;grid-template-columns:minmax\(0,1fr\);grid-template-rows:14px 10px;/);
 assert.doesNotMatch(css,/\.battle-grid\.many \.wins-badge \{[^}]*grid-(?:column|row):/);
 assert.match(css,/\.player-info \{ display: grid; grid-template-columns: minmax\(0,1fr\); grid-template-rows: 15px 64px 24px;[^}]*height: 111px;/);
 assert.match(css,/\.battle-grid:not\(\.many\) \.emote-slot\{width:64px;height:64px\}/);
 assert.match(css,/\.battle-grid:not\(\.many\) \.player-info\{height:111px;grid-template-rows:15px 64px 24px\}/);
});

test('random lobby avatar is a bare question mark and the home captions share type sizing',()=>{
 assert.match(html,/<button id="randomBot"[^>]*>？<\/button>/);
 assert.match(css,/\.lobby-seat \.bot-avatar-missing\{background:transparent;border:0;border-radius:0;box-shadow:none\}/);
 assert.match(css,/\.home-icons \.icon-caption \{[^}]*font-size: 12px; font-weight: 800; line-height: 1\.3;/);
});

test('final expressive sticker identities, alpha dimensions and provenance match runtime bytes',()=>{
 const crypto=require('node:crypto');
 const records=JSON.parse(fs.readFileSync('assets/provenance.json','utf8')).assets;
 const names=['emote-bunny-surprised','emote-cat-confident','emote-cloud-anxious','emote-star-skeptical'];
 const labels=['驚き','喜び','悲しみ','ニヤリ'];
 assert.match(app,/const emoteLabels = \['驚き','喜び','悲しみ','ニヤリ'\]/);
 names.forEach((name,i)=>{
  const b=fs.readFileSync('assets/'+name+'.webp'),record=records.find(r=>r.file===name+'.webp');
  assert.equal(b.toString('ascii',12,16),'VP8X');
  assert.equal(1+b.readUIntLE(24,3),512);assert.equal(1+b.readUIntLE(27,3),512);
  assert.ok(b[20]&16,'transparent effects remain intact');
  assert.equal(record.semantic_label,labels[i]);assert.equal(record.bytes,b.length);
  assert.equal(record.sha256,crypto.createHash('sha256').update(b).digest('hex'));
 });
 assert.match(css,/prefers-reduced-motion:reduce\)\{[^}]*\.battle-grid \.player-info \.emote-slot img\.emote-stamp\{animation:none/);
});

// The reserved pop area must also show the ordinary player identity at a useful size.
test("ordinary battle avatars fill their reserved identity area",()=>{assert.match(css,/\.battle-grid\.many \.player-info \.emote-anchor > \.avatar \{ width:48px; height:48px;/);});
