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
    const isHost=userId===hostUserId, rng=options.rng||Math.random;
    const later=options.setTimeout||setTimeout, clear=options.clearTimeout||clearTimeout;
    const onStatus=typeof options.onStatus==='function'?options.onStatus:()=>{};
    const members=new Map(), listeners=new Set(), sequences=new Map(), seen=new Map();
    const now=options.now||Date.now;
    const heartbeatMs=options.heartbeatMs??5000, timeoutMs=options.timeoutMs??30000;
    if(!Number.isFinite(heartbeatMs)||heartbeatMs<100||!Number.isFinite(timeoutMs)||timeoutMs<heartbeatMs*3)throw new RangeError('Use a bounded heartbeat and a timeout of at least three intervals.');
    let heartbeatTimer=null,lastHostSeen=now();
    let state=null, latest=null, closed=false, hostLost=false, timer=null, generation=0;
    let epoch=isHost?(options.epoch||String(Date.now())+'-'+String(Math.random()).slice(2)):null;
    let commandSequence=0, hostSequence=0, acceptedHostSequence=-1, scheduledRevision=null;
    let lastStatus=null, turnClock=null, turnTimer=null, turnGeneration=0;
    const roundAdvance=R.create({now,set:later,clear,expire(){if(!isHost||closed||hostLost||state?.phase!=='reveal')return;state=G.nextRound(state,rng);publish('round-timeout');}});
    const status=(kind,detail={})=>{lastStatus={kind,...detail};onStatus({...lastStatus});};
    function cancel(){scheduledRevision=null;generation++;if(timer!==null)clear(timer);timer=null;}
    function emit(v){if(latest&&latest.revision===v.revision){const changed=['turnClock','roundClock'].some(key=>v[key]&&v[key].token===latest[key]?.token&&v[key].localDeadline!==latest[key].localDeadline);if(!changed)return;}latest=v;for(const fn of listeners)fn(clone(v));}
    function transmit(body){
      if(closed||hostLost)return Promise.resolve(false);
      const message=JSON.stringify({protocol:'number-bluff',version:VERSION,roomId,epoch,...body});
      if(message.length>LIMIT)throw new RangeError('Room message exceeds protocol limit.');
      return Promise.resolve(sendMessage(message)).catch(error=>{status('send-error');throw error;});
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
        if(action){const next=G.dispatch(state,{...action,player:bot.id,revision:rev},rng);if(next!==state){state=next;publish();}}
      },options.botDelay??650);
    }
    function publish(reason){
      if(state.phase!=='reveal')roundAdvance.cancel();
      if(expireTurn()||roundAdvance.check())return;syncTurn();roundAdvance.sync(state);
      G.assertInvariant(state);
      const wire={...G.publicView(state,'__broadcast__'),hostId:state.players[0].id,roomId,roundClock:roundAdvance.get()?{...roundAdvance.get(),serverNow:now()}:null,turnClock:turnClock?{...turnClock,serverNow:now()}:null};delete wire.viewerId;wire.history=wire.history.slice(-100);
      const own=localize(wire);if(own)emit(own);
      void transmit({type:'snapshot',sequence:++hostSequence,view:wire,reason:reason||null}).catch(()=>{});
      if(reason)status(reason);scheduleBot();
    }
    function addMember(raw){
      if(closed||!raw||!id(raw.userId))return false;
      const p=profile(raw);members.set(p.userId,p);seen.set(p.userId,now());
      if(!isHost||p.userId===hostUserId)return true;
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
      if(!members.has(uid))return false;members.delete(uid);seen.delete(uid);sequences.delete(uid);
      if(!isHost)return true;
      const seat=seatFor(uid);if(!seat)return true;
      const active=state.phase!=='lobby';
      // Explicit abandonment policy: no fabricated move, life loss, bot takeover or win.
      if(active)state=G.returnToLobby(state);
      state={...state,revision:state.revision+1,players:state.players.filter(p=>p.id!==seat.id)};
      publish(active?'player-left-match-abandoned':'player-left');return true;
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
      if(next===state)return false;state=next;publish();return true;
    }
    function validSnapshot(v){
      if(!v||!['lobby','play','reveal','finished'].includes(v.phase)||!Number.isSafeInteger(v.revision)||v.revision<0||!Array.isArray(v.players)||v.players.length<1||v.players.length>8)return false;
      if(typeof v.rankingEligible!=='boolean')return false;
      if(v.turnClock!==undefined&&v.turnClock!==null){const c=v.turnClock;if(v.phase!=='play'||typeof c.token!=='string'||c.token.length>256||c.player!==v.turn||!v.players.some(p=>p.id===c.player&&p.kind==='human')||!Number.isFinite(c.deadline)||!Number.isFinite(c.serverNow)||c.deadline-c.serverNow>TURN_MS)return false;}
      if(v.roundClock!==undefined&&v.roundClock!==null){const c=v.roundClock;if(v.phase!=='reveal'||typeof c.token!=='string'||c.token.length>256||!Number.isFinite(c.deadline)||!Number.isFinite(c.readyAt)||!Number.isFinite(c.serverNow)||c.deadline-c.readyAt!==10000||c.readyAt-c.serverNow>10000)return false;}
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
    const self=profile({userId,name:options.name,avatarUrl:options.avatarUrl});members.set(userId,self);
    if(isHost){state=G.createLobby({name:self.name,botCount:0});state={...state,players:state.players.map(p=>({...p,...self}))};}
    for(const member of options.members||[])if(member&&id(member.userId)){members.set(member.userId,profile(member));seen.set(member.userId,now());}
    const adapter={
      subscribe(fn){if(typeof fn!=='function')throw new TypeError('Listener required');listeners.add(fn);if(latest)fn(clone(latest));return()=>listeners.delete(fn);},
      send(action){if(closed||hostLost)return Promise.reject(new Error('Room is disconnected.'));if(isHost)return Promise.resolve(processAction(userId,action));if(!epoch)return Promise.reject(new Error('Waiting for host.'));return transmit({type:'action',sequence:++commandSequence,action});},
      receive,addMember,removeMember,
      resync(){return isHost?(publish(),Promise.resolve()):transmit({type:'resync'});},
      close(){if(closed)return;void transmit({type:'bye',revision:latest?.revision}).catch(()=>{});closed=true;cancel();cancelTurn();roundAdvance.cancel();turnClock=null;stopHeartbeat();listeners.clear();status('closed');},
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
    let active=null, pending=false, listenerGeneration=0, requestGeneration=0, discovery=null, activeRoom=null, nativeJoined=false, leaving=null;
    async function leave(){
      if(leaving)return leaving;
      if(!nativeJoined)return;
      leaving=(async()=>{
        if(typeof sdk.room.exit!=='function')throw new Error('GRAVITY exit unavailable.');
        const result=await sdk.room.exit();
        if(result?.errno!==0)throw new Error('GRAVITY exit failed.');
        nativeJoined=false;listenerGeneration++;discovery=null;activeRoom=null;active?.close();active=null;
      })();
      try{return await leaving;}finally{leaving=null;}
    }
    function attachReceiver(handler){
      let receiver=receivers.get(sdk.room);
      if(!receiver){receiver={handler};receivers.set(sdk.room,receiver);sdk.room.receiveMessage(payload=>receiver.handler?.(payload));}
      else receiver.handler=handler;
    }
    function sendControl(body){return Promise.resolve(sdk.room.sendMessage({message:JSON.stringify({protocol:'number-bluff',version:VERSION,...body})})).then(r=>{if(r?.errno!==undefined&&r.errno!==0)throw new Error('GRAVITY send failed.');});}
    function handle(payload){
      if(!payload?.data)return;const data=payload.data,uid=String(data.user_id||'');
      if(data.room_id!==undefined&&String(data.room_id)!==activeRoom)return;
      if(payload.type==='aitools_game_sendmsg'&&id(uid)&&typeof data.msg_data==='string'&&data.msg_data.length<=LIMIT){
        let m;try{m=JSON.parse(data.msg_data);}catch{}
        if(m?.protocol==='number-bluff'&&m.version===VERSION&&m.roomId===activeRoom){
          if(m.type==='host-discover'&&active?.getStatus().isHost&&id(m.nonce))void sendControl({roomId:activeRoom,type:'host-claim',nonce:m.nonce}).catch(()=>{});
          if(m.type==='host-claim'&&discovery&&m.nonce===discovery.nonce&&discovery.roster.has(uid)&&uid!==myId){
            discovery.claims.add(uid);
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
          discovery={nonce,roster,claims:new Set(),pinned:null};
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
        });for(const payload of buffered)handle(payload);return active;
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
