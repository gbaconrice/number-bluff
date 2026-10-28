import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,ASSET_BASE} from './build-single-html.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function buildLoader(){
 const html=build(root), version='20261028-1', base=ASSET_BASE+'releases/'+version+'/';
 const css=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 const markup=html.match(/<body>([\s\S]*?)<script>/)[1];
 const js=`try {\ndocument.body.insertAdjacentHTML('beforeend',${JSON.stringify(markup)});\n${scripts.join('\n;\n')}\nwindow.NumberBluffBootReady=true;\n} catch(error) { window.NumberBluffBootError=error; }\n`;
 const shell=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101b40"><title>ナンバーブラフ</title><style>
html,body{margin:0;min-height:100%;background:#101b40}#nb-boot{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;justify-items:center;gap:20px;background:radial-gradient(ellipse at 50% 42%,#263a67,#101b40 65%);color:#f8edce;font:15px system-ui;text-align:center;padding:100px 24px 24px}#nb-boot .light{width:36px;height:36px;border-radius:50%;background:radial-gradient(circle,#fff9db, #e9c985 20%,transparent 65%);box-shadow:0 0 34px #d7b97855;animation:nb-breathe 1.6s ease-in-out infinite alternate}#nb-boot button{font:inherit;color:#132347;background:#f8edce;border:0;border-radius:20px;padding:12px 24px}#nb-boot [hidden]{display:none!important}html.nb-loading body>main{visibility:hidden!important}@keyframes nb-breathe{from{opacity:.35;transform:scale(.7)}to{opacity:1;transform:scale(1.2)}}@media(prefers-reduced-motion:reduce){#nb-boot .light{animation:none}}
</style></head><body><div id="nb-boot" role="status" aria-live="polite"><span class="light" aria-hidden="true"></span><span id="nb-boot-text">読み込み中…</span><button id="nb-boot-retry" hidden>再試行</button></div><script>
(()=>{document.documentElement.classList.add('nb-loading');const panel=document.getElementById('nb-boot'),text=document.getElementById('nb-boot-text'),retry=document.getElementById('nb-boot-retry');let failed=false;const fail=()=>{failed=true;text.textContent='読み込めませんでした。通信を確認して再試行してください。';panel.querySelector('.light').style.animation='none';retry.hidden=false;};retry.onclick=()=>location.reload();const timeout=setTimeout(fail,25000);const resource=(tag,url)=>new Promise((resolve,reject)=>{const el=document.createElement(tag);el.onload=resolve;el.onerror=reject;if(tag==='link'){el.rel='stylesheet';el.href=url;}else{el.src=url;el.async=false;}document.head.appendChild(el);});const image=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>img.decode().then(resolve,reject);img.onerror=reject;img.src=url;});(async()=>{await resource('link','${base}game.css');await resource('script','${base}game.js');if(window.NumberBluffBootError||!window.NumberBluffBootReady)throw Error('initialization');if(window.AgentSDK)await window.NumberBluffPlatform.start({window});await Promise.all(['home-logo.webp','home-hero.webp','celestial-background-v3.webp'].map(name=>image('${ASSET_BASE}assets/'+name)));if(failed)return;clearTimeout(timeout);document.documentElement.classList.remove('nb-loading');panel.remove();})().catch(()=>{clearTimeout(timeout);fail();});})();
</script></body></html>`;
 return {version,css,js,shell,scriptCount:scripts.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=buildLoader(),dir=path.join(root,'releases',r.version);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'game.js'),r.js);fs.writeFileSync(path.join(dir,'game.css'),r.css);fs.writeFileSync(path.join(root,'gravity-launch.html'),r.shell);console.log(JSON.stringify({characters:Array.from(r.shell).length,bytes:Buffer.byteLength(r.shell),scripts:r.scriptCount}));
}
