import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(root+'artifacts/home-sound',{recursive:true});
const browser=await chromium.launch(process.env.NB_CHROMIUM?{executablePath:process.env.NB_CHROMIUM}:{});
try{
  for(const width of [320,390]){
    const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
    await page.goto(pathToFileURL(root+'index.html').href);
    await page.evaluate(()=>document.documentElement.style.setProperty('--nb-host-top','56px'));
    const inspect=selector=>page.locator(selector).evaluate(element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return{x:r.x,y:r.y,width:r.width,height:r.height,color:s.color,background:s.backgroundImage,borderRadius:s.borderRadius,fontSize:s.fontSize};});
    const home=await inspect('#homeSoundToggle');
    assert.equal(await page.locator('#homeSoundToggle').evaluate(element=>element.parentElement.classList.contains('home-icons')),true,'home sound belongs to the lower guide/control row');
    const homeRules=await inspect('#homeRules'),actions=await page.locator('.home-actions').boundingBox();
    assert.ok(home.y>=homeRules.y,'sound control sits on the lower home row');
    assert.ok(home.y>=actions.y+actions.height-1,'sound control remains below the primary actions');
    assert.ok(home.width>=44&&home.height>=44,'home sound keeps a usable tap target');
    const overlaps=await page.evaluate(()=>{const bounds=element=>element.getBoundingClientRect(),sound=bounds(document.querySelector('#homeSoundToggle'));return [...document.querySelectorAll('.home-brand,.home-actions button,#homeRules')].some(element=>{const r=bounds(element);return sound.left<r.right&&sound.right>r.left&&sound.top<r.bottom&&sound.bottom>r.top;});});
    assert.equal(overlaps,false,'lower sound control does not cover the title, actions, or guide control');
    assert.equal(await page.locator('#homeSoundToggle').count(),1);
    await page.screenshot({path:root+`artifacts/home-sound/home-${width}.png`});
    await page.locator('#homeSoundToggle').click();
    assert.equal(await page.locator('#homeSoundToggle').getAttribute('aria-pressed'),'true');
    await page.locator('#startGame').click();
    await page.locator('#addBot').click();
    await page.locator('#beginGame').click();
    const battle=await inspect('#battleSoundToggle'),topbar=await page.locator('#battleScreen .topbar').boundingBox();
    assert.ok(battle.y>=topbar.y&&battle.y<topbar.y+topbar.height,'battle sound remains in the upper-right game header');
    assert.equal(await page.locator('#battleSoundToggle').getAttribute('aria-pressed'),'true','sound state is shared between home and game');
    for(const id of ['homeBtn','battleSoundToggle','rulesBtn'])assert.equal(await page.locator('#'+id).evaluate(element=>{const r=element.getBoundingClientRect();return element.ownerDocument.elementFromPoint(r.left-1,r.top+r.height/2)===element&&element.ownerDocument.elementFromPoint(r.right+1,r.top+r.height/2)===element;}),true,id+' keeps the expanded hit target');
    await page.locator('#battleSoundToggle').click();
    assert.equal(await page.locator('#battleSoundToggle').getAttribute('aria-pressed'),'false');
    await page.screenshot({path:root+`artifacts/home-sound/battle-${width}.png`});
    await page.close();
    console.log(width,'passed');
  }
}finally{await browser.close();}
