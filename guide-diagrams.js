/* Static instructional diagrams; no game state or character decoration. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NumberBluffGuideDiagrams=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const labels=[
  '自分のカードは裏向き。他の人の3と5は見える。自分を含む合計を予想する。',
  '宣言の例。8の次は9、その次は12。前より大きい整数を宣言する。',
  '挑戦の例。直前の宣言は12。合計は10くらいと予想したら、グラビティ！。まだ合計は未確定。',
  '判定の例。実際の合計が10のとき、宣言12なら宣言者がライフを1失う。宣言10なら疑った側がライフを1失う。',
  '負けた人のライフは3から2へ。0で脱落し、最後に残った1人が優勝。'
 ];
 function create(doc,index){
  if(!Number.isInteger(index)||index<0||index>=labels.length)throw new RangeError('Unknown guide step');
  const node=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const root=node('div','guide-diagram guide-diagram-'+index);root.setAttribute('role','img');root.setAttribute('aria-label',labels[index]);
  const row=()=>node('div','guide-diagram-row');
  const chip=(label,value,cls='')=>{const c=node('span','guide-chip '+cls);c.append(node('small','',label),node('strong','',value));return c;};
  const arrow=()=>node('span','guide-arrow','→');
  if(index===0){const r=row();r.append(chip('自分','？','guide-mini-card is-back'),chip('他の人','3','guide-mini-card'),chip('他の人','5','guide-mini-card'));root.append(r,node('span','guide-diagram-note','？ ＋ 3 ＋ 5 ＝ 合計は？'));}
  if(index===1){const r=row();r.append(chip('宣言','8','is-speech'),arrow(),chip('次の人','9','is-speech'),arrow(),chip('その次','12','is-speech'));root.append(r);}
  if(index===2){const r=row();r.append(chip('直前の宣言','12','is-speech'),node('span','guide-comparison','> ?'),chip('自分の予想','10くらい'));root.append(r,node('span','guide-challenge','グラビティ！'));}
  if(index===3){for(const [bid,sign,loser] of [['12','>','宣言者'],['10','＝','疑った側']]){const r=row();r.append(chip('宣言',bid),node('span','guide-comparison',sign),chip('実合計','10'),arrow(),node('span','guide-life-loss',loser+'\nライフ −1'));root.append(r);}}
  if(index===4){const r=row();r.append(chip('負けた人','3 → 2'),chip('0になると','脱落'),chip('残り1人','優勝'));root.append(r);}
  return root;
 }
 return Object.freeze({create,labels:Object.freeze(labels)});
});
