import assert from 'node:assert/strict';
import {multiplyFilter,filterColors} from '../lib/filter-color.ts';
import {monochromePixels,tonePixels} from '../lib/monochrome.ts';
import {imageRectangle} from '../lib/viewer.ts';
const rgba=(r:number,g:number,b:number)=>new Uint8ClampedArray([r,g,b,255]);
const mono=(rgb:number[],band:string)=>Array.from(monochromePixels(multiplyFilter(rgba(...rgb as [number,number,number]),band)));
assert.deepEqual(mono([255,0,255],'green'),[0,0,0,255]);
assert.deepEqual(mono([255,0,0],'green'),[0,0,0,255]);
assert.deepEqual(mono([255,255,0],'blue'),[0,0,0,255]);
assert.deepEqual(mono([255,0,255],'cyan'),mono([0,0,255],'cyan'));
assert.deepEqual(mono([255,255,255],'violet'),[128,128,128,255]);
assert.deepEqual(mono([255,0,0],'violet'),[64,64,64,255]);
assert.deepEqual(mono([0,255,0],'violet'),[0,0,0,255]);
for(const band of Object.keys(filterColors)){
 const source=new Uint8ClampedArray([64,128,192,73]);const original=source.slice();
 const out=multiplyFilter(source,band);assert.deepEqual(source,original);assert.equal(out[3],73);
 const gray=monochromePixels(out);assert.deepEqual(tonePixels(gray,0,0),gray);
}
for(const size of [{width:1600,height:1000},{width:800,height:1200}])for(const viewport of [{width:1000,height:625},{width:360,height:225}]){
 const rect=imageRectangle(size,viewport,{zoom:1.7,pan:{x:20,y:30}});
 assert.ok(Math.abs(rect.width/rect.height-size.width/size.height)<1e-10);
}
console.log('PASS: channel rejection, cyan equivalence, violet reference values, alpha, neutral tones, source preservation, proportional scaling.');
