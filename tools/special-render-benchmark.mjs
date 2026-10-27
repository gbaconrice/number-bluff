// Controlled Chromium comparison, not an actual iOS/WebView performance claim.
// CI must make the baseline commit available (checkout fetch-depth: 0).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = root + 'artifacts/special-render-benchmark/';
const baselineCommit = process.env.SPECIAL_BENCHMARK_BASELINE || '360b75e6adef706f2a67fe26dc6305e4a7b41a54';
const cpuRate = 4, warmupMs = 2000, sampleMs = 6000, screenshotPhaseMs = 1200;
await mkdir(output, { recursive: true });
const baseline = new Map();
for (const name of ['special-svg-motion.js', 'special-svg-motion.css']) {
  try { baseline.set(name, execFileSync('git', ['show', `${baselineCommit}:${name}`], {cwd:root,maxBuffer:8*1024*1024})); }
  catch { throw new Error(`Baseline ${baselineCommit} is unavailable. Fetch that commit or use actions/checkout fetch-depth: 0 before this benchmark.`); }
}
function html(variant) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/card-presentation.css"><link rel="stylesheet" href="/card-art.css"><link rel="stylesheet" href="/${variant}/special-svg-motion.css">
<style>html,body{margin:0!important;padding:0!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;overflow:hidden!important;background:#11182b!important}body:before,body:after{display:none!important}#benchmarkCards{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;gap:0}#benchmarkCards>.player-card{flex:0 0 var(--benchmark-card-width);width:var(--benchmark-card-width);max-width:none;margin:0;height:auto;aspect-ratio:2/3}</style>
</head><body><div id="benchmarkCards"></div><script src="/card-art.js"></script><script src="/${variant}/special-svg-motion.js"></script></body></html>`;
}
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost'), pathname = url.pathname;
  if (pathname === '/benchmark') return response.writeHead(200, {'content-type':'text/html','cache-control':'no-store'}).end(html(url.searchParams.get('variant') === 'baseline' ? 'baseline' : 'current'));
  if (pathname === '/favicon.ico') return response.writeHead(204).end();
  if (pathname.includes('..')) return response.writeHead(400).end();
  try {
    const match = pathname.match(/^\/(baseline|current)\/(special-svg-motion\.(?:js|css))$/);
    const bytes = match ? match[1] === 'baseline' ? baseline.get(match[2]) : await readFile(root + match[2]) : await readFile(root + pathname);
    const type = pathname.endsWith('.css')?'text/css':pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.png')?'image/png':'image/webp';
    response.writeHead(200,{'content-type':type,'cache-control':'no-store','access-control-allow-origin':'*'}).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  scope: 'Four isolated special cards, identical originals and CardArt geometry, no foil/TOP/gameplay. Chromium CDP 4x CPU slowdown is not actual iOS/GRAVITY. RAF is a scheduling proxy, not proof of delivered compositor frames. CDP TaskDuration excludes much raster/GPU work. Single-run results are descriptive, not a statistically established speedup.',
  baselineCommit, settings:{cpuRate,warmupMs,sampleMs,screenshotPhaseMs,deviceScaleFactor:1},
  sources: {}, originals: {}, runs: [], comparisons: []
};
for(const name of baseline.keys())report.sources[name]={baselineSHA256:sha256(baseline.get(name)),currentSHA256:sha256(await readFile(root+name))};
for(const kind of ['double','extra','max0','reset'])report.originals[kind]=sha256(await readFile(root+`assets/card-${kind}.webp`));
let browser;
const watchdog=setTimeout(()=>{console.error('Special render benchmark exceeded 120 seconds');process.exit(1);},120000);
const metricMap = result => Object.fromEntries(result.metrics.map(item=>[item.name,item.value]));
const metricNames=['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'];
function summarize(intervals,elapsedMs) {
  const sorted=[...intervals].sort((a,b)=>a-b),percentile=q=>sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]??null;
  return {samples:intervals.length,elapsedMs,meanMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),maxMs:sorted.at(-1),over25ms:intervals.filter(n=>n>25).length,over50ms:intervals.filter(n=>n>50).length,estimatedRAFHz:intervals.length*1000/intervals.reduce((a,b)=>a+b,0),intervalsMs:intervals};
}
try {
  browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{});
  report.browserVersion=browser.version();
  for(const cardWidth of [88,180]) {
    // Counterbalance ordering between sizes to avoid always warming the old renderer first.
    for(const variant of cardWidth===88?['baseline','current']:['current','baseline']) {
      const viewport=cardWidth===180?{width:720,height:300}:{width:384,height:164};
      const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'no-preference'});
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(15000);
      const cdp=await context.newCDPSession(page);
      const run={variant,cardWidth,viewport};
      try {
        await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});await cdp.send('Performance.enable');
        await page.goto(origin+`/benchmark?variant=${variant}`);
        run.geometry=await page.evaluate(async width=>{
          document.documentElement.style.setProperty('--benchmark-card-width',width+'px');
          const holder=document.querySelector('#benchmarkCards'),cards=[];
          for(const [kind,label]of[['double','×2'],['extra','?'],['max0','MAX→0'],['reset','リセット']]){
            const card={kind,label},node=document.createElement('div');node.className=`player-card special kind-${kind}`;
            const content=NumberBluffCardArt.content(document,card),value=document.createElement('span');value.className='card-value';value.textContent=label;
            const image=NumberBluffCardArt.create(document,card);content.append(value,image);node.append(content);holder.append(node);cards.push({kind,node,image});
          }
          await Promise.all(cards.map(card=>card.image.decode()));await document.fonts.ready;
          const manager=NumberBluffSpecialSVG.createManager();
          for(const card of cards)manager.attach(card.node,card.kind,{faceUp:true,imageElement:card.image});
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          return cards.map(card=>({kind:card.kind,width:card.node.getBoundingClientRect().width,height:card.node.getBoundingClientRect().height,playing:card.node.querySelector('.nb-special-svg')?.dataset.playing,source:card.image.currentSrc}));
        },cardWidth);
        for(const geometry of run.geometry){assert.equal(geometry.width,cardWidth);assert.equal(geometry.height,cardWidth*1.5);assert.equal(geometry.playing,'true');}
        assert.equal(await page.locator('.nb-card-glare,.nb-background').count(),0);
        await page.waitForTimeout(warmupMs);
        const before=metricMap(await cdp.send('Performance.getMetrics'));
        const frames=await page.evaluate(duration=>new Promise(resolve=>{
          const start=performance.now(),intervals=[];let previous=null;
          function sample(now){if(previous!==null)intervals.push(now-previous);previous=now;if(now-start>=duration)resolve({intervals,elapsedMs:now-start});else requestAnimationFrame(sample);}
          requestAnimationFrame(sample);
        }),sampleMs);
        const after=metricMap(await cdp.send('Performance.getMetrics'));
        assert.ok(frames.intervals.length>10,'not enough animation frames for a useful sample');
        run.raf=summarize(frames.intervals,frames.elapsedMs);
        run.performanceDelta=Object.fromEntries(metricNames.map(name=>[name,(after[name]??0)-(before[name]??0)]));
        run.metricWallSeconds=after.Timestamp-before.Timestamp;
        run.mainThreadTaskShare=run.performanceDelta.TaskDuration/run.metricWallSeconds;
        run.heapBytesAfter=after.JSHeapUsedSize;run.domNodesAfter=after.Nodes;
        // Screenshot phase is deliberately controlled AFTER the natural timing sample.
        // These before/after PNGs are visual-comparison evidence, not performance samples.
        run.screenshotAnimations=await page.evaluate(async phase=>{
          const animations=[...document.querySelectorAll('.nb-special-svg')].flatMap(layer=>layer.getAnimations({subtree:true}));
          for(const animation of animations){animation.pause();animation.currentTime=phase;}
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          return animations.map(animation=>({name:animation.animationName,currentTime:animation.currentTime,playState:animation.playState}));
        },screenshotPhaseMs);
        run.screenshot=`${variant}-${cardWidth}px-phase-${screenshotPhaseMs}.png`;
        await page.screenshot({path:output+run.screenshot,animations:'allow'});
        assert.deepEqual(errors,[]);run.status='passed';
      }catch(error){run.status='failed';run.error=String(error.stack);run.errors=errors;}
      finally{report.runs.push(run);await context.close();}
    }
  }
  for(const cardWidth of [88,180]){
    const before=report.runs.find(run=>run.cardWidth===cardWidth&&run.variant==='baseline'),after=report.runs.find(run=>run.cardWidth===cardWidth&&run.variant==='current');
    if(before?.status!=='passed'||after?.status!=='passed')continue;
    const relative=(a,b)=>a===0?null:(b-a)/a*100;
    report.comparisons.push({cardWidth,taskDurationChangePercent:relative(before.performanceDelta.TaskDuration,after.performanceDelta.TaskDuration),p95FrameIntervalChangePercent:relative(before.raf.p95Ms,after.raf.p95Ms),baselineTaskShare:before.mainThreadTaskShare,currentTaskShare:after.mainThreadTaskShare,baselineFramesOver50ms:before.raf.over50ms,currentFramesOver50ms:after.raf.over50ms,interpretation:'Negative change is lower measured cost, but neither CPU TaskDuration nor RAF alone establishes raster/GPU improvement or real-device smoothness.'});
  }
}catch(error){report.error=String(error.stack);}
finally{clearTimeout(watchdog);await browser?.close();await new Promise(resolve=>server.close(resolve));await writeFile(output+'report.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
if(report.error||report.runs.length!==4||report.runs.some(run=>run.status!=='passed'))process.exitCode=1;
