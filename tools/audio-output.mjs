// Render the shipped cue generator into real browser audio buffers, and verify
// the small on/off control with trusted clicks. Not a physical-speaker test.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('.');
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + '/')) throw Error('bad path');
    const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'};
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(() => {
    window.__audioStartCount = 0;
    const original = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) { window.__audioStartCount++; return original.apply(this,args); };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(await page.evaluate(() => window.__audioStartCount), 0, 'no automatic sound before interaction');
  const button = page.locator('#homeSoundToggle');
  assert.equal(await button.locator('b').count(),1,'HOME retains its circular sound icon');
  assert.equal(await button.locator('.icon-caption').textContent(),'音');
  const soundBox = await button.boundingBox(); assert.ok(soundBox.width>=40 && soundBox.height>=40,'sound target remains tappable');
  await button.click(); // mute
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
  const mutedCount = await page.evaluate(() => window.__audioStartCount);
  await page.locator('#homeRules').click();
  await page.locator('#closeGuide').click();
  assert.equal(await page.evaluate(() => window.__audioStartCount), mutedCount, 'muted controls produce no notes');
  await button.click(); // unmute/resume
  await page.waitForFunction(n => window.__audioStartCount > n, mutedCount);
  assert.equal(await button.getAttribute('aria-pressed'), 'false');
  await button.click(); await page.reload();
  assert.equal(await button.getAttribute('aria-pressed'), 'true', 'mute preference survives reload');
  assert.equal(await button.locator('b').count(),1);
  assert.equal(await button.locator('.icon-caption').textContent(),'音');
  assert.equal(await page.evaluate(() => window.__audioStartCount), 0, 'muted reload does not autoplay');
  const rendered = await page.evaluate(async () => {
    const results = [];
    for (const cue of ['tap','deal','declare','challenge','reveal','extra','max','sum','multiply','reset','compare','win','loss','outcome']) {
      const offline = new OfflineAudioContext(1, 48000, 48000);
      const device = {state:'running',currentTime:0,destination:offline.destination,
        createGain:()=>offline.createGain(),createOscillator:()=>offline.createOscillator()};
      const audio = NumberBluffAudio.create({document:null,window:null,storage:null,contextFactory:()=>device});
      audio.unlock(); audio.play(cue);
      const buffer = await offline.startRendering(), samples = buffer.getChannelData(0);
      let peak = 0, energy = 0;
      for (const value of samples) { peak = Math.max(peak,Math.abs(value)); energy += value*value; }
      results.push({cue,peak,rms:Math.sqrt(energy/samples.length),tailPeak:Math.max(...samples.slice(-1000).map(Math.abs))});
      audio.destroy();
    }
    return results;
  });
  for (const result of rendered) {
    assert.ok(result.peak > .015 && result.peak < .5, `${result.cue}: audible bounded peak ${result.peak}`);
    assert.ok(result.rms > .002 && result.rms < .1, `${result.cue}: nonzero bounded energy ${result.rms}`);
    assert.ok(result.tailPeak < .00001, `${result.cue}: finite cue must end`);
  }
  await mkdir('artifacts',{recursive:true});
  await writeFile('artifacts/audio-output.json',JSON.stringify({scope:'Real browser OfflineAudioContext waveform plus trusted UI mute/unmute. Not iOS/GRAVITY or speaker recording.',rendered},null,2));
  console.log('Audio: mute/unmute, persisted choice and 14 rendered cue waveforms PASS');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
