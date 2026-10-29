/* Static examples use the actual card artwork and BOT portraits as named actors. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./card-art'));else root.NumberBluffGuideDiagrams=factory(root.NumberBluffCardArt);})(typeof globalThis==='object'?globalThis:this,function(cardArt){
 'use strict';
 const labels=[
  '自分のカードは裏向き。他の人の3と5は見える。自分を含む合計を予想する。',
  '宣言の例。8の次は9、その次は12。前より大きい整数を宣言する。',
  '挑戦の例。直前の宣言は12。合計は10くらいと予想したら、グラビティ！。まだ合計は未確定。',
  '判定の例。実際の合計が10のとき、宣言12なら宣言者がライフを1失う。宣言10なら疑った側がライフを1失う。',
  '負けた人のライフは3から2へ。0で脱落し、最後に残った1人が優勝。'
 ];
 const portraits={bunny:'assets/cloud-bunny.webp',cat:'assets/moon-cat.webp',star:'assets/star-sprite.webp'};
 function create(doc,index){
  if(!Number.isInteger(index)||index<0||index>=labels.length)throw new RangeError('Unknown guide step');
  const node=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const root=node('div','guide-diagram guide-diagram-'+index);root.setAttribute('role','img');root.setAttribute('aria-label',labels[index]);
  const row=()=>node('div','guide-diagram-row');
  const image=(src,cls)=>{const n=node('img',cls);n.src=src;n.alt='';n.draggable=false;n.decoding='async';n.setAttribute('aria-hidden','true');return n;};
  const chip=(label,value,cls='')=>{const c=node('span','guide-chip '+cls);c.append(node('small','',label),node('strong','',value));return c;};
  const actor=(who,label)=>{const c=node('span','guide-actor');c.append(image(portraits[who],'guide-avatar'));if(label)c.append(node('small','',label));return c;};
  const speech=(who,label,value)=>{const c=node('div','guide-speaker');c.append(chip(label,value,'is-speech'),actor(who,null));return c;};
  const arrow=()=>node('span','guide-arrow','→');
  const card=(label,value)=>{const c=node('div','guide-card-example'),face=node('span','player-card guide-card-face'+(value===null?' hidden':' kind-number normal-card'));c.append(node('small','',label));if(value===null)face.textContent='？';else{face.setAttribute('data-art-value',String(value));const disclosed={kind:'number',value},content=cardArt.content(doc,disclosed);content.append(node('strong','card-value',String(value)),cardArt.create(doc,disclosed));face.append(content);}c.append(face);return c;};
  if(index===0){const r=row();r.append(card('自分',null),card('他の人',3),card('他の人',5));root.append(r,node('span','guide-diagram-note','？ ＋ 3 ＋ 5 ＝ 合計は？'));}
  if(index===1){const r=row();r.append(speech('bunny','宣言','8'),arrow(),speech('cat','次の人','9'),arrow(),speech('star','その次','12'));root.append(r);}
  if(index===2){const r=row();r.append(speech('bunny','直前の宣言','12'),node('span','guide-comparison','> ?'),chip('自分の予想','10くらい'));const challenge=row();challenge.className+=' guide-challenger';challenge.append(actor('cat','疑う人'),node('span','guide-challenge','グラビティ！'));root.append(r,challenge);}
  if(index===3){for(const [bid,sign,loser,who] of [['12','>','宣言者','bunny'],['10','＝','疑った側','cat']]){const example=node('div','guide-verdict'),r=row(),outcome=row();r.append(chip('宣言',bid),node('span','guide-comparison',sign),chip('実合計','10'));outcome.className+=' guide-verdict-outcome';outcome.append(actor(who,loser),node('span','guide-life-loss','ライフ −1'));example.append(r,outcome);root.append(example);}}
  if(index===4){const r=row();r.append(actor('bunny','負けた人'),chip('ライフ','3 → 2','guide-life-chip'));const hearts=node('span','guide-hearts');hearts.append(node('span','','♥ ♥ '),node('span','is-lost','♥'));r.append(hearts);root.append(r,node('span','guide-diagram-note','0になると脱落。残った1人が優勝！'));}
  return root;
 }
 return Object.freeze({create,labels:Object.freeze(labels)});
});
