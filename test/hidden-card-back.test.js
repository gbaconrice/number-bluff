const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
test('guide and battle share the original guide palette and scaled glint placement',()=>{
 const back=css.slice(css.indexOf('/* One back for the guide and play.'),css.indexOf('.player-card.special'));
 assert.match(back,/container-type: inline-size/);
 assert.match(back,/#5367b5,#112354 70%/);
 assert.match(back,/left: 7\.352941cqw; top: 7\.352941cqw/);
 assert.match(back,/text-shadow: -58\.823529cqw -89\.705882cqw #ffe9b5/);
 assert.doesNotMatch(back,/animation:|filter:|url\(/);
 assert.doesNotMatch(fs.readFileSync('guide-diagrams.css','utf8'),/\.player-card\.hidden[^{}]*\{[^}]*background/);
});
test('back decoration remains CSS-only and unrelated to hidden card identity',()=>{
 const app=fs.readFileSync('app.js','utf8');
 const card=app.slice(app.indexOf('function cardNode'),app.indexOf('function cardNode')+1500);
 assert.match(card,/hidden/);assert.doesNotMatch(css,/\.player-card\.hidden\[data-(?:kind|value|card)/);
});
test('question mark is centred without percentage padding at every viewport',()=>{
 assert.match(css,/\.battle-grid\.many \.player-card\.hidden, \.player-card\.hidden \{ display: flex; align-items: center; justify-content: center; padding: 0;/);
 assert.doesNotMatch(css,/\.player-card\.hidden[^{}]*\{[^}]*padding-top:\s*\d+%/);
});
