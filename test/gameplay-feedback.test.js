const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 const win=new EventTarget(),doc=new EventTarget(),media=new EventTarget();media.matches=false;doc.hidden=false;win.innerWidth=390;win.innerHeight=844;win.matchMedia=()=>media;
 const calls=[],animations=[];const node={isConnected:true,closest:()=>null,getBoundingClientRect:()=>({left:20,top:100,right:55,bottom:135}),animate(frames,options){calls.push({frames,options});let resolve;const animation={finished:new Promise(r=>resolve=r),cancel(){this.cancelled=true;resolve();},finish:()=>resolve()};animations.push(animation);return animation;}};
 vm.runInNewContext(fs.readFileSync('gameplay-feedback.js','utf8'),{window:win,document:doc});const api=win.NumberBluffGameplayFeedback.create();api.begin('room:game:round');return{api,win,doc,media,node,calls,animations};
}
test('finite feedback consumes one public event once; new round gets a fresh scope',()=>{
 const h=harness();assert.equal(h.api.play('turn',h.node,'1:p2'),true);assert.equal(h.api.play('turn',h.node,'1:p2'),false);assert.equal(h.calls.length,1);assert.equal(h.calls[0].options.iterations,1);assert.equal(h.calls[0].options.duration,420);
 h.api.begin('room:game:round');assert.equal(h.api.play('turn',h.node,'1:p2'),false);h.api.begin('room:game:next');assert.equal(h.animations[0].cancelled,true);assert.equal(h.api.play('turn',h.node,'1:p2'),true);h.api.destroy();
});
test('hidden, reduced or offscreen events are never replayed on return',()=>{
 const h=harness();h.doc.hidden=true;assert.equal(h.api.play('turn',h.node,'a'),false);h.doc.hidden=false;assert.equal(h.api.play('turn',h.node,'a'),false);
 h.media.matches=true;assert.equal(h.api.play('life',h.node,'b'),false);h.media.matches=false;assert.equal(h.api.play('life',h.node,'b'),false);
 h.node.getBoundingClientRect=()=>({top:900,bottom:930,left:0,right:30});assert.equal(h.api.play('turn',h.node,'c'),false);assert.equal(h.calls.length,0);h.api.destroy();
});
test('pagehide, resize, reduced motion, modal dismissal and destroy cancel without waiting',()=>{
 const h=harness();h.api.play('life',h.node,'a');h.win.dispatchEvent(new Event('pagehide'));assert.equal(h.animations[0].cancelled,true);assert.equal(h.api.play('turn',h.node,'b'),false);h.win.dispatchEvent(new Event('pageshow'));assert.equal(h.api.play('turn',h.node,'b'),false);
 h.api.play('turn',h.node,'c');h.win.dispatchEvent(new Event('resize'));assert.equal(h.animations[1].cancelled,true);
 h.api.play('turn',h.node,'d');h.media.dispatchEvent(new Event('change'));assert.equal(h.animations[2].cancelled,true);
 h.api.play('turn',h.node,'e');h.api.stop();assert.equal(h.animations[3].cancelled,true);h.api.destroy();assert.equal(h.api.play('turn',h.node,'f'),false);
});
test('life effect is local and does not remove text or manage game inputs/timers',()=>{
 const h=harness();assert.equal(h.api.play('life',h.node,'loss'),true);assert.equal(h.calls[0].options.duration,560);assert.ok(h.calls[0].frames[0].transform.includes('-3px'));h.api.destroy();
 const source=fs.readFileSync('gameplay-feedback.js','utf8');assert.doesNotMatch(source,/setTimeout|setInterval|disabled|textContent|innerHTML|sendMessage|Math.random/);
 const app=fs.readFileSync('app.js','utf8');assert.match(app,/before\?\.life === loser.life \+ 1 && !frame.complete/);assert.match(app,/previous.turn !== view.turn/);
});
