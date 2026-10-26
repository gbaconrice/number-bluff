const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../background-motion.js'),'utf8');
function environment() {
 const listeners=new Map(), mediaListeners=new Map();
 function node(){return {className:'',dataset:{},attributes:{},children:[],style:{values:{},setProperty(k,v){this.values[k]=v;}},setAttribute(k,v){this.attributes[k]=v;},appendChild(child){this.children.push(child);},remove(){this.removed=true;}};}
 const body=node();body.insertBefore=function(child){this.children.unshift(child);};
 const document={body,hidden:false,createElement:node,addEventListener(k,f){listeners.set(k,f);},removeEventListener(k,f){if(listeners.get(k)===f)listeners.delete(k);}};
 const media={matches:false,addEventListener(k,f){mediaListeners.set(k,f);},removeEventListener(k,f){if(mediaListeners.get(k)===f)mediaListeners.delete(k);}};
 const window={matchMedia(){return media;}};
 const context=vm.createContext({window,document,Math:{random(){throw new Error('decorations must not consume randomness');}}});
 return {context,window,document,media,listeners,mediaListeners};
}
test('atmosphere uses a bounded deterministic decorative tree without game randomness',()=>{
 const e=environment();vm.runInContext(source,e.context);const layer=e.document.body.children[0];
 assert.equal(layer.attributes['aria-hidden'],'true');assert.equal(layer.children.length,20);
 assert.equal(layer.children.filter(n=>n.className==='nb-background__star').length,16);
 for(const cls of ['nb-background__nebula','nb-background__clouds-back','nb-background__clouds','nb-background__shooting-star'])assert.equal(layer.children.filter(n=>n.className===cls).length,1);
 assert.equal(e.window.NumberBluffBackground.state.running,true);
});
test('hidden document, OS reduced motion and explicit disable stop all atmosphere layers; teardown removes listeners',()=>{
 const e=environment();vm.runInContext(source,e.context);const api=e.window.NumberBluffBackground,layer=e.document.body.children[0];
 e.document.hidden=true;e.listeners.get('visibilitychange')();assert.equal(layer.dataset.motion,'paused');
 e.document.hidden=false;e.listeners.get('visibilitychange')();assert.equal(layer.dataset.motion,'running');
 e.media.matches=true;e.mediaListeners.get('change')();assert.equal(layer.dataset.static,'true');assert.equal(api.state.running,false);
 e.media.matches=false;e.mediaListeners.get('change')();api.setEnabled(false);assert.equal(layer.dataset.static,'true');
 api.setEnabled(true);assert.equal(layer.dataset.motion,'running');api.destroy();api.destroy();assert.equal(layer.removed,true);assert.equal(e.listeners.size,0);assert.equal(e.mediaListeners.size,0);assert.equal(api.state.mounted,false);assert.equal(api.state.running,false);
});
test('reloading background module destroys previous layer and listeners before replacement',()=>{
 const e=environment();vm.runInContext(source,e.context);const old=e.window.NumberBluffBackground,layer=e.document.body.children[0];
 vm.runInContext(source,e.context);assert.equal(old.state.destroyed,true);assert.equal(layer.removed,true);assert.equal(e.listeners.size,1);assert.equal(e.mediaListeners.size,1);assert.equal(e.window.NumberBluffBackground.state.running,true);
});
