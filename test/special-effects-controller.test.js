const test=require('node:test');const assert=require('node:assert/strict');
const {create}=require('../special-effects-controller');
function events(){const handlers=new Map();return{addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(fn);},removeEventListener(type,fn){handlers.get(type)?.delete(fn);},emit(type,event={}){for(const fn of [...(handlers.get(type)||[])])fn(event);},count(){return [...handlers.values()].reduce((n,s)=>n+s.size,0);}};}
function face(kind='extra'){
 const classes=new Set(['player-card',kind.startsWith('normal')?'normal-card':'kind-'+kind]);
 const node={classes,dataset:{artValue:kind.startsWith('normal')?kind.slice(6):undefined},isConnected:true,blockedAncestor:false,image:true,rect:{top:20,left:20,right:100,bottom:140,width:80,height:120},classList:{contains:k=>classes.has(k)},querySelector(){return node.image?{}:null;},matches(selector){return selector.split(',').some(s=>classes.has(s.slice(1)));},closest(selector){if(selector==='.player-card')return node;return node.blockedAncestor?{}:null;},getClientRects(){return node.visible===false?[]:[node.rect];},getBoundingClientRect(){return node.rect;},contains(other){return other===node;}};return node;
}
async function fixture({ready=true,renderSuccess=true}={}){
 let now=0,id=0;const timers=new Map(),calls=[];const media={...events(),matches:false};const doc={...events(),hidden:false,nodes:[],modal:null,confirm:false,querySelector(s){return s.startsWith('#restartConfirm')?(this.confirm?{}:null):s==='dialog[open]'?this.modal:null;},querySelectorAll(){return this.nodes;}};
 const win={...events(),innerWidth:390,innerHeight:844,matchMedia:()=>media,performance:{now:()=>now},setTimeout(fn,ms){const n=++id;timers.set(n,{fn,at:now+ms});return n;},clearTimeout(n){timers.delete(n);}};
 const renderer={ready:Promise.resolve(ready),play(node,kind,options){calls.push(['play',kind,options.duration,node]);return renderSuccess;},stop(){calls.push(['stop']);},destroy(){calls.push(['destroy']);}};
 let busy=false;const controller=create({renderer,document:doc,window:win,busy:()=>busy});await Promise.resolve();await Promise.resolve();
 function advance(ms){const target=now+ms;for(;;){const due=[...timers].filter(([,v])=>v.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=target;}
 return{controller,doc,win,media,renderer,calls,timers,advance,setBusy:v=>busy=v};
}
test('surface cannot start until texture readiness or on hidden/out/undisclosed/offscreen faces',async()=>{
 const pending=await fixture({ready:false});assert.equal(pending.controller.play(face()),false);pending.controller.destroy();
 const f=await fixture();for(const mutate of[n=>n.classes.add('hidden'),n=>n.classes.add('out'),n=>n.image=false,n=>n.isConnected=false,n=>n.blockedAncestor=true,n=>n.visible=false,n=>{n.rect.top=900;n.rect.bottom=1020;}]){const n=face();mutate(n);assert.equal(f.controller.play(n),false);}
 assert.equal(f.calls.filter(c=>c[0]==='play').length,0);f.controller.destroy();
});
test('surface uses one active drawing, deduplicates stable phase key and stops finitely',async()=>{
 const f=await fixture(),one=face('extra'),two=face('double');assert.equal(f.controller.play(one,{key:'room:game:round:extra',duration:400,priority:true}),true);assert.equal(f.controller.status().active,true);
 assert.equal(f.controller.play(two),false);f.controller.stop();assert.equal(f.controller.play(one,{key:'room:game:round:extra',duration:400,priority:true}),false,'skip/resend must not replay already-started phase');
 assert.equal(f.controller.play(two,{key:'room:game:round:multiply',duration:400,priority:true}),true);f.advance(450);assert.equal(f.controller.status().active,false);assert.equal(f.calls.filter(c=>c[0]==='play').length,2);f.controller.destroy();
});
test('hidden, OS reduced motion, disconnected host and modal transition synchronously stop surface',async()=>{
 for(const cause of['hidden','reduced','disconnected','modal','ancestor']){const f=await fixture(),n=face();assert.equal(f.controller.play(n),true);if(cause==='hidden'){f.doc.hidden=true;f.doc.emit('visibilitychange');}if(cause==='reduced'){f.media.matches=true;f.media.emit('change');}if(cause==='disconnected'){n.isConnected=false;f.controller.sync();}if(cause==='modal'){f.doc.modal={contains:()=>false};f.controller.sync();}if(cause==='ancestor'){n.blockedAncestor=true;f.controller.sync();}assert.equal(f.controller.status().active,false,cause);assert.equal(f.controller.play(n),false,cause);f.controller.destroy();}
});
test('normal cards never create illustration motion or idle timers',async()=>{
 const f=await fixture();for(const value of ['1','20','-5','-10','0'])assert.equal(f.controller.play(face('normal'+value),{priority:true}),false);f.advance(60000);assert.equal(f.calls.filter(c=>c[0]==='play').length,0);assert.equal(f.timers.size,0);f.controller.destroy();
});
test('renderer failure, touch hover, pagehide and destroy preserve static fallback without replay',async()=>{
 const failed=await fixture({renderSuccess:false});assert.equal(failed.controller.play(face(),{key:'x'}),false);assert.equal(failed.controller.status().seen,0);failed.controller.destroy();
 const f=await fixture(),n=face('reset');f.doc.emit('pointerover',{pointerType:'touch',target:n,relatedTarget:null});assert.equal(f.controller.status().active,false);assert.equal(f.controller.play(n,{key:'reset'}),true);f.win.emit('pagehide');assert.equal(f.controller.status().active,false);assert.equal(f.timers.size,0);f.win.emit('pageshow');assert.equal(f.timers.size,0);f.controller.destroy();assert.equal(f.controller.play(n,{priority:true}),false);assert.equal(f.doc.count()+f.win.count()+f.media.count(),0);
});

test('return from hidden or reduced motion does not replay finite surface',async()=>{
 for(const reason of ['hidden','reduced']){const f=await fixture();f.controller.play(face('extra'),{key:'once'});if(reason==='hidden'){f.doc.hidden=true;f.doc.emit('visibilitychange');}else{f.media.matches=true;f.media.emit('change');}assert.equal(f.controller.status().active,false);if(reason==='hidden'){f.doc.hidden=false;f.doc.emit('visibilitychange');}else{f.media.matches=false;f.media.emit('change');}assert.equal(f.controller.status().active,false);assert.equal(f.calls.filter(c=>c[0]==='play').length,1);f.controller.destroy();}
});
