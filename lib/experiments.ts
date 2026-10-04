import { thermalRadiance, clamp01 } from './models';

// Fixed 0–80 °C blackbody radiance reference. Changing inputs never rescales it.
export function thermalSignal(temperature:number,emissivity:number,ambient=20) {
 const lo=thermalRadiance(0),hi=thermalRadiance(80);
 const radiance=emissivity*thermalRadiance(temperature)+(1-emissivity)*thermalRadiance(ambient);
 return clamp01((radiance-lo)/(hi-lo));
}
export function seededRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return (state+.5)/4294967296;};}
// Exact Poisson sampling at our bounded classroom count rates; deterministic seed.
export function poisson(lambda:number,random:()=>number){if(lambda<=0)return 0;const limit=Math.exp(-lambda);let n=0,product=1;do{n++;product*=random();}while(product>limit);return n-1;}
export function detectorField(exposure:number,blur:number,seed:number,width=64,height=36){
 const random=seededRandom(seed),expected=new Float32Array(width*height),observed=new Float32Array(width*height);
 // A normalized 2-D Gaussian redistributes a fixed source flux as blur changes.
 const weights=Float64Array.from({length:width*height},(_,p)=>Math.exp(-.5*(((p%width+.5-width/2)/blur)**2+((Math.floor(p/width)+.5-height/2)/blur)**2)));
 const total=weights.reduce((a,b)=>a+b,0);
 for(let p=0;p<expected.length;p++){const rate=.25+weights[p]/total*250;expected[p]=rate;observed[p]=poisson(rate*exposure,random)/exposure;}
 return {expected,observed,width,height};
}
