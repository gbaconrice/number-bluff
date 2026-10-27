// Isolated visual evidence using the production card-back rules, no artwork/data.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const root = new URL('../', import.meta.url);
const css = await readFile(new URL('styles.css',root),'utf8');
const dir = new URL('artifacts/hidden-card-back/',root);
await mkdir(dir,{recursive:true});
const browser = await chromium.launch();
const report=[];
try {
 for (const viewportWidth of [320,390]) {
  const page=await browser.newPage({viewport:{width:viewportWidth,height:500},deviceScaleFactor:2});
  await page.setContent(`<style>${css}</style><style>body{padding:16px;min-height:0;background:#111b37}body:before,body:after{display:none}.battle-grid.many{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.player-card.hidden{flex:none}</style><div class="battle-grid many"><div class="player-card hidden" style="width:70px">?</div><div class="player-card hidden" style="width:88px">?</div><div class="player-card hidden" style="width:180px">?</div></div>`);
  const cards=await page.locator('.player-card.hidden').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {width:r.width,height:r.height,display:s.display,align:s.alignItems,justify:s.justifyContent,padding:s.padding,text:n.textContent,html:n.innerHTML};}));
  for(const card of cards){assert.equal(card.display,'flex');assert.equal(card.align,'center');assert.equal(card.justify,'center');assert.equal(card.padding,'0px');assert.equal(card.html,'?');assert.ok(Math.abs(card.height/card.width-1.5)<.02);}
  await page.screenshot({path:new URL(`back-${viewportWidth}.png`,dir).pathname});
  report.push({viewportWidth,cards});await page.close();
 }
 await writeFile(new URL('geometry.json',dir),JSON.stringify(report,null,2));
}finally{await browser.close();}
