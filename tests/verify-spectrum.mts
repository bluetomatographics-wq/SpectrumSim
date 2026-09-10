import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {bands,transformPixels,fitDimensions,validateUpload} from '../lib/spectrum.ts';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require('@napi-rs/canvas');
assert.equal(bands.length,14);
const sample=new Uint8ClampedArray([255,0,0,255,0,255,0,128,0,0,255,0,0,0,0,255,255,255,255,255]);
const before=sample.slice();
assert.deepEqual(transformPixels(sample,'original'),sample);
for(const band of bands){const out=transformPixels(sample,band.id);assert.equal(out.length,sample.length);for(let i=3;i<out.length;i+=4)assert.equal(out[i],sample[i]);assert.notDeepEqual(out,sample);}
assert.deepEqual(sample,before);
assert.throws(()=>transformPixels(sample,'invalid'));
assert.deepEqual(fitDimensions(8000,4000),{width:1600,height:800});
assert.deepEqual(fitDimensions(300,500),{width:300,height:500});
assert.deepEqual(fitDimensions(1,4000),{width:1,height:1600});
assert.equal(validateUpload({type:'image/jpeg',size:1000}),null);
assert.ok(validateUpload({type:'text/plain',size:1000}));
assert.ok(validateUpload({type:'image/png',size:0}));
assert.ok(validateUpload({type:'image/webp',size:21*1024*1024}));
for(const id of ['landscape','city','people','animal','flowers','coast']){
 const img=await loadImage(await fs.readFile('./public/photos/'+id+'.jpg'));
 const dims=fitDimensions(img.width,img.height,420);
 const c=createCanvas(dims.width,dims.height),ctx=c.getContext('2d');
 ctx.drawImage(img,0,0,dims.width,dims.height);
 const source=ctx.getImageData(0,0,dims.width,dims.height).data;
 const hashes=new Set();
 for(const band of bands){const out=transformPixels(source,band.id,dims);hashes.add(createHash('sha256').update(out).digest('hex'));assert.notDeepEqual(out,source);}
 assert.equal(hashes.size,14);
 console.log(id+': all 14 transforms distinct; original preserved');
}
console.log('PASS: 84 photo transforms, all alpha checks, original identity, upload validation, and dimension bounds');

assert.throws(()=>transformPixels(new Uint8ClampedArray(3),'radio'));
assert.throws(()=>transformPixels(sample,'microwave',{width:2,height:2}));
for(const id of ['radio','microwave']){
 const row=new Uint8ClampedArray([255,255,255,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255]);
 const flat=new Uint8ClampedArray(20);for(let i=3;i<20;i+=4)flat[i]=255;
 const spatial=transformPixels(row,id,{width:5,height:1}), blank=transformPixels(flat,id,{width:5,height:1});
 assert.notDeepEqual(spatial.slice(4,8),blank.slice(4,8),'Neighbors must affect '+id);
 assert.deepEqual(transformPixels(row,id,{width:5,height:1}),spatial,'Output must be deterministic');
 const single=transformPixels(new Uint8ClampedArray([100,120,140,128]),id,{width:1,height:1});assert.equal(single[3],128);
}
const transparentA=new Uint8ClampedArray([255,0,0,0,80,120,160,255,255,255,255,0]);
const transparentB=new Uint8ClampedArray([0,255,255,0,80,120,160,255,0,0,0,0]);
assert.deepEqual(transformPixels(transparentA,'radio',{width:3,height:1}),transformPixels(transparentB,'radio',{width:3,height:1}),'Transparent colors must not leak into the radio blur');
console.log('PASS: spatial effects, dimensions, single-pixel edges, determinism, and transparent-color isolation');
