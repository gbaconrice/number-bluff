// Run with Node 22 and playwright@1.57.0. No backend, secrets, or test hooks in the app.
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../artifacts/', import.meta.url);
await mkdir(output, { recursive: true });
const allowedFiles = new Map([
  ['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']],
  ['/engine.js', ['engine.js', 'text/javascript']], ['/scheduler.js', ['scheduler.js', 'text/javascript']],
  ['/app.js', ['app.js', 'text/javascript']],
  ...['celestial-background', 'star-sprite', 'moon-cat'].map(name =>
    [`/assets/${name}.webp`, [`assets/${name}.webp`, 'image/webp']]),
]);
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/favicon.ico') { res.writeHead(204).end(); return; }
  const entry = allowedFiles.get(path);
  if (!entry) { res.writeHead(404).end(); return; }
  try {
    res.writeHead(200, { 'content-type': entry[1], 'cache-control': 'no-store' });
    res.end(await readFile(root + entry[0]));
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const results = [];
const assetProvenance = await Promise.all(['celestial-background', 'star-sprite', 'moon-cat'].map(async name => {
  const path = `assets/${name}.webp`;
  const bytes = await readFile(root + path);
  return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}));
await writeFile(new URL('asset-provenance.json', output), JSON.stringify(assetProvenance, null, 2));
let browser;
const watchdog = setTimeout(async () => {
  results.push({ status: 'failed', stage: 'global-timeout', error: 'Browser suite exceeded six minutes' });
  await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
  process.exit(1);
}, 6 * 60 * 1000);
watchdog.unref();

async function checkLayout(page, state, width) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${state}: horizontal overflow`);
  const controls = await page.locator('button, input').evaluateAll(elements => elements
    .filter(el => el.getClientRects().length)
    .map(el => ({ id: el.id, name: el.getAttribute('aria-label') || el.labels?.[0]?.textContent || el.textContent.trim(),
      width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
  for (const control of controls) {
    assert.ok(control.name, `${state}: ${control.id} has no accessible label`);
    assert.ok(control.width >= 40 && control.height >= 40, `${state}: ${control.id} touch target too small`);
  }
  await page.screenshot({ path: fileURLToPath(new URL(`${width}-${state}.png`, output)), fullPage: true });
}
// On phone-sized initial screens, play must not require scrolling. Rules,
// footer, long validation messages, and later states may extend vertically.
async function checkInitialPhoneActions(page, width) {
  if (width !== 320 && width !== 390) return;
  const bounds = await page.evaluate(() => ({
    scrollY, viewportHeight: innerHeight,
    controls: ['botCard', 'humanCard', 'number', 'keypad', 'declare', 'challenge'].map(id => {
      const element = document.getElementById(id);
      const { top, bottom, left, right, width, height } = element.getBoundingClientRect();
      return { id, top, bottom, left, right, width, height, viewportWidth: innerWidth };
    }),
  }));
  assert.equal(bounds.scrollY, 0, 'initial phone screen unexpectedly scrolled');
  for (const control of bounds.controls) {
    assert.ok(control.width > 0 && control.height > 0, `${width}: ${control.id} must be visible`);
    assert.ok(control.top >= 0 && control.bottom <= bounds.viewportHeight,
      `${width}: ${control.id} must fit initial ${bounds.viewportHeight}px viewport (top=${control.top}, bottom=${control.bottom})`);
    assert.ok(control.left >= 0 && control.right <= control.viewportWidth,
      `${width}: ${control.id} must fit viewport width`);
  }
}
async function checkArtwork(page) {
  const evidence = await page.evaluate(async () => {
    const result = [];
    for (const name of ['celestial-background', 'star-sprite', 'moon-cat']) {
      const image = new Image();
      image.src = `assets/${name}.webp`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0, opaque = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparent++;
        if (pixels[i] === 255) opaque++;
      }
      result.push({ name, width: image.naturalWidth, height: image.naturalHeight, transparent, opaque });
    }
    for (const img of document.querySelectorAll('img')) await img.decode();
    return { assets: result, background: getComputedStyle(document.body).backgroundImage,
      images: [...document.querySelectorAll('img')].filter(img => img.getClientRects().length).map(img => ({
        src: img.getAttribute('src'), fit: getComputedStyle(img).objectFit,
        left: img.getBoundingClientRect().left, right: img.getBoundingClientRect().right,
        width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
        viewportWidth: innerWidth,
      })) };
  });
  assert.ok(evidence.background.includes('assets/celestial-background.webp'), 'actual background asset is not in use');
  for (const art of evidence.assets) {
    assert.ok(art.width >= 512 && art.height >= 512 && art.opaque > 0, `${art.name}: failed/empty artwork`);
    if (art.name !== 'celestial-background') assert.ok(art.transparent > 0, `${art.name}: transparent cutout required`);
  }
  for (const name of ['star-sprite', 'moon-cat']) {
    assert.ok(evidence.images.some(img => img.src === `assets/${name}.webp`), `${name}: missing rendered mascot`);
  }
  for (const img of evidence.images) {
    assert.equal(img.fit, 'contain', `${img.src}: artwork must not be cropped`);
    assert.ok(img.width > 0 && img.height > 0 && img.left >= 0 && img.right <= img.viewportWidth,
      `${img.src}: artwork clipped outside page`);
  }
  return evidence.assets;
}
async function checkKeypad(page, width) {
  assert.equal(await page.locator('#number').getAttribute('inputmode'), 'none');
  assert.equal(await page.locator('#keypad [data-digit]').count(), 10);
  await page.locator('#keypad [data-digit="7"]').click();
  assert.equal(await page.locator('#number').inputValue(), '7', 'first digit must replace suggested bid');
  await page.locator('#keypad [data-digit="2"]').click();
  assert.equal(await page.locator('#number').inputValue(), '72');
  await page.locator('#backspace').click();
  assert.equal(await page.locator('#number').inputValue(), '7');
  await page.locator('#backspace').click();
  assert.equal(await page.locator('#number').inputValue(), '');
  await page.locator('#declare').click();
  assert.equal(await page.locator('#number').getAttribute('aria-invalid'), 'true');
  await checkLayout(page, 'keypad-invalid', width);
  await page.locator('#keypad [data-digit="0"]').click();
  assert.equal(await page.locator('#number').inputValue(), '0');
  assert.equal(await page.locator('#number').getAttribute('aria-invalid'), null);
  for (let i = 0; i < 9; i++) await page.locator('#keypad [data-digit="8"]').click();
  assert.equal((await page.locator('#number').inputValue()).length, 8);
  assert.ok((await page.locator('#inputError').textContent()).trim(), 'ninth digit needs accessible feedback');
  assert.equal((await page.locator('#bid').textContent()).trim(), '—', 'keypad must not automatically declare');
  assert.equal(await page.locator('#declare').isEnabled(), true);
}
async function checkHiddenCard(page) {
  assert.equal((await page.locator('#humanCard').textContent()).trim(), '?');
  const snapshot = await page.locator('#humanCard').ariaSnapshot();
  assert.doesNotMatch(snapshot, /\d/, 'own hidden card must not leak through accessible text');
  const attributes = await page.locator('#humanCard').evaluate(el => Array.from(el.attributes, a => [a.name, a.value]));
  for (const [name, value] of attributes) {
    if (/^(aria-|title|data-|value)/.test(name)) assert.doesNotMatch(value, /\d/, `own hidden card leaked through ${name}`);
  }
  assert.equal((await page.locator('#resultCards').textContent()).trim(), '', 'previous revealed cards remain in hidden DOM');
}
async function tickBot(page) { await page.clock.runFor(1600); }
async function restart(page, accept = true) {
  await page.locator('#restartBtn').click();
  await page.locator(accept ? '#confirmRestart' : '#cancelRestart').click();
  assert.equal(await page.locator('#restartConfirm').isVisible(), false);
}

try {
  browser = await chromium.launch();
  for (const width of [320, 390, 844, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 640 : width === 844 ? 390 : 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(15_000);
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      external.push(route.request().url());
      return route.abort('blockedbyclient');
    });
    // Seed only the platform RNG; the production game exposes no state/test backdoor.
    await page.addInitScript(() => {
      let seed = 0x19af;
      Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    });
    const time = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time });
    await page.clock.pauseAt(new Date(time.getTime() + 1000));
    try {
      await page.goto(origin);
      await page.locator('#startGame').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#battleScreen').isVisible(), false);
      const artwork = await checkArtwork(page);
      await checkLayout(page, 'home', width);
      await page.locator('#homeRules').click();
      assert.equal(await page.locator('#rulesTitle').evaluate(el => el === document.activeElement), true);
      await checkLayout(page, 'home-rules', width);
      await page.locator('#closeRules').click();
      assert.equal(await page.locator('#homeRules').evaluate(el => el === document.activeElement), true);
      await page.locator('#homeCards').click();
      assert.equal(await page.locator('#cardGuideTitle').evaluate(el => el === document.activeElement), true);
      await checkLayout(page, 'cards', width);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#cardGuide').isVisible(), false);
      assert.equal(await page.locator('#homeCards').evaluate(el => el === document.activeElement), true);
      await page.locator('#startGame').click();
      assert.equal(await page.locator('#homeScreen').isVisible(), false);
      assert.equal(await page.locator('#status').evaluate(el => el === document.activeElement), true);
      await page.locator('#declare').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#declare').isEnabled(), true);
      assert.equal(await page.locator('#challenge').isDisabled(), true);
      await checkHiddenCard(page);
      await checkInitialPhoneActions(page, width);
      await checkLayout(page, 'normal', width);
      await checkKeypad(page, width);
      await page.locator('#rulesBtn').click();
      await page.locator('#closeRules').waitFor({ state: 'visible' });
      await checkLayout(page, 'rules', width);
      await page.locator('#closeRules').click();
      assert.equal(await page.locator('#closeRules').isVisible(), false);
      assert.equal(await page.locator('#rulesBtn').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#rulesBtn').evaluate(el => el === document.activeElement), true);
      await page.locator('#rulesBtn').press('Enter');
      assert.equal(await page.locator('#rulesBtn').getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#closeRules').isVisible(), false);

      // Rejected input must not advance the game; an equal bid is covered below.
      for (const value of ['', '-1', '1.5', 'abc', '1e2', '99999999999999999999']) {
        await page.locator('#number').fill(value);
        await page.locator('#declare').click();
        assert.equal((await page.locator('#bid').textContent()).trim(), '—');
        assert.equal(await page.locator('#declare').isEnabled(), true);
        assert.equal(await page.locator('#number').getAttribute('aria-invalid'), 'true');
        assert.ok((await page.locator('#inputError').textContent()).trim());
      }
      await checkLayout(page, 'invalid-bid', width);
      await page.locator('#number').fill('0');
      await page.locator('#number').press('Enter');
      assert.equal(await page.locator('#declare').isDisabled(), true);
      assert.equal(await page.locator('#keypad button:enabled').count(), 0);
      await page.locator('#rulesBtn').click();
      await tickBot(page);
      assert.equal(await page.locator('#rulesTitle').evaluate(el => el === document.activeElement), true, 'BOT stole focus from rules');
      await page.locator('#closeRules').click();
      assert.equal(await page.locator('#challenge').isEnabled(), true);
      await page.locator('#keypad [data-digit="7"]').click();
      assert.equal(await page.locator('#number').inputValue(), '7', 'new human-turn suggestion must be replaced');
      const bid = (await page.locator('#bid').textContent()).trim();
      await page.locator('#number').fill(bid);
      await page.locator('#declare').click();
      assert.equal(await page.locator('#number').getAttribute('aria-invalid'), 'true');
      assert.equal((await page.locator('#bid').textContent()).trim(), bid);
      assert.equal(await page.locator('#challenge').isEnabled(), true);
      await page.locator('#challenge').click();
      await page.locator('#next').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#resultTitle').evaluate(el => el === document.activeElement), true);
      assert.equal(await page.locator('#keypad button:enabled').count(), 0);
      assert.match(await page.locator('#resultCards').textContent(), /\d/);
      assert.notEqual((await page.locator('#humanCard').textContent()).trim(), '?');
      await checkLayout(page, 'reveal', width);
      await page.locator('#next').click();
      await checkHiddenCard(page);
      await tickBot(page);

      // Force three losses without reading any private game state. Values exceed
      // every possible two-card total; BOT must challenge and reduce human life.
      await restart(page);
      for (let round = 0; round < 3; round++) {
        if (await page.locator('#declare').isDisabled()) await tickBot(page);
        await page.locator('#number').fill('999');
        await page.locator('#declare').click();
        await tickBot(page);
        await page.locator('#next').waitFor({ state: 'visible' });
        if (round < 2) { await page.locator('#next').click(); await checkHiddenCard(page); }
      }
      assert.match(await page.locator('#next').textContent(), /再戦/);
      await checkLayout(page, 'match-end', width);
      await page.locator('#next').click();
      await checkHiddenCard(page);
      assert.equal((await page.locator('#bid').textContent()).trim(), '—');
      assert.equal(await page.locator('#declare').isEnabled(), true);
      await checkLayout(page, 'rematch', width);

      // Keeping a confirmation open must not pause or reset the current match,
      // and BOT progress must not steal focus from its cancel control.
      await page.locator('#number').fill('0');
      await page.locator('#declare').click();
      await page.locator('#restartBtn').click();
      await tickBot(page);
      assert.equal(await page.locator('#cancelRestart').evaluate(el => el === document.activeElement), true);
      const progressedBid = await page.locator('#bid').textContent();
      assert.notEqual(progressedBid.trim(), '—');
      await page.locator('#cancelRestart').click();
      assert.equal(await page.locator('#bid').textContent(), progressedBid);
      await restart(page);

      // Restart during a pending BOT callback; canceled timers must not mutate
      // the fresh match, including after the old callback's deadline.
      await page.locator('#number').fill('0');
      await page.locator('#declare').click();
      await restart(page, false);
      assert.equal(await page.locator('#declare').isDisabled(), true);
      await restart(page);
      await tickBot(page);
      assert.equal((await page.locator('#bid').textContent()).trim(), '—');
      assert.equal(await page.locator('#declare').isEnabled(), true);
      await checkHiddenCard(page);
      await checkLayout(page, 'restart-stale-timer', width);
      // Return home while the BOT is scheduled, then start a fresh match.
      // Waiting on home must not run the retired callback or reveal game UI.
      await page.locator('#number').fill('0');
      await page.locator('#declare').click();
      const pendingBid = await page.locator('#bid').textContent();
      await page.locator('#homeBtn').click();
      assert.equal(await page.locator('#restartConfirm').isVisible(), true);
      await checkLayout(page, 'home-confirm', width);
      await page.locator('#cancelRestart').click();
      assert.equal(await page.locator('#battleScreen').isVisible(), true);
      assert.equal(await page.locator('#homeScreen').isVisible(), false);
      assert.equal(await page.locator('#bid').textContent(), pendingBid);
      assert.equal(await page.locator('#declare').isDisabled(), true);
      assert.equal(await page.locator('#homeBtn').evaluate(el => el === document.activeElement), true);
      await page.locator('#homeBtn').click();
      await page.locator('#confirmRestart').click();
      assert.equal(await page.locator('#battleScreen').isVisible(), false);
      assert.equal(await page.locator('#startGame').evaluate(el => el === document.activeElement), true);
      const retiredBid = await page.locator('#bid').textContent();
      await tickBot(page);
      assert.equal(await page.locator('#bid').textContent(), retiredBid);
      await checkLayout(page, 'home-return', width);
      await page.locator('#startGame').click();
      await tickBot(page);
      assert.equal((await page.locator('#bid').textContent()).trim(), '—');
      assert.equal(await page.locator('#declare').isEnabled(), true);
      assert.equal(await page.locator('#humanLife').getAttribute('aria-label'), 'あなたのライフ 3 / 3');
      await checkHiddenCard(page);
      await checkInitialPhoneActions(page, width);
      await checkLayout(page, 'home-reentry', width);
      assert.deepEqual(external, [], 'app attempted external network requests');
      assert.deepEqual(errors, [], 'browser errors');
      results.push({ width, status: 'passed', errors, external, artwork });
    } catch (error) {
      results.push({ width, status: 'failed', error: String(error.stack), errors, external });
      await page.screenshot({ path: fileURLToPath(new URL(`${width}-failure.png`, output)), fullPage: true }).catch(() => {});
    } finally { await context.close(); }
  }
} catch (error) {
  results.push({ status: 'failed', stage: 'browser-launch', error: String(error.stack) });
} finally {
  clearTimeout(watchdog);
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.status !== 'passed') || results.length !== 4) process.exitCode = 1;

