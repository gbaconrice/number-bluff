/* Number Bluff normal-sky + special shared-context prototype: localized original-art refraction.
 * Brush and composite displacement adapted from React Bits RippleDistortion,
 * Copyright (c) 2026 David Haz, MIT + Commons Clause. See THIRD_PARTY_NOTICES.txt.
 * Fused a single wave into one render pass; no React/OGL runtime or new artwork.
 */
(function(global){
'use strict';
const VERTEX=`attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const FRAGMENT=`precision highp float;
varying vec2 vUv;uniform sampler2D uTexture;uniform float uProgress;uniform float uStrength;uniform int uKind;uniform vec2 uCssSize;
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
  float bottom=uKind==4?.33:(uKind==5?.37:.36);
  mask=smoothstep(.055,.08,uv.y)*(1.-smoothstep(bottom-.04,bottom,uv.y));
  mask*=smoothstep(.065,.095,uv.x)*(1.-smoothstep(.905,.935,uv.x));
  if(uKind==5){ // card 4: exclude upper-right bunny ears with safety margin.
   mask*=1.-smoothstep(.59,.62,uv.x)*smoothstep(.245,.27,uv.y);
  }
  if(uKind==6){ // card 20: keep the illustrated moon edge stable too.
   mask*=1.-smoothstep(.70,.73,uv.x)*smoothstep(.285,.31,uv.y);
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
function create({source,sources={extra:source},duration=1200,strength=.007,maxDpr=1.5}={}){
 const canvas=document.createElement('canvas');canvas.className='nb-special-refraction';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let host=null,raf=0,start=0,last=0,slow=0,disabled=!gl,disposed=false,loaded=false,visible=false,readyResolve;
 const ready=new Promise(resolve=>readyResolve=resolve);
 let program,buffer,texture,progressLoc,strengthLoc,kindLoc,cssSizeLoc;let cssWidth=1,cssHeight=1;const textures=new Map();const staging=document.createElement('canvas');const staging2d=staging.getContext('2d');const kinds={extra:0,double:1,max0:2,reset:3,normal1:4,normal4:5,normal20:6};let activeKind='extra';
 function stop(){cancelAnimationFrame(raf);raf=0;canvas.style.display='none';if(host)observer?.unobserve(host);host=null;}
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const e of entries)if(e.target===host){visible=e.isIntersecting&&e.intersectionRatio>=.4;if(!visible)stop();}},{threshold:[0,.4,1]}):null;
 function allowed(){return !disabled&&!disposed&&loaded&&!document.hidden&&!reduced.matches&&host?.isConnected&&!host.closest('.hidden,.out,[hidden],[inert],[aria-hidden="true"],[data-revealed="false"]');}
 function draw(progress){
  if(!allowed())return false;
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,textures.get(activeKind).texture);gl.uniform1i(kindLoc,kinds[activeKind]);gl.uniform2f(cssSizeLoc,cssWidth,cssHeight);gl.uniform1f(progressLoc,Math.max(0,Math.min(1,progress)));gl.uniform1f(strengthLoc,Math.max(0,Math.min(.01,strength)));
  gl.drawArrays(gl.TRIANGLES,0,3);return true;
 }
 function frame(now){
  if(!allowed()){stop();return;}
  if(last&&now-last<1000/30){raf=requestAnimationFrame(frame);return;}
  if(last&&now-last>120)slow++;else slow=Math.max(0,slow-1);
  if(slow>=4){disabled=true;stop();return;}
  last=now;const progress=(now-start)/(kinds[activeKind]>=4?8000:duration);
  if(progress>=1){stop();return;}
  draw(progress);raf=requestAnimationFrame(frame);
 }
 function mount(el,kind){
  if(!(kind in kinds)||!textures.has(kind))return false;activeKind=kind;
  if(!el||disabled||disposed||!loaded||document.hidden||reduced.matches)return false;
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
  cssSizeLoc=gl.getUniformLocation(program,'uCssSize');kindLoc=gl.getUniformLocation(program,'uKind');progressLoc=gl.getUniformLocation(program,'uProgress');strengthLoc=gl.getUniformLocation(program,'uStrength');
  const entries=Object.entries(sources).filter(([kind,url])=>kind in kinds&&url);
  let pending=entries.length;if(!pending){disabled=true;readyResolve(false);}
  for(const [kind,url] of entries){
   const image=new Image();image.crossOrigin='anonymous';image.decoding='async';
   const finish=()=>{pending--;if(!pending){loaded=textures.size>0;disabled=!loaded;readyResolve(loaded);}};
   image.onload=()=>{if(disposed)return;try{
    const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    /* Allocate GPU pixels only at the first visible mount, after prefiltering. */ textures.set(kind,{texture:tex,image,width:0,height:0});
   }catch{}finish();};image.onerror=finish;image.src=url;
  }
  gl.uniform1i(gl.getUniformLocation(program,'uTexture'),0);
 }catch{disabled=true;readyResolve(false);}}else readyResolve(false);
 function visibility(){if(document.hidden||reduced.matches)stop();}
 function lost(event){event.preventDefault();disabled=true;stop();}
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener?.('change',visibility);canvas.addEventListener('webglcontextlost',lost);
 return {ready,play(el,kind="extra"){if(!mount(el,kind))return false;start=performance.now();last=0;slow=0;raf=requestAnimationFrame(frame);return true;},stop,
  // Deterministic review frame; still obeys face visibility / reduced-motion gates.
  renderAt(el,kind,progress){if(typeof kind==="number"){progress=kind;kind="extra";}return mount(el,kind)&&draw(progress);},
  readPixels(){if(!gl)return null;const pixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return {width:canvas.width,height:canvas.height,pixels};},
  status(){return{loaded,disabled,active:!!raf,canvasCount:1};},
  destroy(){disposed=true;stop();readyResolve(false);observer?.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener?.('change',visibility);canvas.removeEventListener('webglcontextlost',lost);if(gl){gl.deleteBuffer(buffer);for(const entry of textures.values())gl.deleteTexture(entry.texture);textures.clear();gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}canvas.remove();}
 };
}
global.NumberBluffCardSurfaceMotion=Object.freeze({create});
})(window);
