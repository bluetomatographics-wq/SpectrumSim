import assert from 'node:assert/strict';
import { defaultModel, modelSettings, validModel, transmission, thermalRadiance, srgbToLinear, linearToSrgb, materialMap } from '../lib/models.ts';
import { transformPixels, transformClassic } from '../lib/spectrum.ts';
import { parseFavorites, createEffect } from '../lib/creative.ts';
const slab=new Uint8ClampedArray([0,0,0,255,255,255,255,255,80,160,40,128]);
const size={width:3,height:1};
const gray={...defaultModel,palette:'gray' as const,material:'water' as const,texture:0};
// Reference value and physical monotonicity, independent of renderer implementation.
assert.ok(Math.abs(transmission('water',10,80)-Math.exp(-.1837))<1e-12);
assert.equal(transmission('iron',0,60),1);
assert.ok(transmission('iron',10,60)<transmission('water',10,60));
assert.ok(transmission('water',20,80)<transmission('water',10,80));
assert.ok(transmission('iron',10,100)>transmission('iron',10,60));
assert.ok(thermalRadiance(40)>thermalRadiance(20));
for(const v of [0,.02,.18,.5,1])assert.ok(Math.abs(linearToSrgb(srgbToLinear(v))-v)<1e-8);
assert.ok(Math.abs(srgbToLinear(.5)-.21404114)<1e-7);
const xray=transformPixels(slab,'xray',size,100,gray);
assert.deepEqual(xray.slice(0,3),xray.slice(4,7),'Uniform physical slab must ignore visible brightness');
assert.ok(transformPixels(slab,'xray',size,100,{...gray,thickness:30})[0]>xray[0],'Dense-white display brightens with thickness');
assert.ok(transformPixels(slab,'xray',size,100,{...gray,thickness:0})[0]===0);
const thermal=transformPixels(slab,'thermal',size,100,{...gray,material:'skin',subjectTemperature:20});
assert.ok(transformPixels(slab,'thermal',size,100,{...gray,material:'skin',subjectTemperature:34})[0]>thermal[0]);
const green=new Uint8ClampedArray([60,150,40,255]);
assert.ok(transformPixels(green,'nir',{width:1,height:1},100,{...gray,material:'vegetation'})[0]>transformPixels(green,'nir',{width:1,height:1},100,{...gray,material:'fabric'})[0],'Same visible color has different assumed material response');
const redBlue=new Uint8ClampedArray([255,0,0,255,0,0,255,255]);
const red=transformPixels(redBlue,'red',{width:2,height:1},100,gray),blue=transformPixels(redBlue,'blue',{width:2,height:1},100,gray);
assert.ok(red[0]>red[4]);assert.ok(blue[4]>blue[0]);
assert.notDeepEqual(transformPixels(redBlue,'green',{width:2,height:1},100,{...gray,bandwidth:5}),transformPixels(redBlue,'green',{width:2,height:1},100,{...gray,bandwidth:120}));
const a=new Uint8ClampedArray(64*64*4).fill(255),b=a.slice();for(let i=0;i<b.length;i+=4){b[i]=0;b[i+1]=0;b[i+2]=0;}
for(const band of ['radio','gamma']){
 const args={...defaultModel,noise:0};const full=transformPixels(a,band,{width:64,height:64},100,args);
 assert.deepEqual(full,transformPixels(b,band,{width:64,height:64},100,args),'Source field must be independent of optical brightness');
 assert.notDeepEqual(full,transformPixels(a,band,{width:64,height:64},100,{...args,sourceX:10}));
 assert.deepEqual(full,transformPixels(a,band,{width:64,height:64},100,args));
}
const settings=modelSettings({material:'air',regions:[{x:.5,y:.5,radius:.2,material:'metal'}]});
const map=materialMap(a,64,64,settings);assert.equal(map[32*64+32],6);assert.equal(map[0],8);
const double=materialMap(new Uint8ClampedArray(128*128*4).fill(255),128,128,settings);assert.equal(double[64*128+64],6);assert.equal(double[0],8);
const over=modelSettings({...settings,regions:[...settings.regions,{x:.5,y:.5,radius:.1,material:'water'}]});assert.equal(materialMap(a,64,64,over)[32*64+32],2,'Latest region wins');
for(const invalid of [{thickness:NaN},{energy:20},{regions:[{x:2,y:.5,radius:.1,material:'metal'}]},{palette:'bogus'},[]])assert.equal(validModel(invalid),false);
const favorite={id:'model',name:'Water slab',bandId:'xray',opacity:100,effects:{strength:100,mixBand:null,mixAmount:50,model:gray},compare:true,split:50,speed:1};
assert.deepEqual(parseFavorites(JSON.stringify([favorite])),[favorite]);
assert.deepEqual(parseFavorites(JSON.stringify([{...favorite,effects:{...favorite.effects,model:{energy:1}}}])),[]);
const legacy={...favorite,effects:{strength:100,mixBand:null,mixAmount:50}};
const restored=parseFavorites(JSON.stringify([legacy]))[0];assert.equal(restored.effects.model?.engine,'classic');assert.deepEqual(createEffect(slab,'xray',size,restored.effects),transformClassic(slab,'xray',size));
console.log('PASS: NIST slab reference, attenuation and temperature monotonicity, linear-light round trips, material overrides, spectral selectivity, source independence, normalized regions, model validation, and classic-favorite migration.');
