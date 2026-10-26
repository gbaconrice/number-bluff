// Run with Node 22 and playwright@1.57.0. No backend, secrets, or test hooks in the app.
import assert from 'node:assert/strict';
import http from 'node:http';
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
    const context = await browser.newContext({ viewport: { width, height: width === 844 ? 390 : 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
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
      await page.locator('#declare').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#declare').isEnabled(), true);
      assert.equal(await page.locator('#challenge').isDisabled(), true);
      await checkHiddenCard(page);
      await checkLayout(page, 'normal', width);
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
      await page.locator('#declare').click();
      assert.equal(await page.locator('#declare').isDisabled(), true);
      await page.locator('#rulesBtn').click();
      await tickBot(page);
      assert.equal(await page.locator('#rulesTitle').evaluate(el => el === document.activeElement), true, 'BOT stole focus from rules');
      await page.locator('#closeRules').click();
      assert.equal(await page.locator('#challenge').isEnabled(), true);
      const bid = (await page.locator('#bid').textContent()).trim();
      await page.locator('#number').fill(bid);
      await page.locator('#declare').click();
      assert.equal(await page.locator('#number').getAttribute('aria-invalid'), 'true');
      assert.equal((await page.locator('#bid').textContent()).trim(), bid);
      assert.equal(await page.locator('#challenge').isEnabled(), true);
      await page.locator('#challenge').click();
      await page.locator('#next').waitFor({ state: 'visible' });
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
      assert.deepEqual(external, [], 'app attempted external network requests');
      assert.deepEqual(errors, [], 'browser errors');
      results.push({ width, status: 'passed', errors, external });
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
