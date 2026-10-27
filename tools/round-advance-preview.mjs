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
 const page=await browser.newPage({viewport:{width,height:844}});await page.clock.install({time:new Date('2026-10-27T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-27T00:00:01Z'));await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.evaluate(()=>{
  const nodes={},views={},queue=[];const common={roomId:'round-ui',hostUserId:'h',heartbeat:false,rng:()=>.4};
  for(const uid of ['h','g']){nodes[uid]=NumberBluffGravity.createSession({...common,userId:uid,name:uid==='h'?'ホスト':'ゲスト',sendMessage:raw=>queue.push({uid,raw})});nodes[uid].subscribe(v=>views[uid]=v);}
  nodes.h.addMember({userId:'g',name:'ゲスト'});
  const flush=()=>{let count=0;while(queue.length){if(++count>100)throw Error('message loop');const m=queue.shift();for(const uid of ['h','g'])if(uid!==m.uid)nodes[uid].receive(m.uid,m.raw);}};
  flush();window.__round={nodes,views,flush,act(uid,type,value){const v=views[uid];nodes[uid].send({type,value,player:v.viewerId,revision:v.revision});flush();}};
  NumberBluffClient.connect(nodes.h);__round.act('h','startGame');__round.act('h','declare',1);__round.act('g','challenge');
 });
 const delay=await page.evaluate(()=>__round.views.h.roundClock.readyAt-Date.now());assert.ok(delay>0);
 await page.clock.runFor(delay);assert.equal(await page.locator('#result').getAttribute('data-presentation-phase'),'complete');assert.match(await page.locator('#next').textContent(),/10秒/);assert.equal(await page.locator('#next').isEnabled(),true);
 await page.locator('#playerGrid img.card-art').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 await page.evaluate(()=>document.fonts.ready);
 // Flush the reveal renderer after async image decoding; the clock is otherwise paused.
 await page.clock.runFor(32);
 await page.screenshot({path:output+`round-clock-${width}-10s.png`});
 await page.evaluate(()=>{__round.act('g','nextRound');});assert.equal(await page.evaluate(()=>__round.views.h.phase),'reveal');
 const remaining=await page.evaluate(()=>__round.views.h.roundClock.deadline-Date.now());
 await page.clock.runFor(remaining-1);assert.equal(await page.evaluate(()=>__round.views.h.round),1);await page.clock.runFor(1);assert.equal(await page.evaluate(()=>__round.views.h.round),2);assert.equal(await page.locator('#gamePanel').isVisible(),true);
 await page.evaluate(()=>NumberBluffClient.disconnect());report.push({width,status:'passed',presentationProtected:true,tenSecondAdvance:true,guestCannotAdvance:true});await page.close();
}}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));await writeFile(output+'round-advance-preview.json',JSON.stringify(report,null,2));}
