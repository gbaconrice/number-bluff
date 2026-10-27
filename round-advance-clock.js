(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./card-presentation.js'));
  else root.NumberBluffRoundAdvanceClock = factory(root.NumberBluffPresentation);
})(typeof globalThis === 'object' ? globalThis : this, function (P) {
  'use strict';
  const WAIT_MS = 10000;
  function create({expire,now=Date.now,set=setTimeout,clear=clearTimeout}) {
    let clock=null,pending=null,generation=0;
    function pause(){generation++;if(pending!==null)clear(pending);pending=null;}
    function cancel(){pause();clock=null;}
    function check(){if(!clock||now()<clock.deadline)return false;const elapsed=clock;cancel();expire(elapsed);return true;}
    function resume(){pause();if(check()||!clock)return;const ticket=generation;pending=set(()=>{if(ticket!==generation)return;pending=null;if(!check())resume();},Math.max(1,clock.deadline-now()));if(typeof pending?.unref==='function')pending.unref();}
    function sync(state){
      if(state?.phase!=='reveal'||!state.result){cancel();return null;}
      const token=JSON.stringify([state.game,state.round]);
      if(clock?.token!==token){cancel();const readyAt=now()+P.plan(state.result,state.players).at(-1).at;clock={token,readyAt,deadline:readyAt+WAIT_MS};}
      resume();return clock;
    }
    return {sync,check,pause,resume,cancel,get:()=>clock};
  }
  return {create,WAIT_MS};
});
