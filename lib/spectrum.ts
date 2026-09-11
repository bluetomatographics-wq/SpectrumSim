import { renderModel, type ModelSettings } from './models';

export const bandGroups = ['Radio & microwave','Infrared','Visible','Ultraviolet','X-ray & gamma'] as const;
export type Band = {id:string;name:string;short:string;range:string;color:string;description:string;group:typeof bandGroups[number]};
export const bands: Band[] = [
{id:'radio',name:'Radio waves',short:'Radio',range:'Longer than 1 m',color:'#8ccce4',group:'Radio & microwave',description:"An assumed radio source produces a smooth intensity field. Move the source and adjust its reach. Your photo provides context; no transmitter or emission is detected."},
{id:'microwave',name:'Microwaves',short:'Microwave',range:'1 mm–1 m',color:'#8cddbb',group:'Radio & microwave',description:"An illustrative radar return uses assigned material, roughness, moisture, viewing angle, and speckle. Surface texture guides detail; geometry and radar returns are not recovered."},
{id:'thermal',name:'Thermal infrared',short:'Thermal IR',range:'8–14 µm',color:'#e4a279',group:'Infrared',description:"Assigned materials and assumed temperatures feed an 8–14 µm thermal-radiance model. Emissivity and reflected surroundings affect the result. These are scenario settings, not measured temperatures."},
{id:'nir',name:'Near infrared',short:'Near IR',range:'700–1,100 nm',color:'#e49baf',group:'Infrared',description:"A material-based NIR interpretation: vegetation is typically reflective, water less so. Color hints are editable guesses. Material identity and infrared reflectance cannot be established from RGB alone."},
{id:'red',name:'Red light',short:'Red',range:'620–700 nm',color:'#ef8379',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'orange',name:'Orange light',short:'Orange',range:'590–620 nm',color:'#eba55e',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'yellow',name:'Yellow light',short:'Yellow',range:'570–590 nm',color:'#e9d985',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'green',name:'Green light',short:'Green',range:'495–570 nm',color:'#b5d790',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'cyan',name:'Cyan light',short:'Cyan',range:'485–495 nm',color:'#8cd5ce',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'blue',name:'Blue light',short:'Blue',range:'450–485 nm',color:'#8eaff1',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'violet',name:'Violet light',short:'Violet',range:'400–450 nm',color:'#b29fe8',group:'Visible',description:"A smooth spectrum estimated from linear RGB is passed through a wavelength filter. Adjust its center and bandwidth. The original spectrum is ambiguous; this is an approximation."},
{id:'uv',name:'Ultraviolet',short:'UV',range:'Near-UV illustration · 320–400 nm',color:'#d498e7',group:'Ultraviolet',description:"Explore reflected near-UV or visible fluorescence under UV illumination. Each uses different assumed material responses. Hidden patterns are not recovered from the photo."},
{id:'xray',name:'X-rays',short:'X-ray',range:'0.01–10 nm',color:'#b9d9ee',group:'X-ray & gamma',description:"A transmission model uses assigned materials, assumed thickness, and photon energy. Water, polyethylene, and iron reference coefficients guide attenuation. It cannot reveal anatomy or hidden structures."},
{id:'gamma',name:'Gamma rays',short:'Gamma',range:'Shorter than 0.01 nm',color:'#f1a9d2',group:'X-ray & gamma',description:"A user-positioned source creates an illustrative photon-intensity map. Exposure controls the simulated counting noise. Bright photo pixels are not treated as gamma emissions."}
];
export const clamp = (value:number) => Math.max(0, Math.min(255, value));
const thermalPalette = [[8,8,28],[47,17,83],[108,29,117],[185,54,98],[237,108,54],[252,181,66],[252,247,172]];
function blur(values:Float32Array,width:number,height:number,radius:number) {
 const horizontal=new Float32Array(values.length), result=new Float32Array(values.length);
 const window=radius*2+1;
 for(let y=0;y<height;y++) {
  const row=y*width;let sum=0;
  for(let k=-radius;k<=radius;k++)sum+=values[row+Math.max(0,Math.min(width-1,k))];
  for(let x=0;x<width;x++){horizontal[row+x]=sum/window;sum+=values[row+Math.min(width-1,x+radius+1)]-values[row+Math.max(0,x-radius)];}
 }
 for(let x=0;x<width;x++) {
  let sum=0;for(let k=-radius;k<=radius;k++)sum+=horizontal[Math.max(0,Math.min(height-1,k))*width+x];
  for(let y=0;y<height;y++){result[y*width+x]=sum/window;sum+=horizontal[Math.min(height-1,y+radius+1)*width+x]-horizontal[Math.max(0,y-radius)*width+x];}
 }
 return result;
}
export function transformClassic(source:Uint8ClampedArray,bandId:string,dimensions?:{width:number;height:number},strength=100):Uint8ClampedArray<ArrayBuffer> {
 if(source.length%4)throw new Error('Invalid RGBA pixel data');
 const width=dimensions?.width??source.length/4, height=dimensions?.height??1;
 if(dimensions&&(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height*4!==source.length))throw new Error('Image dimensions do not match the pixels');
 const output = new Uint8ClampedArray(source.length);
 if (bandId==='original') { output.set(source); return output; }
 const power=Math.max(.25,Math.min(2,Number.isFinite(strength)?strength/100:1));
 const weights:Record<string,number[]>={red:[1,0,0],orange:[.8,.2,0],yellow:[.5,.5,0],green:[0,1,0],cyan:[0,.45,.55],blue:[0,0,1],violet:[.13,0,.87]};
 const tint:Record<string,number[]>={red:[1,.09,.06],orange:[1,.47,.05],yellow:[1,.9,.07],green:[.21,1,.17],cyan:[.09,.9,1],blue:[.13,.28,1],violet:[.53,.13,1]};
 if (!bands.some(b=>b.id===bandId)) throw new Error('Unknown spectrum band');
 let luminance:Float32Array|undefined,radioBrightness:Float32Array|undefined;
 if(bandId==='radio'||bandId==='microwave') {
  luminance=new Float32Array(source.length/4);
  for(let p=0;p<luminance.length;p++){const i=p*4;luminance[p]=(.2126*source[i]+.7152*source[i+1]+.0722*source[i+2])*source[i+3]/255;}
  if(bandId==='radio'&&source.length) {
   const alpha=new Float32Array(luminance.length);for(let p=0;p<alpha.length;p++)alpha[p]=source[p*4+3]/255;
   const radius=Math.max(1,Math.round(Math.min(width,height)/45*power));
   radioBrightness=blur(luminance,width,height,radius);
   const smoothedAlpha=blur(alpha,width,height,radius);
   for(let p=0;p<alpha.length;p++)radioBrightness[p]=smoothedAlpha[p]>1e-6?radioBrightness[p]/smoothedAlpha[p]:0;
  }
 }
 for(let i=0;i<source.length;i+=4) {
  const r=source[i], g=source[i+1], b=source[i+2];
  let rr:number,gg:number,bb:number;
  if(bandId==='radio') {
   const value=clamp(radioBrightness![i/4])/255, level=Math.round(value*9)/9;
   const contour=Math.abs(value*9-Math.round(value*9))<.08?22:0;
   rr=15+190*Math.pow(level,2)+contour;gg=28+208*level+contour;bb=70+150*Math.sin(level*Math.PI*.85)+contour;
  } else if(bandId==='microwave') {
   const p=i/4,x=p%width,y=Math.floor(p/width);
   const at=(dx:number,dy:number)=>luminance![Math.max(0,Math.min(height-1,y+dy))*width+Math.max(0,Math.min(width-1,x+dx))];
   const gx=-at(-1,-1)-2*at(-1,0)-at(-1,1)+at(1,-1)+2*at(1,0)+at(1,1);
   const gy=-at(-1,-1)-2*at(0,-1)-at(1,-1)+at(-1,1)+2*at(0,1)+at(1,1);
   const texture=clamp(Math.hypot(gx,gy)*.6*power), v=clamp(luminance![p]*.45+texture*.85);
   rr=v*.38;gg=v;bb=v*.78+texture*.15;
  } else if(bandId==='xray') {
   const v=255*Math.pow(1-(.2126*r+.7152*g+.0722*b)/255,1.3);
   rr=v*.88;gg=v*.96;bb=v;
  } else if(bandId==='gamma') {
   const v=Math.pow((.2126*r+.7152*g+.0722*b)/255,2.2);
   rr=clamp(v*590);gg=clamp(Math.max(0,v-.38)*410);bb=clamp(28+v*480-Math.max(0,v-.35)*660);
  } else if(bandId==='thermal') {
   const t=Math.pow((.2126*r+.7152*g+.0722*b)/255,.85)*(thermalPalette.length-1);
   const j=Math.min(thermalPalette.length-2,Math.floor(t)), f=t-j;
   rr=thermalPalette[j][0]*(1-f)+thermalPalette[j+1][0]*f;
   gg=thermalPalette[j][1]*(1-f)+thermalPalette[j+1][1]*f;
   bb=thermalPalette[j][2]*(1-f)+thermalPalette[j+1][2]*f;
  } else if(bandId==='nir') {
   const vegetation=Math.max(0,g-(r+b)*.5), sky=Math.max(0,b-(r+g)*.5);
   const proxy=clamp(.23*r+.63*g+.14*b+vegetation*2.8);
   rr=proxy*1.22+vegetation*.7-sky*.7;gg=proxy*.62+sky*.23;bb=proxy*.85+sky*.65+vegetation*.55;
  } else if(bandId==='uv') {
   const v=Math.pow(clamp(b*.85+r*.15)/255,1.12)*255;
   rr=v*.74;gg=v*.24;bb=clamp(v*1.45);
  } else {
   const w=weights[bandId], c=tint[bandId], intensity=Math.pow((r*w[0]+g*w[1]+b*w[2])/255,.85)*255;
   rr=intensity*c[0];gg=intensity*c[1];bb=intensity*c[2];
  }
  if(bandId!=='radio'&&bandId!=='microwave'&&power!==1){rr=128+(rr-128)*power;gg=128+(gg-128)*power;bb=128+(bb-128)*power;}
  output[i]=clamp(rr);output[i+1]=clamp(gg);output[i+2]=clamp(bb);output[i+3]=source[i+3];
 }
 return output;
}
export function transformPixels(source:Uint8ClampedArray,bandId:string,dimensions?:{width:number;height:number},strength=100,model?:Partial<ModelSettings>):Uint8ClampedArray<ArrayBuffer> {
 if(source.length%4)throw new Error('Invalid RGBA pixel data');
 const width=dimensions?.width??source.length/4,height=dimensions?.height??1;
 if(dimensions&&(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height*4!==source.length))throw new Error('Image dimensions do not match the pixels');
 if(bandId==='original')return source.slice();
 if(!bands.some(b=>b.id===bandId))throw new Error('Unknown spectrum band');
 if(model?.engine==='classic')return transformClassic(source,bandId,dimensions,strength);
 return renderModel(source,bandId,width,height,strength,model);
}
export function fitDimensions(width:number,height:number,maxDimension=1600) {
 const ratio=Math.min(1,maxDimension/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};
}
export function validateUpload(file:{type:string;size:number}) {
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)) return 'Choose a JPG, PNG, or WebP image.';
 if(file.size>20*1024*1024) return 'This image is over 20 MB. Please choose a smaller file.';
 if(file.size===0) return 'This file is empty. Please choose another image.';
 return null;
}
