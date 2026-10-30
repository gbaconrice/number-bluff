(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluff = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const counts = [[1,4],[2,4],[3,4],[4,4],[5,4],[10,3],[15,2],[20,1],[0,3],[-5,2],[-10,1]];
  const cards = [];
  for (const [value,count] of counts) for(let n=1;n<=count;n++) cards.push(Object.freeze({id:`n${value}_${n}`,kind:'number',value,label:String(value)}));
  for (const [kind,label] of [['double','×2'],['max0','MAX→0'],['extra','?'],['reset','0↻']]) cards.push(Object.freeze({id:kind,kind,value:0,label}));
  const FULL_DECK = Object.freeze(cards);
  const difficulties = ['easy','normal','hard'];
  const MAIN_BOT_CHARACTERS = Object.freeze([
    Object.freeze({id:'star-mochi',name:'ほしもち',image:'assets/star-sprite.webp',avatarIndex:0}),
    Object.freeze({id:'moon-cat',name:'ほしねこ',image:'assets/moon-cat.webp',avatarIndex:1}),
    Object.freeze({id:'cloud-bunny',name:'もふうさ',image:'assets/cloud-bunny.webp',avatarIndex:2}),
    Object.freeze({id:'cloud-maru',name:'くもまる',image:'assets/blue-cloud.webp',avatarIndex:3})
  ]);
  const EXTRA_BOT_CHARACTERS = Object.freeze([
    ['crowned-black-cat','くろもち'],['amber-fox','こはく'],['sleepy-bear','ねむくま'],['moon-owl','ふくまる'],
    ['tanuki','ぽんまる'],['hedgehog','ころはり'],['sheep','わたもこ'],['squirrel','くるり'],
    ['chick','ぴよもち'],['deer','すずしか'],['seal','ぷくまる'],['otter','すいまる'],
    ['dog','ゆきいぬ'],['panda','まめぱん'],['penguin','ぺんころ'],['moon-spirit','つきもち']
  ].map(([id,name])=>Object.freeze({id,name,image:`assets/bot-${id}.webp`,randomOnly:true})));
  const BOT_CHARACTERS = Object.freeze([...MAIN_BOT_CHARACTERS,...EXTRA_BOT_CHARACTERS]);
  const botCharacterById = new Map(BOT_CHARACTERS.map(character=>[character.id,character]));
  const mainCharacterIds = new Set(MAIN_BOT_CHARACTERS.map(character=>character.id));
  function independentRandom(){
    const cryptoApi=typeof globalThis==='object'?globalThis.crypto:null;
    if(cryptoApi?.getRandomValues){const value=new Uint32Array(1);cryptoApi.getRandomValues(value);return value[0]/4294967296;}
    return Math.random();
  }
  function random(rng) {
    if(typeof rng !== 'function') throw new TypeError('Inject an RNG function returning [0,1).');
    const n = rng(); if(!Number.isFinite(n)||n<0||n>=1) throw new RangeError('RNG must return [0,1).'); return n;
  }
  function shuffle(input,rng) { const a=input.slice(); for(let i=a.length-1;i>0;i--) {const j=Math.floor(random(rng)*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  const alive = s => s.players.filter(p=>p.life>0);
  function nextSeat(s,id) { const i=s.players.findIndex(p=>p.id===id);for(let n=1;n<=s.players.length;n++){const p=s.players[(i+n)%s.players.length];if(p.life>0)return p.id;} return null; }
  function updated(s,patch) { return {...s,...patch,revision:s.revision+1}; }
  function botCharacterSelection(player){
    if(player?.botSelection!==undefined)return player.botSelection==='random'||mainCharacterIds.has(player.botSelection)?player.botSelection:null;
    if(Number.isInteger(player?.botAvatar)&&player.botAvatar>=0&&player.botAvatar<4)return MAIN_BOT_CHARACTERS[player.botAvatar].id;
    const seat=Number(String(player?.id||'').replace(/\D/g,''));
    return MAIN_BOT_CHARACTERS[Math.max(0,seat-1)%4].id;
  }
  function defaultBotSelection(players,id){
    const used=new Set(players.filter(p=>p.kind==='bot').map(botCharacterSelection).filter(value=>value&&value!=='random'));
    const seat=Number(String(id).replace(/\D/g,''));
    for(let offset=0;offset<MAIN_BOT_CHARACTERS.length;offset++){
      const character=MAIN_BOT_CHARACTERS[(Math.max(0,seat-1)+offset)%MAIN_BOT_CHARACTERS.length];
      if(!used.has(character.id))return character.id;
    }
    return 'random';
  }
  function botPlayer(id,difficulty,players){
    const botSelection=defaultBotSelection(players,id),character=botCharacterById.get(botSelection);
    return {id,name:`BOT ${Number(String(id).replace(/\D/g,''))-1}`,kind:'bot',difficulty,botSelection,...(character?{botAvatar:character.avatarIndex}:{}),life:3,wins:0,currentStreak:0,bestStreak:0,eliminated:false};
  }
  function createLobby({name='YOU',botCount=1,difficulty='normal'}={}) {
    if(!Number.isInteger(botCount)||botCount<0||botCount>7||!difficulties.includes(difficulty)) throw new RangeError('Use 0–7 bots and easy/normal/hard.');
    const players=[{id:'p1',name:String(name).slice(0,24)||'YOU',kind:'human',difficulty:null,life:3,wins:0,currentStreak:0,bestStreak:0,eliminated:false}];
    for(let i=0;i<botCount;i++){const id=`p${i+2}`;players.push(botPlayer(id,difficulty,players));}
    return {phase:'lobby',revision:0,game:0,round:0,rankingEligible:false,players,deck:FULL_DECK.slice(),discard:[],hands:{},bid:null,last:null,turn:null,starter:'p1',result:null,history:[]};
  }
  function addBot(s,difficulty='normal') {
    if(s.phase!=='lobby'||s.players.length>=8||!difficulties.includes(difficulty))return s;
    const seat=Array.from({length:7},(_,i)=>i+2).find(n=>!s.players.some(p=>p.id===`p${n}`));
    return updated(s,{players:[...s.players,botPlayer(`p${seat}`,difficulty,s.players)]});
  }
  function removeBot(s,id) {if(s.phase!=='lobby'||s.players.length<=1||!s.players.some(p=>p.id===id&&p.kind==='bot'))return s;return updated(s,{players:s.players.filter(p=>p.id!==id)});}
  function setDifficulty(s,id,difficulty) {if(s.phase!=='lobby'||!difficulties.includes(difficulty)||!s.players.some(p=>p.id===id&&p.kind==='bot'))return s;return updated(s,{players:s.players.map(p=>p.id===id?{...p,difficulty}:p)});}
  function setBotSelection(s,id,selection){
    if(s.phase!=='lobby'||(selection!=='random'&&!mainCharacterIds.has(selection)))return s;
    const bot=s.players.find(p=>p.id===id&&p.kind==='bot');if(!bot)return s;
    if(selection!=='random'&&s.players.some(p=>p.kind==='bot'&&p.id!==id&&botCharacterSelection(p)===selection))return s;
    return updated(s,{players:s.players.map(p=>{
      if(p.id!==id)return p;
      const {botAvatar,botCharacterId,...rest}=p;
      return selection==='random'?{...rest,botSelection:'random'}:{...rest,botSelection:selection,botAvatar:botCharacterById.get(selection).avatarIndex,botCharacterId:selection};
    })});
  }
  function draw(pool,rng) { if(!pool.deck.length){pool.deck=shuffle(pool.discard,rng);pool.discard=[];} if(!pool.deck.length)throw new Error('No available card');return pool.deck.pop(); }
  function deal(s,rng) {
    const pool={deck:s.deck.slice(),discard:s.discard.slice()},hands={};
    for(const p of alive(s)) hands[p.id]=draw(pool,rng);
    return updated(s,{...pool,hands,phase:'play',round:s.round+1,bid:null,last:null,turn:s.starter,result:null,history:[]});
  }
  function resolveBotCharacters(players,rng){
    const bots=players.filter(p=>p.kind==='bot'),selections=bots.map(botCharacterSelection);
    if(selections.some(selection=>!selection))return null;
    const fixed=selections.filter(selection=>selection!=='random');
    if(new Set(fixed).size!==fixed.length)return null;
    const randomSeats=bots.filter(p=>botCharacterSelection(p)==='random');
    const pool=BOT_CHARACTERS.filter(character=>!fixed.includes(character.id));
    if(pool.length<randomSeats.length)return null;
    const assigned=new Map();
    for(const player of randomSeats){const index=Math.floor(random(rng)*pool.length);assigned.set(player.id,pool.splice(index,1)[0].id);}
    return players.map(player=>{
      if(player.kind!=='bot')return player;
      const characterId=botCharacterSelection(player)==='random'?assigned.get(player.id):botCharacterSelection(player),character=botCharacterById.get(characterId);
      const resolved={...player,botCharacterId:characterId};
      if(character.avatarIndex===undefined)delete resolved.botAvatar;else resolved.botAvatar=character.avatarIndex;
      return resolved;
    });
  }
  function startGame(s,rng,characterRng=independentRandom) {if(s.phase!=='lobby'||s.players.length<2||s.players.length>8)return s;const resolved=resolveBotCharacters(s.players,characterRng);if(!resolved)return s;const players=shuffle(resolved,rng);return deal({...s,players,deck:shuffle(FULL_DECK,rng),discard:[],game:s.game+1,round:0,rankingEligible:players.filter(p=>p.kind==='human').length>=2||(players.filter(p=>p.kind==='human').length===1&&players.some(p=>p.kind==='bot'&&p.difficulty==='hard')),starter:players[0].id},rng);}
  function rematch(s,rng,characterRng=independentRandom) {if(s.phase!=='finished')return s;return startGame({...s,phase:'lobby',players:s.players.map(p=>({...p,life:3,eliminated:false})),hands:{},result:null},rng,characterRng);}
  // A room survives leaving a match. The UI must confirm abandoning active play;
  // no winner is awarded here. createLobby is reserved for a genuinely new room.
  function returnToLobby(s) {
    if(!['play','reveal','finished'].includes(s.phase))return s;
    return updated(s,{phase:'lobby',round:0,rankingEligible:false,players:s.players.map(p=>{
      const reset={...p,life:3,eliminated:false};if(p.kind!=='bot')return reset;
      const selection=botCharacterSelection(p);reset.botSelection=selection;
      if(selection==='random'){delete reset.botCharacterId;delete reset.botAvatar;}
      else{reset.botCharacterId=selection;reset.botAvatar=botCharacterById.get(selection)?.avatarIndex;}
      return reset;
    }),
      deck:FULL_DECK.slice(),discard:[],hands:{},bid:null,last:null,turn:null,
      starter:s.players[0].id,result:null,history:[]});
  }
  function nextRound(s,rng) {if(s.phase!=='reveal')return s;return deal(s,rng);}
  function declare(s,who,value) {
    if(s.phase!=='play'||s.turn!==who||!Number.isSafeInteger(value)||value<1||(s.bid!==null&&value<=s.bid))return s;
    return updated(s,{bid:value,last:who,turn:nextSeat(s,who),history:[...s.history,{type:'declare',player:who,value}]});
  }
  // Extra is supplied separately: it is one physical card, never recursively drawn.
  function evaluateCards(handCards,extraCard=null) {
    const hasExtra=handCards.some(c=>c.kind==='extra');
    const all=hasExtra&&extraCard?[...handCards,extraCard]:handCards.slice();
    const positive=all.filter(c=>c.kind==='number'&&c.value>0);
    const removedCard=all.some(c=>c.kind==='max0')&&positive.length?positive.reduce((a,b)=>a.value>=b.value?a:b):null;
    const baseSum=all.reduce((sum,c)=>sum+(c.kind==='number'&&c!==removedCard?c.value:0),0);
    const multiplier=all.some(c=>c.kind==='double')?2:1;
    return {sum:baseSum*multiplier,baseSum,multiplier,removedCard,reset:all.some(c=>c.kind==='reset')};
  }
  function challenge(s,who,rng) {
    if(s.phase!=='play'||s.turn!==who||s.bid===null)return s;
    const pool={deck:s.deck.slice(),discard:s.discard.slice()};
    const handCards=Object.values(s.hands),extraCard=handCards.some(c=>c.kind==='extra')?draw(pool,rng):null;
    const outcome=evaluateCards(handCards,extraCard),loser=s.bid>outcome.sum?s.last:who;
    let players=s.players.map(p=>p.id===loser?{...p,life:Math.max(0,p.life-1),eliminated:p.life<=1}:p);
    const survivors=players.filter(p=>p.life>0),winner=survivors.length===1?survivors[0].id:null;
    // Eligibility is captured at match start: two humans, or one human with a hard BOT.
    // Only eligible completed matches affect streaks; ineligible matches/abandonment do not. These
    // transient counters are not a leaderboard or a platform submission.
    if(winner)players=players.map(p=>{
      if(s.rankingEligible!==true)return {...p,wins:p.wins+(p.id===winner?1:0)};
      const currentStreak=p.kind==='human'&&p.id===winner?(p.currentStreak||0)+1:0;
      return {...p,wins:p.wins+(p.id===winner?1:0),currentStreak,
        bestStreak:p.kind==='human'?Math.max(p.bestStreak||0,currentStreak):0};
    });
    pool.discard.push(...handCards,...(extraCard?[extraCard]:[]));
    if(outcome.reset){pool.deck=shuffle(FULL_DECK,rng);pool.discard=[];}
    const starter=players.find(p=>p.id===loser).life>0?loser:(loser===s.last?who:s.last);
    return updated(s,{...pool,players,hands:{},phase:winner?'finished':'reveal',turn:null,starter,
      result:{...outcome,cards:{...s.hands},extraCard,loser,challenger:who,bidder:s.last,bid:s.bid,winner},history:[...s.history,{type:'challenge',player:who}]});
  }
  function publicView(s,viewerId) {
    const reveal=s.phase==='reveal'||s.phase==='finished';
    const hands=reveal?{...s.result.cards}:Object.fromEntries(Object.entries(s.hands).map(([id,c])=>[id,id===viewerId?null:c]));
    return {phase:s.phase,revision:s.revision,game:s.game,round:s.round,rankingEligible:s.rankingEligible===true,players:s.players.map(p=>({...p})),hands,discard:s.discard.slice(),deckCount:s.deck.length,bid:s.bid,last:s.last,turn:s.turn,starter:s.starter,result:reveal?{...s.result,cards:{...s.result.cards}}:null,history:s.history.map(a=>({...a})),viewerId};
  }
  function botView(s,id) {return publicView(s,id);}
  // This function accepts ONLY a sanitized public view. It enumerates legal own-card
  // and '?' possibilities from public exclusions, never reads authoritative state.
  function possibleTotals(view) {
    const visible=Object.values(view.hands).filter(Boolean),excluded=new Set([...visible,...view.discard].map(c=>c.id));
    const unknown=FULL_DECK.filter(c=>!excluded.has(c.id)),totals=[];
    for(const own of unknown){
      const hand=[...visible,own];
      // With an exhausted draw pile, '?' refills from public discard, not the
      // own-card pool. Otherwise every unseen non-own card is equally possible.
      const extras=view.deckCount===0?view.discard:unknown.filter(c=>c.id!==own.id);
      if(hand.some(c=>c.kind==='extra'))for(const extra of extras)totals.push(evaluateCards(hand,extra).sum);
      else for(let i=0;i<Math.max(1,extras.length);i++)totals.push(evaluateCards(hand).sum);
    }
    return totals.length?totals:[0];
  }
  function chooseBotAction(view,rng) {
    const bot=view.players.find(p=>p.id===view.viewerId);
    if(view.phase!=='play'||view.turn!==view.viewerId||!bot||bot.kind!=='bot')return null;
    const totals=possibleTotals(view).sort((a,b)=>a-b),difficulty=bot.difficulty||'normal';
    // A small fresh per-decision tendency varies caution without creating a fixed character tell.
    const noise=random(rng),tendency=(random(rng)-.5)*.06;
    const quantile=(difficulty==='easy'?.25+noise*.5:difficulty==='hard'?.55:.4+noise*.2)+tendency;
    const target=Math.max(1,Math.floor(totals[Math.min(totals.length-1,Math.floor(quantile*totals.length))]));
    const safe=view.bid===null?1:totals.filter(sum=>sum>=view.bid).length/totals.length;
    const threshold=(difficulty==='hard'?.48:difficulty==='normal'?.35+noise*.2:.15+noise*.6)-tendency;
    if(view.bid!==null&&(safe<threshold||view.bid===Number.MAX_SAFE_INTEGER))return {type:'challenge'};
    const minimum=view.bid===null?1:view.bid+1;
    return {type:'declare',value:Math.max(minimum,Math.min(target,minimum+(difficulty==='hard'?3:difficulty==='normal'?5:8)))};
  }
  function parseBid(raw) { const n=String(raw).replace(/[０-９]/g,c=>String(c.charCodeAt(0)-65296)).trim();if(!/^\d+$/.test(n))return null;const value=Number(n);return Number.isSafeInteger(value)&&value>=1?value:null; }
  // Future authoritative adapter: send expected revision with each action to reject
  // stale/replayed commands; authenticate actor outside this pure engine.
  function dispatch(s,action,rng) {
    if(!action||action.revision!==s.revision)return s;
    if(action.type==='declare')return declare(s,action.player,action.value);
    if(action.type==='challenge')return challenge(s,action.player,rng);
    if(action.type==='nextRound')return nextRound(s,rng);
    if(action.type==='rematch')return rematch(s,rng);
    if(action.type==='returnToLobby'&&s.phase==='finished')return returnToLobby(s);
    return s;
  }
  function assertInvariant(s) {
    const physical=[...s.deck,...s.discard,...Object.values(s.hands)],ids=physical.map(c=>c.id);
    if(ids.length!==36||new Set(ids).size!==36||ids.some(id=>!FULL_DECK.some(c=>c.id===id)))throw new Error('Physical deck conservation violated');
    if(s.players.length<(s.phase==='lobby'?1:2)||s.players.length>8||new Set(s.players.map(p=>p.id)).size!==s.players.length)throw new Error('Invalid seats');
    if(s.players.some(p=>!Number.isInteger(p.life)||p.life<0||p.life>3||p.eliminated!==(p.life===0)))throw new Error('Invalid life');
    const bots=s.players.filter(p=>p.kind==='bot'),selections=bots.map(botCharacterSelection),resolved=bots.filter(p=>p.botCharacterId!==undefined).map(p=>p.botCharacterId);
    if(selections.some(selection=>!selection)||new Set(selections.filter(selection=>selection!=='random')).size!==selections.filter(selection=>selection!=='random').length)throw new Error('Invalid or duplicated BOT selection');
    if(resolved.some(id=>!botCharacterById.has(id))||new Set(resolved).size!==resolved.length||bots.some(p=>p.botCharacterId!==undefined&&botCharacterSelection(p)!=='random'&&p.botCharacterId!==botCharacterSelection(p)))throw new Error('Invalid or duplicated BOT character');
    if(s.players.some(p=>p.kind==='human'&&['botSelection','botCharacterId','botAvatar'].some(key=>p[key]!==undefined)))throw new Error('Human seat retains BOT selection data');
    if(['play','reveal','finished'].includes(s.phase)&&bots.some(p=>p.botSelection!==undefined&&!p.botCharacterId))throw new Error('Unresolved BOT character in match');
    if(s.phase==='lobby'&&bots.some(p=>p.botSelection==='random'&&p.botCharacterId!==undefined))throw new Error('Lobby random BOT still has a resolved character');
    if(s.phase==='play'&&(!alive(s).some(p=>p.id===s.turn)||Object.keys(s.hands).length!==alive(s).length))throw new Error('Invalid active turn/hands');
    return true;
  }
  return {FULL_DECK,BOT_CHARACTERS,MAIN_BOT_CHARACTERS,createLobby,addBot,removeBot,setDifficulty,setBotSelection,botCharacterSelection,startGame,nextRound,rematch,returnToLobby,declare,challenge,evaluateCards,publicView,botView,chooseBotAction,possibleTotals,parseBid,dispatch,assertInvariant,shuffle,independentRandom};
});
