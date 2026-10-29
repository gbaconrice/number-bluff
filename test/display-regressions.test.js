const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const app = fs.readFileSync('app.js', 'utf8');
test('abandonment notice clears on a new game but remains in the lobby', () => {
  const source = app.slice(app.indexOf('  function receive(next)'), app.indexOf('  function apply(next)'));
  let paints = 0;
  const context = { pendingAction:null, clearPendingAction(){}, $(){return {open:false}}, view:{phase:'lobby'}, transport:null, connectionMessage:'参加者が退出したため、対戦を中止してロビーに戻りました。', clearError(){}, clearEmotes(){}, paintConnectionStatus(){paints++}, cancelPresentation(){}, renderLobby(){}, renderBattle(){}, human:'p1', presentationKey:null };
  vm.createContext(context); vm.runInContext(source + '\nthis.receive=receive;', context);
  context.receive({phase:'lobby',players:[]}); assert.notEqual(context.connectionMessage, '');
  context.receive({phase:'play',players:[]}); assert.equal(context.connectionMessage, ''); assert.equal(paints, 1);
  for (const message of ['参加者との接続が切れました。', '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。']) {
    context.view = {phase:'lobby'}; context.connectionMessage = message; context.receive({phase:'play',players:[]}); assert.equal(context.connectionMessage, '');
  }
  context.view = {phase:'finished'}; context.connectionMessage = ''; context.receive({phase:'play',players:[]}); assert.equal(context.connectionMessage, '');
});
