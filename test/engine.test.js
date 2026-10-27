'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine');
const Scheduler=require('../scheduler');
const seeded=(seed=1)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const card=id=>E.FULL_DECK.find(c=>c.id===id);
function fixture(ids,{life,discard=[],bid=1}={}){
 const s=E.startGame(E.createLobby({botCount:ids.length-1}),seeded());
 s.hands=Object.fromEntries(ids.map((id,i)=>[`p${i+1}`,card(id)]));
 const used=new Set([...ids,...discard]);s.deck=E.FULL_DECK.filter(c=>!used.has(c.id));s.discard=discard.map(card);
 s.bid=bid;s.last='p1';s.turn='p2';
 if(life)s.players=s.players.map((p,i)=>({...p,life:life[i],eliminated:life[i]===0}));
 return s;
}
function putOnTop(s,id){s.deck=s.deck.filter(c=>c.id!==id).concat(card(id));return s;}
function freezeDeep(x){if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freezeDeep);}return x;}
test('36 unique physical cards, exact full specification',()=>{
 assert.equal(E.FULL_DECK.length,36);assert.equal(new Set(E.FULL_DECK.map(c=>c.id)).size,36);
 for(const [n,count] of [[1,4],[2,4],[3,4],[4,4],[5,4],[10,3],[15,2],[20,1],[0,3],[-5,2],[-10,1]])assert.equal(E.FULL_DECK.filter(c=>c.kind==='number'&&c.value===n).length,count);
 assert.equal(E.FULL_DECK.filter(c=>c.kind!=='number').length,4);
});
test('all 16 special subsets, negatives and operation ordering',()=>{
 const specials=['extra','max0','double','reset'];
 for(let mask=0;mask<16;mask++){
  const ids=['n20_1','n10_1','n-5_1',...specials.filter((_,i)=>mask&(1<<i))];
  const r=E.evaluateCards(ids.map(card),card('n15_1'));
  const expected=(25+(mask&1?15:0)-(mask&2?20:0))*(mask&4?2:1);
  assert.equal(r.sum,expected,`mask ${mask}`);assert.equal(r.reset,!!(mask&8));
 }
 assert.equal(E.evaluateCards(['n-10_1','n-5_1','max0','double'].map(card)).sum,-30);
 assert.equal(E.evaluateCards(['n15_1','n15_2','max0'].map(card)).sum,15,'only one tied maximum removed');
});
test('? extra special applies once, including reset and MAX→0',()=>{
 for(const extra of ['double','max0','reset','n20_1']){
  let s=putOnTop(fixture(['extra','n10_1']),extra);s=E.challenge(s,'p2',seeded());
  assert.equal(s.result.extraCard.id,extra);assert.equal(s.result.sum,extra==='double'?20:extra==='max0'?0:extra==='n20_1'?30:10);
  assert.equal(s.result.reset,extra==='reset');assert.equal(s.discard.length,extra==='reset'?0:3);E.assertInvariant(s);
  if(extra==='reset'){assert.equal(s.deck.length,36);assert.equal(s.hands.p1,undefined);}
 }
});
test('draw ? refills only discarded cards and excludes every in-play card',()=>{
 let s=fixture(['extra','n10_1']);s.discard=s.deck;s.deck=[];
 const r=E.challenge(s,'p2',seeded());assert.ok(!['extra','n10_1'].includes(r.result.extraCard.id));E.assertInvariant(r);
});
test('bid legality, challenge availability, tie loser, negative total',()=>{
 let s=E.startGame(E.createLobby(),seeded());const initial=s;
 assert.equal(E.challenge(s,s.turn,seeded()),s);
 for(const value of [-1,0,.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.equal(E.declare(s,s.turn,value),s);
 assert.equal(E.declare(s,'unknown',1),s);s=E.declare(s,s.turn,1);assert.notEqual(s,initial);
 assert.equal(E.declare(s,s.turn,1),s);assert.equal(E.declare(s,s.turn,0),s);
 s=fixture(['n1_1','n2_1'],{bid:3});assert.equal(E.challenge(s,'p2',seeded()).result.loser,'p2');
 s=fixture(['n-10_1','n0_1'],{bid:1});assert.equal(E.challenge(s,'p2',seeded()).result.loser,'p1');
});
test('elimination, surviving loser or round winner starts, wins once, rematch preserves wins',()=>{
 let s=fixture(['n1_1','n2_1','n3_1'],{life:[1,3,3],bid:100});s=E.challenge(s,'p2',seeded());
 assert.equal(s.players[0].eliminated,true);assert.equal(s.starter,'p2');assert.equal(s.phase,'reveal');
 s=E.nextRound(s,seeded());assert.equal(s.turn,'p2');assert.equal(Object.keys(s.hands).length,2);
 let t=fixture(['n1_1','n2_1'],{life:[1,3],bid:100});t=E.challenge(t,'p2',seeded());
 assert.equal(t.phase,'finished');assert.equal(t.result.winner,'p2');assert.equal(t.players[1].wins,1);
 assert.equal(E.challenge(t,'p2',seeded()),t);assert.equal(E.nextRound(t,seeded()),t);
 let u=E.rematch(t,seeded());assert.equal(u.players[1].wins,1);assert.ok(u.players.every(p=>p.life===3));assert.equal(u.turn,'p1');assert.equal(u.round,1);assert.equal(u.game,t.game+1);E.assertInvariant(u);
 let v=E.challenge(fixture(['n1_1','n2_1'],{bid:100}),'p2',seeded());assert.equal(v.starter,'p1');
});
test('lobby caps, config, 2–8 seats, one actual human offline',()=>{
 let s=E.createLobby();for(let i=0;i<20;i++)s=E.addBot(s);assert.equal(s.players.length,8);assert.equal(s.players.filter(p=>p.kind==='human').length,1);assert.equal(E.addBot(s),s);
 s=E.setDifficulty(s,'p3','hard');assert.equal(s.players[2].difficulty,'hard');assert.equal(E.setDifficulty(s,'p3','invalid'),s);
 for(let i=8;i>=2;i--)s=E.removeBot(s,`p${i}`);assert.equal(s.players.length,1);assert.equal(E.removeBot(s,'p1'),s);
 for(let n=2;n<=8;n++){const t=E.startGame(E.createLobby({botCount:n-1}),seeded(n));assert.equal(Object.keys(t.hands).length,n);E.assertInvariant(t);assert.equal(E.addBot(t),t);}
});
test('public view own-card secrecy, no deck leakage, result reveal, spectators',()=>{
 let s=fixture(['n1_1','n2_1']);let v=E.publicView(s,'p1');assert.equal(v.hands.p1,null);assert.equal(v.hands.p2.id,'n2_1');assert.ok(!('deck' in v));assert.equal(v.result,null);
 const spectator=E.publicView(s,'spectator');assert.equal(spectator.hands.p1.id,'n1_1');
 s=E.challenge(s,'p2',seeded());v=E.publicView(s,'p1');assert.equal(v.hands.p1.id,'n1_1');assert.equal(v.result.cards.p2.id,'n2_1');
});
test('BOT cannot distinguish own card or hidden deck order and models extra specials',()=>{
 const a=fixture(['n1_1','n2_1','extra']);a.turn='p2';
 const b={...a,hands:{...a.hands,p2:card('double')},deck:a.deck.filter(c=>c.id!=='double').concat(card('n2_1')).reverse()};
 assert.deepEqual(E.botView(a,'p2'),E.botView(b,'p2'));
 for(const difficulty of ['easy','normal','hard']){
  const av=E.botView(a,'p2'),bv=E.botView(b,'p2');av.players[1].difficulty=difficulty;bv.players[1].difficulty=difficulty;
  assert.deepEqual(E.chooseBotAction(av,seeded(2)),E.chooseBotAction(bv,seeded(2)));
 }
 const totals=E.possibleTotals(E.botView(a,'p2'));assert.ok(totals.some(n=>n<0));assert.ok(totals.some(n=>n>20));
});
test('RNG injection, deterministic replay, immutable transitions and stale revision guard',()=>{
 assert.throws(()=>E.startGame(E.createLobby()));assert.throws(()=>E.startGame(E.createLobby(),()=>1));
 function run(){let s=E.startGame(E.createLobby({botCount:7}),seeded(10));const rng=seeded(20);for(let i=0;i<60;i++){if(s.phase==='play'){s=E.declare(s,s.turn,1);s=E.challenge(s,s.turn,rng);}else if(s.phase==='reveal')s=E.nextRound(s,rng);else s=E.rematch(s,rng);}return s;}
 assert.deepEqual(run(),run());
 const s=freezeDeep(E.startGame(E.createLobby(),seeded()));const action={type:'declare',player:s.turn,value:1,revision:s.revision};const t=E.dispatch(s,action,seeded());assert.notEqual(t,s);assert.equal(E.dispatch(t,action,seeded()),t);E.challenge(freezeDeep(t),t.turn,seeded());
});
test('10,000 challenge rounds conserve physical deck, finish, rematch and wins',()=>{
 const rng=seeded(991);let s=E.startGame(E.createLobby({botCount:7}),rng),games=0;
 for(let i=0;i<10000;i++){
  E.assertInvariant(s);s=E.declare(s,s.turn,i%3===0?100:1);s=E.challenge(s,s.turn,rng);E.assertInvariant(s);
  if(s.phase==='finished'){games++;assert.equal(s.players.reduce((n,p)=>n+p.wins,0),games);s=E.rematch(s,rng);}else s=E.nextRound(s,rng);
 }
 assert.ok(games>400);
});
test('parse bids and scheduler rejects canceled/already-fired callback',()=>{
 assert.equal(E.parseBid(' １２３ '),123);assert.equal(E.parseBid('１'),1);assert.equal(E.parseBid('10'),10);for(const value of ['0','０','00','-1','1.2','1e3','','9007199254740992'])assert.equal(E.parseBid(value),null);
 let callbacks=[],fired=0;const scheduler=Scheduler(fn=>{callbacks.push(fn);return callbacks.length;},()=>{});
 scheduler.schedule(()=>fired++,1);scheduler.cancel();callbacks[0]();assert.equal(fired,0);
 scheduler.schedule(()=>fired++,1);callbacks[1]();callbacks[1]();assert.equal(fired,1);
});
test('BOT predicts public discard refill when ? meets exhausted draw pile',()=>{
 let s=fixture(['extra','n10_1']);s.discard=s.deck;s.deck=[];const v=E.botView(s,'p2');
 const totals=E.possibleTotals(v);assert.ok(totals.includes(20),'extra double');assert.ok(totals.includes(0),'extra MAX→0');assert.ok(totals.includes(30),'extra20');
});
test('all bot difficulties complete 2- and 8-seat matches with legal public-view actions',()=>{
 for(const difficulty of ['easy','normal','hard'])for(const count of [2,8]){
  const rng=seeded(count*100+difficulty.length);
  let s=E.startGame(E.createLobby({botCount:count-1,difficulty}),rng);
  // Convert the test driver seat to a bot solely to simulate a complete match.
  s={...s,players:s.players.map(p=>({...p,kind:'bot',difficulty}))};
  let actions=0;
  while(s.phase!=='finished'&&actions<2000){
   if(s.phase==='reveal')s=E.nextRound(s,rng);
   else {const action=E.chooseBotAction(E.botView(s,s.turn),rng);assert.ok(action);const next=E.dispatch(s,{...action,player:s.turn,revision:s.revision},rng);assert.notEqual(next,s);s=next;actions++;}
   E.assertInvariant(s);
  }
  assert.equal(s.phase,'finished',`${difficulty}/${count} completes`);assert.equal(s.players.reduce((n,p)=>n+p.wins,0),1);
 }
});
test('human actors use the same core transitions for future adapter',()=>{
 let s=E.startGame(E.createLobby({botCount:7}),seeded());s={...s,players:s.players.map(p=>({...p,kind:'human',difficulty:null}))};
 for(let i=0;i<8;i++){const prev=s;s=E.declare(s,s.turn,i+1);assert.notEqual(s,prev);}
 s=E.challenge(s,s.turn,seeded());assert.equal(s.phase,'reveal');E.assertInvariant(s);
});

test('host-alone lobby permits zero bots, rejects start without mutation or RNG, can refill',()=>{
 let s=E.createLobby({botCount:0});assert.equal(s.players.length,1);E.assertInvariant(s);
 const snapshot=JSON.stringify(s);assert.equal(E.startGame(s,()=>{throw new Error('must not draw');}),s);assert.equal(JSON.stringify(s),snapshot);
 assert.equal(E.startGame(s),s);assert.equal(s.phase,'lobby');assert.equal(s.game,0);
 s=E.addBot(s,'hard');assert.equal(s.players.length,2);s=E.removeBot(s,'p2');assert.equal(s.players.length,1);E.assertInvariant(s);
 s=E.addBot(s,'easy');s=E.startGame(s,seeded());assert.equal(s.phase,'play');E.assertInvariant(s);
 assert.throws(()=>E.createLobby({botCount:-1}));assert.throws(()=>E.createLobby({botCount:8}));
});
test('returnToLobby preserves same-room seats, settings, wins and game count',()=>{
 let s=fixture(['n1_1','n2_1'],{life:[1,3],bid:100});
 s={...s,players:s.players.map(p=>({...p,name:`Named ${p.id}`,difficulty:p.kind==='bot'?'hard':null}))};
 s=E.challenge(s,'p2',seeded());assert.equal(s.phase,'finished');
 const retained=s.players.map(({life,eliminated,...rest})=>rest),game=s.game;
 const lobby=E.returnToLobby(freezeDeep(s));assert.equal(lobby.phase,'lobby');assert.equal(lobby.game,game);assert.equal(lobby.revision,s.revision+1);
 assert.deepEqual(lobby.players.map(({life,eliminated,...rest})=>rest),retained);assert.ok(lobby.players.every(p=>p.life===3&&!p.eliminated));
 assert.deepEqual(lobby.hands,{});assert.deepEqual(lobby.discard,[]);assert.deepEqual(lobby.history,[]);assert.equal(lobby.result,null);assert.equal(lobby.turn,null);assert.equal(lobby.bid,null);assert.equal(lobby.last,null);assert.equal(lobby.round,0);E.assertInvariant(lobby);
 assert.equal(E.returnToLobby(lobby),lobby);
 const started=E.startGame(lobby,seeded(57));assert.equal(started.game,game+1);assert.equal(started.players[1].wins,1);assert.equal(started.players[1].difficulty,'hard');assert.equal(started.players[1].name,'Named p2');E.assertInvariant(started);
 const rematched=E.rematch(s,seeded(57));assert.equal(rematched.players[1].wins,1);assert.equal(rematched.players[1].difficulty,'hard');assert.equal(rematched.game,game+1);
 assert.ok(E.createLobby().players.every(p=>p.wins===0));
});
test('returnToLobby from active play or reveal never awards abandonment victory',()=>{
 for(const phase of ['play','reveal']){
  let s=fixture(['n1_1','n2_1'],{bid:100});if(phase==='reveal')s=E.challenge(s,'p2',seeded());
  const before=s.players.map(p=>p.wins),lobby=E.returnToLobby(freezeDeep(s));
  assert.equal(lobby.phase,'lobby');assert.deepEqual(lobby.players.map(p=>p.wins),before);assert.equal(lobby.result,null);E.assertInvariant(lobby);
 }
});

test('opening declaration and every BOT difficulty require at least one, even for negative totals',()=>{
 for(const difficulty of ['easy','normal','hard'])for(let seed=1;seed<=24;seed++){
  const s=fixture(['n-10_1','n-5_1'],{bid:null});s.last=null;s.players[1].difficulty=difficulty;
  const action=E.chooseBotAction(E.botView(s,'p2'),seeded(seed));
  assert.equal(action.type,'declare');assert.ok(Number.isSafeInteger(action.value)&&action.value>=1);
  assert.notEqual(E.dispatch(s,{...action,player:'p2',revision:s.revision},seeded(seed)),s);
 }
 const s=E.startGame(E.createLobby(),seeded()),before=JSON.stringify(s);
 assert.equal(E.dispatch(s,{type:'declare',player:s.turn,value:0,revision:s.revision},seeded()),s);
 assert.equal(JSON.stringify(s),before);assert.equal(E.evaluateCards([card('n-10_1'),card('n0_1')]).sum,-10);
});
test('eliminated bidder or challenger hands next round to that round winner, not next seat',()=>{
 // p2 challenges p1's exactly correct six, loses final life; p1 won, not clockwise p3.
 let s=fixture(['n1_1','n2_1','n3_1'],{life:[3,1,3],bid:6});
 s=E.challenge(s,'p2',seeded());assert.equal(s.result.loser,'p2');assert.equal(s.starter,'p1');
 s=E.nextRound(s,seeded());assert.equal(s.turn,'p1');E.assertInvariant(s);
 // p2 made an excessive bid and p3 challenged successfully; p3 won.
 let t=fixture(['n1_1','n2_1','n3_1'],{life:[3,1,3],bid:7});t.last='p2';t.turn='p3';
 t=E.challenge(t,'p3',seeded());assert.equal(t.result.loser,'p2');assert.equal(t.starter,'p3');
 t=E.nextRound(t,seeded());assert.equal(t.turn,'p3');E.assertInvariant(t);
});

test('human streak counters change once per completed match and survive rematch without persistence',()=>{
 const rng=seeded(813);
 let lobby=E.createLobby({botCount:1});lobby.players=lobby.players.map(p=>({...p,kind:'human',difficulty:null}));
 const finish=(s,winner)=>{
  const ids=['n1_1','n2_1'];s={...s,phase:'play',hands:{p1:card(ids[0]),p2:card(ids[1])},deck:E.FULL_DECK.filter(c=>!ids.includes(c.id)),discard:[],bid:winner==='p1'?1:99,last:'p1',turn:'p2',players:s.players.map(p=>({...p,life:p.id===winner?3:1,eliminated:false}))};
  return E.challenge(s,'p2',rng);
 };
 assert.ok(lobby.players.every(p=>p.currentStreak===0&&p.bestStreak===0));
 let s=finish(E.startGame(lobby,rng),'p1');
 assert.equal(s.phase,'finished');assert.equal(s.players[0].currentStreak,1);assert.equal(s.players[0].bestStreak,1);
 assert.equal(E.challenge(s,'p2',rng),s,'duplicate completion cannot award another streak');
 s=E.rematch(s,rng);assert.equal(s.players[0].currentStreak,1);
 const abandoned=E.returnToLobby(s);assert.equal(abandoned.players[0].currentStreak,1);assert.equal(abandoned.players[0].bestStreak,1);
 s=finish(s,'p1');assert.equal(s.players[0].currentStreak,2);assert.equal(s.players[0].bestStreak,2);
 s=finish(E.rematch(s,rng),'p2');
 assert.equal(s.players[0].currentStreak,0);assert.equal(s.players[0].bestStreak,2);
 assert.equal(s.players[1].currentStreak,1);assert.equal(s.players[1].bestStreak,1);
 assert.equal(E.publicView(s,'p1').players[0].bestStreak,2);
 assert.ok(E.createLobby().players.every(p=>p.currentStreak===0&&p.bestStreak===0),'a genuinely new session starts fresh');
});
test('round results never increment streaks and BOTs never collect human streak counters',()=>{
 let s=fixture(['n1_1','n2_1'],{life:[3,3],bid:1});s.players[0]={...s.players[0],currentStreak:2,bestStreak:4};
 let r=E.challenge(s,'p2',seeded());assert.equal(r.phase,'reveal');assert.equal(r.players[0].currentStreak,2);assert.equal(r.players[0].bestStreak,4);
 s=fixture(['n1_1','n2_1'],{life:[1,3],bid:99});s.players[0]={...s.players[0],currentStreak:2,bestStreak:4};
 r=E.challenge(s,'p2',seeded());assert.equal(r.result.winner,'p2');assert.equal(r.players[0].currentStreak,2);assert.equal(r.players[0].bestStreak,4);assert.equal(r.players[1].currentStreak,0);assert.equal(r.players[1].bestStreak,0);
});

test('ranking eligibility captures initial humans, allows BOTs and ignores single-human matches and abandonment',()=>{
 const rng=seeded(888);
 const lobby=E.createLobby({botCount:2});
 lobby.players[1]={...lobby.players[1],kind:'human',difficulty:null};
 lobby.players[0]={...lobby.players[0],currentStreak:2,bestStreak:5};
 const started=E.startGame(lobby,rng);
 assert.equal(started.rankingEligible,true);assert.equal(E.publicView(started,'p1').rankingEligible,true);
 const finish=(state,winner)=>{
  // p2 was eliminated earlier; the initial human count must remain authoritative.
  const ids=['n1_1','n2_1'];
  const s={...state,phase:'play',hands:{p1:card(ids[0]),p3:card(ids[1])},deck:E.FULL_DECK.filter(c=>!ids.includes(c.id)),discard:[],bid:winner==='p1'?1:99,last:'p1',turn:'p3',players:state.players.map(p=>({...p,life:p.id==='p2'?0:p.id===winner?3:1,eliminated:p.id==='p2'}))};
  return E.challenge(s,'p3',rng);
 };
 const humanWin=finish(started,'p1');
 assert.equal(humanWin.players[0].currentStreak,3);assert.equal(humanWin.players[0].bestStreak,5);
 const botWin=finish(started,'p3');
 assert.equal(botWin.players[0].currentStreak,0);assert.equal(botWin.players[0].bestStreak,5);assert.equal(botWin.players[2].bestStreak,0);
 const abandoned=E.returnToLobby(started);
 assert.equal(abandoned.rankingEligible,false);assert.equal(abandoned.players[0].currentStreak,2);
 const singleHumanLobby={...abandoned,players:abandoned.players.map(p=>p.id==='p2'?{...p,kind:'bot',difficulty:'normal'}:p)};
 const singleHumanMatch=E.startGame(singleHumanLobby,rng);assert.equal(singleHumanMatch.rankingEligible,false);
 for(const winner of ['p1','p3']){
  const result=finish(singleHumanMatch,winner);
  assert.equal(result.players[0].currentStreak,2);assert.equal(result.players[0].bestStreak,5);
 }
 const changed={...humanWin,players:humanWin.players.map(p=>p.id==='p2'?{...p,kind:'bot',difficulty:'normal'}:p)};
 assert.equal(E.rematch(changed,rng).rankingEligible,false,'rematch captures its own starting roster');
 assert.equal(E.rematch(humanWin,rng).rankingEligible,true,'eliminated human returns for rematch');
});
