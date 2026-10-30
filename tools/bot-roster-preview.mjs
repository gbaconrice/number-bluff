import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(root+'artifacts/bot-roster',{recursive:true});
const browser=await chromium.launch(process.env.NB_CHROMIUM?{executablePath:process.env.NB_CHROMIUM}:{});
try{
  for(const width of [320,390]){
    const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
    await page.goto(pathToFileURL(root+'index.html').href);
    await page.locator('#startGame').click();
    await page.locator('#lobbyScreen:not(.hide)').waitFor();
    await page.locator('#addBot').click();
    await page.locator('#addBot').click();
    const cat=page.locator('#avatarChoices [data-avatar="1"]');
    assert.equal(await cat.isDisabled(),true,'a character already used by another BOT is unavailable');
    await page.locator('#randomBot').click();
    await page.locator('[data-difficulty="hard"]').click();
    const randomSeat=page.locator('#lobbyPlayers [data-seat="p3"]');
    assert.equal(await randomSeat.locator('strong').textContent(),'ランダム');
    assert.equal(await randomSeat.locator('small').textContent(),'BOT · 強い');
    assert.equal(await randomSeat.locator('.bot-avatar-missing').textContent(),'？');
    await page.locator('#addBot').click();
    await page.locator('#randomBot').click();
    assert.equal(await page.locator('#lobbyPlayers [data-seat="p4"] strong').textContent(),'ランダム');
    await page.locator('#lobbyPlayers [data-seat="p2"]').click();
    await page.locator('#removeBot').click();
    assert.equal(await cat.isDisabled(),false,'removing the BOT makes its direct character available');
    const geometry=await page.locator('#avatarChoices').evaluate(row=>{const r=row.getBoundingClientRect(),buttons=[...row.children].map(button=>{const b=button.getBoundingClientRect();return{left:b.left,right:b.right};});return{left:r.left,right:r.right,scrollWidth:row.scrollWidth,clientWidth:row.clientWidth,buttons};});
    assert.ok(geometry.scrollWidth<=geometry.clientWidth,'all six character controls fit without horizontal overflow');
    assert.ok(geometry.buttons.every(button=>button.left>=geometry.left-1&&button.right<=geometry.right+1),'every character choice stays inside its row');
    for(let i=0;i<5;i++)await page.locator('#addBot').click();
    assert.equal(await page.locator('#playerCount').textContent(),'8/8');
    await page.screenshot({path:root+`artifacts/bot-roster/lobby-${width}-8players.png`});
    await page.locator('#beginGame').click();
    await page.locator('#battleScreen:not(.hide)').waitFor();
    await page.waitForFunction(()=>['p3','p4'].every(id=>document.querySelector(`#playerGrid [data-player="${id}"] .player-name`)?.textContent!=='ランダム'));
    const resolvedNames=await Promise.all(['p3','p4'].map(id=>page.locator(`#playerGrid [data-player="${id}"] .player-name`).textContent()));
    assert.ok(resolvedNames.every(name=>name&&name!=='ランダム'),'random choices resolve to named characters before play');
    const battleBounds=await page.evaluate(()=>{const grid=document.querySelector('#playerGrid').getBoundingClientRect(),cards=[...document.querySelectorAll('#playerGrid .player-card')].map(card=>{const r=card.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};});return{grid:{left:grid.left,right:grid.right},documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,cards};});
    assert.equal(battleBounds.documentWidth,battleBounds.viewportWidth,'eight-player game remains within the mobile viewport');
    assert.equal(battleBounds.cards.length,8);
    assert.ok(battleBounds.cards.every(card=>card.left>=battleBounds.grid.left-1&&card.right<=battleBounds.grid.right+1),'all eight cards stay inside the battle grid');
    await page.screenshot({path:root+`artifacts/bot-roster/game-${width}.png`});
    await page.close();
    console.log(width,'passed');
  }
}finally{await browser.close();}
