// HSL lightness desaturation for the user's Multiply + Saturation -100 reference.
// No luminance weighting, white normalization, or automatic contrast stretch.
export function monochromePixels(source:Uint8ClampedArray) {
  const out=new Uint8ClampedArray(source.length);
  for(let i=0;i<source.length;i+=4){out[i]=out[i+1]=out[i+2]=(Math.max(source[i],source[i+1],source[i+2])+Math.min(source[i],source[i+1],source[i+2]))/2;out[i+3]=source[i+3];}
  return out;
}
export function tonePixels(source:Uint8ClampedArray,brightness:number,contrast:number){
  const out=new Uint8ClampedArray(source.length),gain=2**(brightness/35),slope=2**(contrast/50);
  const table=Array.from({length:256},(_,v)=>Math.max(0,Math.min(255,((v/255-.5)*slope+.5)*gain*255)));
  for(let i=0;i<source.length;i+=4){out[i]=out[i+1]=out[i+2]=table[source[i]];out[i+3]=source[i+3];}return out;
}
