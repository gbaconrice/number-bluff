/* Number Bluff original runtime-mask prototype. No third-party component code.
 * Unlike React Bits Glare Hover / RippleDistortion this changes only source RGB
 * at fixed coordinates. No SVG, particles, flow, geometric movement or new art.
 */
(function(global){'use strict';
const specs={
 '0':{file:'card-00-soft.png',bottom:.37},
 '1':{file:'card-01-soft.png',bottom:.33},
 '2':{file:'card-02-soft.png',bottom:.35},
 '3':{file:'card-03-soft.png',bottom:.33},
 '4':{file:'card-04-soft.png',bottom:.37,exclude:[[.62,.27,1,1]]},
 '5':{file:'card-05-soft.png',bottom:.35},
 '-5':{file:'card-minus05-soft.png',bottom:.38},
 '-10':{file:'card-minus10-soft.png',bottom:.38},
 '10':{file:'card-10-soft-v3.png',bottom:.38},
 '15':{file:'card-15-soft.png',bottom:.31},
 '20':{file:'card-20-soft-v2.png',bottom:.36,exclude:[[.73,.31,1,1]]}
};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function allowedPoint(key,x,y){const s=specs[key];return !!s&&x>.065&&x<.935&&y>.055&&y<s.bottom&&!(x>.25&&x<.75&&y>.07&&y<.30)&&!(s.exclude||[]).some(r=>x>=r[0]&&y>=r[1]&&x<=r[2]&&y<=r[3]);}
function create({baseURL='../number-bluff-soft-card-rebuild/',sources={},isSpecialActive=()=>false}={}){
 const canvas=document.createElement('canvas');canvas.className='nb-normal-sky';canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');const images=new Map();let host=null,key=null,base=null,mask=null,output=null,raf=0,last=0,start=0,generation=0,disposed=false,paused=false;
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.target===host&&(!e.isIntersecting||e.intersectionRatio<.4))stop();},{threshold:[0,.4,1]});
 function stop(){generation++;cancelAnimationFrame(raf);raf=0;canvas.style.display='none';if(host)observer.unobserve(host);host=null;}
 function allowed(){return !disposed&&!paused&&!document.hidden&&!reduced.matches&&!isSpecialActive()&&host?.isConnected&&!host.closest('.hidden,.out,[hidden],[inert],[aria-hidden="true"]');}
 function imageFor(k){if(!images.has(k))images.set(k,new Promise(resolve=>{const image=new Image();image.crossOrigin='anonymous';image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=sources[k]||baseURL+specs[k].file;}));return images.get(k);}
 function buildMask(){
  const w=canvas.width,h=canvas.height;const luma=new Float32Array(w*h),sum=new Float64Array((w+1)*(h+1));mask=new Float32Array(w*h);
  for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){const p=y*w+x,i=p*4;luma[p]=.2126*base.data[i]+.7152*base.data[i+1]+.0722*base.data[i+2];row+=luma[p];sum[(y+1)*(w+1)+x+1]=sum[y*(w+1)+x+1]+row;}}
  const r=Math.max(2,Math.round(w*.035));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=(x+.5)/w,v=(y+.5)/h,p=y*w+x;if(!allowedPoint(key,u,v))continue;
   const x0=Math.max(0,x-r),x1=Math.min(w,x+r+1),y0=Math.max(0,y-r),y1=Math.min(h,y+r+1);
   const mean=(sum[y1*(w+1)+x1]-sum[y0*(w+1)+x1]-sum[y1*(w+1)+x0]+sum[y0*(w+1)+x0])/((x1-x0)*(y1-y0));
   const localPeak=smooth(5,20,luma[p]-mean)*smooth(210,245,luma[p]);
   const feather=smooth(.065,.085,u)*(1-smooth(.915,.935,u))*smooth(.055,.07,v)*(1-smooth(specs[key].bottom-.02,specs[key].bottom,v));
   mask[p]=localPeak*feather;
  }
 }
 async function mount(el,k){
  if(!ctx||disposed||paused||document.hidden||reduced.matches||isSpecialActive()||!specs[k])return false;
  stop();const token=generation;const image=await imageFor(k);if(!image||token!==generation||disposed)return false;
  host=el;key=String(k);if(!allowed()){stop();return false;}const rect=el.getBoundingClientRect();if(!rect.width||rect.bottom<=0||rect.top>=innerHeight){stop();return false;}
  const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
  try{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);base=ctx.getImageData(0,0,canvas.width,canvas.height);output=ctx.createImageData(canvas.width,canvas.height);buildMask();}catch{stop();return false;}
  el.append(canvas);observer.observe(el);return true;
 }
 function draw(seconds){if(!allowed()){stop();return false;}const w=canvas.width,h=canvas.height;
  // Slow finite 8s breath; endpoints are exactly original. Different source stars
  // are weighted spatially, not replaced with animated new points or circles.
  const envelope=Math.pow(Math.sin(Math.PI*Math.max(0,Math.min(8,seconds))/8),2);
  output.data.fill(0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,i=p*4;if(mask[p]===0)continue;
   const phase=.65+.35*Math.sin(x/w*9+y/h*13+seconds*.7);
   const amount=.075*mask[p]*envelope*phase;
   let changed=false;for(let c=0;c<3;c++){output.data[i+c]=Math.round(base.data[i+c]*(1-amount));if(output.data[i+c]!==base.data[i+c])changed=true;}
   output.data[i+3]=changed?base.data[i+3]:0;
  }
  ctx.putImageData(output,0,0);canvas.style.display='block';return true;
 }
 function frame(now){if(!allowed()){stop();return;}if(now-last<1000/12){raf=requestAnimationFrame(frame);return;}last=now;const seconds=(now-start)/1000;if(seconds>=8){stop();return;}draw(seconds);raf=requestAnimationFrame(frame);}
 function refresh(){if(document.hidden||reduced.matches)stop();}
 document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);
 return{async play(el,k){if(!await mount(el,String(k)))return false;start=performance.now();last=0;raf=requestAnimationFrame(frame);return true;},async renderAt(el,k,seconds){return await mount(el,String(k))&&draw(seconds);},stop,
  pause(){paused=true;stop();},resume(){paused=false;},
  diagnose(){if(!base||!output)return null;let changed=0,outsideMask=0,protectedChanged=0,maxChange=0;for(let p=0;p<mask.length;p++){const i=p*4,d=output.data[i+3]?Math.max(...[0,1,2].map(c=>Math.abs(base.data[i+c]-output.data[i+c]))):0;if(d){changed++;maxChange=Math.max(maxChange,d);if(mask[p]===0)outsideMask++;const x=(p%canvas.width+.5)/canvas.width,y=(Math.floor(p/canvas.width)+.5)/canvas.height;if(!allowedPoint(key,x,y))protectedChanged++;}}return{key,changed,outsideMask,protectedChanged,maxChange,width:canvas.width,height:canvas.height,active:!!raf};},
  destroy(){disposed=true;stop();observer.disconnect();document.removeEventListener('visibilitychange',refresh);reduced.removeEventListener('change',refresh);canvas.remove();images.clear();}
 };
}
global.NumberBluffNormalSky=Object.freeze({create,specs,allowedPoint});
})(window);
