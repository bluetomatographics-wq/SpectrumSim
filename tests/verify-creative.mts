import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire, registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(specifier.startsWith('./')||specifier.startsWith('../'))return next(specifier+'.ts',context);throw error;}}});
const {bands,transformPixels}=await import('../lib/spectrum.ts');
const {blendPixels,initialPose}=await import('../lib/viewer.ts');
const {createEffect,defaultEffects,parseFavorites,pixelAt}=await import('../lib/creative.ts');
const {GifEncoder}=await import('../lib/gif.ts');
const {exportSweep,exportName}=await import('../lib/export-image.ts');
const {modelSettings}=await import('../lib/models.ts');
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,ImageData}=require('@napi-rs/canvas');
const sharp=require('sharp');
const source=new Uint8ClampedArray([40,80,120,255,70,120,160,128,255,255,255,0]);
for(const band of bands){
  const standard=transformPixels(source,band.id,{width:3,height:1});
  assert.deepEqual(createEffect(source,band.id,{width:3,height:1},defaultEffects),standard,'Default settings preserve every existing effect');
  for(const strength of [25,100,200]){
    const primary=transformPixels(source,band.id,{width:3,height:1},strength),secondary=transformPixels(source,'uv',{width:3,height:1},strength);
    for(const mixAmount of [0,50,100]){
      const result=createEffect(source,band.id,{width:3,height:1},{strength,mixBand:'uv',mixAmount});
      assert.deepEqual(result,blendPixels(primary,secondary,mixAmount));
      for(let i=3;i<source.length;i+=4)assert.equal(result[i],source[i]);
    }
  }
}
const photo=await loadImage(await fs.readFile('./public/photos/landscape.jpg'));
const canvas=createCanvas(180,270),context=canvas.getContext('2d');context.drawImage(photo,0,0,180,270);
const photoPixels=context.getImageData(0,0,180,270);
for(const band of bands){
  assert.notDeepEqual(transformPixels(photoPixels.data,band.id,photoPixels,25),transformPixels(photoPixels.data,band.id,photoPixels,200),'Strength must change '+band.id);
}
const favorite={id:'test',name:'IR + UV',bandId:'nir',opacity:65,effects:{strength:140,mixBand:'uv',mixAmount:30},compare:true,split:35,speed:2};
assert.equal(parseFavorites(JSON.stringify([favorite]))[0].effects.model?.engine,'classic');
assert.equal(parseFavorites(JSON.stringify([favorite]))[0].name,favorite.name);
for(const raw of ['broken','{}','null',JSON.stringify([{...favorite,effects:{...favorite.effects,mixBand:'fake'}}]),JSON.stringify([{...favorite,opacity:Infinity}]),JSON.stringify([{...favorite,speed:0}])])assert.deepEqual(parseFavorites(raw),[]);
assert.equal(parseFavorites(JSON.stringify([favorite,favorite])).length,1);
assert.equal(parseFavorites(JSON.stringify(Array.from({length:25},(_,i)=>({...favorite,id:String(i)})))).length,20);
const image={width:1000,height:500},viewport={width:400,height:400};
assert.deepEqual(pixelAt({x:200,y:200},image,viewport,initialPose),{x:500,y:250});
assert.equal(pixelAt({x:20,y:20},image,viewport,initialPose),null);
assert.equal(pixelAt({x:400,y:200},image,viewport,initialPose),null);
assert.deepEqual(pixelAt({x:200,y:200},image,viewport,{zoom:2,pan:{x:50,y:0}}),{x:437,y:250});
assert.equal(exportName('my photo.JPG','comparison.png'),'my-photo-spectrum-comparison.png');
assert.equal(exportName('../../','image.png').includes('/'),false);

// Decode an independent, multi-frame GIF to verify color, frame boundaries,
// transparency compositing, playback delay, and looping, including >250 pixels.
const gif=new GifEncoder(40,20);
const red=new Uint8ClampedArray(40*20*4),blue=red.slice();
for(let i=0;i<red.length;i+=4){red.set([255,0,0,255],i);blue.set([0,0,255,255],i);}
gif.addFrame(red,250);gif.addFrame(blue,500);
const encoded=gif.finish();
const meta=await sharp(encoded,{animated:true}).metadata();
assert.equal(meta.pages,2);assert.equal(meta.loop,0);assert.deepEqual(meta.delay,[250,500]);
const decoded=await sharp(encoded,{animated:true}).ensureAlpha().raw().toBuffer();
assert.deepEqual([...decoded.subarray(0,4)],[255,0,0,255]);
assert.deepEqual([...decoded.subarray(40*20*4,40*20*4+4)],[0,0,255,255]);
assert.throws(()=>gif.addFrame(red,100));
assert.throws(()=>new GifEncoder(0,1));

// Exercise the same asynchronous animation-export function used by the UI.
Object.assign(globalThis,{ImageData,document:{createElement(tag:string){assert.equal(tag,'canvas');return createCanvas(1,1);}}});
const progress:number[]=[];
const animationOptions={strength:120,mixBand:'uv',mixAmount:25,model:modelSettings({material:'water',palette:'ice',sourceX:23,regions:[{x:.5,y:.5,radius:.3,material:'metal'}]})};
const animation=await exportSweep(photoPixels,animationOptions,70,.5,3,new AbortController().signal,(value:number)=>progress.push(value));
const animationBytes=Buffer.from(await animation.arrayBuffer());
const animationMeta=await sharp(animationBytes,{animated:true}).metadata();
assert.equal(animationMeta.pages,56);assert.equal(animationMeta.loop,0);assert.equal(progress.at(-1),100);
assert.equal(animationMeta.delay.reduce((sum:number,value:number)=>sum+value,0),7000,'Animation duration must match playback speed');
assert.equal(animationMeta.width,320);assert.equal(animationMeta.pageHeight,318);
const animationPixels=await sharp(animationBytes,{animated:true}).ensureAlpha().raw().toBuffer();
const expectedFirst=blendPixels(photoPixels.data,createEffect(photoPixels.data,'nir',photoPixels,animationOptions),70);
for(const [x,y] of [[20,20],[90,135],[150,240]])for(let c=0;c<3;c++){
 const steps=c===2?3:7,value=expectedFirst[(y*180+x)*4+c];
 assert.equal(animationPixels[(y*320+x+70)*4+c],Math.round(Math.round(value*steps/255)*255/steps),'GIF retains custom model, palette, material regions, mixing, and opacity');
}
await fs.writeFile('./.build/verified-spectrum-sweep.gif',animationBytes);
const canceled=new AbortController();canceled.abort();
await assert.rejects(exportSweep(photoPixels,defaultEffects,100,1,0,canceled.signal,()=>{}),{name:'AbortError'});
console.log('PASS: 14 strength controls, mix endpoints, alpha preservation, favorite validation, pixel coordinates, GIF decoding, all 56 exported frames, and cancellation.');
