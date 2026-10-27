const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
test('home offers public default and exact private-room option',()=>{
 assert.match(html,/id="startGame"[^>]*>ルームを作成/);
 assert.match(html,/id="privateRoom" type="checkbox"/);assert.doesNotMatch(html,/id="privateRoom"[^>]*checked/);
 assert.match(html,/プライベートルームにする/);assert.doesNotMatch(html,/プライベートロビー/);
});
test('join stacks ID form above the always-visible public list without tabs',()=>{
 for(const id of ['joinForm','joinPublicPanel','publicRoomsTitle','refreshPublicRooms','publicRoomsStatus','publicRoomsList'])assert.ok(html.includes(`id="${id}"`));
 assert.doesNotMatch(html.slice(html.indexOf('<section id="joinPanel"')),/joinIdTab|joinPublicTab|role="tab(?:list|panel)?"/);
 assert.match(html,/id="joinPublicPanel" class="public-room-panel glass" aria-labelledby="publicRoomsTitle"/);
 assert.ok(html.indexOf('id="joinForm"') < html.indexOf('id="joinPublicPanel"'));
 assert.doesNotMatch(app,/selectJoinTab|joinIdTab|joinPublicTab|joinIdPanel/);
 assert.match(html,/id="refreshPublicRooms"[^>]*>更新/);assert.match(html,/公開ルーム一覧は準備中/);
 assert.match(html,/<div id="publicRoomsList" class="public-room-list"><\/div>/);
});
test('private option cannot silently invoke existing public creation or local fallback',async()=>{
 const source=app.slice(app.indexOf('  async function requestRoom('),app.indexOf('  function cancelRoomRequest('));
 let calls=0;const nodes={privateRoom:{checked:true},roomCreateStatus:{textContent:''}};
 const context={ $:id=>nodes[id],roomActions:{create(){calls++}},createLocalHostRoom(){calls++} };
 vm.createContext(context);vm.runInContext(source+'\nthis.requestRoom=requestRoom;',context);await context.requestRoom('create');
 assert.equal(calls,0);assert.match(nodes.roomCreateStatus.textContent,/準備中/);
});
test('scaffold does not call undocumented list or invitation SDK APIs',()=>{
 assert.doesNotMatch(app,/\.getPublicRoomList\s*\(|\.getRoomId\s*\(/);
 assert.match(app,/cancelRoomRequest\(\); show\('joinPanel', 'roomId'\)/);
 assert.match(app,/公開ルーム一覧の取得機能は未接続/);
});
test('lobby names known public rooms and otherwise shows ID without guessing privacy',()=>{
 assert.match(html,/id="lobbyTitle">公開ルーム/);assert.match(html,/id="copyRoomId"/);
 assert.match(app,/const idHeader = !!roomId && permission !== 0/);
 assert.match(app,/!transport \? '練習ルーム' : idHeader \? roomId : '公開ルーム'/);
 assert.match(app,/connect\(adapter, access = \{\}\)/);
});
test('copy feedback only claims success after awaited clipboard write, with selection fallback',()=>{
 const s=app.slice(app.indexOf("  $('copyRoomId').onclick"),app.indexOf("  $('startGame').onclick"));
 assert.ok(s.indexOf('await navigator.clipboard.writeText(id)') < s.indexOf('ルームIDをコピーしました'));
 assert.match(s,/roomCopyFallback.*\.select\(\)/);assert.match(s,/自動コピーできませんでした/);
 assert.match(s,/epoch !== roomEpoch/);
});
