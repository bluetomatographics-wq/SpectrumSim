import assert from 'node:assert/strict';
import {blendPixels,imageRectangle,zoomPose,initialPose} from '../lib/viewer.ts';
import {bands,transformPixels} from '../lib/spectrum.ts';
const source=new Uint8ClampedArray([40,120,200,128,255,70,10,255,60,80,100,0]);
const copy=source.slice();
for(const band of bands){
 const effect=transformPixels(source,band.id,{width:3,height:1});
 assert.deepEqual(blendPixels(source,effect,0),source,band.name+' at zero must be the original');
 assert.deepEqual(blendPixels(source,effect,100),effect,band.name+' at full must be the effect');
 const middle=blendPixels(source,effect,50);
 for(let i=0;i<source.length;i++){
  if(i%4===3)assert.equal(middle[i],source[i],'Transparency must not change');
  else assert.ok(Math.abs(middle[i]-(source[i]+effect[i])/2)<=.5,'Half opacity must be an equal color blend');
 }
 assert.deepEqual(blendPixels(source,effect,-20),source);
 assert.deepEqual(blendPixels(source,effect,200),effect);
}
assert.deepEqual(source,copy);
assert.throws(()=>blendPixels(source,new Uint8ClampedArray(4),50));
assert.throws(()=>blendPixels(new Uint8ClampedArray(3),new Uint8ClampedArray(3),50));
const landscape={width:1000,height:500},viewport={width:400,height:400};
assert.deepEqual(imageRectangle(landscape,viewport,initialPose),{width:400,height:200,left:0,top:100,pan:{x:0,y:0},zoom:1});
const reset=zoomPose(landscape,viewport,{zoom:4,pan:{x:200,y:-200}},1);assert.ok(reset.zoom===1&&reset.pan.x===0&&reset.pan.y===0);
const oldPose={zoom:2,pan:{x:50,y:0}},nextPose=zoomPose(landscape,viewport,oldPose,3);
const before=imageRectangle(landscape,viewport,oldPose),after=imageRectangle(landscape,viewport,nextPose);
assert.equal((viewport.width/2-before.left)/before.width,(viewport.width/2-after.left)/after.width,'Zoom should keep the central image detail in place');
for(const image of [landscape,{width:500,height:1000},{width:1,height:1},{width:10000,height:100}]){
 for(const viewport of [{width:390,height:260},{width:1200,height:500},{width:500,height:1000}]){
  for(const zoom of [1,1.25,2,5]){
   for(const sign of [-1,0,1]){
    const rect=imageRectangle(image,viewport,{zoom,pan:{x:sign*1e6,y:-sign*1e6}});
    if(rect.width>=viewport.width){assert.ok(rect.left<=1e-9);assert.ok(rect.left+rect.width>=viewport.width-1e-9);}
    else assert.equal(rect.left,(viewport.width-rect.width)/2);
    if(rect.height>=viewport.height){assert.ok(rect.top<=1e-9);assert.ok(rect.top+rect.height>=viewport.height-1e-9);}
    else assert.equal(rect.top,(viewport.height-rect.height)/2);
   }
  }
 }
}
assert.equal(zoomPose(landscape,viewport,initialPose,20).zoom,5);
assert.equal(zoomPose(landscape,viewport,initialPose,-20).zoom,1);
console.log('PASS: opacity endpoints and 50% blend for all 14 bands, alpha preservation, image alignment, zoom limits, reset, and pan boundaries.');
