/* Presentation-only orchestration. Reads disclosed DOM faces, never game state. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NumberBluffCardSurfaceController=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function create({renderer,glare,document:doc=document,window:win=window,busy=()=>false}={}){
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
  let ready=false,disposed=false,active=null,endTimer=0,idleTimer=0,lastNormal=null,nextAllowed=0;
  const seen=new Set();
  const blocked=()=>disposed||doc.hidden||reduced.matches||!!doc.querySelector('#restartConfirm:not(.hide)');
  function kindOf(node){
   if(!node?.querySelector('img.card-art')||node.matches('.hidden,.out')||node.closest('.hide,[hidden],[inert],[data-revealed="back"],[data-revealed="false"]'))return null;
   if(node.classList.contains('normal-card'))return 'normal'+node.dataset.artValue.replace('-', 'Minus');
   return ['extra','double','max0','reset'].find(kind=>node.classList.contains('kind-'+kind))||null;
  }
  function eligible(node){
   if(blocked()||!node?.isConnected||!kindOf(node)||!node.getClientRects().length)return false;
   const modal=doc.querySelector('dialog[open]');if(modal&&!modal.contains(node))return false;
   const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<win.innerHeight&&r.right>0&&r.left<win.innerWidth;
  }
  function releaseGlare(){if(!blocked()&&!doc.querySelector('dialog[open]'))glare.resume();}
  function stop(){win.clearTimeout(endTimer);endTimer=0;renderer.stop();active=null;releaseGlare();}
  function play(node,{key=null,duration=null,priority=false}={}){
   if(!ready||!eligible(node)||(key&&seen.has(key)))return false;
   if(!priority&&(busy()||active||win.performance.now()<nextAllowed))return false;
   const kind=kindOf(node),ms=duration??(kind.startsWith('normal')?8000:1200);
   if(priority)stop();
   glare.pause();
   if(!renderer.play(node,kind,{duration:ms})){releaseGlare();return false;}
   if(key){seen.add(key);if(seen.size>128)seen.delete(seen.values().next().value);}
   active={node,kind};nextAllowed=win.performance.now()+ms+1500;
   endTimer=win.setTimeout(stop,ms+50);return true;
  }
  function schedule(){
   win.clearTimeout(idleTimer);idleTimer=0;if(disposed)return;
   idleTimer=win.setTimeout(()=>{
    if(ready&&!blocked()&&!busy()&&!active&&!doc.querySelector('dialog[open]')){
     const nodes=[...doc.querySelectorAll('.screen:not(.hide) .normal-card')].filter(eligible);
     if(nodes.length){const index=nodes.indexOf(lastNormal);const node=nodes[(index+1)%nodes.length];if(play(node))lastNormal=node;}
    }
    schedule();
   },11000);
  }
  function sync(){if(active&&!eligible(active.node))stop();}
  function onPointer(event){if(event.pointerType==='touch')return;const node=event.target.closest?.('.player-card');if(node&&!node.contains(event.relatedTarget))play(node);}
  function visibility(){if(doc.hidden||reduced.matches)stop();else if(!active)releaseGlare();}
  function pagehide(){stop();glare.pause();win.clearTimeout(idleTimer);idleTimer=0;}
  function pageshow(){schedule();}
  doc.addEventListener('pointerover',onPointer,true);doc.addEventListener('visibilitychange',visibility);
  reduced.addEventListener?.('change',visibility);win.addEventListener('pagehide',pagehide);win.addEventListener('pageshow',pageshow);
  Promise.resolve(renderer.ready).then(value=>{if(!disposed)ready=!!value;});schedule();
  return {play,stop,sync,status(){return{ready,active:!!active,kind:active?.kind||null,seen:seen.size};},destroy(){disposed=true;stop();win.clearTimeout(idleTimer);doc.removeEventListener('pointerover',onPointer,true);doc.removeEventListener('visibilitychange',visibility);reduced.removeEventListener?.('change',visibility);win.removeEventListener('pagehide',pagehide);win.removeEventListener('pageshow',pageshow);renderer.destroy();seen.clear();}};
 }
 return Object.freeze({create});
});
