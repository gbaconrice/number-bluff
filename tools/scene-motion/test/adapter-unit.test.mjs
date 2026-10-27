import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../component-scene-motion.source.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '');

function harness({canAnimate=true,reduced=false,canvasSupport=true}={}) {
  let doc;
  class Element extends EventTarget {
    constructor(tag) { super(); this.tagName=tag; this.ownerDocument=doc; this.parentNode=null; this.children=[];
      this.style={};this.dataset={};this.attributes={};this.classes=new Set();this.text='';this.updates=[];
      this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)}; }
    get isConnected(){return this===doc.body || Boolean(this.parentNode?.isConnected);}
    get textContent(){return this.text+this.children.map(x=>x.textContent).join('');}
    set textContent(value){this.text=String(value);for(const x of this.children)x.parentNode=null;this.children=[];}
    append(...nodes){this.text='';for(const node of nodes){node.remove();node.parentNode=this;this.children.push(node);}}
    replaceChildren(...nodes){this.textContent='';this.append(...nodes);}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}
    setAttribute(key,value){this.attributes[key]=value;}
    update(value){if(this.throwUpdate)throw new Error('feature unavailable');this.value=value;this.updates.push(value);}
    getContext(){return canvasSupport?{}:null;}
  }
  doc=new EventTarget();doc.hidden=false;doc.createElement=tag=>new Element(tag);doc.body=new Element('body');
  const media=new EventTarget();media.matches=reduced;
  const win=new EventTarget();win.matchMedia=()=>media;
  const calls=[],resolvers=[];let resets=0,creates=0;
  const cannon=options=>{calls.push(options);return new Promise(resolve=>resolvers.push(resolve));};
  cannon.reset=()=>{resets++;for(const resolve of resolvers.splice(0))resolve();};
  const confetti={create(canvas,options){creates++;calls.push({create:options});return cannon;}};
  const context=vm.createContext({window:win,document:doc,canAnimate,confetti});
  vm.runInContext(source,context);
  const api=win.NumberBluffSceneMotion.create();const target=new Element('strong');target.textContent='0';doc.body.append(target);
  api.begin('session:game:round');
  return {api,target,doc,win,media,calls,resolvers,get resets(){return resets;},get creates(){return creates;}};
}

test('adapter: only authorized integers update NumberFlow, never interpolation or continuous plugin',()=>{
  const {api,target}=harness();for(const n of [0,-5,5,10])assert.equal(api.setNumber(target,n),true);
  const flow=target.children[1];assert.deepEqual(flow.updates,[0,-5,5,10]);assert.equal(flow.plugins.length,0);
  assert.equal(target.children[0].textContent,'10');assert.equal(flow.attributes['aria-hidden'],'true');
  for(const n of [NaN,Infinity,1.5,'13',Number.MAX_SAFE_INTEGER+1])assert.equal(api.setNumber(target,n),false);
  api.setNumber(target,10);assert.equal(flow.updates.length,4);
  api.setNumber(target,null);assert.equal(target.children[0].textContent,'…');assert.equal(target.dataset.numberMotion,'fallback');
});

test('adapter: skip is immediate and keeps later final number static without blocking exact value',()=>{
  const {api,target}=harness();api.setNumber(target,1);api.setNumber(target,5);const flow=target.children[1];
  assert.equal(flow.animated,true);api.skip();assert.equal(flow.animated,false);api.setNumber(target,30);assert.equal(flow.value,30);assert.equal(flow.animated,false);
  assert.equal(api.celebrate({key:'session:game:round',confirmed:true,won:true}),false);assert.equal(api.state.canvasCount,0);
});

test('adapter: winner confirmation, stable-key dedupe and one reusable canvas',()=>{
  const h=harness();const {api}=h;const key='session:game:round';
  assert.equal(api.celebrate({key,won:true}),false);assert.equal(api.celebrate({key,confirmed:true,won:false}),false);
  assert.equal(api.celebrate({key:'stale',confirmed:true,won:true}),false);
  assert.equal(api.celebrate({key,confirmed:true,won:true}),true);
  for(let i=0;i<20;i++){api.begin(key);assert.equal(api.celebrate({key,confirmed:true,won:true}),false);}
  assert.equal(h.creates,1);assert.equal(api.state.burstCount,1);
  api.leave();api.reset();api.begin(key);assert.equal(api.celebrate({key,confirmed:true,won:true}),false);
  api.begin('new');assert.equal(api.celebrate({key:'new',confirmed:true,won:true}),true);
  assert.equal(h.creates,1);assert.equal(api.state.canvasCount,1);assert.equal(api.state.burstCount,2);
  const effect=h.calls.find(call=>call.particleCount);assert.equal(effect.particleCount,34);assert.equal(effect.ticks,110);
  assert.deepEqual(Array.from(effect.shapes),['star','circle']);assert.equal(h.calls[0].create.useWorker,false);
});

test('adapter: hidden and reduced-motion terminate, consume skipped victories and do not replay',()=>{
  for(const kind of ['hidden','reduce']){
    const h=harness();const {api,target}=h;api.setNumber(target,1);api.setNumber(target,2);
    api.celebrate({key:'session:game:round',confirmed:true,won:true});
    if(kind==='hidden'){h.doc.hidden=true;h.doc.dispatchEvent(new Event('visibilitychange'));}
    else {h.media.matches=true;h.media.dispatchEvent(new Event('change'));}
    assert.equal(api.state.running,false);assert.equal(target.children[1].animated,false);
    h.doc.hidden=false;h.media.matches=false;
    assert.equal(api.celebrate({key:'session:game:round',confirmed:true,won:true}),false);
  }
  const h=harness({reduced:true});h.api.setNumber(h.target,10);assert.equal(h.target.children[1].animated,false);
  assert.equal(h.api.celebrate({key:'session:game:round',confirmed:true,won:true}),false);assert.equal(h.creates,0);
});

test('adapter: unsupported/failed number animation retains the original text fallback',()=>{
  const noFeature=harness({canAnimate:false});noFeature.api.setNumber(noFeature.target,-10);
  assert.equal(noFeature.target.children.length,1);assert.equal(noFeature.target.textContent,'-10');
  const h=harness();h.api.setNumber(h.target,1);h.target.children[1].throwUpdate=true;h.api.setNumber(h.target,5);
  assert.equal(h.target.textContent,'5');assert.equal(h.target.dataset.numberMotion,'fallback');
  h.api.setNumber(h.target,10);assert.equal(h.target.textContent,'10');
});

test('adapter: old burst completion cannot hide a newer result; complete removes running state',async()=>{
  const h=harness();h.api.celebrate({key:'session:game:round',confirmed:true,won:true});
  h.api.begin('new');h.api.celebrate({key:'new',confirmed:true,won:true});await Promise.resolve();
  assert.equal(h.api.state.running,true);h.resolvers.splice(0).forEach(resolve=>resolve());await Promise.resolve();assert.equal(h.api.state.running,false);
});

test('adapter: external rerender, reset and destroy preserve latest value and clean all decorations',()=>{
  const h=harness();h.api.setNumber(h.target,10);h.target.textContent='10';h.api.setNumber(h.target,20);
  assert.equal(h.target.children[1].value,20);h.api.reset();assert.equal(h.target.textContent,'20');
  h.api.begin('new');h.api.setNumber(h.target,30);h.api.celebrate({key:'new',confirmed:true,won:true});
  h.win.dispatchEvent(new Event('pagehide'));assert.equal(h.api.state.active,false);assert.equal(h.api.state.running,false);
  h.api.destroy();h.api.destroy();assert.equal(h.target.textContent,'30');assert.equal(h.api.state.canvasCount,0);assert.equal(h.api.state.numberCount,0);
  assert.equal(h.api.setNumber(h.target,40),false);assert.equal(h.api.state.destroyed,true);
});

test('static: complete runtime licenses retained and no unresolved/dynamic imports',async()=>{
  const js=await readFile(new URL('../component-scene-motion.js',import.meta.url),'utf8');
  for(const [name,file] of [['number-flow','LICENSE.md'],['canvas-confetti','LICENSE'],['esm-env','LICENSE']]){
    const license=await readFile(new URL(`../node_modules/${name}/${file}`,import.meta.url),'utf8');assert.ok(js.includes(license.trim()),name);
  }
  const manifest=JSON.parse(await readFile(new URL('../BUILD_MANIFEST.json',import.meta.url)));assert.deepEqual(manifest.unresolvedImports,[]);
  assert.ok(!/\bimport\s*\(/.test(js));assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/.test(js));
});
