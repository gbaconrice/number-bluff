import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const js = await readFile(new URL('../../../component-scene-motion.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../../../component-scene-motion.css', import.meta.url), 'utf8');
let browser;
before(async () => {
  await mkdir('/tmp/nb-scene-browser-home', { recursive: true });
  browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), headless: true, args: ['--no-sandbox'],
    env: { ...process.env, HOME: '/tmp/nb-scene-browser-home', XDG_CONFIG_HOME: '/tmp/nb-scene-browser-home/config' } });
});
after(async () => { await browser?.close(); });

async function fixture({ reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.setContent(`<html lang="ja"><head><meta charset="utf-8"><style>${css}
    body{background:#201e35;color:#fff8e8;font:20px system-ui;margin:24px}#total{font-size:64px}
    button{font:inherit;padding:12px}header{margin-top:200px}
    </style></head><body><header>計算済みの合計</header><strong id="total">0</strong>
    <button id="skip">結果を見る</button><p id="outcome">星のカードゲーム</p></body></html>`);
  await page.addScriptTag({ content: js });
  await page.evaluate(() => {
    window.motion = NumberBluffSceneMotion.create();
    window.total = document.getElementById('total');
    motion.begin('room1:game1:round1');
    document.getElementById('skip').onclick = () => motion.skip();
  });
  return { page, errors, requests, close: () => context.close() };
}

test('official bundles are self-contained and retain every full runtime license', async () => {
  const manifest = JSON.parse(await readFile(new URL('../BUILD_MANIFEST.json', import.meta.url)));
  assert.deepEqual(manifest.unresolvedImports, []);
  assert.ok(!/\bimport\s*\(/.test(js));
  for (const [name, file] of [['number-flow','LICENSE.md'],['canvas-confetti','LICENSE'],['esm-env','LICENSE']]) {
    const license = await readFile(new URL(`../licenses/${name}.txt`, import.meta.url), 'utf8');
    assert.ok(js.includes(license.trim()), `${name}: full license in delivered bundle`);
  }
});

test('only supplied safe integer stages appear; same render is stable; null and invalid values are safe', async () => {
  const f = await fixture();
  try {
    const result = await f.page.evaluate(() => {
      const values = [0, -5, 5, 10];
      const snapshots = values.map(value => {
        motion.setNumber(total, value);
        return { text: total.querySelector('.nb-scene-number__fallback').textContent, value: total.querySelector('number-flow')?.value };
      });
      const flow = total.querySelector('number-flow');
      motion.setNumber(total, 10);
      const stable = flow === total.querySelector('number-flow');
      const rejected = [1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER+1, '12'].map(value => motion.setNumber(total, value));
      motion.setNumber(total, null);
      return { snapshots, stable, rejected, placeholder: total.textContent, state: total.dataset.numberMotion,
        pluginCount: flow.plugins.length, flowHidden: flow.getAttribute('aria-hidden') };
    });
    assert.deepEqual(result.snapshots.map(x=>x.text), ['0','-5','5','10']);
    assert.deepEqual(result.snapshots.map(x=>x.value), [0,-5,5,10]);
    assert.equal(result.stable, true); assert.deepEqual(result.rejected, [false,false,false,false,false]);
    assert.equal(result.placeholder, '…'); assert.equal(result.state, 'fallback');
    assert.equal(result.pluginCount, 0); assert.equal(result.flowHidden, 'true');
    assert.deepEqual(f.errors, []); assert.deepEqual(f.requests, []);
  } finally { await f.close(); }
});

test('skip immediately finishes numbers, keeps future final updates static, and suppresses victory burst', async () => {
  const f = await fixture();
  try {
    await f.page.evaluate(() => { motion.setNumber(total, 0); motion.setNumber(total, 20); });
    await f.page.locator('#skip').focus(); await f.page.keyboard.press('Enter');
    const r = await f.page.evaluate(() => {
      motion.setNumber(total, 40);
      return { animated: total.querySelector('number-flow').animated, value: total.querySelector('number-flow').value,
        burst: motion.celebrate({key:'room1:game1:round1',confirmed:true,won:true}), state: motion.state };
    });
    assert.equal(r.animated, false); assert.equal(r.value, 40); assert.equal(r.burst, false); assert.equal(r.state.canvasCount, 0);
    // Touch remains on a normal button: decorative overlays never capture input.
    await f.page.locator('#skip').tap();
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('one confirmed victory per stable result key, regardless of repeated renders and revision delivery', async () => {
  const f = await fixture();
  try {
    const r = await f.page.evaluate(() => {
      const key='room1:game1:round1';
      const noConfirmation = motion.celebrate({key,won:true});
      const loss = motion.celebrate({key,confirmed:true,won:false});
      const stale = motion.celebrate({key:'wrong',confirmed:true,won:true});
      const first = motion.celebrate({key,confirmed:true,won:true});
      const duplicate = Array.from({length:30}, () => { motion.begin(key); return motion.celebrate({key,confirmed:true,won:true}); });
      return { noConfirmation, loss, stale, first, duplicate, state: motion.state,
        pointer: getComputedStyle(document.querySelector('canvas')).pointerEvents,
        sameInstance: motion === NumberBluffSceneMotion.create() };
    });
    assert.equal(r.first, true); assert.equal(r.noConfirmation, false); assert.equal(r.loss, false); assert.equal(r.stale, false);
    assert.ok(r.duplicate.every(x=>x===false)); assert.equal(r.state.burstCount, 1); assert.equal(r.state.canvasCount, 1);
    assert.equal(r.pointer, 'none'); assert.equal(r.sameInstance, true);
    await f.page.waitForFunction(() => !motion.state.running, { timeout: 5000 });
    assert.deepEqual(f.errors, []); assert.deepEqual(f.requests, []);
  } finally { await f.close(); }
});

test('leave/reset/hidden stop promptly; same result never replays; later result reuses one canvas', async () => {
  const f = await fixture();
  try {
    const r = await f.page.evaluate(() => {
      const key='room1:game1:round1';
      motion.setNumber(total,10); motion.celebrate({key,confirmed:true,won:true});
      const canvas=document.querySelector('canvas'); motion.leave();
      const left=motion.state.running; motion.begin(key); const replay=motion.celebrate({key,confirmed:true,won:true});
      motion.reset(); const plain=total.textContent;
      motion.begin('room1:game2:round1'); motion.celebrate({key:'room1:game2:round1',confirmed:true,won:true});
      const reused=canvas===document.querySelector('canvas');
      Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange'));
      const hidden=motion.state.running;
      Object.defineProperty(document,'hidden',{configurable:true,value:false}); document.dispatchEvent(new Event('visibilitychange'));
      const hiddenReplay=motion.celebrate({key:'room1:game2:round1',confirmed:true,won:true});
      return { left,replay,plain,reused,hidden,hiddenReplay,state:motion.state,canvases:document.querySelectorAll('canvas').length };
    });
    assert.equal(r.left,false); assert.equal(r.replay,false); assert.equal(r.plain,'10'); assert.equal(r.reused,true);
    assert.equal(r.hidden,false); assert.equal(r.hiddenReplay,false); assert.equal(r.canvases,1); assert.equal(r.state.burstCount,2);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('new result cancels old burst without stale promise hiding the new one', async () => {
  const f = await fixture();
  try {
    await f.page.evaluate(() => {
      motion.celebrate({key:'room1:game1:round1',confirmed:true,won:true});
      motion.begin('room1:game2:round1'); motion.celebrate({key:'room1:game2:round1',confirmed:true,won:true});
    });
    await f.page.waitForTimeout(80);
    assert.equal(await f.page.evaluate(() => motion.state.running),true);
    assert.equal(await f.page.locator('canvas').count(),1);
    await f.page.evaluate(() => motion.destroy());
    assert.equal(await f.page.locator('canvas').count(),0);
    assert.equal(await f.page.evaluate(() => motion.state.destroyed),true);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('reduced-motion starts static, consumes victory without canvas, and never resumes it', async () => {
  const f=await fixture({reducedMotion:'reduce'});
  try {
    const r=await f.page.evaluate(() => {
      motion.setNumber(total,0); motion.setNumber(total,-10);
      return { animated:total.querySelector('number-flow').animated,
        burst:motion.celebrate({key:'room1:game1:round1',confirmed:true,won:true}),state:motion.state };
    });
    assert.equal(r.animated,false); assert.equal(r.burst,false); assert.equal(r.state.canvasCount,0);
    await f.page.emulateMedia({reducedMotion:'no-preference'});
    assert.equal(await f.page.evaluate(() => motion.celebrate({key:'room1:game1:round1',confirmed:true,won:true})),false);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('late OS motion change, externally replaced text, pagehide and destroy all retain authoritative text',async()=>{
  const f=await fixture();
  try {
    await f.page.evaluate(()=>{motion.setNumber(total,5);total.textContent='5';motion.setNumber(total,15);});
    await f.page.emulateMedia({reducedMotion:'reduce'});
    await f.page.waitForTimeout(40);
    assert.equal(await f.page.evaluate(()=>total.querySelector('number-flow').animated),false);
    const r=await f.page.evaluate(()=>{
      dispatchEvent(new Event('pagehide')); motion.destroy(); motion.destroy();
      return {text:total.textContent,canvasCount:document.querySelectorAll('canvas').length,
        rejected:motion.setNumber(total,30),state:motion.state};
    });
    assert.equal(r.text,'15');assert.equal(r.canvasCount,0);assert.equal(r.rejected,false);assert.equal(r.state.destroyed,true);
    assert.deepEqual(f.errors, []);
  }finally{await f.close();}
});

test('mobile visual fixture is captured with real NumberFlow and a small victory burst',async()=>{
  const f=await fixture();
  try{
    await f.page.evaluate(()=>{motion.setNumber(total,15);motion.setNumber(total,30);motion.celebrate({key:'room1:game1:round1',confirmed:true,won:true});});
    await f.page.waitForTimeout(250);
    await mkdir('artifacts',{recursive:true});
    await f.page.screenshot({path:'artifacts/scene-mobile-components.png'});
    assert.deepEqual(f.errors,[]);assert.deepEqual(f.requests,[]);
  }finally{await f.close();}
});
