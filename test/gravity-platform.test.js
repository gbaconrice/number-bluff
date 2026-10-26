const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../gravity-platform.js');
function fixture(height = 844) {
  const events = new Map(), docEvents = new Map(), messages = [], insets = [], statuses = [];
  let finish, closes = 0, resyncs = 0, installs = 0;
  const win = { innerHeight: height, innerWidth: 390, document: { hidden: false, activeElement: null,
    addEventListener: (n, fn) => docEvents.set(n, fn), removeEventListener: n => docEvents.delete(n) },
    addEventListener: (n, fn) => events.set(n, fn), removeEventListener: n => events.delete(n),
    parent: { postMessage: (message, origin) => messages.push({ message, origin }) } };
  const client = { setRoomAdapterExpected: value => { client.expected = value; }, setViewportInsets: value => insets.push(value),
    reportConnectionStatus: value => statuses.push(value), onSessionFinish: fn => { finish = fn; return () => { finish = null; }; } };
  const adapter = { install: async () => { installs++; return { close: () => closes++, resync: () => { resyncs++; }, getSession: () => ({ close: () => closes++ }) }; } };
  return {window:win, win, client, adapter, events, docEvents, messages, insets, statuses, finish: value => finish?.(value), counts: () => ({closes,resyncs,installs})};
}
test('ordinary browser has no platform padding, calls or game score', async () => {
  const f = fixture(); assert.equal(await P.start(f), null); assert.equal(f.insets.length, 0); assert.equal(f.counts().installs, 0);
});
test('native header exclusion at 811/812 boundary and focused keyboard resize remains stable', async () => {
  assert.equal(P.exclusionHeight(811), 74); assert.equal(P.exclusionHeight(812), 98);
  const f = fixture(); await P.start({...f, sdk:{}}); assert.deepEqual(f.insets.at(-1), {top:98,bottom:0});
  f.win.innerHeight=500; f.win.document.activeElement={tagName:'INPUT'}; f.events.get('resize')(); assert.equal(f.insets.at(-1).top,98);
  f.win.innerWidth=844; f.events.get('resize')(); assert.equal(f.insets.at(-1).top,74,'rotation recalculates even with an input focused');
  f.win.document.activeElement=null; f.events.get('resize')(); assert.equal(f.insets.at(-1).top,74);
});
const exit = (overrides={}) => ({reason:'explicit-exit',roomId:'r',sessionId:1,viewerId:'p1',player:{id:'p1',kind:'human',currentStreak:0,bestStreak:5},...overrides});
test('only explicit play-session exit posts own best streak once, not match updates', async () => {
  const f=fixture(); const bridge=await P.start({...f,sdk:{}});
  f.finish(null); f.finish({roomId:'r',game:1,winner:'p1',viewerId:'p1'});
  f.finish(exit({reason:'match-complete'})); f.finish(exit({reason:'rematch'})); f.finish(exit({reason:'host-lost'}));
  assert.equal(f.messages.length,0,'match, rematch and involuntary events must never open native popup');
  f.finish(exit()); f.finish(exit());
  assert.deepEqual(f.messages,[{message:{type:'gameOver',score:5},origin:'*'}],'best 5 survives current streak resetting to 0');
  f.finish(exit({sessionId:2,player:{id:'p1',kind:'human',bestStreak:0}}));
  assert.equal(f.messages.length,2,'a fresh play session can submit again even with reused room ID');
  assert.equal(f.messages[1].message.score,0);
  bridge.close(); f.finish(exit({sessionId:3})); assert.equal(f.messages.length,2);
});
test('BOT, another player, missing session, and invalid scores are never submitted', async () => {
  const f=fixture(); await P.start({...f,sdk:{}});
  for (const invalid of [
    exit({player:{id:'p1',kind:'bot',bestStreak:10}}),
    exit({player:{id:'p2',kind:'human',bestStreak:10}}),
    exit({sessionId:undefined}), exit({roomId:''}),
    ...[-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1,'5'].map(bestStreak=>exit({player:{id:'p1',kind:'human',bestStreak}}))
  ]) f.finish(invalid);
  assert.deepEqual(f.messages,[]);
});
test('pagehide, visibility resume and platform teardown do not submit scores', async () => {
  const f=fixture(); const bridge=await P.start({...f,sdk:{}});
  f.docEvents.get('visibilitychange')(); f.events.get('pagehide')(); bridge.close();
  assert.deepEqual(f.messages,[]);
});
test('duplicate bootstrap installs once, resume resyncs only visible, cleanup removes hooks', async () => {
  const f=fixture(); const a=await P.start({...f,sdk:{}}),b=await P.start({...f,sdk:{}}); assert.equal(a,b); assert.equal(f.counts().installs,1);
  f.win.document.hidden=true; f.docEvents.get('visibilitychange')(); assert.equal(f.counts().resyncs,0);
  f.win.document.hidden=false; f.docEvents.get('visibilitychange')(); assert.equal(f.counts().resyncs,1);
  f.events.get('pagehide')(); assert.equal(f.counts().closes,1); assert.equal(f.statuses.at(-1).kind,'session-ended');
  a.close(); a.close(); assert.equal(f.counts().closes,2); assert.equal(f.events.size,0); assert.equal(f.docEvents.size,0);
});
test('SDK setup error leaves expected-online mode, visible status, and can retry', async () => {
  const f=fixture(); f.adapter.install=async()=>{throw Error('profile');};
  await assert.rejects(P.start({...f,sdk:{}}),/profile/); assert.equal(f.client.expected,true); assert.equal(f.statuses.at(-1).kind,'profile-error');
  f.adapter.install=async()=>({resync(){},close(){},getSession(){}}); assert.ok(await P.start({...f,sdk:{}}));
});
