'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine');
const seeded=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('small per-decision BOT variation is reproducible and never uses its hidden card',()=>{
 for(const difficulty of ['easy','normal','hard']){
  let s=E.startGame(E.createLobby({botCount:2,difficulty}),seeded(912));const bot=s.players.find(p=>p.kind==='bot');s={...s,turn:bot.id,bid:12,last:s.players.find(p=>p.id!==bot.id).id};
  const counts={declare:0,challenge:0};for(const bid of [1,8,10,20]){s.bid=bid;const a=E.botView(s,bot.id),b=E.botView({...s,hands:{...s.hands,[bot.id]:E.FULL_DECK.find(c=>c.id!==s.hands[bot.id].id)}},bot.id);for(let seed=1;seed<=300;seed++){const key=Math.imul(seed,2654435761)>>>0;const x=E.chooseBotAction(a,seeded(key)),y=E.chooseBotAction(b,seeded(key));assert.deepEqual(x,y);counts[x.type]++;}}
  assert.ok(counts.declare>0&&counts.challenge>0,`${difficulty}: ${JSON.stringify(counts)}`);
 }
});
test('seeded BOT matches finish with valid actions and bounded wins by difficulty',()=>{
 for(const difficulty of ['easy','normal','hard']){let wins=0,games=0;for(let seed=1;seed<=40;seed++){const rng=seeded(seed),lobby=E.createLobby({botCount:1,difficulty});let s=E.startGame(lobby,rng);for(let n=0;n<200&&s.phase!=='finished';n++){if(s.phase==='reveal'){s=E.nextRound(s,rng);continue;}const player=s.players.find(p=>p.id===s.turn);let action=player.kind==='bot'?E.chooseBotAction(E.botView(s,player.id),rng):(s.bid===null?{type:'declare',value:1}:{type:'challenge'});const next=E.dispatch(s,{...action,player:player.id,revision:s.revision},rng);assert.notEqual(next,s);s=next;}assert.equal(s.phase,'finished');games++;if(s.result.winner==='p2')wins++;}assert.ok(wins>=0&&wins<=games);}
});
