/* Small, finite public-state feedback. Never owns game timing or input. */
(function(global){'use strict';
const motions={
 turn:{frames:[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.1)',filter:'brightness(1.18)',offset:.4},{transform:'scale(1)',filter:'brightness(1)'}],duration:420},
 life:{frames:[{transform:'translateY(-3px) scale(1.25)',color:'#ffe7ef',opacity:.45},{transform:'translateY(0) scale(1.07)',color:'#ff8cb6',opacity:1,offset:.55},{transform:'none',color:'#ffb2d1',opacity:1}],duration:560}
};
function create(){
 const media=global.matchMedia('(prefers-reduced-motion: reduce)'),seen=new Set(),running=new Set();let scope=null,destroyed=false,suspended=false;
 function stop(){for(const animation of running)animation.cancel();running.clear();}
 function begin(key){if(key!==scope){stop();seen.clear();scope=key;}}
 function play(kind,node,key){
  const event=kind+':'+key;if(destroyed||!scope||seen.has(event)||!motions[kind])return false;
  seen.add(event); // Consume hidden/reduced events, never replay on focus or resync.
  if(document.hidden||suspended||media.matches||!node?.isConnected||typeof node.animate!=='function'||node.closest('.hide,[hidden],[inert],dialog:not([open])'))return false;
  const rect=node.getBoundingClientRect();if(rect.bottom<=0||rect.top>=global.innerHeight||rect.right<=0||rect.left>=global.innerWidth)return false;
  const motion=motions[kind];let animation;try{animation=node.animate(motion.frames,{duration:motion.duration,easing:'cubic-bezier(.2,.75,.25,1)',iterations:1,id:'nb-feedback-'+kind});}catch{return false;}
  running.add(animation);animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));return true;
 }
 const visibility=()=>{if(document.hidden)stop();};const hide=()=>{suspended=true;stop();};const show=()=>{suspended=false;};
 document.addEventListener('visibilitychange',visibility);global.addEventListener('pagehide',hide);global.addEventListener('pageshow',show);global.addEventListener('resize',stop);media.addEventListener('change',stop);
 return{begin,play,stop,destroy(){destroyed=true;stop();seen.clear();document.removeEventListener('visibilitychange',visibility);global.removeEventListener('pagehide',hide);global.removeEventListener('pageshow',show);global.removeEventListener('resize',stop);media.removeEventListener('change',stop);}};
}
global.NumberBluffGameplayFeedback=Object.freeze({create});
})(window);
