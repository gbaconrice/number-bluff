'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../engine');
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const bots=state=>state.players.filter(player=>player.kind==='bot');
const resolved=state=>bots(state).map(player=>player.botCharacterId);

test('the character catalog has four direct choices and sixteen named random-only portraits',()=>{
 assert.equal(G.BOT_CHARACTERS.length,20);
 assert.equal(new Set(G.BOT_CHARACTERS.map(character=>character.id)).size,20);
 assert.equal(G.MAIN_BOT_CHARACTERS.length,4);
 assert.equal(G.BOT_CHARACTERS.filter(character=>character.randomOnly).length,16);
 assert.deepEqual(G.BOT_CHARACTERS.slice(4).map(character=>[character.id,character.name]),[
  ['crowned-black-cat','くろもち'],['amber-fox','こはく'],['sleepy-bear','ねむくま'],['moon-owl','ふくまる'],
  ['tanuki','ぽんまる'],['hedgehog','ころはり'],['sheep','わたもこ'],['squirrel','くるり'],
  ['chick','ぴよもち'],['deer','すずしか'],['seal','ぷくまる'],['otter','すいまる'],
  ['dog','ゆきいぬ'],['panda','まめぱん'],['penguin','ぺんころ'],['moon-spirit','つきもち']
 ]);
 assert.ok(G.BOT_CHARACTERS.slice(4).every(character=>character.image===`assets/bot-${character.id}.webp`));
});

test('lobby selection rejects unknown or already-used main characters and permits many random seats',()=>{
 let state=G.createLobby({botCount:3,difficulty:'hard'});
 const [first,second,third]=bots(state);
 const chosen=first.botSelection;
 assert.equal(G.setBotSelection(state,first.id,'unlisted-character'),state);
 assert.equal(G.setBotSelection(state,second.id,chosen),state);
 state=G.setBotSelection(state,first.id,'random');
 state=G.setBotSelection(state,second.id,'random');
 state=G.setBotSelection(state,third.id,'random');
 assert.ok(bots(state).every(player=>player.botSelection==='random'));
 assert.ok(bots(state).every(player=>player.difficulty==='hard'));
 state=G.setBotSelection(state,second.id,chosen);
 assert.equal(G.botCharacterSelection(bots(state)[1]),chosen);
 assert.ok(G.assertInvariant(state));
});

test('host start resolves every random BOT uniquely while preserving fixed choices, difficulty, and seat IDs',()=>{
 let lobby=G.createLobby({name:'Human profile',botCount:7,difficulty:'easy'});
 const seatIds=bots(lobby).map(player=>player.id),fixed=bots(lobby)[0].botSelection;
 for(const player of bots(lobby).slice(1))lobby=G.setBotSelection(lobby,player.id,'random');
 const human={...lobby.players[0],name:'Human profile'};
 const game=G.startGame(lobby,seeded(33),seeded(91));
 const gameBots=bots(game),assigned=resolved(game);
 assert.equal(new Set(assigned).size,7);
 assert.ok(assigned.every(id=>G.BOT_CHARACTERS.some(character=>character.id===id)));
 assert.equal(gameBots.find(player=>player.id===seatIds[0]).botCharacterId,fixed);
 assert.ok(gameBots.filter(player=>player.botSelection==='random').every(player=>player.botCharacterId!==fixed));
 assert.deepEqual(gameBots.map(player=>player.id).sort(),seatIds.sort());
 assert.ok(gameBots.every(player=>player.difficulty==='easy'));
 assert.deepEqual(game.players.find(player=>player.id===human.id).name,human.name);
 assert.ok(G.assertInvariant(game));
});

test('character randomness is independent from deck, hands, and turn shuffle',()=>{
 const lobby=G.createLobby({botCount:3}),randomLobby={...lobby,players:lobby.players.map(player=>player.kind==='bot'?{...player,botSelection:'random',botCharacterId:undefined,botAvatar:undefined}:player)};
 const fixed=G.startGame(lobby,seeded(711),seeded(1)),random=G.startGame(randomLobby,seeded(711),seeded(882));
 assert.deepEqual(fixed.players.map(player=>player.id),random.players.map(player=>player.id));
 assert.deepEqual(fixed.deck,random.deck);
 assert.deepEqual(fixed.hands,random.hands);
 assert.equal(fixed.turn,random.turn);
 assert.ok(new Set(resolved(random)).size===3);
});

test('rematch draws a fresh random roster and room return forgets only random resolutions',()=>{
 let characterCalls=0;const characterRng=()=>{characterCalls++;return (characterCalls%17)/20;};
 let lobby=G.createLobby({botCount:2,difficulty:'normal'});
 for(const player of bots(lobby))lobby=G.setBotSelection(lobby,player.id,'random');
 const first=G.startGame(lobby,seeded(4),characterRng),initialCalls=characterCalls;
 const finished={...first,phase:'finished',result:{winner:first.players[0].id}};
 const again=G.rematch(finished,seeded(5),characterRng);
 assert.equal(characterCalls-initialCalls,2);
 assert.equal(again.game,first.game+1);
 assert.deepEqual(bots(again).map(player=>player.id).sort(),bots(first).map(player=>player.id).sort());
 assert.ok(bots(again).every(player=>player.botSelection==='random'&&player.botCharacterId));
 assert.ok(new Set(resolved(again)).size===2);
 const returned=G.returnToLobby(again);
 assert.ok(bots(returned).every(player=>player.botSelection==='random'&&!player.botCharacterId&&player.difficulty==='normal'));
 assert.ok(G.assertInvariant(returned));
});
