/*!
Number Bluff localized orb prototype.
Derived from official React Bits RippleDistortion waveFragment and compositeFragment.
Source: https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/content/Animations/RippleDistortion/RippleDistortion.jsx
Retrieved 2026-10-27 UTC.
Changes: fused brush and image sampling into one WebGL pass; one finite wave; masked original orb interior; removed grayscale, tint, chromatic dispersion, added glints, pointer-driven global ripples, and OGL/React runtime. License still retained for derived shader code.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The extra/orb branch derives from the cited React Bits wave/displacement equations.
Double ellipse sampling, crown polygon/material mask, reset surface mask,
scheduling, single-canvas integration and fallback code are Number Bluff-specific
adaptations/additions. They are not represented as verbatim upstream components.

*/
/* Number Bluff normal-sky + special shared-context prototype: localized original-art refraction.
 * Brush and composite displacement adapted from React Bits RippleDistortion,
 * Copyright (c) 2026 David Haz, MIT + Commons Clause. See THIRD_PARTY_NOTICES.txt.
 * Fused a single wave into one render pass; no React/OGL runtime or new artwork.
 */
(function(global){
'use strict';
const NORMAL_SPECS={
  "normal0": {
    "id": 7,
    "value": "0",
    "file": "card-00-soft.png",
    "width": 1061,
    "height": 1483,
    "bottom": 0.37,
    "reason": "cat ear begins near .40; reserve .03 margin"
  },
  "normal1": {
    "id": 4,
    "value": "1",
    "file": "card-01-soft.png",
    "width": 1061,
    "height": 1482,
    "bottom": 0.33,
    "reason": "highest rabbit ear begins near .35"
  },
  "normal2": {
    "id": 8,
    "value": "2",
    "file": "card-02-soft.png",
    "width": 1061,
    "height": 1483,
    "bottom": 0.35,
    "reason": "paired rabbit ear begins near .38"
  },
  "normal3": {
    "id": 9,
    "value": "3",
    "file": "card-03-soft.png",
    "width": 1061,
    "height": 1482,
    "bottom": 0.33,
    "reason": "rear rabbit ear begins near .35"
  },
  "normal4": {
    "id": 5,
    "value": "4",
    "file": "card-04-soft.png",
    "width": 1061,
    "height": 1482,
    "bottom": 0.37,
    "exclude": [
      0.62,
      0.27
    ],
    "reason": "upper-right ear begins near .30; exclude right early"
  },
  "normal5": {
    "id": 10,
    "value": "5",
    "file": "card-05-soft.png",
    "width": 1061,
    "height": 1482,
    "bottom": 0.35,
    "reason": "upper rabbit ear begins near .37"
  },
  "normalMinus5": {
    "id": 11,
    "value": "-5",
    "file": "card-minus05-soft.png",
    "width": 1061,
    "height": 1482,
    "bottom": 0.38,
    "reason": "cloud character entirely below .50"
  },
  "normalMinus10": {
    "id": 12,
    "value": "-10",
    "file": "card-minus10-soft.png",
    "width": 1061,
    "height": 1482,
    "bottom": 0.38,
    "reason": "cloud character entirely below .49"
  },
  "normal10": {
    "id": 13,
    "value": "10",
    "file": "card-10-soft-v3.png",
    "width": 1024,
    "height": 1536,
    "bottom": 0.38,
    "reason": "highest star character begins near .44"
  },
  "normal15": {
    "id": 14,
    "value": "15",
    "file": "card-15-soft.png",
    "width": 1024,
    "height": 1536,
    "bottom": 0.31,
    "reason": "highest rear star begins near .34; stricter top bound"
  },
  "normal20": {
    "id": 6,
    "value": "20",
    "file": "card-20-soft-v2.png",
    "width": 1024,
    "height": 1536,
    "bottom": 0.36,
    "exclude": [
      0.73,
      0.31
    ],
    "reason": "highest character near .39; preserve upper-right moon too"
  }
};
const VERTEX=`attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT=`precision highp float;
varying vec2 vUv;uniform sampler2D uTexture;uniform float uProgress;uniform float uStrength;uniform int uKind;uniform vec2 uCssSize;uniform float uSkyBottom;uniform vec2 uSkyExclude;
const float PI=3.141592653589793;const float EDGE=.006737947;
float triangle(vec2 p,vec2 a,vec2 b,vec2 c){
 vec2 v0=c-a,v1=b-a,v2=p-a;float den=v0.x*v1.y-v1.x*v0.y;
 float u=(v2.x*v1.y-v1.x*v2.y)/den;float v=(v0.x*v2.y-v2.x*v0.y)/den;
 return smoothstep(0.,.025,min(min(u,v),1.-u-v));
}
float crownMask(vec2 p){
 vec2 points[7];points[0]=vec2(518.,664.);points[1]=vec2(550.,686.);points[2]=vec2(610.,637.);points[3]=vec2(646.,701.);points[4]=vec2(685.,687.);points[5]=vec2(669.,739.);points[6]=vec2(518.,718.);
 bool inside=false;float distance=10000.;vec2 previous=points[6];
 for(int i=0;i<7;i++){vec2 current=points[i];vec2 edge=current-previous;float t=clamp(dot(p-previous,edge)/dot(edge,edge),0.,1.);distance=min(distance,length(p-(previous+t*edge)));if((current.y>p.y)!=(previous.y>p.y)){float crossX=(previous.x-current.x)*(p.y-current.y)/(previous.y-current.y)+current.x;if(p.x<crossX)inside=!inside;}previous=current;}
 return inside?smoothstep(0.,3.,distance):0.;
}
void main(){
 vec2 uv=vec2(vUv.x,1.-vUv.y);vec4 original=texture2D(uTexture,uv);
 float envelope=sin(PI*clamp(uProgress,0.,1.));
 if(uProgress<=0.||uProgress>=1.){gl_FragColor=vec4(0.);return;}
 float mask=0.;vec3 color=original.rgb;
 if(uKind==0){
  vec2 orb=(uv-vec2(.51,.66))/vec2(.29,.205);float radius=length(orb);
  mask=1.-smoothstep(.70,.88,radius);
  float scale=.22+uProgress*1.18;vec2 p=(orb-vec2(-.08,.03))/scale;float r=dot(p,p);float brush=0.;
  if(r<1.){brush=(exp(-r*5.)-EDGE)/(1.-EDGE);brush*=.55+.45*cos(sqrt(r)*PI*2.*2.);}
  float amount=brush*envelope*envelope;float theta=amount*.18*PI*2.;
  vec2 push=vec2(sin(theta),cos(theta))*amount*uStrength*vec2(1.,.70)*mask;
  color=texture2D(uTexture,uv+push).rgb;
 }else if(uKind==1){
  // Original x2 ellipse, measured in source pixels; rotation is not applied to card.
  vec2 px=uv*vec2(1051.,1496.)-vec2(520.,958.);
  float c=cos(-.485),s=sin(-.485);vec2 q=vec2(c*px.x+s*px.y,-s*px.x+c*px.y)/vec2(440.,155.);
  float radius=length(q);mask=smoothstep(.28,.43,radius)*(1.-smoothstep(.82,1.01,radius));
  float turn=.07*envelope*mask;float ct=cos(turn),st=sin(turn);
  vec2 warped=vec2(ct*q.x-st*q.y,st*q.x+ct*q.y)*vec2(440.,155.);
  vec2 samplePx=vec2(c*warped.x-s*warped.y,s*warped.x+c*warped.y)+vec2(520.,958.);
  color=texture2D(uTexture,samplePx/vec2(1051.,1496.)).rgb;
 }else if(uKind==2){
  // Inner crown facets only, excluding top beads, ears, forehead and eyes.
  vec2 p=uv*vec2(1049.,1499.);
  mask=crownMask(p);
  mask*=smoothstep(.10,.23,original.g-original.b)*smoothstep(.62,.83,original.r);
  float band=exp(-pow((uv.x-(.47+.22*uProgress))/.033,2.));
  color=original.rgb*(1.+.19*band*envelope); // reflected original gold; no white glyph.
 }else if(uKind==3){
  // Existing reset arrow face: ring section + its triangular arrowhead.
  vec2 px=uv*vec2(1062.,1482.);vec2 q=(px-vec2(540.,1000.))/vec2(276.,278.);
  float radius=length(q);float angle=atan(q.y,q.x);
  float ring=smoothstep(.58,.66,radius)*(1.-smoothstep(.96,1.01,radius));
  // Exclude upper-left gap; head supplied by the measured original triangle.
  float gap=1.-smoothstep(-2.85,-2.62,angle)*(1.-smoothstep(-1.73,-1.56,angle));
  float head=triangle(px,vec2(353.,809.),vec2(496.,719.),vec2(505.,906.));
  mask=max(ring*gap,head);
  mask*=smoothstep(.60,.84,min(original.r,original.g));
  float travel=-1.65+uProgress*5.9;float angular=atan(sin(angle-travel),cos(angle-travel));
  float band=exp(-pow(angular/.34,2.));
  // Reflections darken/lighten existing facet slightly, retaining luminous texture.
  color=original.rgb*(1.+.13*band*envelope);
 }
 else if(uKind>=4){
  // Normal sky only: original illustration samples, no new stars/lines/particles.
  float bottom=uSkyBottom;
  mask=smoothstep(.055,.08,uv.y)*(1.-smoothstep(bottom-.04,bottom,uv.y));
  mask*=smoothstep(.065,.095,uv.x)*(1.-smoothstep(.905,.935,uv.x));
  if(uSkyExclude.x<1.){ // Per-art exclusion, starts fading before protected silhouette.
   mask*=1.-smoothstep(uSkyExclude.x-.03,uSkyExclude.x,uv.x)*smoothstep(uSkyExclude.y-.025,uSkyExclude.y,uv.y);
  }
  vec2 pixel=1./max(uCssSize,vec2(1.));
  float time=uProgress*PI*2.;
  vec2 breeze=vec2(sin(uv.y*7.+time*.7)*1.4,cos(uv.x*6.+time*.5)*.65)*pixel;
  vec2 shift=breeze*envelope*mask;
  color=texture2D(uTexture,uv+shift).rgb;
  // Wide low-contrast illumination, not a sweeping white band or a new sparkle.
  float light=sin(uv.x*3.+uv.y*2.-time*.65)*.028*envelope;
  color*=1.+light;
 }
 if(mask<=0.){gl_FragColor=vec4(0.);return;}
 gl_FragColor=vec4(color,mask*original.a*envelope);
}`;
function create({source,sources={extra:source},duration=1200,strength=.007,maxDpr=1.5,useDOMImages=false}={}){
 const canvas=document.createElement('canvas');canvas.className='nb-special-refraction';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let host=null,raf=0,start=0,last=0,slow=0,disabled=!gl,disposed=false,loaded=false,visible=false,paused=false,readyResolve;
 const ready=new Promise(resolve=>readyResolve=resolve);
 let program,buffer,texture,progressLoc,strengthLoc,kindLoc,cssSizeLoc,skyBottomLoc,skyExcludeLoc;let cssWidth=1,cssHeight=1;const textures=new Map();const staging=document.createElement('canvas');const staging2d=staging.getContext('2d');const kinds={extra:0,double:1,max0:2,reset:3,...Object.fromEntries(Object.entries(NORMAL_SPECS).map(([key,spec])=>[key,spec.id]))};let activeKind='extra',activeDuration=duration;
 function stop(){cancelAnimationFrame(raf);raf=0;canvas.style.display='none';if(host)observer?.unobserve(host);host=null;canvas.remove();}
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries)if(e.target===host){visible=e.isIntersecting&&e.intersectionRatio>=.4;if(!visible)stop();}},{threshold:[0,.4,1]}):null;
 function allowed(){return !disabled&&!disposed&&!paused&&loaded&&!document.hidden&&!reduced.matches&&host?.isConnected&&host.getClientRects().length>0&&!host.closest('.hide,.hidden,.out,[hidden],[inert],[aria-hidden="true"],[data-revealed="false"]')&&getComputedStyle(host).visibility!=='hidden';}
 function draw(progress){
  if(!allowed())return false;
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,textures.get(activeKind).texture);gl.uniform1i(kindLoc,kinds[activeKind]);gl.uniform2f(cssSizeLoc,cssWidth,cssHeight);const spec=NORMAL_SPECS[activeKind];gl.uniform1f(skyBottomLoc,spec?.bottom||0);gl.uniform2f(skyExcludeLoc,spec?.exclude?.[0]??2,spec?.exclude?.[1]??2);gl.uniform1f(progressLoc,Math.max(0,Math.min(1,progress)));gl.uniform1f(strengthLoc,Math.max(0,Math.min(.01,strength)));
  gl.drawArrays(gl.TRIANGLES,0,3);return true;
 }
 function frame(now){
  if(!allowed()){stop();return;}
  if(last&&now-last<1000/30){raf=requestAnimationFrame(frame);return;}
  if(last&&now-last>120)slow++;else slow=Math.max(0,slow-1);
  if(slow>=4){disabled=true;stop();return;}
  last=now;const progress=(now-start)/activeDuration;
  if(progress>=1){stop();return;}
  draw(progress);raf=requestAnimationFrame(frame);
 }
 function mount(el,kind){
  if(!(kind in kinds))return false;
  // Production reuses the disclosed face's decoded WebP; no all-deck image preload.
  if(useDOMImages&&!textures.has(kind)){
   const image=el?.querySelector('img.card-art');
   if(!image?.complete||!image.naturalWidth||!sources[kind]||new URL(image.currentSrc||image.src,document.baseURI).href!==new URL(sources[kind],document.baseURI).href)return false;
   try{const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures.set(kind,{texture:tex,image,width:0,height:0});}catch{return false;}
  }
  if(!textures.has(kind))return false;activeKind=kind;
  if(!el||disabled||disposed||paused||!loaded||document.hidden||reduced.matches)return false;
  const rect=el.getBoundingClientRect();
  if(!rect.width||!rect.height||rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth)return false;
  stop();host=el;
  if(!allowed()){stop();return false;}
  cssWidth=rect.width;cssHeight=rect.height;const dpr=Math.min(devicePixelRatio||1,maxDpr);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
  // Prefilter the unchanged original to actual render resolution before any UV sampling.
  // Prevents native-resolution NPOT minification from introducing high-frequency sparkle.
  const entry=textures.get(kind);
  if(entry.width!==canvas.width||entry.height!==canvas.height){
   try{staging.width=canvas.width;staging.height=canvas.height;staging2d.imageSmoothingEnabled=true;staging2d.imageSmoothingQuality='high';staging2d.clearRect(0,0,staging.width,staging.height);staging2d.drawImage(entry.image,0,0,staging.width,staging.height);gl.bindTexture(gl.TEXTURE_2D,entry.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,staging);entry.width=canvas.width;entry.height=canvas.height;}catch{stop();return false;}
  }
  el.append(canvas);canvas.style.display='block';visible=true;observer?.observe(el);return true;
 }
 function shader(type,sourceCode){const s=gl.createShader(type);gl.shaderSource(s,sourceCode);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 if(gl){try{
  const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,FRAGMENT);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  skyBottomLoc=gl.getUniformLocation(program,'uSkyBottom');skyExcludeLoc=gl.getUniformLocation(program,'uSkyExclude');cssSizeLoc=gl.getUniformLocation(program,'uCssSize');kindLoc=gl.getUniformLocation(program,'uKind');progressLoc=gl.getUniformLocation(program,'uProgress');strengthLoc=gl.getUniformLocation(program,'uStrength');
  const entries=Object.entries(sources).filter(([kind,url])=>kind in kinds&&url);
  let pending=entries.length;if(!pending){disabled=true;readyResolve(false);}
  if(useDOMImages&&pending){loaded=true;readyResolve(true);}
  for(const [kind,url] of (useDOMImages?[]:entries)){
   const image=new Image();image.crossOrigin='anonymous';image.decoding='async';
   const finish=()=>{pending--;if(!pending){loaded=textures.size>0;disabled=!loaded;readyResolve(loaded);}};
   image.onload=()=>{if(disposed)return;try{
    const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    textures.set(kind,{texture:tex,image,width:0,height:0});
   }catch{}finish();};image.onerror=finish;image.src=url;
  }
  gl.uniform1i(gl.getUniformLocation(program,'uTexture'),0);
 }catch{disabled=true;readyResolve(false);}}else readyResolve(false);
 function visibility(){if(document.hidden||reduced.matches)stop();}
 function lost(event){event.preventDefault();disabled=true;stop();}
 document.addEventListener('visibilitychange',visibility);global.addEventListener('pagehide',stop);reduced.addEventListener?.('change',visibility);canvas.addEventListener('webglcontextlost',lost);
 return {ready,play(el,kind="extra",options={}){if(!mount(el,kind))return false;const requested=Number(options.duration);activeDuration=Number.isFinite(requested)&&requested>0?Math.max(200,Math.min(12000,requested)):(kinds[kind]>=4?8000:duration);start=performance.now();last=0;slow=0;raf=requestAnimationFrame(frame);return true;},stop,pause(){paused=true;stop();},resume(){paused=false;},
  // Deterministic review frame; still obeys face visibility / reduced-motion gates.
  renderAt(el,kind,progress){if(typeof kind==="number"){progress=kind;kind="extra";}return mount(el,kind)&&draw(progress);},
  readPixels(){if(!gl)return null;const pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return {width:canvas.width,height:canvas.height,pixels};},
  getActiveHost(){return host;},
  status(){return{loaded,disabled,active:!!raf,kind:host?activeKind:null,activeKind:host?activeKind:null,paused,canvasCount:1,duration:activeDuration};},
  destroy(){disposed=true;stop();readyResolve(false);observer?.disconnect();document.removeEventListener('visibilitychange',visibility);global.removeEventListener('pagehide',stop);reduced.removeEventListener?.('change',visibility);canvas.removeEventListener('webglcontextlost',lost);if(gl){gl.deleteBuffer(buffer);for(const entry of textures.values())gl.deleteTexture(entry.texture);textures.clear();gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}canvas.remove();}
 };
}
global.NumberBluffCardSurfaceMotion=Object.freeze({create,normalSpecs:NORMAL_SPECS});
})(window);
