const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../background-motion.js'),'utf8');
function environment(width=390) {
 const listeners=new Map(),mediaListeners=new Map(),jobs=new Map(),records=[];let now=0,id=0;
 const setTimeout=(fn,delay)=>{jobs.set(++id,{fn,at:now+delay});return id;},clearTimeout=id=>jobs.delete(id);
 function node(){return{className:'',dataset:{},attributes:{},children:[],style:{values:{},setProperty(k,v){this.values[k]=v;}},setAttribute(k,v){this.attributes[k]=v;},appendChild(child){this.children.push(child);},remove(){this.removed=true;},animate(frames,opts){records.push({frames,opts,x:this.style.left,y:this.style.top});const a={cancel(){clearTimeout(job);a.oncancel?.();}},job=setTimeout(()=>a.onfinish?.(),opts.duration);return a;}};}
 const body=node();body.insertBefore=function(child){this.children.unshift(child);};
 const document={body,hidden:false,createElement:node,addEventListener(k,f){listeners.set(k,f);},removeEventListener(k,f){if(listeners.get(k)===f)listeners.delete(k);}};
 const media={matches:false,addEventListener(k,f){mediaListeners.set(k,f);},removeEventListener(k,f){if(mediaListeners.get(k)===f)mediaListeners.delete(k);}};
 const window={innerWidth:width,innerHeight:844,crypto:{getRandomValues(a){a[0]=123456;}},matchMedia(){return media;}};
 const isolatedMath=Object.create(Math);isolatedMath.random=()=>{throw new Error('decoration must never consume game RNG');};
 const context=vm.createContext({window,document,setTimeout,clearTimeout,Date,Uint32Array,Math:isolatedMath});
 function advance(ms){const until=now+ms;let max=0;for(;;){const pair=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!pair||pair[1].at>until)break;now=pair[1].at;jobs.delete(pair[0]);pair[1].fn();max=Math.max(max,window.NumberBluffBackground.state.activeMeteorCount);}now=until;return max;}
 return{context,window,document,media,listeners,mediaListeners,jobs,records,advance};
}
test('component overlay has bounded optical stars and meteor pool without touching game RNG',()=>{
 for(const width of[320,390,1024]){const e=environment(width);vm.runInContext(source,e.context);const layer=e.document.body.children[0];assert.equal(layer.attributes['aria-hidden'],'true');assert.equal(layer.children.length,6);
 for(const cls of['nb-background__scene','nb-background__nebula','nb-background__clouds-back','nb-background__clouds','nb-sky-glints','nb-meteor-pool'])assert.equal(layer.children.filter(n=>n.className===cls).length,1);
 assert.equal(layer.children.find(n=>n.className==='nb-sky-glints').children.length,width<480?4:6);assert.equal(e.window.NumberBluffBackground.state.poolSize,width<480?2:3);assert.ok(e.advance(60000)<=(width<480?2:3));assert.ok(e.records.length>=8);assert.ok(new Set(e.records.map(r=>r.opts.duration)).size>6);assert.ok(new Set(e.records.map(r=>r.x)).size>6);assert.ok(e.records.every(r=>r.opts.duration>=1350&&r.opts.duration<=2350));e.window.NumberBluffBackground.destroy();assert.equal(e.jobs.size,0);}
});
test('hidden document, OS reduced motion and explicit disable stop all atmosphere layers; teardown removes listeners',()=>{
 const e=environment();vm.runInContext(source,e.context);const api=e.window.NumberBluffBackground,layer=e.document.body.children[0];
 e.advance(1600);e.document.hidden=true;e.listeners.get('visibilitychange')();assert.equal(layer.dataset.motion,'paused');assert.equal(api.state.activeMeteorCount,0);assert.equal(api.state.timerCount,0);const before=e.records.length;e.advance(20000);assert.equal(e.records.length,before);
 e.document.hidden=false;e.listeners.get('visibilitychange')();assert.equal(layer.dataset.motion,'running');
 e.media.matches=true;e.mediaListeners.get('change')();assert.equal(layer.dataset.static,'true');assert.equal(api.state.running,false);
 e.media.matches=false;e.mediaListeners.get('change')();api.setEnabled(false);assert.equal(layer.dataset.static,'true');
 api.setEnabled(true);assert.equal(layer.dataset.motion,'running');api.destroy();api.destroy();assert.equal(layer.removed,true);assert.equal(e.listeners.size,0);assert.equal(e.mediaListeners.size,0);assert.equal(api.state.mounted,false);assert.equal(api.state.running,false);
});
test('reloading background module destroys previous layer and listeners before replacement',()=>{
 const e=environment();vm.runInContext(source,e.context);const old=e.window.NumberBluffBackground,layer=e.document.body.children[0];
 vm.runInContext(source,e.context);assert.equal(old.state.destroyed,true);assert.equal(layer.removed,true);assert.equal(e.listeners.size,1);assert.equal(e.mediaListeners.size,1);assert.equal(e.window.NumberBluffBackground.state.running,true);
});
test('elevated rear cloud bank fades its bottom edge instead of exposing an image rectangle',()=>{
 const css=fs.readFileSync(require.resolve('../background-motion.css'),'utf8');
 const rule=css.match(/^\.nb-background__clouds-back\s*\{([^}]+)\}/m)[1];
 for(const property of ['mask-image','-webkit-mask-image']){
  const escaped=property.replace(/-/g,'\\-');
  assert.match(rule,new RegExp(escaped+':linear-gradient\\(transparent 2%,#000 48%,#000 64%,transparent 100%\\)'));
 }
 assert.match(rule,/opacity:\.42/,'keep visible depth instead of hiding the seam by dimming the entire layer');
});

test("component replacement preserves published sky/cloud/parallax rules byte-for-byte",()=>{const css=fs.readFileSync(require.resolve("../background-motion.css"),"utf8");for(const rule of [".nb-background__scene { position:absolute; inset:-10%; background:#101a3d url('assets/celestial-background-v3.webp') center / cover no-repeat; animation:nb-scene-travel 22s ease-in-out -5.5s infinite alternate; }", ".nb-background__nebula { position:absolute; inset:-15%; background:radial-gradient(ellipse at 15% 65%,#985cff48,transparent 45%),radial-gradient(ellipse at 85% 24%,#56c4ff40,transparent 40%); opacity:.65; animation:nb-nebula-drift 12s ease-in-out -3s infinite alternate; }", ".nb-background__clouds,.nb-background__clouds-back { position:absolute; left:-30vw; right:-30vw; bottom:-4vh; height:clamp(165px,53.333333vw,420px); background:url('assets/cloud-foreground.webp') center bottom / cover no-repeat; -webkit-mask-image:linear-gradient(transparent 2%,#000 48%); mask-image:linear-gradient(transparent 2%,#000 48%); }", ".nb-background__clouds { opacity:.86; animation:nb-cloud-drift 14s ease-in-out -3.5s infinite alternate; }", ".nb-background__clouds-back { bottom:8vh; -webkit-mask-image:linear-gradient(transparent 2%,#000 48%,#000 64%,transparent 100%); mask-image:linear-gradient(transparent 2%,#000 48%,#000 64%,transparent 100%); opacity:.42; animation:nb-cloud-counterdrift 19s ease-in-out -4.75s infinite alternate; }", "@keyframes nb-scene-travel { from {transform:translate3d(-4vw,3vh,0)} to {transform:translate3d(4vw,-3vh,0)} }", "@keyframes nb-nebula-drift { from {opacity:.45;transform:translate3d(-7%,4%,0) rotate(-5deg)} to {opacity:.75;transform:translate3d(7%,-4%,0) rotate(5deg)} }", "@keyframes nb-cloud-drift { from {transform:translate3d(-22vw,2vh,0)} to {transform:translate3d(22vw,-2vh,0)} }", "@keyframes nb-cloud-counterdrift { from {transform:translate3d(18vw,-2vh,0)} to {transform:translate3d(-18vw,3vh,0)} }"])assert.ok(css.includes(rule),rule);assert.doesNotMatch(source,/Math\.random|requestAnimationFrame/);assert.doesNotMatch(css,/\.nb-background__star\s*\{|@keyframes nb-shooting-star/);});
