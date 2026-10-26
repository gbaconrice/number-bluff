// Deterministic production-UI tests; no private state hooks or fake network SDK.
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
const engine = createRequire(import.meta.url)('../engine.js');
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../artifacts/', import.meta.url);
await mkdir(output, { recursive: true });
const assets = ['star-sprite','moon-cat','cloud-bunny','blue-cloud','cloud-foreground','home-hero','home-logo','celestial-background-v3','card-cream-star','card-pink-bunny','card-gold-cat','card-ice-cloud','card-double','card-max0','card-extra','card-reset','card-pink-bunny-2','card-cream-star-4','card-cream-star-10','card-cream-star-20','card-gold-cat-15','card-ice-cloud-minus5','card-ice-cloud-minus10'];
const faceByValue={'-10':'card-ice-cloud-minus10','-5':'card-ice-cloud-minus5','0':'card-ice-cloud','1':'card-pink-bunny','2':'card-pink-bunny-2','3':'card-cream-star','4':'card-cream-star-4','5':'card-gold-cat','10':'card-cream-star-10','15':'card-gold-cat-15','20':'card-cream-star-20'};
const files = new Map([['/', ['index.html','text/html']], ...['index.html','ai-studio.html','app.js','engine.js','scheduler.js','background-motion.js','card-presentation.js','gravity-room-adapter.js','gravity-platform.js','styles.css','background-motion.css','card-presentation.css'].map(p=>['/'+p,[p,p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'text/javascript']]), ...assets.map(n=>[`/assets/${n}.webp`,[`assets/${n}.webp`,'image/webp']])]);
const provenance = await Promise.all(assets.map(n=>`assets/${n}.webp`).map(async path=>{const b=await readFile(root+path);return {path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};}));
await writeFile(new URL('asset-provenance.json',output),JSON.stringify(provenance,null,2));
const server=http.createServer(async(req,res)=>{const p=new URL(req.url,'http://localhost').pathname;if(p==='/favicon.ico'){res.writeHead(204).end();return;}const f=files.get(p);if(!f){res.writeHead(404).end();return;}try{const b=await readFile(root+f[0]);res.writeHead(200,{'content-type':f[1],'cache-control':'no-store','access-control-allow-origin':'*'}).end(b);}catch{res.writeHead(500).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,results=[];
let browser;
const watchdog=setTimeout(async()=>{results.push({status:'failed',stage:'global-timeout'});await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));process.exit(1);},7*60*1000);watchdog.unref();
async function settleCardMotion(page){await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity&&a.effect?.target?.closest?.('.presentation-card,.presentation-extra,.presentation-zero-stamp,.presentation-vortex,.presentation-bid-pulse,.presentation-refresh,.final-total,#result .result-message,#result .calculation,#resultAvatar,#finalTotal')).map(a=>a.finished.catch(()=>{})));});}
async function completePresentation(page){if(await page.locator('#result').getAttribute('data-presentation-phase')!=='complete')await page.clock.runFor(5000);assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete');await settleCardMotion(page);}
async function advanceResult(page){await completePresentation(page);await page.clock.runFor(401);await page.locator('#next').click();}
async function shot(page,width,state){
 await settleCardMotion(page);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${state}: horizontal overflow`);
 const controls=await page.locator('button,input').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const target=e.type==='checkbox'?e.closest('label')||e:e;const r=target.getBoundingClientRect();return{id:e.id,name:e.getAttribute('aria-label')||e.labels?.[0]?.textContent||e.textContent.trim(),w:r.width,h:r.height};}));
 for(const c of controls){assert.ok(c.name,`${state}: unlabeled ${c.id}`);assert.ok(c.w>=40&&c.h>=40,`${state}: small touch target ${c.id} ${c.w}x${c.h}`);}
 const labels=await page.locator('.kind-number .card-value').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const label=e.getBoundingClientRect(),card=e.closest('.player-card').getBoundingClientRect();return{text:e.textContent,label:label.toJSON(),card:card.toJSON(),glyphFits:e.scrollWidth<=e.clientWidth};}));
 for(const item of labels){assert.ok(Math.abs((item.label.left+item.label.right-item.card.left-item.card.right)/2)<=1,`${state}: numeric label not centered ${JSON.stringify(item)}`);assert.ok(item.label.top>=item.card.top&&item.label.bottom<=item.card.top+item.card.height*.38+1,`${state}: numeric label outside upper38% slot ${JSON.stringify(item)}`);assert.equal(item.glyphFits,true,`${state}: numeric glyph clipped ${item.text}`);}
 const faces=await page.locator('.kind-number:not(.hidden):not(.out)').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>({value:e.dataset.artValue,label:e.querySelector('.card-value')?.textContent,image:getComputedStyle(e).backgroundImage})));for(const face of faces){assert.equal(String(Number(face.label)),face.value,`${state}: visible number art attribute must match value`);assert.ok(face.image.includes('/'+faceByValue[face.value]+'.webp'),`${state}: deterministic per-value illustration mismatch ${JSON.stringify(face)}`);}
 await page.screenshot({path:fileURLToPath(new URL(`${width}-${state}.png`,output)),fullPage:true});
}
async function landscapeReachability(page,label,topInset=0){
 const controls=()=>page.locator('#homeBtn,#rulesBtn,#number,#keypad,#declare,#challenge').evaluateAll(els=>els.map(e=>({id:e.id,...e.getBoundingClientRect().toJSON()})));
 const before=await controls();for(const r of before)assert.ok(r.top>=topInset&&r.bottom<=390+1&&r.left>=0&&r.right<=844,`landscape action obstructed ${JSON.stringify(r)}`);
 const grid=page.locator('#playerGrid'),players=page.locator('#playerGrid .battle-player'),reachable=[];
 for(const player of await players.all()){
  await player.scrollIntoViewIfNeeded();const item=await player.evaluate(e=>{const card=e.querySelector('.player-card').getBoundingClientRect(),r=e.getBoundingClientRect(),g=document.getElementById('playerGrid').getBoundingClientRect(),name=e.querySelector('.player-name'),a=e.querySelector('.avatar').getBoundingClientRect();return{id:e.dataset.player,player:r.toJSON(),card:card.toJSON(),grid:g.toJSON(),nameSize:parseFloat(getComputedStyle(name).fontSize),avatarWidth:a.width,avatarHeight:a.height,y:scrollY};});
  assert.ok(item.grid.height>=item.player.height-1,'landscape grid must fit an entire player identity and card, not a thin clipped strip');assert.ok(item.player.top>=item.grid.top-1&&item.player.bottom<=item.grid.bottom+1,`landscape player not fully reachable ${JSON.stringify(item)}`);assert.ok(item.card.width>=48&&item.card.height>=68&&item.nameSize>=10&&item.avatarWidth>=24&&item.avatarHeight>=24,'landscape cards/identity must remain readable');assert.equal(item.y,0,'only landscape player grid may scroll');reachable.push(item);
 }
 assert.deepEqual(await controls(),before,'landscape grid scroll must not displace actions');await grid.evaluate(e=>{e.scrollTop=0;});await writeFile(new URL(`${label}-landscape-geometry.json`,output),JSON.stringify({topInset,controls:before,reachable},null,2));
}
async function fit(page,width){
 if(width===844){await landscapeReachability(page,`844-${await page.locator('#playerGrid .battle-player').count()}players`);return;}
 if(width!==320&&width!==390)return;
 assert.equal(await page.locator('#playerGrid').evaluate(e=>e.scrollHeight<=e.clientHeight+1),true,'standard phone must show all player rows without internal clipping/scroll');
 const b=await page.evaluate(()=>({y:scrollY,h:innerHeight,w:innerWidth,items:[...document.querySelectorAll('#playerGrid .player-card,#number,#keypad,#declare,#challenge')].map(e=>({name:e.id||e.parentElement.dataset.player,...JSON.parse(JSON.stringify(e.getBoundingClientRect()))}))}));
 assert.equal(b.y,0,'battle initial scroll must be zero');assert.ok(b.items.length>=6);
 for(const r of b.items)assert.ok(r.width>0&&r.height>0&&r.top>=0&&r.bottom<=b.h&&r.left>=0&&r.right<=b.w,`${width}: ${r.name} outside initial viewport ${JSON.stringify(r)}`);
}
async function inverse(page){
 const own=page.locator('#humanCard');
 if((await own.getAttribute('class')).includes('out')){assert.equal(await own.locator('.card-art-motion').count(),0);assert.equal(await own.getAttribute('data-art-value'),null);return;}
 assert.equal((await own.textContent()).trim(),'?');assert.doesNotMatch(await own.ariaSnapshot(),/\d/);
 assert.equal(await own.locator('img,.card-value,.card-art-motion').count(),0,'hidden own card must not contain real face or illustration layer');assert.equal(await own.getAttribute('data-art-value'),null);assert.equal(await own.evaluate(e=>getComputedStyle(e,'::after').animationName),'none','hidden own card must not have face shimmer');
 const attrs=await own.evaluate(e=>[...e.attributes].filter(a=>/^(data-|title|aria-)/.test(a.name)).map(a=>a.value).join(' '));assert.doesNotMatch(attrs,/\d/);
 const others=page.locator('#playerGrid [data-player]:not([data-player="p1"]) .player-card:not(.out)');
 for(const card of await others.all()){assert.ok(!(await card.getAttribute('class')).includes('hidden'));assert.ok((await card.locator('.card-value').textContent()).trim());}
 assert.equal((await page.locator('#calculationSteps').textContent()).trim(),'','stale calculation retained during play');
}
async function backgroundChecks(page,width){
 assert.equal(await page.locator('.nb-background').getAttribute('aria-hidden'),'true');assert.equal(await page.locator('.nb-background').evaluate(e=>getComputedStyle(e).pointerEvents),'none');assert.equal(await page.locator('.nb-background__star').count(),16);assert.equal(await page.locator('.nb-background__clouds').count(),1);assert.equal(await page.locator('.nb-background__clouds-back').count(),1);assert.equal(await page.locator('.nb-background__nebula').count(),1);assert.equal(await page.locator('.nb-background__shooting-star').count(),1);assert.equal(await page.evaluate(()=>NumberBluffBackground.state.running),true);
 const snapshot=()=>page.evaluate(()=>({boxes:[...document.querySelectorAll('.home-brand,.home-art img,.home-actions button')].map(e=>e.getBoundingClientRect().toJSON()),cloud:getComputedStyle(document.querySelector('.nb-background__clouds')).transform,layers:[...document.querySelectorAll('.nb-background__clouds,.nb-background__clouds-back,.nb-background__nebula')].map(e=>{const c=getComputedStyle(e),m=new DOMMatrix(c.transform);return{name:e.className,x:m.m41,y:m.m42,opacity:Number(c.opacity),animation:c.animationName};})}));
 const before=await snapshot();await page.waitForTimeout(1200);const after=await snapshot();assert.deepEqual(after.boxes,before.boxes,'background motion must never move foreground UI');assert.notEqual(after.cloud,before.cloud,'cloud layer must actually animate');for(const previous of before.layers){const current=after.layers.find(x=>x.name===previous.name);assert.ok(current.opacity>0&&current.animation!=='none','decorative layer must be visible and animated');if(previous.name!=='nb-background__nebula')assert.ok(Math.hypot(current.x-previous.x,current.y-previous.y)>=.5,`cloud motion must visibly move over1.2s: ${JSON.stringify({previous,current})}`);}
 await page.evaluate(()=>NumberBluffBackground.setEnabled(false));assert.equal(await page.evaluate(()=>NumberBluffBackground.state.running),false);assert.equal(await page.locator('.nb-background__clouds').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('.nb-background__clouds-back,.nb-background__nebula').evaluateAll(els=>els.every(e=>getComputedStyle(e).animationName==='none')),true);assert.equal(await page.locator('.nb-background__shooting-star').evaluate(e=>getComputedStyle(e).display),'none');
 await page.evaluate(()=>NumberBluffBackground.setEnabled(true));await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>NumberBluffBackground.state.running),false);assert.equal(await page.locator('.nb-background__clouds').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('.nb-background__clouds-back,.nb-background__nebula').evaluateAll(els=>els.every(e=>getComputedStyle(e).animationName==='none')),true);await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(50);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.locator('.nb-background').getAttribute('data-motion'),'paused');assert.equal(await page.locator('.nb-background__clouds').evaluate(e=>getComputedStyle(e).animationPlayState),'paused');await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>NumberBluffBackground.state.running),true);
 await writeFile(new URL(`${width}-background-motion.json`,output),JSON.stringify({before,after,defaultRunning:true,reducedMotionStatic:true,hiddenPaused:true},null,2));
}
async function illustrationMotionChecks(page){
 const expected={number:'art-cloud-drift',double:'art-galaxy-orbit',max0:'art-crown-glow',extra:'art-orb-pulse',reset:'art-reset-orbit'};
 const evidence=await page.evaluate(expected=>Object.entries(expected).map(([kind,name])=>{
  const card=document.querySelector('#guideContent .kind-'+kind),layer=card.querySelector('.card-art-motion'),value=card.querySelector('.card-value');if(!layer||layer.getAttribute('aria-hidden')!=='true')throw Error('Missing decorative layer '+kind);
  const animation=layer.getAnimations({subtree:true}).find(a=>a.animationName===name);if(!animation)throw Error('Missing illustration motion '+kind);
  const oldTime=animation.currentTime,oldState=animation.playState,timing=animation.effect.getTiming();animation.pause();
  const frames=[.25,.5].map(fraction=>{animation.currentTime=Number(timing.duration)*fraction-Number(timing.delay);const c=getComputedStyle(layer,'::before');return{transform:c.transform,opacity:Number(c.opacity),animation:c.animationName,card:card.getBoundingClientRect().toJSON(),value:value.getBoundingClientRect().toJSON(),layer:layer.getBoundingClientRect().toJSON()};});
  animation.currentTime=oldTime;if(oldState==='running')animation.play();return{kind,frames};
 }),expected);
 for(const item of evidence){const[a,b]=item.frames;assert.notEqual(a.transform,b.transform,`${item.kind} illustration must move`);assert.deepEqual(a.card,b.card,'illustration must not move cardframe');assert.deepEqual(a.value,b.value,'illustration must not move number or special label');for(const f of item.frames){assert.ok(f.opacity>0);assert.ok(f.layer.top>=f.card.top+f.card.height*.38&&f.layer.bottom<=f.card.bottom+1&&f.layer.left>=f.card.left&&f.layer.right<=f.card.right,'illustration layer must stay below label and within frame');}}
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);assert.equal(await page.locator('#guideContent .card-art-motion').evaluateAll(els=>els.every(e=>getComputedStyle(e).display==='none'&&getComputedStyle(e,'::before').animationName==='none')),true);await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(50);
 await writeFile(new URL('illustration-motion.json',output),JSON.stringify({scope:'CSS-only samples; no private state or game RNG changes',evidence,reducedMotionStatic:true},null,2));
}
async function visibleCardEffects(page){
 await settleCardMotion(page);
 const evidence=await page.evaluate(()=>{
  function sample(element,name,positions){
   const animation=element.getAnimations({subtree:true}).find(a=>a.animationName===name);if(!animation)throw Error('Missing visible animation '+name);
   const oldTime=animation.currentTime,oldState=animation.playState,delay=Number(animation.effect.getTiming().delay)||0;animation.pause();
   const frames=positions.map(at=>{animation.currentTime=at-delay;const c=getComputedStyle(element,'::after');return{at,transform:c.transform,opacity:Number(c.opacity),display:c.display,pointerEvents:c.pointerEvents,box:element.getBoundingClientRect().toJSON()};});
   animation.currentTime=oldTime;if(oldState==='finished')animation.finish();else if(oldState==='running')animation.play();return frames;
  }
  return{foil:sample(document.querySelector('#playerGrid .player-card:not(.hidden):not(.out)'),'card-foil-sweep',[1600,2240]),outcome:sample(document.querySelector('#result .result-message'),'outcome-sparkles',[312.5,800])};
 });
 for(const [name,frames]of Object.entries(evidence)){assert.notEqual(frames[0].transform,frames[1].transform,`${name} must visibly travel`);for(const f of frames){assert.ok(f.opacity>0&&f.display!=='none',`${name} must be visibly rendered`);assert.equal(f.pointerEvents,'none');}assert.deepEqual(frames[0].box,frames[1].box,`${name} must not displace content`);}
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);assert.equal(await page.locator('#playerGrid .player-card').first().evaluate(e=>getComputedStyle(e,'::after').display),'none');assert.equal(await page.locator('#result .result-message').evaluate(e=>getComputedStyle(e,'::after').display),'none');await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(50);
 await writeFile(new URL('card-effects-motion.json',output),JSON.stringify({scope:'CSS-only deterministic animation sampling, no game state manipulation',...evidence,reducedMotionStatic:true},null,2));
}
async function art(page){
 const evidence=await page.evaluate(async names=>{
  const evidence=[];for(const name of names){const im=new Image();im.src=`assets/${name}.webp`;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let transparent=0,visible=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)transparent++;if(d[i]>0)visible++;}evidence.push({name,width:c.width,height:c.height,transparent,visible});}
  for(const im of document.querySelectorAll('img'))await im.decode();return evidence;
 },assets);
 for(const a of evidence){assert.ok(a.width>=512&&a.height>=512&&a.visible>0);if(!a.name.startsWith('celestial-background'))assert.ok(a.transparent>0);}
 const imgs=await page.locator('.home-brand,.home-art img').evaluateAll(els=>els.map(e=>({src:e.getAttribute('src'),fit:getComputedStyle(e).objectFit,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,w:innerWidth})));
 for(const i of imgs){assert.equal(i.fit,'contain');assert.ok(i.left>=0&&i.right<=i.w,`home artwork clips horizontally: ${JSON.stringify(i)}`);}
 return evidence;
}
async function tick(page){await page.clock.runFor(1200);}
async function configure(page,count){
 while(await page.locator('#lobbyPlayers [data-seat]').count()>count)await page.locator('#removeBot').click();
 while(await page.locator('#lobbyPlayers [data-seat]').count()<count)await page.locator('#addBot').click();
 assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),count);
}
async function lobbyConfig(page){return page.locator('#lobbyPlayers [data-seat]').evaluateAll(nodes=>nodes.map(e=>({id:e.dataset.seat,src:e.querySelector('.avatar')?.getAttribute('src')||null,name:e.querySelector('strong').textContent,difficulty:(e.querySelector('small').textContent.match(/やさしい|普通|強い/)||[])[0]||null})));}
async function begin(page,width,count){await configure(page,count);await page.locator('#beginGame').click();assert.equal(await page.locator('#playerGrid [data-player]').count(),count);assert.equal(await page.locator('#declare').isEnabled(),true);assert.equal(await page.locator('#number').inputValue(),'1','first declaration starts at one');await inverse(page);await shot(page,width,`battle-${count}`);if(count===8){const geometry=await page.locator('#playerGrid .battle-player').evaluateAll(nodes=>nodes.map(e=>{const c=e.querySelector('.player-card').getBoundingClientRect(),a=e.querySelector('.avatar').getBoundingClientRect();return{id:e.dataset.player,ratio:c.width/c.height,nameSize:parseFloat(getComputedStyle(e.querySelector('.player-name')).fontSize),avatarWidth:a.width,avatarHeight:a.height};}));await writeFile(new URL(`${width}-eight-geometry.json`,output),JSON.stringify(geometry,null,2));for(const item of geometry){assert.ok(item.ratio>=.68&&item.ratio<=.72,`portrait card ratio ${JSON.stringify(item)}`);assert.ok(item.nameSize>=10&&item.avatarWidth>=24&&item.avatarHeight>=24,`legible player identity ${JSON.stringify(item)}`);}}await fit(page,width);}

async function exit(page){
 await page.locator('#homeBtn').click();await page.locator('#confirmRestart').click();
 assert.equal(await page.locator('#homeScreen').isVisible(),true);
}
async function keypad(page,width){
 assert.equal(await page.locator('#number').getAttribute('inputmode'),'none');assert.equal(await page.locator('#keypad [data-digit]').count(),10);
 await page.locator('[data-digit="7"]').click();assert.equal(await page.locator('#number').inputValue(),'7');await page.locator('[data-digit="2"]').click();assert.equal(await page.locator('#number').inputValue(),'72');
 await page.locator('#backspace').click();assert.equal(await page.locator('#number').inputValue(),'7');await page.locator('#backspace').click();assert.equal(await page.locator('#number').inputValue(),'');
 for(const value of ['','0','-1','1.5','abc','1e2','9007199254740992']){await page.locator('#number').fill(value);await page.locator('#declare').click();assert.equal(await page.locator('#number').getAttribute('aria-invalid'),'true');assert.equal((await page.locator('#bid').textContent()).trim(),'—');assert.ok((await page.locator('#inputError').textContent()).trim());}
 await shot(page,width,'keypad-invalid');await page.locator('#number').fill('9007199254740991');await page.locator('[data-digit="9"]').click();assert.equal(await page.locator('#number').inputValue(),'9007199254740991');assert.equal((await page.locator('#bid').textContent()).trim(),'—');
}
async function revealCheck(page){
 await completePresentation(page);
 const total=(await page.locator('#finalTotal').textContent()).trim();assert.match(total,/^-?\d+$/);assert.ok((await page.locator('#calculationSteps').textContent()).includes('数字の合計'));assert.ok((await page.locator('#resultText').textContent()).trim());
 assert.equal(await page.locator('#keypad button:enabled').count(),0);
 // The visible equation must agree with its displayed final total; independent
 // physical-card/special-effect correctness is covered by engine oracle tests.
 const equations=await page.locator('#calculationSteps .calc-expression').allTextContents();const last=equations.filter(t=>t.includes('=')).at(-1);assert.equal(Number(last.split('=').at(-1).trim()),Number(total));
 const own=page.locator('#humanCard');const ownClass=await own.getAttribute('class');if(!ownClass.includes('out')){
  // '?' is a real extra-card face in the 36-card deck, not always a card back.
  assert.ok(!ownClass.includes('hidden'),'revealed card still uses hidden/back state');
  assert.equal(await own.locator('.card-value').count(),1,'reveal requires an actual face label');
  assert.match(await own.evaluate(e=>getComputedStyle(e).backgroundImage),/assets\/card-[^/]+\.webp/,'reveal requires actual generated frame artwork');
  assert.doesNotMatch(await own.getAttribute('aria-label'),/非公開/);
  if((await own.locator('.card-value').textContent()).trim()==='?')assert.ok(ownClass.includes('kind-extra'),'question-mark face must identify the extra-card kind');
 }
}
async function finishMatch(page,width,count,label){
 let rounds=0,spectated=false,special=false;
 for(let step=0;step<450;step++){
  if(await page.locator('#next').isVisible()){
   rounds++;await revealCheck(page);const text=await page.locator('#resultText').textContent();
   if(await page.locator('#playerGrid .special').count()){if(!special)await shot(page,width,`${label}-special-reveal`);special=true;}
   if(rounds===1)await shot(page,width,`${label}-reveal`);
   if(text.includes('優勝')){await shot(page,width,`${label}-finished`);return{rounds,spectated,special,text};}
   await advanceResult(page);
  }else if(await page.locator('#declare').isEnabled()){
   await inverse(page);await page.locator('#number').fill('999');await page.locator('#declare').click();
  }else{
   if((await page.locator('#humanCard').getAttribute('class')).includes('out')&&!spectated){spectated=true;assert.match(await page.locator('#status').textContent(),/脱落/);await shot(page,width,`${label}-spectator`);}
   await tick(page);
  }
 }
 throw Error(`${count}-player match did not terminate within 450 public UI transitions`);
}
async function setup(width,packaged=false,initialize=null){
 const context=await browser.newContext({viewport:{width,height:width===320?640:width===844?390:844},serviceWorkers:'block',reducedMotion:'no-preference'});const page=await context.newPage();page.setDefaultTimeout(10_000);page.setDefaultNavigationTimeout(15_000);const errors=[],external=[],mapped=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();
  if(packaged&&u.href.startsWith('https://tanabe0422.github.io/number-bluff/assets/')){const p='/assets/'+u.pathname.split('/assets/')[1],f=files.get(p);assert.ok(f,'unrecognized packaged asset');mapped.push(u.href);return route.fulfill({status:200,contentType:f[1],headers:{'access-control-allow-origin':'*'},body:await readFile(root+f[0])});}
  external.push(u.href);return route.abort('blockedbyclient');});
 await page.addInitScript(()=>{let seed=30;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  // Observe the real WebAudio oscillator without replacing its behavior.
  window.__audioStarts=0;const proto=window.OscillatorNode?.prototype;if(proto){const start=proto.start;proto.start=function(...a){window.__audioStarts++;return start.apply(this,a);};}
 });
 const time=new Date('2026-01-01T00:00:00Z');await page.clock.install({time});await page.clock.pauseAt(new Date(time.getTime()+1000));
 if(initialize)await initialize(page,context);
 await page.goto(origin+(packaged?'/ai-studio.html':''));return{context,page,errors,external,mapped};
}
try{
 browser=await chromium.launch();
 for(const width of [320,390,844,1280]){
  const {context,page,errors,external}=await setup(width);
  try{
   await page.locator('#startGame').waitFor({state:'visible'});assert.equal(await page.locator('.home-actions button').count(),2);assert.equal(await page.locator('.home-icons button').count(),1);assert.equal(await page.locator('#homeCards,.hero-copy').count(),0);assert.doesNotMatch(await page.locator('#homeScreen').textContent(),/だませる|見抜ける|カード図鑑/);await shot(page,width,'home');await page.evaluate(()=>NumberBluffClient.setRoomAdapterExpected(true));await page.locator('#startGame').click();assert.match(await page.locator('#roomCreateStatus').textContent(),/接続待ち/);assert.equal(await page.locator('#homeScreen').isVisible(),true);await page.evaluate(()=>NumberBluffClient.setRoomAdapterExpected(false));const artwork=await art(page);await backgroundChecks(page,width);
   await page.locator('#joinGame').click();assert.equal(await page.locator('#joinPanel input').count(),1);assert.equal(await page.locator('#joinLocal').count(),0);await page.locator('#roomId').fill('ROOM-TEST');await page.locator('#joinRoom').click();assert.match(await page.locator('#roomJoinStatus').textContent(),/接続待ち/);assert.equal(await page.locator('#joinPanel').isVisible(),true);await shot(page,width,'join-unconnected');await page.locator('#closeJoin').click();
   await page.locator('#homeRules').click();assert.equal(await page.locator('.guide-tabs button[data-tab]').count(),4);assert.equal(await page.locator('#guideTitle').getAttribute('class'),'sr-only');
   for(const tab of ['rules','cards','bots','examples']){await page.locator(`.guide-tabs button[data-tab="${tab}"]`).click();assert.equal(await page.locator(`.guide-tabs button[data-tab="${tab}"]`).getAttribute('aria-selected'),'true');if(tab==='cards'){
     const text=await page.locator('#guideContent').textContent();assert.match(text,/全36枚/);assert.match(text,/32枚/);assert.match(text,/特殊カード 4枚/);const shown=await page.locator('#guideContent .catalogue:not(.special-catalogue) > .catalogue-item').evaluateAll(items=>items.map(e=>({label:e.querySelector('.card-value').textContent,count:Number(e.querySelector('small').textContent.replace('×',''))})));const grouped=new Map();for(const c of engine.FULL_DECK.filter(c=>c.kind==='number'))grouped.set(c.label,(grouped.get(c.label)||0)+1);assert.equal(shown.length,grouped.size);for(const c of shown)assert.equal(c.count,grouped.get(c.label),`wrong count for ${c.label}`);for(const label of ['MAX→0','×2','リセット','?'])assert.ok(text.includes(label));
     const label=page.locator('#guideContent .kind-max0 .card-value');const bounds=await label.evaluate(e=>({text:e.textContent,inner:e.getBoundingClientRect().toJSON(),outer:e.closest('.player-card').getBoundingClientRect().toJSON()}));assert.equal(bounds.text,'MAX→0');assert.ok(bounds.inner.left>=bounds.outer.left&&bounds.inner.right<=bounds.outer.right,'MAX→0 label clipped');assert.equal(await label.evaluate(e=>e.scrollWidth<=e.clientWidth),true,'MAX→0 glyph text must fit label box');assert.equal(await page.locator('#guideContent .kind-number').count(),Object.keys(faceByValue).length,'catalogue must cover every numeric face');if(width===390)await illustrationMotionChecks(page);
    }if(tab==='examples')assert.equal(await page.locator('#guideContent .example').count(),3);await shot(page,width,`guide-${tab}`);if(tab==='cards'){await page.locator('#guideContent .kind-max0').click();assert.equal(await page.locator('#cardDetail').evaluate(e=>e.open),true);assert.match(await page.locator('#cardDetailContent').textContent(),/MAX→0/);await shot(page,width,'card-detail');await page.keyboard.press('Escape');assert.equal(await page.locator('#cardDetail').evaluate(e=>e.open),false);assert.equal(await page.locator('#guidePanel').isVisible(),true);await page.locator('#guideContent .kind-reset').click();await page.locator('#closeCardDetail').click();assert.equal(await page.locator('#cardDetail').evaluate(e=>e.open),false);}}
   await page.locator('#closeGuide').click();assert.equal(await page.locator('#homeRules').evaluate(e=>e===document.activeElement),true);
   assert.equal(await page.locator('#homeSettings,.settings-open,#settingsPanel,#soundToggle,#motionToggle').count(),0,'removed settings controls must not return');
   await page.locator('#startGame').click();assert.equal(await page.locator('#lobbyPlayers').locator(':scope > *').count(),8);assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),1,'standalone create must start with one real host and zero bots');assert.equal(await page.locator('#beginGame').isDisabled(),true);assert.equal(await page.locator('#roomIdentity').isVisible(),false,'standalone room must not invent an online room ID');await shot(page,width,'created-local-host-room');await configure(page,4);assert.equal(await page.locator('[data-seat="p1"] .person-placeholder').count(),1);assert.equal(await page.locator('[data-seat="p1"] strong').textContent(),'プレイヤー');await shot(page,width,'lobby-4');assert.equal(await page.locator('#lobbyScreen .room-line').count(),0);const headingStyle=await page.locator('#lobbyScreen .topbar h1').evaluate(e=>({family:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight,color:getComputedStyle(e).color}));assert.ok(!headingStyle.family.includes('TitleMochiy'),'generic headings must not mix partial title-font glyphs');assert.equal(headingStyle.weight,'700');assert.equal(headingStyle.color,'rgb(255, 255, 255)');
   for(const difficulty of ['easy','normal','hard']){await page.locator(`[data-difficulty="${difficulty}"]`).click();assert.equal(await page.locator(`[data-difficulty="${difficulty}"]`).getAttribute('aria-pressed'),'true');}
   await page.locator('[data-avatar="3"]').click();assert.equal(await page.locator('[data-avatar="3"]').getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#lobbyPlayers .selected img').getAttribute('src')).endsWith('blue-cloud.webp'));await page.locator('#lobbyPlayers button[data-seat]').first().click();await page.locator('[data-avatar="3"]').click();const botLabels=await page.locator('#lobbyPlayers button[data-seat] strong').allTextContents();assert.equal(new Set(botLabels).size,botLabels.length,'duplicate avatar BOT labels must remain unambiguous');
   await configure(page,1);assert.equal(await page.locator('#beginGame').isDisabled(),true);assert.equal(await page.locator('#removeBot').isDisabled(),true);await shot(page,width,'lobby-host-only');await configure(page,8);assert.equal(await page.locator('#addBot').isDisabled(),true);await page.locator('#addBot').evaluate(e=>{for(let i=0;i<10;i++)e.click();});assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),8);await shot(page,width,'lobby-8');
   await begin(page,width,4);await keypad(page,width);await page.locator('#number').fill('1');await page.locator('#number').press('Enter');assert.equal(await page.locator('#keypad button:enabled').count(),0);
   // Guide overlay must retain focus while BOT transitions continue in background.
   await page.locator('#rulesBtn').click();await tick(page);assert.equal(await page.locator('#guideContent').evaluate(e=>e===document.activeElement),true);await page.locator('#closeGuide').click();
   await exit(page);await tick(page);assert.equal(await page.locator('#homeScreen').isVisible(),true);await page.locator('#startGame').click();await begin(page,width,2);
   // Equal bids are invalid; seed preserves a normal low first declaration.
   await page.locator('#number').fill('1');await page.locator('#declare').click();await tick(page);
   for(let turn=0;turn<30&&!await page.locator('#challenge').isEnabled();turn++){if(await page.locator('#next').isVisible())await advanceResult(page);else if(await page.locator('#declare').isEnabled()){await page.locator('#number').fill('1');await page.locator('#declare').click();}else await tick(page);}
   assert.equal(await page.locator('#challenge').isEnabled(),true,'must exercise equal-bid rejection and human challenge');const bid=(await page.locator('#bid').textContent()).trim();await page.locator('#number').fill(bid);await page.locator('#declare').click();assert.equal(await page.locator('#number').getAttribute('aria-invalid'),'true');assert.equal((await page.locator('#bid').textContent()).trim(),bid);await page.locator('#challenge').click();await revealCheck(page);await shot(page,width,'human-challenge');
   // A canceled confirmation retains this match; accepted exit invalidates timer.
   await page.locator('#homeBtn').click();const oldBid=await page.locator('#bid').textContent();await page.locator('#cancelRestart').click();assert.equal(await page.locator('#bid').textContent(),oldBid);assert.equal(await page.locator('#homeBtn').evaluate(e=>e===document.activeElement),true);await exit(page);await page.locator('#startGame').click();await configure(page,2);await page.locator('[data-difficulty="hard"]').click();await page.locator('[data-avatar="2"]').click();await begin(page,width,2);
   const two=await finishMatch(page,width,2,'two');assert.match(two.text,/通算 1勝/);
   assert.equal(await page.locator('#restartBtn').count(),0,'removed lobby settings button must not exist');assert.equal(await page.getByText('ロビーで設定を変更',{exact:true}).count(),0);
   await advanceResult(page);assert.match(await page.locator('#playerGrid [data-player]:not([data-player="p1"])').textContent(),/1勝/);const roomRestart=await finishMatch(page,width,2,'room-restart');assert.match(roomRestart.text,/通算 2勝/);
   await advanceResult(page);await inverse(page);assert.equal(await page.locator('#declare').isEnabled(),true);const rematch=await finishMatch(page,width,2,'rematch');assert.match(rematch.text,/通算 3勝/);
   await page.locator('#homeBtn').click();await page.locator('#cancelRestart').click();assert.equal(await page.locator('#result').isVisible(),true);assert.equal(await page.locator('#homeBtn').evaluate(e=>e===document.activeElement),true);await exit(page);await page.locator('#startGame').click();await begin(page,width,8);const eight=await finishMatch(page,width,8,'eight');assert.equal(eight.spectated,true,'must exercise eliminated-human spectator flow');assert.equal(eight.special,true,'must show actual special-card result calculation');
   await exit(page);await page.locator('#startGame').click();await begin(page,width,2);await page.locator('#number').fill('999');await page.locator('#declare').click();await page.locator('#homeBtn').click();await shot(page,width,'exit-confirm');await page.locator('#confirmRestart').click();await tick(page);assert.equal(await page.locator('#homeScreen').isVisible(),true);await page.locator('#startGame').click();await begin(page,width,2);await tick(page);assert.equal((await page.locator('#bid').textContent()).trim(),'—');assert.equal(await page.locator('#declare').isEnabled(),true);
   await page.evaluate(()=>{NumberBluffBackground.destroy();NumberBluffBackground.destroy();});assert.equal(await page.locator('.nb-background').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({width,status:'passed',errors,external,artwork,two,roomRestart,rematch,eight});
  }catch(error){results.push({width,status:'failed',error:String(error.stack),errors,external});await page.screenshot({path:fileURLToPath(new URL(`${width}-failure.png`,output)),fullPage:true}).catch(()=>{});}finally{await context.close();}
 }
 // The presentation consumes sanitized, already-authorized result DTOs. The
 // fixture is calculated by the real engine in Node, never a browser state hook.
 {
  const {context,page,errors,external}=await setup(390);
  try{
   let seed=77;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   let before=engine.startGame(engine.createLobby({name:'演出テスト',botCount:3}),rng);
   const number=engine.FULL_DECK.find(c=>c.kind==='number'&&c.value===10),extra=engine.FULL_DECK.find(c=>c.kind==='extra'),max=engine.FULL_DECK.find(c=>c.kind==='max0'),double=engine.FULL_DECK.find(c=>c.kind==='double'),five=engine.FULL_DECK.find(c=>c.kind==='number'&&c.value===5);
   const hands={p1:number,p2:extra,p3:max,p4:double};before={...before,hands,deck:[...engine.FULL_DECK.filter(c=>![number,extra,max,double,five].includes(c)),five],discard:[]};before=engine.declare(before,'p1',999);
   const after=engine.challenge(before,'p2',rng);assert.equal(after.result.sum,10);assert.equal(after.result.baseSum,5);assert.equal(after.result.removedCard.id,number.id);
   const playing={...engine.publicView(before,'p1'),hostId:'p1'},revealed={...engine.publicView(after,'p1'),hostId:'p1'};
   await page.evaluate(dto=>{window.__presentationActions=[];NumberBluffClient.connect({subscribe(receive){window.__presentationReceive=receive;receive(dto);return()=>{};},send(action){window.__presentationActions.push(action);return Promise.resolve();}});},playing);
   assert.match(await page.locator('#lastBidder').textContent(),/演出テスト/);assert.equal(await page.locator('#bidActor .person-placeholder').count(),1);
   const oldLife=await page.locator('#playerGrid .hearts').allTextContents();await page.evaluate(()=>{window.__announcements=[];window.__statusObserver=new MutationObserver(()=>{const text=document.getElementById('resultAnnouncement').textContent.trim();if(text)window.__announcements.push(text);});window.__statusObserver.observe(document.getElementById('resultAnnouncement'),{childList:true,subtree:true,characterData:true});});await page.evaluate(dto=>window.__presentationReceive(dto),revealed);
   const checkpoints=[];let previousAt=0;
   for(const [at,phase] of [[0,'hold'],[300,'reveal'],[820,'extra'],[1020,'max'],[1220,'sum'],[1660,'multiply'],[1940,'compare'],[2290,'outcome'],[2470,'complete']]){
    if(at>previousAt)await page.clock.runFor(at-previousAt);previousAt=at;
    assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),phase);
    const life=await page.locator('#playerGrid .hearts').allTextContents(),total=(await page.locator('#finalTotal').textContent()).trim();
    if(at<1940)assert.equal(total,'…','final total must remain undisclosed until compare');else assert.equal(total,'10');
    if(at<2290)assert.deepEqual(life,oldLife,'life must not decrement before outcome');else assert.match(await page.locator('[data-player="p1"] .hearts').getAttribute('aria-label'),/2 \/ 3/);
    if(phase==='hold')assert.equal(await page.locator('#playerGrid .player-card.hidden').count(),4);
    if(phase==='extra')assert.equal(await page.locator('#calculationSteps .extra-reveal .player-card').count(),1);
    if(phase==='max')assert.equal(await page.locator('.presentation-zero-stamp').count(),1);
    if(phase==='multiply')assert.equal(await page.locator('.presentation-vortex').count(),1);
    if(phase==='reveal'){await page.evaluate(dto=>window.__presentationReceive(dto),revealed);assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'reveal','duplicate result must not restart the timeline');}
    checkpoints.push({at,phase,total,life});await page.screenshot({path:fileURLToPath(new URL(`presentation-${phase}.png`,output)),fullPage:true});
   }
   assert.equal(await page.locator('.calculation').getAttribute('aria-live'),'off');const announcements=await page.evaluate(()=>{window.__statusObserver.disconnect();return window.__announcements;});assert.equal(announcements.length,1,'announce final math/outcome once, not every frame');assert.match(announcements[0],/10/);await revealCheck(page);await visibleCardEffects(page);await page.evaluate(dto=>window.__presentationReceive(dto),revealed);assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete');
   // A finished two-seat round verifies held wins and skip/double-tap behavior.
   let last=engine.startGame(engine.createLobby({name:'演出テスト',botCount:1}),rng);last={...last,game:2,players:last.players.map(p=>p.id==='p1'?{...p,life:1}:p)};last=engine.declare(last,'p1',999);const ended=engine.challenge(last,'p2',rng);assert.equal(ended.result.winner,'p2');
   await page.evaluate(dto=>window.__presentationReceive(dto),{...engine.publicView(last,'p1'),hostId:'p1'});await page.evaluate(dto=>window.__presentationReceive(dto),{...engine.publicView(ended,'p1'),hostId:'p1'});assert.equal(await page.locator('[data-player="p2"] .wins-badge').count(),0,'win must not appear during hold');
   await page.locator('#next').click();assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete');assert.match(await page.locator('[data-player="p2"] .wins-badge').textContent(),/1勝/);assert.equal(await page.evaluate(()=>window.__presentationActions.length),0,'skip must not advance game');await page.locator('#next').click();assert.equal(await page.evaluate(()=>window.__presentationActions.length),0,'immediate repeated skip must not advance');await page.clock.runFor(401);await page.locator('#next').click();assert.equal(await page.evaluate(()=>window.__presentationActions.at(-1).type),'rematch');
   // Pending frames cannot overwrite a newer active round or a home exit.
   const newer={...playing,game:3};await page.evaluate(dto=>window.__presentationReceive(dto),newer);await page.evaluate(dto=>window.__presentationReceive(dto),{...revealed,game:3});assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'hold');
   await page.evaluate(dto=>window.__presentationReceive(dto),{...playing,game:4});await page.clock.runFor(5000);assert.equal(await page.locator('#gamePanel').isVisible(),true);await inverse(page);
   await page.evaluate(dto=>window.__presentationReceive(dto),{...revealed,game:4});await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide')));assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete');await page.clock.runFor(5000);assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete','pagehide cancels pending frames');
   await page.evaluate(dto=>window.__presentationReceive(dto),{...playing,game:5});await page.evaluate(dto=>window.__presentationReceive(dto),{...revealed,game:5});await page.evaluate(dto=>NumberBluffClient.connect({subscribe(receive){window.__presentationReceive=receive;receive(dto);return()=>{};},send(){return Promise.resolve();}}),{...playing,game:6});await page.clock.runFor(5000);assert.equal(await page.locator('#gamePanel').isVisible(),true,'room replacement cancels prior room presentation');
   await page.evaluate(dto=>window.__presentationReceive(dto),{...revealed,game:6});await exit(page);const settled=await page.locator('#resultText').textContent();await page.clock.runFor(5000);assert.equal(await page.locator('#homeScreen').isVisible(),true);assert.equal(await page.locator('#resultText').textContent(),settled);
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);await page.evaluate(dto=>NumberBluffClient.connect({subscribe(receive){window.__presentationReceive=receive;receive(dto);return()=>{};},send(){return Promise.resolve();}}),playing);await page.evaluate(dto=>window.__presentationReceive(dto),revealed);assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete','OS reduced motion presents final state immediately');
   await writeFile(new URL('presentation-checkpoints.json',output),JSON.stringify(checkpoints,null,2));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({scenario:'authorized-result-presentation-contract',status:'passed',errors,external,checkpoints});
  }catch(error){results.push({scenario:'authorized-result-presentation-contract',status:'failed',error:String(error.stack),errors,external});await page.screenshot({path:fileURLToPath(new URL('presentation-failure.png',output)),fullPage:true}).catch(()=>{});}finally{await context.close();}
 }
 // Host overlay/keyboard geometry simulations, not a claim about a live SDK.
 for(const width of [320,390]){
  const {context,page,errors,external}=await setup(width);
  try{
   await page.evaluate(()=>{window.__screens=[];window.__stopScreens=NumberBluffClient.onScreenChange(screen=>window.__screens.push(screen));});assert.deepEqual(await page.evaluate(()=>window.__screens),['home']);
   await page.locator('#startGame').click();await begin(page,width,8);
   await page.evaluate(()=>NumberBluffClient.setViewportInsets({top:80,bottom:80}));
   const readControls=()=>page.evaluate(()=>({scrollY,viewport:visualViewport.height,battle:document.getElementById('battleScreen').getBoundingClientRect().toJSON(),controls:['homeBtn','rulesBtn','number','keypad','declare','challenge'].map(id=>({id,...document.getElementById(id).getBoundingClientRect().toJSON()}))}));
   const insets=await readControls();assert.equal(insets.scrollY,0);assert.ok(Math.abs(insets.battle.height-(insets.viewport-160))<=1,'host insets must be subtracted exactly once');
   for(const r of insets.controls)assert.ok(r.top>=80&&r.bottom<=insets.viewport-80+1,`inset controls obstructed ${JSON.stringify(r)}`);
   const grid=page.locator('#playerGrid');assert.equal(await grid.getAttribute('tabindex'),'0');
   const reachable=[];
   for(const card of await page.locator('#playerGrid .player-card').all()){
    await card.scrollIntoViewIfNeeded();const value=await card.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.battle-player'),g=document.getElementById('playerGrid').getBoundingClientRect(),a=p.querySelector('.avatar').getBoundingClientRect();return{id:p.dataset.player,card:r.toJSON(),grid:g.toJSON(),ratio:r.width/r.height,nameSize:parseFloat(getComputedStyle(p.querySelector('.player-name')).fontSize),avatarWidth:a.width,avatarHeight:a.height,scrollY};});
    assert.ok(value.card.top>=value.grid.top-1&&value.card.bottom<=value.grid.bottom+1,`inset card not fully reachable ${JSON.stringify(value)}`);assert.ok(value.ratio>=.68&&value.ratio<=.72&&value.nameSize>=10&&value.avatarWidth>=24&&value.avatarHeight>=24,'inset mode must not crush cards or identity');assert.equal(value.scrollY,0,'only player grid may scroll');reachable.push(value);
   }
   const after=await readControls();assert.deepEqual(after.controls,insets.controls,'scrolling players must not move battle actions');await shot(page,`${width}-insets`,'battle-8-last-row');await writeFile(new URL(`${width}-insets-geometry.json`,output),JSON.stringify({insets,after,reachable},null,2));
   await exit(page);assert.deepEqual(await page.evaluate(()=>window.__screens),['home','lobby','battle','home']);await page.evaluate(()=>{window.__stopScreens();NumberBluffClient.setViewportInsets({top:0,bottom:0});});
   await page.setViewportSize({width:390,height:500});await page.waitForTimeout(50);await page.locator('#joinGame').click();await page.locator('#roomId').fill('KEYBOARD-TEST');
   const join=await page.evaluate(()=>({height:visualViewport.height,stored:document.documentElement.style.getPropertyValue('--nb-viewport-height'),controls:['closeJoin','roomId','joinRoom'].map(id=>({id,...document.getElementById(id).getBoundingClientRect().toJSON()}))}));assert.equal(join.height,500);assert.equal(join.stored,'500px');for(const r of join.controls)assert.ok(r.top>=0&&r.bottom<=500,`keyboard-like join control unreachable ${JSON.stringify(r)}`);assert.deepEqual(await page.evaluate(()=>window.__screens),['home','lobby','battle','home'],'unsubscribe must stop screen events');await shot(page,`${width}-insets`,'join-keyboard-390x500');
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({scenario:'host-insets-and-keyboard-simulation',width,status:'passed',errors,external,reachableCards:reachable.length,join});
  }catch(error){results.push({scenario:'host-insets-and-keyboard-simulation',width,status:'failed',error:String(error.stack),errors,external});await page.screenshot({path:fileURLToPath(new URL(`${width}-insets-failure.png`,output)),fullPage:true}).catch(()=>{});}finally{await context.close();}
 }
 // Synthetic adapter-contract test only: a sanitized public DTO, no SDK,
 // server, fake online room, or private state passed into the browser.
 {
  const {context,page,errors,external}=await setup(390);
  try{
   await page.route('https://profiles.example.test/avatar.webp',async route=>route.fulfill({contentType:'image/webp',body:await readFile(root+'assets/star-sprite.webp')}));
   let seed=30;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   let fixture=engine.startGame(engine.createLobby({botCount:1}),rng);
   fixture=engine.declare(fixture,'p1',1);
   fixture={...fixture,players:fixture.players.map(p=>({...p,kind:p.id==='p2'?'human':'bot',name:p.id==='p2'?'ゲスト 太郎':p.name,avatarUrl:p.id==='p2'?'https://profiles.example.test/avatar.webp':undefined}))};
   const dto=engine.publicView(fixture,'p2');assert.equal(dto.hands.p2,null);assert.equal('deck' in dto,false);
   await page.evaluate(dto=>{window.__seamActions=[];window.NumberBluffClient.connect({subscribe(receive){window.__seamReceive=receive;receive(dto);return()=>{};},send(action){window.__seamActions.push(action);return Promise.resolve();}});},dto);
   assert.equal(await page.locator('[data-player="p2"] #humanCard').count(),1);assert.equal(await page.locator('[data-player="p2"] .player-name').textContent(),'ゲスト 太郎');assert.equal(await page.locator('[data-player="p2"] img.profile-avatar').getAttribute('src'),'https://profiles.example.test/avatar.webp');
   assert.equal((await page.locator('[data-player="p2"] .player-card').textContent()).trim(),'?');
   assert.ok(!(await page.locator('[data-player="p1"] .player-card').getAttribute('class')).includes('hidden'));
   await page.locator('#number').fill('2');await page.locator('#declare').click();
   const actions=await page.evaluate(()=>window.__seamActions);assert.equal(actions.length,1);assert.equal(actions[0].player,'p2');assert.equal(actions[0].revision,dto.revision);
   await shot(page,'adapter','guest-p2-contract');
   // Valid physical Node fixture for an all-special zero-sum presentation; only
   // its sanitized public reveal DTO is delivered through the adapter seam.
   const double=engine.FULL_DECK.find(c=>c.kind==='double'),reset=engine.FULL_DECK.find(c=>c.kind==='reset');
   const allSpecial={...fixture,hands:{p1:double,p2:reset},deck:engine.FULL_DECK.filter(c=>c!==double&&c!==reset),discard:[]};
   const specialReveal=engine.publicView(engine.challenge(allSpecial,'p2',rng),'p2');assert.equal(specialReveal.result.sum,0);
   await page.evaluate(dto=>window.__seamReceive(dto),specialReveal);await revealCheck(page);
   const expressions=await page.locator('#calculationSteps .calc-expression').allTextContents();assert.ok(expressions.includes('0 = 0'),'empty numeric terms must render explicit zero');for(const expression of expressions)assert.doesNotMatch(expression,/^\s*[+=]/);await shot(page,'adapter','all-special-zero');
   await page.evaluate(()=>{window.NumberBluffClient.disconnect();window.NumberBluffClient.configureLocalProfile({name:' 佐藤 花子 ',avatarUrl:'javascript:alert(1)'});});await page.locator('#startGame').click();assert.equal(await page.locator('[data-seat="p1"] strong').textContent(),'佐藤 花子');assert.equal(await page.locator('[data-seat="p1"] .person-placeholder').count(),1);await page.locator('#lobbyBack').click();await page.evaluate(()=>NumberBluffClient.configureLocalProfile({name:'佐藤 花子',avatarUrl:'https://profiles.example.test/avatar.webp'}));await page.locator('#startGame').click();assert.equal(await page.locator('[data-seat="p1"] img.profile-avatar').getAttribute('src'),'https://profiles.example.test/avatar.webp');await configure(page,2);await page.locator('#beginGame').click();assert.equal(await page.locator('[data-player="p1"] #humanCard').count(),1);await inverse(page);
   await page.evaluate(()=>NumberBluffClient.disconnect());
   const hostLobby={...engine.publicView(engine.createLobby({name:'ホスト',botCount:1}),'p1'),hostId:'p1'};
   await page.evaluate(dto=>{window.__lobbyActions=[];NumberBluffClient.connect({subscribe(receive){window.__lobbyReceive=receive;receive(dto);return()=>{};},send(action){window.__lobbyActions.push(action);return Promise.resolve();}});},hostLobby);
   await page.locator('#addBot').click();await page.locator('#beginGame').click();const lobbyActions=await page.evaluate(()=>window.__lobbyActions);assert.deepEqual(lobbyActions.map(a=>a.type),['addBot','startGame']);for(const action of lobbyActions){assert.equal(action.player,'p1');assert.equal(action.revision,hostLobby.revision);}assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),2,'remote lobby must await authoritative view, not invent participants');
   await page.evaluate(dto=>{delete dto.hostId;window.__lobbyReceive(dto);},hostLobby);assert.equal(await page.locator('#addBot').isDisabled(),true);assert.equal(await page.locator('#beginGame').isDisabled(),true,'missing hostId cannot confer host permissions');
   await page.evaluate(()=>{NumberBluffClient.disconnect();window.__createCalls=0;window.__joinedId=null;NumberBluffClient.configureRoomActions({create:async()=>{window.__createCalls++;},join:async id=>{window.__joinedId=id;}});});await page.locator('#startGame').click();assert.equal(await page.evaluate(()=>window.__createCalls),1);assert.equal(await page.locator('#homeScreen').isVisible(),true,'configured hook must not fall through to standalone lobby');await page.locator('#joinGame').click();await page.locator('#roomId').fill('  NORMALIZED-123  ');await page.locator('#joinRoom').click();assert.equal(await page.evaluate(()=>window.__joinedId),'NORMALIZED-123');assert.equal(await page.locator('#joinPanel').isVisible(),true);
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({scenario:'synthetic-adapter-contract-not-network',status:'passed',errors,external});
  }catch(error){results.push({scenario:'synthetic-adapter-contract-not-network',status:'failed',error:String(error.stack),errors,external});}finally{await context.close();}
 }
 // Two actual browser clients, production adapter/platform, local mock AgentSDK broker.
 // This verifies the supplied SDK-shaped contract, NOT GRAVITY or network service behavior.
 {
  const peers=new Map(),traffic=[],calls=[];let host,guest,releaseJoin,releaseCreate;let delayJoin=false,delayCreate=false;
  const profiles={host:{user_id:'mock-host',name:'ホスト 花子',portrait:'https://profiles.example.test/avatar.webp'},guest:{user_id:'mock-guest',name:'ゲスト 太郎',portrait:'https://profiles.example.test/avatar.webp'}};
  const inject=key=>async(page,context)=>{
   peers.set(key,{page,joined:false});
   await context.route('https://profiles.example.test/avatar.webp',route=>readFile(root+'assets/star-sprite.webp').then(body=>route.fulfill({contentType:'image/webp',body})));
   await page.exposeBinding('__mockSdkCall',async(_source,method,args)=>{
    calls.push({key,method,args});const peer=peers.get(key);
    if(method==='profile')return{errno:0,data:profiles[key]};
    if(method==='create'){if(delayCreate)await new Promise(resolve=>{releaseCreate=resolve;});assert.equal(key,'host');assert.deepEqual(args,{max_players:8,room_permission:0});peer.joined=true;return{errno:0,data:{room_id:'MOCK-ROOM',user_list:[profiles.host]}};}
    if(method==='join'){
     if(delayJoin)await new Promise(resolve=>{releaseJoin=resolve;});
     assert.equal(args.room_id,'MOCK-ROOM');peer.joined=true;
     const event={type:'aitools_game_joinroom',data:{...profiles[key],user_name:profiles[key].name,portait:profiles[key].portrait}};
     await peers.get('host').page.evaluate(event=>window.__mockReceive?.(event),event);
     return{errno:0,data:{room_id:'MOCK-ROOM',user_list:[profiles.host,profiles.guest]}};
    }
    if(method==='send'){
     const body=JSON.parse(args.message);traffic.push({key,body});assert.equal('deck' in (body.view||{}),false,'private draw pile must never enter SDK transport');
     for(const [other,target]of peers)if(other!==key&&target.joined)await target.page.evaluate(event=>window.__mockReceive?.(event),{type:'aitools_game_sendmsg',data:{user_id:profiles[key].user_id,msg_data:args.message}});
     return{errno:0};
    }
    throw Error('Unexpected mock SDK operation '+method);
   });
   await page.addInitScript(()=>{
    window.__gameOverMessages=[];window.addEventListener('message',event=>{if(event.data?.type==='gameOver')window.__gameOverMessages.push(event.data);});
    window.AgentSDK={user:{getMyUserInfo:()=>window.__mockSdkCall('profile')},room:{create:args=>window.__mockSdkCall('create',args).then(result=>{window.__createCompletions=(window.__createCompletions||0)+1;return result;}),join:args=>window.__mockSdkCall('join',args).then(result=>{window.__joinCompletions=(window.__joinCompletions||0)+1;return result;}),receiveMessage:callback=>{window.__mockReceive=callback;},sendMessage:args=>window.__mockSdkCall('send',args)}};
   });
  };
  try{
   host=await setup(390,false,inject('host'));guest=await setup(390,false,inject('guest'));
   const hp=host.page,gp=guest.page;
   await Promise.all([hp,gp].map(p=>p.evaluate(()=>NumberBluffPlatform.start({window}))));
   await hp.locator('#startGame').click();await hp.locator('#lobbyScreen').waitFor({state:'visible'});
   assert.equal(await hp.locator('#lobbyPlayers [data-seat]').count(),1);assert.equal(await hp.locator('#beginGame').isDisabled(),true);assert.equal(await hp.locator('[data-seat="p1"] strong').textContent(),'ホスト 花子');
   assert.equal(await hp.locator('[data-seat="p1"] img.profile-avatar').getAttribute('src'),profiles.host.portrait);
   await gp.locator('#joinGame').click();assert.equal(await gp.locator('#joinLocal').count(),0);await gp.locator('#roomId').fill('MOCK-ROOM');await gp.locator('#joinRoom').click();await gp.locator('[data-seat="p2"]').waitFor();await hp.locator('[data-seat="p2"]').waitFor();
   assert.equal(await gp.locator('#beginGame').isDisabled(),true);assert.equal(await gp.locator('#addBot').isDisabled(),true);assert.equal(await hp.locator('#lobbyPlayers [data-seat]').count(),2);assert.equal(await gp.locator('[data-seat="p2"] strong').textContent(),'ゲスト 太郎');
   await shot(hp,'mock-sdk','host-lobby');await shot(gp,'mock-sdk','guest-lobby');await hp.locator('#beginGame').click();await gp.locator('#battleScreen').waitFor({state:'visible'});
   await hp.locator('#rulesBtn').focus();await hp.setViewportSize({width:844,height:390});await hp.waitForTimeout(50);await landscapeReachability(hp,'mock-sdk-native74',74);await shot(hp,'mock-sdk','native74-landscape');await hp.setViewportSize({width:390,height:844});await hp.waitForTimeout(50);
   assert.equal(await gp.locator('[data-player="p2"] #humanCard').textContent(),'?');assert.equal(await hp.locator('[data-player="p1"] #humanCard').textContent(),'?');assert.equal(await gp.locator('#restartBtn').count(),0);
   const nativeTop=await hp.locator('#homeBtn').evaluate(e=>e.getBoundingClientRect().top);assert.ok(nativeTop>=98,'844px native header exclusion must remain clear');
   for(let match=1;match<=3;match++){
    for(let round=0;round<3;round++){
     // Previous round winner starts: guest opens1, then host overbids.
     if(await gp.locator('#declare').isEnabled()){await gp.locator('#number').fill('1');await gp.locator('#declare').click();}
     await hp.locator('#number').fill('999');await hp.locator('#declare').click();await gp.locator('#challenge').click();
     await gp.locator('#result').waitFor({state:'visible'});assert.equal(await gp.locator('#next').isEnabled(),true,'guest may skip their own presentation');
     await gp.locator('#next').click();assert.equal(await gp.locator('#next').isDisabled(),true,'guest cannot advance or rematch');await completePresentation(hp);
     for(const p of[hp,gp])assert.deepEqual(await p.evaluate(()=>window.__gameOverMessages),[],'rounds and finished matches must never close native game');
     if(round<2){await advanceResult(hp);await gp.locator('#gamePanel').waitFor({state:'visible'});}
    }
    const wire=traffic.filter(t=>t.key==='host'&&t.body.type==='snapshot').at(-1).body.view;
    assert.equal(wire.rankingEligible,true,'two actual human clients qualify at match start');assert.equal(wire.players.find(p=>p.userId==='mock-guest').currentStreak,match);assert.equal(wire.players.find(p=>p.userId==='mock-guest').bestStreak,match);
    if(match<3){await advanceResult(hp);await gp.locator('#gamePanel').waitFor({state:'visible'});for(const p of[hp,gp])assert.deepEqual(await p.evaluate(()=>window.__gameOverMessages),[],'rematch must not submit native score');}
   }
   // A later loss resets current streak, but must retain best3 for native exit.
   await advanceResult(hp);await gp.locator('#gamePanel').waitFor({state:'visible'});
   for(let round=0;round<3;round++){
    if(await hp.locator('#declare').isEnabled()){await hp.locator('#number').fill('1');await hp.locator('#declare').click();}
    await gp.locator('#number').fill('999');await gp.locator('#declare').click();await hp.locator('#challenge').click();await gp.locator('#result').waitFor({state:'visible'});await gp.locator('#next').click();await completePresentation(hp);
    for(const p of[hp,gp])assert.deepEqual(await p.evaluate(()=>window.__gameOverMessages),[],'losing a completed match must not close the native game');
    if(round<2){await advanceResult(hp);await gp.locator('#gamePanel').waitFor({state:'visible'});}
   }
   const lastWire=traffic.filter(t=>t.key==='host'&&t.body.type==='snapshot').at(-1).body.view;
   assert.equal(lastWire.players.find(p=>p.userId==='mock-guest').currentStreak,0);assert.equal(lastWire.players.find(p=>p.userId==='mock-guest').bestStreak,3);assert.equal(lastWire.players.find(p=>p.userId==='mock-host').bestStreak,1);
   await shot(hp,'mock-sdk','host-finished');await shot(gp,'mock-sdk','guest-finished');
   await hp.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await hp.clock.runFor(1000);assert.deepEqual(await hp.evaluate(()=>window.__gameOverMessages),[],'visibility/resync must never submit score');
   await gp.locator('#homeBtn').click();await gp.locator('#cancelRestart').click();assert.deepEqual(await gp.evaluate(()=>window.__gameOverMessages),[],'canceling exit must not submit score');
   await exit(gp);await gp.waitForFunction(()=>window.__gameOverMessages.length===1);assert.deepEqual(await gp.evaluate(()=>window.__gameOverMessages),[{type:'gameOver',score:3}]);
   const guestSends=traffic.filter(t=>t.key==='guest').length;await gp.clock.runFor(31000);assert.equal(traffic.filter(t=>t.key==='guest').length,guestSends,'home exit must close session heartbeat');assert.equal(await gp.locator('#homeScreen').isVisible(),true);
   await hp.locator('#lobbyScreen').waitFor({state:'visible'});assert.equal(await hp.locator('#lobbyPlayers [data-seat]').count(),1,'authenticated guest departure must remove that guest');assert.equal(await hp.locator('#beginGame').isDisabled(),true);assert.deepEqual(await hp.evaluate(()=>window.__gameOverMessages),[],'peer departure must not submit my native score');
   await hp.locator('#lobbyBack').click();assert.equal(await hp.locator('#homeScreen').isVisible(),true);await hp.waitForFunction(()=>window.__gameOverMessages.length===1);assert.deepEqual(await hp.evaluate(()=>window.__gameOverMessages),[{type:'gameOver',score:1}]);
   const hostSends=traffic.filter(t=>t.key==='host').length;await hp.clock.runFor(31000);assert.equal(traffic.filter(t=>t.key==='host').length,hostSends,'host exit must cancel room callbacks');
   // Repeated stale DOM events cannot submit another closing message.
   await gp.locator('#confirmRestart').evaluate(e=>e.click());await hp.locator('#lobbyBack').evaluate(e=>e.click());await hp.waitForTimeout(50);await gp.waitForTimeout(50);
   assert.deepEqual(await gp.evaluate(()=>window.__gameOverMessages),[{type:'gameOver',score:3}]);assert.deepEqual(await hp.evaluate(()=>window.__gameOverMessages),[{type:'gameOver',score:1}]);
   delayCreate=true;await hp.locator('#startGame').click();await hp.locator('#homeRules').click();assert.ok(releaseCreate,'mock create request must be pending');releaseCreate();await hp.waitForFunction(()=>window.__createCompletions===2);await hp.waitForTimeout(50);assert.equal(await hp.locator('#guidePanel').isVisible(),true,'late create must not replace guide');await hp.locator('#closeGuide').click();assert.equal(await hp.locator('#homeScreen').isVisible(),true);const afterLateCreate=traffic.filter(t=>t.key==='host').length;await hp.clock.runFor(31000);assert.equal(traffic.filter(t=>t.key==='host').length,afterLateCreate,'canceled create must not start heartbeat');
   delayJoin=true;await gp.locator('#joinGame').click();await gp.locator('#roomId').fill('MOCK-ROOM');await gp.locator('#joinRoom').click();await gp.locator('#closeJoin').click();assert.ok(releaseJoin,'mock join request must be pending');releaseJoin();await gp.waitForFunction(()=>window.__joinCompletions===2);await gp.waitForTimeout(50);assert.equal(await gp.locator('#homeScreen').isVisible(),true,'late join must never reopen room');const afterLateJoin=traffic.filter(t=>t.key==='guest').length;await gp.clock.runFor(31000);assert.equal(traffic.filter(t=>t.key==='guest').length,afterLateJoin,'late canceled adapter must not keep heartbeat alive');
   assert.deepEqual(await gp.evaluate(()=>window.__gameOverMessages),[{type:'gameOver',score:3}],'canceled join must not submit');assert.deepEqual(await hp.evaluate(()=>window.__gameOverMessages),[{type:'gameOver',score:1}],'canceled create must not submit');
   for(const client of[host,guest]){assert.deepEqual(client.errors,[]);assert.deepEqual(client.external,[]);}
   await writeFile(new URL('mock-sdk-contract.json',output),JSON.stringify({scope:'local SDK-shaped mock; not actual GRAVITY/network validation',calls,transportCount:traffic.length,completedMatches:4,guestCurrentStreak:0,guestBestStreak:3,gameOverOnlyOnExplicitExit:[{score:1},{score:3}]},null,2));
   results.push({scenario:'two-page-mock-AgentSDK-not-live-network',status:'passed',transportCount:traffic.length,errors:[],external:[]});
  }catch(error){results.push({scenario:'two-page-mock-AgentSDK-not-live-network',status:'failed',error:String(error.stack),errors:[...(host?.errors||[]),...(guest?.errors||[])],external:[...(host?.external||[]),...(guest?.external||[])]});for(const[key,peer]of peers)await peer.page.screenshot({path:fileURLToPath(new URL(`mock-sdk-${key}-failure.png`,output)),fullPage:true}).catch(()=>{});}
  finally{await host?.context.close();await guest?.context.close();}
 }
 // Real generated single-HTML package: no script/style dependencies, absolute
 // published-asset URLs fulfilled with the exact local asset bytes (not network).
 const {context,page,errors,external,mapped}=await setup(390,true);
 try{assert.equal(await page.locator('script[src],link[rel="stylesheet"]').count(),0);assert.equal(await page.locator('style').evaluateAll(els=>els.some(e=>e.textContent.includes('title-mochiy.ttf'))),false,'removed title font must not be fetched');await page.locator('#startGame').click();await begin(page,'package',4);assert.equal(mapped.some(u=>u.endsWith('.ttf')),false,'system headings require no font download');assert.ok(mapped.some(u=>u.endsWith('star-sprite.webp')));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({scenario:'single-html',status:'passed',mapped:[...new Set(mapped)],errors,external});}catch(error){results.push({scenario:'single-html',status:'failed',error:String(error.stack),errors,external});}finally{await context.close();}
}catch(error){results.push({status:'failed',stage:'suite',error:String(error.stack)});}finally{clearTimeout(watchdog);await browser?.close();await new Promise(r=>server.close(r));await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));if(results.length!==10||results.some(r=>r.status!=='passed'))process.exitCode=1;
