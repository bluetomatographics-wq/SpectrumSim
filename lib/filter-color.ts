// RGB Multiply colors. These do not recover optical spectra.
export const filterColors:Record<string,readonly number[]>={
 red:[255,0,0],orange:[255,128,0],yellow:[255,255,0],
 green:[0,255,0],cyan:[0,255,255],blue:[0,0,255],violet:[128,0,255]
};
export function multiplyFilter(source:Uint8ClampedArray,band:string,strength=100){
 const color=filterColors[band];
 if(!color)throw new Error('Unknown RGB filter');
 const out=new Uint8ClampedArray(source.length);
 const gain=Math.max(.25,Math.min(2,strength/100));
 for(let i=0;i<source.length;i+=4){
  for(let c=0;c<3;c++)out[i+c]=source[i+c]*color[c]/255*gain;
  out[i+3]=source[i+3];
 }
 return out;
}
