'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const G=require('../engine');
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const bots=state=>state.players.filter(player=>player.kind==='bot');
const resolved=state=>bots(state).map(player=>player.botCharacterId);
function webpMetadata(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'complete RIFF payload');
 for(let offset=12;offset+8<=bytes.length;){
  const chunk=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),data=offset+8;
  assert.ok(data+size<=bytes.length,`${chunk} chunk stays inside the file`);
  if(chunk==='VP8X')return{width:1+bytes.readUIntLE(data+4,3),height:1+bytes.readUIntLE(data+7,3),alpha:(bytes[data]&16)!==0};
  if(chunk==='VP8L'&&bytes[data]===0x2f)return{width:1+bytes[data+1]+((bytes[data+2]&63)<<8),height:1+((bytes[data+2]>>6)|(bytes[data+3]<<2)|((bytes[data+4]&15)<<10)),alpha:(bytes[data+4]&16)!==0};
  offset=data+size+(size&1);
 }
 throw new Error('WebP has no supported image header');
}

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

test('all random-only portraits are present, transparent 384px WebP and provenance hashes match',()=>{
 const records=require('../assets/provenance.json').assets.filter(asset=>asset.file.startsWith('bot-'));
 const randomCharacters=G.BOT_CHARACTERS.filter(character=>character.randomOnly);
 assert.equal(records.length,randomCharacters.length,'one provenance record per random portrait');
 for(const character of randomCharacters){
  const file=path.join(__dirname,'..',character.image),bytes=fs.readFileSync(file),metadata=webpMetadata(bytes);
  assert.deepEqual(metadata,{width:384,height:384,alpha:true},character.id);
  const record=records.find(asset=>asset.file===path.basename(file));
  assert.ok(record,`${character.id} provenance exists`);
  assert.equal(record.bytes,bytes.length,`${character.id} byte size`);
  assert.equal(record.sha256,crypto.createHash('sha256').update(bytes).digest('hex'),`${character.id} SHA-256`);
 }
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
