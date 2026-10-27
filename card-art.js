(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NumberBluffCardArt=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const assets=Object.freeze({normal:Object.freeze({"-10": "assets/card-normal-minus10.webp", "-5": "assets/card-normal-minus5.webp", "0": "assets/card-normal-0.webp", "1": "assets/card-normal-1.webp", "2": "assets/card-normal-2.webp", "3": "assets/card-normal-3.webp", "4": "assets/card-normal-4.webp", "5": "assets/card-normal-5.webp", "10": "assets/card-normal-10.webp", "15": "assets/card-normal-15.webp", "20": "assets/card-normal-20.webp"}),special:Object.freeze({"double": "assets/card-double.webp", "max0": "assets/card-max0.webp", "extra": "assets/card-extra.webp", "reset": "assets/card-reset.webp"})});
 const dimensions=Object.freeze({double:[1051,1496],max0:[1049,1499],extra:[1049,1500],reset:[1062,1482]});
 function size(card){return card.kind==='number'?(card.value>=10?[1024,1536]:[1061,[0,2].includes(card.value)?1483:1482]):dimensions[card.kind];}
 function layout(card){const [w,h]=size(card),sourceHeight=h/(w*1.5);return {sourceHeight,capHeight:sourceHeight*.2,bandHeight:1-sourceHeight*.85};}
 function content(doc,card){const box=doc.createElement('div');box.className='card-content';const parts=layout(card);box.style.width='100%';box.style.height='100%';box.style.setProperty('--card-source-height',parts.sourceHeight*100+'%');box.style.setProperty('--card-cap-height',parts.capHeight*100+'%');box.style.setProperty('--card-band-height',parts.bandHeight*100+'%');
  // Extend only the empty numeral backdrop. The frame cap and illustrated lower
  // section retain a uniform source-pixel scale, with no character stretching.
  for(const part of ['cap','band']){const slice=doc.createElement('span');slice.className='card-art-'+part;slice.setAttribute('aria-hidden','true');slice.style.backgroundImage='url("'+source(card)+'")';box.append(slice);}return box;}
 function source(card){if(!card)return null;const map=card.kind==='number'?assets.normal:assets.special;const key=card.kind==='number'?String(card.value):card.kind;return Object.prototype.hasOwnProperty.call(map,key)?map[key]:null;}
 function create(doc,card){const src=source(card);if(!src)throw new TypeError('Unknown disclosed card artwork');const image=doc.createElement('img');image.className='card-art';image.crossOrigin='anonymous';image.src=src;image.alt='';image.draggable=false;image.decoding='async';image.setAttribute('aria-hidden','true');return image;}
 return Object.freeze({assets,source,create,size,layout,content});
});
