try {
document.body.insertAdjacentHTML('beforeend',"<main>\n<section id=\"homeScreen\" class=\"screen home\"><button id=\"homeSoundToggle\" class=\"circle sound-toggle\" data-sound-toggle aria-label=\"音をオフにする\" aria-pressed=\"false\">♪</button><h1 class=\"sr-only\">ナンバーブラフ</h1><img class=\"home-brand\" src=\"https://tanabe0422.github.io/number-bluff/assets/home-logo.webp\" alt=\"\" aria-hidden=\"true\"><div class=\"home-art\" aria-hidden=\"true\"><img class=\"home-scene\" src=\"https://tanabe0422.github.io/number-bluff/assets/home-hero.webp\" alt=\"\"></div><div class=\"home-actions\"><label class=\"private-room-option\"><input id=\"privateRoom\" type=\"checkbox\"><span>プライベートルームにする</span></label><button id=\"startGame\" data-intent=\"createRoom\" class=\"pill gold\">ルームを作成</button><button id=\"joinGame\" class=\"pill blue\">ルームに参加</button><p id=\"roomCreateStatus\" class=\"room-status\" role=\"status\" aria-live=\"polite\"></p></div><nav class=\"home-icons\" aria-label=\"案内\"><button id=\"homeRules\"><b aria-hidden=\"true\">?</b><span class=\"icon-caption\">遊び方</span></button></nav></section>\n<section id=\"lobbyScreen\" class=\"screen hide\" aria-label=\"ロビー\"><header class=\"topbar\"><h1 id=\"lobbyTitle\"></h1><button id=\"copyRoomId\" class=\"room-copy hide\" type=\"button\" aria-label=\"ルームIDをコピー\">コピー</button><span id=\"lobbyHeaderSpacer\" class=\"topbar-spacer\" aria-hidden=\"true\"></span></header><p id=\"roomIdentity\" class=\"room-identity hide\"></p><p id=\"roomCopyStatus\" class=\"room-status hide\" role=\"status\" aria-live=\"polite\"></p><input id=\"roomCopyFallback\" class=\"room-copy-fallback hide\" readonly aria-label=\"コピーするルームID\"><p id=\"onlineLobbyStatus\" class=\"room-status hide\" role=\"status\" aria-live=\"polite\"></p><p id=\"lobbyError\" class=\"error\" role=\"alert\"></p><section class=\"glass lobby-box\"><h2>プレイヤー <span id=\"playerCount\">4/8</span></h2><div id=\"lobbyPlayers\" class=\"lobby-grid\"></div></section><section class=\"glass bot-config\"><h2>BOTの追加・設定 <small id=\"selectedBotLabel\"></small></h2><div class=\"bot-choices\" id=\"avatarChoices\"><button data-avatar=\"0\" aria-label=\"ほしもち\"><img src=\"https://tanabe0422.github.io/number-bluff/assets/star-sprite.webp\" alt=\"\"></button><button data-avatar=\"1\" aria-label=\"ほしねこ\"><img src=\"https://tanabe0422.github.io/number-bluff/assets/moon-cat.webp\" alt=\"\"></button><button data-avatar=\"2\" aria-label=\"もふうさ\"><img src=\"https://tanabe0422.github.io/number-bluff/assets/cloud-bunny.webp\" alt=\"\"></button><button data-avatar=\"3\" aria-label=\"くもまる\"><img src=\"https://tanabe0422.github.io/number-bluff/assets/blue-cloud.webp\" alt=\"\"></button><button id=\"addBot\" aria-label=\"BOTを追加\">＋</button></div><div class=\"difficulty\" aria-label=\"BOTの難易度\"><button data-difficulty=\"easy\">やさしい</button><button data-difficulty=\"normal\">普通</button><button data-difficulty=\"hard\">強い</button></div><div class=\"bot-footer\"><button id=\"removeBot\">選択BOTを外す</button></div></section><button id=\"beginGame\" data-intent=\"startGame\" class=\"pill lavender\">ゲームを開始する <span>›</span></button><footer class=\"screen-return-bar\"><button id=\"lobbyRules\" class=\"screen-return\" type=\"button\">遊び方</button><button id=\"lobbyBack\" class=\"screen-return\" aria-label=\"ホームへ戻る\">ホームへ戻る</button></footer></section>\n<section id=\"battleScreen\" class=\"screen hide\" aria-label=\"対戦\"><header class=\"topbar\"><button id=\"homeBtn\" class=\"circle battle-exit\" aria-label=\"対戦を終了してホームへ\" aria-controls=\"restartConfirm\" aria-expanded=\"false\">終了</button><h1 id=\"battleTitle\"><span id=\"battlePhase\" class=\"hide\"></span><span class=\"battle-meta\"><span id=\"roundLabel\"></span><span id=\"survivorCount\"></span></span></h1><button id=\"battleSoundToggle\" class=\"circle sound-toggle\" data-sound-toggle aria-label=\"音をオフにする\" aria-pressed=\"false\">♪</button><button id=\"rulesBtn\" class=\"circle\" aria-label=\"遊び方\">?</button></header><p id=\"onlineBattleStatus\" class=\"room-status hide\" role=\"status\" aria-live=\"polite\"></p><section id=\"restartConfirm\" class=\"exit-overlay hide\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"restartTitle\"><div class=\"glass exit-confirm\"><h2 id=\"restartTitle\"></h2><p id=\"restartText\"></p><div class=\"button-row\"><button id=\"cancelRestart\">続ける</button><button id=\"confirmRestart\" class=\"gold\">終了して戻る</button></div></div></section><div id=\"playerGrid\" class=\"battle-grid\" tabindex=\"0\" aria-label=\"プレイヤーとカード（上下にスクロール）\"></div><section id=\"gamePanel\"><div class=\"bid-panel glass\"><div id=\"bidActor\" aria-hidden=\"true\"></div><span>現在の宣言</span><strong id=\"bid\">—</strong><span id=\"lastBidder\"></span></div><div id=\"emoteBar\" class=\"emote-bar\" role=\"group\" aria-label=\"リアクションと捨て札\"></div><div id=\"status\" class=\"sr-only\" role=\"status\" aria-live=\"polite\" tabindex=\"-1\"></div><div class=\"input-console glass\"><div class=\"controls\"><div id=\"keypad\" class=\"keypad\" role=\"group\" aria-label=\"数字入力\"><button data-digit=\"1\">1</button><button data-digit=\"2\">2</button><button data-digit=\"3\">3</button><button data-digit=\"4\">4</button><button data-digit=\"5\">5</button><button data-digit=\"6\">6</button><button data-digit=\"7\">7</button><button data-digit=\"8\">8</button><button data-digit=\"9\">9</button><button class=\"zero\" data-digit=\"0\">0</button><button id=\"backspace\" aria-label=\"最後の1文字を消す\">⌫</button><div id=\"deckIndicator\" class=\"deck-indicator\" role=\"status\"><div class=\"player-card hidden deck-stack\" aria-hidden=\"true\">?</div><span id=\"deckCount\"></span></div></div><div class=\"decisions\"><button id=\"declare\" class=\"declare-region gold\" aria-describedby=\"inputHint inputError\"><span id=\"number\" aria-label=\"宣言する数字\"></span><span class=\"declare-label\">宣言</span></button><button id=\"challenge\" class=\"lavender\">グラビティ！<img src=\"https://tanabe0422.github.io/number-bluff/assets/star-sprite.webp\" alt=\"\" aria-hidden=\"true\"></button></div></div><p id=\"inputHint\" class=\"sr-only\">前より大きな1以上の整数を宣言</p><p id=\"inputError\" role=\"alert\" class=\"error\"></p></div></section><div id=\"resultAnnouncement\" class=\"sr-only\" role=\"status\" aria-live=\"polite\"></div><section id=\"result\" class=\"hide\"><h2 id=\"resultTitle\" class=\"sr-only\" tabindex=\"-1\">ラウンド結果</h2><section class=\"calculation glass\" aria-live=\"off\"><div><h3 id=\"calculationHeading\">計算の流れ</h3><div id=\"calculationSteps\"></div></div><div class=\"final-total\"><span id=\"totalLabel\">最終合計</span><strong id=\"finalTotal\"></strong></div></section><div class=\"result-message glass\"><div id=\"resultAvatar\" aria-hidden=\"true\"></div><div><p id=\"resultText\"></p><p id=\"streakSummary\"></p></div></div><button id=\"next\" class=\"pill gold\">次のラウンドへ <span>›</span></button><button id=\"returnRoomLobby\" class=\"pill blue hide\" type=\"button\">ルームロビーに戻る</button></section></section>\n<section id=\"guidePanel\" class=\"screen hide\" aria-label=\"ゲームガイド\"><header class=\"topbar\"><h1 id=\"guideTitle\" class=\"sr-only\">遊び方</h1></header><div class=\"guide-tabs\" role=\"tablist\" aria-label=\"ガイド\"><button data-tab=\"rules\" role=\"tab\">遊び方</button><button data-tab=\"cards\" role=\"tab\">カード図鑑</button><button data-tab=\"bots\" role=\"tab\">BOT</button><button data-tab=\"examples\" role=\"tab\">計算例</button></div><article id=\"guideContent\" tabindex=\"-1\"></article><footer class=\"screen-return-bar\"><button id=\"closeGuide\" class=\"screen-return\" aria-label=\"ガイドを閉じる\">閉じる</button></footer></section>\n<section id=\"joinPanel\" class=\"screen hide\" aria-labelledby=\"joinTitle\"><header class=\"topbar\"><h1 id=\"joinTitle\">ルームに参加</h1></header><form id=\"joinForm\" class=\"join-form glass\"><label class=\"sr-only\" for=\"roomId\">ルームID</label><input id=\"roomId\" name=\"roomId\" placeholder=\"ルームID\" autocomplete=\"off\" maxlength=\"64\" required><button id=\"joinRoom\" data-intent=\"joinRoom\" class=\"pill blue\" type=\"submit\">参加する</button><p id=\"roomJoinStatus\" class=\"room-status\" role=\"status\" aria-live=\"polite\"></p></form><section id=\"joinPublicPanel\" class=\"public-room-panel glass\" aria-labelledby=\"publicRoomsTitle\"><div class=\"public-room-heading\"><h2 id=\"publicRoomsTitle\">公開ルーム一覧</h2><button id=\"refreshPublicRooms\" type=\"button\">更新</button></div><p id=\"publicRoomsStatus\" class=\"room-status\" role=\"status\" aria-live=\"polite\">公開ルーム一覧は準備中です。ルームIDで参加できます。</p><div id=\"publicRoomsList\" class=\"public-room-list\"></div></section><footer class=\"screen-return-bar\"><button id=\"closeJoin\" class=\"screen-return\" aria-label=\"ホームへ戻る\">ホームへ戻る</button></footer></section>\n<dialog id=\"cardDetail\"><button id=\"closeCardDetail\" class=\"circle\" aria-label=\"カード詳細を閉じる\">×</button><div id=\"cardDetailContent\"></div></dialog><dialog id=\"discardDetail\" aria-labelledby=\"discardTitle\"><button id=\"closeDiscard\" type=\"button\" aria-label=\"捨て札を閉じる\">閉じる</button><h2 id=\"discardTitle\">捨て札</h2><p>現在の山札に戻っていない公開済みカード</p><div id=\"discardList\"></div></dialog></main>");

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
  function random(rng) {
    if(typeof rng !== 'function') throw new TypeError('Inject an RNG function returning [0,1).');
    const n = rng(); if(!Number.isFinite(n)||n<0||n>=1) throw new RangeError('RNG must return [0,1).'); return n;
  }
  function shuffle(input,rng) { const a=input.slice(); for(let i=a.length-1;i>0;i--) {const j=Math.floor(random(rng)*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  const alive = s => s.players.filter(p=>p.life>0);
  function nextSeat(s,id) { const i=s.players.findIndex(p=>p.id===id);for(let n=1;n<=s.players.length;n++){const p=s.players[(i+n)%s.players.length];if(p.life>0)return p.id;} return null; }
  function updated(s,patch) { return {...s,...patch,revision:s.revision+1}; }
  function createLobby({name='YOU',botCount=1,difficulty='normal'}={}) {
    if(!Number.isInteger(botCount)||botCount<0||botCount>7||!difficulties.includes(difficulty)) throw new RangeError('Use 0–7 bots and easy/normal/hard.');
    return {phase:'lobby',revision:0,game:0,round:0,rankingEligible:false,players:[{id:'p1',name:String(name).slice(0,24)||'YOU',kind:'human',difficulty:null,life:3,wins:0,currentStreak:0,bestStreak:0,eliminated:false},...Array.from({length:botCount},(_,i)=>({id:`p${i+2}`,name:`BOT ${i+1}`,kind:'bot',difficulty,life:3,wins:0,currentStreak:0,bestStreak:0,eliminated:false}))],deck:FULL_DECK.slice(),discard:[],hands:{},bid:null,last:null,turn:null,starter:'p1',result:null,history:[]};
  }
  function addBot(s,difficulty='normal') {
    if(s.phase!=='lobby'||s.players.length>=8||!difficulties.includes(difficulty))return s;
    const seat=Array.from({length:7},(_,i)=>i+2).find(n=>!s.players.some(p=>p.id===`p${n}`));
    return updated(s,{players:[...s.players,{id:`p${seat}`,name:`BOT ${seat-1}`,kind:'bot',difficulty,life:3,wins:0,currentStreak:0,bestStreak:0,eliminated:false}]});
  }
  function removeBot(s,id) {if(s.phase!=='lobby'||s.players.length<=1||!s.players.some(p=>p.id===id&&p.kind==='bot'))return s;return updated(s,{players:s.players.filter(p=>p.id!==id)});}
  function setDifficulty(s,id,difficulty) {if(s.phase!=='lobby'||!difficulties.includes(difficulty)||!s.players.some(p=>p.id===id&&p.kind==='bot'))return s;return updated(s,{players:s.players.map(p=>p.id===id?{...p,difficulty}:p)});}
  function draw(pool,rng) { if(!pool.deck.length){pool.deck=shuffle(pool.discard,rng);pool.discard=[];} if(!pool.deck.length)throw new Error('No available card');return pool.deck.pop(); }
  function deal(s,rng) {
    const pool={deck:s.deck.slice(),discard:s.discard.slice()},hands={};
    for(const p of alive(s)) hands[p.id]=draw(pool,rng);
    return updated(s,{...pool,hands,phase:'play',round:s.round+1,bid:null,last:null,turn:s.starter,result:null,history:[]});
  }
  function startGame(s,rng) {if(s.phase!=='lobby'||s.players.length<2||s.players.length>8)return s;const players=shuffle(s.players,rng);return deal({...s,players,deck:shuffle(FULL_DECK,rng),discard:[],game:s.game+1,round:0,rankingEligible:players.filter(p=>p.kind==='human').length>=2||(players.filter(p=>p.kind==='human').length===1&&players.some(p=>p.kind==='bot'&&p.difficulty==='hard')),starter:players[0].id},rng);}
  function rematch(s,rng) {if(s.phase!=='finished')return s;return startGame({...s,phase:'lobby',players:s.players.map(p=>({...p,life:3,eliminated:false})),hands:{},result:null},rng);}
  // A room survives leaving a match. The UI must confirm abandoning active play;
  // no winner is awarded here. createLobby is reserved for a genuinely new room.
  function returnToLobby(s) {
    if(!['play','reveal','finished'].includes(s.phase))return s;
    return updated(s,{phase:'lobby',round:0,rankingEligible:false,players:s.players.map(p=>({...p,life:3,eliminated:false})),
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
    if(s.phase==='play'&&(!alive(s).some(p=>p.id===s.turn)||Object.keys(s.hands).length!==alive(s).length))throw new Error('Invalid active turn/hands');
    return true;
  }
  return {FULL_DECK,createLobby,addBot,removeBot,setDifficulty,startGame,nextRound,rematch,returnToLobby,declare,challenge,evaluateCards,publicView,botView,chooseBotAction,possibleTotals,parseBid,dispatch,assertInvariant,shuffle};
});


;

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffScheduler = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Invalidate even callbacks already queued by the browser before clearTimeout.
  return function createScheduler(set = setTimeout, clear = clearTimeout) {
    let generation = 0, pending = null;
    function cancel() {
      generation++;
      if (pending !== null) clear(pending);
      pending = null;
    }
    function schedule(callback, delay) {
      cancel();
      const ticket = generation;
      pending = set(() => {
        if (ticket !== generation) return;
        pending = null;
        generation++;
        callback();
      }, delay);
    }
    return { cancel, schedule };
  };
});



;

/*!
Magic UI Meteors — adapted head/tail structure; React Bits Galaxy — Star() optical sprite, sampled offline.

MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
/* Scene/cloud parallax is unchanged. Overlay adapted from Magic UI Meteors,
   with optical star sprites sampled from React Bits Galaxy (not drawn SVG).
   See THIRD_PARTY_NOTICES and SOURCES. No game state or game RNG is accessed. */
(function () {
  'use strict';
  if (window.NumberBluffBackground) window.NumberBluffBackground.destroy();
  var enabled = true, destroyed = false, layer = null, pool = [], active = new Set(), timers = new Set();
  var sequence = 0, started = false, small = window.innerWidth < 480;
  var seed = (Date.now() ^ 0x91e10da5) >>> 0;
  try { var entropy = new Uint32Array(1); window.crypto.getRandomValues(entropy); seed = entropy[0] || seed; } catch (_) {}
  function random() { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }
  function range(min, max) { return min + random() * (max - min); }
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function snapshot() {
    return Object.freeze({ enabled:enabled, reducedMotion:media.matches, hidden:document.hidden,
      running:Boolean(layer && enabled && !media.matches && !document.hidden && !destroyed),
      mounted:Boolean(layer), destroyed:destroyed, starCount:small ? 4 : 6,
      poolSize:pool.length, activeMeteorCount:active.size, timerCount:timers.size });
  }
  function later(callback, delay, ticket) {
    var id = setTimeout(function () {
      timers.delete(id);
      if (ticket === sequence && snapshot().running) callback();
    }, delay);
    timers.add(id);
  }
  function stopOverlay() {
    sequence++; started = false;
    timers.forEach(function (id) { clearTimeout(id); }); timers.clear();
    active.forEach(function (animation) { animation.cancel(); }); active.clear();
    pool.forEach(function (node) { node.dataset.busy = 'false'; });
  }
  function launch(ticket) {
    if (ticket !== sequence || !snapshot().running) return;
    var node = pool.find(function (item) { return item.dataset.busy !== 'true'; });
    if (!node || typeof node.animate !== 'function') return;
    var width = window.innerWidth, height = window.innerHeight;
    var angle = range(144, 162), radians = angle * Math.PI / 180;
    var distance = range(width * .48, Math.min(width * .95, 900));
    var x = range(width * .28, width * 1.09), y = range(height * .025, height * .36);
    var duration = range(1350, 2350), length = range(small ? 58 : 82, small ? 115 : 172);
    node.style.left = x + 'px'; node.style.top = y + 'px';
    node.style.setProperty('--meteor-length', length + 'px');
    node.style.setProperty('--meteor-core', range(23, 34) + 'px');
    node.style.setProperty('--meteor-warmth', random() < .25 ? '#fff0c7' : '#e4edff');
    node.dataset.busy = 'true';
    var rotate = ' rotate(' + angle + 'deg)';
    var animation = node.animate([
      { transform:'translate3d(0,0,0)' + rotate, opacity:0, offset:0 },
      { opacity:range(.55,.85), offset:.15 },
      { opacity:.48, offset:.68 },
      { transform:'translate3d(' + Math.cos(radians)*distance + 'px,' + Math.sin(radians)*distance + 'px,0)' + rotate, opacity:0, offset:1 }
    ], { duration:duration, easing:'linear', fill:'none' });
    active.add(animation);
    function done() { active.delete(animation); if (ticket === sequence) node.dataset.busy = 'false'; }
    animation.onfinish = done; animation.oncancel = done;
  }
  function group(ticket) {
    if (ticket !== sequence || !snapshot().running) return;
    // Short, nonperiodic conversations: a pair, sometimes a third, then quiet.
    var count = small ? 2 : (random() < .38 ? 3 : 2);
    launch(ticket);
    for (var i=1;i<count;i++) later(function () { launch(ticket); }, i * range(280,620), ticket);
    later(function () { group(ticket); }, range(6800,11200), ticket);
  }
  function sync() {
    if (!layer) return;
    var state = snapshot();
    layer.dataset.motion = state.running ? 'running' : 'paused';
    layer.dataset.static = (!enabled || media.matches) ? 'true' : 'false';
    if (!state.running) { stopOverlay(); return; }
    if (!started) { started = true; var ticket = ++sequence; later(function () { group(ticket); }, range(650,1450), ticket); }
  }
  function mount() {
    if (destroyed || layer || !document.body) return;
    layer = document.createElement('div'); layer.className = 'nb-background'; layer.setAttribute('aria-hidden','true');
    var scene = document.createElement('div'); scene.className = 'nb-background__scene'; layer.appendChild(scene);
    var stars = document.createElement('div'); stars.className = 'nb-sky-glints';
    // Four/six optical blooms, not sixteen uniform moving dots. Central logo/UI
    // area stays quiet; the original illustrated stars remain the primary art.
    for (var i=0;i<(small?4:6);i++) {
      var star = document.createElement('span'); star.className = 'nb-sky-glint';
      star.style.left = (i%2 ? range(72,95) : range(5,26)) + '%';
      star.style.top = range(6,65) + '%';
      star.style.setProperty('--glint-size',range(26,43)+'px');
      star.style.setProperty('--glint-duration',range(4800,9300)+'ms');
      star.style.setProperty('--glint-delay',(-range(0,9000))+'ms');
      stars.appendChild(star);
    }
    layer.appendChild(stars);
    var nebula = document.createElement('div'); nebula.className = 'nb-background__nebula'; layer.appendChild(nebula);
    var distantClouds = document.createElement('div'); distantClouds.className = 'nb-background__clouds-back'; layer.appendChild(distantClouds);
    var meteors = document.createElement('div'); meteors.className = 'nb-meteor-pool';
    for (var j=0;j<(small?2:3);j++) {
      var meteor = document.createElement('span'); meteor.className = 'nb-meteor'; meteor.dataset.busy = 'false';
      ['wake','tail','head'].forEach(function (part) { var n=document.createElement('span'); n.className='nb-meteor__'+part; meteor.appendChild(n); });
      meteors.appendChild(meteor); pool.push(meteor);
    }
    layer.appendChild(meteors);
    var clouds = document.createElement('div'); clouds.className = 'nb-background__clouds'; layer.appendChild(clouds);
    document.body.insertBefore(layer,document.body.firstChild); sync();
  }
  function destroy() {
    if (destroyed) return; destroyed = true; stopOverlay();
    document.removeEventListener('DOMContentLoaded',mount); document.removeEventListener('visibilitychange',sync);
    if (media.removeEventListener) media.removeEventListener('change',sync); else if (media.removeListener) media.removeListener(sync);
    if (layer) layer.remove(); layer=null; pool=[];
  }
  var api = { setEnabled:function(value) { if (!destroyed) { enabled=Boolean(value); sync(); } return snapshot(); }, destroy:destroy };
  Object.defineProperty(api,'state',{enumerable:true,get:snapshot}); window.NumberBluffBackground=Object.freeze(api);
  document.addEventListener('visibilitychange',sync);
  if (media.addEventListener) media.addEventListener('change',sync); else if (media.addListener) media.addListener(sync);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded',mount,{once:true});
}());


;

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffPresentation = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Presentation reads an already-authorized core result. It never draws cards,
  // decides a loser, changes game state, or publishes private hands.
  // Future room adapters should pass their stable result ID as key, not a local
  // render count. Synchronizing server time is adapter work (not implemented here).
  function plan(result, players = []) {
    if (!result || !result.cards) throw new TypeError('An authorized reveal result is required');
    const seats = [...players.map(p => p.id), ...Object.keys(result.cards)];
    const ids = [...new Set(seats)].filter(id => result.cards[id]);
    const cards = ids.map(id => result.cards[id]);
    const hasExtra = cards.some(c => c.kind === 'extra') && !!result.extraCard;
    const all = [...cards, ...(hasExtra ? [result.extraCard] : [])];
    const steps = [];
    let at = 0;
    let state = {phase:'hold', revealedIds:[], cardId:null, extraVisible:false,
      removedCardId:null, terms:[], runningTotal:null, multiplierApplied:false,
      compareVisible:false, outcomeVisible:false, complete:false};
    function add(phase, patch = {}) {
      state = {...state, ...patch, phase};
      steps.push(Object.freeze({at, ...state,
        revealedIds:Object.freeze(state.revealedIds.slice()),
        terms:Object.freeze(state.terms.map(term => Object.freeze({...term})))}));
    }
    add('hold'); at = 300;
    for (const card of cards) {
      add('reveal', {cardId:card.id, revealedIds:[...state.revealedIds,card.id]}); at += 80;
    }
    at += 200;
    if (hasExtra) { add('extra', {cardId:result.extraCard.id,extraVisible:true}); at += 400; }
    if (all.some(c => c.kind === 'max0')) {
      add('max', {cardId:result.removedCard?.id || null,removedCardId:result.removedCard?.id || null}); at += 400;
    }
    const numeric = all.filter(c => c.kind === 'number');
    let subtotal = 0;
    for (const card of numeric) {
      const value = card.id === result.removedCard?.id ? 0 : card.value;
      subtotal += value;
      add('sum', {cardId:card.id, runningTotal:subtotal,terms:[...state.terms,{cardId:card.id,value}]});
      at += numeric.length <= 3 ? 220 : 110;
    }
    if (!numeric.length) { add('sum',{cardId:null,runningTotal:result.baseSum}); at += 220; }
    if (result.multiplier === 2) {
      add('multiply',{cardId:null,multiplierApplied:true,runningTotal:result.sum}); at += 400;
    }
    // The authoritative total wins; the arithmetic above only stages its terms.
    add('compare', {cardId:null,runningTotal:result.sum,compareVisible:true}); at += 350;
    add('outcome', {outcomeVisible:true}); at += 180;
    // Reset refreshes the deck after judgement; it never zeros the total.
    if (result.reset) { add('reset', {cardId:null,runningTotal:result.sum}); at += 350; }
    add('complete', {complete:true});
    return Object.freeze(steps);
  }

  function scopeOrder(key, prior) {
    const m=typeof key==='string'&&/^(\d+):(\d+):(\d+)(?::|$)/.exec(key);if(!m)return {order:0,scope:prior};
    const parts=m.slice(1).map(Number);if(!parts.every(Number.isSafeInteger))return {order:0,scope:prior};
    if(!prior)return {order:1,scope:parts};for(let i=0;i<3;i++)if(parts[i]!==prior[i])return {order:parts[i]>prior[i]?1:-1,scope:parts};return {order:0,scope:prior};
  }
  function createPresenter({clock = {}, onPhase = () => {}, onComplete = () => {}, reducedMotion = false} = {}) {
    const set = clock.setTimeout ? clock.setTimeout.bind(clock) : setTimeout;
    const clear = clock.clearTimeout ? clock.clearTimeout.bind(clock) : clearTimeout;
    let token = 0, pending = [], destroyed = false, key = null, frames = null, current = null, active = false;
    const seen = new Set(); let scope = null;
    function cancel() {
      token++; pending.forEach(clear); pending = []; active = false; frames = null; current = null; key = null;
    }
    function emit(frame, ticket) {
      if (destroyed || ticket !== token || !active) return;
      current = frame;
      onPhase(frame, key);
      // A callback may synchronously cancel, destroy, or start another result.
      if (destroyed || ticket !== token || !active) return;
      if (frame.complete) { active = false; pending.forEach(clear); pending = []; onComplete(frame, key); }
    }
    function play(nextKey, result, players = []) {
      if (destroyed) return false; const nextScope=scopeOrder(nextKey,scope);if(nextScope.order<0)return false;if(nextScope.order>0){seen.clear();scope=nextScope.scope;}
      if(seen.has(nextKey)) return false;
      const nextFrames = plan(result, players);
      cancel(); key = nextKey; seen.add(nextKey);if(seen.size>128)seen.delete(seen.values().next().value); frames = nextFrames; active = true;
      const ticket = token;
      if (reducedMotion) { emit(frames[frames.length - 1], ticket); return true; }
      emit(frames[0],ticket);
      if (destroyed || ticket !== token || !active) return true;
      for (const frame of frames.slice(1)) pending.push(set(() => emit(frame,ticket),frame.at));
      return true;
    }
    function skip() {
      if (destroyed || !active || !frames) return false;
      const final = frames[frames.length - 1];
      token++; pending.forEach(clear); pending = [];
      emit(final, token); return true;
    }
    function destroy() { if (destroyed) return; cancel(); destroyed = true; seen.clear(); }
    return {play, skip, cancel, destroy, get active(){return active;}, get state(){return current;}, get retainedCount(){return seen.size;}};
  }
  return {plan, createPresenter};
});


;

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffAudio = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Small, original synthesized cues: no downloads or music loop. The only setting is the small sound toggle.
  // Each tuple is [frequency, seconds, offset, endFrequency, waveform, gain].
  const cues = {
    tap: [[780, .055, 0, 620, 'sine', .13]],
    turn: [[659, .10, 0, 784, 'sine', .10], [988, .13, .075, 1047, 'sine', .06]],
    life: [[330, .18, 0, 247, 'triangle', .10], [247, .20, .07, 220, 'sine', .07]],
    deal: [[330, .10, 0, 650, 'triangle', .11], [440, .10, .065, 880, 'triangle', .10], [660, .14, .13, 990, 'sine', .10]],
    declare: [[440, .12, 0, 660, 'triangle', .16], [880, .18, .07, 880, 'sine', .08]],
    challenge: [[196, .22, 0, 98, 'triangle', .20], [392, .20, .035, 196, 'sine', .13], [784, .11, .09, 440, 'sine', .07]],
    reveal: [[880, .085, 0, 1320, 'triangle', .10]],
    extra: [[523, .12, 0, 587, 'sine', .12], [784, .15, .09, 880, 'sine', .12], [1175, .22, .18, 1568, 'sine', .08]],
    max: [[880, .25, 0, 220, 'triangle', .12], [1760, .16, .04, 440, 'sine', .05]],
    sum: [[660, .07, 0, 740, 'sine', .09]],
    multiply: [[262, .25, 0, 523, 'triangle', .13], [392, .25, .06, 784, 'sine', .10], [523, .25, .12, 1047, 'sine', .08]],
    reset: [[523, .18, 0, 262, 'triangle', .09], [392, .18, .09, 784, 'sine', .09], [523, .20, .18, 1047, 'sine', .08]],
    compare: [[392, .16, 0, 392, 'sine', .12], [587, .16, .08, 587, 'sine', .09]],
    win: [[523, .22, 0, 523, 'triangle', .11], [659, .24, .11, 659, 'sine', .12], [784, .30, .22, 784, 'sine', .12], [1047, .40, .33, 1047, 'sine', .08]],
    loss: [[392, .20, 0, 349, 'triangle', .10], [294, .25, .12, 262, 'sine', .10]],
    outcome: [[523, .18, 0, 523, 'sine', .10], [659, .26, .10, 659, 'sine', .09]]
  };
  function create({ contextFactory, document: doc = typeof document === 'object' ? document : null,
    window: win = typeof window === 'object' ? window : null,
    storage, now: clockNow = () => typeof performance === 'object' ? performance.now() : Date.now() } = {}) {
    let context = null, master = null, destroyed = false, resumePending = false, resumeAttempt = 0, pendingCue = null;
    let store = storage, muted = false, lastGestureAt = -Infinity;
    const volume = .5, storageKey = 'number-bluff.sound-muted.v1';
    try { if (store === undefined) store = win?.localStorage; muted = store?.getItem(storageKey) === 'true'; } catch {}
    const voices = new Set(), lastPlayed = new Map();
    const hidden = () => !!doc?.hidden;
    function stop() {
      pendingCue = null;
      for (const voice of [...voices]) {
        try { voice.oscillator.stop(); } catch {}
        try { voice.oscillator.disconnect(); voice.gain.disconnect(); } catch {}
        voices.delete(voice);
      }
      lastPlayed.clear();
    }
    function unlock(event) {
      // Only the trusted interaction handler may create/resume the device context.
      if (destroyed || hidden() || muted || event?.isTrusted === false) return false;
      lastGestureAt = clockNow();
      try {
        if (!context || context.state === 'closed') {
          const Constructor = win?.AudioContext || win?.webkitAudioContext;
          if (!contextFactory && !Constructor) return false;
          context = contextFactory ? contextFactory() : new Constructor();
          master = context.createGain(); master.gain.value = volume; master.connect(context.destination);
        }
        if (context.state !== 'running') {
          // A browser may leave resume() pending (rather than reject it) when
          // pointerdown was not an activation it accepts. Retry from touchend /
          // click instead of permanently locking out all subsequent gestures.
          const attempt = ++resumeAttempt;
          resumePending = true;
          Promise.resolve(context.resume()).then(() => {
            if (attempt !== resumeAttempt) return;
            const cue = pendingCue; pendingCue = null;
            // Only the current interaction's fresh cue may survive async unlock.
            if (cue && clockNow() - cue.at <= 250 && !destroyed && !muted && !hidden()) play(cue.kind);
          }).catch(() => { if (attempt === resumeAttempt) pendingCue = null; })
            .finally(() => { if (attempt === resumeAttempt) resumePending = false; });
        }
        return true;
      } catch { resumePending = false; return false; }
    }
    function play(kind) {
      if (destroyed || muted || hidden() || !context || !cues[kind]) return false;
      if (context.state !== 'running') {
        if (resumePending && clockNow() - lastGestureAt <= 250) {
          // A generic click must not replace a more meaningful deal/declaration.
          if (!pendingCue || kind !== 'tap') pendingCue = { kind, at: clockNow() };
          return true;
        }
        return false;
      }
      const now = context.currentTime;
      // Dense renders/clicks cannot stack unbounded voices. No delayed queue on resume.
      if (now - (lastPlayed.get(kind) ?? -Infinity) < .035) return false;
      lastPlayed.set(kind, now);
      try {
        for (const [frequency, duration, offset, end, type, volume] of cues[kind]) {
          if (voices.size >= 28) break;
          const oscillator = context.createOscillator(), gain = context.createGain();
          const start = now + offset, finish = start + duration;
          oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(end, finish);
          gain.gain.setValueAtTime(.0001, start);
          gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.012, duration / 4));
          gain.gain.setValueAtTime(volume, start + duration * .3);
          gain.gain.exponentialRampToValueAtTime(.0001, finish);
          oscillator.connect(gain); gain.connect(master);
          const voice = { oscillator, gain }; voices.add(voice);
          oscillator.onended = () => { voices.delete(voice); oscillator.disconnect(); gain.disconnect(); };
          oscillator.start(start); oscillator.stop(finish + .01);
        }
        return true;
      } catch { stop(); return false; } // Audio failure never interrupts a turn.
    }
    function suspend() {
      stop();
      if (context && context.state !== 'closed') {
        try { Promise.resolve(context.suspend()).catch(() => {}); } catch {}
      }
    }
    const visibility = () => { if (hidden()) suspend(); };
    // touchend is retained for older iOS WebViews; pointerdown covers modern devices.
    const gestures = ['pointerdown', 'touchend', 'keydown', 'click'];
    for (const type of gestures) doc?.addEventListener?.(type, unlock, { capture: true, passive: true });
    doc?.addEventListener?.('visibilitychange', visibility);
    win?.addEventListener?.('pagehide', suspend);
    function setMuted(value, event) {
      muted = !!value;
      try { store?.setItem(storageKey, String(muted)); } catch {}
      if (muted) stop();
      if (master) master.gain.value = muted ? 0 : volume;
      if (!muted && event?.isTrusted) unlock(event);
      return muted;
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true; stop();
      for (const type of gestures) doc?.removeEventListener?.(type, unlock, { capture: true });
      doc?.removeEventListener?.('visibilitychange', visibility); win?.removeEventListener?.('pagehide', suspend);
      try { Promise.resolve(context?.close()).catch(() => {}); } catch {}
    }
    return Object.freeze({ unlock, play, stop, destroy, setMuted, isMuted: () => muted });
  }
  return Object.freeze({ create });
});


;

(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NumberBluffCardArt=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const assets=Object.freeze({normal:Object.freeze({"-10": "https://tanabe0422.github.io/number-bluff/assets/card-normal-minus10.webp", "-5": "https://tanabe0422.github.io/number-bluff/assets/card-normal-minus5.webp", "0": "https://tanabe0422.github.io/number-bluff/assets/card-normal-0.webp", "1": "https://tanabe0422.github.io/number-bluff/assets/card-normal-1.webp", "2": "https://tanabe0422.github.io/number-bluff/assets/card-normal-2.webp", "3": "https://tanabe0422.github.io/number-bluff/assets/card-normal-3.webp", "4": "https://tanabe0422.github.io/number-bluff/assets/card-normal-4.webp", "5": "https://tanabe0422.github.io/number-bluff/assets/card-normal-5.webp", "10": "https://tanabe0422.github.io/number-bluff/assets/card-normal-10.webp", "15": "https://tanabe0422.github.io/number-bluff/assets/card-normal-15.webp", "20": "https://tanabe0422.github.io/number-bluff/assets/card-normal-20.webp"}),special:Object.freeze({"double": "https://tanabe0422.github.io/number-bluff/assets/card-double.webp", "max0": "https://tanabe0422.github.io/number-bluff/assets/card-max0.webp", "extra": "https://tanabe0422.github.io/number-bluff/assets/card-extra.webp", "reset": "https://tanabe0422.github.io/number-bluff/assets/card-reset.webp"})});
 const dimensions=Object.freeze({double:[1051,1496],max0:[1049,1499],extra:[1049,1500],reset:[1062,1482]});
 function size(card){return card.kind==='number'?(card.value>=10?[1024,1536]:[1061,[0,2].includes(card.value)?1483:1482]):dimensions[card.kind];}
 function layout(card){const [w,h]=size(card),sourceHeight=h/(w*1.5),lowerStart=card.kind==='number'&&card.value===4?.28:.35,bandSize=lowerStart-.2;return {sourceHeight,lowerStart,bandSize,capHeight:sourceHeight*.2,bandHeight:1-sourceHeight*(1-bandSize)};}
 function content(doc,card){const box=doc.createElement('div');box.className='card-content';const parts=layout(card);box.style.width='100%';box.style.height='100%';box.style.setProperty('--card-source-height',parts.sourceHeight*100+'%');box.style.setProperty('--card-cap-height',parts.capHeight*100+'%');box.style.setProperty('--card-band-height',parts.bandHeight*100+'%');box.style.setProperty('--card-lower-start',parts.lowerStart*100+'%');box.style.setProperty('--card-band-size',100/parts.bandSize+'%');box.style.setProperty('--card-band-position',.2/(1-parts.bandSize)*100+'%');
  // Extend only the empty numeral backdrop. The frame cap and illustrated lower
  // section retain a uniform source-pixel scale, with no character stretching.
  for(const part of ['cap','band']){const slice=doc.createElement('span');slice.className='card-art-'+part;slice.setAttribute('aria-hidden','true');slice.style.backgroundImage='url("'+source(card)+'")';box.append(slice);}return box;}
 function source(card){if(!card)return null;const map=card.kind==='number'?assets.normal:assets.special;const key=card.kind==='number'?String(card.value):card.kind;return Object.prototype.hasOwnProperty.call(map,key)?map[key]:null;}
 function create(doc,card){const src=source(card);if(!src)throw new TypeError('Unknown disclosed card artwork');const image=doc.createElement('img');image.className='card-art';image.crossOrigin='anonymous';image.src=src;image.alt='';image.draggable=false;image.decoding='async';image.setAttribute('aria-hidden','true');return image;}
 return Object.freeze({assets,source,create,size,layout,content});
});


;

/*!

Source: https://uiverse.io/Javierrocadev/funny-cobra-5
https://github.com/uiverse-io/galaxy/blob/main/Cards/Javierrocadev_funny-cobra-5.html
MIT License
Copyright - 2026 Javierrocadev (Javier Roca)
 *
Source: https://www.vengenceui.com/components/glow-border-card
https://github.com/Ashutoshx7/VengeanceUI/blob/main/src/app/globals.css
https://github.com/Ashutoshx7/VengeanceUI/blob/main/public/r/glow-border-card.json
MIT License
Copyright (c) 2025-2026 Ashutoshx7
 *
The following MIT terms apply to both sources above:
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 *
Modifications: Uiverse's 1.1s hover flip/25deg roll/UNO styling replaced with
a public-event-only 400ms Y flip of the existing nodes. Vengeance's thick,
blurred, rainbow infinite border replaced with a 1.5px gold-only masked rim,
GPU-transform rotation and a single 650ms pass. No third-party artwork used.
All geometry/opacity motion is finite. Images/numerals are not transformed
independently, filtered, repainted, recolored, or replaced.


*/
/*
 * Number Bluff: event-only card reveal and one-card gold rim.
 * Source and full MIT notices: component-card-reveal.css and THIRD_PARTY_NOTICES.txt.
 * Uiverse Javierrocadev: https://uiverse.io/Javierrocadev/funny-cobra-5
 * Vengeance UI: https://www.vengenceui.com/components/glow-border-card
 * Adaptation: no React, Tailwind, hover trigger, logo, raster processing, or rule logic.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffCardReveal = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const REVEAL_MS = 400, GOLD_MS = 650;
  function scopeOrder(key, prior) {
    const m=typeof key==='string'&&/^(\d+):(\d+):(\d+)(?::|$)/.exec(key);if(!m)return {order:0,scope:prior};
    const parts=m.slice(1).map(Number);if(!parts.every(Number.isSafeInteger))return {order:0,scope:prior};
    if(!prior)return {order:1,scope:parts};for(let i=0;i<3;i++)if(parts[i]!==prior[i])return {order:parts[i]>prior[i]?1:-1,scope:parts};return {order:0,scope:prior};
  }
  function createController(options = {}) {
    const doc = options.document || (typeof document !== 'undefined' ? document : null);
    const win = options.window || doc?.defaultView;
    const clock = options.clock || win || globalThis;
    const set = clock.setTimeout.bind(clock), clear = clock.clearTimeout.bind(clock);
    const media = win?.matchMedia?.('(prefers-reduced-motion: reduce)');
    const seenReveal = new Set(), seenGold = new Set(), active = new Set();
    let destroyed = false, goldEffect = null, scope = null, goldWater = -2;
    function advanceScope(key){const next=scopeOrder(key,scope);if(next.order<0)return false;if(next.order>0){scope=next.scope;seenReveal.clear();seenGold.clear();goldWater=-2;}return true;}
    const quiet = () => destroyed || !doc || doc.hidden || options.reducedMotion === true || !!media?.matches;
    const validKey = key => (typeof key === 'string' && key.length > 0) || typeof key === 'number';
    const attached = node => node && node.isConnected !== false && !!node.parentNode;
    function settleAll() { for (const effect of [...active]) effect.settle(); }
    function watch(animation, effect, ms) {
      // Timer is a bound, not a new presentation phase. The game never awaits us.
      effect.timer = set(() => effect.settle(), ms);
      if (animation) {
        effect.animation = animation;
        animation.onfinish = () => effect.settle();
        animation.oncancel = () => effect.settle();
      }
    }
    function reveal({ key, back, face, authorized = false } = {}) {
      // The caller must have received the public reveal event. There is no card
      // data input, image lookup, pre-rendered secret face, or engine reference.
      if (destroyed || !validKey(key) || !authorized || !back || !face || back === face ||
          face.parentNode || !attached(back) || !back.classList.contains('hidden') ||
          face.classList.contains('hidden') || face.classList.contains('out') ||
          face.dataset.revealed !== 'true') return false;
      const stale = !advanceScope(key);
      const duplicate = stale || seenReveal.has(key);
      if(!stale){seenReveal.add(key);if(seenReveal.size>128)seenReveal.delete(seenReveal.values().next().value);}
      if (duplicate || quiet() || typeof face.animate !== 'function') {
        back.replaceWith(face); return false;
      }
      // Do not carry a gold ring onto the rear face or duplicate its effect.
      if (goldEffect?.node === back) goldEffect.settle();
      const stage = doc.createElement('div'), rotor = doc.createElement('div');
      stage.className = 'nb-card-reveal-stage'; rotor.className = 'nb-card-reveal-rotor';
      // The actual front node stays first: existing .player-card lookups still
      // find the live face, including numeral and later zero-stamp updates.
      back.replaceWith(stage);
      back.removeAttribute('id'); back.setAttribute('aria-hidden', 'true');
      back.removeAttribute('aria-label'); back.removeAttribute('tabindex');
      back.classList.add('nb-card-reveal-back'); face.classList.add('nb-card-reveal-face');
      stage.append(rotor); rotor.append(face, back);
      const effect = { settled: false, timer: null, animation: null, settle() {
        if (effect.settled) return;
        effect.settled = true; active.delete(effect);
        if (effect.timer !== null) clear(effect.timer);
        if (effect.animation) {
          effect.animation.onfinish = null; effect.animation.oncancel = null;
          effect.animation.cancel();
        }
        face.classList.remove('nb-card-reveal-face');
        if (stage.parentNode) stage.replaceWith(face);
        // A rerender may have discarded the stage; never replace a newer node.
        back.remove();
      }};
      active.add(effect);
      try {
        const animation = rotor.animate([
          { transform: 'rotateY(-180deg)' },
          { transform: 'rotateY(0deg)' }
        ], { duration: REVEAL_MS, easing: 'cubic-bezier(.22,.68,.18,1)', fill: 'both' });
        watch(animation, effect, REVEAL_MS);
      } catch (_) { effect.settle(); return false; }
      return true;
    }
    function gold({ key, node } = {}) {
      // Caller chooses exactly the turn/challenge card; this controller never
      // searches for every card or derives a private value from its appearance.
      if (destroyed || !validKey(key) || !attached(node) ||
          !node.classList.contains('player-card') || node.classList.contains('out')) return false;
      const validScope=advanceScope(key);const match=typeof key==='string'&&/^\d+:\d+:\d+:p[1-8]:(null|\d+)$/.exec(key);const bid=match?(match[1]==='null'?-1:Number(match[1])):null;
      if (!validScope || (match && bid<=goldWater) || seenGold.has(key)) {
        // A replacement rerender must not leave an orphaned old-node animation.
        if (goldEffect && goldEffect.node !== node) goldEffect.settle();
        return false;
      }
      if(match)goldWater=bid;else{seenGold.add(key);if(seenGold.size>128)seenGold.delete(seenGold.values().next().value);}
      if (goldEffect) goldEffect.settle();
      if (quiet() || typeof node.animate !== 'function') return false;
      const rim = doc.createElement('span'), light = doc.createElement('span');
      rim.className = 'nb-card-gold-rim'; light.className = 'nb-card-gold-light';
      rim.setAttribute('aria-hidden', 'true'); rim.append(light); node.append(rim);
      const effect = { node, settled: false, timer: null, animation: null, settle() {
        if (effect.settled) return;
        effect.settled = true; active.delete(effect);
        if (goldEffect === effect) goldEffect = null;
        if (effect.timer !== null) clear(effect.timer);
        if (effect.animation) {
          effect.animation.onfinish = null; effect.animation.oncancel = null;
          effect.animation.cancel();
        }
        rim.remove();
      }};
      active.add(effect); goldEffect = effect;
      try {
        const animation = light.animate([
          { transform: 'rotate(0deg)', opacity: 0, offset: 0 },
          { transform: 'rotate(30deg)', opacity: .85, offset: .1 },
          { transform: 'rotate(300deg)', opacity: .65, offset: .83 },
          { transform: 'rotate(360deg)', opacity: 0, offset: 1 }
        ], { duration: GOLD_MS, easing: 'linear', fill: 'both' });
        watch(animation, effect, GOLD_MS);
      } catch (_) { effect.settle(); return false; }
      return true;
    }
    const onVisibility = () => { if (doc.hidden) settleAll(); };
    const onPreference = () => { if (media.matches) settleAll(); };
    doc?.addEventListener?.('visibilitychange', onVisibility);
    if (media?.addEventListener) media.addEventListener('change', onPreference);
    else media?.addListener?.(onPreference);
    function destroy() {
      if (destroyed) return;
      destroyed = true; settleAll();
      doc?.removeEventListener?.('visibilitychange', onVisibility);
      if (media?.removeEventListener) media.removeEventListener('change', onPreference);
      else media?.removeListener?.(onPreference);
      seenReveal.clear(); seenGold.clear();
    }
    return Object.freeze({ reveal, gold, settleAll, destroy, get activeCount() { return active.size; }, get retainedCount() { return seenReveal.size + seenGold.size; } });
  }
  return Object.freeze({ createController, REVEAL_MS, GOLD_MS });
});


;

/*!
Number Bluff component scene motion: third-party license notices.
number-flow@0.6.2
Source: https://github.com/barvian/number-flow

MIT License

Copyright (c) 2024 Maxwell Barvian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


========================================================================

canvas-confetti@1.9.4
Source: https://github.com/catdad/canvas-confetti

ISC License

Copyright (c) 2020, Kiril Vatev

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.


========================================================================

esm-env@1.2.2
Source: https://github.com/benmccann/esm-env

Copyright 2022 Benjamin McCann

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
(()=>{var H=!0;var gt=String.raw,Ce=String.raw,Le=H&&(()=>{try{document.createElement("div").animate({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0})(),Ie=H&&typeof CSS<"u"&&CSS.supports&&CSS.supports("line-height","mod(1,1)"),he=H&&typeof matchMedia<"u"?matchMedia("(prefers-reduced-motion: reduce)"):null,ne="--_number-flow-d-opacity",ue="--_number-flow-d-width",te="--_number-flow-dx",de="--_number-flow-d",Fe=(()=>{try{return CSS.registerProperty({name:ne,syntax:"<number>",inherits:!1,initialValue:"0"}),CSS.registerProperty({name:te,syntax:"<length>",inherits:!0,initialValue:"0px"}),CSS.registerProperty({name:ue,syntax:"<number>",inherits:!1,initialValue:"0"}),CSS.registerProperty({name:de,syntax:"<number>",inherits:!0,initialValue:"0"}),!0}catch{return!1}})(),ce="round(nearest, calc(var(--number-flow-mask-height, 0.25em) / 2), 1px)",X=`calc(${ce} * 2)`,Me="var(--number-flow-mask-width, 0.5em)",K=`calc(${Me} / var(--scale-x))`,le="#000 0, transparent 71%",fe=Ce`:host{display:inline-block;direction:ltr;white-space:nowrap;isolation:isolate;line-height:1}.number,.number__inner{display:inline-block;transform-origin:left top}:host([data-will-change]) :is(.number,.number__inner,.section,.digit,.digit__num,.symbol){will-change:transform}.number{--scale-x:calc(1 + var(${ue}) / var(--width));transform:translateX(var(${te})) scaleX(var(--scale-x));margin:0 calc(-1 * ${Me});position:relative;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 ${K},#000 calc(100% - ${K}),transparent ),linear-gradient(to bottom,transparent 0,#000 ${X},#000 calc(100% - ${X}),transparent 100% ),radial-gradient(at bottom right,${le}),radial-gradient(at bottom left,${le}),radial-gradient(at top left,${le}),radial-gradient(at top right,${le});-webkit-mask-size:100% calc(100% - ${X} * 2),calc(100% - ${K} * 2) 100%,${K} ${X},${K} ${X},${K} ${X},${K} ${X};-webkit-mask-position:center,center,top left,top right,bottom right,bottom left;-webkit-mask-repeat:no-repeat}.number__inner{padding:${ce} ${Me};transform:scaleX(calc(1 / var(--scale-x))) translateX(calc(-1 * var(${te})))}:host > :not(.number){z-index:5}.section,.symbol{display:inline-block;position:relative;isolation:isolate}.section::after{content:'\200b';display:inline-block}.section--justify-left{transform-origin:center left}.section--justify-right{transform-origin:center right}.section > [inert],.symbol > [inert]{margin:0 !important;position:absolute !important;z-index:-1}.digit{display:inline-block;position:relative;--c:var(--current) + var(${de})}.digit__num,.number .section::after{padding:${ce} 0}.digit__num{display:inline-block;--offset-raw:mod(var(--length) + var(--n) - mod(var(--c),var(--length)),var(--length));--offset:calc( var(--offset-raw) - var(--length) * round(down,var(--offset-raw) / (var(--length) / 2),1) );--y:clamp(-100%,var(--offset) * 100%,100%);transform:translateY(var(--y))}.digit__num[inert]{position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(var(--y))}.digit:not(.is-spinning) .digit__num[inert]{display:none}.symbol__value{display:inline-block;mix-blend-mode:plus-lighter;white-space:pre}.section--justify-left .symbol > [inert]{left:0}.section--justify-right .symbol > [inert]{right:0}.animate-presence{opacity:calc(1 + var(${ne}))}`,Ue=H&&typeof HTMLElement<"u"?HTMLElement:class{},je=Ce`:host{display:inline-block;direction:ltr;white-space:nowrap;line-height:1}span{display:inline-block}:host([data-will-change]) span{will-change:transform}.number,.digit{padding:${ce} 0}.symbol{white-space:pre}`;var Be=(o="")=>Ce`:where(number-flow${o}){line-height:1}number-flow${o} > span{font-kerning:none;display:inline-block;padding:${X} 0}`;var Z=(o,t,i)=>{let a=document.createElement(o),[r,p]=Array.isArray(t)?[void 0,t]:[t,i];return r&&Object.assign(a,r),p?.forEach(f=>a.appendChild(f)),a},at=(o,t)=>{var i;return t==="left"?o.offsetLeft:(((i=o.offsetParent instanceof HTMLElement?o.offsetParent:null)==null?void 0:i.offsetWidth)??0)-o.offsetWidth-o.offsetLeft},rt=o=>o.offsetWidth>0&&o.offsetHeight>0,Oe=(o,t)=>{H&&typeof HTMLElement<"u"&&typeof customElements<"u"&&!customElements.get(o)&&customElements.define(o,t)};function st(o,t,{reverse:i=!1}={}){let a=o.length;for(let r=i?a-1:0;i?r>=0:r<a;i?r--:r++)t(o[r],r)}function De(o,t,i,a){let r=t.formatToParts(o);i&&r.unshift({type:"prefix",value:i}),a&&r.push({type:"suffix",value:a});let p=[],f=[],g=[],k=[],M={},y=S=>`${S}:${M[S]=(M[S]??-1)+1}`,A="",I=!1,L=!1;for(let S of r){A+=S.value;let d=S.type==="minusSign"||S.type==="plusSign"?"sign":S.type;d==="integer"?(I=!0,f.push(...S.value.split("").map(V=>({type:d,value:parseInt(V)})))):d==="group"?f.push({type:d,value:S.value}):d==="decimal"?(L=!0,g.push({type:d,value:S.value,key:y(d)})):d==="fraction"?g.push(...S.value.split("").map(V=>({type:d,value:parseInt(V),key:y(d),pos:-1-M[d]}))):(I||L?k:p).push({type:d,value:S.value,key:y(d)})}let z=[];for(let S=f.length-1;S>=0;S--){let d=f[S];z.unshift(d.type==="integer"?{...d,key:y(d.type),pos:M[d.type]}:{...d,key:y(d.type)})}return{pre:p,integer:z,fraction:g,post:k,valueAsString:A,value:typeof o=="string"?parseFloat(o):o}}var Q=Ie&&Le&&Fe,ie=class extends Ue{constructor(){super(),this.created=!1,this.batched=!1,this._preUpdated=!1;let{animated:t,...i}=this.constructor.defaultProps;this._animated=this.computedAnimated=t,Object.assign(this,i)}get animated(){return this._animated}set animated(t){var i;this.animated!==t&&(this._animated=t,(i=this.shadowRoot)==null||i.getAnimations().forEach(a=>a.finish()))}set data(t){var i,a;if(t==null||t===this._data)return;let{pre:r,integer:p,fraction:f,post:g,value:k}=t;if(this.created){let M=this._data;this._data=t,this.computedTrend=typeof this.trend=="function"?this.trend(M.value,k):this.trend,this.computedAnimated=Q&&this._animated&&(!this.respectMotionPreference||!((i=he)!=null&&i.matches))&&rt(this)&&this.ownerDocument.visibilityState==="visible",(a=this.plugins)==null||a.forEach(y=>{var A;return(A=y.onUpdate)==null?void 0:A.call(y,t,M,this)}),this.batched||this.willUpdate(),this._pre.update(r),this._num.update({integer:p,fraction:f}),this._post.update(g),this.batched||this.didUpdate()}else{this._data=t,this.attachShadow({mode:"open"});try{this._internals??(this._internals=this.attachInternals()),this._internals.role="img"}catch{}let M=document.createElement("style");this.nonce&&(M.nonce=this.nonce),M.textContent=fe,this.shadowRoot.appendChild(M),this._pre=new ve(this,r,{justify:"right",part:"left"}),this.shadowRoot.appendChild(this._pre.el),this._num=new xe(this,p,f),this.shadowRoot.appendChild(this._num.el),this._post=new ve(this,g,{justify:"left",part:"right"}),this.shadowRoot.appendChild(this._post.el),this.created=!0}try{this._internals.ariaLabel=t.valueAsString}catch{}}willUpdate(){var t;this._preUpdated=Q&&this._animated&&(!this.respectMotionPreference||!((t=he)!=null&&t.matches))&&this.ownerDocument.visibilityState==="visible",this._preUpdated&&(this._pre.willUpdate(),this._num.willUpdate(),this._post.willUpdate())}didUpdate(){if(!this.computedAnimated||!this._preUpdated)return;this._abortAnimationsFinish?this._abortAnimationsFinish.abort():this.dispatchEvent(new Event("animationsstart")),this._pre.didUpdate(),this._num.didUpdate(),this._post.didUpdate();let t=new AbortController;Promise.all(this.shadowRoot.getAnimations().map(i=>i.finished)).then(()=>{t.signal.aborted||(this.dispatchEvent(new Event("animationsfinish")),this._abortAnimationsFinish=void 0)}),this._abortAnimationsFinish=t}};ie.defaultProps={transformTiming:{duration:900,easing:"linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)"},spinTiming:void 0,opacityTiming:{duration:450,easing:"ease-out"},animated:!0,trend:(o,t)=>Math.sign(t-o),respectMotionPreference:!0,plugins:void 0,digits:void 0};var xe=class{constructor(t,i,a,{className:r,...p}={}){this.flow=t,this._integer=new me(t,i,{justify:"right",part:"integer"}),this._fraction=new me(t,a,{justify:"left",part:"fraction"}),this._inner=Z("span",{className:"number__inner"},[this._integer.el,this._fraction.el]),this.el=Z("span",{...p,part:"number",className:`number ${r??""}`},[this._inner])}willUpdate(){this._prevWidth=this.el.offsetWidth,this._prevLeft=this.el.getBoundingClientRect().left,this._integer.willUpdate(),this._fraction.willUpdate()}update({integer:t,fraction:i}){this._integer.update(t),this._fraction.update(i)}didUpdate(){let t=this.el.getBoundingClientRect();this._integer.didUpdate(),this._fraction.didUpdate();let i=this._prevLeft-t.left,a=this.el.offsetWidth,r=this._prevWidth-a;this.el.style.setProperty("--width",String(a)),this.el.animate({[te]:[`${i}px`,"0px"],[ue]:[r,0]},{...this.flow.transformTiming,composite:"accumulate"})}},pe=class{constructor(t,i,{justify:a,className:r,...p},f){this.flow=t,this.children=new Map,this.onCharRemove=k=>()=>{this.children.delete(k)},this.justify=a;let g=i.map(k=>this.addChar(k).el);this.el=Z("span",{...p,className:`section section--justify-${a} ${r??""}`},f?f(g):g)}addChar(t,{startDigitsAtZero:i=!1,...a}={}){let r=t.type==="integer"||t.type==="fraction"?new re(this,t.type,i?0:t.value,t.pos,{...a,onRemove:this.onCharRemove(t.key)}):new Ee(this,t.type,t.value,{...a,onRemove:this.onCharRemove(t.key)});return this.children.set(t.key,r),r}unpop(t){t.el.removeAttribute("inert"),t.el.style.top="",t.el.style[this.justify]=""}pop(t){t.forEach(i=>{i.el.style.top=`${i.el.offsetTop}px`,i.el.style[this.justify]=`${at(i.el,this.justify)}px`}),t.forEach(i=>{i.el.setAttribute("inert",""),i.present=!1})}addNewAndUpdateExisting(t){let i=new Map,a=new Map,r=this.justify==="left",p=r?"prepend":"append";if(st(t,f=>{let g;this.children.has(f.key)?(g=this.children.get(f.key),a.set(f,g),this.unpop(g),g.present=!0):(g=this.addChar(f,{startDigitsAtZero:!0,animateIn:!0}),i.set(f,g)),this.el[p](g.el)},{reverse:r}),this.flow.computedAnimated){let f=this.el.getBoundingClientRect();i.forEach(g=>{g.willUpdate(f)})}i.forEach((f,g)=>{f.update(g.value)}),a.forEach((f,g)=>{f.update(g.value)})}willUpdate(){let t=this.el.getBoundingClientRect();this._prevOffset=t[this.justify],this.children.forEach(i=>i.willUpdate(t))}didUpdate(){let t=this.el.getBoundingClientRect();this.children.forEach(r=>r.didUpdate(t));let i=t[this.justify],a=this._prevOffset-i;a&&this.children.size&&this.el.animate({transform:[`translateX(${a}px)`,"none"]},{...this.flow.transformTiming,composite:"accumulate"})}},me=class extends pe{update(t){let i=new Map;this.children.forEach((a,r)=>{t.find(p=>p.key===r)||i.set(r,a),this.unpop(a)}),this.addNewAndUpdateExisting(t),i.forEach(a=>{a instanceof re&&a.update(0)}),this.pop(i)}},ve=class extends pe{update(t){let i=new Map;this.children.forEach((a,r)=>{t.find(p=>p.key===r)||i.set(r,a)}),this.pop(i),this.addNewAndUpdateExisting(t)}},ae=class{constructor(t,i,{onRemove:a,animateIn:r=!1}={}){this.flow=t,this.el=i,this._present=!0,this._remove=()=>{var p;this.el.remove(),(p=this._onRemove)==null||p.call(this)},this.el.classList.add("animate-presence"),this.flow.computedAnimated&&r&&this.el.animate({[ne]:[-.9999,0]},{...this.flow.opacityTiming,composite:"accumulate"}),this._onRemove=a}get present(){return this._present}set present(t){if(this._present!==t){if(this._present=t,t?this.el.removeAttribute("inert"):this.el.setAttribute("inert",""),!this.flow.computedAnimated){t||this._remove();return}this.el.style.setProperty("--_number-flow-d-opacity",t?"0":"-.999"),this.el.animate({[ne]:t?[-.9999,0]:[.999,0]},{...this.flow.opacityTiming,composite:"accumulate"}),t?this.flow.removeEventListener("animationsfinish",this._remove):this.flow.addEventListener("animationsfinish",this._remove,{once:!0})}}},ge=class extends ae{constructor(t,i,a,r){super(t.flow,a,r),this.section=t,this.value=i,this.el=a}},re=class extends ge{constructor(t,i,a,r,p){var f,g;let k=(((g=(f=t.flow.digits)==null?void 0:f[r])==null?void 0:g.max)??9)+1,M=Array.from({length:k}).map((A,I)=>{let L=Z("span",{className:"digit__num"},[document.createTextNode(String(I))]);return I!==a&&L.setAttribute("inert",""),L.style.setProperty("--n",String(I)),L}),y=Z("span",{part:`digit ${i}-digit`,className:"digit"},M);y.style.setProperty("--current",String(a)),y.style.setProperty("--length",String(k)),super(t,a,y,p),this.pos=r,this._onAnimationsFinish=()=>{this.el.classList.remove("is-spinning")},this._numbers=M,this.length=k}willUpdate(t){let i=this.el.getBoundingClientRect();this._prevValue=this.value;let a=i[this.section.justify]-t[this.section.justify],r=i.width/2;this._prevCenter=this.section.justify==="left"?a+r:a-r}update(t){this.el.style.setProperty("--current",String(t)),this._numbers.forEach((i,a)=>a===t?i.removeAttribute("inert"):i.setAttribute("inert","")),this.value=t}didUpdate(t){let i=this.el.getBoundingClientRect(),a=i[this.section.justify]-t[this.section.justify],r=i.width/2,p=this.section.justify==="left"?a+r:a-r,f=this._prevCenter-p;f&&this.el.animate({transform:[`translateX(${f}px)`,"none"]},{...this.flow.transformTiming,composite:"accumulate"});let g=this.getDelta();g&&(this.el.classList.add("is-spinning"),this.el.animate({[de]:[-g,0]},{...this.flow.spinTiming??this.flow.transformTiming,composite:"accumulate"}),this.flow.addEventListener("animationsfinish",this._onAnimationsFinish,{once:!0}))}getDelta(){var t;if(this.flow.plugins)for(let r of this.flow.plugins){let p=(t=r.getDelta)==null?void 0:t.call(r,this.value,this._prevValue,this);if(p!=null)return p}let i=this.value-this._prevValue,a=this.flow.computedTrend||Math.sign(i);return a<0&&this.value>this._prevValue?this.value-this.length-this._prevValue:a>0&&this.value<this._prevValue?this.length-this._prevValue+this.value:i}},Ee=class extends ge{constructor(t,i,a,r){let p=Z("span",{className:"symbol__value",textContent:a});super(t,a,Z("span",{part:`symbol ${i}`,className:"symbol"},[p]),r),this.type=i,this._children=new Map,this._onChildRemove=f=>()=>{this._children.delete(f)},this._children.set(a,new ae(this.flow,p,{onRemove:this._onChildRemove(a)}))}willUpdate(t){if(this.type==="decimal")return;let i=this.el.getBoundingClientRect();this._prevOffset=i[this.section.justify]-t[this.section.justify]}update(t){if(this.value!==t){let i=this._children.get(this.value);i&&(i.present=!1);let a=this._children.get(t);if(a)a.present=!0;else{let r=Z("span",{className:"symbol__value",textContent:t});this.el.appendChild(r),this._children.set(t,new ae(this.flow,r,{animateIn:!0,onRemove:this._onChildRemove(t)}))}}this.value=t}didUpdate(t){if(this.type==="decimal")return;let i=this.el.getBoundingClientRect()[this.section.justify]-t[this.section.justify],a=this._prevOffset-i;a&&this.el.animate({transform:[`translateX(${a}px)`,"none"]},{...this.flow.transformTiming,composite:"accumulate"})}};var We=o=>[je,Be(o),fe];var Lt=We(),ot="number-flow-connect",lt="number-flow-update";var Se=class extends ie{constructor(){super(...arguments),this.connected=!1}connectedCallback(){this.connected=!0,this.dispatchEvent(new Event(ot,{bubbles:!0}))}disconnectedCallback(){this.connected=!1}get value(){return this._value}update(t){(!this._formatter||this._prevFormat!==this.format||this._prevLocales!==this.locales)&&(this._formatter=new Intl.NumberFormat(this.locales,this.format),this._prevFormat=this.format,this._prevLocales=this.locales),t!=null&&(this._value=t),this.dispatchEvent(new Event(lt,{bubbles:!0})),this.data=De(this._value,this._formatter,this.numberPrefix,this.numberSuffix)}};Oe("number-flow",Se);var Te={};(function o(t,i,a,r){var p=!!(t.Worker&&t.Blob&&t.Promise&&t.OffscreenCanvas&&t.OffscreenCanvasRenderingContext2D&&t.HTMLCanvasElement&&t.HTMLCanvasElement.prototype.transferControlToOffscreen&&t.URL&&t.URL.createObjectURL),f=typeof Path2D=="function"&&typeof DOMMatrix=="function",g=(function(){if(!t.OffscreenCanvas)return!1;try{var n=new OffscreenCanvas(1,1),e=n.getContext("2d");e.fillRect(0,0,1,1);var s=n.transferToImageBitmap();e.createPattern(s,"no-repeat")}catch{return!1}return!0})();function k(){}function M(n){var e=i.exports.Promise,s=e!==void 0?e:t.Promise;return typeof s=="function"?new s(n):(n(k,k),null)}var y=(function(n,e){return{transform:function(s){if(n)return s;if(e.has(s))return e.get(s);var u=new OffscreenCanvas(s.width,s.height),m=u.getContext("2d");return m.drawImage(s,0,0),e.set(s,u),u},clear:function(){e.clear()}}})(g,new Map),A=(function(){var n=Math.floor(16.666666666666668),e,s,u={},m=0;return typeof requestAnimationFrame=="function"&&typeof cancelAnimationFrame=="function"?(e=function(v){var b=Math.random();return u[b]=requestAnimationFrame(function c(w){m===w||m+n-1<w?(m=w,delete u[b],v()):u[b]=requestAnimationFrame(c)}),b},s=function(v){u[v]&&cancelAnimationFrame(u[v])}):(e=function(v){return setTimeout(v,n)},s=function(v){return clearTimeout(v)}),{frame:e,cancel:s}})(),I=(function(){var n,e,s={};function u(m){function v(b,c){m.postMessage({options:b||{},callback:c})}m.init=function(c){var w=c.transferControlToOffscreen();m.postMessage({canvas:w},[w])},m.fire=function(c,w,x){if(e)return v(c,null),e;var T=Math.random().toString(36).slice(2);return e=M(function(E){function $(R){R.data.callback===T&&(delete s[T],m.removeEventListener("message",$),e=null,y.clear(),x(),E())}m.addEventListener("message",$),v(c,T),s[T]=$.bind(null,{data:{callback:T}})}),e},m.reset=function(){m.postMessage({reset:!0});for(var c in s)s[c](),delete s[c]}}return function(){if(n)return n;if(!a&&p){var m=["var CONFETTI, SIZE = {}, module = {};","("+o.toString()+")(this, module, true, SIZE);","onmessage = function(msg) {","  if (msg.data.options) {","    CONFETTI(msg.data.options).then(function () {","      if (msg.data.callback) {","        postMessage({ callback: msg.data.callback });","      }","    });","  } else if (msg.data.reset) {","    CONFETTI && CONFETTI.reset();","  } else if (msg.data.resize) {","    SIZE.width = msg.data.resize.width;","    SIZE.height = msg.data.resize.height;","  } else if (msg.data.canvas) {","    SIZE.width = msg.data.canvas.width;","    SIZE.height = msg.data.canvas.height;","    CONFETTI = module.exports.create(msg.data.canvas);","  }","}"].join(`
`);try{n=new Worker(URL.createObjectURL(new Blob([m])))}catch(v){return typeof console<"u"&&typeof console.warn=="function"&&console.warn("\u{1F38A} Could not load worker",v),null}u(n)}return n}})(),L={particleCount:50,angle:90,spread:45,startVelocity:45,decay:.9,gravity:1,drift:0,ticks:200,x:.5,y:.5,shapes:["square","circle"],zIndex:100,colors:["#26ccff","#a25afd","#ff5e7e","#88ff5a","#fcff42","#ffa62d","#ff36ff"],disableForReducedMotion:!1,scalar:1};function z(n,e){return e?e(n):n}function S(n){return n!=null}function d(n,e,s){return z(n&&S(n[e])?n[e]:L[e],s)}function V(n){return n<0?0:Math.floor(n)}function se(n,e){return Math.floor(Math.random()*(e-n))+n}function B(n){return parseInt(n,16)}function oe(n){return n.map(Y)}function Y(n){var e=String(n).replace(/[^0-9a-f]/gi,"");return e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),{r:B(e.substring(0,2)),g:B(e.substring(2,4)),b:B(e.substring(4,6))}}function ye(n){var e=d(n,"origin",Object);return e.x=d(e,"x",Number),e.y=d(e,"y",Number),e}function be(n){n.width=document.documentElement.clientWidth,n.height=document.documentElement.clientHeight}function G(n){var e=n.getBoundingClientRect();n.width=e.width,n.height=e.height}function h(n){var e=document.createElement("canvas");return e.style.position="fixed",e.style.top="0px",e.style.left="0px",e.style.pointerEvents="none",e.style.zIndex=n,e}function C(n,e,s,u,m,v,b,c,w){n.save(),n.translate(e,s),n.rotate(v),n.scale(u,m),n.arc(0,0,1,b,c,w),n.restore()}function P(n){var e=n.angle*(Math.PI/180),s=n.spread*(Math.PI/180);return{x:n.x,y:n.y,wobble:Math.random()*10,wobbleSpeed:Math.min(.11,Math.random()*.1+.05),velocity:n.startVelocity*.5+Math.random()*n.startVelocity,angle2D:-e+(.5*s-Math.random()*s),tiltAngle:(Math.random()*(.75-.25)+.25)*Math.PI,color:n.color,shape:n.shape,tick:0,totalTicks:n.ticks,decay:n.decay,drift:n.drift,random:Math.random()+2,tiltSin:0,tiltCos:0,wobbleX:0,wobbleY:0,gravity:n.gravity*3,ovalScalar:.6,scalar:n.scalar,flat:n.flat}}function l(n,e){e.x+=Math.cos(e.angle2D)*e.velocity+e.drift,e.y+=Math.sin(e.angle2D)*e.velocity+e.gravity,e.velocity*=e.decay,e.flat?(e.wobble=0,e.wobbleX=e.x+10*e.scalar,e.wobbleY=e.y+10*e.scalar,e.tiltSin=0,e.tiltCos=0,e.random=1):(e.wobble+=e.wobbleSpeed,e.wobbleX=e.x+10*e.scalar*Math.cos(e.wobble),e.wobbleY=e.y+10*e.scalar*Math.sin(e.wobble),e.tiltAngle+=.1,e.tiltSin=Math.sin(e.tiltAngle),e.tiltCos=Math.cos(e.tiltAngle),e.random=Math.random()+2);var s=e.tick++/e.totalTicks,u=e.x+e.random*e.tiltCos,m=e.y+e.random*e.tiltSin,v=e.wobbleX+e.random*e.tiltCos,b=e.wobbleY+e.random*e.tiltSin;if(n.fillStyle="rgba("+e.color.r+", "+e.color.g+", "+e.color.b+", "+(1-s)+")",n.beginPath(),f&&e.shape.type==="path"&&typeof e.shape.path=="string"&&Array.isArray(e.shape.matrix))n.fill(Ve(e.shape.path,e.shape.matrix,e.x,e.y,Math.abs(v-u)*.1,Math.abs(b-m)*.1,Math.PI/10*e.wobble));else if(e.shape.type==="bitmap"){var c=Math.PI/10*e.wobble,w=Math.abs(v-u)*.1,x=Math.abs(b-m)*.1,T=e.shape.bitmap.width*e.scalar,E=e.shape.bitmap.height*e.scalar,$=new DOMMatrix([Math.cos(c)*w,Math.sin(c)*w,-Math.sin(c)*x,Math.cos(c)*x,e.x,e.y]);$.multiplySelf(new DOMMatrix(e.shape.matrix));var R=n.createPattern(y.transform(e.shape.bitmap),"no-repeat");R.setTransform($),n.globalAlpha=1-s,n.fillStyle=R,n.fillRect(e.x-T/2,e.y-E/2,T,E),n.globalAlpha=1}else if(e.shape==="circle")n.ellipse?n.ellipse(e.x,e.y,Math.abs(v-u)*e.ovalScalar,Math.abs(b-m)*e.ovalScalar,Math.PI/10*e.wobble,0,2*Math.PI):C(n,e.x,e.y,Math.abs(v-u)*e.ovalScalar,Math.abs(b-m)*e.ovalScalar,Math.PI/10*e.wobble,0,2*Math.PI);else if(e.shape==="star")for(var _=Math.PI/2*3,N=4*e.scalar,U=8*e.scalar,j=e.x,W=e.y,q=5,O=Math.PI/q;q--;)j=e.x+Math.cos(_)*U,W=e.y+Math.sin(_)*U,n.lineTo(j,W),_+=O,j=e.x+Math.cos(_)*N,W=e.y+Math.sin(_)*N,n.lineTo(j,W),_+=O;else n.moveTo(Math.floor(e.x),Math.floor(e.y)),n.lineTo(Math.floor(e.wobbleX),Math.floor(m)),n.lineTo(Math.floor(v),Math.floor(b)),n.lineTo(Math.floor(u),Math.floor(e.wobbleY));return n.closePath(),n.fill(),e.tick<e.totalTicks}function F(n,e,s,u,m){var v=e.slice(),b=n.getContext("2d"),c,w,x=M(function(T){function E(){c=w=null,b.clearRect(0,0,u.width,u.height),y.clear(),m(),T()}function $(){a&&!(u.width===r.width&&u.height===r.height)&&(u.width=n.width=r.width,u.height=n.height=r.height),!u.width&&!u.height&&(s(n),u.width=n.width,u.height=n.height),b.clearRect(0,0,u.width,u.height),v=v.filter(function(R){return l(b,R)}),v.length?c=A.frame($):E()}c=A.frame($),w=E});return{addFettis:function(T){return v=v.concat(T),x},canvas:n,promise:x,reset:function(){c&&A.cancel(c),w&&w()}}}function $e(n,e){var s=!n,u=!!d(e||{},"resize"),m=!1,v=d(e,"disableForReducedMotion",Boolean),b=p&&!!d(e||{},"useWorker"),c=b?I():null,w=s?be:G,x=n&&c?!!n.__confetti_initialized:!1,T=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion)").matches,E;function $(_,N,U){for(var j=d(_,"particleCount",V),W=d(_,"angle",Number),q=d(_,"spread",Number),O=d(_,"startVelocity",Number),Ze=d(_,"decay",Number),qe=d(_,"gravity",Number),Ke=d(_,"drift",Number),Re=d(_,"colors",oe),Je=d(_,"ticks",Number),Ae=d(_,"shapes"),Ye=d(_,"scalar"),Ge=!!d(_,"flat"),Pe=ye(_),Ne=j,_e=[],Qe=n.width*Pe.x,et=n.height*Pe.y;Ne--;)_e.push(P({x:Qe,y:et,angle:W,spread:q,startVelocity:O,color:Re[Ne%Re.length],shape:Ae[se(0,Ae.length)],ticks:Je,decay:Ze,gravity:qe,drift:Ke,scalar:Ye,flat:Ge}));return E?E.addFettis(_e):(E=F(n,_e,w,N,U),E.promise)}function R(_){var N=v||d(_,"disableForReducedMotion",Boolean),U=d(_,"zIndex",Number);if(N&&T)return M(function(O){O()});s&&E?n=E.canvas:s&&!n&&(n=h(U),document.body.appendChild(n)),u&&!x&&w(n);var j={width:n.width,height:n.height};c&&!x&&c.init(n),x=!0,c&&(n.__confetti_initialized=!0);function W(){if(c){var O={getBoundingClientRect:function(){if(!s)return n.getBoundingClientRect()}};w(O),c.postMessage({resize:{width:O.width,height:O.height}});return}j.width=j.height=null}function q(){E=null,u&&(m=!1,t.removeEventListener("resize",W)),s&&n&&(document.body.contains(n)&&document.body.removeChild(n),n=null,x=!1)}return u&&!m&&(m=!0,t.addEventListener("resize",W,!1)),c?c.fire(_,j,q):$(_,j,q)}return R.reset=function(){c&&c.reset(),E&&E.reset()},R}var we;function ke(){return we||(we=$e(null,{useWorker:!0,resize:!0})),we}function Ve(n,e,s,u,m,v,b){var c=new Path2D(n),w=new Path2D;w.addPath(c,new DOMMatrix(e));var x=new Path2D;return x.addPath(w,new DOMMatrix([Math.cos(b)*m,Math.sin(b)*m,-Math.sin(b)*v,Math.cos(b)*v,s,u])),x}function He(n){if(!f)throw new Error("path confetti are not supported in this browser");var e,s;typeof n=="string"?e=n:(e=n.path,s=n.matrix);var u=new Path2D(e),m=document.createElement("canvas"),v=m.getContext("2d");if(!s){for(var b=1e3,c=b,w=b,x=0,T=0,E,$,R=0;R<b;R+=2)for(var _=0;_<b;_+=2)v.isPointInPath(u,R,_,"nonzero")&&(c=Math.min(c,R),w=Math.min(w,_),x=Math.max(x,R),T=Math.max(T,_));E=x-c,$=T-w;var N=10,U=Math.min(N/E,N/$);s=[U,0,0,U,-Math.round(E/2+c)*U,-Math.round($/2+w)*U]}return{type:"path",path:e,matrix:s}}function Xe(n){var e,s=1,u="#000000",m='"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';typeof n=="string"?e=n:(e=n.text,s="scalar"in n?n.scalar:s,m="fontFamily"in n?n.fontFamily:m,u="color"in n?n.color:u);var v=10*s,b=""+v+"px "+m,c=new OffscreenCanvas(v,v),w=c.getContext("2d");w.font=b;var x=w.measureText(e),T=Math.ceil(x.actualBoundingBoxRight+x.actualBoundingBoxLeft),E=Math.ceil(x.actualBoundingBoxAscent+x.actualBoundingBoxDescent),$=2,R=x.actualBoundingBoxLeft+$,_=x.actualBoundingBoxAscent+$;T+=$+$,E+=$+$,c=new OffscreenCanvas(T,E),w=c.getContext("2d"),w.font=b,w.fillStyle=u,w.fillText(e,R,_);var N=1/s;return{type:"bitmap",bitmap:c.transferToImageBitmap(),matrix:[N,0,0,N,-T*N/2,-E*N/2]}}i.exports=function(){return ke().apply(this,arguments)},i.exports.reset=function(){ke().reset()},i.exports.create=$e,i.exports.shapeFromPath=He,i.exports.shapeFromText=Xe})((function(){return typeof window<"u"?window:typeof self<"u"?self:this||{}})(),Te,!1);var ze=Te.exports,Ft=Te.exports.create;var ee=window,D=document;ee.NumberBluffSceneMotion&&ee.NumberBluffSceneMotion.destroy();var J=null;function ct(){if(J&&!J.state.destroyed)return J;let o=ee.matchMedia("(prefers-reduced-motion: reduce)"),t=new Map,i=new Set,a=null;function r(h){let C=/^(\d+):(\d+):(\d+)(?::|$)/.exec(h);if(!C)return!0;let P=C.slice(1).map(Number);if(!P.every(Number.isSafeInteger))return!0;if(a){for(let l=0;l<3;l++){if(P[l]<a[l])return!1;if(P[l]>a[l])return i.clear(),a=P,!0}return!0}return a=P,!0}let p=null,f=!1,g=!1,k=!0,M=!1,y=null,A=null,I=0,L=!1,z=0,S=()=>!M&&k&&f&&!g&&!o.matches&&!D.hidden,d=h=>typeof h=="string"&&h.length>0;function V(){z+=1,A&&A.reset(),L=!1,y&&(y.style.visibility="hidden")}function se(){for(let h of t.values())h.flow&&(h.flow.animated=!1)}function B(){g=!0,V(),se()}function oe(){D.hidden&&B()}function Y(){o.matches&&B()}function ye(){for(let[h,C]of t)h.isConnected||(C.flow&&(C.flow.animated=!1),t.delete(h))}function be(h,C){let P=D.createElement("span");P.className="nb-scene-number__fallback",P.textContent=C;let l=Q?D.createElement("number-flow"):null;l&&(l.setAttribute("aria-hidden","true"),l.className="nb-scene-number__visual",l.respectMotionPreference=!0,l.trend=0,l.transformTiming={duration:180,easing:"cubic-bezier(.22,1,.36,1)"},l.spinTiming={duration:180,easing:"cubic-bezier(.22,1,.36,1)"},l.opacityTiming={duration:100,easing:"ease-out"},l.plugins=[]),h.classList.add("nb-scene-number"),h.replaceChildren(P),l&&h.append(l);let F={fallback:P,flow:l,value:null,text:C};return t.set(h,F),F}let G={begin(h){return M||!d(h)||!r(h)?!1:(p!==h&&(V(),se(),p=h,g=!1),f=!0,!0)},setNumber(h,C,{instant:P=!1}={}){if(M||!h||h.ownerDocument!==D||!h.isConnected||C!==null&&!Number.isSafeInteger(C))return!1;ye();let l=t.get(h);(!l||l.fallback.parentNode!==h||l.flow&&l.flow.parentNode!==h)&&(l?.flow&&(l.flow.animated=!1),l=be(h,C===null?"\u2026":String(C)));let F=C===null?"\u2026":String(C);if(l.fallback.textContent=F,l.text=F,!l.flow||C===null)return l.flow&&(l.flow.animated=!1,l.flow.style.display="none"),h.dataset.numberMotion="fallback",l.value=C,!0;try{l.flow.style.display="",l.flow.animated=!P&&S()&&l.value!==null,l.value!==C&&l.flow.update(C),h.dataset.numberMotion="ready",l.value=C}catch{l.flow.animated=!1,l.flow.remove(),l.flow=null,h.dataset.numberMotion="fallback",l.value=C}return!0},celebrate({key:h,confirmed:C=!1,won:P=!1}={}){if(M||C!==!0||P!==!0||!d(h)||p!==h||i.has(h)||(i.add(h),i.size>128&&i.delete(i.values().next().value),!S()))return!1;if(!y){if(y=D.createElement("canvas"),y.className="nb-scene-confetti",y.setAttribute("aria-hidden","true"),y.setAttribute("role","presentation"),y.style.pointerEvents="none",D.body.append(y),!y.getContext("2d"))return y.remove(),y=null,!1;A=ze.create(y,{resize:!0,useWorker:!1,disableForReducedMotion:!0})}let l=++z;y.style.visibility="visible",L=!0,I+=1;let F=A({particleCount:34,spread:64,angle:90,startVelocity:23,gravity:.83,decay:.925,ticks:110,scalar:.72,origin:{x:.5,y:.64},colors:["#E9C46A","#FFF8E8","#BBA6ED"],shapes:["star","circle"],disableForReducedMotion:!0});return F&&typeof F.then=="function"&&F.then(()=>{M||z!==l||(L=!1,y.style.visibility="hidden")}),!0},skip(){M||B()},leave(){M||(B(),f=!1)},reset(){if(!M){B(),f=!1,p=null;for(let[h,C]of t)C.fallback.parentNode===h&&(h.textContent=C.text),h.classList.remove("nb-scene-number"),delete h.dataset.numberMotion;t.clear()}},setEnabled(h){k=!!h,k||B()},destroy(){M||(G.reset(),M=!0,D.removeEventListener("visibilitychange",oe),ee.removeEventListener("pagehide",G.leave),o.removeEventListener?o.removeEventListener("change",Y):o.removeListener(Y),y&&y.remove(),y=null,A=null,i.clear())},get state(){return Object.freeze({key:p,active:f,suppressed:g,enabled:k,destroyed:M,reducedMotion:o.matches,hidden:D.hidden,canAnimate:Q,numberCount:t.size,canvasCount:y?1:0,running:L,burstCount:I,seenWinCount:i.size})}};return D.addEventListener("visibilitychange",oe),ee.addEventListener("pagehide",G.leave),o.addEventListener?o.addEventListener("change",Y):o.addListener(Y),J=Object.freeze(G),J}ee.NumberBluffSceneMotion=Object.freeze({create:ct,destroy(){J&&J.destroy()},version:"1.0.0"});})();


;

/* Source-art optical lighting. Original artwork bytes remain immutable.
 * The overlay samples the identical original image in the shared source box.
 * Only a feathered luminance selection moves; no visible vector strokes.
 */
(function(global){'use strict';
const ns='http://www.w3.org/2000/svg';let serial=0;
const ART={double:{width:1051,height:1496},extra:{width:1049,height:1500},max0:{width:1049,height:1499},reset:{width:1062,height:1482}};
function containRect(width,height,sourceWidth,sourceHeight){const scale=Math.min(width/sourceWidth,height/sourceHeight);return{x:(width-sourceWidth*scale)/2,y:(height-sourceHeight*scale)/2,width:sourceWidth*scale,height:sourceHeight*scale,scale};}
function markup(kind,id){
const a=ART[kind];
// Bound offscreen mask/filter surfaces to the painted motif, not the full card.
// These bounds include feather/blur padding and never alter source coordinates.
const bounds={double:[90,670,890,580],extra:[205,660,660,670],reset:[235,725,610,560],max0:[290,570,560,820]}[kind];
const [bx,by,bw,bh]=bounds,box=`x="${bx}" y="${by}" width="${bw}" height="${bh}"`;
// Visible pixels always come from the immutable original. These feathered
// selections create moving reflection/contrast, not drawn ornamental geometry.
const region={double:'<ellipse cx="535" cy="963" rx="435" ry="165" transform="rotate(-28 535 963)"/>',extra:'<ellipse cx="535" cy="994" rx="298" ry="300"/>',reset:'<path d="M343 965 C304 1097 418 1216 553 1200 C716 1180 779 1007 683 880 C628 807 548 795 469 812" fill="none" stroke="white" stroke-width="108" stroke-linecap="round"/>',max0:'<path d="M509 723 L516 654 L550 679 L609 628 L647 695 L688 683 L672 746 Q590 716 509 723Z"/><circle cx="518" cy="643" r="16"/><circle cx="614" cy="613" r="20"/><circle cx="697" cy="675" r="16"/><ellipse cx="407" cy="946" rx="54" ry="59" transform="rotate(18 407 946)"/><ellipse cx="648" cy="984" rx="53" ry="60" transform="rotate(-15 648 984)"/>'}[kind];
// Color-preserving luster only on the original pink cheeks, inner ears and paw pads.
// Background stars/clouds and the cat's fur are deliberately not selected.
const pinkRegion=kind==='max0'?'<path d="M355 755 Q366 714 391 708 Q421 701 441 730 Q397 724 355 755Z"/><path d="M751 754 Q788 744 814 773 Q831 797 833 827 L813 839 Q799 796 751 754Z"/><ellipse cx="333" cy="989" rx="38" ry="27" transform="rotate(16 333 989)"/><ellipse cx="692" cy="1066" rx="40" ry="27" transform="rotate(-16 692 1066)"/><ellipse cx="416" cy="1310" rx="40" ry="36"/><ellipse cx="367" cy="1276" rx="12" ry="16" transform="rotate(18 367 1276)"/><ellipse cx="406" cy="1255" rx="13" ry="17"/><ellipse cx="442" cy="1287" rx="12" ry="15"/><ellipse cx="594" cy="1319" rx="41" ry="37"/><ellipse cx="553" cy="1267" rx="12" ry="16" transform="rotate(-18 553 1267)"/><ellipse cx="586" cy="1251" rx="12" ry="17"/><ellipse cx="622" cy="1268" rx="12" ry="16"/>':'';
const photo=cls=>`<image class="${cls}" x="0" y="0" width="${a.width}" height="${a.height}" preserveAspectRatio="none"/>`;
const patches=(radius,rx,ry)=>[0,125,250].map(angle=>`<g transform="rotate(${angle})"><ellipse cx="${radius}" cy="0" rx="${rx}" ry="${ry}" fill="url(#${id}-spot)"/></g>`).join('');
function field(mode){
 if(kind==='double'||kind==='reset'){
  const geometry=kind==='double'?'translate(535 963) rotate(-28) scale(1 .38)':'translate(535 1005)';
  const radius=kind==='double'?285:205;
  return `<g transform="${geometry}"><g class="art-mask-orbit ${mode}">${patches(radius,mode==='specular-flow'?65:115,mode==='specular-flow'?150:230)}</g></g>`;
 }
 if(kind==='max0'&&mode==='specular-flow')return [[518,643],[614,613],[697,675],[407,946],[648,984]].map(([x,y],i)=>`<ellipse class="art-jewel-light ${i>2?'art-eye-light':''} jewel-${i}" cx="${x}" cy="${y}" rx="${i>2?24:30}" ry="${i>2?62:30}" fill="url(#${id}-spot)"/>`).join('');
 return `<g transform="${kind==='extra'?'rotate(-20 535 994)':''}"><rect class="art-light-sweep ${mode}" x="${kind==='max0'?400:-500}" y="0" width="${kind==='max0'?170:mode==='specular-flow'?160:300}" height="${kind==='max0'?800:a.height}" fill="url(#${id}-sweep)"/></g>`;
}
const selection=(name,mode,lum='painted-light')=>`<mask id="${id}-${name}" maskUnits="userSpaceOnUse" ${box} style="mask-type:luminance"><g mask="url(#${id}-${lum})">${field(mode)}</g></mask>`;
return `<defs>
${kind==='max0'?`<filter id="${id}-pink-luster" filterUnits="userSpaceOnUse" ${box} color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="1.3" exponent=".8" offset=".025"/><feFuncG type="gamma" amplitude="1.12" exponent=".85" offset=".015"/><feFuncB type="gamma" amplitude="1.22" exponent=".8" offset=".025"/></feComponentTransfer></filter><mask id="${id}-pink-region" maskUnits="userSpaceOnUse" ${box} style="mask-type:luminance"><g fill="white" filter="url(#${id}-soft)">${pinkRegion}</g></mask><mask id="${id}-pink-motion" maskUnits="userSpaceOnUse" ${box} style="mask-type:luminance"><g mask="url(#${id}-pink-region)"><rect class="art-pink-flow pink-ears" x="200" y="690" width="190" height="180" fill="url(#${id}-sweep)"/><rect class="art-pink-flow pink-cheeks" x="200" y="950" width="190" height="160" fill="url(#${id}-sweep)"/><rect class="art-pink-flow pink-paws" x="200" y="1220" width="190" height="160" fill="url(#${id}-sweep)"/></g></mask>
`:''}<filter id="${id}-soft" filterUnits="userSpaceOnUse" ${box}><feGaussianBlur stdDeviation="${kind==='max0'?2:8}"/></filter>
<filter id="${id}-lightboost" filterUnits="userSpaceOnUse" ${box} color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="${kind==='max0'?2.4:1.7}" exponent=".55" offset="${kind==='max0'?.22:0}"/><feFuncG type="gamma" amplitude="${kind==='max0'?2.1:1.7}" exponent=".55" offset="${kind==='max0'?.15:0}"/><feFuncB type="gamma" amplitude="${kind==='max0'?1.8:1.7}" exponent=".55" offset="${kind==='max0'?.055:0}"/></feComponentTransfer></filter>
<filter id="${id}-bloom" filterUnits="userSpaceOnUse" ${box}><feGaussianBlur stdDeviation="6"/></filter>
<filter id="${id}-luminance" filterUnits="userSpaceOnUse" ${box} color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="${kind==='max0'?'0 .5 .8 1 1 1':'0 .15 .45 .8 1 1'}"/><feFuncG type="table" tableValues="${kind==='max0'?'0 .5 .8 1 1 1':'0 .15 .45 .8 1 1'}"/><feFuncB type="table" tableValues="${kind==='max0'?'0 .5 .8 1 1 1':'0 .15 .45 .8 1 1'}"/></feComponentTransfer></filter>
<radialGradient id="${id}-spot"><stop stop-color="white"/><stop offset="${kind==='max0'?.6:.3}" stop-color="${kind==='max0'?'white':'#eee'}"/><stop offset="1" stop-color="black"/></radialGradient>
<linearGradient id="${id}-sweep"><stop stop-color="black"/><stop offset=".3" stop-color="#888"/><stop offset=".5" stop-color="white"/><stop offset=".7" stop-color="#888"/><stop offset="1" stop-color="black"/></linearGradient>
<mask id="${id}-region" maskUnits="userSpaceOnUse" ${box} style="mask-type:luminance"><g fill="white" filter="url(#${id}-soft)">${region}</g></mask>
<mask id="${id}-painted-light" maskUnits="userSpaceOnUse" ${box} style="mask-type:luminance"><g mask="url(#${id}-region)"><g filter="url(#${id}-luminance)">${photo('art-luminance-source')}</g></g></mask>
${kind==='max0'?'':selection('shade-mask','shade-flow')}${selection('reveal','primary-flow')}${selection('specular-mask','specular-flow')}
</defs>${kind==='max0'?'':`<g class="art-derived-shadow" mask="url(#${id}-shade-mask)"><rect ${box} fill="black"/></g>`}<g class="art-derived-light" mask="url(#${id}-reveal)"><g filter="url(#${id}-bloom)" opacity="${kind==='max0'?.6:.3}">${photo('art-bloom-source')}</g><g filter="url(#${id}-lightboost)">${photo('art-sheen-source')}</g></g><g class="art-derived-specular" mask="url(#${id}-specular-mask)" filter="url(#${id}-lightboost)">${photo('art-specular-source')}</g>${kind==='max0'?`<g class="art-pink-luster" mask="url(#${id}-pink-motion)" filter="url(#${id}-pink-luster)">${photo('art-pink-source')}</g>`:''}`;
}
function createManager(){
const records=new Map();const reduced=matchMedia('(prefers-reduced-motion:reduce)');let paused=false,destroyed=false,pageSuspended=false;
function allowed(r){return !destroyed&&!paused&&!pageSuspended&&!reduced.matches&&!document.hidden&&r.visible&&r.el.isConnected&&!r.el.closest('.hide,.hidden,.out,[hidden],[inert],[aria-hidden="true"],[data-revealed="back"],[data-revealed="false"]')&&!r.el.closest('dialog:not([open])')&&(!document.querySelector('dialog[open]')||document.querySelector('dialog[open]').contains(r.el))&&!document.querySelector('#restartConfirm:not(.hide)')&&getComputedStyle(r.el).visibility!=='hidden';}
function sync(r){const on=allowed(r);r.layer.dataset.playing=String(on);r.layer.style.visibility=on?'visible':'hidden';if(!on){clearTimeout(r.timer);r.layer.removeAttribute('data-active');}}
function measure(r){
 // Production card art and SVG are siblings in the same full 2:3 surface.
 // Share CSS geometry directly: viewport rectangles during deal/flip transforms
 // include perspective and integer clientWidth rounding, not local coordinates.
 if(r.imageElement?.parentElement===r.mountRoot&&r.mountRoot.classList.contains('card-content')){
  Object.assign(r.layer.style,{left:'0px',top:'auto',bottom:'0px',width:'100%',height:'var(--card-source-height,100%)'});
  const imageStyle=getComputedStyle(r.imageElement),hostStyle=getComputedStyle(r.mountRoot),width=parseFloat(imageStyle.width)||0,height=parseFloat(imageStyle.height)||0;
  r.rect={x:0,y:(parseFloat(hostStyle.height)||0)-height,width,height,scale:width/ART[r.kind].width};return;
 }
 const el=r.mountRoot,img=r.imageElement||r.el,hostRect=el.getBoundingClientRect(),rect=img.getBoundingClientRect();const style=getComputedStyle(el),imgStyle=getComputedStyle(img);
 const hostBorderX=parseFloat(style.borderLeftWidth)||0,hostBorderY=parseFloat(style.borderTopWidth)||0;
 const imageBorderX=parseFloat(imgStyle.borderLeftWidth)||0,imageBorderY=parseFloat(imgStyle.borderTopWidth)||0;
 // background-origin padding-box / object-fit contain; img padding is excluded.
 const isImage=img.tagName==='IMG';const padL=isImage?(parseFloat(imgStyle.paddingLeft)||0):0,padR=isImage?(parseFloat(imgStyle.paddingRight)||0):0,padT=isImage?(parseFloat(imgStyle.paddingTop)||0):0,padB=isImage?(parseFloat(imgStyle.paddingBottom)||0):0;
 const width=img.clientWidth-padL-padR,height=img.clientHeight-padT-padB;const a=ART[r.kind];const fit=containRect(width,height,a.width,a.height);
 const sx=hostRect.width/(el.offsetWidth||hostRect.width)||1,sy=hostRect.height/(el.offsetHeight||hostRect.height)||1;
 const x=(rect.left-hostRect.left)/sx-hostBorderX+imageBorderX+padL+fit.x,y=(rect.top-hostRect.top)/sy-hostBorderY+imageBorderY+padT+fit.y;
 Object.assign(r.layer.style,{left:x+'px',top:y+'px',width:fit.width+'px',height:fit.height+'px'});r.rect={x,y,width:fit.width,height:fit.height,scale:fit.scale};
}
const ro=new ResizeObserver(entries=>{for(const r of records.values())if(entries.some(e=>e.target===r.el||e.target===r.imageElement))measure(r);});
const io=new IntersectionObserver(entries=>{for(const e of entries){const r=records.get(e.target);if(r){r.visible=e.isIntersecting&&e.intersectionRatio>=.35;sync(r);}}},{threshold:[0,.35,1]});
function attach(el,kind,{faceUp=true,imageElement=null}={}){if(destroyed||!el)return null;if(!faceUp||!ART[kind]){detach(el);return null;}const old=records.get(el);if(old&&old.kind===kind&&old.imageElement===imageElement){sync(old);return old.layer;}detach(el);
 const a=ART[kind],layer=document.createElement('span');layer.className='nb-special-svg';layer.dataset.kind=kind;layer.dataset.playing='false';layer.setAttribute('aria-hidden','true');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${a.width} ${a.height}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.innerHTML=markup(kind,'nbsv-'+(++serial));for(const image of svg.querySelectorAll?.('image')||[])image.setAttribute('href',imageElement?.currentSrc||imageElement?.src||new URL('https://tanabe0422.github.io/number-bluff/assets/card-'+kind+'.webp',document.baseURI).href);layer.append(svg);const mountRoot=imageElement?.closest('.card-content')||el;mountRoot.append(layer);el.classList.add('nb-special-svg-host');
 const bounds=el.getBoundingClientRect();const visibleWidth=Math.max(0,Math.min(innerWidth,bounds.right)-Math.max(0,bounds.left)),visibleHeight=Math.max(0,Math.min(innerHeight,bounds.bottom)-Math.max(0,bounds.top));
 const initiallyVisible=bounds.width>0&&bounds.height>0&&visibleWidth*visibleHeight/(bounds.width*bounds.height)>=.35;
 const r={el,kind,imageElement,mountRoot,layer,visible:initiallyVisible,timer:0,rect:null};records.set(el,r);measure(r);ro.observe(el);if(imageElement&&imageElement!==el)ro.observe(imageElement);io.observe(el);sync(r);return layer;
}
function detach(el){const r=records.get(el);if(!r)return;clearTimeout(r.timer);io.unobserve(el);ro.unobserve(el);if(r.imageElement&&r.imageElement!==el)ro.unobserve(r.imageElement);r.layer.remove();el.classList.remove('nb-special-svg-host');records.delete(el);}
function activate(el,{duration=900}={}){const r=records.get(el);if(!r)return false;sync(r);if(!allowed(r))return false;clearTimeout(r.timer);r.layer.style.setProperty('--special-active-ms',Math.max(250,duration)+'ms');r.layer.dataset.active='true';r.timer=setTimeout(()=>{r.layer.removeAttribute('data-active');sync(r);},Math.max(250,duration));return true;}
function refresh(){for(const r of records.values()){measure(r);sync(r);}}
function pagehide(){pageSuspended=true;refresh();}
function pageshow(){pageSuspended=false;refresh();}
document.addEventListener('visibilitychange',refresh);global.addEventListener('pagehide',pagehide);global.addEventListener('pageshow',pageshow);reduced.addEventListener('change',refresh);
return{attach,detach,activate,play(el,options={}){return activate(el,options);},stop(el){for(const r of records.values())if(!el||r.el===el){clearTimeout(r.timer);r.layer.removeAttribute('data-active');sync(r);}},status(){return{attached:records.size,active:[...records.values()].some(r=>r.layer.dataset.active==='true'),paused};},getActiveHost(){return [...records.values()].find(r=>r.layer.dataset.active==='true')?.el||null;},refresh,pause(){paused=true;refresh();},resume(){paused=false;refresh();},rect(el){return records.get(el)?.rect||null;},
 renderAt(el,ms){const r=records.get(el);if(!r)return false;sync(r);if(!allowed(r))return false;for(const animation of r.layer.getAnimations({subtree:true})){animation.pause();animation.currentTime=ms;}return true;},
 destroy(){destroyed=true;for(const el of [...records.keys()])detach(el);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',refresh);global.removeEventListener('pagehide',pagehide);global.removeEventListener('pageshow',pageshow);reduced.removeEventListener('change',refresh);}}
}
global.NumberBluffSpecialSVG=Object.freeze({createManager,containRect,art:ART});
})(window);


;

/* Presentation-only orchestration. Reads disclosed DOM faces, never game state. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NumberBluffSpecialEffects=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function create({renderer,document:doc=document,window:win=window,busy=()=>false}={}){
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  let ready=false,disposed=false,active=null,endTimer=0,nextAllowed=0;
  const seen=new Set();
  const blocked=()=>disposed||doc.hidden||reduced.matches||!!doc.querySelector('#restartConfirm:not(.hide)');
  function kindOf(node){
   if(!node?.querySelector('img.card-art')||node.matches('.hidden,.out')||node.closest('.hide,[hidden],[inert],[data-revealed="back"],[data-revealed="false"]'))return null;
   if(node.classList.contains('normal-card'))return null;
   return ['extra','double','max0','reset'].find(kind=>node.classList.contains('kind-'+kind))||null;
  }
  function eligible(node){
   if(blocked()||!node?.isConnected||!kindOf(node)||!node.getClientRects().length)return false;
   const modal=doc.querySelector('dialog[open]');if(modal&&!modal.contains(node))return false;
   const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<win.innerHeight&&r.right>0&&r.left<win.innerWidth;
  }
  function stop(){win.clearTimeout(endTimer);endTimer=0;renderer.stop();active=null;}
  function play(node,{key=null,duration=null,priority=false}={}){
   if(!ready||!eligible(node)||(key&&seen.has(key)))return false;
   if(!priority&&(busy()||active||win.performance.now()<nextAllowed))return false;
   const kind=kindOf(node),ms=duration??1200;
   if(priority)stop();
   if(!renderer.play(node,kind,{duration:ms}))return false;
   if(key){seen.add(key);if(seen.size>128)seen.delete(seen.values().next().value);}
   active={node,kind};nextAllowed=win.performance.now()+ms+1500;
   endTimer=win.setTimeout(stop,ms+50);return true;
  }
  function sync(){if(active&&!eligible(active.node))stop();}
  function visibility(){if(doc.hidden||reduced.matches)stop();}
  function pagehide(){stop();}
  doc.addEventListener('visibilitychange',visibility);
  reduced.addEventListener?.('change',visibility);win.addEventListener('pagehide',pagehide);
  Promise.resolve(renderer.ready).then(value=>{if(!disposed)ready=!!value;});
  return {play,stop,sync,status(){return{ready,active:!!active,kind:active?.kind||null,seen:seen.size};},destroy(){disposed=true;stop();doc.removeEventListener('visibilitychange',visibility);reduced.removeEventListener?.('change',visibility);win.removeEventListener('pagehide',pagehide);renderer.destroy();seen.clear();}};
 }
 return Object.freeze({create});
});


;

/* Static examples use the actual card artwork and BOT portraits as named actors. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./card-art'));else root.NumberBluffGuideDiagrams=factory(root.NumberBluffCardArt);})(typeof globalThis==='object'?globalThis:this,function(cardArt){
 'use strict';
 const labels=[
  '自分のカードは裏向き。他の人の3と5は見える。自分を含む合計を予想する。',
  '宣言の例。8の次は9、その次は12。前より大きい整数を宣言する。',
  '挑戦の例。直前の宣言は12。合計は10くらいと予想したら、グラビティ！。まだ合計は未確定。',
  '判定の例。実際の合計が10のとき、宣言12なら宣言者がライフを1失う。宣言10なら疑った側がライフを1失う。',
  '負けた人のライフは3から2へ。0で脱落し、最後に残った1人が優勝。'
 ];
 const portraits={bunny:'https://tanabe0422.github.io/number-bluff/assets/cloud-bunny.webp',cat:'https://tanabe0422.github.io/number-bluff/assets/moon-cat.webp',star:'https://tanabe0422.github.io/number-bluff/assets/star-sprite.webp'};
 function create(doc,index){
  if(!Number.isInteger(index)||index<0||index>=labels.length)throw new RangeError('Unknown guide step');
  const node=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const root=node('div','guide-diagram guide-diagram-'+index);root.setAttribute('role','img');root.setAttribute('aria-label',labels[index]);
  const row=()=>node('div','guide-diagram-row');
  const image=(src,cls)=>{const n=node('img',cls);n.src=src;n.alt='';n.draggable=false;n.decoding='async';n.setAttribute('aria-hidden','true');return n;};
  const chip=(label,value,cls='')=>{const c=node('span','guide-chip '+cls);c.append(node('small','',label),node('strong','',value));return c;};
  const actor=(who,label)=>{const c=node('span','guide-actor');c.append(image(portraits[who],'guide-avatar'));if(label)c.append(node('small','',label));return c;};
  const speech=(who,label,value)=>{const c=node('div','guide-speaker');c.append(chip(label,value,'is-speech'),actor(who,null));return c;};
  const arrow=()=>node('span','guide-arrow','→');
  const card=(label,value)=>{const c=node('div','guide-card-example'),face=node('span','player-card guide-card-face'+(value===null?' hidden':' kind-number normal-card'));c.append(node('small','',label));if(value===null)face.textContent='？';else{face.setAttribute('data-art-value',String(value));const disclosed={kind:'number',value},content=cardArt.content(doc,disclosed);content.append(node('strong','card-value',String(value)),cardArt.create(doc,disclosed));face.append(content);}c.append(face);return c;};
  if(index===0){const r=row();r.append(card('自分',null),card('他の人',3),card('他の人',5));root.append(r,node('span','guide-diagram-note','？ ＋ 3 ＋ 5 ＝ 合計は？'));}
  if(index===1){const r=row();r.append(speech('bunny','宣言','8'),arrow(),speech('cat','次の人','9'),arrow(),speech('star','その次','12'));root.append(r);}
  if(index===2){const r=row();r.append(speech('bunny','直前の宣言','12'),node('span','guide-comparison','> ?'),chip('自分の予想','10くらい'));const challenge=row();challenge.className+=' guide-challenger';challenge.append(actor('cat','疑う人'),node('span','guide-challenge','グラビティ！'));root.append(r,challenge);}
  if(index===3){for(const [bid,sign,loser,who] of [['12','>','宣言者','bunny'],['10','＝','疑った側','cat']]){const example=node('div','guide-verdict'),r=row(),outcome=row();r.append(chip('宣言',bid),node('span','guide-comparison',sign),chip('実合計','10'));outcome.className+=' guide-verdict-outcome';outcome.append(actor(who,loser),node('span','guide-life-loss','ライフ −1'));example.append(r,outcome);root.append(example);}}
  if(index===4){const r=row();r.append(actor('bunny','負けた人'),chip('ライフ','3 → 2','guide-life-chip'));const hearts=node('span','guide-hearts');hearts.append(node('span','','♥ ♥ '),node('span','is-lost','♥'));r.append(hearts);root.append(r,node('span','guide-diagram-note','0になると脱落。残った1人が優勝！'));}
  return root;
 }
 return Object.freeze({create,labels:Object.freeze(labels)});
});


;

/* Small, finite public-state feedback. Never owns game timing or input. */
(function(global){'use strict';
const motions={
 turn:{frames:[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.1)',filter:'brightness(1.18)',offset:.4},{transform:'scale(1)',filter:'brightness(1)'}],duration:420},
 life:{frames:[{transform:'translateY(-3px) scale(1.25)',color:'#ffe7ef',opacity:.45},{transform:'translateY(0) scale(1.07)',color:'#ff8cb6',opacity:1,offset:.55},{transform:'none',color:'#ffb2d1',opacity:1}],duration:560}
};
function create(){
 const media=global.matchMedia('(prefers-reduced-motion: reduce)'),seen=new Set(),running=new Set();let scope=null,destroyed=false,suspended=false;
 function stop(){for(const animation of running)animation.cancel();running.clear();}
 function begin(key){if(key!==scope){stop();seen.clear();scope=key;}}
 function play(kind,node,key){
  const event=kind+':'+key;if(destroyed||!scope||seen.has(event)||!motions[kind])return false;
  seen.add(event); // Consume hidden/reduced events, never replay on focus or resync.
  if(document.hidden||suspended||media.matches||!node?.isConnected||typeof node.animate!=='function'||node.closest('.hide,[hidden],[inert],dialog:not([open])'))return false;
  const rect=node.getBoundingClientRect();if(rect.bottom<=0||rect.top>=global.innerHeight||rect.right<=0||rect.left>=global.innerWidth)return false;
  const motion=motions[kind];let animation;try{animation=node.animate(motion.frames,{duration:motion.duration,easing:'cubic-bezier(.2,.75,.25,1)',iterations:1,id:'nb-feedback-'+kind});}catch{return false;}
  running.add(animation);animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));return true;
 }
 const visibility=()=>{if(document.hidden)stop();};const hide=()=>{suspended=true;stop();};const show=()=>{suspended=false;};
 document.addEventListener('visibilitychange',visibility);global.addEventListener('pagehide',hide);global.addEventListener('pageshow',show);global.addEventListener('resize',stop);media.addEventListener('change',stop);
 return{begin,play,stop,destroy(){destroyed=true;stop();seen.clear();document.removeEventListener('visibilitychange',visibility);global.removeEventListener('pagehide',hide);global.removeEventListener('pageshow',show);global.removeEventListener('resize',stop);media.removeEventListener('change',stop);}};
}
global.NumberBluffGameplayFeedback=Object.freeze({create});
})(window);


;

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./card-presentation.js'));
  else root.NumberBluffRoundAdvanceClock = factory(root.NumberBluffPresentation);
})(typeof globalThis === 'object' ? globalThis : this, function (P) {
  'use strict';
  const WAIT_MS = 10000, BOT_ONLY_WAIT_MS = 1000;
  function create({expire,now=Date.now,set=setTimeout,clear=clearTimeout}) {
    let clock=null,pending=null,generation=0;
    function pause(){generation++;if(pending!==null)clear(pending);pending=null;}
    function cancel(){pause();clock=null;}
    function check(){if(!clock||now()<clock.deadline)return false;const elapsed=clock;cancel();expire(elapsed);return true;}
    function resume(){pause();if(check()||!clock)return;const ticket=generation;pending=set(()=>{if(ticket!==generation)return;pending=null;if(!check())resume();},Math.max(1,clock.deadline-now()));if(typeof pending?.unref==='function')pending.unref();}
    function sync(state){
      if(state?.phase!=='reveal'||!state.result){cancel();return null;}
      const token=JSON.stringify([state.game,state.round]);
      if(clock?.token!==token){cancel();const readyAt=now()+P.plan(state.result,state.players).at(-1).at;const wait=state.players.some(p=>p.kind==='human'&&p.life>0)?WAIT_MS:BOT_ONLY_WAIT_MS;clock={token,readyAt,deadline:readyAt+wait};}
      resume();return clock;
    }
    return {sync,check,pause,resume,cancel,get:()=>clock};
  }
  return {create,WAIT_MS,BOT_ONLY_WAIT_MS};
});


;

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NumberBluffLocalTurnClock = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  return function create({ expire, now = Date.now, set = setTimeout, clear = clearTimeout }) {
    let clock = null, pending = null, generation = 0;
    function pause() { generation++; if (pending !== null) clear(pending); pending = null; }
    function cancel() { pause(); clock = null; }
    function check() {
      if (!clock || now() < clock.localDeadline) return false;
      const elapsed = clock; cancel(); expire(elapsed); return true;
    }
    function resume() {
      pause(); if (check() || !clock) return;
      const ticket = generation;
      pending = set(() => { if (ticket !== generation) return; pending = null; if (!check()) resume(); }, Math.max(0, clock.localDeadline - now()));
    }
    function sync(state, human) {
      if (!state || state.phase !== 'play' || state.turn !== human) { cancel(); return null; }
      const token = JSON.stringify([state.game, state.round, state.turn, state.history.length]);
      if (clock?.token !== token) { cancel(); clock = { token, player: human, localDeadline: now() + 30000 }; }
      resume(); return clock;
    }
    return { sync, check, pause, resume, cancel, get: () => clock };
  };
});


;

(() => {
  'use strict';
  const G = window.NumberBluff, timer = window.NumberBluffScheduler(), $ = id => document.getElementById(id);
  const audio = window.NumberBluffAudio.create();
  function updateSoundButtons() {
    const muted = audio.isMuted();
    document.querySelectorAll('[data-sound-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(muted));
      button.setAttribute('aria-label', muted ? '音をオンにする' : '音をオフにする');
      button.title = muted ? '音をオンにする' : '音をオフにする';
      const icon = button.querySelector('b');
      if (icon) icon.textContent = '♪'; else button.textContent = '♪';
      button.classList.toggle('is-muted', muted);
    });
  }
  document.querySelectorAll('[data-sound-toggle]').forEach(button => {
    button.addEventListener('click', event => {
      audio.setMuted(!audio.isMuted(), event);
      updateSoundButtons();
      if (!audio.isMuted()) audio.play('tap');
    });
  });
  updateSoundButtons();
  const cardReveal = window.NumberBluffCardReveal.createController();
  const sceneMotion = window.NumberBluffSceneMotion.create();
  const gameplayFeedback = window.NumberBluffGameplayFeedback.create();
  const specialSVG = window.NumberBluffSpecialSVG.createManager();
  const specialRenderer = {ready:Promise.resolve(true),play(node,kind,{duration}){specialSVG.attach(node,kind,{faceUp:true,imageElement:node.querySelector('img.card-art')});return specialSVG.play(node,{duration});},stop(){specialSVG.stop();},destroy(){specialSVG.destroy();}};
  const specialEffects = window.NumberBluffSpecialEffects.create({renderer:specialRenderer,busy:()=>presenter.active});
  let detailEffectEpoch = 0;
  const motionCards = new Set();
  function syncCardMotion() {
    specialEffects.sync();
    for (const node of motionCards) if (!node.isConnected) { specialSVG.detach(node); motionCards.delete(node); }
    for (const node of document.querySelectorAll('.screen:not(.hide) .player-card:not(.hidden):not(.out), dialog[open] .player-card:not(.hidden):not(.out)')) {
      const kind = ['extra','double','max0','reset'].find(value => node.classList.contains('kind-' + value));
      if (kind) { motionCards.add(node); specialSVG.attach(node, kind, { faceUp: true, imageElement: node.querySelector('img.card-art') }); }
    }
    specialSVG.refresh();
  }
  // Countdown text and SVG-internal changes never alter the set of card hosts.
  // Avoid measuring every card on those frequent unrelated child mutations.
  const containsCard = node => node.nodeType === 1 && (node.matches('.player-card') || node.querySelector('.player-card'));
  const motionObserver = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(containsCard))) syncCardMotion();
  });
  motionObserver.observe(document.querySelector('main'), {childList:true,subtree:true});
  let roomActions = {}, roomRequest = 0, listRequest = 0, roomBusy = false, roomAdapterExpected = false, cancelRoomOperation = null;
  const sessionFinishListeners = new Set();
  let connectionBlocked = false, connectionMessage = '';
  const screenListeners = new Set(), screenNames = { homeScreen: 'home', lobbyScreen: 'lobby', battleScreen: 'battle', guidePanel: 'guide', joinPanel: 'join' };
  const updateViewport = () => document.documentElement.style.setProperty('--nb-viewport-height', (window.visualViewport?.height || window.innerHeight) + 'px');
  window.addEventListener('resize', updateViewport); window.visualViewport?.addEventListener('resize', updateViewport); updateViewport();
  let human = 'p1', localProfile = { name: 'プレイヤー', avatarUrl: null };
  const safeAvatar = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  const difficultyNames = { easy: 'やさしい', normal: '普通', hard: '強い' };
  const avatars = ['https://tanabe0422.github.io/number-bluff/assets/star-sprite.webp', 'https://tanabe0422.github.io/number-bluff/assets/moon-cat.webp', 'https://tanabe0422.github.io/number-bluff/assets/cloud-bunny.webp', 'https://tanabe0422.github.io/number-bluff/assets/blue-cloud.webp'];
  const avatarNames = ['ほしもち', 'ほしねこ', 'もふうさ', 'くもまる'];
  let state = null, view = null, screen = 'homeScreen', selectedBot = 'p2', nextDifficulty = 'normal';
  let avatarChoice = {}, suggested = true, overlayReturn = null;
  const localRoundClock = window.NumberBluffRoundAdvanceClock.create({expire(){if(!transport&&state?.phase==='reveal')apply(G.nextRound(state,Math.random));}});
  const localTurnClock = window.NumberBluffLocalTurnClock({ expire() {
    if (transport || state?.phase !== 'play' || state.turn !== human) return;
    const value = state.bid === null ? 1 : state.bid + 1;
    if (!Number.isSafeInteger(value)) {
      apply(G.returnToLobby(state));
      connectionMessage = '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。'; paintConnectionStatus();
      return;
    }
    apply(G.declare(state, human, value));
  } });
  let presentationFrame = null, presentationPrevious = null, presentationKey = null, roomEpoch = 0, nextReadyAt = 0;
  let transport = null, unsubscribe = null, unsubscribeEmotes = null, turnDisplayTimer = null, pendingAction = null;
  function clearPendingAction(){if(pendingAction){clearTimeout(pendingAction.timer);pendingAction=null;}}
  const emoteImages = ['https://tanabe0422.github.io/number-bluff/assets/emote-bunny-surprised.webp','https://tanabe0422.github.io/number-bluff/assets/emote-cat-confident.webp','https://tanabe0422.github.io/number-bluff/assets/emote-cloud-anxious.webp','https://tanabe0422.github.io/number-bluff/assets/emote-star-skeptical.webp'];
  const emoteLabels = ['驚き','喜び','不安','疑い'];
  const emotes = new Map(); let emoteCooldown = 0, emoteTimer = null;
  function clearEmotes(){emotes.clear();clearTimeout(emoteTimer);emoteTimer=null;emoteCooldown=0;syncEmoteButtons();}
  function showEmote(event){
    if(!['play','reveal','finished'].includes(view?.phase)||event.game!==view.game||event.round!==view.round||!view.players.some(p=>p.id===event.player))return;
    emotes.set(event.player,{kind:event.kind,until:Date.now()+2200});
    paintEmotes();setTimeout(()=>{const item=emotes.get(event.player);if(item&&item.until<=Date.now()){emotes.delete(event.player);paintEmotes();}},2250);
  }
  function paintEmotes(){
    for(const block of $('playerGrid').children){block.querySelector('.emote-stamp')?.remove();const item=emotes.get(block.dataset.player);if(!item||item.until<=Date.now())continue;
      const stamp=image(emoteImages[item.kind],'emote-stamp');stamp.dataset.kind=String(item.kind);stamp.setAttribute('role','img');stamp.setAttribute('aria-label',name(block.dataset.player)+'のリアクション: '+emoteLabels[item.kind]);block.querySelector('.emote-slot')?.append(stamp);
    }
  }
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const image = (src, cls = '') => { const node = el('img', cls); node.src = src; node.alt = ''; return node; };
  const avatarIndex = id => { const p = view?.players.find(p => p.id === id); const value = p?.botAvatar ?? avatarChoice[id]; return Number.isInteger(value) && value >= 0 && value < 4 ? value : (Math.max(0, Number(String(id).replace(/\D/g, '')) - 1) % 4); };
  function playerAvatar(id) {
    const p = view?.players.find(p => p.id === id);
    if (p?.kind !== 'human') return image(avatars[avatarIndex(id)], 'avatar');
    const url = safeAvatar(p.avatarUrl ?? (p.id === human ? localProfile.avatarUrl : null));
    const placeholder = () => { const n = el('span', 'avatar person-placeholder'); n.setAttribute('aria-hidden', 'true'); return n; };
    if (!url) return placeholder();
    const n = image(url, 'avatar profile-avatar'); n.referrerPolicy = 'no-referrer'; n.addEventListener('error', () => n.replaceWith(placeholder()), { once: true }); return n;
  }
  const name = id => {
    const player = view?.players.find(p => p.id === id);
    if (!player) return '';
    if (player.kind === 'human') return player.name || (player.id === human ? localProfile.name : 'プレイヤー');
    const duplicate = view.players.filter(p => p.kind === 'bot' && avatarIndex(p.id) === avatarIndex(id)).length > 1;
    return avatarNames[avatarIndex(id)] + (duplicate ? ' ' + id.slice(1) : '');
  };
  const emoteBar=$('emoteBar');
  function syncEmoteButtons(){const supported=transport?.supportsEmotes?.()!==false;emoteBar.querySelectorAll('.emote-button').forEach((button,index)=>{button.disabled=!supported||Date.now()<emoteCooldown;button.title=supported?'':'この部屋ではリアクションを利用できません';button.setAttribute('aria-label',emoteLabels[index]+'のリアクション'+(supported?'':'（この部屋では使えません）'));});}
  emoteLabels.forEach((label,kind)=>{const button=el('button','emote-button');button.type='button';button.setAttribute('aria-label',label+'のリアクション');button.append(image(emoteImages[kind]));button.onclick=()=>{
    if(!['play','reveal','finished'].includes(view?.phase)||connectionBlocked||Date.now()<emoteCooldown)return;
    emoteCooldown=Date.now()+3000;emoteBar.querySelectorAll('.emote-button').forEach(b=>b.disabled=true);
    clearTimeout(emoteTimer);emoteTimer=setTimeout(syncEmoteButtons,3000);
    if(transport?.sendEmote)void Promise.resolve(transport.sendEmote(kind)).catch(()=>{});else if(!transport)showEmote({player:human,kind,game:view.game,round:view.round});
  };emoteBar.append(button);});
  const discardButton=el('button','discard-button','捨て札');discardButton.type='button';discardButton.setAttribute('aria-label','公開済みの捨て札を見る');
  discardButton.onclick=()=>{if(!view||!['play','reveal','finished'].includes(view.phase))return;const list=$('discardList');list.replaceChildren();if(!view.discard.length)list.append(el('p','','捨て札はありません'));else for(const card of view.discard)list.append(el('span','discard-item',cardLabel(card)));$('discardDetail').showModal();$('closeDiscard').focus();};emoteBar.append(discardButton);
  $('closeDiscard').onclick=()=>$('discardDetail').close();
  $('discardDetail').addEventListener('click',event=>{if(event.target===$('discardDetail'))$('discardDetail').close();});
  const presenter = window.NumberBluffPresentation.createPresenter({
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    onPhase: paintPresentationFrame
  });
  function cancelPresentation(settle = false) {
    if (presenter.active) audio.stop();
    specialEffects.stop(); cardReveal.settleAll(); sceneMotion.leave(); gameplayFeedback.stop();
    presenter.cancel(); presentationFrame = null; presentationPrevious = null;
    if (settle && view?.result && view.phase !== 'play' && view.phase !== 'lobby') { renderPlayers(); renderResult(); }
  }
  function paintPresentationFrame(frame, key) {
    if (key !== presentationKey || !view?.result || view.phase === 'play' || view.phase === 'lobby') return;
    specialEffects.stop();
    const hadOutcome = presentationFrame?.outcomeVisible;
    const phaseSound = { hold: 'challenge', reveal: 'reveal', extra: 'extra', max: 'max', sum: 'sum', multiply: 'multiply', reset: 'reset', compare: 'compare' };
    if (frame.outcomeVisible && !hadOutcome) audio.play(view.result.winner ? (view.result.winner === human ? 'win' : view.result.loser === human ? 'loss' : 'outcome') : 'life');
    else if (phaseSound[frame.phase]) audio.play(phaseSound[frame.phase]);
    presentationFrame = frame;
    if (frame.outcomeVisible && !hadOutcome) {
      renderPlayers();
      const loser = view.players.find(p => p.id === view.result.loser);
      const before = presentationPrevious?.find(p => p.id === loser?.id);
      if (loser && before?.life === loser.life + 1 && !frame.complete) {
        const block = [...$('playerGrid').children].find(n => n.dataset.player === loser.id);
        gameplayFeedback.play('life', block?.querySelectorAll('.life-heart')[loser.life], key + ':life:' + loser.id);
      }
    }
    for (const p of view.players) {
      const card = view.result.cards[p.id]; if (!card) continue;
      const block = [...$('playerGrid').children].find(n => n.dataset.player === p.id); if (!block) continue;
      let node = block.querySelector('.player-card');
      if (frame.revealedIds.includes(card.id) && node.classList.contains('hidden')) {
        const face = cardNode(card); face.classList.add('presentation-card'); face.dataset.cardId = card.id; face.dataset.revealed = 'true'; if(p.id===human)face.classList.add('own-reveal');
        if (p.id === human) face.id = 'humanCard'; face.setAttribute('aria-label', name(p.id) + 'のカード ' + card.label); cardReveal.reveal({ key: key + ':' + card.id, back: node, face, authorized: true }); node = face;
      }
      node.classList.toggle('is-adding', frame.phase === 'sum' && frame.cardId === card.id);
      node.classList.toggle('is-zeroed', frame.removedCardId === card.id);
      if (frame.removedCardId === card.id && !node.querySelector('.presentation-zero-stamp')) node.append(zeroEffectBadge());
    }
    if(frame.complete)for(const node of $('playerGrid').querySelectorAll('.player-card[data-card-id]')){node.dataset.detailCard=node.dataset.cardId;node.setAttribute('role','button');node.tabIndex=0;}
    const deck=$('deckIndicator');deck.classList.toggle('presentation-refresh',frame.phase==='reset');
    if(frame.phase==='reset'){const target=deck.getBoundingClientRect();for(const node of $('playerGrid').querySelectorAll('.player-card:not(.out)')){const rect=node.getBoundingClientRect();node.style.setProperty('--collect-x',Math.max(-120,Math.min(120,target.left+target.width/2-(rect.left+rect.width/2)))+'px');node.style.setProperty('--collect-y',Math.max(-120,Math.min(120,target.top-(rect.top+rect.height/2)))+'px');node.classList.add('is-collecting');}}
    renderResult();
    const specialKind = {extra:'extra',max:'max0',multiply:'double',reset:'reset'}[frame.phase];
    if (specialKind && !frame.complete) {
      const node = [...document.querySelectorAll('#battleScreen .player-card.kind-'+specialKind)].find(n=>!n.classList.contains('hidden'));
      specialEffects.play(node,{key:key+':special:'+frame.phase,duration:frame.phase==='reset'?350:400,priority:true});
    }
    if (frame.outcomeVisible && !hadOutcome) sceneMotion.celebrate({ key, confirmed: true, won: view.result.winner === human });
    if (frame.outcomeVisible && !hadOutcome) $('resultAnnouncement').textContent = '最終合計 ' + view.result.sum + '。' + $('resultText').textContent;
  }
  function show(id, focus = null) {
    if (id !== screen && $('cardDetail').open) $('cardDetail').close();
    if (screen === 'battleScreen' && id !== screen) { if ($('discardDetail').open) $('discardDetail').close(); audio.stop(); cancelPresentation(true); }
    for (const node of document.querySelectorAll('.screen')) node.classList.toggle('hide', node.id !== id);
    stopDetailEffect(); screen = id; paintTurnDisplay(); cardReveal.settleAll(); syncCardMotion(); window.scrollTo(0, 0);
    for (const listener of screenListeners) { try { listener(screenNames[id]); } catch {} }
    if (focus) $(focus).focus({ preventScroll: true });
  }
  function cardLabel(card) { return card.kind === 'reset' ? 'リセット（0）' : card.label; }
  function cardNode(card, hidden = false, out = false) {
    const node = el('div', 'player-card');
    if (out) { node.classList.add('out'); node.textContent = '脱落'; return node; }
    if (hidden || !card) { node.classList.add('hidden'); node.textContent = '?'; return node; }
    node.classList.add('kind-' + card.kind);
    if (card.kind !== 'number') node.classList.add('special');
    if (card.value < 0) node.classList.add('negative');
    const content = window.NumberBluffCardArt.content(document, card);
    content.append(el('span', 'card-value', cardLabel(card)));
    if (card.kind === 'number') { node.classList.add('normal-card'); node.dataset.artValue = String(card.value); }
    const art = window.NumberBluffCardArt.create(document, card); node.classList.add('art-pending');
    const artReady = () => node.classList.remove('art-pending'); art.addEventListener('load', artReady);
    if (art.complete && art.naturalWidth > 0) artReady();
    content.append(art);
    node.append(content);
    return node;
  }
  function clearError() { $('inputError').textContent = ''; $('number').removeAttribute('aria-invalid'); }
  function fail(message) { $('inputError').textContent = message; $('number').setAttribute('aria-invalid', 'true'); }
  function captureSessionFinish(reason = 'explicit-exit', game = view?.game) {
    if (!transport || !view || !Number.isSafeInteger(view.game) || view.game < 1) return null;
    const player = view.players.find(p => p.id === human && p.kind === 'human');
    if (!player || !Number.isSafeInteger(player.bestStreak) || player.bestStreak < 0) return null;
    return { reason, game, sessionId: roomEpoch, roomId: view.roomId,
      viewerId: human, player: { id: player.id, kind: player.kind, bestStreak: player.bestStreak } };
  }
  function publishSessionFinish(result) {
    if (result) for (const listener of sessionFinishListeners) { try { listener(result); } catch {} }
  }
  function detachTransport() {
    clearPendingAction(); audio.stop(); stopTurnDisplay(); localTurnClock.cancel(); localRoundClock.cancel(); cancelPresentation(); presentationKey = null; roomEpoch++;
    if (typeof unsubscribe === 'function') unsubscribe();
    if (typeof unsubscribeEmotes === 'function') unsubscribeEmotes(); unsubscribeEmotes = null; clearEmotes();
    unsubscribe = null; const old = transport; transport = null; connectionBlocked = false; connectionMessage = '';
    if (typeof old?.close === 'function') old.close();
    paintConnectionStatus();
  }
  async function requestRoom(kind, roomId) {
    if (roomBusy) return;
    const status = $(kind === 'create' ? 'roomCreateStatus' : 'roomJoinStatus');
    const button = $(kind === 'create' ? 'startGame' : 'joinRoom');
    if (typeof roomActions[kind] !== 'function') { if (kind === 'create' && !roomAdapterExpected && !$('privateRoom').checked) { createLocalHostRoom(); return; } status.textContent = kind === 'create' && $('privateRoom').checked ? 'プライベートルームは準備中です。' : '接続待ち'; return; }
    const request = ++roomRequest; roomBusy = true; button.disabled = true; status.textContent = '接続中…';
    try {
      const adapter = await roomActions[kind](kind === 'join' ? roomId : ($('privateRoom').checked ? 1 : 0));
      if (request !== roomRequest) { adapter?.close?.(); return; }
      if (adapter) window.NumberBluffClient.connect(adapter, { roomPermission: kind === 'create' ? ($('privateRoom').checked ? 1 : 0) : null });
      status.textContent = view ? '' : connectionMessage || 'ホストからの情報を待っています…';
    } catch { if (request === roomRequest) status.textContent = '接続できませんでした。もう一度お試しください。'; }
    finally { roomBusy = false; if (request === roomRequest) button.disabled = false; }
  }
  function cancelRoomRequest() { ++roomRequest; ++listRequest; if (cancelRoomOperation) cancelRoomOperation(); $('startGame').disabled = false; $('joinRoom').disabled = false; $('roomCreateStatus').textContent = ''; $('roomJoinStatus').textContent = ''; }
  function createLocalHostRoom() {
    $('roomId').value = ''; detachTransport(); human = 'p1'; timer.cancel(); state = G.createLobby({ name: localProfile.name, botCount: 0 }); state.players[0].avatarUrl = localProfile.avatarUrl; avatarChoice = {}; selectedBot = null;
    view = G.publicView(state, human); renderLobby(); show('lobbyScreen');
  }
  const canManageLobby = () => !connectionBlocked && (!transport || (typeof view?.hostId === 'string' && view.hostId === human));
  function lobbyAction(type, details = {}) {
    if (!transport || !canManageLobby()) return;
    $('lobbyError').textContent = '';
    Promise.resolve(transport.send({ type, player: human, revision: view.revision, ...details })).catch(() => { $('lobbyError').textContent = '接続を確認して、もう一度お試しください。'; });
  }
  function renderLobby() {
    $('playerCount').textContent = view.players.length + '/8';
    const roomId = typeof view.roomId === 'string' ? view.roomId : '';
    const idHeader = !!roomId;
    $('lobbyTitle').textContent = roomId;
    $('lobbyTitle').classList.toggle('is-room-id', idHeader);
    $('copyRoomId').classList.toggle('hide', !idHeader);
    $('lobbyHeaderSpacer').classList.toggle('hide', idHeader);
    $('roomCopyStatus').textContent = ''; $('roomCopyStatus').classList.add('hide');
    $('roomCopyFallback').classList.add('hide');
    const manage = canManageLobby(), hostId = transport ? view.hostId : 'p1';
    $('roomIdentity').classList.add('hide'); $('roomIdentity').textContent = '';
    $('lobbyError').textContent = '';
    const selected = view.players.find(p => p.id === selectedBot && p.kind === 'bot');
    if (!selected) selectedBot = view.players.find(p => p.kind === 'bot')?.id;
    const grid = $('lobbyPlayers'); grid.replaceChildren();
    for (let i = 0; i < 8; i++) {
      const p = view.players[i];
      if (!p) { const slot = el('button', 'lobby-seat empty'); slot.type = 'button'; slot.setAttribute('aria-label', 'BOTを追加'); slot.append(el('b', '', '+'), el('small', '', '参加待ち')); slot.onclick = addBot; slot.disabled = !manage; grid.append(slot); continue; }
      const slot = el(p.kind === 'bot' ? 'button' : 'div', 'lobby-seat' + (p.id === selectedBot ? ' selected' : ''));
      slot.dataset.seat = p.id;
      if (p.id === hostId) slot.append(el('span', 'crown', '♛'));
      slot.append(playerAvatar(p.id), el('strong', '', name(p.id)), el('small', '', p.kind === 'human' ? (p.id === hostId ? 'ホスト' : '参加中') + (p.wins ? ' · ' + p.wins + '勝' : '') : 'BOT · ' + difficultyNames[p.difficulty] + (p.wins > 0 ? ' · ' + p.wins + '勝' : '')));
      if (p.kind === 'bot') { slot.type = 'button'; slot.setAttribute('aria-pressed', String(p.id === selectedBot)); slot.onclick = () => { selectedBot = p.id; renderLobby(); }; }
      grid.append(slot);
    }
    const bot = view.players.find(p => p.id === selectedBot);
    $('selectedBotLabel').textContent = bot ? ' — ' + name(bot.id) : '';
    $('addBot').disabled = !manage || view.players.length >= 8; $('removeBot').disabled = !manage || !bot;
    $('beginGame').disabled = !manage || view.players.length < 2;
    document.querySelectorAll('[data-avatar]').forEach(button => { button.disabled = !manage || !bot; });
    document.querySelectorAll('[data-difficulty]').forEach(button => { button.disabled = !manage || !bot; button.setAttribute('aria-pressed', String(button.dataset.difficulty === (bot?.difficulty || nextDifficulty))); });
    document.querySelectorAll('[data-avatar]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.avatar) === avatarIndex(selectedBot || 'p2'))));
  }
  function addBot() { if (transport) { lobbyAction('addBot', { difficulty: nextDifficulty }); return; } if (!state) return; const next = G.addBot(state, nextDifficulty); if (next === state) return; selectedBot = next.players.find(p => !state.players.some(old => old.id === p.id)).id; state = next; view = G.publicView(state, human); renderLobby(); }
  function stopTurnDisplay() { if (turnDisplayTimer !== null) clearTimeout(turnDisplayTimer); turnDisplayTimer = null; }
  function paintTurnDisplay() {
    stopTurnDisplay();
    const badge = document.querySelector('.turn-countdown');
    paintRoundCountdown();
    if (!badge || connectionBlocked || view?.phase !== 'play' || !view.turnClock || screen !== 'battleScreen' || document.hidden) return;
    const seconds = Math.max(0, Math.ceil((view.turnClock.localDeadline - Date.now()) / 1000));
    badge.textContent = seconds > 0 ? '残り ' + seconds + '秒' : '確定待ち';
    badge.classList.toggle('is-urgent', seconds <= 10);
    badge.setAttribute('aria-label', seconds > 0 ? name(view.turn) + 'の手番、残り' + seconds + '秒' : 'ホストの宣言確定を待っています');
    if (seconds > 0) turnDisplayTimer = setTimeout(paintTurnDisplay, 200);
  }
  function paintRoundCountdown() {
    const clock=view?.roundClock;
    if(connectionBlocked||view?.phase!=='reveal'||!clock||presentationFrame&&!presentationFrame.complete||screen!=='battleScreen'||document.hidden)return;
    const remaining=Math.max(0,Math.ceil((clock.localDeadline-Date.now())/1000));
    const waiting=Date.now()<clock.localReadyAt;
    $('next').textContent=waiting?(canManageLobby()?'次のラウンドへ　›':'結果を確認中…'):canManageLobby()?`次のラウンドへ · ${remaining}秒`:`次のラウンドまで ${remaining}秒`;
    $('next').disabled=!canManageLobby();
    if(remaining>0)turnDisplayTimer=setTimeout(paintTurnDisplay,200);
  }
  function zeroEffectBadge() {
    const badge = el('span', 'presentation-zero-stamp');
    badge.setAttribute('role', 'img'); badge.setAttribute('aria-label', '黒猫の効果で0');
    badge.innerHTML = '<svg viewBox="0 0 64 68" aria-hidden="true" focusable="false"><g fill="#f7b9d3" stroke="#fff0c6" stroke-width="1.6"><ellipse cx="10" cy="23" rx="7" ry="10" transform="rotate(-28 10 23)"/><ellipse cx="24" cy="12" rx="7" ry="10" transform="rotate(-8 24 12)"/><ellipse cx="41" cy="12" rx="7" ry="10" transform="rotate(8 41 12)"/><ellipse cx="55" cy="23" rx="7" ry="10" transform="rotate(28 55 23)"/></g><path d="M32 27C24 27 21 34 14 41C6 49 11 62 21 62C26 62 28 59 32 59C36 59 39 62 44 62C55 62 59 49 51 41C44 34 40 27 32 27Z" fill="#29213d" stroke="#ffe7ba" stroke-width="2"/></svg>';
    badge.append(el('b', 'zero-effect-value', '0')); return badge;
  }
  function renderPlayers() {
    cardReveal.settleAll();
    const grid = $('playerGrid'), scrollTop = grid.scrollTop; grid.replaceChildren(); grid.classList.toggle('many', view.players.length > 4); grid.dataset.count = view.players.length;
    const held = presentationFrame && !presentationFrame.outcomeVisible;
    for (const player of view.players) {
      const p = held ? presentationPrevious?.find(old => old.id === player.id) || player : player;
      const block = el('div', 'battle-player' + (view.phase === 'play' && p.id === view.last ? ' last-bidder' : '') + (p.id === human ? ' self' : '') + (p.id === view.turn ? ' active' : '') + (p.eliminated ? ' eliminated' : ''));
      block.dataset.player = p.id;
      const info = el('div', 'player-info'); const playerName = el('div', 'player-name', name(p.id)); if(p.kind === 'human' && p.currentStreak >= 3) { const mark=el('span','streak-mark', p.currentStreak >= 5 ? ' ✦✦' : ' ✦'); mark.setAttribute('aria-label', p.currentStreak + '連勝'); playerName.append(mark); } const avatar=el('div','emote-anchor'); avatar.append(playerAvatar(p.id),el('div','emote-slot')); info.append(playerName, avatar);
      const hearts = el('div', 'hearts' + (p.life === 1 && !p.eliminated ? ' low-life' : '')); for (let i = 0; i < 3; i++) { const heart = el('span', 'life-heart', i < p.life ? '♥' : '♡'); heart.setAttribute('aria-hidden', 'true'); hearts.append(heart); } hearts.setAttribute('aria-label', name(p.id) + 'のライフ ' + p.life + ' / 3'); info.append(hearts);
      const card = view.hands[p.id], out = !Object.prototype.hasOwnProperty.call(view.hands, p.id) && p.eliminated;
      const hidden = !out && ((view.phase === 'play' && p.id === human) || (presentationFrame && !presentationFrame.revealedIds.includes(card?.id)));
      const node = cardNode(card, hidden, out);
      if (p.id === human) node.id = 'humanCard';
      if (!hidden && !out && card && view.phase !== 'play' && (!presentationFrame || presentationFrame.complete)) { node.dataset.detailCard = card.id; node.setAttribute('role','button'); node.tabIndex=0; }
      node.setAttribute('aria-label', out ? name(p.id) + ' 脱落' : hidden ? name(p.id) + 'の非公開カード' : name(p.id) + 'のカード ' + (card?.label || '?'));
      if (view.phase !== 'play' && card) { node.classList.add('presentation-card'); node.dataset.cardId = card.id; node.dataset.revealed = hidden ? 'back' : 'true'; }
      block.append(info, node);
      if (p.wins > 0 || (p.kind === 'human' && p.currentStreak > 0)) { const badge=el('span','wins-badge'); if(p.wins > 0) badge.append(el('span','', '通算' + p.wins + '勝')); if(p.kind === 'human' && p.currentStreak > 0) badge.append(el('span','', p.currentStreak + '連勝')); info.append(badge); }
      grid.append(block);
    }
    grid.scrollTop = scrollTop; paintEmotes(); paintTurnDisplay();
  }
  function renderStagedResult() {
    const r = view.result, f = presentationFrame;
    $('result').dataset.presentationPhase = f.phase;
    $('battlePhase').textContent = f.outcomeVisible && r.winner ? '対戦結果' : 'ラウンド結果';
    $('resultTitle').textContent = $('battlePhase').textContent;
    $('calculationHeading').textContent = ({hold:'グラビティ！',reveal:'カードを公開',extra:'もう1枚、公開',max:'最大の1枚を0に',sum:'数字を足して…',multiply:'合計を2倍！',compare:'宣言と比べる',outcome:'判定結果'})[f.phase] || '計算の流れ';
    const line = (label, expression) => { const row = el('div', 'calc-line'); if (label) row.append(el('div', '', label)); row.append(el('div', 'calc-expression', expression)); $('calculationSteps').append(row); };
    if (f.extraVisible && r.extraCard) { const extra = el('div', 'extra-reveal'); const card = cardNode(r.extraCard); if (f.phase === 'extra') card.classList.add('presentation-extra'); if (f.removedCardId === r.extraCard.id) { card.classList.add('is-zeroed'); card.append(zeroEffectBadge()); } extra.append(el('span', '', '「?」で追加公開'), card); $('calculationSteps').append(extra); }
    if (f.removedCardId && r.removedCard) line('MAX→0', r.removedCard.label + ' → 0');
    if (f.terms.length) line('', f.terms.map(t => t.value < 0 ? '(' + t.value + ')' : String(t.value)).join(' + ') + ' = ' + (f.multiplierApplied ? r.baseSum : f.runningTotal));
    if (f.multiplierApplied) line('×2', r.baseSum + ' × 2 = ' + r.sum);
    if (f.compareVisible) line(name(r.bidder) + 'の宣言', r.bid + (r.bid > r.sum ? ' > ' : ' ≤ ') + r.sum);
    $('totalLabel').textContent = f.compareVisible ? '最終合計' : '計算中'; sceneMotion.setNumber($('finalTotal'), f.compareVisible ? r.sum : f.runningTotal ?? null);
    $('resultAvatar').replaceChildren(playerAvatar(f.outcomeVisible ? r.winner || r.loser : r.challenger));
    const loser = view.players.find(p => p.id === r.loser);
    $('resultText').textContent = f.outcomeVisible ? r.winner ? name(r.winner) + 'の優勝！ 通算 ' + view.players.find(p => p.id === r.winner).wins + '勝' : name(r.loser) + (loser.eliminated ? ' が脱落' : ' のライフ −1') : name(r.challenger) + '「グラビティ！」';
    $('next').textContent = '結果を見る'; $('next').disabled = connectionBlocked;
  }
  function renderResult() {
    const lobbyReturn = $('returnRoomLobby');
    lobbyReturn.classList.toggle('hide', view.phase !== 'finished' || !!(presentationFrame && !presentationFrame.complete));
    lobbyReturn.disabled = connectionBlocked || !canManageLobby();
    const r = view.result; $('calculationSteps').replaceChildren();
    const resultMessage=document.querySelector('.result-message'); resultMessage.classList.toggle('win-challenge',!!r?.winner && r.winner===r.challenger && (!presentationFrame || presentationFrame.outcomeVisible)); resultMessage.classList.toggle('win-defense',!!r?.winner && r.winner===r.bidder && (!presentationFrame || presentationFrame.outcomeVisible));
    const me = view.players.find(p => p.id === human);
    $('streakSummary').textContent = me && r && (!presentationFrame || presentationFrame.outcomeVisible) ? '現在 ' + (me.currentStreak || 0) + '連勝　最高 ' + (me.bestStreak || 0) + '連勝' : '';
    if (!r) { $('resultText').textContent = ''; $('finalTotal').textContent = ''; return; }
    if (presentationFrame && !presentationFrame.complete) { renderStagedResult(); return; }
    $('result').dataset.presentationPhase = 'complete'; $('calculationHeading').textContent = '計算の流れ'; $('totalLabel').textContent = '最終合計';
    $('battlePhase').textContent = r.winner ? '対戦結果' : 'ラウンド結果';
    $('resultTitle').textContent = r.winner ? '対戦結果' : 'ラウンド結果';
    const numeric = [...Object.values(r.cards), ...(r.extraCard ? [r.extraCard] : [])].filter(c => c.kind === 'number');
    const line = (label, expression) => { const row = el('div', 'calc-line'); row.append(el('div', '', label), el('div', 'calc-expression', expression)); $('calculationSteps').append(row); };
    if (r.extraCard) {
      const extra = el('div', 'extra-reveal');
      const extraCard=cardNode(r.extraCard); extraCard.dataset.detailCard=r.extraCard.id; extraCard.setAttribute('role','button'); extraCard.tabIndex=0;
      extra.append(el('span', '', '「?」で追加公開'), extraCard);
      $('calculationSteps').append(extra);
    }
    if (r.removedCard) line('MAX→0：最大の数字1枚を0に', r.removedCard.label + ' → 0');
    line('数字の合計', (numeric.map(c => c.id === r.removedCard?.id ? '0' : c.value < 0 ? '(' + c.value + ')' : String(c.value)).join(' + ') || '0') + ' = ' + r.baseSum);
    if (r.multiplier !== 1) line('×2 の効果', r.baseSum + ' × 2 = ' + r.sum);
    if (r.reset) $('calculationSteps').append(el('div', 'calc-line', 'リセット：この判定後、全36枚を混ぜ直します。'));
    sceneMotion.setNumber($('finalTotal'), r.sum, { instant: !presenter.active });
    const loser = view.players.find(p => p.id === r.loser);
    $('resultAvatar').replaceChildren(playerAvatar(r.winner || r.loser));
    $('resultText').textContent = (r.bid > r.sum ? name(r.bidder) : name(r.challenger)) + 'の負け（' + r.bid + (r.bid > r.sum ? ' > ' : ' ≤ ') + r.sum + '）' + (r.winner ? '　' + name(r.winner) + 'の優勝！ 通算 ' + view.players.find(p=>p.id===r.winner).wins + '勝' : '');
    $('next').textContent = canManageLobby() ? (r.winner ? 'もう一度遊ぶ' : '次のラウンドへ　›') : (r.winner ? '次の対戦を待っています' : '次のラウンドを待っています');
    $('next').disabled = !canManageLobby(); paintTurnDisplay();
  }
  function renderBattle(previous = null) {
    const active = view.phase === 'play', yourTurn = active && view.turn === human && !connectionBlocked;
    (active ? $('gamePanel') : $('result')).prepend(emoteBar); syncEmoteButtons();
    document.querySelector('.nb-background')?.setAttribute('data-round-tone',String(view.round%3));
    gameplayFeedback.begin(roomEpoch + ':' + view.game + ':' + view.round);
    let startPresentation = false;
    if (active) { cancelPresentation(); presentationKey = null; $('resultAnnouncement').textContent = ''; }
    else if (view.result) {
      const key = roomEpoch + ':' + view.game + ':' + view.round;
      if (key !== presentationKey) {
        cancelPresentation(); presentationKey = key; sceneMotion.begin(key);
        if (previous?.phase === 'play' && screen === 'battleScreen') { presentationPrevious = previous.players; presentationFrame = window.NumberBluffPresentation.plan(view.result, view.players)[0]; startPresentation = true; }
      }
    }
    renderPlayers();
    if (startPresentation) for (const id of [view.result.challenger, view.result.bidder]) {
      const block = [...$('playerGrid').children].find(node => node.dataset.player === id);
      block?.classList.add('doubt-actor');
    }
    $('roundLabel').textContent = 'ラウンド ' + view.round; $('survivorCount').textContent = '生存者 ' + view.players.filter(p => !p.eliminated).length + '/' + view.players.length;
    document.querySelector('.turn-countdown')?.remove();
    if (active && view.turnClock) { const badge = el('span', 'turn-countdown'); badge.dataset.player = view.turn; $('battleTitle').append(badge); paintTurnDisplay(); }
    document.querySelector('.bid-panel').classList.toggle('has-bid', active && view.bid !== null);
    $('bid').textContent = view.bid ?? '—'; $('lastBidder').textContent = view.last ? name(view.last) + ' の宣言' : name(view.turn) + ' の番'; $('bidActor').replaceChildren(playerAvatar(view.last || view.turn));
    $('deckCount').textContent = '山札 ' + view.deckCount + '枚'; $('deckIndicator').dataset.layers = view.deckCount === 0 ? '0' : view.deckCount < 10 ? '1' : view.deckCount < 24 ? '2' : '3';
    $('battleScreen').classList.toggle('duel', active && view.players.filter(p=>!p.eliminated).length === 2); $('battleScreen').classList.toggle('spectating', active && !!view.players.find(p=>p.id===human)?.eliminated);
    $('battleScreen').classList.toggle('is-result', !active); $('battlePhase').textContent = view.phase === 'finished' ? '対戦結果' : 'ラウンド結果'; $('battlePhase').classList.toggle('hide', active); $('battleTitle').querySelector('.battle-meta').classList.toggle('hide', !active);
    $('gamePanel').classList.toggle('hide', !active); $('result').classList.toggle('hide', active); $('result').classList.toggle('open', !active);
    const alive = !view.players.find(p => p.id === human)?.eliminated;
    $('status').textContent = active ? yourTurn ? 'あなたの手番です' : alive ? name(view.turn) + ' が考えています…' : 'あなたは脱落しました。残りの対戦を見届けよう。' : '';
    $('declare').disabled = !yourTurn || !!pendingAction || view.bid === Number.MAX_SAFE_INTEGER;
    $('challenge').disabled = !yourTurn || !!pendingAction || view.bid === null;
    document.querySelectorAll('#keypad button').forEach(button => { button.disabled = !yourTurn; });
    if (yourTurn) { $('number').textContent = view.bid === null ? '1' : view.bid === Number.MAX_SAFE_INTEGER ? '' : String(view.bid + 1); suggested = true; }
    $('next').disabled = active; renderResult();
    if (active && previous && (previous.phase !== 'play' || previous.round !== view.round || previous.game !== view.game)) {
      audio.play('deal');
      const gridRect=$('playerGrid').getBoundingClientRect(), sourceX=gridRect.left+gridRect.width/2, sourceY=gridRect.top;
      if (!yourTurn) $('playerGrid').querySelectorAll('.player-card').forEach((node, i) => { const rect=node.getBoundingClientRect(); const clamp=n=>Math.max(-120,Math.min(120,n)); node.style.setProperty('--deal-x',clamp(sourceX-(rect.left+rect.width/2))+'px'); node.style.setProperty('--deal-y',clamp(sourceY-(rect.top+rect.height/2))+'px'); node.classList.add('presentation-card', 'is-dealing'); node.style.animationDelay = (i * 25) + 'ms'; });
    } else if (active && previous && previous.bid !== view.bid) {
      audio.play('declare');
      const panel = document.querySelector('.bid-panel'); panel.classList.remove('presentation-bid-pulse','bid-big'); void panel.offsetWidth; panel.classList.toggle('bid-big', previous.bid !== null && view.bid - previous.bid >= 10); panel.classList.add('presentation-bid-pulse');
    }
    if (active && previous?.phase === 'play' && previous.game === view.game && previous.round === view.round && previous.turn !== view.turn && !connectionBlocked && screen === 'battleScreen' && $('restartConfirm').classList.contains('hide')) {
      const player = [...$('playerGrid').children].find(n => n.dataset.player === view.turn);
      if (yourTurn) { const panel = document.querySelector('.input-console'); panel.classList.remove('turn-ready'); void panel.offsetWidth; panel.classList.add('turn-ready'); audio.play('turn'); }
      gameplayFeedback.play('turn', player?.querySelector('.avatar'), view.bid + ':' + view.turn);
    }
    if (active) { const target = [...$('playerGrid').children].find(n => n.dataset.player === view.turn)?.querySelector('.player-card'); cardReveal.gold({key: roomEpoch + ':' + view.game + ':' + view.round + ':' + view.turn + ':' + view.bid, node: target?.classList.contains('hidden') ? null : target}); }
    if (startPresentation) { presenter.play(presentationKey, view.result, view.players); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) presenter.skip(); }
    if (screen === 'battleScreen' && $('restartConfirm').classList.contains('hide')) {
      if (!active && previous?.phase === 'play') $('resultTitle').focus();
      else if (yourTurn && previous) $('status').focus({ preventScroll: true });
    }
  }
  function receive(next) {
    if (transport && view?.phase === 'reveal' && next.phase === 'reveal' && next.revision === view.revision && next.hostId === view.hostId && next.roundClock?.token === view.roundClock?.token && next.roundClock) { view = next; paintTurnDisplay(); return; }
    if (transport && view?.phase === 'play' && next.phase === 'play' && next.revision === view.revision && next.hostId === view.hostId && next.turnClock && next.turnClock.token === view.turnClock?.token) { view = next; paintTurnDisplay(); return; }
    const previous = view; view = next; clearError();
    if(pendingAction && (next.revision !== pendingAction.revision || next.phase !== 'play')) clearPendingAction();
    if ($('cardDetail').open && previous && (next.phase === 'play' || next.phase === 'lobby' || next.game !== previous.game || next.round !== previous.round)) $('cardDetail').close();
    if ($('discardDetail').open && previous && (next.phase !== previous.phase || next.game !== previous.game || next.round !== previous.round || next.turn !== previous.turn)) $('discardDetail').close();
    if (previous && (next.phase === 'lobby' || previous.game !== next.game || previous.round !== next.round)) clearEmotes();
    if (connectionMessage === 'ホストからの情報を待っています…' || (previous?.phase === 'lobby' && view.phase === 'play' && ['参加者が退出したため、対戦を中止してロビーに戻りました。', '参加者との接続が切れました。', '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。'].includes(connectionMessage))) { connectionMessage = ''; paintConnectionStatus(); }
    if (view.phase === 'lobby') { cancelPresentation(); presentationKey = null; renderLobby(); } else renderBattle(previous);
    const checkpoint = view.scoreCheckpoint, me = view.players.find(p => p.id === human);
    if (checkpoint && checkpoint.userIds?.includes(me?.userId)) publishSessionFinish(captureSessionFinish(checkpoint.reason, checkpoint.game));
  }
  function apply(next) {
    if (next === state) return false;
    timer.cancel(); state = next;
    const nextView = G.publicView(state, human);
    nextView.turnClock = localTurnClock.sync(state, human);
    const roundClock=localRoundClock.sync(state);
    nextView.roundClock=roundClock?{...roundClock,localDeadline:roundClock.deadline,localReadyAt:roundClock.readyAt}:null;
    // sync can expire a preserved deadline on background restoration.
    if (state !== next) return true;
    receive(nextView);
    if (state.phase === 'play' && state.turn !== human) {
      const captured = state;
      timer.schedule(() => {
        if (transport || state !== captured || state.phase !== 'play') return;
        const action = G.chooseBotAction(G.botView(state, state.turn), Math.random);
        if (!action) return;
        const updated = action.type === 'challenge' ? G.challenge(state, state.turn, Math.random) : G.declare(state, state.turn, action.value);
        if (updated !== state) { const botId=state.turn; apply(updated); if(Math.random()<.12) showEmote({player:botId,kind:Math.floor(Math.random()*4),game:view.game,round:view.round}); }
      }, 650 + Math.random() * 450);
    }
    return true;
  }
  function action(type, value) {
    if (!view || connectionBlocked) return false;
    if (transport && ['nextRound', 'rematch', 'returnToLobby'].includes(type) && !canManageLobby()) return false;
    if (transport) {
      const sentView=view, isMove=['declare','challenge'].includes(type); if(isMove&&pendingAction)return false;
      if(isMove){
        const pending={revision:view.revision,token:view.turnClock?.token,timer:null};pendingAction=pending;
        $('declare').disabled=true;$('challenge').disabled=true;$('status').textContent='確認中…';
        pending.timer=setTimeout(()=>{
          if(pendingAction!==pending)return;clearPendingAction();
          if(view?.revision===pending.revision&&!connectionBlocked){
            if(view.phase==='play'&&view.turn===human){
            $('declare').disabled=view.bid===Number.MAX_SAFE_INTEGER;$('challenge').disabled=view.bid===null;
            fail('確認できませんでした。現在の手番を確認してください。');}
            void Promise.resolve(transport?.resync?.()).catch(()=>{});
          }
        },4000);
      }
      Promise.resolve(transport.send({type,player:human,value,revision:view.revision,turnToken:view.turnClock?.token})).then(accepted=>{
        if(accepted===false&&isMove&&pendingAction?.revision===sentView.revision){clearPendingAction();if(view?.turn===human&&!connectionBlocked){$('declare').disabled=view.bid===Number.MAX_SAFE_INTEGER;$('challenge').disabled=view.bid===null;fail('操作を確認できませんでした。現在の手番を確認してください。');}}
      }).catch(()=>{if(isMove&&pendingAction?.revision!==sentView.revision)return;clearPendingAction();fail('接続を確認して、もう一度試してください。');if(isMove&&view?.turn===human&&!connectionBlocked){$('declare').disabled=view.bid===Number.MAX_SAFE_INTEGER;$('challenge').disabled=view.bid===null;}});return true;
    }
    if (localTurnClock.check() || localRoundClock.check()) return false;
    const next = G.dispatch(state, { type, player: human, value, revision: view.revision }, Math.random);
    return apply(next);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (event.isTrusted && button && !button.disabled && !button.matches('[data-sound-toggle]') && !['declare', 'challenge', 'beginGame', 'next'].includes(button.id)) audio.play('tap');
  });
  $('copyRoomId').onclick = async () => {
    const id = typeof view?.roomId === 'string' ? view.roomId : '';
    if (!id) return;
    const epoch = roomEpoch;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(id);
      if (epoch !== roomEpoch || view?.roomId !== id || screen !== 'lobbyScreen') return;
      $('roomCopyStatus').textContent = 'ルームIDをコピーしました。';
    } catch {
      if (epoch !== roomEpoch || view?.roomId !== id || screen !== 'lobbyScreen') return;
      $('roomCopyFallback').value = id; $('roomCopyFallback').classList.remove('hide');
      $('roomCopyFallback').focus(); $('roomCopyFallback').select();
      $('roomCopyStatus').textContent = '自動コピーできませんでした。選択されたIDをコピーしてください。';
    }
    $('roomCopyStatus').classList.remove('hide');
  };
  let exiting = false;
  async function exitRoom() {
    if (exiting) return;
    exiting = true;
    try {
      if (transport && roomAdapterExpected) {
        if (typeof roomActions.exit !== 'function') throw new Error('Exit unavailable');
        await roomActions.exit();
      }
      const finished = captureSessionFinish();
      if (screen === 'battleScreen') closeConfirm();
      $('roomId').value = ''; timer.cancel(); detachTransport(); state = null; view = null; show('homeScreen', 'startGame'); publishSessionFinish(finished);
    } catch {
      const status = $(screen === 'lobbyScreen' ? 'lobbyError' : 'onlineBattleStatus');
      status.textContent = '退出できませんでした。もう一度お試しください。'; status.classList.remove('hide');
    } finally { exiting = false; }
  }
  $('startGame').onclick = () => requestRoom('create'); $('lobbyBack').onclick = exitRoom;
  $('joinForm').onsubmit = event => { event.preventDefault(); const id = $('roomId').value.trim(); if (id) requestRoom('join', id); };
  $('refreshPublicRooms').onclick = async () => {
    const request = ++listRequest, list = $('publicRoomsList'), status = $('publicRoomsStatus');
    list.replaceChildren(); status.textContent = '取得中…';
    try {
      if (typeof roomActions.list !== 'function') throw new Error('unavailable');
      const rooms = await roomActions.list();
      if (request !== listRequest || screen !== 'joinPanel') return;
      if (!Array.isArray(rooms)) throw new TypeError('Invalid room list');
      if (!rooms.length) { status.textContent = '公開ルームはありません。'; return; }
      status.textContent = '公開ルーム ' + rooms.length + '件';
      for (const room of rooms) {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = room.roomId + '  ' + room.gamerNum + '/' + room.maxPlayers;
        button.onclick = () => requestRoom('join', room.roomId);
        list.append(button);
      }
    } catch {
      if (request === listRequest && screen === 'joinPanel') status.textContent = '公開ルーム一覧を取得できませんでした。';
    }
  };
  $('privateRoom').onchange = () => { $('roomCreateStatus').textContent = ''; };
  $('joinGame').onclick = () => { cancelRoomRequest(); show('joinPanel', 'roomId'); void $('refreshPublicRooms').onclick(); }; $('closeJoin').onclick = () => { cancelRoomRequest(); show('homeScreen', 'joinGame'); };
  $('addBot').onclick = addBot;
  $('removeBot').onclick = () => { if (transport) { lobbyAction('removeBot', { target: selectedBot }); return; } state = G.removeBot(state, selectedBot); view = G.publicView(state, human); renderLobby(); };
  document.querySelectorAll('[data-avatar]').forEach(button => { button.onclick = () => { if (transport) { lobbyAction('setBotAvatar', { target: selectedBot, avatar: Number(button.dataset.avatar) }); return; } avatarChoice[selectedBot] = Number(button.dataset.avatar); renderLobby(); }; });
  document.querySelectorAll('[data-difficulty]').forEach(button => { button.onclick = () => { nextDifficulty = button.dataset.difficulty; if (transport) lobbyAction('setDifficulty', { target: selectedBot, difficulty: nextDifficulty }); if (!transport) { state = G.setDifficulty(state, selectedBot, nextDifficulty); view = G.publicView(state, human); renderLobby(); } }; });
  $('beginGame').onclick = () => { if (transport) { lobbyAction('startGame'); return; } show('battleScreen'); apply(G.startGame(state, Math.random)); window.scrollTo(0, 0); $('status').focus({ preventScroll: true }); };
  $('declare').onclick = event => {
    if ($('declare').disabled || event.detail > 1) return;
    const value = G.parseBid($('number').textContent);
    if (value === null || (view?.bid !== null && value <= view?.bid) || !action('declare', value)) { fail('前より大きな1以上の整数を入力してください（最大9007199254740991）。'); $('declare').focus(); }
  };
  $('challenge').onclick = () => action('challenge');
  $('returnRoomLobby').onclick = () => { if (view?.phase !== 'finished' || presenter.active || connectionBlocked || !canManageLobby()) return; if (action('returnToLobby') && !transport) show('lobbyScreen', 'beginGame'); };
  $('next').onclick = event => { if (connectionBlocked) return; if (presenter.active) { nextReadyAt = performance.now() + 400; audio.stop(); specialEffects.stop(); cardReveal.settleAll(); sceneMotion.skip(); presenter.skip(); return; } if (event.detail > 1 || performance.now() < nextReadyAt) return; action(view.phase === 'finished' ? 'rematch' : 'nextRound'); };
  document.querySelectorAll('[data-digit]').forEach(button => { button.onclick = () => {
    if ($('declare').disabled) return;
    const prior = suggested ? '' : $('number').textContent, next = prior === '0' ? button.dataset.digit : prior + button.dataset.digit;
    if (next.length > 16 || G.parseBid(next) === null) { fail('入力できる最大の整数は9007199254740991です。'); return; }
    $('number').textContent = next; suggested = false; clearError();
  }; });
  $('backspace').onclick = () => { if (!$('declare').disabled) { $('number').textContent = $('number').textContent.slice(0, -1); suggested = false; clearError(); } };
  function confirmExit() { gameplayFeedback.stop(); specialEffects.stop(); cardReveal.settleAll(); sceneMotion.leave(); $('restartTitle').textContent = '対戦を終了してホームへ？'; $('restartText').textContent = '現在の対戦は終了します。続ける場合はキャンセルしてください。'; $('confirmRestart').textContent = '終了して戻る'; $('restartConfirm').classList.remove('hide'); $('homeBtn').setAttribute('aria-expanded', 'true'); $('cancelRestart').focus({preventScroll:true}); specialSVG.refresh(); }
  function closeConfirm() { $('restartConfirm').classList.add('hide'); $('homeBtn').setAttribute('aria-expanded', 'false'); $('homeBtn').focus({preventScroll:true}); syncCardMotion(); }
  $('homeBtn').onclick = confirmExit; $('cancelRestart').onclick = closeConfirm;
  $('confirmRestart').onclick = exitRoom;
  function overlay(id, trigger) { if (screen === 'homeScreen' || screen === 'joinPanel') cancelRoomRequest(); overlayReturn = { screen, trigger }; show(id); }
  function closeOverlay() { const back = overlayReturn || { screen: 'homeScreen', trigger: $('startGame') }; show(back.screen); back.trigger?.focus(); overlayReturn = null; }
  $('homeRules').onclick = () => { overlay('guidePanel', $('homeRules')); guide('rules'); };
  $('rulesBtn').onclick = () => { overlay('guidePanel', $('rulesBtn')); guide('rules'); };
  $('lobbyRules').onclick = () => { overlay('guidePanel', $('lobbyRules')); guide('rules'); };
  $('closeGuide').onclick = closeOverlay;
  document.querySelectorAll('.guide-tabs button[data-tab]').forEach(button => { button.onclick = () => guide(button.dataset.tab); });
  function guide(tab) {
    const container = $('guideContent'); container.replaceChildren(); container.dataset.tab = tab; $('guideTitle').textContent = ({rules:'遊び方',cards:'カード図鑑',bots:'BOTについて',examples:'計算例'})[tab];
    document.querySelectorAll('.guide-tabs button[data-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    if (tab === 'rules') {

      const steps = [['カードを配る','自分のカードだけ見えません。他の人のカードを見て、全員の合計を予想しよう。'],['数字を宣言','最初は1以上の整数。次の人は、前の宣言より大きな数を宣言します。'],['グラビティ！','直前の宣言が合計を超えていると思ったら、グラビティ！で挑戦。'],['勝敗判定','全カードを公開し、特殊効果を含めて合計。宣言が合計より大きければ宣言者の負け。合計以下なら、疑った側の負け。'],['最後まで生き残ろう','負けるとライフが1減り、0で脱落。最後の1人が優勝！次のラウンドは負けた人から（脱落した場合は、その判定で勝った人から）。']];
      steps.forEach(([title, text], index) => {
        const section = el('section', 'guide-step');
        section.append(el('b', 'step-number', index + 1), el('h3', '', title), el('p', '', text));
        section.append(window.NumberBluffGuideDiagrams.create(document, index)); if (index === 1) section.append(el('p', 'turn-rule-note', '1手30秒。時間切れは前の宣言＋1（初手は1）を自動宣言します。入力途中の数字は送信しません。計算演出の後、10秒で次のラウンドに進みます。優勝結果では自動再戦しません。')); container.append(section);
      });

    } else if (tab === 'cards') {
      container.append(el('h3', 'catalogue-label', '数字カード 32枚 · 全36枚'));
      const grouped = new Map(); for (const c of G.FULL_DECK) { const key = c.kind + ':' + c.value; if (!grouped.has(key)) grouped.set(key, { card: c, count: 0 }); grouped.get(key).count++; }
      const catalogue = el('div', 'catalogue');
      [...grouped.values()].filter(x => x.card.kind === 'number').sort((a, b) => a.card.value - b.card.value).forEach(({ card, count }) => { const item = el('button', 'catalogue-item'); item.type = 'button'; item.setAttribute('aria-label', card.label + ' の効果・' + count + '枚'); item.onclick = () => cardDetail(card, count); item.append(cardNode(card), el('small', '', '×' + count)); catalogue.append(item); });
      container.append(catalogue, el('h3', '', '特殊カード 4枚（各1枚）'));
      const specials = el('div', 'catalogue special-catalogue');
      [...grouped.values()].filter(x => x.card.kind !== 'number').forEach(({ card, count }) => { const item = el('button', 'catalogue-item'); item.type = 'button'; item.setAttribute('aria-label', cardLabel(card) + ' の効果'); item.onclick = () => cardDetail(card, count); item.append(cardNode(card), el('small', '', '×1')); specials.append(item); }); container.append(specials);
    } else if (tab === 'bots') {

      const descriptions = ['判断にゆらぎが多め。','見えているカードと公開済みの情報からバランスよく判断。','公開情報から合計の可能性を比較し、慎重に挑戦します。'];
      ['easy','normal','hard'].forEach((d, i) => { const row = el('div', 'guide-bot'), copy = el('div'); copy.append(el('h3', '', difficultyNames[d]), el('p', '', descriptions[i])); row.append(image(avatars[i]), copy); container.append(row); });
      container.append(el('p', '', 'BOTも自分のカードや山札の中身は見ていません。難易度を変えても、見える情報は同じです。'));
    } else {

      const samples = [
        ['通常の合計','3、5、−5 の場合','3 + 5 − 5 = 3',[3,5,-5],3],
        ['MAX→0','10、5、3 なら、10を1枚だけ0に','0 + 5 + 3 = 8',[10,5,3,'max0'],8],
        ['「?」の追加公開','追加で10が出た場合','5 + 4 + 10 = 19',[5,4,'extra'],19,10],
      ];
      for (const [title, text, expression, values, total, extra] of samples) {
        const row = el('section', 'example'), visual = el('div', 'example-visual'), cards = el('div', 'example-cards');
        const find = value => G.FULL_DECK.find(card => typeof value === 'number' ? card.kind === 'number' && card.value === value : card.kind === value);
        for (const value of values) cards.append(cardNode(find(value)));
        if (extra !== undefined) { const additional = el('div', 'example-extra'); additional.append(el('small', '', '追加'), cardNode(find(extra))); cards.append(additional); }
        const result = el('div', 'example-total'); result.append(el('span', '', '最終合計'), el('strong', '', total));
        visual.append(cards, result); row.append(el('h3', '', title), visual, el('div', 'example-expression', expression)); container.append(row);
      }
    }
    container.focus({ preventScroll: true });
  }
  function stopDetailEffect() { detailEffectEpoch++; specialEffects.stop(); specialSVG.refresh(); }
  function cardDetail(card, count) {
    const detailEpoch = ++detailEffectEpoch;
    const descriptions = { double: '数字の合計を2倍にします。マイナスの合計にも適用。例：(3 + 5 − 5) × 2 = 6。', max0: '場の最大の正の数字カードを1枚だけ0にします。同じ最大値が複数あっても1枚だけ。', extra: '判定時に山札から1枚だけ追加公開。数字も特殊効果も合計に反映。連鎖して追加はしません。', reset: '数字としては0。このラウンドの判定後に全36枚を混ぜ直します。合計自体を0にはしません。' };
    const body = $('cardDetailContent'); body.replaceChildren(cardNode(card), el('h2', '', cardLabel(card) + '（' + count + '枚）'), el('p', '', descriptions[card.kind] || (card.value < 0 ? '合計から ' + Math.abs(card.value) + ' を引きます。' : '合計に ' + card.value + ' を足します。'))); specialEffects.stop(); $('cardDetail').showModal(); $('closeCardDetail').focus(); syncCardMotion(); const detailFace=body.querySelector('.player-card'); detailFace.querySelector('img.card-art').decode().then(()=>{if(detailEpoch===detailEffectEpoch&&$('cardDetail').open&&detailFace.isConnected&&!detailFace.classList.contains('normal-card'))specialEffects.play(detailFace,{priority:true});}).catch(()=>{});
  }
  function openRevealedCard(target) {
    const node=target.closest('[data-detail-card]');if(!node||presenter.active||view?.phase==='play'||!view?.result||!node.isConnected)return;
    const card=[...Object.values(view.result.cards),view.result.extraCard].find(c=>c?.id===node.dataset.detailCard);
    if(card&&!node.classList.contains('hidden'))cardDetail(card,1);
  }
  $('battleScreen').addEventListener('click',event=>openRevealedCard(event.target));
  $('battleScreen').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-detail-card]')){event.preventDefault();openRevealedCard(event.target);}});
  $('cardDetail').addEventListener('click',event=>{if(event.target===$('cardDetail'))$('cardDetail').close();});
  $('closeCardDetail').onclick = () => { stopDetailEffect(); $('cardDetail').close(); specialSVG.refresh(); };
  $('cardDetail').addEventListener('cancel', stopDetailEffect);
  $('cardDetail').addEventListener('beforetoggle', event => { if(event.newState==='closed')stopDetailEffect(); });
  document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if ($('cardDetail').open) return; if (!$('restartConfirm').classList.contains('hide')) closeConfirm(); else if (screen === 'guidePanel') closeOverlay(); else if (screen === 'joinPanel') { cancelRoomRequest(); show('homeScreen', 'joinGame'); } });
  $('cardDetail').addEventListener('close', () => { stopDetailEffect(); syncCardMotion(); });
  window.addEventListener('pageshow', () => { syncCardMotion(); });
  window.addEventListener('pagehide', () => { stopTurnDisplay(); localTurnClock.pause(); localRoundClock.pause(); stopDetailEffect(); timer.cancel(); cancelPresentation(true); stopTurnDisplay(); });
  window.addEventListener('pageshow', event => { if (event.persisted && state && !transport) { const old = state; state = null; apply(old); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !transport) { localTurnClock.resume(); localRoundClock.resume(); } paintTurnDisplay(); if (!document.hidden && transport && !connectionBlocked) Promise.resolve(transport.resync?.()).catch(() => {}); });
  window.addEventListener('pageshow', () => { if (!transport) { localTurnClock.resume(); localRoundClock.resume(); } paintTurnDisplay(); if (transport && !connectionBlocked) Promise.resolve(transport.resync?.()).catch(() => {}); });
  // The SDK bridge provides the normalized stream; the UI never runs remote authority.
  function paintConnectionStatus() {
    for (const id of ['onlineLobbyStatus', 'onlineBattleStatus']) { $(id).textContent = connectionMessage; $(id).classList.toggle('hide', !connectionMessage); }
  }
  window.NumberBluffClient = Object.freeze({
    onSessionFinish(listener) {
      if (typeof listener !== 'function') throw new TypeError('Session finish listener must be a function.');
      sessionFinishListeners.add(listener); return () => sessionFinishListeners.delete(listener);
    },
    reportConnectionStatus(event) {
      if (event?.kind === 'send-recovered') { if (connectionMessage === '送信できませんでした。接続を確認してください。') { connectionMessage = ''; paintConnectionStatus(); } return; }
      const messages = { 'turn-number-limit': '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。', 'host-lost': 'ホストが退出しました。ホームに戻って参加し直してください。', 'host-timeout': 'ホストとの接続が切れました。ホームに戻って参加し直してください。', 'send-error': '送信できませんでした。接続を確認してください。', 'participant-timeout': '参加者との接続が切れました。', 'player-left-match-abandoned': '参加者が退出したため、対戦を中止してロビーに戻りました。', 'host-session-changed': 'ホストの接続が変わりました。ホームに戻って参加し直してください。', 'session-ended': '接続を終了しました。ホームに戻って参加し直してください。', 'join-waiting': 'ホストからの情報を待っています…', 'room-full': 'このルームは満員です。', 'profile-error': 'GRAVITYのプロフィールを取得できません。再読み込みしてください。' };
      if (!event || !messages[event.kind]) return;
      connectionMessage = messages[event.kind];
      if (['host-lost', 'host-timeout', 'host-session-changed', 'session-ended'].includes(event.kind)) connectionBlocked = true;
      paintConnectionStatus();
      if (screen === 'homeScreen' || screen === 'joinPanel' || !transport) { $('roomCreateStatus').textContent = connectionMessage; $('roomJoinStatus').textContent = connectionMessage; }
      if (view) { if (view.phase === 'lobby') renderLobby(); else renderBattle(); }
    },
    setViewportInsets(insets) {
      if (!insets || !['top', 'bottom'].every(key => typeof (insets[key] ?? 0) === 'number' && Number.isFinite(insets[key] ?? 0) && (insets[key] ?? 0) >= 0)) throw new TypeError('Insets require finite, nonnegative top/bottom pixel values.');
      for (const key of ['top', 'bottom']) document.documentElement.style.setProperty('--nb-host-' + key, (insets[key] ?? 0) + 'px');
      updateViewport();
    },
    onScreenChange(listener) {
      if (typeof listener !== 'function') throw new TypeError('Screen listener must be a function.');
      screenListeners.add(listener); listener(screenNames[screen]); return () => screenListeners.delete(listener);
    },
    setRoomRequestCanceler(cancel) { if (cancel !== null && typeof cancel !== 'function') throw new TypeError('Canceler must be a function.'); cancelRoomOperation = cancel; },
    setRoomAdapterExpected(required = true) { roomAdapterExpected = !!required; },
    configureRoomActions(actions) {
      if (!actions || typeof actions.create !== 'function' || typeof actions.join !== 'function') throw new TypeError('Room actions require create() and join(roomId).');
      roomAdapterExpected = true; roomActions = { create: actions.create, join: actions.join, list: actions.list, exit: actions.exit };
    },
    configureLocalProfile(profile) {
      if (!profile || typeof profile.name !== 'string' || !profile.name.trim()) throw new TypeError('Normalized profile requires name.');
      if (transport || (state && state.phase !== 'lobby')) throw new Error('Configure profile before starting a game.');
      localProfile = { name: profile.name.trim().slice(0, 24), avatarUrl: safeAvatar(profile.avatarUrl) };
      if (state) { state = { ...state, players: state.players.map(p => p.id === human ? { ...p, ...localProfile } : p) }; view = G.publicView(state, human); renderLobby(); }
    },
    connect(adapter, access = {}) {
      if (!adapter || typeof adapter.subscribe !== 'function' || typeof adapter.send !== 'function') throw new TypeError('Adapter requires subscribe(onPublicView) and send(action).');
      timer.cancel(); detachTransport(); transport = adapter; state = null; view = null;
      let first = true;
      unsubscribe = adapter.subscribe(publicState => {
        if (transport !== adapter) return;
        if (!publicState || typeof publicState.viewerId !== 'string' || !Array.isArray(publicState.players) || !publicState.players.some(player => player.id === publicState.viewerId && player.kind === 'human')) {
          throw new TypeError('Adapter public view must identify its authenticated human viewer.');
        }
        if (first) $('roomId').value = '';
        human = publicState.viewerId;
        $('roomCreateStatus').textContent = ''; $('roomJoinStatus').textContent = '';
        receive(publicState);
        if (first || screen === 'lobbyScreen' || (publicState.phase === 'lobby' && screen === 'battleScreen') || (screen === 'guidePanel' && overlayReturn?.screen === 'lobbyScreen' && publicState.phase !== 'lobby')) { overlayReturn = null; show(publicState.phase === 'lobby' ? 'lobbyScreen' : 'battleScreen'); first = false; }
      });
      unsubscribeEmotes = adapter.subscribeEmotes?.(event => { if (transport === adapter) showEmote(event); });
      const connection = adapter.getStatus?.(); if (connection?.kind) window.NumberBluffClient.reportConnectionStatus(connection);
    },
    disconnect() { $('roomId').value = ''; timer.cancel(); detachTransport(); state = null; view = null; show('homeScreen', 'startGame'); }
  });
})();


;

/* AgentSDK bridge. SDK contracts are supplied examples, not live-verified APIs.
 * Broadcast-only transport exposes current round cards to network inspection.
 * It NEVER sends the private draw pile or RNG. No cheat-proof secrecy is claimed. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./engine.js'),require('./round-advance-clock.js'));
  else root.NumberBluffGravity=factory(root.NumberBluff,root.NumberBluffRoundAdvanceClock);
})(typeof globalThis==='object'?globalThis:this,function(G,R){
  'use strict';
  const VERSION=1, TURN_MS=30000, LIMIT=48000, DIFFICULTIES=['easy','normal','hard'];
  const receivers=new WeakMap();
  const clone=x=>JSON.parse(JSON.stringify(x));
  const id=x=>typeof x==='string'&&x.length>0&&x.length<=128&&!/[\u0000-\u001f]/.test(x);
  const safeName=x=>typeof x==='string'&&x.trim()?x.trim().slice(0,24):'プレイヤー';
  function avatar(x){try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
  const profile=p=>({userId:p.userId,name:safeName(p.name),avatarUrl:avatar(p.avatarUrl)});
  function createSession(options){
    const {roomId,userId,hostUserId,sendMessage}=options;
    if(!id(roomId)||!id(userId)||!id(hostUserId)||typeof sendMessage!=='function')throw new TypeError('Verified room, user, host IDs and sendMessage are required.');
    const isHost=userId===hostUserId, rng=options.rng||Math.random, emoteRng=options.emoteRng||Math.random;
    const later=options.setTimeout||setTimeout, clear=options.clearTimeout||clearTimeout;
    const onStatus=typeof options.onStatus==='function'?options.onStatus:()=>{};
    const members=new Map(), listeners=new Set(), emoteListeners=new Set(), sequences=new Map(), seen=new Map(), emoteTimes=new Map(), emoteSequences=new Map(), emoteGenerations=new Map();
    const now=options.now||Date.now;
    const heartbeatMs=options.heartbeatMs??5000, timeoutMs=options.timeoutMs??30000;
    if(!Number.isFinite(heartbeatMs)||heartbeatMs<100||!Number.isFinite(timeoutMs)||timeoutMs<heartbeatMs*3)throw new RangeError('Use a bounded heartbeat and a timeout of at least three intervals.');
    let heartbeatTimer=null,lastHostSeen=now();
    let state=null, latest=null, closed=false, hostLost=false, timer=null, generation=0;
    let epoch=isHost?(options.epoch||String(Date.now())+'-'+String(Math.random()).slice(2)):null;
    let commandSequence=0, hostSequence=0, acceptedHostSequence=-1, emoteSequence=0, acceptedEmoteSequence=0, scheduledRevision=null, membershipSerial=0;
    let lastStatus=null, turnClock=null, turnTimer=null, turnGeneration=0, scoreCheckpoint=null, sendSerial=0, lastSendSuccess=0, lastSendFailure=0, sendErrorPending=false;
    const roundAdvance=R.create({now,set:later,clear,expire(){if(!isHost||closed||hostLost||state?.phase!=='reveal')return;state=G.nextRound(state,rng);publish('round-timeout');}});
    const status=(kind,detail={})=>{lastStatus={kind,...detail};onStatus({...lastStatus});};
    function cancel(){scheduledRevision=null;generation++;if(timer!==null)clear(timer);timer=null;}
    function emit(v){if(latest&&latest.revision===v.revision){const changed=['turnClock','roundClock'].some(key=>v[key]&&v[key].token===latest[key]?.token&&v[key].localDeadline!==latest[key].localDeadline);if(!changed)return;}latest=v;for(const fn of listeners)fn(clone(v));}
    function transmit(body){
      if(closed||hostLost)return Promise.resolve(false);
      const message=JSON.stringify({protocol:'number-bluff',version:VERSION,roomId,epoch,...body});
      if(message.length>LIMIT)throw new RangeError('Room message exceeds protocol limit.');
      const serial=++sendSerial;
      return Promise.resolve(sendMessage(message)).then(result=>{lastSendSuccess=Math.max(lastSendSuccess,serial);if(!closed&&!hostLost&&serial>lastSendFailure&&sendErrorPending){sendErrorPending=false;if(lastStatus?.kind==='send-error')status('send-recovered');else onStatus({kind:'send-recovered'});}return result;},error=>{lastSendFailure=Math.max(lastSendFailure,serial);if(!closed&&!hostLost&&serial>lastSendSuccess){sendErrorPending=true;status('send-error');}throw error;});
    }
    function seatFor(uid){return state?.players.find(p=>p.userId===uid);}
    function localize(wire){
      const me=wire.players.find(p=>p.userId===userId&&p.kind==='human');
      if(!me)return null;
      const v=clone(wire);v.viewerId=me.id;v.players=v.players.map(p=>({...p,avatarUrl:avatar(p.avatarUrl)}));
      if(v.phase==='play')v.hands[me.id]=null;
      if(v.turnClock)v.turnClock.localDeadline=now()+Math.max(0,Math.min(TURN_MS,v.turnClock.deadline-v.turnClock.serverNow));
      if(v.roundClock){v.roundClock.localDeadline=now()+Math.max(0,v.roundClock.deadline-v.roundClock.serverNow);v.roundClock.localReadyAt=now()+Math.max(0,v.roundClock.readyAt-v.roundClock.serverNow);}
      return v;
    }
    function cancelTurn(){turnGeneration++;if(turnTimer!==null)clear(turnTimer);turnTimer=null;}
    function currentTurnKey(){return state?.phase==='play'&&state.players.find(p=>p.id===state.turn)?.kind==='human'?[epoch,state.game,state.round,state.turn,state.history.length].join(':'):null;}
    function syncTurn(){
      if(!isHost||closed||hostLost){cancelTurn();turnClock=null;return;}
      const token=currentTurnKey();
      if(!token){cancelTurn();turnClock=null;return;}
      if(turnClock?.token!==token){cancelTurn();turnClock={token,player:state.turn,deadline:now()+TURN_MS};}
      if(turnTimer!==null)return;
      const generation=turnGeneration;
      turnTimer=later(()=>{if(generation!==turnGeneration||closed||hostLost)return;turnTimer=null;if(!expireTurn())syncTurn();},Math.max(1,turnClock.deadline-now()));
      if(typeof turnTimer?.unref==='function')turnTimer.unref();
    }
    function expireTurn(){
      if(!isHost||closed||hostLost||!turnClock||turnClock.token!==currentTurnKey()||now()<turnClock.deadline)return false;
      const player=turnClock.player,value=(state.bid??0)+1;
      cancelTurn();turnClock=null;
      // No legal +1 exists beyond JS safe integers. Never fabricate a challenge or loss.
      if(!Number.isSafeInteger(value)){state=G.returnToLobby(state);publish('turn-number-limit');return true;}
      const next=G.dispatch(state,{type:'declare',player,value,revision:state.revision},rng);
      if(next===state)return false;
      state=next;publish('turn-timeout');return true;
    }
    function scheduleBot(){
      if(timer!==null&&scheduledRevision===state.revision)return;
      cancel();if(!isHost||closed||hostLost||state.phase!=='play')return;
      const bot=state.players.find(p=>p.id===state.turn);if(bot?.kind!=='bot')return;
      const rev=state.revision,ticket=generation;scheduledRevision=rev;
      timer=later(()=>{timer=null;if(closed||hostLost||ticket!==generation||state.revision!==rev)return;
        const action=G.chooseBotAction(G.botView(state,bot.id),rng);
        if(action){const next=G.dispatch(state,{...action,player:bot.id,revision:rev},rng);if(next!==state){state=next;publish();if(emoteRng()<.12)relayEmote(bot.id,Math.floor(emoteRng()*4));}}
      },options.botDelay??650);
    }
    function publish(reason){
      if(state.phase!=='reveal')roundAdvance.cancel();
      if(expireTurn()||roundAdvance.check())return;syncTurn();roundAdvance.sync(state);
      G.assertInvariant(state);
      // Release 4 validates a 10s interval; preserve its wire shape while the
      // authoritative deadline remains the shorter BOT-only deadline. Presentation
      // still gates the button until the result is ready.
      const round=roundAdvance.get();
      const wire={...G.publicView(state,'__broadcast__'),hostId:seatFor(hostUserId).id,roomId,scoreCheckpoint,roundClock:round?{...round,readyAt:round.deadline-R.WAIT_MS,serverNow:now()}:null,turnClock:turnClock?{...turnClock,serverNow:now()}:null};delete wire.viewerId;wire.history=wire.history.slice(-100);wire.emoteGenerations=Object.fromEntries(state.players.filter(p=>p.kind==='human').map(p=>[p.id,emoteGenerations.get(p.userId)]));
      const own=localize(wire);if(own)emit(own);
      void transmit({type:'snapshot',sequence:++hostSequence,view:wire,reason:reason||null}).catch(()=>{});
      if(reason)status(reason);scheduleBot();
    }
    function addMember(raw){
      if(closed||!raw||!id(raw.userId))return false;
      const p=profile(raw);members.set(p.userId,p);seen.set(p.userId,now());
      if(!isHost||p.userId===hostUserId)return true;
      emoteGenerations.set(p.userId,++membershipSerial);emoteSequences.delete(p.userId);
      const existing=seatFor(p.userId);
      if(existing){sequences.delete(p.userId);state={...state,revision:state.revision+1,players:state.players.map(x=>x.id===existing.id?{...x,name:p.name,avatarUrl:p.avatarUrl}:x)};publish();return true;}
      if(state.phase!=='lobby'){status('join-waiting',{userId:p.userId});return false;}
      if(state.players.length>=8){const bot=state.players.find(x=>x.kind==='bot');if(bot)state=G.removeBot(state,bot.id);else {status('room-full');return false;}}
      const next=G.addBot(state);const added=next.players.find(x=>!state.players.some(y=>x.id===y.id));
      state={...next,players:next.players.map(x=>x.id===added.id?{...x,kind:'human',difficulty:null,...p}:x)};
      publish();return true;
    }
    function removeMember(uid){
      if(closed)return false;
      if(uid===hostUserId){hostLost=true;cancel();cancelTurn();roundAdvance.cancel();turnClock=null;stopHeartbeat();status('host-lost');return true;}
      if(!members.has(uid))return false;members.delete(uid);seen.delete(uid);sequences.delete(uid);emoteTimes.delete(uid);emoteSequences.delete(uid);emoteGenerations.delete(uid);
      if(!isHost)return true;
      const seat=seatFor(uid);if(!seat)return true;
      const active=state.phase!=='lobby';
      // Explicit abandonment policy: no fabricated move, life loss, bot takeover or win.
      if(active)state=G.returnToLobby(state);
      state={...state,revision:state.revision+1,players:state.players.filter(p=>p.id!==seat.id)};
      publish(active?'player-left-match-abandoned':'player-left');return true;
    }
    function emitEmote(event){for(const fn of emoteListeners)fn({...event});}
    function relayEmote(player,kind){const actor=state.players.find(p=>p.id===player);const event={player,kind,game:state.game,round:state.round,membership:actor?.kind==='human'?emoteGenerations.get(actor.userId):null};emitEmote(event);void transmit({type:'emote-relay',sequence:++emoteSequence,event}).catch(()=>{});}
    function processEmote(sender,kind){
      const actor=seatFor(sender), time=now();
      if(!isHost||closed||hostLost||!['play','reveal','finished'].includes(state?.phase)||!members.has(sender)||!actor||actor.kind!=='human'||!Number.isInteger(kind)||kind<0||kind>3||time-(emoteTimes.get(sender)??-Infinity)<3000)return false;
      emoteTimes.set(sender,time);relayEmote(actor.id,kind);return true;
    }
    function processAction(sender,action){
      if(!isHost||closed||hostLost||!members.has(sender)||!action||typeof action!=='object')return false;
      if(expireTurn()||roundAdvance.check())return false;
      const actor=seatFor(sender);if(!actor||actor.kind!=='human'||action.player!==actor.id||action.revision!==state.revision)return false;
      if(['declare','challenge'].includes(action.type)&&action.turnToken!==undefined&&action.turnToken!==turnClock?.token)return false;
      const manages=sender===hostUserId;let next=state;
      switch(action.type){
        case 'declare': case 'challenge': next=G.dispatch(state,{type:action.type,player:actor.id,value:action.value,revision:state.revision},rng);break;
        case 'nextRound': if(manages)next=G.nextRound(state,rng);break;
        case 'rematch': if(manages)next=G.rematch(state,rng);break;
        case 'returnToLobby': if(manages)next=G.returnToLobby(state);break;
        case 'startGame': if(manages)next=G.startGame(state,rng);break;
        case 'addBot': if(manages)next=G.addBot(state,action.difficulty||'normal');break;
        case 'removeBot': if(manages)next=G.removeBot(state,action.target);break;
        case 'setDifficulty': if(manages)next=G.setDifficulty(state,action.target,action.difficulty);break;
        case 'setBotAvatar': if(manages&&state.phase==='lobby'&&Number.isInteger(action.avatar)&&action.avatar>=0&&action.avatar<4&&state.players.some(p=>p.id===action.target&&p.kind==='bot'))next={...state,revision:state.revision+1,players:state.players.map(p=>p.id===action.target?{...p,botAvatar:action.avatar}:p)};break;
      }
      if(next===state)return false;if(state.phase==='finished'&&['rematch','returnToLobby'].includes(action.type))scoreCheckpoint={reason:action.type==='rematch'?'rematch-checkpoint':'lobby-checkpoint',game:state.game,userIds:state.players.filter(p=>p.kind==='human').map(p=>p.userId)};state=next;publish();return true;
    }
    function validSnapshot(v){
      if(!v||!['lobby','play','reveal','finished'].includes(v.phase)||!Number.isSafeInteger(v.revision)||v.revision<0||!Array.isArray(v.players)||v.players.length<1||v.players.length>8)return false;
      if(typeof v.rankingEligible!=='boolean')return false;
      if(v.emoteGenerations!==undefined&&(!v.emoteGenerations||typeof v.emoteGenerations!=='object'||Array.isArray(v.emoteGenerations)||Object.keys(v.emoteGenerations).length>8||!v.players.filter(p=>p?.kind==='human').every(p=>Number.isSafeInteger(v.emoteGenerations[p.id])&&v.emoteGenerations[p.id]>0)||!Object.keys(v.emoteGenerations).every(key=>v.players.some(p=>p?.id===key&&p.kind==='human'))))return false;
      if(v.scoreCheckpoint!=null){const c=v.scoreCheckpoint;if(!['rematch-checkpoint','lobby-checkpoint'].includes(c.reason)||!Number.isSafeInteger(c.game)||c.game<1||c.game>v.game||!Array.isArray(c.userIds)||c.userIds.length>8||!c.userIds.every(id))return false;}
      if(v.turnClock!==undefined&&v.turnClock!==null){const c=v.turnClock;if(v.phase!=='play'||typeof c.token!=='string'||c.token.length>256||c.player!==v.turn||!v.players.some(p=>p.id===c.player&&p.kind==='human')||!Number.isFinite(c.deadline)||!Number.isFinite(c.serverNow)||c.deadline-c.serverNow>TURN_MS)return false;}
      if(v.roundClock!==undefined&&v.roundClock!==null){const c=v.roundClock;if(v.phase!=='reveal'||typeof c.token!=='string'||c.token.length>256||!Number.isFinite(c.deadline)||!Number.isFinite(c.readyAt)||!Number.isFinite(c.serverNow)||![10000,...(v.players.some(p=>p?.kind==='human'&&p.life>0)?[]:[1000])].includes(c.deadline-c.readyAt)||c.readyAt-c.serverNow>10000)return false;}
      if('deck' in v||'rng' in v||!v.players.some(p=>p&&p.id===v.hostId&&p.userId===hostUserId&&p.kind==='human'))return false;
      if(new Set(v.players.map(p=>p?.id)).size!==v.players.length)return false;
      if(v.players.some(p=>!p||typeof p!=='object'||!/^p[1-8]$/.test(p.id)||!['human','bot'].includes(p.kind)||typeof p.name!=='string'||p.name.length>24||!Number.isInteger(p.life)||p.life<0||p.life>3||!Number.isSafeInteger(p.wins)||p.wins<0))return false;
      if(v.players.some(p=>['currentStreak','bestStreak'].some(key=>p[key]!==undefined&&(!Number.isSafeInteger(p[key])||p[key]<0))||(p.currentStreak||0)>(p.bestStreak||0)))return false;
      if(!v.hands||typeof v.hands!=='object'||!Array.isArray(v.discard)||v.discard.length>36||!Array.isArray(v.history)||v.history.length>1000)return false;
      const validCard=c=>c===null||(typeof c==='object'&&G.FULL_DECK.some(x=>x.id===c?.id&&x.kind===c.kind&&x.value===c.value&&x.label===c.label));
      const seat=x=>v.players.some(p=>p.id===x),optionalSeat=x=>x===null||seat(x);
      if(!Number.isSafeInteger(v.game)||v.game<0||!Number.isSafeInteger(v.round)||v.round<0||!Number.isInteger(v.deckCount)||v.deckCount<0||v.deckCount>36)return false;
      if(v.bid!==null&&(!Number.isSafeInteger(v.bid)||v.bid<1))return false;
      if(!optionalSeat(v.turn)||!optionalSeat(v.last)||!optionalSeat(v.starter))return false;
      if(v.players.some(p=>p.kind==='human'&&!id(p.userId)))return false;
      if(!Object.entries(v.hands).every(([key,c])=>seat(key)&&validCard(c))||!v.discard.every(c=>c!==null&&validCard(c)))return false;
      if(!v.history.every(a=>a&&typeof a==='object'&&seat(a.player)&&(['declare','challenge'].includes(a.type))&&(a.type!=='declare'||Number.isSafeInteger(a.value)&&a.value>=1)))return false;
      if(v.phase==='reveal'||v.phase==='finished'){
        const r=v.result;if(!r||typeof r!=='object'||!r.cards||typeof r.cards!=='object'||!Object.entries(r.cards).every(([key,c])=>seat(key)&&c!==null&&validCard(c)))return false;
        if(!validCard(r.extraCard)||!validCard(r.removedCard)||![r.sum,r.baseSum,r.bid].every(Number.isSafeInteger)||r.bid<1||![1,2].includes(r.multiplier)||typeof r.reset!=='boolean')return false;
        if(![r.loser,r.challenger,r.bidder].every(seat)||!optionalSeat(r.winner))return false;
      }else if(v.result!==null)return false;
      return true;
    }
    function receive(sender,raw){
      // sender MUST come from SDK envelope data.user_id, never from message JSON.
      if(closed||hostLost||!id(sender)||typeof raw!=='string'||raw.length>LIMIT)return false;
      let message;try{message=JSON.parse(raw);}catch{return false;}
      if(!message||message.protocol!=='number-bluff'||message.version!==VERSION||message.roomId!==roomId)return false;
      if(message.type==='bye'){
        if(sender!==hostUserId&&(!isHost||!members.has(sender)))return false;
        if(message.epoch!==epoch)return false;
        if(sender!==hostUserId&&message.revision!==state.revision)return false;
        return removeMember(sender);
      }
      if(message.type==='hello'||message.type==='resync'||message.type==='ping'){
        if(!isHost||!members.has(sender))return false;seen.set(sender,now());
        if(!seatFor(sender)&&state.phase==='lobby')addMember(members.get(sender));else if(message.type!=='ping')publish();return true;
      }
      if(message.type==='snapshot'){
        if(isHost||sender!==hostUserId||!id(message.epoch)||!Number.isSafeInteger(message.sequence)||message.sequence<=acceptedHostSequence||!validSnapshot(message.view))return false;
        if(epoch!==null&&epoch!==message.epoch){status('host-session-changed');return false;}
        if(latest&&message.view.revision<latest.revision)return false;
        lastHostSeen=now();
        const own=localize(message.view);if(!own){status('join-waiting');return false;}
        lastHostSeen=now();epoch=message.epoch;acceptedHostSequence=message.sequence;emit(own);if(message.reason)status(message.reason);return true;
      }
      if(message.type==='emote'){
        if(!isHost||message.epoch!==epoch||!members.has(sender)||message.membership!==emoteGenerations.get(sender)||message.game!==state?.game||message.round!==state?.round||!Number.isSafeInteger(message.sequence)||message.sequence<1||message.sequence<=(emoteSequences.get(sender)||0))return false;
        emoteSequences.set(sender,message.sequence);seen.set(sender,now());return processEmote(sender,message.kind);
      }
      if(message.type==='emote-relay'){
        const e=message.event;
        if(isHost||sender!==hostUserId||message.epoch!==epoch||!Number.isSafeInteger(message.sequence)||message.sequence<=acceptedEmoteSequence||!latest||!['play','reveal','finished'].includes(latest.phase)||!e||e.game!==latest.game||e.round!==latest.round||!latest.players.some(p=>p.id===e.player&&((p.kind==='human'&&e.membership===latest.emoteGenerations?.[p.id])||(p.kind==='bot'&&e.membership===null)))||!Number.isInteger(e.kind)||e.kind<0||e.kind>3)return false;
        acceptedEmoteSequence=message.sequence;emitEmote(e);return true;
      }
      if(message.type==='action'){
        if(!isHost||message.epoch!==epoch||!members.has(sender)||!Number.isSafeInteger(message.sequence)||message.sequence<=0||message.sequence<=(sequences.get(sender)||0))return false;
        seen.set(sender,now());
        if(message.action?.revision!==state.revision){publish();return false;}
        sequences.set(sender,message.sequence);
        const accepted=processAction(sender,message.action);if(!accepted)publish();return accepted;
      }
      return false;
    }
    function stopHeartbeat(){if(heartbeatTimer!==null)clear(heartbeatTimer);heartbeatTimer=null;}
    function heartbeat(){
      if(closed||hostLost||options.heartbeat===false)return;
      heartbeatTimer=later(()=>{heartbeatTimer=null;if(closed||hostLost)return;
        if(isHost){
          for(const uid of Array.from(members.keys()))if(uid!==userId&&now()-(seen.get(uid)??now())>=timeoutMs){removeMember(uid);status('participant-timeout',{userId:uid});}
          publish();
        }else if(now()-lastHostSeen>=timeoutMs){hostLost=true;cancel();cancelTurn();roundAdvance.cancel();status('host-timeout');return;}
        else void transmit({type:'ping'}).catch(()=>{});
        heartbeat();
      },heartbeatMs);
      if(typeof heartbeatTimer?.unref==='function')heartbeatTimer.unref();
    }
    const self=profile({userId,name:options.name,avatarUrl:options.avatarUrl});members.set(userId,self);if(isHost)emoteGenerations.set(userId,++membershipSerial);
    if(isHost){state=G.createLobby({name:self.name,botCount:0});state={...state,players:state.players.map(p=>({...p,...self}))};}
    for(const member of options.members||[])if(member&&id(member.userId)){members.set(member.userId,profile(member));seen.set(member.userId,now());}
    const adapter={
      subscribe(fn){if(typeof fn!=='function')throw new TypeError('Listener required');listeners.add(fn);if(latest)fn(clone(latest));return()=>listeners.delete(fn);},
      supportsEmotes(){return isHost||Number.isSafeInteger(latest?.emoteGenerations?.[latest.viewerId]);},
      subscribeEmotes(fn){if(typeof fn!=='function')throw new TypeError('Listener required');emoteListeners.add(fn);return()=>emoteListeners.delete(fn);},
      sendEmote(kind){if(closed||hostLost||!Number.isInteger(kind)||kind<0||kind>3)return Promise.resolve(false);if(isHost)return Promise.resolve(processEmote(userId,kind));if(!epoch||!['play','reveal','finished'].includes(latest?.phase)||!Number.isSafeInteger(latest?.emoteGenerations?.[latest.viewerId]))return Promise.resolve(false);return transmit({type:'emote',kind,sequence:++commandSequence,membership:latest.emoteGenerations?.[latest.viewerId],game:latest.game,round:latest.round});},
      send(action){if(closed||hostLost)return Promise.reject(new Error('Room is disconnected.'));if(isHost)return Promise.resolve(processAction(userId,action));if(!epoch)return Promise.reject(new Error('Waiting for host.'));return transmit({type:'action',sequence:++commandSequence,action});},
      receive,addMember,removeMember,
      resync(){return isHost?(publish(),Promise.resolve()):transmit({type:'resync'});},
      close(){if(closed)return;void transmit({type:'bye',revision:latest?.revision}).catch(()=>{});closed=true;cancel();cancelTurn();roundAdvance.cancel();turnClock=null;stopHeartbeat();listeners.clear();emoteListeners.clear();emoteTimes.clear();emoteSequences.clear();emoteGenerations.clear();status('closed');},
      getStatus(){return {...(lastStatus||{}),roomId,isHost,closed,hostLost,ready:!!latest};}
    };
    if(isHost){for(const member of members.values())if(member.userId!==userId)addMember(member);publish();}
    else void transmit({type:'hello'}).catch(()=>{});
    heartbeat();
    return Object.freeze(adapter);
  }

  async function install({sdk,client,normalizeMember,normalizeProfile,onStatus,rng,discoveryMs=1000}={}){
    if(!sdk?.user?.getMyUserInfo||!sdk?.room?.create||!sdk?.room?.join||!sdk?.room?.receiveMessage||!sdk?.room?.sendMessage)throw new TypeError('AgentSDK user and room methods are required.');
    if(!client?.configureRoomActions)throw new TypeError('NumberBluffClient is required.');
    client.setRoomAdapterExpected(true);
    const own=await sdk.user.getMyUserInfo();if(own?.errno!==0||!id(String(own.data?.user_id||'')))throw new Error('GRAVITY profile unavailable.');
    const myId=String(own.data.user_id);
    const supplied=normalizeProfile?normalizeProfile(own.data):{name:own.data.name||own.data.user_name,avatarUrl:own.data.portrait||own.data.portait};
    const me=profile({userId:myId,...supplied});me.userId=myId;client.configureLocalProfile(me);
    const member=raw=>{const p=normalizeMember?normalizeMember(raw):{userId:String(raw?.user_id||''),name:raw?.user_name||raw?.name,avatarUrl:raw?.portrait||raw?.portait};return id(p?.userId)?profile(p):null;};
    let active=null, pending=false, listenerGeneration=0, requestGeneration=0, discovery=null, activeRoom=null, nativeJoined=false, leaving=null, allowUnscopedMembership=true;
    const admissions=new Map();
    async function leave(){
      if(leaving)return leaving;
      if(!nativeJoined)return;
      leaving=(async()=>{
        if(typeof sdk.room.exit!=='function')throw new Error('GRAVITY exit unavailable.');
        const result=await sdk.room.exit();
        if(result?.errno!==0)throw new Error('GRAVITY exit failed.');
        nativeJoined=false;admissions.clear();listenerGeneration++;discovery=null;activeRoom=null;active?.close();active=null;
      })();
      try{return await leaving;}finally{leaving=null;}
    }
    function attachReceiver(handler){
      let receiver=receivers.get(sdk.room);
      if(!receiver){receiver={handler,everEntered:true};receivers.set(sdk.room,receiver);allowUnscopedMembership=true;sdk.room.receiveMessage(payload=>receiver.handler?.(payload));}
      else {allowUnscopedMembership=!receiver.everEntered;receiver.everEntered=true;receiver.handler=handler;}
    }
    function sendControl(body){return Promise.resolve(sdk.room.sendMessage({message:JSON.stringify({protocol:'number-bluff',version:VERSION,...body})})).then(r=>{if(r?.errno!==undefined&&r.errno!==0)throw new Error('GRAVITY send failed.');});}
    function handle(payload){
      if(!payload?.data)return;const data=payload.data,uid=String(data.user_id||'');
      if(data.room_id!==undefined&&String(data.room_id)!==activeRoom)return;
      // Once a room has been replaced, an unscoped membership event may belong
      // to the previous room. Do not apply it to the new session.
      if(data.room_id===undefined&&!allowUnscopedMembership&&['aitools_game_joinroom','aitools_game_exitroom'].includes(payload.type))return;
      if(payload.type==='aitools_game_sendmsg'&&id(uid)&&typeof data.msg_data==='string'&&data.msg_data.length<=LIMIT){
        let m;try{m=JSON.parse(data.msg_data);}catch{}
        if(m?.protocol==='number-bluff'&&m.version===VERSION&&m.roomId===activeRoom){
          if(m.type==='host-discover'&&active?.getStatus().isHost&&id(m.nonce)&&uid!==myId){
            for(const [key,value] of admissions)if(value.expires<Date.now())admissions.delete(key);
            if(admissions.size<32||admissions.has(uid)){
              const ticket=String(Date.now())+'-'+String(Math.random()).slice(2);
              admissions.set(uid,{ticket,nonce:m.nonce,expires:Date.now()+15000});
              void sendControl({roomId:activeRoom,type:'host-claim',nonce:m.nonce,ticket}).catch(()=>{});
            }
          }
          if(m.type==='member-confirm'&&active?.getStatus().isHost){
            const pending=admissions.get(uid);
            if(pending&&pending.expires>=Date.now()&&m.ticket===pending.ticket&&m.nonce===pending.nonce){
              admissions.delete(uid);
              active.addMember(profile({userId:uid,name:m.name,avatarUrl:m.avatarUrl}));
            }
          }
          if(m.type==='host-claim'&&discovery&&m.nonce===discovery.nonce&&discovery.roster.has(uid)&&uid!==myId){
            discovery.claims.add(uid);if(id(m.ticket))discovery.tickets.set(uid,m.ticket);
            if(discovery.pinned&&uid!==discovery.pinned){active?.close();active=null;onStatus?.({kind:'host-session-changed'});}
          }
        }
      }
      if(!active)return;
      if(payload.type==='aitools_game_sendmsg')active.receive(uid,data.msg_data);
      else if(payload.type==='aitools_game_joinroom'){const p=member(data);if(p)active.addMember(p);}
      else if(payload.type==='aitools_game_exitroom')active.removeMember(uid);
    }
    async function enter(kind,requestedId,permission=0){
      // A canceled request may have entered a native room even if cleanup failed.
      // A later user retry first attempts the outstanding exit, never a second create.
      if(nativeJoined&&!active&&!pending&&!leaving)await leave();
      if(pending||nativeJoined||leaving)throw new Error('Room request already pending or room not exited.');pending=true;const request=++requestGeneration;
      try{
        if(kind==='join'&&!id(requestedId))throw new TypeError('Room ID required.');
        if(kind==='create'&&permission!==0&&permission!==1)throw new TypeError('Invalid room permission.');
        const result=await (kind==='create'?sdk.room.create({max_players:8,room_permission:permission}):sdk.room.join({room_id:requestedId}));
        if(result?.errno!==0)throw new Error('GRAVITY room request failed.');
        nativeJoined=true;
        if(request!==requestGeneration)throw new Error('Room request canceled.');
        if(active)active.close();active=null;
        const data=result.data||{},roomId=String(data.room_id||requestedId||'');
        if(!id(roomId))throw new Error('Verified room ID required.');
        const buffered=[],generation=++listenerGeneration;activeRoom=roomId;
        attachReceiver(payload=>{if(generation!==listenerGeneration)return;handle(payload);if(!active&&buffered.length<64)buffered.push(payload);});
        let hostUserId=myId;
        if(kind==='join'){
          const roster=new Set((Array.isArray(data.user_list)?data.user_list:[]).map(member).filter(Boolean).map(p=>p.userId));
          const nonce=String(Date.now())+'-'+String(Math.random()).slice(2);
          discovery={nonce,roster,claims:new Set(),tickets:new Map(),pinned:null};
          await sendControl({roomId,type:'host-discover',nonce});
          await new Promise(resolve=>setTimeout(resolve,discoveryMs));
          if(request!==requestGeneration)throw new Error('Room request canceled.');
          if(discovery.claims.size!==1)throw new Error('Host discovery ambiguous or unavailable.');
          hostUserId=[...discovery.claims][0];discovery.pinned=hostUserId;
        }else discovery=null;
        if(request!==requestGeneration)throw new Error('Room request canceled.');
        if(!id(roomId)||!id(hostUserId))throw new Error('Verified room and host IDs are required.');
        active=createSession({roomId,userId:myId,hostUserId,name:me.name,avatarUrl:me.avatarUrl,rng,onStatus,
          members:Array.isArray(data.user_list)?data.user_list.map(member).filter(Boolean):[],
          sendMessage:async message=>{const response=await sdk.room.sendMessage({message});if(response?.errno!==undefined&&response.errno!==0)throw new Error('GRAVITY send failed.');}
        });for(const payload of buffered)handle(payload);
        if(kind==='join'&&discovery?.tickets.has(hostUserId))await sendControl({roomId,type:'member-confirm',nonce:discovery.nonce,ticket:discovery.tickets.get(hostUserId),name:me.name,avatarUrl:me.avatarUrl});
        return active;
      }catch(error){if(nativeJoined){try{await leave();}catch{onStatus?.({kind:'exit-error'});}}throw error;}finally{pending=false;}
    }
    async function list(){
      if(typeof sdk.room.getPublicRoomList!=='function')throw new Error('Public room list unavailable.');
      const result=await sdk.room.getPublicRoomList();
      if(result?.errno!==0||!Array.isArray(result.data?.list))throw new Error('Public room list failed.');
      return result.data.list.map(r=>{
        const roomId=String(r?.room_id||'');
        if(!id(roomId)||!Number.isInteger(r.max_players)||r.max_players<1||!Number.isInteger(r.gamer_num)||r.gamer_num<0||r.gamer_num>r.max_players)throw new Error('Invalid room list.');
        return {roomId,maxPlayers:r.max_players,gamerNum:r.gamer_num,createTime:r.create_time};
      });
    }
    client.configureRoomActions({create:permission=>enter('create',undefined,permission),join:roomId=>enter('join',roomId),list,exit:leave});
    return Object.freeze({resync:()=>active?.resync(),close:()=>{requestGeneration++;if(nativeJoined)void leave().catch(()=>onStatus?.({kind:'exit-error'}));},getSession:()=>active});
  }
  return Object.freeze({createSession,install,protocolVersion:VERSION,turnDurationMs:TURN_MS});
});


;

/* GRAVITY platform shell, based on user-provided AI Studio specifications.
 * Real-device SDK behavior and the user_list host ordering remain unverified. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    root.NumberBluffPlatform = factory();
    if (root.AgentSDK) void root.NumberBluffPlatform.start({ window: root }).catch(() => {});
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const installations = new WeakMap();
  function exclusionHeight(height) { return Number.isFinite(height) && height >= 812 ? 98 : 74; }
  async function start(options = {}) {
    const win = options.window || globalThis.window, client = options.client || win?.NumberBluffClient;
    const sdk = options.sdk || win?.AgentSDK, adapter = options.adapter || win?.NumberBluffGravity;
    if (!win || !client) throw new TypeError('Window and NumberBluffClient are required.');
    if (!sdk) return null; // An ordinary browser keeps its existing layout and offline mode.
    if (installations.has(win)) return installations.get(win);
    client.setRoomAdapterExpected(true);
    const promise = setup(); installations.set(win, promise);
    try { return await promise; } catch (error) { installations.delete(win); client.reportConnectionStatus({ kind: 'profile-error' }); throw error; }
    async function setup() {
      if (!adapter?.install) throw new TypeError('GRAVITY adapter is required.');
      let bridge = null, closed = false, top = exclusionHeight(win.innerHeight), lastWidth = win.innerWidth;
      let latestSession=-1, checkpointGames=Object.create(null);
      function alreadySent(result){
        if(result.sessionId<latestSession)return true;
        if(result.sessionId>latestSession){latestSession=result.sessionId;checkpointGames=Object.create(null);}
        const game=result.game||0, previous=checkpointGames[result.reason];if(previous!==undefined&&game<=previous)return true;checkpointGames[result.reason]=game;return false;
      }
      const update = () => {
        // Keep the native-header band stable while a software keyboard shrinks the viewport.
        const active = win.document?.activeElement;
        const widthChanged = win.innerWidth !== lastWidth; lastWidth = win.innerWidth;
        if (widthChanged || !active || !/^(INPUT|TEXTAREA)$/.test(active.tagName)) top = exclusionHeight(win.innerHeight);
        client.setViewportInsets({ top, bottom: 0 });
      };
      update();
      bridge = await adapter.install({ sdk, client, onStatus: event => client.reportConnectionStatus(event) });
      client.setRoomRequestCanceler?.(() => bridge.close());
      const unsubscribe = client.onSessionFinish(result => {
        // User-selected checkpoints: explicit exit, host rematch or return to lobby.
        // Native UI interruption/acknowledgment behavior is not documented; verify on device.
        if (closed || !result || !['explicit-exit','rematch-checkpoint','lobby-checkpoint'].includes(result.reason) ||
            typeof result.roomId !== 'string' || !result.roomId ||
            !Number.isSafeInteger(result.sessionId) || result.sessionId < 0 ||
            typeof result.viewerId !== 'string' || result.player?.id !== result.viewerId ||
            result.player?.kind !== 'human' || !Number.isSafeInteger(result.player.bestStreak) || result.player.bestStreak < 0) return;
        if (result.reason !== 'explicit-exit' && (!Number.isSafeInteger(result.game) || result.game < 1)) return;
        if (alreadySent(result)) return;
        // Send the locally tracked best; native acceptance/high-score retention is unverified.
        // Send only their authoritative
        // best streak from this play session, even if their current streak is now 0.
        win.parent.postMessage({ type: 'gameOver', score: result.player.bestStreak }, '*');
      });
      const resume = () => { if (!closed && !win.document?.hidden) Promise.resolve(bridge.resync()).catch(() => {}); };
      win.addEventListener('resize', update); win.document?.addEventListener('focusout', update);
      win.document?.addEventListener('visibilitychange', resume);
      const pagehide = () => { bridge.close(); client.reportConnectionStatus({ kind: 'session-ended' }); };
      win.addEventListener('pagehide', pagehide);
      return Object.freeze({
        resync: resume,
        close() {
          if (closed) return; closed = true; unsubscribe(); bridge.close(); client.setRoomRequestCanceler?.(null);
          win.removeEventListener('resize', update); win.removeEventListener('pagehide', pagehide);
          win.document?.removeEventListener('focusout', update); win.document?.removeEventListener('visibilitychange', resume);
          installations.delete(win);
        }
      });
    }
  }
  return Object.freeze({ start, exclusionHeight });
});


window.NumberBluffBootReady=true;
} catch(error) { window.NumberBluffBootError=error; }
