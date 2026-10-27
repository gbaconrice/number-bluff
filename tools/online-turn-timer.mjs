// Real browser DOM plus deterministic browser clock; not actual GRAVITY networking.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url)),output=root+'artifacts/';await mkdir(output,{recursive:true});
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://local').pathname;if(pathname.includes('..'))throw Error();const path=pathname==='/'?'/index.html':pathname;res.writeHead(200,{'content-type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.html')?'text/html':'image/webp'}).end(await readFile(root+path));}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;const report=[];
try{browser=await chromium.launch({headless:true,args:['--no-sandbox']});for(const width of[390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});await page.clock.install({time:new Date('2026-10-27T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-27T00:00:01Z'));await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.evaluate(()=>{window.__clockPackets=[];window.__clockSession=NumberBluffGravity.createSession({roomId:'timer-ui',userId:'host',hostUserId:'host',name:'ホスト',heartbeat:false,sendMessage:raw=>window.__clockPackets.push(JSON.parse(raw))});__clockSession.addMember({userId:'guest',name:'ゲスト'});NumberBluffClient.connect(__clockSession);});
 await page.locator('#beginGame').click();await page.locator('.turn-countdown').waitFor();assert.match(await page.locator('.turn-countdown').textContent(),/30秒/);
 for(const digit of '999')await page.locator('[data-digit="'+digit+'"]').click();await page.clock.runFor(20000);assert.match(await page.locator('.turn-countdown').textContent(),/10秒/);assert.equal(await page.locator('.turn-countdown.is-urgent').count(),1);const rects = await page.locator('.battle-meta > span').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON())); for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)assert.ok(rects[j].left>=rects[i].right-1||rects[j].top>=rects[i].bottom-1||rects[i].top>=rects[j].bottom-1,'countdown must not overlap round/survivor text');assert.equal(await page.locator('#battleTitle').textContent().then(x=>x.includes('対戦中')),false); await page.screenshot({path:output+`turn-clock-${width}-10s.png`});
 await page.clock.runFor(10000);assert.equal(await page.locator('#bid').textContent(),'1','timeout must not send typed999');assert.equal(await page.locator('.turn-countdown[data-player="p2"]').count(),1);assert.match(await page.locator('.turn-countdown').textContent(),/30秒/);
 const count=await page.evaluate(()=>__clockPackets.filter(p=>p.view?.history?.length===1).length);assert.ok(count>=1);await page.clock.runFor(500);assert.equal(await page.locator('#bid').textContent(),'1');
 await page.evaluate(()=>NumberBluffClient.disconnect());const sent=await page.evaluate(()=>__clockPackets.length);await page.clock.runFor(60000);assert.equal(await page.evaluate(()=>__clockPackets.length),sent,'disconnect cancels expiration');assert.equal(await page.locator('#homeScreen').isVisible(),true);
 // Standalone play uses the same real deadline, not a cosmetic countdown.
 await page.locator('#startGame').click();await page.locator('#addBot').click();await page.locator('#beginGame').click();assert.match(await page.locator('.turn-countdown').textContent(),/30秒/);
 for(const digit of '999')await page.locator('[data-digit="'+digit+'"]').click();
 await page.clock.runFor(20000);assert.match(await page.locator('.turn-countdown').textContent(),/10秒/);await page.screenshot({path:output+`local-turn-clock-${width}-10s.png`});await page.clock.runFor(9999);assert.notEqual(await page.locator('#bid').textContent(),'1');
 await page.clock.runFor(1);assert.equal(await page.locator('#bid').textContent(),'1','local timeout must ignore partial999');assert.equal(await page.locator('.turn-countdown').count(),0,'BOT keeps original short think time');
 await page.evaluate(()=>NumberBluffClient.disconnect());await page.clock.runFor(60000);assert.equal(await page.locator('#homeScreen').isVisible(),true);
 await page.locator('#startGame').click();await page.locator('#addBot').click();await page.locator('#beginGame').click();
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await page.clock.runFor(40000);
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));assert.equal(await page.locator('#bid').textContent(),'1','BFCache restoration resolves elapsed deadline, not a fresh30sec');
 await page.evaluate(()=>NumberBluffClient.disconnect());
 report.push({width,status:'passed',firstTimeoutBid:1,typedValueIgnored:999,localTimeoutBid:1,backgroundDeadlinePreserved:true});await page.close();
}}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));await writeFile(output+'online-turn-timer.json',JSON.stringify(report,null,2));}
