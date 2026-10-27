const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {assets,source,create}=require('../card-art');
const engine=require('../engine');
test('all physical cards map to fifteen distinct approved original scenes',()=>{
 const normals=engine.FULL_DECK.filter(c=>c.kind==='number');assert.equal(new Set(normals.map(c=>source(c))).size,11);
 assert.equal(new Set(engine.FULL_DECK.map(c=>source(c))).size,15);
 for(const card of engine.FULL_DECK){const file=source(card);assert.ok(file);assert.ok(fs.existsSync(path.join(__dirname,'..',file)));}
 assert.match(source({kind:'number',value:10}),/card-normal-10/);assert.match(source({kind:'number',value:15}),/card-normal-15/);assert.match(source({kind:'number',value:20}),/card-normal-20/);
});
test('unknown and hidden card kinds never resolve to arbitrary paths',()=>{for(const c of [null,{kind:'hidden'},{kind:'out'},{kind:'__proto__'},{kind:'number',value:99}])assert.equal(source(c),null);});
test('disclosed face creates one static image without overlay or game-state attributes',()=>{
 const doc={createElement(tag){return{tag,attrs:{},setAttribute(k,v){this.attrs[k]=v;}};}};
 for(const card of engine.FULL_DECK){const img=create(doc,card);assert.equal(img.tag,'img');assert.equal(img.src,source(card));assert.equal(img.className,'card-art');assert.equal(img.alt,'');assert.equal(img.draggable,false);assert.deepEqual(img.attrs,{'aria-hidden':'true'});}
 assert.throws(()=>create(doc,{kind:'hidden'}),TypeError);
});
test('soft normal and existing special originals retain their exact dimensions',()=>{
 const manifest=require('../assets/provenance.json');for(const file of [...Object.values(assets.normal),...Object.values(assets.special)]){const art=manifest.assets.find(a=>'assets/'+a.file===file);assert.ok(art);if(Object.values(assets.normal).includes(file)){const value=Number(Object.keys(assets.normal).find(v=>assets.normal[v]===file));assert.deepEqual([art.width,art.height],value>=10?[1024,1536]:[1061,[0,2].includes(value)?1483:1482]);}else{const sizes={'assets/card-double.webp':[1051,1496],'assets/card-extra.webp':[1049,1500],'assets/card-max0.webp':[1049,1499],'assets/card-reset.webp':[1062,1482]};assert.deepEqual([art.width,art.height],sizes[file]);}}
});
test('hidden and out returns precede any image or value assignment',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');const body=app.slice(app.indexOf('function cardNode('),app.indexOf('function clearError('));assert.ok(body.indexOf('if (out)')<body.indexOf('NumberBluffCardArt.create'));assert.ok(body.indexOf('if (hidden || !card)')<body.indexOf('dataset.artValue'));assert.doesNotMatch(body,/createArtMotion|NumberBluffNormalArt/);
});
test('static originals keep their ratio and numeral safe area without rejected image effects',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../card-art.css'),'utf8');assert.match(css,/aspect-ratio: 2 \/ 3/);assert.match(css,/object-fit: contain/);assert.match(css,/top: 12%; height: 26%/);assert.doesNotMatch(css,/animation:|mask-image|filter:/);
 const effects=fs.readFileSync(path.join(__dirname,'../card-presentation.css'),'utf8');assert.doesNotMatch(effects,/card-art-motion|card-illustration|card-foil-sweep/);assert.match(effects,/card-reveal-rich/);assert.match(effects,/card-deal-rich/);assert.equal(require('../card-presentation').createArtMotion,undefined);
});
test('all originals fill one 2:3 artwork surface without stretching illustrated lower sections',()=>{
 const api=require('../card-art'),doc={createElement(){return {style:{setProperty(k,v){this[k]=v;}},children:[],setAttribute(){},append(el){this.children.push(el);}};}};
 for(const card of engine.FULL_DECK){const box=api.content(doc,card),[w,h]=api.size(card),layout=api.layout(card);assert.equal(box.style.width,'100%');assert.equal(box.style.height,'100%');assert.equal(box.children.length,2);assert.equal(box.children[0].className,'card-art-cap');assert.equal(box.children[1].className,'card-art-band');assert.ok(Math.abs(layout.sourceHeight-h/(w*1.5))<1e-9);assert.ok(Math.abs(layout.capHeight+layout.bandHeight+layout.sourceHeight*(1-layout.lowerStart)-1)<1e-9);assert.ok(layout.bandHeight>=layout.bandSize-1e-9);}
 const css=fs.readFileSync(path.join(__dirname,'../card-art.css'),'utf8');assert.equal((css.match(/aspect-ratio:/g)||[]).length,1);assert.match(css,/card-content.*position:absolute/);assert.match(css,/clip-path: inset\(var\(--card-lower-start/);assert.equal(api.layout({kind:'number',value:4}).lowerStart,.28);assert.match(css,/card-art-band/);
});
