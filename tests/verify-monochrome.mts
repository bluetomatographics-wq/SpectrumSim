import assert from 'node:assert/strict';
import {monochromePixels,tonePixels} from '../lib/monochrome.ts';
const source=new Uint8ClampedArray([255,0,0,255,0,255,0,128,0,0,255,0,0,0,0,255,255,255,255,255]);
const saved=source.slice(),gray=monochromePixels(source);
assert.deepEqual(source,saved);
assert(gray[4]>gray[0]&&gray[0]>gray[8],'Luminance weighting respects green > red > blue');
assert.equal(gray[12],0);assert.equal(gray[16],255);
for(let i=0;i<source.length;i+=4){assert.equal(gray[i],gray[i+1]);assert.equal(gray[i],gray[i+2]);assert.equal(gray[i+3],source[i+3]);}
const ramp=new Uint8ClampedArray(256*4);for(let v=0;v<256;v++){ramp.set([v,v,v,v],v*4);}
assert.deepEqual(monochromePixels(ramp),ramp,'Neutral gray survives grayscale conversion');
assert.deepEqual(tonePixels(ramp,0,0),ramp,'Neutral settings are exact');
const brighter=tonePixels(ramp,35,0),darker=tonePixels(ramp,-35,0),stronger=tonePixels(ramp,0,50);
for(let i=0;i<ramp.length;i+=4){assert(brighter[i]>=ramp[i]);assert(darker[i]<=ramp[i]);assert.equal(brighter[i+3],ramp[i+3]);}
assert(stronger[64*4]<ramp[64*4]);assert(stronger[192*4]>ramp[192*4]);
assert.equal(tonePixels(ramp,100,100)[255*4],255);assert.equal(tonePixels(ramp,-100,100)[0],0);
assert.deepEqual(source,saved,'Input remains unchanged after all operations');
console.log('PASS: grayscale luminance, neutral gray, alpha, source preservation, neutral tones, brightness/contrast response, and clipping.');
