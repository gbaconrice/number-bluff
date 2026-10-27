const test=require('node:test'),assert=require('node:assert/strict');
test('pixel motion metric measures illustration area, luminance and spatial extent rather than PNG bytes',async()=>{
 const{illustrationPixelDelta}=await import('../tools/card-motion-pixel-metrics.mjs');
 const before={width:88,height:132,data:new Uint8Array(88*132*4).fill(100)},after={...before,data:before.data.slice()};
 assert.equal(illustrationPixelDelta(before,after).changedPixels,0);
 for(let y=70;y<80;y++)for(let x=20;x<40;x++)for(let c=0;c<3;c++)after.data[(y*88+x)*4+c]+=20;
 const result=illustrationPixelDelta(before,after);assert.equal(result.changedPixels,200);assert.ok(Math.abs(result.meanChangedLuminanceDelta-20)<1e-8);assert.equal(result.brighterPixels,200);assert.equal(result.darkerPixels,0);assert.deepEqual(result.changedBounds,{left:20,top:70,right:40,bottom:80,width:20,height:10});assert.equal(result.spatialCells.reduce((a,b)=>a+b),200);
 // Numerals above the region cannot masquerade as animated illustration.
 for(let c=0;c<3;c++)after.data[(10*88+20)*4+c]+=100;assert.equal(illustrationPixelDelta(before,after).changedPixels,200);
});
test('screenshot PNG decoder supports RGB/RGBA and every PNG row filter',async()=>{
 const{decodeScreenshotPNG}=await import('../tools/card-motion-pixel-metrics.mjs');const{deflateSync}=require('node:zlib');
 function chunk(type,data){const head=Buffer.alloc(8);head.writeUInt32BE(data.length);head.write(type,4);return Buffer.concat([head,data,Buffer.alloc(4)]);}
 for(const channels of[3,4])for(let filter=0;filter<=4;filter++){
  const width=3,height=2,stride=width*channels,pixels=Buffer.from(Array.from({length:stride*height},(_,i)=>(i*29+53)%256)),raw=Buffer.alloc((stride+1)*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){raw[y*(stride+1)]=filter;for(let x=0;x<stride;x++){const a=x>=channels?pixels[y*stride+x-channels]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=channels?pixels[(y-1)*stride+x-channels]:0,predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];raw[y*(stride+1)+x+1]=(pixels[y*stride+x]-predictor)&255;}}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=channels===4?6:2;
  const decoded=decodeScreenshotPNG(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
  assert.equal(decoded.width,width);assert.equal(decoded.height,height);for(let i=0;i<width*height;i++){for(let c=0;c<3;c++)assert.equal(decoded.data[i*4+c],pixels[i*channels+c]);assert.equal(decoded.data[i*4+3],channels===4?pixels[i*channels+3]:255);}
 }
});
