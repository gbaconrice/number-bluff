// Decode our own Chromium screenshots without adding a runtime/test dependency.
import { inflateSync } from 'node:zlib';
export function decodeScreenshotPNG(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw Error('Expected PNG screenshot');
  let width, height, channels; const parts = [];
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const size = buffer.readUInt32BE(offset), type = buffer.toString('ascii', offset + 4, offset + 8), data = buffer.subarray(offset + 8, offset + 8 + size);
    if (data.length !== size) throw Error('Truncated PNG');
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || ![2,6].includes(data[9]) || data[12] !== 0) throw Error('Only non-interlaced 8-bit RGB/RGBA screenshots supported');
      channels = data[9] === 6 ? 4 : 3;
    } else if (type === 'IDAT') parts.push(data);
    offset += size + 12;
  }
  if (!width || !height || !channels) throw Error('Missing PNG header');
  const raw = inflateSync(Buffer.concat(parts)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  if (raw.length !== (stride + 1) * height) throw Error('Invalid PNG data length');
  const paeth = (a,b,c) => { const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c); return pa<=pb&&pa<=pc?a:pb<=pc?b:c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a=x>=channels?pixels[y*stride+x-channels]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=channels?pixels[(y-1)*stride+x-channels]:0;
      const predictor = filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):NaN;
      if (!Number.isFinite(predictor)) throw Error('Unknown PNG filter');
      pixels[y*stride+x]=(raw[y*(stride+1)+1+x]+predictor)&255;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i=0;i<width*height;i++) { for(let c=0;c<3;c++) rgba[i*4+c]=pixels[i*channels+c]; rgba[i*4+3]=channels===4?pixels[i*channels+3]:255; }
  return { width, height, data: rgba };
}
export function illustrationPixelDelta(before, after) {
  if(before.width!==after.width||before.height!==after.height) throw Error('Screenshot bounds changed');
  const {width,height}=before;
  // Ignore numeral, ornate border, and background outside the physical card.
  const roi={left:Math.floor(width*.08),right:Math.ceil(width*.92),top:Math.floor(height*.38),bottom:Math.ceil(height*.94)};
  let count=0,changed=0,sum=0,changedSum=0,max=0,brighter=0,darker=0,minX=width,minY=height,maxX=-1,maxY=-1;
  const cells=Array(9).fill(0);
  for(let y=roi.top;y<roi.bottom;y++)for(let x=roi.left;x<roi.right;x++){
    const i=(y*width+x)*4,dr=after.data[i]-before.data[i],dg=after.data[i+1]-before.data[i+1],db=after.data[i+2]-before.data[i+2];
    const lum=.2126*dr+.7152*dg+.0722*db,delta=Math.abs(lum);count++;sum+=delta;max=Math.max(max,delta);
    // A minimum pixel change rejects PNG metadata and sub-level color rounding.
    if(delta>=3||Math.max(Math.abs(dr),Math.abs(dg),Math.abs(db))>=8){
      changed++;changedSum+=delta;if(lum>=3)brighter++;if(lum<=-3)darker++;
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      const col=Math.min(2,Math.floor((x-roi.left)*3/(roi.right-roi.left))),row=Math.min(2,Math.floor((y-roi.top)*3/(roi.bottom-roi.top)));cells[row*3+col]++;
    }
  }
  return { width,height,roi,pixels:count,changedPixels:changed,changedAreaRatio:changed/count,meanAbsoluteLuminanceDelta:sum/count,meanChangedLuminanceDelta:changed?changedSum/changed:0,maxLuminanceDelta:max,brighterPixels:brighter,darkerPixels:darker,changedBounds:changed?{left:minX,top:minY,right:maxX+1,bottom:maxY+1,width:maxX-minX+1,height:maxY-minY+1}:null,spatialCells:cells };
}
