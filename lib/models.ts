// Educational forward models. Material guesses and scene parameters are assumptions,
// never recovered measurements. Equations/data provenance: RENDERING-NOTES.md.
export const materialIds = ['generic','vegetation','water','skin','fabric','wood','metal','glass','air'] as const;
export type Material = typeof materialIds[number];
export const materialNames: Record<Material,string> = {generic:'Plastic / general surface',vegetation:'Vegetation',water:'Water',skin:'Exposed skin',fabric:'Fabric / fur',wood:'Wood / soil',metal:'Iron / metal',glass:'Glass',air:'Air / sky'};
export type Region = {x:number;y:number;radius:number;material:Material};
export const palettes = ['native','gray','iron','viridis','ice'] as const;
export type ModelSettings = {
 engine:'informed'|'classic'; palette:typeof palettes[number]; scene:'outdoor'|'urban'|'portrait'|'wildlife'|'indoor';
 material:'auto'|Material; regions:Region[]; showMaterials:boolean;
 bandwidth:number; wavelengthShift:number; nirWavelength:number; uvMode:'reflected'|'fluorescence';
 ambient:number; subjectTemperature:number; lighting:'sun'|'shade'|'night';
 thickness:number; energy:60|80|100; texture:number; polarity:'dense-white'|'transmission';
 roughness:number; moisture:number; angle:number; speckle:number;
 sourceX:number;sourceY:number;sourcePower:number;spread:number;exposure:number;noise:number;
};
export const defaultModel:ModelSettings={engine:'informed',palette:'native',scene:'outdoor',material:'auto',regions:[],showMaterials:false,bandwidth:30,wavelengthShift:0,nirWavelength:850,uvMode:'reflected',ambient:20,subjectTemperature:34,lighting:'sun',thickness:15,energy:80,texture:25,polarity:'dense-white',roughness:50,moisture:35,angle:40,speckle:25,sourceX:50,sourceY:50,sourcePower:65,spread:22,exposure:50,noise:20};
const numericBounds:Record<string,[number,number]>={bandwidth:[5,120],wavelengthShift:[-25,25],nirWavelength:[720,1000],ambient:[-10,45],subjectTemperature:[0,80],thickness:[0,100],texture:[0,100],roughness:[0,100],moisture:[0,100],angle:[10,80],speckle:[0,100],sourceX:[0,100],sourceY:[0,100],sourcePower:[0,100],spread:[3,60],exposure:[1,100],noise:[0,100]};
const choices:Record<string,readonly unknown[]>={engine:['informed','classic'],palette:palettes,scene:['outdoor','urban','portrait','wildlife','indoor'],material:['auto',...materialIds],uvMode:['reflected','fluorescence'],lighting:['sun','shade','night'],polarity:['dense-white','transmission'],energy:[60,80,100]};
export function validModel(value:unknown):boolean {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const m=value as Record<string,unknown>;
 return Object.entries(m).every(([k,v])=>{
  if(numericBounds[k])return typeof v==='number'&&Number.isFinite(v)&&v>=numericBounds[k][0]&&v<=numericBounds[k][1];
  if(choices[k])return choices[k].includes(v);
  if(k==='showMaterials')return typeof v==='boolean';
  if(k==='regions')return Array.isArray(v)&&v.length<=48&&v.every(r=>r&&typeof r==='object'&&materialIds.includes(r.material)&&[r.x,r.y,r.radius].every(Number.isFinite)&&r.x>=0&&r.x<=1&&r.y>=0&&r.y<=1&&r.radius>=.01&&r.radius<=.5);
  return false;
 });
}
export function modelSettings(value?:Partial<ModelSettings>):ModelSettings {return validModel(value)?{...defaultModel,...value,regions:value?.regions??[]}: {...defaultModel,regions:[]};}
export const visibleCenters:Record<string,number>={red:660,orange:605,yellow:580,green:535,cyan:490,blue:465,violet:425};
export const isVisible=(id:string)=>id in visibleCenters;
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const srgbToLinear=(v:number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
export const linearToSrgb=(v:number)=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;
const linear=Float32Array.from({length:256},(_,i)=>srgbToLinear(i/255));
const gaussian=(x:number,center:number,width:number)=>Math.exp(-.5*((x-center)/width)**2);
// Asymmetric Gaussian fits to CIE 1931 (Wyman, Sloan & Shirley, JCGT 2013).
function observer(w:number){
 const g=(c:number,l:number,r:number)=>Math.exp(-.5*((w-c)*(w<c?l:r))**2);
 return [.362*g(442,.0624,.0374)+1.056*g(599.8,.0264,.0323)-.065*g(501.1,.049,.0382),.821*g(568.8,.0213,.0247)+.286*g(530.9,.0613,.0322),1.217*g(437,.0845,.0278)+.681*g(459,.0385,.0725)];
}
const xyzRGB=(x:number,y:number,z:number)=>[3.2406*x-1.5372*y-.4986*z,-.9689*x+1.8758*y+.0415*z,.0557*x-.204*y+1.057*z];
const filterCache=new Map<string,number[][]>();
export function visibleMatrix(center:number,bandwidth:number){
 const key=center+':'+bandwidth;if(filterCache.has(key))return filterCache.get(key)!;
 const sums=Array.from({length:3},()=>[0,0,0]);
 // Smooth RGB basis is an explicit spectral prior, not a camera calibration.
 for(let w=380;w<=780;w+=5){
  const basis=[gaussian(w,610,55),gaussian(w,540,42),gaussian(w,450,38)];const total=basis.reduce((a,b)=>a+b,0);
  const xyz=observer(w),pass=gaussian(w,center,bandwidth/2.355);
  for(let c=0;c<3;c++)for(let j=0;j<3;j++)sums[c][j]+=basis[c]/total*xyz[j]*pass;
 }
 const rgb=sums.map(v=>xyzRGB(v[0],v[1],v[2]));
 const white=[0,1,2].map(j=>rgb.reduce((a,v)=>a+v[j],0)),scale=Math.max(...white,1e-6);
 const result=rgb.map(v=>v.map(n=>n/scale));
 if(filterCache.size>128)filterCache.clear();filterCache.set(key,result);return result;
}
// NIST mass attenuation coefficients (cm²/g) at 60, 80, 100 keV.
const attenuation={water:{density:1,mu:[.2059,.1837,.1707]},plastic:{density:.93,mu:[.1970,.1823,.1719]},iron:{density:7.874,mu:[1.205,.5952,.3717]}};
export function transmission(kind:keyof typeof attenuation,thicknessMm:number,energy:60|80|100){const a=attenuation[kind];return Math.exp(-a.mu[[60,80,100].indexOf(energy)]*a.density*thicknessMm/10);}
// Relative 8–14 µm Planck-band radiance; constants cancel in display normalization.
export function thermalRadiance(celsius:number){let sum=0;for(let um=8;um<=14;um++)sum+=1/(um**5*Math.expm1(14387.76877/(um*(celsius+273.15))));return sum;}
type Properties={nir:number;uv:number;fluor:number;emissivity:number;heat:number;radar:number;density:number;kind:keyof typeof attenuation};
// Qualitative educational priors, not a measured reflectance library.
const properties:Properties[]=[
 {nir:.35,uv:.25,fluor:.08,emissivity:.94,heat:6,radar:.35,density:1,kind:'plastic'},
 {nir:.82,uv:.07,fluor:.18,emissivity:.97,heat:2,radar:.7,density:.3,kind:'water'},
 {nir:.035,uv:.04,fluor:.01,emissivity:.98,heat:-3,radar:.08,density:1,kind:'water'},
 {nir:.5,uv:.13,fluor:.05,emissivity:.98,heat:0,radar:.5,density:1,kind:'water'},
 {nir:.48,uv:.3,fluor:.7,emissivity:.96,heat:4,radar:.28,density:.2,kind:'plastic'},
 {nir:.42,uv:.18,fluor:.12,emissivity:.93,heat:8,radar:.5,density:.6,kind:'plastic'},
 {nir:.62,uv:.5,fluor:0,emissivity:.12,heat:10,radar:1,density:1,kind:'iron'},
 {nir:.22,uv:.1,fluor:.05,emissivity:.9,heat:3,radar:.35,density:1.8,kind:'plastic'},
 {nir:.02,uv:.18,fluor:0,emissivity:1,heat:-15,radar:.005,density:0,kind:'water'}
];
export const materialColors=['#89909a','#abd56c','#3998c6','#e5ac8f','#be9edf','#a68458','#d7e0e6','#74c9be','#566887'];
type Prepared={luma:Float32Array;detail:Float32Array;hints:Uint8Array;confidence:Float32Array};
const preparedCache=new WeakMap<Uint8ClampedArray,Map<string,Prepared>>();
function prepare(source:Uint8ClampedArray,width:number,height:number,scene:ModelSettings['scene']):Prepared{
 const key=width+':'+height+':'+scene;const cached=preparedCache.get(source)?.get(key);if(cached)return cached;
 const n=source.length/4,luma=new Float32Array(n),detail=new Float32Array(n),hints=new Uint8Array(n),confidence=new Float32Array(n);
 const smooth=(v:number)=>{const t=clamp01(v);return t*t*(3-2*t);};
 for(let p=0;p<n;p++){
  const i=p*4;if(source[i+3]===0){hints[p]=8;continue;}
  const r=source[i]/255,g=source[i+1]/255,b=source[i+2]/255,y=(Math.floor(p/width)+.5)/height;
  luma[p]=.2126*linear[source[i]]+.7152*linear[source[i+1]]+.0722*linear[source[i+2]];
  // Soft color memberships blend with a general surface instead of making
  // abrupt material boundaries. This is deliberately conservative, not segmentation.
  const green=smooth((g-Math.max(r,b)-.015)/.16)*smooth(g/.18);
  const blue=smooth((b-r-.04)/.2)*smooth((b-g-.01)/.16);
  const warm=smooth((r-b-.035)/.2)*smooth((g-b)/.12);
  const sky=blue*smooth((.5-y)/.2)*smooth((b-.18)/.25);
  const water=blue*smooth((y-.5)/.25)*.65;
  const scores=[0,scene==='indoor'?0:green,scene==='indoor'?0:water,scene==='portrait'?warm:0,scene==='wildlife'?warm:0,scene==='portrait'||scene==='wildlife'?0:warm*.6,0,scene==='urban'?smooth((.1-Math.max(r,g,b)+Math.min(r,g,b))/.1)*smooth((r-.65)/.25)*.5:0,scene==='indoor'?0:sky];
  let id=0;for(let j=1;j<scores.length;j++)if(scores[j]>scores[id])id=j;
  hints[p]=id;confidence[p]=scores[id];
 }
 for(let p=0;p<n;p++){
  const x=p%width,y=Math.floor(p/width);let sum=0,count=0;
  for(const q of [y*width+Math.max(0,x-1),y*width+Math.min(width-1,x+1),Math.max(0,y-1)*width+x,Math.min(height-1,y+1)*width+x])if(source[q*4+3]){sum+=luma[q];count++;}
  detail[p]=Math.min(1,Math.abs(luma[p]-(count?sum/count:luma[p]))*8);
 }
 const result={luma,detail,hints,confidence};let entries=preparedCache.get(source);if(!entries){entries=new Map();preparedCache.set(source,entries);}if(entries.size>=2)entries.clear();entries.set(key,result);return result;
}
export function materialMap(source:Uint8ClampedArray,width:number,height:number,settings:ModelSettings,confidence?:Float32Array){
 const map=settings.material==='auto'?prepare(source,width,height,settings.scene).hints.slice():new Uint8Array(source.length/4).fill(materialIds.indexOf(settings.material));
 for(const region of settings.regions){
  const cx=region.x*width,cy=region.y*height,r=region.radius*Math.min(width,height),id=materialIds.indexOf(region.material);
  for(let y=Math.max(0,Math.ceil(cy-r-.5));y<Math.min(height,Math.ceil(cy+r-.5));y++){
   const dx=Math.sqrt(Math.max(0,r*r-(y+.5-cy)**2));
   const left=Math.max(0,Math.ceil(cx-dx-.5)),right=Math.min(width,Math.floor(cx+dx-.5)+1);if(right>left){map.fill(id,y*width+left,y*width+right);confidence?.fill(1,y*width+left,y*width+right);}
  }
 }
 return map;
}
const paletteStops:Record<string,number[][]>={gray:[[0,0,0],[255,255,255]],iron:[[8,8,28],[61,16,93],[147,35,103],[231,91,53],[255,186,69],[255,252,218]],viridis:[[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]],ice:[[8,16,32],[26,79,114],[78,183,203],[235,253,246]],radio:[[8,17,37],[20,93,138],[40,191,181],[217,235,140]],uv:[[8,5,22],[69,26,126],[164,103,211],[239,221,255]],gamma:[[9,8,23],[67,19,89],[166,49,121],[246,139,85],[255,246,200]]};
function paletteColor(value:number,name:string){const stops=paletteStops[name]||paletteStops.gray,t=clamp01(value)*(stops.length-1),j=Math.min(stops.length-2,Math.floor(t)),f=t-j;return stops[j].map((v,c)=>v*(1-f)+stops[j+1][c]*f);}
function noiseAt(x:number,y:number,salt=0){let h=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^salt;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
export function renderModel(source:Uint8ClampedArray,band:string,width:number,height:number,strength:number,settings?:Partial<ModelSettings>):Uint8ClampedArray<ArrayBuffer>{
 const m=modelSettings(settings),n=source.length/4,out=new Uint8ClampedArray(source.length);if(!n)return out;
 const visible=isVisible(band),usesMaterials=!visible&&band!=='radio'&&band!=='gamma',data=usesMaterials?prepare(source,width,height,m.scene):null;
 const confidence=data&&m.material==='auto'?data.confidence.slice():null;
 const map=(usesMaterials||m.showMaterials)?materialMap(source,width,height,m,confidence??undefined):null;
 const matrix=visible?visibleMatrix(Math.max(400,Math.min(700,visibleCenters[band]+m.wavelengthShift)),m.bandwidth):null;
 const power=Math.max(.25,Math.min(2,Number.isFinite(strength)?strength/100:1));
 const palette=m.palette==='native'?band==='thermal'?'iron':band==='uv'?'uv':band==='gamma'?'gamma':band==='radio'?'radio':'gray':m.palette;
 const lookup=Array.from({length:1024},(_,i)=>paletteColor(i/1023,palette));
 const ambientRad=thermalRadiance(m.ambient),lowRad=thermalRadiance(m.ambient-15),highRad=thermalRadiance(Math.max(m.ambient+25,m.subjectTemperature+10));
 const tempSignal=properties.map((p,j)=>{
  const t=j===3?m.subjectTemperature:j===4&&m.scene==='wildlife'?m.subjectTemperature-5:m.ambient+p.heat*(m.lighting==='sun'?1:m.lighting==='night'?.15:.35);
  return (p.emissivity*thermalRadiance(t)+(1-p.emissivity)*ambientRad-lowRad)/(highRad-lowRad);
 });
 const minSize=Math.min(width,height),sourceX=m.sourceX/100*width,sourceY=m.sourceY/100*height;
 const attenuationPerMm=properties.map(p=>-Math.log(transmission(p.kind,p.density,m.energy)));
 for(let p=0;p<n;p++){
  const i=p*4;out[i+3]=source[i+3];if(!source[i+3])continue;
  const x=p%width,y=Math.floor(p/width),r=linear[source[i]],g=linear[source[i+1]],b=linear[source[i+2]],id=map?.[p]??0,prop=properties[id];
  const weight=confidence?.[p]??1;
  const mix=(general:number,specific:number)=>general+(specific-general)*weight;
  let signal=0,color:number[]|undefined;
  if(m.showMaterials){const hex=materialColors[id];out[i]=parseInt(hex.slice(1,3),16);out[i+1]=parseInt(hex.slice(3,5),16);out[i+2]=parseInt(hex.slice(5),16);continue;}
  if(matrix){
   const raw=[0,1,2].map(c=>Math.max(0,r*matrix[0][c]+g*matrix[1][c]+b*matrix[2][c]));signal=Math.max(...raw);
   if(m.palette==='native')color=raw.map(v=>255*linearToSrgb(clamp01(v*power)));
  }else if(band==='nir'){
   const response=mix(properties[0].nir,prop.nir*(id===2?1-.65*(m.nirWavelength-720)/280:1+.1*(m.nirWavelength-850)/150));
   signal=clamp01(response*(.2+.8*Math.sqrt(data!.luma[p]))+data!.detail[p]*.045);
   signal=linearToSrgb(signal);
   if(m.palette==='native')color=[255*clamp01(signal*1.13),255*clamp01(signal*.78+r*.08),255*clamp01(signal*.88+b*.1)];
  }else if(band==='thermal')signal=mix(tempSignal[0],tempSignal[id])+data!.detail[p]*.06;
  else if(band==='uv'){
   signal=m.uvMode==='reflected'?mix(properties[0].uv,prop.uv)*(.25+.75*Math.sqrt(data!.luma[p])):mix(properties[0].fluor,prop.fluor)*(.25+.75*Math.sqrt(data!.luma[p]));
   if(m.uvMode==='fluorescence'&&m.palette==='native')color=id===1?[signal*mix(90,255),signal*mix(210,25),signal*mix(255,80)]:[signal*90,signal*210,signal*255];
  }else if(band==='xray'){
   const thickness=m.thickness*(1+m.texture/100*data!.detail[p]*3);
   const t=Math.exp(-mix(attenuationPerMm[0],attenuationPerMm[id])*thickness);signal=m.polarity==='dense-white'?1-t:t;
  }else if(band==='microwave'){
   const angle=m.angle*Math.PI/180,rough=m.roughness/100;
   const backscatter=mix(properties[0].radar,prop.radar)*(.06+rough*.7+data!.detail[p]*.65)*Math.cos(angle)**1.3*(.5+m.moisture/100);
   const grain=-Math.log(Math.max(.0001,noiseAt(Math.floor(x/width*480),Math.floor(y/height*480),19)));
   signal=1-Math.exp(-backscatter*3*(1-m.speckle/100+m.speckle/100*grain));
  }else{
   const d2=((x+.5-sourceX)**2+(y+.5-sourceY)**2)/(minSize*minSize),spread=m.spread/100;
   const shape=band==='radio'?1/(1+d2/(spread*spread)):Math.exp(-d2/(2*spread*spread));
   signal=shape*m.sourcePower/100;
   if(band==='radio')signal=Math.log1p(signal*15)/Math.log(16);
   else {const photons=m.exposure*4,seedX=Math.floor(x/width*480),seedY=Math.floor(y/height*480);const z=Math.sqrt(-2*Math.log(Math.max(.0001,noiseAt(seedX,seedY,31))))*Math.cos(2*Math.PI*noiseAt(seedX,seedY,73));signal=clamp01(signal+z*Math.sqrt(Math.max(signal,.005)/photons)*m.noise/100);}
  }
  if(!color){signal=clamp01(signal*power);color=lookup[Math.round(signal*1023)];}
  else if(!visible&&power!==1)color=color.map(v=>Math.max(0,Math.min(255,v*power)));
  out[i]=color[0];out[i+1]=color[1];out[i+2]=color[2];
 }
 return out;
}
