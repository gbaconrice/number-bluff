/* Number Bluff: repaired PR5 special-only SVG motion. Original artwork is immutable.
 * Source-pixel viewBoxes replace the old 100x100 stretched artwork sub-rectangle.
 * No normal-card motion, WebGL, source-image clone, cat sweat or ambient particles.
 */
(function(global){'use strict';
const ns='http://www.w3.org/2000/svg';let serial=0;
const ART={double:{width:1051,height:1496},extra:{width:1049,height:1500},max0:{width:1049,height:1499},reset:{width:1062,height:1482}};
function containRect(width,height,sourceWidth,sourceHeight){const scale=Math.min(width/sourceWidth,height/sourceHeight);return{x:(width-sourceWidth*scale)/2,y:(height-sourceHeight*scale)/2,width:sourceWidth*scale,height:sourceHeight*scale,scale};}
function markup(kind,id){
// Only painted features are traced. Dash offset moves light, never the geometry.
const defs=`<defs><linearGradient id="${id}-light"><stop stop-color="#fff8d9"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#daf9ff"/></linearGradient><linearGradient id="${id}-gold"><stop stop-color="#dca333" stop-opacity="0"/><stop offset=".32" stop-color="#fff9c9" stop-opacity=".6"/><stop offset=".5" stop-color="#ffffff"/><stop offset=".7" stop-color="#fff8c0" stop-opacity=".6"/><stop offset="1" stop-color="#dca333" stop-opacity="0"/></linearGradient></defs>`;
function light(tag,attributes,cls){return `<${tag} class="${cls} painted-track contrast-track" ${attributes}/><${tag} class="${cls} painted-track light-track" ${attributes} stroke="url(#${id}-light)"/>`;}
if(kind==='double')return defs+`<g transform="translate(535 963) rotate(-28)">${light('ellipse','rx="390" ry="129" pathLength="100"','galaxy-stream')}${light('ellipse','rx="296" ry="98" pathLength="100"','galaxy-stream stream-b')}</g>`;
if(kind==='max0')return defs+`<defs><clipPath id="${id}-crown"><path d="M509 723 L516 654 L550 679 L609 628 L647 695 L688 683 L672 746 Q590 716 509 723Z"/></clipPath></defs><g clip-path="url(#${id}-crown)"><rect class="crown-metal-sweep" x="408" y="608" width="115" height="165" fill="url(#${id}-gold)"/></g>`;
if(kind==='extra')return defs+`<defs><clipPath id="${id}-orb"><ellipse cx="535" cy="994" rx="282" ry="286"/></clipPath></defs><g clip-path="url(#${id}-orb)">${light('ellipse','cx="535" cy="994" rx="268" ry="275" pathLength="100"','orb-nebula')}${light('path','d="M411 844 C470 898 641 895 601 973 S435 1070 513 1110" pathLength="100"','orb-current')}</g>`;
return defs+light('path','d="M343 965 C304 1097 418 1216 553 1200 C716 1180 779 1007 683 880 C628 807 548 795 469 812" pathLength="100"','reset-current');
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
