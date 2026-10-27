// Real elapsed-time regression: never hover, synthesize a reveal, or seek an animation.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = root + 'artifacts/';
await mkdir(output, { recursive: true });
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/favicon.ico') return res.writeHead(204).end();
  if (pathname.includes('..')) return res.writeHead(400).end();
  try {
    const path = pathname === '/' ? '/index.html' : pathname;
    const bytes = await readFile(root + path);
    const type = path.endsWith('.html') ? 'text/html' : path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : path.endsWith('.png') ? 'image/png' : 'image/webp';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'access-control-allow-origin': '*' }).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const report = { scope: 'Unmodified app, real elapsed time; mobile emulation is not actual iOS/GRAVITY validation', scenarios: [] };
let browser;
const watchdog = setTimeout(() => { console.error('Periodic motion regression timed out'); process.exit(1); }, 180_000);
async function sampleGlare(card, milliseconds = 9400) {
  // Sampling only. The app owns all animation timing and rendering.
  return card.evaluate((element, milliseconds) => new Promise(resolve => {
    const start = performance.now(), frames = [];
    const timer = setInterval(() => {
      const layer = element.querySelector('.nb-card-glare');
      frames.push({ at: performance.now() - start, opacity: layer ? Number(getComputedStyle(layer).opacity) : 0, transform: layer ? getComputedStyle(layer.querySelector('.nb-card-glare__band')).transform : null });
      if (performance.now() - start >= milliseconds) { clearInterval(timer); resolve(frames); }
    }, 80);
  }), milliseconds);
}
function verifySweeps(frames, label) {
  const starts = []; let on = false;
  for (const f of frames) { const next = f.opacity > .05; if (next && !on) starts.push(f.at); on = next; }
  assert.ok(starts.length >= 2, `${label}: must shine repeatedly without interaction, found ${starts.length} passes`);
  // Ignore a clipped first pass when measurement starts during a sweep.
  const complete = starts[0] < 160 ? starts.slice(1) : starts;
  for (let i = 1; i < complete.length; i++) assert.ok(Math.abs(complete[i] - complete[i - 1] - 4000) < 550, `${label}: unstable sweep period ${complete[i] - complete[i - 1]}ms`);
  assert.ok(new Set(frames.filter(f => f.opacity > .05).map(f => f.transform)).size > 3, `${label}: white band must move, not just blink`);
  return { passes: starts.length, starts, samples: frames.length };
}
async function svgFrame(card) {
  return card.evaluate(element => {
    const layer = element.querySelector('.nb-special-svg');
    return { playing: layer?.dataset.playing, visibility: layer && getComputedStyle(layer).visibility, animations: layer ? layer.getAnimations({ subtree: true }).map(a => ({ name: a.animationName, time: a.currentTime, state: a.playState })) : [] };
  });
}
async function verifyAmbient(card, label, captureName = null) {
  const first = await svgFrame(card);
  const before = captureName ? await card.screenshot({ path: output + captureName + '-before.png', animations: 'allow' }) : null;
  await card.page().waitForTimeout(650);
  const second = await svgFrame(card);
  const after = captureName ? await card.screenshot({ path: output + captureName + '-after.png', animations: 'allow' }) : null;
  if (captureName) {
    assert.equal(before.equals(after), false, `${label}: rendered special-card pixels must change, not just an animation clock`);
    assert.equal(await card.locator('.nb-card-glare').evaluate(el => Number(getComputedStyle(el).opacity)), 0, `${label}: frame evidence must not be explained by a white glare pass`);
  }
  assert.equal(second.playing, 'true', `${label}: SVG must play without hover`);
  assert.equal(second.visibility, 'visible', `${label}: SVG must be visible`);
  assert.ok(second.animations.some(a => a.state === 'running' && first.animations.some(b => b.name === a.name && a.time > b.time + 250)), `${label}: SVG animation time must actually advance`);
  return { first, second, ...(captureName ? { pixelFramesDiffer: true, screenshots: [captureName + '-before.png', captureName + '-after.png'] } : {}) };
}
async function assertStopped(page, label) {
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.nb-special-svg').evaluateAll(els => els.some(el => el.dataset.playing === 'true' && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none')), false, `${label}: special motion remains visible`);
  assert.equal(await page.locator('.nb-card-glare').evaluateAll(els => els.some(el => Number(getComputedStyle(el).opacity) > .01 && getComputedStyle(el).display !== 'none')), false, `${label}: glare remains active`);
}
try {
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {});
  for (const mobile of [true, false]) {
    const label = mobile ? 'mobile' : 'desktop';
    const context = await browser.newContext({ viewport: { width: mobile ? 390 : 1280, height: 844 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference' });
    const page = await context.newPage(); page.setDefaultTimeout(10_000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('https://tanabe0422.github.io/number-bluff/assets/**', route => route.fulfill({ status: 302, headers: { location: origin + '/assets/' + new URL(route.request().url()).pathname.split('/assets/')[1] } }));
    const evidence = { label, specials: {}, sweeps: {} };
    try {
      await page.goto(origin + (mobile ? '/ai-studio.html' : '/'));  await page.locator('#homeRules').click(); await page.locator('[data-tab="cards"]').click();
      for (const kind of ['double', 'max0', 'extra', 'reset']) {
        const gallery = page.locator(`#guideContent .kind-${kind}`);
        await gallery.scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
        evidence.specials[kind] = { gallery: await verifyAmbient(gallery, label + ' gallery ' + kind) };
        await gallery.click(); const detail = page.locator('#cardDetailContent .player-card');
        await detail.locator('img').evaluate(img => img.decode());
        // The old implementation vanished after 1200ms. Sample in the quiet gap
        // between the first (<=1940 + 780ms) and second (>=4400ms) glare pass.
        await page.waitForTimeout(3000);
        assert.equal(await detail.locator('.nb-card-glare').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
        evidence.specials[kind].detail = await verifyAmbient(detail, label + ' detail ' + kind, `${label}-ambient-${kind}`);
        await page.screenshot({ path: output + `${label}-periodic-${kind}.png` });
        await page.locator('#closeCardDetail').click(); await page.waitForTimeout(150);
        assert.equal(await page.locator('#cardDetail').evaluate(el => el.open), false);
        assert.equal(await page.locator('#cardDetail .nb-special-svg').evaluateAll(els => els.some(el => el.dataset.playing === 'true')), false, 'closed detail must stop');
      }
      for (const [name, selector] of [['normal', '.normal-card[data-art-value="1"]'], ['special', '.kind-extra']]) {
        await page.locator('#guideContent ' + selector).click(); const card = page.locator('#cardDetailContent .player-card');
        await card.locator('img').evaluate(img => img.decode());
        if (name === 'normal') assert.equal(await card.locator('svg,canvas').count(), 0);
        evidence.sweeps[name] = verifySweeps(await sampleGlare(card), label + ' ' + name);
        await page.locator('#closeCardDetail').click();
      }
      await page.locator('#guideContent .kind-extra').click();
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      await assertStopped(page, 'document hidden');
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
      await verifyAmbient(page.locator('#cardDetailContent .player-card'), 'hidden resume');
      await page.emulateMedia({ reducedMotion: 'reduce' }); await assertStopped(page, 'reduced motion');
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(150);
      await verifyAmbient(page.locator('#cardDetailContent .player-card'), 'motion preference resume');
      await page.locator('#closeCardDetail').click();
      await page.locator('#guideContent .normal-card[data-art-value="-10"]').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
      assert.equal(await page.locator('#guideContent .nb-special-svg').evaluateAll(els => els.filter(el => { const r = el.getBoundingClientRect(); return r.bottom <= 0 || r.top >= innerHeight; }).some(el => el.dataset.playing === 'true')), false, 'offscreen specials must stop');
      await page.locator('#guideContent .kind-extra').click();
      await verifyAmbient(page.locator('#cardDetailContent .player-card'), 'detail reopen');
      await page.locator('#closeCardDetail').click(); await page.locator('#closeGuide').click(); await assertStopped(page, 'guide closed');
      assert.deepEqual(errors, []); evidence.status = 'passed'; report.scenarios.push(evidence);
    } catch (error) { evidence.status = 'failed'; evidence.error = String(error.stack); evidence.errors = errors; report.scenarios.push(evidence); await page.screenshot({ path: output + `${label}-periodic-failure.png` }).catch(() => {}); }
    finally { await context.close(); }
  }
} catch (error) { report.error = String(error.stack); }
finally { clearTimeout(watchdog); await browser?.close(); await new Promise(resolve => server.close(resolve)); await writeFile(output + 'periodic-card-motion.json', JSON.stringify(report, null, 2)); }
console.log(JSON.stringify(report, null, 2));
if (report.error || report.scenarios.length !== 2 || report.scenarios.some(s => s.status !== 'passed')) process.exitCode = 1;
