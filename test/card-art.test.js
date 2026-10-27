const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {assets,source,create}=require('../card-art');
const engine=require('../engine');
test('all physical cards map to fifteen distinct approved original scenes',()=>{
 const normals=engine.FULL_DECK.filter(c=>c.kind==='number');assert.equal(new Set(normals.map(c=>source(c))).size,11);
 assert.equal(new Set(engine.FULL_DECK.map(c=>source(c))).size,15);
 for(const card of engine.FULL_DECK){const file=source(card);assert.ok(file);assert.ok(fs.existsSync(path.join(__dirname,'..',file)));}
 assert.match(source({kind:'number',value:10}),/valley-v4/);assert.match(source({kind:'number',value:15}),/cloudsteps-v2/);assert.match(source({kind:'number',value:20}),/gathering-v2/);
});
test('unknown and hidden card kinds never resolve to arbitrary paths',()=>{for(const c of [null,{kind:'hidden'},{kind:'out'},{kind:'__proto__'},{kind:'number',value:99}])assert.equal(source(c),null);});
test('disclosed face creates one static image without overlay or game-state attributes',()=>{
 const doc={createElement(tag){return{tag,attrs:{},setAttribute(k,v){this.attrs[k]=v;}};}};
 for(const card of engine.FULL_DECK){const img=create(doc,card);assert.equal(img.tag,'img');assert.equal(img.src,source(card));assert.equal(img.className,'card-art');assert.equal(img.alt,'');assert.equal(img.draggable,false);assert.deepEqual(img.attrs,{'aria-hidden':'true'});}
 assert.throws(()=>create(doc,{kind:'hidden'}),TypeError);
});
test('every card scene metadata has the whole 2:3 original dimensions',()=>{
 const manifest=require('../assets/provenance.json');for(const file of [...Object.values(assets.normal),...Object.values(assets.special)]){const art=manifest.assets.find(a=>'assets/'+a.file===file);assert.ok(art);assert.equal(art.width,1024);assert.equal(art.height,1536);}
});
test('hidden and out returns precede any image or value assignment',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');const body=app.slice(app.indexOf('function cardNode('),app.indexOf('function clearError('));assert.ok(body.indexOf('if (out)')<body.indexOf('NumberBluffCardArt.create'));assert.ok(body.indexOf('if (hidden || !card)')<body.indexOf('dataset.artValue'));assert.doesNotMatch(body,/createArtMotion|NumberBluffNormalArt/);
});
test('static originals keep their ratio and numeral safe area without rejected image effects',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../card-art.css'),'utf8');assert.match(css,/aspect-ratio: 2 \/ 3/);assert.match(css,/object-fit: contain/);assert.match(css,/top: 5%; height: 23%/);assert.doesNotMatch(css,/animation:|mask-image|filter:/);
 const effects=fs.readFileSync(path.join(__dirname,'../card-presentation.css'),'utf8');assert.doesNotMatch(effects,/card-art-motion|card-illustration|card-foil-sweep/);assert.match(effects,/card-reveal-rich/);assert.match(effects,/card-deal-rich/);assert.equal(require('../card-presentation').createArtMotion,undefined);
});
