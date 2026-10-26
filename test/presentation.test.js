const test = require('node:test');
const assert = require('node:assert/strict');
const {plan,createPresenter} = require('../card-presentation');
const engine = require('../engine');
const n = (id,value) => ({id,kind:'number',value});
function result(cards,extraCard=null) {
  return {...engine.evaluateCards(Object.values(cards),extraCard),cards,extraCard,bid:15,bidder:'p1',challenger:'p2',loser:'p1',winner:null};
}
function fakeClock() {
  let id=0; const jobs=[];
  return {jobs,setTimeout(fn,at){jobs.push({id:++id,fn,at,cancelled:false});return id;},clearTimeout(id){const j=jobs.find(x=>x.id===id);if(j)j.cancelled=true;},flush(stale=false){for(const j of jobs.splice(0).sort((a,b)=>a.at-b.at))if(stale||!j.cancelled)j.fn();}};
}
test('extra then MAX then integer terms then multiplier then comparison/outcome',()=>{
  const r=result({p1:n('a',20),p2:{id:'extra',kind:'extra'},p3:{id:'max0',kind:'max0'},p4:{id:'double',kind:'double'}},n('b',-5));
  const before=JSON.stringify(r); const frames=plan(r);
  const phases=frames.map(f=>f.phase);
  for(const [a,b] of [['reveal','extra'],['extra','max'],['max','sum'],['sum','multiply'],['multiply','compare'],['compare','outcome']])assert.ok(phases.indexOf(a)<phases.indexOf(b));
  assert.deepEqual(frames.filter(f=>f.phase==='sum').map(f=>f.runningTotal),[0,-5]);
  assert.equal(frames.find(f=>f.phase==='max').removedCardId,'a');
  assert.equal(frames.find(f=>f.phase==='multiply').runningTotal,-10);
  assert.ok(frames.filter(f=>!['outcome','complete'].includes(f.phase)).every(f=>!f.outcomeVisible));
  assert.equal(JSON.stringify(r),before); assert.ok(Object.isFrozen(frames));
});
test('tied maxima zero only the authoritative card ID; zero and negative stay integer terms',()=>{
 const r=result({p1:n('a',10),p2:n('b',10),p3:n('z',0),p4:n('neg',-10),p5:{id:'max0',kind:'max0'}});
 const frames=plan(r); const last=frames.at(-1);
 assert.equal(last.removedCardId,'a');assert.deepEqual(last.terms.map(t=>t.value),[0,10,0,-10]);assert.equal(last.runningTotal,0);
});
test('MAX with no positive card has no target; reset does not zero arithmetic',()=>{
 const frames=plan(result({p1:n('neg',-5),p2:{id:'max0',kind:'max0'},p3:{id:'reset',kind:'reset'}}));
 assert.equal(frames.find(f=>f.phase==='max').removedCardId,null);assert.equal(frames.at(-1).runningTotal,-5);
});
test('special-only result stages zero before comparison, no recursive extra',()=>{
 const frames=plan(result({p1:{id:'extra',kind:'extra'},p2:{id:'double',kind:'double'}},{id:'reset',kind:'reset'}));
 assert.equal(frames.filter(f=>f.phase==='extra').length,1);assert.equal(frames.find(f=>f.phase==='sum').runningTotal,0);
});
test('plan follows player seat order without modifying input',()=>{
 const r=result({p1:n('a',1),p2:n('b',2)});const p=[{id:'p2'},{id:'p1'}];
 assert.deepEqual(plan(r,p).filter(f=>f.phase==='reveal').map(f=>f.cardId),['b','a']);assert.equal(p[0].id,'p2');
});
test('duplicate result does not restart; skip and destroy are idempotent, stale jobs cannot write',()=>{
 const clock=fakeClock(),events=[],done=[];
 const p=createPresenter({clock,onPhase:f=>events.push(f),onComplete:f=>done.push(f)}),r=result({p1:n('a',1),p2:n('b',2)});
 assert.equal(p.play('r1',r),true);assert.equal(p.play('r1',r),false);assert.equal(events.length,1);
 assert.equal(p.skip(),true);assert.equal(p.skip(),false);clock.flush(true);assert.equal(events.length,2);assert.equal(done.length,1);
 assert.equal(p.play('r1',r),false);p.destroy();p.destroy();assert.equal(p.play('r2',r),false);
});
test('cancel/navigation and replacement prevent stale writes even when timeout already queued',()=>{
 const clock=fakeClock(),events=[];const p=createPresenter({clock,onPhase:(f,key)=>events.push(key+':'+f.phase)});const r=result({p1:n('a',1)});
 p.play('old',r);p.cancel();clock.flush(true);assert.deepEqual(events,['old:hold']);
 p.play('new',r);p.play('newer',r);clock.flush(true);assert.equal(events.filter(e=>e==='new:complete').length,0);assert.equal(events.at(-1),'newer:complete');
 p.play('last',r);p.destroy();const count=events.length;clock.flush(true);assert.equal(events.length,count);
});
test('reentrant callback cancellation never schedules subsequent writes',()=>{
 const clock=fakeClock();let count=0;const p=createPresenter({clock,onPhase:()=>{count++;p.cancel();}});
 p.play('r',result({p1:n('a',1)}));clock.flush(true);assert.equal(count,1);assert.equal(clock.jobs.length,0);
});
test('OS reduced motion is one static final phase, complete once',()=>{
 const clock=fakeClock(),events=[];let count=0;const p=createPresenter({clock,reducedMotion:true,onPhase:f=>events.push(f),onComplete:()=>count++});
 p.play('r',result({p1:n('a',1)}));assert.equal(events.length,1);assert.equal(events[0].complete,true);assert.equal(clock.jobs.length,0);assert.equal(count,1);
});
test('typical two and eight player timelines remain concise',()=>{
 for(const count of [2,8]){const cards=Object.fromEntries(Array.from({length:count},(_,i)=>['p'+i,n('c'+i,i)]));const duration=plan(result(cards)).at(-1).at;assert.ok(duration>=1500&&duration<=3100);}
});

test('special illustration scenes are fixed, distinct, decorative and contain no hidden data', () => {
  const {createArtMotion} = require('../card-presentation');
  const doc = {
    createElement(tag) { return {tag,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},append(...nodes){this.children.push(...nodes);}}; },
    createDocumentFragment() { return {children:[],append(...nodes){this.children.push(...nodes);}}; }
  };
  const seen = new Set();
  for (const kind of ['double','max0','extra','reset']) {
    const fragment = createArtMotion(doc,kind);
    assert.equal(fragment.children.length,2);
    const [image,motion] = fragment.children;
    assert.equal(image.className,'card-illustration');
    assert.equal(image.attrs['aria-hidden'],'true');
    assert.equal(motion.attrs['aria-hidden'],'true');
    assert.match(motion.innerHTML,/<svg viewBox="0 0 100 100"/);
    assert.doesNotMatch(motion.innerHTML,/<(?:script|foreignObject|image|text)\b|\b(?:href|id|onload)=/i);
    assert.ok(!seen.has(motion.innerHTML)); seen.add(motion.innerHTML);
  }
  for (const kind of ['number','hidden','out','__proto__','<script>']) {
    const node=createArtMotion(doc,kind);
    assert.equal(node.className,'card-art-motion');
    assert.equal(node.innerHTML,undefined);
  }
});

test('reset animates deck refresh only after arithmetic and never clears the total', () => {
 const r=result({p1:n('five',5),p2:{id:'reset',kind:'reset'},p3:{id:'double',kind:'double'}});
 const frames=plan(r), reset=frames.find(f=>f.phase==='reset');
 assert.equal(reset.runningTotal,10);
 assert.ok(frames.findIndex(f=>f.phase==='multiply') < frames.indexOf(reset));
 assert.ok(frames.findIndex(f=>f.phase==='outcome') < frames.indexOf(reset));
 assert.equal(reset.outcomeVisible,true);
 assert.equal(frames.at(-1).runningTotal,10);
 assert.equal(frames.at(-1).at-reset.at,280);
});

 test('reset alone and a question drawing reset each have one post-outcome refresh',()=>{
 for (const r of [result({p1:{id:'reset',kind:'reset'}}),result({p1:{id:'extra',kind:'extra'}},{id:'reset',kind:'reset'})]) {
 const frames=plan(r);assert.equal(frames.filter(f=>f.phase==='reset').length,1);assert.equal(frames.at(-1).runningTotal,0);assert.equal(frames.find(f=>f.phase==='reset').outcomeVisible,true);
 }
 });
