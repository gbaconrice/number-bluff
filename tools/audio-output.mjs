// Render the shipped cue generator into real browser audio buffers, and verify
// the small on/off control with trusted clicks. Not a physical-speaker test.
import { chromium, webkit } from 'playwright';
const browserName = process.env.AUDIO_BROWSER === 'webkit' ? 'webkit' : 'chromium';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('.');
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + sep)) throw Error('bad path');
    const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'};
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = browserName === 'webkit'
    ? await webkit.launch({headless:true})
    : await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  await page.addInitScript(() => {
    window.__audioStartCount = 0;
    window.__liveAudioPeak = 0;
    window.__liveAudioSamples = 0;
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (destination, ...args) {
      if (!(destination instanceof AudioDestinationNode)) return connect.call(this, destination, ...args);
      // Measure the actual live master output on its route to the device, not
      // a second offline synth. This does not attest physical speaker output.
      const analyser = this.context.createAnalyser(); analyser.fftSize = 2048;
      connect.call(this, analyser); connect.call(analyser, destination);
      const samples = new Float32Array(analyser.fftSize);
      setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        for (const value of samples) window.__liveAudioPeak = Math.max(window.__liveAudioPeak, Math.abs(value));
        window.__liveAudioSamples += samples.length;
      }, 8);
      return destination;
    };
    const original = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) { window.__audioStartCount++; return original.apply(this,args); };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(await page.evaluate(() => window.__audioStartCount), 0, 'no automatic sound before interaction');
  const button = page.locator('#homeSoundToggle');
  assert.equal(await button.textContent(),'♪','HOME uses the same sound icon as the battle screen');
  const soundBox = await button.boundingBox(); assert.ok(soundBox.width>=40 && soundBox.height>=40,'sound target remains tappable');
  await button.tap(); // mute
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
  const mutedCount = await page.evaluate(() => window.__audioStartCount);
  await page.locator('#homeRules').tap();
  await page.locator('#closeGuide').tap();
  assert.equal(await page.evaluate(() => window.__audioStartCount), mutedCount, 'muted controls produce no notes');
  await button.tap(); // unmute/resume
  await page.waitForFunction(n => window.__audioStartCount > n, mutedCount);
  await page.waitForFunction(() => window.__liveAudioPeak > .005);
  const liveUnmutePeak = await page.evaluate(() => window.__liveAudioPeak);
  assert.equal(await button.getAttribute('aria-pressed'), 'false');
  await button.tap(); await page.reload();
  assert.equal(await button.getAttribute('aria-pressed'), 'true', 'mute preference survives reload');
  assert.equal(await button.textContent(),'♪');
  assert.equal(await page.evaluate(() => window.__audioStartCount), 0, 'muted reload does not autoplay');
  await button.tap(); // restore sound after the persisted-muted reload
  await page.waitForFunction(() => window.__liveAudioPeak > .005);
  await page.locator('#startGame').tap();
  if (await page.locator('#beginGame').isDisabled()) await page.locator('#addBot').tap();
  await page.evaluate(() => { window.__liveAudioPeak = 0; });
  await page.locator('#beginGame').tap();
  await page.waitForFunction(() => window.__liveAudioPeak > .005);
  const liveDealPeak = await page.evaluate(() => window.__liveAudioPeak);
  await page.waitForFunction(() => !document.querySelector('#declare').disabled);
  await page.waitForTimeout(350); // let the deal cue finish before measuring declaration
  await page.evaluate(() => { window.__liveAudioPeak = 0; });
  await page.locator('#declare').tap();
  await page.waitForFunction(() => window.__liveAudioPeak > .005);
  const liveDeclarePeak = await page.evaluate(() => window.__liveAudioPeak);
  await page.locator('#battleSoundToggle').tap();
  await page.waitForTimeout(100);
  await page.evaluate(() => { window.__liveAudioPeak = 0; });
  await page.waitForTimeout(350);
  const liveMutedPeak = await page.evaluate(() => window.__liveAudioPeak);
  assert.equal(liveMutedPeak, 0, 'live destination output is silent when muted');
  const live = {liveUnmutePeak, liveDealPeak, liveDeclarePeak, liveMutedPeak};
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
  await writeFile(`artifacts/audio-output-${browserName}.json`,JSON.stringify({browserName,scope:'Live AudioContext destination-path samples for unmute, deal, declaration and mute; OfflineAudioContext cue waveforms. Not iOS/GRAVITY or physical speaker recording.',live,rendered},null,2));
  console.log('Audio: mute/unmute, persisted choice and 14 rendered cue waveforms PASS');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
