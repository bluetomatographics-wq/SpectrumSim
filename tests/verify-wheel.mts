import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(specifier.startsWith('./')||specifier.startsWith('../'))return next(specifier+'.ts',context);throw error;}}});
const {zoomPose,imageRectangle,initialPose,wheelZoomValue}=await import('../lib/viewer.ts');
const {bindWheelZoom}=await import('../lib/wheel-zoom.ts');
const size={width:1000,height:1000},viewport={width:500,height:500};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const initial={zoom:2,pan:{x:25,y:-20}},anchor={x:125,y:300};
const next=zoomPose(size,viewport,initial,3.4,anchor);
const before=imageRectangle(size,viewport,initial),after=imageRectangle(size,viewport,next);
near((anchor.x-before.left)/before.width,(anchor.x-after.left)/after.width);
near((anchor.y-before.top)/before.height,(anchor.y-after.top)/after.height);
const reversed=zoomPose(size,viewport,next,2,anchor);near(reversed.pan.x,initial.pan.x);near(reversed.pan.y,initial.pan.y);
assert.ok(wheelZoomValue(2,-100,0,500)>2);
assert.ok(wheelZoomValue(2,100,0,500)<2);
assert.equal(wheelZoomValue(5,-100,0,500),5);assert.equal(wheelZoomValue(1,100,0,500),1);
near(wheelZoomValue(2,-3,1,500),wheelZoomValue(2,-48,0,500));
near(wheelZoomValue(2,-1,2,500),wheelZoomValue(2,-500,0,500));
assert.ok(wheelZoomValue(2,-1,0,500)<2.01,'Trackpad increments should remain small');
assert.equal(wheelZoomValue(2,NaN,0,500),2);
for(const image of [{width:1600,height:1067},{width:1061,height:1600},size]){
 for(const point of [{x:0,y:0},{x:499,y:499},anchor]){
  let pose=initialPose;
  for(let i=0;i<30;i++)pose=zoomPose(image,viewport,pose,wheelZoomValue(pose.zoom,-120,0,500),point);
  assert.equal(pose.zoom,5);
  const rect=imageRectangle(image,viewport,pose);
  if(rect.width>=500){assert.ok(rect.left<=1e-9);assert.ok(rect.left+rect.width>=500-1e-9);}
  if(rect.height>=500){assert.ok(rect.top<=1e-9);assert.ok(rect.top+rect.height>=500-1e-9);}
  for(let i=0;i<30;i++)pose=zoomPose(image,viewport,pose,wheelZoomValue(pose.zoom,120,0,500),point);
  assert.equal(pose.zoom,1);near(pose.pan.x,0);near(pose.pan.y,0);
 }
}
class Stage extends EventTarget {
  options:unknown;hidden=false;
  getBoundingClientRect(){return {left:40,top:60,width:this.hidden?0:1000,height:1000};}
  addEventListener(type:string,handler:any,options?:any){if(type==='wheel')this.options=options;super.addEventListener(type,handler,options);}
}
class Frames {
 time=0;next=0;reduced=false;pending=new Map<number,any>();
 request=(callback:any)=>{const id=++this.next;this.pending.set(id,callback);return id;};
 cancel=(id:number)=>{this.pending.delete(id);};
 now=()=>this.time;
 reducedMotion=()=>this.reduced;
 step(ms=16){this.time+=ms;const tasks=[...this.pending.values()];this.pending.clear();for(const task of tasks)task(this.time);}
 finish(){for(let i=0;i<200&&this.pending.size;i++)this.step();assert.equal(this.pending.size,0,'Motion must settle');}
}
const stage=new Stage(),clock=new Frames();let pose=initial;let panning=false;
const motion=bindWheelZoom(stage as any,size,viewport,()=>pose,(next:any)=>{pose=next;},()=>panning,clock);
assert.deepEqual(stage.options,{passive:false});
const wheel=(patch:Record<string,unknown>={})=>{
 const {cancelable=true,...properties}=patch;
 const event=new Event('wheel',{cancelable:Boolean(cancelable)});
 Object.assign(event,{deltaY:-100,deltaMode:0,clientX:290,clientY:660,ctrlKey:false,metaKey:false,...properties});
 return event;
};
const event=wheel();stage.dispatchEvent(event);assert.ok(event.defaultPrevented);
const expected=zoomPose(size,viewport,initial,wheelZoomValue(initial.zoom,-100,0,500),anchor);
assert.equal(pose,initial,'A wheel event must not jump straight to its target');
assert.equal(clock.pending.size,1);
clock.step();assert.ok(pose.zoom>initial.zoom&&pose.zoom<expected.zoom,'The first frame should be between the starting and target zoom');
let previous=pose.zoom,intermediate=0;
while(clock.pending.size){clock.step();assert.ok(pose.zoom>=previous&&pose.zoom<=expected.zoom+1e-9);previous=pose.zoom;intermediate++;const rect=imageRectangle(size,viewport,pose);near((anchor.x-rect.left)/rect.width,(anchor.x-before.left)/before.width);near((anchor.y-rect.top)/rect.height,(anchor.y-before.top)/before.height);}
assert.ok(intermediate>8,'Wheel notches must become a continuous sequence of frames');
near(pose.zoom,expected.zoom);
near(pose.pan.x,expected.pan.x);near(pose.pan.y,expected.pan.y);
for(const patch of [{ctrlKey:true},{metaKey:true},{deltaY:0},{deltaY:NaN},{cancelable:false}]){
 const saved=pose;const event=wheel(patch);stage.dispatchEvent(event);assert.equal(event.defaultPrevented,false);assert.equal(pose,saved);
}
panning=true;const held=pose;const duringPan=wheel();stage.dispatchEvent(duringPan);assert.ok(duringPan.defaultPrevented);assert.equal(pose,held);panning=false;
stage.hidden=true;const hidden=wheel();stage.dispatchEvent(hidden);assert.equal(hidden.defaultPrevented,false);assert.equal(pose,held);stage.hidden=false;
const outside=new EventTarget(),pageScroll=wheel();outside.dispatchEvent(pageScroll);assert.equal(pageScroll.defaultPrevented,false);

// Bursts share one animation and retain all of the wheel input.
pose=initial;stage.dispatchEvent(wheel());stage.dispatchEvent(wheel());
assert.equal(clock.pending.size,1);assert.equal(pose,initial);clock.finish();
near(pose.zoom,wheelZoomValue(wheelZoomValue(initial.zoom,-100,0,500),-100,0,500));

// Reversing immediately heads in the new direction instead of finishing old momentum.
pose=initial;stage.dispatchEvent(wheel());clock.step();const turning=pose.zoom;
stage.dispatchEvent(wheel({deltaY:100}));clock.step();assert.ok(pose.zoom<turning);clock.finish();

// Starting a drag, resetting, using browser zoom, or unmounting cancels queued frames.
stage.dispatchEvent(wheel());clock.step();stage.dispatchEvent(new Event('pointerdown'));const dragPose=pose;clock.finish();assert.equal(pose,dragPose);
stage.dispatchEvent(wheel());motion.cancel();pose=initialPose;clock.finish();assert.equal(pose,initialPose);
stage.dispatchEvent(wheel());stage.dispatchEvent(wheel({ctrlKey:true}));assert.equal(clock.pending.size,0);
clock.reduced=true;pose=initial;stage.dispatchEvent(wheel());near(pose.zoom,expected.zoom);assert.equal(clock.pending.size,0);clock.reduced=false;
stage.dispatchEvent(wheel());motion.destroy();const stopped=pose;clock.finish();const removed=wheel();stage.dispatchEvent(removed);assert.equal(removed.defaultPrevented,false);assert.equal(pose,stopped);

// Motion speed depends on elapsed time, not a monitor's refresh rate.
function at160ms(frameMs:number){
 const stage=new Stage(),clock=new Frames();let pose=initial;
 const motion=bindWheelZoom(stage as any,size,viewport,()=>pose,(next:any)=>{pose=next;},()=>false,clock);
 stage.dispatchEvent(wheel());for(let elapsed=0;elapsed<160;elapsed+=frameMs)clock.step(frameMs);
 motion.destroy();return pose;
}
const sixty=at160ms(16),oneTwenty=at160ms(8);near(sixty.zoom,oneTwenty.zoom);near(sixty.pan.x,oneTwenty.pan.x);near(sixty.pan.y,oneTwenty.pan.y);
console.log('PASS: continuous frame-by-frame zoom, cursor anchoring throughout motion, burst accumulation, instant reversal, frame-rate independence, interruption/reset/cleanup, reduced motion, wheel units, zoom bounds, and normal page/browser scrolling.');
