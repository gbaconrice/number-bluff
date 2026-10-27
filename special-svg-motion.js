/* Source-art lighting prototype. Original artwork bytes remain immutable.
 * The overlay samples the identical original image in the shared source box.
 * Only a feathered luminance selection moves; no visible vector strokes.
 */
(function(global){'use strict';
const ns='http://www.w3.org/2000/svg';let serial=0;
const ART={double:{width:1051,height:1496},extra:{width:1049,height:1500},max0:{width:1049,height:1499},reset:{width:1062,height:1482}};
function containRect(width,height,sourceWidth,sourceHeight){const scale=Math.min(width/sourceWidth,height/sourceHeight);return{x:(width-sourceWidth*scale)/2,y:(height-sourceHeight*scale)/2,width:sourceWidth*scale,height:sourceHeight*scale,scale};}
function markup(kind,id){
const a=ART[kind];
// The actual artwork supplies every visible pixel. Geometry below is only a
// feathered selection, never a drawn line, new ornament, or displaced image.
const region={double:'<ellipse cx="535" cy="963" rx="435" ry="165" transform="rotate(-28 535 963)"/>',extra:'<ellipse cx="535" cy="994" rx="298" ry="300"/>',reset:'<path d="M343 965 C304 1097 418 1216 553 1200 C716 1180 779 1007 683 880 C628 807 548 795 469 812" fill="none" stroke="white" stroke-width="108" stroke-linecap="round"/>',max0:'<path d="M509 723 L516 654 L550 679 L609 628 L647 695 L688 683 L672 746 Q590 716 509 723Z"/>'}[kind];
const movingMask=kind==='double'?`<g transform="translate(535 963) rotate(-28) scale(1 .38)"><g class="art-mask-orbit"><ellipse cx="285" cy="0" rx="190" ry="290" fill="url(#${id}-spot)"/></g></g>`:kind==='reset'?`<g transform="translate(535 1005)"><g class="art-mask-orbit"><ellipse cx="200" cy="0" rx="180" ry="180" fill="url(#${id}-spot)"/></g></g>`:`<rect class="art-light-sweep" x="${kind==='max0'?400:-500}" y="0" width="${kind==='max0'?150:450}" height="${a.height}" fill="url(#${id}-sweep)"/>`;
const photo=cls=>`<image class="${cls}" x="0" y="0" width="${a.width}" height="${a.height}" preserveAspectRatio="none"/>`;
return `<defs>
<filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${kind==='max0'?3:10}"/></filter>
<filter id="${id}-lightboost" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="1.35" exponent=".65" offset="0"/><feFuncG type="gamma" amplitude="1.35" exponent=".65" offset="0"/><feFuncB type="gamma" amplitude="1.35" exponent=".65" offset="0"/></feComponentTransfer></filter>
<filter id="${id}-bloom" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="${id}-luminance" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="0 .08 .3 .65 .95 1"/><feFuncG type="table" tableValues="0 .08 .3 .65 .95 1"/><feFuncB type="table" tableValues="0 .08 .3 .65 .95 1"/></feComponentTransfer></filter>
<radialGradient id="${id}-spot"><stop stop-color="white"/><stop offset=".35" stop-color="#ddd"/><stop offset="1" stop-color="black"/></radialGradient>
<linearGradient id="${id}-sweep"><stop stop-color="black"/><stop offset=".3" stop-color="#888"/><stop offset=".5" stop-color="white"/><stop offset=".7" stop-color="#888"/><stop offset="1" stop-color="black"/></linearGradient>
<mask id="${id}-region" maskUnits="userSpaceOnUse" x="0" y="0" width="${a.width}" height="${a.height}" style="mask-type:luminance"><g fill="white" filter="url(#${id}-soft)">${region}</g></mask>
<mask id="${id}-painted-light" maskUnits="userSpaceOnUse" x="0" y="0" width="${a.width}" height="${a.height}" style="mask-type:luminance"><g filter="url(#${id}-luminance)">${photo('art-luminance-source')}</g></mask>
<mask id="${id}-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="${a.width}" height="${a.height}" style="mask-type:luminance"><g mask="url(#${id}-region)"><g mask="url(#${id}-painted-light)">${movingMask}</g></g></mask>
</defs><g class="art-derived-light" mask="url(#${id}-reveal)"><g filter="url(#${id}-bloom)" opacity=".45">${photo('art-bloom-source')}</g><g filter="url(#${id}-lightboost)">${photo('art-sheen-source')}</g></g>`;
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
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${a.width} ${a.height}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.innerHTML=markup(kind,'nbsv-'+(++serial));for(const image of svg.querySelectorAll?.('image')||[])image.setAttribute('href',imageElement?.currentSrc||imageElement?.src||new URL('assets/card-'+kind+'.webp',document.baseURI).href);layer.append(svg);const mountRoot=imageElement?.closest('.card-content')||el;mountRoot.append(layer);el.classList.add('nb-special-svg-host');
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
