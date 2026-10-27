'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createSession,turnDurationMs}=require('../gravity-room-adapter');
function setup(){
 let clock=100000,serial=0;const skews={};const jobs=new Map(),wire=[],views={},nodes={};
 const timers={now:()=>clock,setTimeout(fn,ms){jobs.set(++serial,{fn,at:clock+ms});return serial;},clearTimeout(id){jobs.delete(id);}};
 function make(uid,skew=0){skews[uid]=skew;nodes[uid]=createSession({roomId:'deadline-room',userId:uid,hostUserId:'h',name:uid,epoch:'timer-epoch',heartbeat:false,rng:()=>.4,...timers,now:()=>clock+skews[uid],sendMessage:message=>wire.push({uid,message})});nodes[uid].subscribe(v=>views[uid]=v);return nodes[uid];}
 make('h');make('g',3600000);nodes.h.addMember({userId:'g',name:'guest'});
 function flush(){let n=0;while(wire.length){assert.ok(++n<100);const m=wire.shift();for(const uid of Object.keys(nodes))if(uid!==m.uid)nodes[uid].receive(m.uid,m.message);}}
 flush();
 function act(uid,type,extra={}){const v=views[uid];const result=nodes[uid].send({type,player:v.viewerId,revision:v.revision,turnToken:v.turnClock?.token,...extra});flush();return result;}
 function advance(ms,run=true){clock+=ms;if(!run)return;let n=0;while(true){const next=[...jobs].find(([,j])=>j.at<=clock);if(!next)break;assert.ok(++n<30);jobs.delete(next[0]);next[1].fn();flush();}}
 return{nodes,views,jobs,act,advance,flush,skews,now:()=>clock};
}
test('online human turns share a 30-second host deadline and safe guest-local countdown',async()=>{
 const t=setup();await t.act('h','startGame');const h=t.views.h,g=t.views.g;
 assert.equal(turnDurationMs,30000);assert.equal(h.turnClock.deadline-t.now(),30000);
 assert.equal(g.turnClock.localDeadline-(t.now()+3600000),30000,'guest wall-clock skew does not change remaining budget');
 const token=h.turnClock.token; t.advance(29999);assert.equal(t.views.h.bid,null);
 t.advance(1);assert.equal(t.views.h.bid,1);assert.equal(t.views.h.turn,'p2');assert.notEqual(t.views.h.turnClock.token,token);
 assert.equal(t.views.h.turnClock.deadline-t.now(),30000);assert.equal(t.views.g.bid,1);
 t.nodes.h.close();t.nodes.g.close();assert.equal(t.jobs.size,0);
});
test('manual action immediately before expiration wins once; stale queued expiry cannot act on next turn',async()=>{
 const t=setup();await t.act('h','startGame');const expiry=[...t.jobs.values()][0].fn;
 t.advance(29999,false);await t.act('h','declare',{value:20});const rev=t.views.h.revision;
 t.advance(1,false);expiry();t.flush();assert.equal(t.views.h.revision,rev);assert.equal(t.views.h.bid,20);assert.equal(t.views.h.turn,'p2');t.nodes.h.close();assert.equal(t.jobs.size,0);
});
test('late manual input is never submitted: host expires first even when callback was throttled',async()=>{
 const t=setup();await t.act('h','startGame');t.advance(30000,false);
 assert.equal(await t.act('h','declare',{value:999}),false);assert.equal(t.views.h.bid,1);assert.equal(t.views.h.history.length,1);
 await t.act('g','declare',{value:10});t.advance(30000,false);await t.nodes.h.resync();t.flush();
 assert.equal(t.views.h.bid,11);assert.equal(t.views.h.history.length,3);
});
test('resync and profile revisions never extend a current turn',async()=>{
 const t=setup();await t.act('h','startGame');const {deadline,token}=t.views.h.turnClock;
 t.advance(10000);await t.nodes.g.resync();t.flush();t.nodes.h.addMember({userId:'g',name:'renamed'});t.flush();
 assert.equal(t.views.h.turnClock.deadline,deadline);assert.equal(t.views.h.turnClock.token,token);
 t.advance(20000);assert.equal(t.views.h.bid,1);
});
test('challenge, leaving, and disconnected sessions clear turn timers without fabricated losses',async()=>{
 const t=setup();await t.act('h','startGame');await t.act('h','declare',{value:1});await t.act('g','challenge');
 assert.equal(t.views.h.phase,'reveal');assert.equal(t.views.h.turnClock,null);assert.ok(t.views.h.roundClock);assert.equal(t.jobs.size,1,'only result advance remains');
 await t.act('h','nextRound');assert.ok(t.views.h.turnClock);const wins=t.views.h.players.map(p=>p.wins);
 t.nodes.h.removeMember('g');t.flush();assert.equal(t.views.h.phase,'lobby');assert.equal(t.views.h.turnClock,null);assert.equal(t.jobs.size,0);assert.equal(t.views.h.players[0].wins,wins[0]);
});
test('turn token rejects delayed intents and numeric overflow safely abandons without a challenge',async()=>{
 const t=setup();await t.act('h','startGame');const old=t.views.h.turnClock.token;
 await t.act('h','declare',{value:3});await t.act('g','declare',{value:4,turnToken:old});assert.equal(t.views.h.bid,3);
 await t.act('g','declare',{value:Number.MAX_SAFE_INTEGER});t.advance(30000);
 assert.equal(t.views.h.phase,'lobby');assert.equal(t.views.h.result,null);assert.ok(t.views.h.players.every(p=>p.wins===0&&p.life===3));
});
test('BOT turns keep original short scheduling and do not acquire human deadlines',async()=>{
 const t=setup();await t.act('h','addBot');await t.act('h','startGame');await t.act('h','declare',{value:1});await t.act('g','declare',{value:2});
 assert.equal(t.views.h.turn,'p3');assert.equal(t.views.h.turnClock,null);assert.equal(t.jobs.size,1);
 t.advance(650);assert.notEqual(t.views.h.turn,'p3');
});

test('same-revision resync repairs a guest wall-clock change without changing game state',async()=>{
 const t=setup();await t.act('h','startGame');const revision=t.views.g.revision; t.advance(10000);t.skews.g+=60000;
 await t.nodes.g.resync();t.flush();assert.equal(t.views.g.revision,revision);assert.equal(t.views.g.bid,null);
 assert.equal(t.views.g.turnClock.localDeadline-(t.now()+t.skews.g),20000);
});

test('round advance gives full presentation plus10s, guests cannot advance and resync never extends',async()=>{
 const t=setup();await t.act('h','startGame');await t.act('h','declare',{value:1});await t.act('g','challenge');
 const c=t.views.h.roundClock;assert.equal(c.deadline-c.readyAt,10000);assert.ok(c.readyAt>t.now());
 assert.equal(t.views.g.roundClock.localDeadline-(t.now()+3600000),c.deadline-t.now());
 await t.act('g','nextRound');assert.equal(t.views.h.phase,'reveal');
 t.advance(c.readyAt-t.now());assert.equal(t.views.h.phase,'reveal');t.advance(9999);assert.equal(t.views.h.phase,'reveal');
 await t.nodes.h.resync();t.flush();assert.equal(t.views.h.roundClock.deadline,c.deadline);
 t.advance(1);assert.equal(t.views.h.round,2);assert.equal(t.views.h.phase,'play');assert.equal(t.views.h.roundClock,null);t.nodes.h.close();
});
test('manual round advance invalidates queued expiry; background expiry resolves only once',async()=>{
 const t=setup();await t.act('h','startGame');await t.act('h','declare',{value:1});await t.act('g','challenge');const c=t.views.h.roundClock,stale=[...t.jobs.values()][0].fn;
 t.advance(c.deadline-t.now()-1,false);assert.equal(await t.act('h','nextRound'),true);const rev=t.views.h.revision;
 t.advance(1,false);stale();t.flush();assert.equal(t.views.h.revision,rev);assert.equal(t.views.h.round,2);t.nodes.h.close();
 const u=setup();await u.act('h','startGame');await u.act('h','declare',{value:1});await u.act('g','challenge');u.advance(20000,false);
 assert.equal(await u.act('h','nextRound'),false);assert.equal(u.views.h.round,2);assert.equal(u.views.h.phase,'play');u.nodes.h.close();
});
test('finished matches never auto-rematch and disconnect cancels round advance',async()=>{
 const t=setup();await t.act('h','startGame');
 while(t.views.h.phase!=='finished'){
  const actor=t.views.h.turn==='p1'?'h':'g';await t.act(actor,'declare',{value:900});const other=t.views.h.turn==='p1'?'h':'g';await t.act(other,'challenge');
  if(t.views.h.phase==='reveal')await t.act('h','nextRound');
 }
 const game=t.views.h.game;assert.equal(t.views.h.roundClock,null);assert.equal(t.jobs.size,0);t.advance(60000);assert.equal(t.views.h.game,game);t.nodes.h.close();
 const u=setup();await u.act('h','startGame');await u.act('h','declare',{value:1});await u.act('g','challenge');u.nodes.h.close();u.advance(60000);assert.equal(u.views.h.round,1);assert.equal(u.jobs.size,0);
});

test('leaving after a throttled round deadline publishes the abandoned lobby, not a phantom next round',async()=>{
 const t=setup();await t.act('h','startGame');await t.act('h','declare',{value:1});await t.act('g','challenge');t.advance(20000,false);
 t.nodes.h.removeMember('g');t.flush();assert.equal(t.views.h.phase,'lobby');assert.equal(t.views.h.roundClock,null);assert.equal(t.jobs.size,0);assert.equal(t.views.h.players[0].wins,0);
});
