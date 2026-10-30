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
test('private creation passes permission and cannot fall back to an offline room',async()=>{
 const source=app.slice(app.indexOf('  async function requestRoom('),app.indexOf('  function cancelRoomRequest('));
 let args=[],local=0;const nodes={privateRoom:{checked:true},roomCreateStatus:{textContent:''},startGame:{disabled:false}};
 const context={$:id=>nodes[id],roomActions:{create:async p=>{args.push(p);return null}},roomBusy:false,roomRequest:0,roomAdapterExpected:true,createLocalHostRoom(){local++},window:{NumberBluffClient:{connect(){}}},view:null,connectionMessage:''};
 vm.createContext(context);vm.runInContext(source+'\nthis.requestRoom=requestRoom;',context);await context.requestRoom('create');assert.deepEqual(args,[1]);assert.equal(local,0);
});
test('public list handles empty, error, selection and stale responses',async()=>{
 const source=app.slice(app.indexOf("  $('refreshPublicRooms').onclick"),app.indexOf("  $('privateRoom').onchange"));
 let resolve,joined=[];const nodes={refreshPublicRooms:{},publicRoomsStatus:{textContent:''},publicRoomsList:{children:[],replaceChildren(){this.children=[]},append(x){this.children.push(x)}}};
 const context={$:id=>nodes[id],listRequest:0,screen:'joinPanel',roomActions:{list:async()=>[]},document:{createElement:()=>({})},requestRoom:(...a)=>joined.push(a)};
 vm.createContext(context);vm.runInContext(source,context);await nodes.refreshPublicRooms.onclick();assert.match(nodes.publicRoomsStatus.textContent,/ありません/);
 context.roomActions.list=async()=>{throw Error()};await nodes.refreshPublicRooms.onclick();assert.match(nodes.publicRoomsStatus.textContent,/取得できません/);
 context.roomActions.list=async()=>[{roomId:'abc',gamerNum:2,maxPlayers:8}];await nodes.refreshPublicRooms.onclick();nodes.publicRoomsList.children[0].onclick();assert.deepEqual(joined,[['join','abc']]);
 context.roomActions.list=()=>new Promise(r=>resolve=r);const pending=nodes.refreshPublicRooms.onclick();context.listRequest++;resolve([{roomId:'old',gamerNum:1,maxPlayers:8}]);await pending;assert.equal(nodes.publicRoomsList.children.length,0);
});
test('explicit exit submits score only after successful native exit and supports retry',async()=>{
 const source=app.slice(app.indexOf('  let exiting = false;'),app.indexOf("  $('startGame').onclick"));
 let ok=false,submissions=0,detached=0;const status={textContent:'',classList:{remove(){}}};
 const context={transport:{},roomAdapterExpected:true,roomActions:{exit:async()=>{if(!ok)throw Error('exit failed')}},captureSessionFinish:()=>({score:3}),timer:{cancel(){}},detachTransport(){detached++},show(){},publishSessionFinish(){submissions++},screen:'lobbyScreen',$:()=>status,state:{},view:{}};
 vm.createContext(context);vm.runInContext(source+'\nthis.exitRoom=exitRoom;',context);
 await context.exitRoom();assert.equal(submissions,0);assert.equal(detached,0);assert.match(status.textContent,/退出できません/);
 ok=true;await context.exitRoom();assert.equal(submissions,1);assert.equal(detached,1);
});
test('offline exit closes the battle confirmation without native SDK or ranking submission',async()=>{
 const source=app.slice(app.indexOf('  let exiting = false;'),app.indexOf("  $('startGame').onclick"));let closed=0,detached=0,submitted=0;const draft={value:'OLD-ROOM'};
 const context={$:()=>draft,transport:null,roomActions:{},captureSessionFinish:()=>null,timer:{cancel(){}},closeConfirm(){closed++},detachTransport(){detached++},show(){},publishSessionFinish(result){if(result)submitted++},screen:'battleScreen',state:{},view:{}};
 vm.createContext(context);vm.runInContext(source+'\nthis.exitRoom=exitRoom;',context);await context.exitRoom();assert.equal(closed,1);assert.equal(detached,1);assert.equal(submitted,0);assert.equal(draft.value,'');
});
test('lobby shows actual ID and copy for both public and private rooms',()=>{
 assert.match(html,/id="lobbyTitle"><\/h1>/);assert.match(html,/id="copyRoomId"/);
 assert.match(app,/const idHeader = !!roomId;/);
 assert.match(app,/\$\('lobbyTitle'\)\.textContent = roomId;/);
 assert.doesNotMatch(app,/roomAccessPermission/);
 assert.match(app,/connect\(adapter, access = \{\}\)/);
});
test('copy feedback only claims success after awaited clipboard write, with selection fallback',()=>{
 const s=app.slice(app.indexOf("  $('copyRoomId').onclick"),app.indexOf("  $('startGame').onclick"));
 assert.ok(s.indexOf('await navigator.clipboard.writeText(id)') < s.indexOf('ルームIDをコピーしました'));
 assert.match(s,/roomCopyFallback.*\.select\(\)/);assert.match(s,/自動コピーできませんでした/);
 assert.match(s,/epoch !== roomEpoch/);
});
