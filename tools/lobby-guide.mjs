import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://local').pathname;const f=path==='/'?'index.html':path.slice(1);const bytes=await readFile(root+f);res.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'image/webp'}).end(bytes)}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(process.env.NB_CHROMIUM?{executablePath:process.env.NB_CHROMIUM}:{});
try{for(const viewer of ['p1','p2']){const page=await browser.newPage({viewport:{width:320,height:640},reducedMotion:'reduce'});await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(viewer=>{const G=NumberBluff;let s=G.createLobby({botCount:1});s.players=s.players.map(p=>({...p,kind:'human'}));window.__state=s;window.__viewer=viewer;window.__dto=()=>({...G.publicView(window.__state,viewer),hostId:'p1',roomId:'same-room'});NumberBluffClient.connect({subscribe(fn){window.__receive=fn;fn(__dto());return()=>{}},send(){return true;}});},viewer);
await page.locator('#lobbyRules').click();assert.equal(await page.locator('#guidePanel').isVisible(),true);await page.evaluate(()=>__receive(__dto()));assert.equal(await page.locator('#guidePanel').isVisible(),true,'lobby updates should not close guide');await page.locator('#closeGuide').click();assert.equal(await page.locator('#lobbyScreen').isVisible(),true);assert.equal(await page.locator('#lobbyTitle').textContent(),'same-room');assert.equal(await page.locator('#lobbyPlayers [data-seat]').count(),2);
await page.locator('#lobbyRules').click();await page.evaluate(()=>{__state=NumberBluff.startGame(__state,()=>.99);__receive(__dto());});assert.equal(await page.locator('#battleScreen').isVisible(),true,'host start must close lobby guide');assert.equal(await page.locator('#guidePanel').isVisible(),false);await page.close();console.log(viewer,'passed');}}
finally{await browser.close();await new Promise(r=>server.close(r));}
