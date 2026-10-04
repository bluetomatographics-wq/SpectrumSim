const linear = (v:number) => { v/=255; return v<=.04045?v/12.92:((v+.055)/1.055)**2.4; };
const encode = (v:number) => 255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055);
const decode = Array.from({length:256},(_,v)=>linear(v));
export function monochromePixels(source:Uint8ClampedArray) {
  const out=new Uint8ClampedArray(source.length);
  for(let i=0;i<source.length;i+=4){out[i]=out[i+1]=out[i+2]=encode(.2126*decode[source[i]]+.7152*decode[source[i+1]]+.0722*decode[source[i+2]]);out[i+3]=source[i+3];}
  return out;
}
export function tonePixels(source:Uint8ClampedArray,brightness:number,contrast:number){
  const out=new Uint8ClampedArray(source.length),gain=2**(brightness/35),slope=2**(contrast/50);
  const table=Array.from({length:256},(_,v)=>Math.max(0,Math.min(255,((v/255-.5)*slope+.5)*gain*255)));
  for(let i=0;i<source.length;i+=4){out[i]=out[i+1]=out[i+2]=table[source[i]];out[i+3]=source[i+3];}return out;
}
