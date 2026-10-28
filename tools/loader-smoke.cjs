const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const broken of [false,true]){const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://tanabe0422.github.io/number-bluff/**',r=>{const rel=new URL(r.request().url()).pathname.replace('/number-bluff/','');if(broken&&rel.endsWith('game.js'))return r.abort();const f=path.resolve(rel);return fs.existsSync(f)?r.fulfill({path:f,contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'image/webp'}):r.abort();});
 await page.goto('file://'+path.resolve('gravity-launch.html'));
 if(broken){await page.locator('#nb-boot-retry').waitFor({state:'visible'});assert.equal(await page.locator('main').count(),0);}else{
 await page.locator('#nb-boot').waitFor({state:'detached'});assert.ok(await page.locator('#homeScreen').isVisible());await page.locator('#startGame').click();await page.locator('#beginGame').waitFor({state:'visible'});await page.locator('#beginGame').click();await page.locator('#battleScreen').waitFor({state:'visible'});assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(errors,[]);
 }console.log(broken?'Loader error/retry passed':'Loader home/lobby/battle passed');await page.close();}
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
