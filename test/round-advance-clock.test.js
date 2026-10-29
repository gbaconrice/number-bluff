const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../engine'),P=require('../card-presentation'),R=require('../round-advance-clock');
test('local result timer preserves presentation plus10sec through pause/resume and skips finished',()=>{
 let now=0,id=0,count=0;const jobs=new Map();let state=G.startGame(G.createLobby({botCount:1}),()=>.99);state=G.declare(state,'p1',1);state=G.challenge(state,'p2',()=>.99);
 const clock=R.create({now:()=>now,set:f=>{jobs.set(++id,f);return id;},clear:n=>jobs.delete(n),expire(){count++;}});
 const c=clock.sync(state);assert.equal(c.readyAt,P.plan(state.result,state.players).at(-1).at);assert.equal(c.deadline,c.readyAt+10000);
 now=c.readyAt;clock.sync({...state,revision:9});assert.equal(clock.get().deadline,c.deadline);assert.equal(clock.check(),false);
 clock.pause();now=c.deadline;clock.resume();assert.equal(count,1);clock.resume();assert.equal(count,1);
 assert.equal(clock.sync({...state,phase:'finished'}),null);assert.equal(jobs.size,0);
});

test('bot-only reveal auto-advances after a short result and finished never rematches',()=>{
 let now=0,id=0,count=0;const jobs=new Map();const clock=R.create({now:()=>now,set:f=>{jobs.set(++id,f);return id},clear:n=>jobs.delete(n),expire(){count++}});
 let state=G.startGame(G.createLobby({botCount:2}),()=>.99);state={...state,players:state.players.map(p=>p.kind==='human'?{...p,life:0,eliminated:true}:p),turn:'p2',last:'p3',bid:1};state=G.challenge(state,'p2',()=>.99);
 assert.equal(state.phase,'reveal');const c=clock.sync(state);assert.equal(c.deadline-c.readyAt,1000);now=c.deadline;assert.equal(clock.check(),true);assert.equal(count,1);assert.equal(clock.check(),false);
 assert.equal(clock.sync({...state,phase:'finished'}),null);now+=100000;assert.equal(clock.check(),false);assert.equal(count,1);
});
