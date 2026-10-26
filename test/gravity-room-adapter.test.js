'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createSession,install}=require('../gravity-room-adapter');
function setup(){
 const nodes=new Map(),queue=[],sent=[],statuses={},jobs=new Map();let jobId=0,randomCalls=0;
 const timers={setTimeout(fn){jobs.set(++jobId,fn);return jobId;},clearTimeout(n){jobs.delete(n);}};
 const make=(uid,host='host')=>{statuses[uid]=[];const session=createSession({roomId:'room-1',userId:uid,hostUserId:host,name:uid,epoch:'test-epoch',heartbeat:false,rng:()=>{randomCalls++;return .4;},...timers,onStatus:s=>statuses[uid].push(s),sendMessage:message=>{sent.push({sender:uid,message});queue.push({sender:uid,message});}});nodes.set(uid,session);return session;};
 const flush=()=>{let n=0;while(queue.length){assert.ok(++n<100,'No message feedback loop');const m=queue.shift();for(const [uid,node]of nodes)if(uid!==m.sender)node.receive(m.sender,m.message);}};
 const view=s=>{let v;s.subscribe(x=>{v=x;})();return v;};
 const host=make('host'),guest=make('guest');host.addMember({userId:'guest',name:'guest'});flush();
 return {host,guest,nodes,queue,sent,statuses,jobs,make,flush,view,randomCalls:()=>randomCalls};
}
const act=(s,v,type,extra={})=>s.send({type,player:v.viewerId,revision:v.revision,...extra});
test('host alone, join and authoritative start provide own-card filtering without deck transmission',async()=>{
 const t=setup();assert.equal(t.view(t.guest).players.length,2);assert.equal(t.view(t.guest).hostId,'p1');
 await act(t.guest,t.view(t.guest),'startGame');t.flush();assert.equal(t.view(t.host).phase,'lobby');assert.equal(t.randomCalls(),0);
 await act(t.host,t.view(t.host),'startGame');t.flush();
 const h=t.view(t.host),g=t.view(t.guest);assert.equal(h.phase,'play');assert.equal(h.hands.p1,null);assert.equal(g.hands.p2,null);assert.ok(g.hands.p1);assert.ok(h.hands.p2);
 for(const m of t.sent){const v=JSON.parse(m.message).view;if(v){assert.equal('deck'in v,false);assert.equal('rng'in v,false);assert.equal('viewerId'in v,false);}}
});
test('envelope sender is authoritative; spoofed actor, unauthenticated host and malformed payloads rejected',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();
 const revision=t.view(t.host).revision;
 assert.equal(t.host.receive('guest',JSON.stringify({protocol:'number-bluff',version:1,roomId:'room-1',epoch:'test-epoch',type:'action',sequence:1,action:{type:'declare',player:'p1',revision,value:1}})),false);
 const packet=t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message;
 assert.equal(t.guest.receive('intruder',packet),false);assert.equal(t.guest.receive('host','{'),false);assert.equal(t.guest.receive('host','x'.repeat(48001)),false);
 assert.equal(t.view(t.host).revision,revision);
});
test('room transport rejects a zero opening declaration and accepts the official minimum one',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();
 const before=t.view(t.host),randomCalls=t.randomCalls();
 await act(t.host,before,'declare',{value:0});t.flush();
 assert.equal(t.view(t.host).revision,before.revision);assert.equal(t.view(t.host).bid,null);assert.equal(t.view(t.guest).bid,null);assert.equal(t.view(t.host).turn,'p1');assert.equal(t.randomCalls(),randomCalls);
 await act(t.host,t.view(t.host),'declare',{value:1});t.flush();
 assert.equal(t.view(t.host).bid,1);assert.equal(t.view(t.guest).bid,1);assert.equal(t.view(t.host).turn,'p2');
 await act(t.guest,t.view(t.guest),'declare',{value:1});t.flush();assert.equal(t.view(t.host).bid,1);assert.equal(t.view(t.host).turn,'p2','equal bid must still be rejected');
 await act(t.guest,t.view(t.guest),'challenge');t.flush();assert.equal(t.view(t.host).phase,'reveal');assert.equal(t.view(t.guest).phase,'reveal');
});
test('guest rejects zero bids in snapshots, declaration history and results without rejecting card totals',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');await act(t.host,t.view(t.host),'declare',{value:1});t.flush();
 const packet=JSON.parse(t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message),before=t.view(t.guest);
 for(const mutate of [v=>{v.bid=0;},v=>{v.history.find(a=>a.type==='declare').value=0;}]){
  const invalid=structuredClone(packet);invalid.sequence+=10;invalid.view.revision++;mutate(invalid.view);
  assert.equal(t.guest.receive('host',JSON.stringify(invalid)),false);assert.deepEqual(t.view(t.guest),before);
 }
 await act(t.guest,t.view(t.guest),'challenge');t.flush();const revealed=JSON.parse(t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message);revealed.sequence+=10;revealed.view.revision++;revealed.view.result.bid=0;
 assert.equal(t.guest.receive('host',JSON.stringify(revealed)),false);
 // Totals are not declarations: zero/negative totals remain schema-valid.
 for(const total of [0,-10]){const valid=structuredClone(revealed);valid.sequence+=total===0?1:2;valid.view.result.bid=1;valid.view.result.sum=total;valid.view.result.baseSum=total;assert.equal(t.guest.receive('host',JSON.stringify(valid)),true);}
});
test('duplicate and stale actions, out-of-order snapshots cannot advance or rewind a game',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();await act(t.host,t.view(t.host),'declare',{value:1});t.flush();
 const old=t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message;
 await act(t.guest,t.view(t.guest),'declare',{value:2});const command=t.sent.at(-1).message;t.flush();const after=t.view(t.host).revision;
 assert.equal(t.host.receive('guest',command),false);assert.equal(t.view(t.host).revision,after);assert.equal(t.guest.receive('host',old),false);assert.equal(t.view(t.guest).revision,after);
 await act(t.guest,{viewerId:'p2',revision:0},'challenge');t.flush();assert.equal(t.view(t.host).revision,after);
});
test('host manages BOT count/difficulty; human joins replace a BOT at cap and never exceed eight',async()=>{
 const t=setup();for(let i=0;i<6;i++)await act(t.host,t.view(t.host),'addBot');t.flush();assert.equal(t.view(t.host).players.length,8);
 await act(t.guest,t.view(t.guest),'removeBot',{target:'p3'});t.flush();assert.equal(t.view(t.host).players.length,8);
 t.host.addMember({userId:'third',name:'Third'});t.flush();assert.equal(t.view(t.host).players.length,8);assert.equal(t.view(t.host).players.filter(p=>p.kind==='human').length,3);
 await act(t.host,t.view(t.host),'setDifficulty',{target:'p4',difficulty:'hard'});assert.equal(t.view(t.host).players.find(p=>p.id==='p4').difficulty,'hard');
});
test('guest departure during play abandons without a win and returns remaining seats to same-room lobby',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();await act(t.host,t.view(t.host),'declare',{value:5});t.flush();
 assert.equal(t.view(t.host).turn,'p2');t.host.removeMember('guest');t.flush();
 const v=t.view(t.host);assert.equal(v.phase,'lobby');assert.equal(v.players.length,1);assert.equal(v.players[0].wins,0);assert.equal(v.roomId,'room-1');assert.ok(t.statuses.host.some(s=>s.kind==='player-left-match-abandoned'));
});
test('host departure freezes guest and requires explicit reconnection, no unsafe election',async()=>{
 const t=setup();t.guest.addMember({userId:'host',name:'host'});t.guest.removeMember('host');
 assert.equal(t.guest.getStatus().hostLost,true);await assert.rejects(t.guest.send({type:'startGame'}),/disconnected/);assert.ok(t.statuses.guest.some(s=>s.kind==='host-lost'));
});
test('resync recovers a dropped snapshot without replaying old state and guests never run RNG/BOT',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.queue.length=0;assert.equal(t.view(t.guest).phase,'lobby');
 await t.guest.resync();t.flush();assert.equal(t.view(t.guest).phase,'play');const count=t.randomCalls();await t.guest.resync();t.flush();assert.equal(t.randomCalls(),count);
});
test('BOT scheduling belongs to host and cancelled callbacks cannot act after exit',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'addBot');await act(t.host,t.view(t.host),'startGame');t.flush();await act(t.host,t.view(t.host),'declare',{value:1});t.flush();await act(t.guest,t.view(t.guest),'declare',{value:2});t.flush();
 assert.equal(t.jobs.size,1);const callback=[...t.jobs.values()][0],before=t.view(t.host).revision;t.host.close();callback();assert.equal(t.jobs.size,0);assert.equal(t.view(t.host).revision,before);
});
test('SDK facade maps portrait/portait, pins first roster host, registers immediately after success',async()=>{
 let listenerCount=0,actions,configured,listener,events=[];
 const sdk={user:{getMyUserInfo:async()=>({errno:0,data:{user_id:'guest',name:'Real name',portrait:'https://example.com/me.png'}})},room:{receiveMessage:fn=>{events.push('listen');listenerCount++;listener=fn;},create:async()=>({errno:0,data:{room_id:'r'}}),join:async()=>{events.push('join');return{errno:0,data:{room_id:'r',user_list:[{user_id:'host',name:'Host',portrait:'https://example.com/h.png'},{user_id:'guest',name:'Guest'}]}};},sendMessage:async()=>({errno:0})}};
 const client={setRoomAdapterExpected(){},configureLocalProfile:p=>configured=p,configureRoomActions:a=>actions=a};
 const bridge=await install({sdk,client});assert.equal(listenerCount,0);assert.equal(configured.name,'Real name');assert.equal(configured.avatarUrl,'https://example.com/me.png');
 const session=await actions.join('r');assert.deepEqual(events,['join','listen']);assert.equal(session.getStatus().isHost,false);
 listener({type:'aitools_game_joinroom',data:{user_id:'new',user_name:'New',portait:'https://example.com/new.png'}});
 assert.equal(session.receive('new',JSON.stringify({protocol:'number-bluff',version:1,roomId:'r',type:'host_declare'})),false);
 bridge.close();
});
test('SDK join without a first host ID fails closed and blank/unsafe avatars stay neutral',async()=>{
 let actions,profile;
 const sdk={user:{getMyUserInfo:async()=>({errno:0,data:{user_id:'u',name:'U',portrait:'javascript:bad'}})},room:{receiveMessage(){},create(){},join:async()=>({errno:0,data:{room_id:'r',user_list:[]}}),sendMessage(){}}};
 await install({sdk,client:{setRoomAdapterExpected(){},configureLocalProfile:p=>profile=p,configureRoomActions:a=>actions=a}});assert.equal(profile.avatarUrl,null);await assert.rejects(actions.join('r'),/Verified room and host/);
});
test('silent host timeout and silent guest departure stop stuck matches without migration or awards',async()=>{
 let time=0, callbacks=[],statuses=[];
 const opts={roomId:'r',userId:'guest',hostUserId:'host',name:'Guest',now:()=>time,heartbeatMs:100,timeoutMs:300,setTimeout:fn=>{callbacks.push(fn);return callbacks.length;},clearTimeout:()=>{},sendMessage:()=>{},onStatus:s=>statuses.push(s)};
 const guest=createSession(opts);time=301;callbacks.shift()();assert.equal(guest.getStatus().hostLost,true);assert.ok(statuses.some(x=>x.kind==='host-timeout'));
 callbacks=[];statuses=[];time=0;const host=createSession({...opts,userId:'host',rng:()=>.4});host.addMember({userId:'guest',name:'Guest'});let v;host.subscribe(x=>v=x);await act(host,v,'startGame');assert.equal(v.phase,'play');time=301;callbacks.shift()();assert.equal(v.phase,'lobby');assert.equal(v.players.length,1);assert.equal(v.players[0].wins,0);assert.ok(statuses.some(x=>x.kind==='participant-timeout'));host.close();
});
test('rejoining the same verified identity resets command sequence without accepting stale actions',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();await act(t.host,t.view(t.host),'declare',{value:1});t.flush();
 const packet={protocol:'number-bluff',version:1,roomId:'room-1',epoch:'test-epoch',type:'action',sequence:10,action:{type:'declare',player:'p2',revision:t.view(t.host).revision,value:2}};
 assert.equal(t.host.receive('guest',JSON.stringify(packet)),true);t.flush();t.host.removeMember('guest');t.host.addMember({userId:'guest',name:'Guest'});await act(t.host,t.view(t.host),'startGame');await act(t.host,t.view(t.host),'declare',{value:1});t.flush();
 assert.equal(t.host.receive('guest',JSON.stringify(packet)),false);
 packet.sequence=1;packet.action.revision=t.view(t.host).revision;assert.equal(t.host.receive('guest',JSON.stringify(packet)),true);
});
test('retransmission does not postpone an already scheduled BOT turn',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'addBot');await act(t.host,t.view(t.host),'startGame');t.flush();await act(t.host,t.view(t.host),'declare',{value:1});t.flush();await act(t.guest,t.view(t.guest),'declare',{value:2});t.flush();
 const [ticket,callback]=[...t.jobs.entries()][0];await t.guest.resync();t.flush();assert.equal(t.jobs.get(ticket),callback);callback();t.flush();assert.notEqual(t.view(t.host).turn,'p3');
});
test('malformed snapshot shapes fail safely and authenticated host loss works without host roster entry',()=>{
 const t=setup(),base=JSON.parse(t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message);
 for(const patch of [{players:[null]},{hands:{p1:undefined,p2:5}},{discard:[7]}]){const message={...base,sequence:999,view:{...base.view,...patch}};assert.doesNotThrow(()=>assert.equal(t.guest.receive('host',JSON.stringify(message)),false));}
 assert.equal(t.guest.removeMember('host'),true);assert.equal(t.guest.getStatus().hostLost,true);
});
test('three clients share seat identities and host profile mappings; leave notification is immediate',async()=>{
 const t=setup(),third=t.make('third');t.host.addMember({userId:'third',name:'Third',avatarUrl:'https://example.com/third.png'});t.flush();
 assert.equal(t.view(third).viewerId,'p3');assert.equal(t.view(t.guest).players.find(p=>p.id==='p3').avatarUrl,'https://example.com/third.png');
 third.close();t.flush();assert.equal(t.view(t.host).players.length,2);assert.equal(t.view(t.guest).players.length,2);
});
test('SDK membership event during immediate listener registration is queued into the new room',async()=>{
 let actions,listener;
 const sdk={user:{getMyUserInfo:async()=>({errno:0,data:{user_id:'host',name:'Host'}})},room:{receiveMessage(fn){listener=fn;fn({type:'aitools_game_joinroom',data:{user_id:'guest',user_name:'Guest',portait:'https://example.com/g.png'}});},create:async()=>({errno:0,data:{room_id:'r'}}),join:async()=>({errno:0}),sendMessage:async()=>({errno:0})}};
 const bridge=await install({sdk,client:{setRoomAdapterExpected(){},configureLocalProfile(){},configureRoomActions:a=>actions=a}});const adapter=await actions.create();let view;adapter.subscribe(v=>view=v);assert.equal(view.players.length,2);assert.equal(view.players[1].avatarUrl,'https://example.com/g.png');bridge.close();
});
test('old guest bye cannot abandon a new membership or match',async()=>{
 const t=setup();t.guest.close();const oldBye=t.sent.at(-1).message;t.flush();t.host.addMember({userId:'guest',name:'Guest'});await act(t.host,t.view(t.host),'startGame');const before=t.view(t.host).revision;
 assert.equal(t.host.receive('guest',oldBye),false);assert.equal(t.view(t.host).phase,'play');assert.equal(t.view(t.host).revision,before);
});
test('closing bridge while SDK request is pending cannot resurrect a live session',async()=>{
 let actions,resolveCreate;const promise=new Promise(r=>resolveCreate=r);
 const sdk={user:{getMyUserInfo:async()=>({errno:0,data:{user_id:'host',name:'Host'}})},room:{receiveMessage(){},create:()=>promise,join(){},sendMessage:async()=>({errno:0})}};
 const bridge=await install({sdk,client:{setRoomAdapterExpected(){},configureLocalProfile(){},configureRoomActions:a=>actions=a}});const pending=actions.create();bridge.close();resolveCreate({errno:0,data:{room_id:'r'}});await assert.rejects(pending,/canceled/);assert.equal(bridge.getSession(),null);
});
test('verified same-user rejoin without an exit resets sequence while fencing previous revision',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();await act(t.host,t.view(t.host),'declare',{value:1});t.flush();
 let packet={protocol:'number-bluff',version:1,roomId:'room-1',epoch:'test-epoch',type:'action',sequence:20,action:{type:'declare',player:'p2',revision:t.view(t.host).revision,value:2}};
 assert.equal(t.host.receive('guest',JSON.stringify(packet)),true);await act(t.host,t.view(t.host),'declare',{value:3});
 t.host.addMember({userId:'guest',name:'Guest again'});assert.equal(t.host.receive('guest',JSON.stringify(packet)),false);
 packet={...packet,sequence:1,action:{...packet.action,revision:t.view(t.host).revision,value:4}};assert.equal(t.host.receive('guest',JSON.stringify(packet)),true);
});
test('challenge, round progression, winner and rematch synchronize without duplicate victory',async()=>{
 const t=setup();await act(t.host,t.view(t.host),'startGame');t.flush();
 for(let i=0;i<3;i++){
   await act(t.host,t.view(t.host),'declare',{value:999});t.flush();await act(t.guest,t.view(t.guest),'challenge');t.flush();
   assert.equal(t.view(t.guest).phase,i===2?'finished':'reveal');assert.ok(t.view(t.guest).result);assert.equal(t.view(t.host).players[0].life,2-i);
   if(i<2){await act(t.host,t.view(t.host),'nextRound');t.flush();}
 }
 assert.equal(t.view(t.guest).players[1].wins,1);await t.guest.resync();t.flush();assert.equal(t.view(t.guest).players[1].wins,1);
 await act(t.guest,t.view(t.guest),'rematch');t.flush();assert.equal(t.view(t.host).phase,'finished');await act(t.host,t.view(t.host),'rematch');t.flush();assert.equal(t.view(t.guest).phase,'play');assert.equal(t.view(t.guest).players[1].wins,1);assert.equal(t.view(t.guest).players[0].life,3);
});

test('snapshot streak counters are bounded integers and best cannot be below current',async()=>{
 const t=setup();const packet=JSON.parse(t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message);
 const before=t.view(t.guest);
 for(const patch of [{currentStreak:-1,bestStreak:0},{currentStreak:1.5,bestStreak:2},{currentStreak:2,bestStreak:1},{currentStreak:0,bestStreak:Number.MAX_SAFE_INTEGER+1}]){
  const invalid=structuredClone(packet);invalid.sequence+=100;invalid.view.revision++;Object.assign(invalid.view.players[0],patch);
  assert.equal(t.guest.receive('host',JSON.stringify(invalid)),false);assert.deepEqual(t.view(t.guest),before);
 }
 const valid=structuredClone(packet);valid.sequence+=100;valid.view.revision++;Object.assign(valid.view.players[0],{currentStreak:2,bestStreak:5});
 assert.equal(t.guest.receive('host',JSON.stringify(valid)),true);assert.equal(t.view(t.guest).players[0].bestStreak,5);
});

test('snapshot ranking eligibility is an explicit boolean',()=>{
 const t=setup();const packet=JSON.parse(t.sent.findLast(x=>JSON.parse(x.message).type==='snapshot').message);
 const before=t.view(t.guest);
 for(const value of [undefined,null,0,1,'true',{}]){
  const invalid=structuredClone(packet);invalid.sequence+=100;invalid.view.revision++;invalid.view.rankingEligible=value;
  assert.equal(t.guest.receive('host',JSON.stringify(invalid)),false);assert.deepEqual(t.view(t.guest),before);
 }
 assert.equal(before.rankingEligible,false);
});
