const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('external loader preserves source scripts and markup with a small same-document shell',async()=>{
 const {buildLoader}=await import('../tools/build-gravity-loader.mjs');const r=buildLoader();
 assert.ok(r.shell.length<5000);assert.equal(r.scriptCount,17);new vm.Script(r.js);
 assert.equal(fs.readFileSync('gravity-launch.html','utf8'),r.shell);
 for(const [name,data]of [['game.js',r.js],['game.css',r.css]])assert.equal(fs.readFileSync('releases/'+r.version+'/'+name,'utf8'),data);
 assert.ok(!/<iframe|eval\(|new Function|document\.write/.test(r.shell+r.js));
 assert.match(r.shell,/location.reload/);assert.match(r.shell,/25000/);assert.match(r.shell,/NumberBluffBootReady/);
 assert.match(r.js,/id=\\"homeScreen/);assert.match(r.js,/NumberBluffPlatform/);
 for(const image of ['home-logo.webp','home-hero.webp','celestial-background-v3.webp'])assert.ok(fs.existsSync('assets/'+image));
});
