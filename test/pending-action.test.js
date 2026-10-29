'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('online declaration is single-flight and unblocks on rejection and timeout',async()=>{
 const source=fs.readFileSync('app.js','utf8'), body=source.slice(source.indexOf('  function action(type, value)'),source.indexOf("  document.addEventListener('click'"));
 const buttons={declare:{},challenge:{},skipBots:{},status:{}},jobs=[],sent=[];let resolve;
 const ctx={view:{phase:'play',turn:'p1',players:[{kind:'human',eliminated:false}],bid:1,revision:4,turnClock:{token:'t'}},human:'p1',connectionBlocked:false,pendingAction:null,transport:{send(a){sent.push(a);return new Promise(r=>resolve=r)},resync(){ctx.resynced=true}},$(id){return buttons[id]},setTimeout(fn){jobs.push(fn);return jobs.length},clearTimeout(){},clearPendingAction(){ctx.pendingAction=null},fail(message){ctx.error=message},canManageLobby(){return true},Promise};vm.createContext(ctx);vm.runInContext(body+'\nthis.action=action;',ctx);
 assert.equal(ctx.action('declare',2),true);assert.equal(ctx.action('challenge'),false);assert.equal(sent.length,1);assert.equal(buttons.declare.disabled,true);assert.equal(buttons.challenge.disabled,true);
 jobs[0]();assert.equal(ctx.resynced,true);assert.equal(buttons.declare.disabled,false);assert.equal(buttons.challenge.disabled,false);assert.match(ctx.error,/確認/);
 assert.equal(ctx.action('declare',2),true);resolve(false);await Promise.resolve();await Promise.resolve();assert.equal(ctx.pendingAction,null);assert.equal(buttons.declare.disabled,false);
});
