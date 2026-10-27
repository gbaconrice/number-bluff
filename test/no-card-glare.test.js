const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
test('diagonal glare runtime and unused source-only notice are removed',()=>{
 for(const file of ['component-card-motion.js','component-card-motion.css','THIRD_PARTY_NOTICES.card-motion.txt'])assert.equal(fs.existsSync(path.join(root,file)),false,file);
 for(const file of ['index.html','app.js','special-effects-controller.js'])assert.doesNotMatch(fs.readFileSync(path.join(root,file),'utf8'),/NumberBluffCardMotion|component-card-motion|cardMotion|glare/);
 assert.equal(fs.existsSync(path.join(root,'THIRD_PARTY_NOTICES.top-motion.txt')),true,'TOP notice must remain');
});

test('card observer ignores text countdown and SVG-internal child updates',()=>{
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(source,/node\.nodeType === 1 && \(node\.matches\('\.player-card'\) \|\| node\.querySelector\('\.player-card'\)\)/);
 assert.match(source,/record\.addedNodes, \.\.\.record\.removedNodes\]\.some\(containsCard\)/);
 assert.doesNotMatch(source,/new MutationObserver\(syncCardMotion\)/);
});
test('special numeral stacking no longer depends on removed foil class',()=>{
 assert.match(fs.readFileSync(path.join(root,'card-art.css'),'utf8'),/\.player-card:not\(\.hidden\):not\(\.out\) \.card-value\{z-index:4\}/);
});
test('result presentation preserves the round, survivors and timer header children',()=>{
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.doesNotMatch(source,/\$\('battleTitle'\)\.textContent\s*=/);
 assert.match(source,/\$\('resultTitle'\)\.textContent = \$\('battlePhase'\)\.textContent/);
});

test('sound update preserves HOME icon and caption markup',()=>{assert.match(fs.readFileSync(path.join(root,'app.js'),'utf8'),/if \(icon\) icon\.textContent = '♪'; else button\.textContent/);});
