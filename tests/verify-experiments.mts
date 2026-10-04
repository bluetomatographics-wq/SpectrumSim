import assert from 'node:assert/strict';
import {thermalSignal,detectorField,poisson,seededRandom} from '../lib/experiments.ts';
import {transmission} from '../lib/models.ts';
for(const e of [.05,.2,.95,1])assert.ok(Math.abs(thermalSignal(20,e)-thermalSignal(20,1))<1e-12,'Thermal equilibrium must be independent of emissivity');
assert.ok(thermalSignal(60,.95)>thermalSignal(60,.2),'Hotter than ambient: high emissivity raises signal');
assert.ok(thermalSignal(0,.95)<thermalSignal(0,.2),'Colder than ambient: reflection raises low-emissivity signal');
assert.equal(thermalSignal(0,1),0);assert.equal(thermalSignal(80,1),1);
for(const kind of ['plastic','water','iron'] as const){assert.equal(transmission(kind,0,80),1);assert.ok(transmission(kind,10,80)>transmission(kind,20,80));}
const random=seededRandom(123);const samples=Array.from({length:30000},()=>poisson(4,random));const mean=samples.reduce((a,b)=>a+b,0)/samples.length;const variance=samples.reduce((a,b)=>a+(b-mean)**2,0)/samples.length;
assert.ok(Math.abs(mean-4)<.08);assert.ok(Math.abs(variance-4)<.15,'Poisson count variance should match its mean');
const totals=[2,4,8].map(blur=>Array.from(detectorField(1,blur,42).expected).reduce((a,b)=>a+b,0));for(const total of totals)assert.ok(Math.abs(total-826)<.001,'Blur conserves integrated source plus background');
const mse=(exposure:number)=>{let sum=0;for(let seed=1;seed<=12;seed++){const d=detectorField(exposure,4,seed);for(let i=0;i<d.observed.length;i++)sum+=(d.observed[i]-d.expected[i])**2;}return sum;};
assert.ok(mse(20)<mse(1)/10,'Longer exposure lowers count-rate error');
assert.deepEqual(detectorField(4,4,42).observed,detectorField(4,4,42).observed);
assert.notDeepEqual(detectorField(4,4,42).observed,detectorField(4,4,43).observed);
console.log('PASS: fixed thermal scale, thermal equilibrium/reflection, slab behavior, Poisson statistics, flux conservation, exposure error and reproducible samples.');
