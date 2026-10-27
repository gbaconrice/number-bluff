const test = require('node:test');
const assert = require('node:assert/strict');
const create = require('../local-turn-clock.js');
function fixture() {
  let time=0, id=0; const callbacks=new Map(), expired=[];
  const clock=create({expire: c=>expired.push(c),now:()=>time,set:fn=>{callbacks.set(++id,fn);return id;},clear:n=>callbacks.delete(n)});
  const state={phase:'play',game:1,round:1,turn:'p1',history:[]};
  return {clock,state,expired,callbacks,time:n=>time=n};
}
test('local human deadline lasts 30s; duplicate sync does not extend; BOT has no deadline',()=>{
 const f=fixture();assert.equal(f.clock.sync(f.state,'p1').localDeadline,30000);
 f.time(20000);assert.equal(f.clock.sync({...f.state,revision:7},'p1').localDeadline,30000);
 f.time(29999);assert.equal(f.clock.check(),false);f.time(30000);assert.equal(f.clock.check(),true);assert.equal(f.clock.check(),false);assert.equal(f.expired.length,1);
 assert.equal(f.clock.sync({...f.state,turn:'p2'},'p1'),null);assert.equal(f.callbacks.size,0);
});
test('new human turn resets; queued old callback cannot expire it; result and exit cancel',()=>{
 const f=fixture();f.clock.sync(f.state,'p1');const stale=[...f.callbacks.values()][0];
 f.time(29999);f.clock.sync({...f.state,history:[{}]},'p1');assert.equal(f.clock.get().localDeadline,59999);
 f.time(30000);stale();assert.equal(f.expired.length,0);
 f.clock.sync({...f.state,phase:'roundEnd'},'p1');f.time(100000);stale();assert.equal(f.expired.length,0);assert.equal(f.clock.get(),null);
 f.clock.sync(f.state,'p1');f.clock.cancel();f.time(200000);assert.equal(f.clock.check(),false);
});
test('background pause preserves deadline; resume expires once rather than giving 30 more seconds',()=>{
 const f=fixture();f.clock.sync(f.state,'p1');f.time(10000);f.clock.pause();assert.equal(f.callbacks.size,0);
 f.time(40000);f.clock.resume();assert.equal(f.expired.length,1);f.clock.resume();assert.equal(f.expired.length,1);
});
test('early timer callback reschedules instead of expiring and rematch creates new clock',()=>{
 const f=fixture();f.clock.sync(f.state,'p1');f.time(1000);[...f.callbacks.values()][0]();assert.equal(f.expired.length,0);
 f.clock.sync({...f.state,game:2},'p1');assert.equal(f.clock.get().localDeadline,31000);
});
test('engine integration: manual boundary wins once, expired input is ignored, numeric limit abandons without winner',()=>{
 const G=require('../engine.js'); let now=0, state=G.startGame(G.createLobby({botCount:1}),()=>0.5);
 const clock=create({now:()=>now,set:()=>1,clear:()=>{},expire(){const value=state.bid===null?1:state.bid+1;state=Number.isSafeInteger(value)?G.declare(state,'p1',value):G.returnToLobby(state);}});
 clock.sync(state,'p1');now=29999;if(!clock.check())state=G.declare(state,'p1',7);clock.sync(state,'p1');now=30000;assert.equal(clock.check(),false);assert.equal(state.bid,7);assert.equal(state.history.length,1);
 state=G.declare(state,'p2',9);clock.sync(state,'p1');now=60000;if(!clock.check())state=G.declare(state,'p1',999);assert.equal(state.bid,10);assert.equal(state.history.length,3);
 state={...state,turn:'p1',bid:Number.MAX_SAFE_INTEGER};clock.sync(state,'p1');now=90000;clock.check();assert.equal(state.phase,'lobby');assert.equal(state.players.every(p=>p.wins===0),true);
});
