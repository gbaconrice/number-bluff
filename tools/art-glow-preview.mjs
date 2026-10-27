// Isolated visual prototype, not a gameplay/network test. Uses the production
// card-art factory, layout CSS and special SVG manager without a foil manager.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = root + 'artifacts/art-glow-preview/';
await mkdir(output, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/card-presentation.css"><link rel="stylesheet" href="/card-art.css"><link rel="stylesheet" href="/special-svg-motion.css">
<style>html,body{margin:0!important;padding:0!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;overflow:hidden!important;background:#11182b!important}body:before,body:after{display:none!important}#artGlowCards{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;gap:0}#artGlowCards>.player-card{flex:0 0 var(--preview-card-width);width:var(--preview-card-width);max-width:none;margin:0;height:auto;aspect-ratio:2/3}</style>
</head><body><div id="artGlowCards"></div><script src="/card-art.js"></script><script src="/special-svg-motion.js"></script></body></html>`;
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/preview') return response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }).end(html);
  if (pathname === '/favicon.ico') return response.writeHead(204).end();
  if (pathname.includes('..')) return response.writeHead(400).end();
  try {
    const bytes = await readFile(root + pathname);
    const type = pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.png') ? 'image/png' : 'image/webp';
    response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'access-control-allow-origin': '*' }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const report = { scope: 'Isolated production artwork + SVG manager. Real elapsed animation, no foil, no animation seeking, no original image editing. Video includes initial loading followed by at least 6 seconds after decoding.', previews: [] };
let browser;
try {
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {});
  for (const width of [180, 88]) {
    const viewport = width === 180 ? { width: 720, height: 300 } : { width: 384, height: 164 };
    const recordingDir = output + `recording-${width}/`;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', recordVideo: { dir: recordingDir, size: viewport } });
    const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
    const video = page.video();
    try {
      await page.goto(origin + '/preview');
      const geometry = await page.evaluate(async width => {
        document.documentElement.style.setProperty('--preview-card-width', width + 'px');
        const holder = document.querySelector('#artGlowCards'), cards = [];
        for (const [kind, label] of [['double','×2'], ['extra','?'], ['max0','MAX→0'], ['reset','リセット']]) {
          const card = {kind,label}, node = document.createElement('div'); node.className = `player-card special kind-${kind}`;
          const content = NumberBluffCardArt.content(document,card), value = document.createElement('span'); value.className = 'card-value'; value.textContent = label;
          const image = NumberBluffCardArt.create(document,card); content.append(value,image); node.append(content); holder.append(node); cards.push({kind,node,image});
        }
        await Promise.all(cards.map(card => card.image.decode())); await document.fonts.ready;
        const manager = NumberBluffSpecialSVG.createManager();
        for (const card of cards) manager.attach(card.node,card.kind,{faceUp:true,imageElement:card.image});
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return cards.map(card => ({ kind:card.kind, image:card.image.currentSrc, width:card.node.getBoundingClientRect().width, height:card.node.getBoundingClientRect().height, svg:card.node.querySelector('.nb-special-svg').dataset.playing }));
      }, width);
      for (const card of geometry) { assert.equal(card.width,width); assert.equal(card.height,width*1.5); assert.equal(card.svg,'true'); }
      assert.equal(await page.locator('.nb-card-glare').count(),0,'foil must not contaminate the prototype');
      await page.waitForTimeout(500); for (let frame=0;frame<12;frame++){await page.screenshot({path:output+`art-glow-${width}px-frame-${frame}.png`,animations:'allow'});await page.waitForTimeout(500);}
      await page.screenshot({ path: output + `art-glow-${width}px.png`, animations: 'allow' });
      assert.deepEqual(errors,[]);
      report.previews.push({ cardWidth:width, viewport, geometry, clip:`art-glow-${width}px.webm`, status:'passed' });
    } catch (error) { report.previews.push({cardWidth:width,status:'failed',error:String(error.stack),errors}); }
    finally { await context.close(); await video.saveAs(output + `art-glow-${width}px.webm`); await rm(recordingDir,{recursive:true,force:true}); }
  }
} catch (error) { report.error=String(error.stack); }
finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); await writeFile(output + 'report.json',JSON.stringify(report,null,2)); }
console.log(JSON.stringify(report,null,2));
if(report.error||report.previews.length!==2||report.previews.some(preview=>preview.status!=='passed'))process.exitCode=1;
