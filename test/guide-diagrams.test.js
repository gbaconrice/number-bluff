const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const guide=require('../guide-diagrams');
class Node { constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.textContent='';}append(...nodes){this.children.push(...nodes)}setAttribute(k,v){this.attrs[k]=v} }
const doc={createElement:t=>new Node(t)};
function text(n){return n.textContent+n.children.map(text).join(' ')}
test('five diagrams are informative, static and avatar-free',()=>{for(let i=0;i<5;i++){const n=guide.create(doc,i);assert.equal(n.attrs.role,'img');assert.ok(n.attrs['aria-label']);assert.ok(text(n).length>4);const walk=n=>{assert.ok(!['img','canvas','svg','button'].includes(n.tag));n.children.forEach(walk)};walk(n);}});
test('hidden card and declaration examples preserve uncertainty and increasing numbers',()=>{assert.match(text(guide.create(doc,0)),/自分.*？.*他の人.*3.*他の人.*5/);assert.match(text(guide.create(doc,1)),/8.*9.*12/);assert.match(text(guide.create(doc,2)),/予想.*10くらい.*グラビティ/);});
test('comparison includes equality losing for challenger, not bidder',()=>{const n=guide.create(doc,3);assert.match(text(n.children[0]),/12.*>.*10.*宣言者.*−1/s);assert.match(text(n.children[1]),/10.*＝.*10.*疑った側.*−1/s);});
