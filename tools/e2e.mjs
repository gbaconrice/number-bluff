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
const assets = ['celestial-background','star-sprite','moon-cat','cloud-bunny','blue-cloud','hero-platform'];
const files = new Map([['/', ['index.html','text/html']], ...['index.html','ai-studio.html','app.js','engine.js','scheduler.js','styles.css'].map(p=>['/'+p,[p,p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'text/javascript']]), ...assets.map(n=>[`/assets/${n}.webp`,[`assets/${n}.webp`,'image/webp']]), ['/assets/title-mochiy.ttf',['assets/title-mochiy.ttf','font/ttf']]]);
const provenance = await Promise.all([...assets.map(n=>`assets/${n}.webp`),'assets/title-mochiy.ttf'].map(async path=>{const b=await readFile(root+path);return {path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};}));
await writeFile(new URL('asset-provenance.json',output),JSON.stringify(provenance,null,2));
const server=http.createServer(async(req,res)=>{const p=new URL(req.url,'http://localhost').pathname;if(p==='/favicon.ico'){res.writeHead(204).end();return;}const f=files.get(p);if(!f){res.writeHead(404).end();return;}try{const b=await readFile(root+f[0]);res.writeHead(200,{'content-type':f[1],'cache-control':'no-store','access-control-allow-origin':'*'}).end(b);}catch{res.writeHead(500).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,results=[];
let browser;
const watchdog=setTimeout(async()=>{results.push({status:'failed',stage:'global-timeout'});await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));process.exit(1);},7*60*1000);watchdog.unref();
async function shot(page,width,state){
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${state}: horizontal overflow`);
 const controls=await page.locator('button,input').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const target=e.type==='checkbox'?e.closest('label')||e:e;const r=target.getBoundingClientRect();return{id:e.id,name:e.getAttribute('aria-label')||e.labels?.[0]?.textContent||e.textContent.trim(),w:r.width,h:r.height};}));
 for(const c of controls){assert.ok(c.name,`${state}: unlabeled ${c.id}`);assert.ok(c.w>=40&&c.h>=40,`${state}: small touch target ${c.id} ${c.w}x${c.h}`);}
 await page.screenshot({path:fileURLToPath(new URL(`${width}-${state}.png`,output)),fullPage:true});
}
async function fit(page,width){
 if(width!==320&&width!==390)return;
 const b=await page.evaluate(()=>({y:scrollY,h:innerHeight,w:innerWidth,items:[...document.querySelectorAll('#playerGrid .player-card,#number,#keypad,#declare,#challenge')].map(e=>({name:e.id||e.parentElement.dataset.player,...JSON.parse(JSON.stringify(e.getBoundingClientRect()))}))}));
 assert.equal(b.y,0,'battle initial scroll must be zero');assert.ok(b.items.length>=6);
 for(const r of b.items)assert.ok(r.width>0&&r.height>0&&r.top>=0&&r.bottom<=b.h&&r.left>=0&&r.right<=b.w,`${width}: ${r.name} outside initial viewport ${JSON.stringify(r)}`);
}
async function inverse(page){
 const own=page.locator('#humanCard');
 if((await own.getAttribute('class')).includes('out'))return;
 assert.equal((await own.textContent()).trim(),'?');assert.doesNotMatch(await own.ariaSnapshot(),/\d/);
 assert.equal(await own.locator('img,.card-value').count(),0,'hidden own card must not contain real face');
 const attrs=await own.evaluate(e=>[...e.attributes].filter(a=>/^(data-|title|aria-)/.test(a.name)).map(a=>a.value).join(' '));assert.doesNotMatch(attrs,/\d/);
 const others=page.locator('#playerGrid [data-player]:not([data-player="p1"]) .player-card:not(.out)');
 for(const card of await others.all()){assert.ok(!(await card.getAttribute('class')).includes('hidden'));assert.ok((await card.locator('.card-value').textContent()).trim());}
 assert.equal((await page.locator('#calculationSteps').textContent()).trim(),'','stale calculation retained during play');
}
async function art(page){
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.fonts.check('20px TitleMochiy')),true,'local title font must load');
 const evidence=await page.evaluate(async names=>{
  const evidence=[];for(const name of names){const im=new Image();im.src=`assets/${name}.webp`;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let transparent=0,visible=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)transparent++;if(d[i]>0)visible++;}evidence.push({name,width:c.width,height:c.height,transparent,visible});}
  for(const im of document.querySelectorAll('img'))await im.decode();return evidence;
 },assets);
 for(const a of evidence){assert.ok(a.width>=512&&a.height>=512&&a.visible>0);if(a.name!=='celestial-background')assert.ok(a.transparent>0);}
 const imgs=await page.locator('.home-art img').evaluateAll(els=>els.map(e=>({src:e.getAttribute('src'),fit:getComputedStyle(e).objectFit,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,w:innerWidth})));
 for(const i of imgs){assert.equal(i.fit,'contain');assert.ok(i.left>=0&&i.right<=i.w,`home artwork clips horizontally: ${JSON.stringify(i)}`);}
 return evidence;
}
async function tick(page){await page.clock.runFor(1200);}
async function configure(page,count){
 while(await page.locator('#lobbyPlayers [data-seat]').count()>count)await page.locator('#removeBot').click();
 while(await page.locator('#lobbyPlayers [data-seat]').count()<count)await page.locator('#addBot').click();
 assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),count);
}
async function lobbyConfig(page){return page.locator('#lobbyPlayers [data-seat]').evaluateAll(nodes=>nodes.map(e=>({id:e.dataset.seat,src:e.querySelector('img').getAttribute('src'),name:e.querySelector('strong').textContent,difficulty:(e.querySelector('small').textContent.match(/やさしい|普通|強い/)||[])[0]||null})));}
async function begin(page,width,count){await configure(page,count);await page.locator('#beginGame').click();assert.equal(await page.locator('#playerGrid [data-player]').count(),count);assert.equal(await page.locator('#declare').isEnabled(),true);await inverse(page);await fit(page,width);await shot(page,width,`battle-${count}`);}
async function exit(page,intent='home'){
 await page.locator(intent==='home'?'#homeBtn':'#restartBtn').click();await page.locator('#confirmRestart').click();
 assert.equal(await page.locator(intent==='home'?'#homeScreen':'#lobbyScreen').isVisible(),true);
}
async function keypad(page,width){
 assert.equal(await page.locator('#number').getAttribute('inputmode'),'none');assert.equal(await page.locator('#keypad [data-digit]').count(),10);
 await page.locator('[data-digit="7"]').click();assert.equal(await page.locator('#number').inputValue(),'7');await page.locator('[data-digit="2"]').click();assert.equal(await page.locator('#number').inputValue(),'72');
 await page.locator('#backspace').click();assert.equal(await page.locator('#number').inputValue(),'7');await page.locator('#backspace').click();assert.equal(await page.locator('#number').inputValue(),'');
 for(const value of ['','-1','1.5','abc','1e2','9007199254740992']){await page.locator('#number').fill(value);await page.locator('#declare').click();assert.equal(await page.locator('#number').getAttribute('aria-invalid'),'true');assert.equal((await page.locator('#bid').textContent()).trim(),'—');assert.ok((await page.locator('#inputError').textContent()).trim());}
 await shot(page,width,'keypad-invalid');await page.locator('#number').fill('9007199254740991');await page.locator('[data-digit="9"]').click();assert.equal(await page.locator('#number').inputValue(),'9007199254740991');assert.equal((await page.locator('#bid').textContent()).trim(),'—');
}
async function revealCheck(page){
 const total=(await page.locator('#finalTotal').textContent()).trim();assert.match(total,/^-?\d+$/);assert.ok((await page.locator('#calculationSteps').textContent()).includes('数字の合計'));assert.ok((await page.locator('#resultText').textContent()).trim());
 assert.equal(await page.locator('#keypad button:enabled').count(),0);
 // The visible equation must agree with its displayed final total; independent
 // physical-card/special-effect correctness is covered by engine oracle tests.
 const equations=await page.locator('#calculationSteps .calc-expression').allTextContents();const last=equations.filter(t=>t.includes('=')).at(-1);assert.equal(Number(last.split('=').at(-1).trim()),Number(total));
 const own=page.locator('#humanCard');const ownClass=await own.getAttribute('class');if(!ownClass.includes('out')){
  // '?' is a real extra-card face in the 36-card deck, not always a card back.
  assert.ok(!ownClass.includes('hidden'),'revealed card still uses hidden/back state');
  assert.equal(await own.locator('.card-value').count(),1,'reveal requires an actual face label');
  assert.equal(await own.locator('.card-art').count(),1,'reveal requires actual face artwork');
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
   await page.locator('#next').click();
  }else if(await page.locator('#declare').isEnabled()){
   await inverse(page);await page.locator('#number').fill('999');await page.locator('#declare').click();
  }else{
   if((await page.locator('#humanCard').getAttribute('class')).includes('out')&&!spectated){spectated=true;assert.match(await page.locator('#status').textContent(),/脱落/);await shot(page,width,`${label}-spectator`);}
   await tick(page);
  }
 }
 throw Error(`${count}-player match did not terminate within 450 public UI transitions`);
}
async function setup(width,packaged=false){
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
 await page.goto(origin+(packaged?'/ai-studio.html':''));return{context,page,errors,external,mapped};
}
try{
 browser=await chromium.launch();
 for(const width of [320,390,844,1280]){
  const {context,page,errors,external}=await setup(width);
  try{
   await page.locator('#startGame').waitFor({state:'visible'});assert.equal(await page.locator('.home-actions button').count(),2);assert.equal(await page.locator('.home-icons button').count(),3);const artwork=await art(page);await shot(page,width,'home');
   await page.locator('#joinGame').click();assert.match(await page.locator('#joinPanel').textContent(),/未接続|まだ接続|準備中/);assert.equal(await page.locator('#joinPanel input').count(),0);await shot(page,width,'join-unconnected');await page.locator('#closeJoin').click();
   await page.locator('#homeCards').click();assert.equal(await page.locator('[data-tab]').count(),4);
   for(const tab of ['rules','cards','bots','examples']){await page.locator(`[data-tab="${tab}"]`).click();assert.equal(await page.locator(`[data-tab="${tab}"]`).getAttribute('aria-selected'),'true');if(tab==='cards'){
     const text=await page.locator('#guideContent').textContent();assert.match(text,/全36枚/);assert.match(text,/32枚/);assert.match(text,/特殊カード 4枚/);const shown=await page.locator('#guideContent .catalogue > div').evaluateAll(items=>items.map(e=>({label:e.querySelector('.card-value').textContent,count:Number(e.querySelector('small').textContent.replace('×',''))})));const grouped=new Map();for(const c of engine.FULL_DECK.filter(c=>c.kind==='number'))grouped.set(c.label,(grouped.get(c.label)||0)+1);assert.equal(shown.length,grouped.size);for(const c of shown)assert.equal(c.count,grouped.get(c.label),`wrong count for ${c.label}`);for(const label of ['MAX→0','×2','リセット','?'])assert.ok(text.includes(label));
     const label=page.locator('#guideContent .kind-max0 .card-value');const bounds=await label.evaluate(e=>({text:e.textContent,inner:e.getBoundingClientRect().toJSON(),outer:e.closest('.player-card').getBoundingClientRect().toJSON()}));assert.equal(bounds.text,'MAX→0');assert.ok(bounds.inner.left>=bounds.outer.left&&bounds.inner.right<=bounds.outer.right,'MAX→0 label clipped');
    }await shot(page,width,`guide-${tab}`);}
   await page.locator('#closeGuide').click();assert.equal(await page.locator('#homeCards').evaluate(e=>e===document.activeElement),true);
   await page.locator('#homeSettings').click();assert.equal(await page.locator('#soundToggle').isChecked(),false);await page.locator('#soundToggle').check();assert.ok(await page.evaluate(()=>window.__audioStarts>0),'sound switch must actually create audio');await page.locator('#motionToggle').check();assert.equal(await page.locator('body').getAttribute('data-motion'),'on');await shot(page,width,'settings');await page.locator('#closeSettings').click();assert.notEqual(await page.locator('.hero-main').evaluate(e=>getComputedStyle(e).animationName),'none');await page.locator('#homeSettings').click();await page.locator('#motionToggle').uncheck();await page.locator('#soundToggle').uncheck();await page.locator('#closeSettings').click();assert.equal(await page.locator('.hero-main').evaluate(e=>getComputedStyle(e).animationName),'none');
   await page.locator('#startGame').click();assert.equal(await page.locator('#lobbyPlayers').locator(':scope > *').count(),8);assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),4);await shot(page,width,'lobby-4');
   for(const difficulty of ['easy','normal','hard']){await page.locator(`[data-difficulty="${difficulty}"]`).click();assert.equal(await page.locator(`[data-difficulty="${difficulty}"]`).getAttribute('aria-pressed'),'true');}
   await page.locator('[data-avatar="3"]').click();assert.equal(await page.locator('[data-avatar="3"]').getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#lobbyPlayers .selected img').getAttribute('src')).endsWith('blue-cloud.webp'));const botLabels=await page.locator('#lobbyPlayers button[data-seat] strong').allTextContents();assert.equal(new Set(botLabels).size,botLabels.length,'duplicate avatar BOT labels must remain unambiguous');
   await configure(page,1);assert.equal(await page.locator('#beginGame').isDisabled(),true);assert.equal(await page.locator('#removeBot').isDisabled(),true);await shot(page,width,'lobby-host-only');await configure(page,8);assert.equal(await page.locator('#addBot').isDisabled(),true);await page.locator('#addBot').evaluate(e=>{for(let i=0;i<10;i++)e.click();});assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),8);await shot(page,width,'lobby-8');
   await begin(page,width,4);await keypad(page,width);await page.locator('#number').fill('0');await page.locator('#number').press('Enter');assert.equal(await page.locator('#keypad button:enabled').count(),0);
   // Guide overlay must retain focus while BOT transitions continue in background.
   await page.locator('#rulesBtn').click();await tick(page);assert.equal(await page.locator('#guideContent').evaluate(e=>e===document.activeElement),true);await page.locator('#closeGuide').click();
   await exit(page);await tick(page);assert.equal(await page.locator('#homeScreen').isVisible(),true);await page.locator('#startGame').click();await begin(page,width,2);
   // Equal bids are invalid; seed preserves a normal low first declaration.
   await page.locator('#number').fill('0');await page.locator('#declare').click();await tick(page);
   for(let turn=0;turn<30&&!await page.locator('#challenge').isEnabled();turn++){if(await page.locator('#next').isVisible())await page.locator('#next').click();else if(await page.locator('#declare').isEnabled()){await page.locator('#number').fill('0');await page.locator('#declare').click();}else await tick(page);}
   assert.equal(await page.locator('#challenge').isEnabled(),true,'must exercise equal-bid rejection and human challenge');const bid=(await page.locator('#bid').textContent()).trim();await page.locator('#number').fill(bid);await page.locator('#declare').click();assert.equal(await page.locator('#number').getAttribute('aria-invalid'),'true');assert.equal((await page.locator('#bid').textContent()).trim(),bid);await page.locator('#challenge').click();await revealCheck(page);await shot(page,width,'human-challenge');
   // A canceled confirmation retains this match; accepted exit invalidates timer.
   await page.locator('#homeBtn').click();const oldBid=await page.locator('#bid').textContent();await page.locator('#cancelRestart').click();assert.equal(await page.locator('#bid').textContent(),oldBid);assert.equal(await page.locator('#homeBtn').evaluate(e=>e===document.activeElement),true);await exit(page);await page.locator('#startGame').click();await configure(page,2);await page.locator('[data-difficulty="hard"]').click();await page.locator('[data-avatar="2"]').click();const savedRoster=await lobbyConfig(page);await begin(page,width,2);
   const two=await finishMatch(page,width,2,'two');assert.match(two.text,/通算 1勝/);
   await exit(page,'lobby');assert.deepEqual(await lobbyConfig(page),savedRoster,'return to lobby must retain roster, difficulty and avatar');assert.match(await page.locator('#lobbyPlayers button[data-seat]').textContent(),/1勝/);await shot(page,width,'room-win-preserved');
   await begin(page,width,2);assert.match(await page.locator('#playerGrid [data-player]:not([data-player="p1"])').textContent(),/1勝/);const roomRestart=await finishMatch(page,width,2,'room-restart');assert.match(roomRestart.text,/通算 2勝/);
   await page.locator('#next').click();await inverse(page);assert.equal(await page.locator('#declare').isEnabled(),true);const rematch=await finishMatch(page,width,2,'rematch');assert.match(rematch.text,/通算 3勝/);
   await page.locator('#restartBtn').click();await page.locator('#cancelRestart').click();assert.equal(await page.locator('#result').isVisible(),true);await exit(page,'lobby');await begin(page,width,8);const eight=await finishMatch(page,width,8,'eight');assert.equal(eight.spectated,true,'must exercise eliminated-human spectator flow');assert.equal(eight.special,true,'must show actual special-card result calculation');
   await exit(page);await page.locator('#startGame').click();await begin(page,width,2);await page.locator('#number').fill('999');await page.locator('#declare').click();await page.locator('#homeBtn').click();await shot(page,width,'exit-confirm');await page.locator('#confirmRestart').click();await tick(page);assert.equal(await page.locator('#homeScreen').isVisible(),true);await page.locator('#startGame').click();await begin(page,width,2);await tick(page);assert.equal((await page.locator('#bid').textContent()).trim(),'—');assert.equal(await page.locator('#declare').isEnabled(),true);
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({width,status:'passed',errors,external,artwork,two,roomRestart,rematch,eight});
  }catch(error){results.push({width,status:'failed',error:String(error.stack),errors,external});await page.screenshot({path:fileURLToPath(new URL(`${width}-failure.png`,output)),fullPage:true}).catch(()=>{});}finally{await context.close();}
 }
 // Synthetic adapter-contract test only: a sanitized public DTO, no SDK,
 // server, fake online room, or private state passed into the browser.
 {
  const {context,page,errors,external}=await setup(390);
  try{
   let seed=30;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   let fixture=engine.startGame(engine.createLobby({botCount:1}),rng);
   fixture=engine.declare(fixture,'p1',0);
   fixture={...fixture,players:fixture.players.map(p=>({...p,kind:p.id==='p2'?'human':'bot'}))};
   const dto=engine.publicView(fixture,'p2');assert.equal(dto.hands.p2,null);assert.equal('deck' in dto,false);
   await page.evaluate(dto=>{window.__seamActions=[];window.NumberBluffClient.connect({subscribe(receive){window.__seamReceive=receive;receive(dto);return()=>{};},send(action){window.__seamActions.push(action);return Promise.resolve();}});},dto);
   assert.equal(await page.locator('[data-player="p2"] #humanCard').count(),1);
   assert.equal((await page.locator('[data-player="p2"] .player-card').textContent()).trim(),'?');
   assert.ok(!(await page.locator('[data-player="p1"] .player-card').getAttribute('class')).includes('hidden'));
   await page.locator('#number').fill('1');await page.locator('#declare').click();
   const actions=await page.evaluate(()=>window.__seamActions);assert.equal(actions.length,1);assert.equal(actions[0].player,'p2');assert.equal(actions[0].revision,dto.revision);
   await shot(page,'adapter','guest-p2-contract');
   // Valid physical Node fixture for an all-special zero-sum presentation; only
   // its sanitized public reveal DTO is delivered through the adapter seam.
   const double=engine.FULL_DECK.find(c=>c.kind==='double'),reset=engine.FULL_DECK.find(c=>c.kind==='reset');
   const allSpecial={...fixture,hands:{p1:double,p2:reset},deck:engine.FULL_DECK.filter(c=>c!==double&&c!==reset),discard:[]};
   const specialReveal=engine.publicView(engine.challenge(allSpecial,'p2',rng),'p2');assert.equal(specialReveal.result.sum,0);
   await page.evaluate(dto=>window.__seamReceive(dto),specialReveal);await revealCheck(page);
   const expressions=await page.locator('#calculationSteps .calc-expression').allTextContents();assert.ok(expressions.includes('0 = 0'),'empty numeric terms must render explicit zero');for(const expression of expressions)assert.doesNotMatch(expression,/^\s*[+=]/);await shot(page,'adapter','all-special-zero');
   await page.evaluate(()=>window.NumberBluffClient.disconnect());await page.locator('#startGame').click();await page.locator('#beginGame').click();assert.equal(await page.locator('[data-player="p1"] #humanCard').count(),1);await inverse(page);
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({scenario:'synthetic-adapter-contract-not-network',status:'passed',errors,external});
  }catch(error){results.push({scenario:'synthetic-adapter-contract-not-network',status:'failed',error:String(error.stack),errors,external});}finally{await context.close();}
 }
 // Real generated single-HTML package: no script/style dependencies, absolute
 // published-asset URLs fulfilled with the exact local asset bytes (not network).
 const {context,page,errors,external,mapped}=await setup(390,true);
 try{assert.equal(await page.locator('script[src],link[rel="stylesheet"]').count(),0);await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.fonts.check('20px TitleMochiy')),true);await page.locator('#startGame').click();await begin(page,'package',4);assert.ok(mapped.some(u=>u.endsWith('title-mochiy.ttf')));assert.ok(mapped.some(u=>u.endsWith('star-sprite.webp')));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({scenario:'single-html',status:'passed',mapped:[...new Set(mapped)],errors,external});}catch(error){results.push({scenario:'single-html',status:'failed',error:String(error.stack),errors,external});}finally{await context.close();}
}catch(error){results.push({status:'failed',stage:'suite',error:String(error.stack)});}finally{clearTimeout(watchdog);await browser?.close();await new Promise(r=>server.close(r));await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));if(results.length!==6||results.some(r=>r.status!=='passed'))process.exitCode=1;
