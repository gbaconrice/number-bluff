/* Number Bluff: repaired PR5 special-only SVG motion. Original artwork is immutable.
 * Source-pixel viewBoxes replace the old 100x100 stretched artwork sub-rectangle.
 * No normal-card motion, WebGL, source-image clone, cat sweat or ambient particles.
 */
(function(global){'use strict';
const ns='http://www.w3.org/2000/svg';let serial=0;
const ART={double:{width:1051,height:1496},extra:{width:1049,height:1500},max0:{width:1049,height:1499},reset:{width:1062,height:1482}};
function containRect(width,height,sourceWidth,sourceHeight){const scale=Math.min(width/sourceWidth,height/sourceHeight);return{x:(width-sourceWidth*scale)/2,y:(height-sourceHeight*scale)/2,width:sourceWidth*scale,height:sourceHeight*scale,scale};}
function markup(kind,id){
// Broad, shaded light volumes remain legible at 88px: not a wireframe tracing
// of the same-coloured painted edge. Every motif retains source coordinates.
const defs=`<defs>
<linearGradient id="${id}-ice"><stop stop-color="#ffb4df"/><stop offset=".45" stop-color="#fffdf0"/><stop offset="1" stop-color="#85edff" stop-opacity=".08"/></linearGradient>
<linearGradient id="${id}-gold"><stop stop-color="#ffad3f" stop-opacity="0"/><stop offset=".5" stop-color="#fffddd"/><stop offset="1" stop-color="#ffd782" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}-aura"><stop stop-color="#fff6df" stop-opacity="0"/><stop offset=".55" stop-color="#fff6df" stop-opacity="0"/><stop offset=".78" stop-color="#f3bcff" stop-opacity=".6"/><stop offset="1" stop-color="#c9eaff" stop-opacity="0"/></radialGradient>
<filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
<linearGradient id="${id}-beam" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#ffe29b" stop-opacity=".75"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></linearGradient>
</defs>`;
if(kind==='double')return defs+`<g transform="translate(535 963) rotate(66) scale(1 .44)"><g class="galaxy-stream stream-cross"><path class="effect-shadow" d="M-325 0 A325 325 0 0 1 325 0 A325 270 0 0 0 -325 0Z"/><path fill="url(#${id}-ice)" d="M-315 0 A315 315 0 0 1 315 0 A315 276 0 0 0 -315 0Z"/></g></g><g transform="translate(535 963) rotate(-28)"><ellipse class="galaxy-halo" rx="440" ry="190" fill="url(#${id}-aura)"/><g transform="scale(1 .36)"><g class="galaxy-stream"><path class="effect-shadow" d="M-410 0 A410 410 0 0 1 410 0 A410 335 0 0 0 -410 0Z"/><path fill="url(#${id}-ice)" d="M-398 0 A398 398 0 0 1 398 0 A398 342 0 0 0 -398 0Z"/><path fill="#fff9ed" opacity=".85" d="M-365 -112 A382 382 0 0 1 330 -190 A382 355 0 0 0 -365 -112Z"/></g><g class="galaxy-stream stream-b"><path fill="url(#${id}-ice)" d="M-290 0 A290 290 0 0 1 290 0 A290 248 0 0 0 -290 0Z"/></g></g></g>`;
if(kind==='max0')return defs+`<g class="crown-radiance" filter="url(#${id}-soft)"><path fill="url(#${id}-beam)" d="M530 724 L472 518 L553 657 L604 490 L641 666 L730 555 L672 744Z"/></g><defs><clipPath id="${id}-crown"><path d="M509 723 L516 654 L550 679 L609 628 L647 695 L688 683 L672 746 Q590 716 509 723Z"/></clipPath></defs><g clip-path="url(#${id}-crown)"><rect class="crown-metal-sweep" x="405" y="608" width="135" height="165" fill="url(#${id}-gold)"/></g><path class="crown-glint" fill="#fffbe1" d="M609 591 Q616 628 648 636 Q616 644 609 680 Q601 644 568 636 Q601 628 609 591Z"/>`;
if(kind==='extra')return defs+`<ellipse class="orb-aura" cx="535" cy="994" rx="345" ry="345" fill="url(#${id}-aura)"/><defs><clipPath id="${id}-orb"><ellipse cx="535" cy="994" rx="282" ry="286"/></clipPath></defs><g clip-path="url(#${id}-orb)"><g class="orb-nebula"><path class="effect-shadow" d="M300 737 C640 815 675 1134 400 1266 L510 1283 C824 1075 734 808 420 705Z"/><path fill="url(#${id}-ice)" d="M300 737 C640 815 675 1134 400 1266 L460 1274 C751 1120 696 812 358 716Z"/><path fill="#fffaf3" opacity=".8" d="M317 746 C638 835 644 1125 418 1254 C677 1139 664 811 317 746Z"/></g></g><ellipse class="orb-refraction" cx="535" cy="994" rx="302" ry="307" stroke="url(#${id}-ice)"/>`;
return defs+`<g transform="translate(535 1005)"><ellipse class="reset-ripple" rx="250" ry="250" stroke="url(#${id}-ice)"/><ellipse class="reset-ripple ripple-b" rx="250" ry="250" stroke="url(#${id}-ice)"/><g class="reset-current"><path class="effect-shadow" d="M-195 -180 A265 265 0 1 1 -260 35 L-217 24 A220 220 0 1 0 -160 -150Z"/><path fill="url(#${id}-ice)" d="M-195 -180 A265 265 0 1 1 -260 35 L-230 30 A234 234 0 1 0 -173 -160Z"/><path fill="#fffaf0" d="M-247 60 L-282 18 L-221 23Z"/></g></g>`;
}
function createManager(){
const records=new Map();const reduced=matchMedia('(prefers-reduced-motion:reduce)');let paused=false,destroyed=false,pageSuspended=false;
function allowed(r){return !destroyed&&!paused&&!pageSuspended&&!reduced.matches&&!document.hidden&&r.visible&&r.el.isConnected&&!r.el.closest('.hide,.hidden,.out,[hidden],[inert],[aria-hidden="true"],[data-revealed="back"],[data-revealed="false"]')&&!r.el.closest('dialog:not([open])')&&(!document.querySelector('dialog[open]')||document.querySelector('dialog[open]').contains(r.el))&&!document.querySelector('#restartConfirm:not(.hide)')&&getComputedStyle(r.el).visibility!=='hidden';}
function sync(r){const on=allowed(r);r.layer.dataset.playing=String(on);r.layer.style.visibility=on?'visible':'hidden';if(!on){clearTimeout(r.timer);r.layer.removeAttribute('data-active');}}
function measure(r){
 // Production card art and SVG are siblings in the same full 2:3 surface.
 // Share CSS geometry directly: viewport rectangles during deal/flip transforms
 // include perspective and integer clientWidth rounding, not local coordinates.
 if(r.imageElement?.parentElement===r.mountRoot&&r.mountRoot.classList.contains('card-content')){
  Object.assign(r.layer.style,{left:'0px',top:'auto',bottom:'0px',width:'100%',height:'var(--card-source-height,100%)'});
  const imageStyle=getComputedStyle(r.imageElement),hostStyle=getComputedStyle(r.mountRoot),width=parseFloat(imageStyle.width)||0,height=parseFloat(imageStyle.height)||0;
  r.rect={x:0,y:(parseFloat(hostStyle.height)||0)-height,width,height,scale:width/ART[r.kind].width};return;
 }
 const el=r.mountRoot,img=r.imageElement||r.el,hostRect=el.getBoundingClientRect(),rect=img.getBoundingClientRect();const style=getComputedStyle(el),imgStyle=getComputedStyle(img);
 const hostBorderX=parseFloat(style.borderLeftWidth)||0,hostBorderY=parseFloat(style.borderTopWidth)||0;
 const imageBorderX=parseFloat(imgStyle.borderLeftWidth)||0,imageBorderY=parseFloat(imgStyle.borderTopWidth)||0;
 // background-origin padding-box / object-fit contain; img padding is excluded.
 const isImage=img.tagName==='IMG';const padL=isImage?(parseFloat(imgStyle.paddingLeft)||0):0,padR=isImage?(parseFloat(imgStyle.paddingRight)||0):0,padT=isImage?(parseFloat(imgStyle.paddingTop)||0):0,padB=isImage?(parseFloat(imgStyle.paddingBottom)||0):0;
 const width=img.clientWidth-padL-padR,height=img.clientHeight-padT-padB;const a=ART[r.kind];const fit=containRect(width,height,a.width,a.height);
 const sx=hostRect.width/(el.offsetWidth||hostRect.width)||1,sy=hostRect.height/(el.offsetHeight||hostRect.height)||1;
 const x=(rect.left-hostRect.left)/sx-hostBorderX+imageBorderX+padL+fit.x,y=(rect.top-hostRect.top)/sy-hostBorderY+imageBorderY+padT+fit.y;
 Object.assign(r.layer.style,{left:x+'px',top:y+'px',width:fit.width+'px',height:fit.height+'px'});r.rect={x,y,width:fit.width,height:fit.height,scale:fit.scale};
}
const ro=new ResizeObserver(entries=>{for(const r of records.values())if(entries.some(e=>e.target===r.el||e.target===r.imageElement))measure(r);});
const io=new IntersectionObserver(entries=>{for(const e of entries){const r=records.get(e.target);if(r){r.visible=e.isIntersecting&&e.intersectionRatio>=.35;sync(r);}}},{threshold:[0,.35,1]});
function attach(el,kind,{faceUp=true,imageElement=null}={}){if(destroyed||!el)return null;if(!faceUp||!ART[kind]){detach(el);return null;}const old=records.get(el);if(old&&old.kind===kind&&old.imageElement===imageElement){measure(old);sync(old);return old.layer;}detach(el);
 const a=ART[kind],layer=document.createElement('span');layer.className='nb-special-svg';layer.dataset.kind=kind;layer.dataset.playing='false';layer.setAttribute('aria-hidden','true');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${a.width} ${a.height}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.innerHTML=markup(kind,'nbsv-'+(++serial));layer.append(svg);const mountRoot=imageElement?.closest('.card-content')||el;mountRoot.append(layer);el.classList.add('nb-special-svg-host');
 const bounds=el.getBoundingClientRect();const visibleWidth=Math.max(0,Math.min(innerWidth,bounds.right)-Math.max(0,bounds.left)),visibleHeight=Math.max(0,Math.min(innerHeight,bounds.bottom)-Math.max(0,bounds.top));
 const initiallyVisible=bounds.width>0&&bounds.height>0&&visibleWidth*visibleHeight/(bounds.width*bounds.height)>=.35;
 const r={el,kind,imageElement,mountRoot,layer,visible:initiallyVisible,timer:0,rect:null};records.set(el,r);measure(r);ro.observe(el);if(imageElement&&imageElement!==el)ro.observe(imageElement);io.observe(el);sync(r);return layer;
}
function detach(el){const r=records.get(el);if(!r)return;clearTimeout(r.timer);io.unobserve(el);ro.unobserve(el);if(r.imageElement&&r.imageElement!==el)ro.unobserve(r.imageElement);r.layer.remove();el.classList.remove('nb-special-svg-host');records.delete(el);}
function activate(el,{duration=900}={}){const r=records.get(el);if(!r)return false;sync(r);if(!allowed(r))return false;clearTimeout(r.timer);r.layer.style.setProperty('--special-active-ms',Math.max(250,duration)+'ms');r.layer.dataset.active='true';r.timer=setTimeout(()=>{r.layer.removeAttribute('data-active');sync(r);},Math.max(250,duration));return true;}
function refresh(){for(const r of records.values()){measure(r);sync(r);}}
function pagehide(){pageSuspended=true;refresh();}
function pageshow(){pageSuspended=false;refresh();}
document.addEventListener('visibilitychange',refresh);global.addEventListener('pagehide',pagehide);global.addEventListener('pageshow',pageshow);reduced.addEventListener('change',refresh);
return{attach,detach,activate,play(el,options={}){return activate(el,options);},stop(el){for(const r of records.values())if(!el||r.el===el){clearTimeout(r.timer);r.layer.removeAttribute('data-active');sync(r);}},status(){return{attached:records.size,active:[...records.values()].some(r=>r.layer.dataset.active==='true'),paused};},getActiveHost(){return [...records.values()].find(r=>r.layer.dataset.active==='true')?.el||null;},refresh,pause(){paused=true;refresh();},resume(){paused=false;refresh();},rect(el){return records.get(el)?.rect||null;},
 renderAt(el,ms){const r=records.get(el);if(!r)return false;sync(r);if(!allowed(r))return false;for(const animation of r.layer.getAnimations({subtree:true})){animation.pause();animation.currentTime=ms;}return true;},
 destroy(){destroyed=true;for(const el of [...records.keys()])detach(el);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',refresh);global.removeEventListener('pagehide',pagehide);global.removeEventListener('pageshow',pageshow);reduced.removeEventListener('change',refresh);}}
}
global.NumberBluffSpecialSVG=Object.freeze({createManager,containRect,art:ART});
})(window);
