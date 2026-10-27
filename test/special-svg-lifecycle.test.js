const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function fixture(){
 const listeners=new Map(),jobs=new Map();let id=0,io;
 const media={matches:false,addEventListener(){},removeEventListener(){}};
 const doc={hidden:false,modal:null,confirm:false,addEventListener(k,f){listeners.set(k,f);},removeEventListener(k){listeners.delete(k);},querySelector(s){return s==='dialog[open]'?this.modal:s.startsWith('#restartConfirm')&&this.confirm?{}:null;},createElement(){return layer();},createElementNS(){return{setAttribute(){},innerHTML:''};}};
 function layer(){const node={dataset:{},style:{setProperty(k,v){this[k]=v;}},append(){},setAttribute(){},removeAttribute(k){if(k==='data-active')delete this.dataset.active;},remove(){this.removed=true;},getAnimations(){return[];}};return node;}
 const face={isConnected:true,blocked:false,closed:false,clientWidth:210,clientHeight:300,offsetWidth:210,offsetHeight:300,style:{},classList:{add(){},remove(){}},getBoundingClientRect(){return{left:0,top:0,right:210,bottom:300,width:210,height:300};},closest(s){return s==='dialog:not([open])'?(this.closed?{}:null):this.blocked?{}:null;},append(node){this.layer=node;}};
 const win={addEventListener(k,f){listeners.set(k,f);},removeEventListener(k){listeners.delete(k);}};
 const context={window:win,document:doc,matchMedia:()=>media,innerWidth:390,innerHeight:844,getComputedStyle:()=>({visibility:'visible'}),ResizeObserver:class{observe(){}unobserve(){}disconnect(){}},IntersectionObserver:class{constructor(fn){io=fn;}observe(){}unobserve(){}disconnect(){}},setTimeout(fn){const key=++id;jobs.set(key,fn);return key;},clearTimeout(key){jobs.delete(key);}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../special-svg-motion.js'),'utf8'),context);
 const manager=win.NumberBluffSpecialSVG.createManager();manager.attach(face,'extra');
 return{manager,face,doc,media,jobs,emit:k=>listeners.get(k)?.(),visible(v){io([{target:face,isIntersecting:v,intersectionRatio:v?1:0}]);},flush(){for(const fn of jobs.values())fn();jobs.clear();}};
}
test('special art animates on attachment without hover and remains ambient after finite emphasis',()=>{
 const f=fixture();assert.equal(f.face.layer.dataset.playing,'true');assert.equal(f.face.layer.style.visibility,'visible');assert.equal(f.manager.activate(f.face),true);assert.equal(f.face.layer.dataset.active,'true');f.flush();assert.equal(f.face.layer.dataset.active,undefined);assert.equal(f.face.layer.dataset.playing,'true');f.manager.stop();assert.equal(f.face.layer.dataset.playing,'true');f.manager.destroy();
});
test('offscreen, hidden, reduced motion and pagehide stop without latching a permanent stop',()=>{
 for(const reason of ['offscreen','hidden','reduced','pagehide']){const f=fixture();if(reason==='offscreen')f.visible(false);if(reason==='hidden'){f.doc.hidden=true;f.emit('visibilitychange');}if(reason==='reduced'){f.media.matches=true;f.manager.refresh();}if(reason==='pagehide')f.emit('pagehide');assert.equal(f.face.layer.dataset.playing,'false',reason);if(reason==='offscreen')f.visible(true);if(reason==='hidden'){f.doc.hidden=false;f.emit('visibilitychange');}if(reason==='reduced'){f.media.matches=false;f.manager.refresh();}if(reason==='pagehide')f.emit('pageshow');assert.equal(f.face.layer.dataset.playing,'true',reason+' resume');f.manager.destroy();}
});
test('closed dialog, another modal and exit confirmation block ambient until dismissed',()=>{
 for(const reason of ['closed','modal','confirm']){const f=fixture();if(reason==='closed')f.face.closed=true;if(reason==='modal')f.doc.modal={contains:()=>false};if(reason==='confirm')f.doc.confirm=true;f.manager.refresh();assert.equal(f.face.layer.dataset.playing,'false',reason);f.face.closed=false;f.doc.modal=null;f.doc.confirm=false;f.manager.refresh();assert.equal(f.face.layer.dataset.playing,'true');f.manager.destroy();}
});
