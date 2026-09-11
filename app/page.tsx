'use client';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { ArrowUpRight, Upload, Waves, Info, ChevronRight, ImageIcon, Grid2X2, ScanLine, Check, LoaderCircle, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { bands, bandGroups, fitDimensions, validateUpload } from '@/lib/spectrum';
import { blendPixels } from '@/lib/viewer';
import { SpectrumViewer } from '@/components/spectrum-viewer';
import { EffectControls, SweepControls, Favorites } from '@/components/creative-controls';
import { createEffect, defaultEffects, type EffectOptions, type Favorite } from '@/lib/creative';
import { SpectrumLogo } from '@/components/spectrum-logo';
import { ModelControls, type EditTool } from '@/components/model-controls';
import { ReferencePanel, type ReferenceImage } from '@/components/reference-panel';
import { modelSettings, type Material, type ModelSettings } from '@/lib/models';
import { SpectrumGuide } from '@/components/spectrum-guide';
import { creatorName, buildCredit, contactEmail } from '@/lib/site-seo';
type Photo={id:string;title:string;category:string;src:string;thumbnail?:string;alt:string;credit?:string;source?:string};
const photos:Photo[]=[
{id:'landscape',title:'Alpine valley',category:'Landscape',src:'/photos/landscape.jpg',alt:'Green alpine valley and mountain peaks under a blue sky',credit:'Thomas Jarrand',source:'https://unsplash.com/photos/9cY21AG4oDA'},
{id:'city',title:'City in the green',category:'Cityscape',src:'/photos/city.jpg',alt:'Modern city buildings beyond a vivid green park',credit:'Zulfugar Karimov',source:'https://unsplash.com/photos/6QP45DUayio'},
{id:'people',title:'Portrait in the leaves',category:'People',src:'/photos/people.jpg',alt:'Portrait of a woman framed by green leaves',credit:'Kermen Tutkunova',source:'https://unsplash.com/photos/h3hJzV0y_PY'},
{id:'animal',title:'Fox in the meadow',category:'Animals',src:'/photos/animal.jpg',alt:'Orange fox resting in green meadow grass',credit:'Scott Walsh',source:'https://unsplash.com/photos/7LzKELgdzzI'},
{id:'flowers',title:'Wildflowers in bloom',category:'Botanical',src:'/photos/flowers.jpg',alt:'Pink wildflowers surrounded by green leaves',credit:'Kier in Sight Archives',source:'https://unsplash.com/photos/GknCIf4CCCY'},
{id:'coast',title:'Ocean meets land',category:'Coast',src:'/photos/coast.jpg',alt:'Green coastal cliffs meeting blue ocean waves',credit:'Ilyuza Mingazova',source:'https://unsplash.com/photos/V-ONABe_ygs'}
];
type Loaded={src:string;pixels:ImageData;original:string;width:number;height:number};
function BandImage({loaded,bandId,opacity,effects,className}:{loaded:Loaded;bandId:string;opacity:number;effects:EffectOptions;className?:string}) {
 const ref=useRef<HTMLCanvasElement>(null);
 const cache=useRef<{source:ImageData;effect:Uint8ClampedArray<ArrayBuffer>}|null>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const small=fitDimensions(loaded.width,loaded.height,480);
  canvas.width=small.width;canvas.height=small.height;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const temp=document.createElement('canvas');temp.width=loaded.width;temp.height=loaded.height;
  temp.getContext('2d')!.putImageData(loaded.pixels,0,0);
  ctx.drawImage(temp,0,0,small.width,small.height);
  const pixels=ctx.getImageData(0,0,small.width,small.height);
  cache.current={source:pixels,effect:createEffect(pixels.data,bandId,small,effects)};
 },[loaded,bandId,effects]);
 useEffect(()=>{
  const pixels=cache.current;if(!pixels||!ref.current)return;
  ref.current.getContext('2d')?.putImageData(new ImageData(blendPixels(pixels.source.data,pixels.effect,opacity),pixels.source.width,pixels.source.height),0,0);
 },[loaded,bandId,opacity,effects]);
 return <canvas ref={ref} className={className} role="img" aria-label={bands.find(b=>b.id===bandId)?.name+' simulated view'}/>;
}
export default function Home() {
 const [photo,setPhoto]=useState<Photo>(photos[0]);
 const [uploaded,setUploaded]=useState<Photo|null>(null);
 const [bandIndex,setBandIndex]=useState(bands.findIndex(b=>b.id==='nir'));
 const [original,setOriginal]=useState(false);
 const [opacity,setOpacity]=useState(100);
 const [effects,setEffects]=useState<EffectOptions>({...defaultEffects});
 const [tool,setTool]=useState<EditTool>('view'),[brush,setBrush]=useState<Material>('vegetation'),[radius,setRadius]=useState(10);
 const [reference,setReference]=useState<ReferenceImage|null>(null);
 const [compare,setCompare]=useState(false),[split,setSplit]=useState(50);
 const [playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1);
 const [view,setView]=useState('explore');
 const [loaded,setLoaded]=useState<Loaded|null>(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [dragging,setDragging]=useState(false);
 const [about,setAbout]=useState(false);
 const [retry,setRetry]=useState(0);
 const fileInput=useRef<HTMLInputElement>(null);
 const uploadUrl=useRef<string|null>(null);
 const uploadSequence=useRef(0);
 const [uploadBusy,setUploadBusy]=useState(false);
 const band=bands[bandIndex];
 const ready=loaded?.src===photo.src&&!busy;
 useEffect(()=>{
  let cancelled=false;
  const image=new Image();image.decoding='async';
  setBusy(true);setLoaded(null);setError('');
  image.onload=()=>{
   if(cancelled)return;
   try{
    const {width,height}=fitDimensions(image.naturalWidth,image.naturalHeight);
    if(!width||!height)throw new Error('Invalid image');
    const temp=document.createElement('canvas');temp.width=width;temp.height=height;
    const ctx=temp.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas unavailable');
    ctx.drawImage(image,0,0,width,height);
    const pixels=ctx.getImageData(0,0,width,height);
    setLoaded({src:photo.src,pixels,original:temp.toDataURL('image/png'),width,height});
    setBusy(false);
   }catch{setError('This image could not be processed. Try a different image.');setBusy(false);}
  };
  image.onerror=()=>{if(!cancelled){setError('The image could not be loaded. Try again or choose another photo.');setBusy(false);}};
  image.src=photo.src;
  return ()=>{cancelled=true;image.onload=null;image.onerror=null;};
 },[photo.src,retry]);
 useEffect(()=>{setReference(null);setTool('view');const scene:ModelSettings['scene']=photo.id==='people'?'portrait':photo.id==='animal'?'wildlife':photo.id==='city'?'urban':'outdoor';setEffects(e=>({...e,model:{...modelSettings(e.model),scene,regions:[],showMaterials:false}}));},[photo.src]);
 useEffect(()=>()=>{if(uploadUrl.current)URL.revokeObjectURL(uploadUrl.current);},[]);
 useEffect(()=>{
  if(!playing||!ready||view!=='explore')return;
  const timer=window.setInterval(()=>{setBandIndex(index=>(index+1)%bands.length);setOriginal(false);},speed*1000);
  return ()=>window.clearInterval(timer);
 },[playing,ready,view,speed]);
 useEffect(()=>{
  const pauseWhenHidden=()=>{if(document.hidden)setPlaying(false);};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return ()=>document.removeEventListener('visibilitychange',pauseWhenHidden);
 },[]);
 function changeEffects(value:EffectOptions){setEffects(value);setOriginal(false);setPlaying(false);}
 function editImagePoint(x:number,y:number){
  const model=modelSettings(effects.model);
  if(tool==='source')changeEffects({...effects,model:{...model,sourceX:Math.round(x*100),sourceY:Math.round(y*100)}});
  else if(tool==='material'&&model.regions.length<48)changeEffects({...effects,model:{...model,regions:[...model.regions,{x,y,radius:radius/100,material:brush}]}});
 }
 function previewImage(){window.requestAnimationFrame(()=>document.querySelector('.comparison-surface')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'}));}
 function chooseTool(next:EditTool){setTool(next);setPlaying(false);setOriginal(false);setView('explore');if(next!=='view')previewImage();}
 function chooseBand(index:number){setTool('view');setEffects(e=>({...e,model:{...modelSettings(e.model),showMaterials:false}}));setPlaying(false);setBandIndex(index);setOriginal(false);}
 function applyFavorite(favorite:Favorite){setTool('view');
  setPlaying(false);setOriginal(false);setView('explore');setBandIndex(bands.findIndex(b=>b.id===favorite.bandId));
  setOpacity(favorite.opacity);setEffects({...favorite.effects});setCompare(favorite.compare);setSplit(favorite.split);setSpeed(favorite.speed);
 }
 async function upload(file?:File){
  if(!file)return;
  const validation=validateUpload(file);if(validation){setError(validation);return;}
  const sequence=++uploadSequence.current;
  setUploadBusy(true);setError('');
  const url=URL.createObjectURL(file);
  try{
   const decoded=new Image();decoded.src=url;await decoded.decode();
   if(decoded.naturalWidth*decoded.naturalHeight>40000000)throw new Error('Please choose an image smaller than 40 megapixels.');
   if(sequence!==uploadSequence.current){URL.revokeObjectURL(url);return;}
   if(uploadUrl.current)URL.revokeObjectURL(uploadUrl.current);
   uploadUrl.current=url;
   const next={id:'upload',title:file.name,category:'Your image',src:url,alt:'Your uploaded image: '+file.name};
   setPlaying(false);setUploaded(next);setPhoto(next);
  }catch(e){URL.revokeObjectURL(url);if(sequence===uploadSequence.current)setError(e instanceof Error&&e.message.includes('megapixels')?e.message:'This file could not be decoded. Try a JPG, PNG, or WebP image.');}
  finally{if(sequence===uploadSequence.current)setUploadBusy(false);}
 }
 function selectPhoto(next:Photo){setPlaying(false);setError('');setPhoto(next);}
 return <div className="app-shell" style={{'--band-color':original?'#d6eea2':band.color} as CSSProperties}>
 <header className="topbar"><a className="brand" href="/" aria-label="Spectrum Simulations home"><SpectrumLogo/><span className="brand-label">ELECTROMAGNETIC EXPLORER</span></a><button className="header-note about-button" onClick={()=>setAbout(true)}><Info size={15}/> About the simulations</button></header>
 <main>
 <div className="workspace-heading"><div><div className="eyebrow">THE WORLD, IN A DIFFERENT LIGHT</div><h1>Explore beyond the visible<span>.</span></h1></div><button className="upload-button" onClick={()=>fileInput.current?.click()} disabled={uploadBusy}>{uploadBusy?<LoaderCircle className="spin" size={17}/>:<Upload size={17}/>} {uploadBusy?'Opening image…':'Upload image'}</button></div>
 <input className="sr-only" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload a JPG, PNG, or WebP image" onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/>
 {error&&<div className="error-message" role="alert"><Info size={17}/><span>{error}</span>{!loaded&&<button onClick={()=>setRetry(n=>n+1)}>Try again</button>}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
 <div className="workspace-grid">
 <section className="image-column" aria-label="Image explorer" onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragging(false);}} onDrop={e=>{e.preventDefault();setDragging(false);void upload(e.dataTransfer.files[0]);}}>
 <Tabs value={view} onValueChange={v=>{setPlaying(false);setView(String(v));}} className="view-tabs-root"><div className="viewer-toolbar"><span className="photo-title"><ImageIcon size={16}/><span title={photo.title}>{photo.title}</span></span><div className="view-tabs"><TabsList aria-label="Viewer layout"><TabsTrigger value="explore"><ScanLine size={14}/><span>Explore</span></TabsTrigger><TabsTrigger value="all"><Grid2X2 size={14}/><span>All bands</span></TabsTrigger></TabsList></div></div>
 <TabsContent value={view} className={'viewer '+(view==='all'?'gallery-viewer':'')} aria-busy={busy}>
 {view==='explore'&&ready&&loaded&&<SpectrumViewer key={loaded.src} loaded={loaded} band={band} opacity={opacity} effects={effects} compare={compare} onCompare={setCompare} split={split} onSplit={setSplit} speed={speed} onPause={()=>setPlaying(false)} original={original} onOriginalChange={value=>{setTool('view');setPlaying(false);setOriginal(value);}} alt={photo.alt} title={photo.title} reference={reference} tool={tool} onEditPoint={editImagePoint}/>}
 {view==='all'&&ready&&loaded&&<div className="band-gallery"><button className="band-card" onClick={()=>{setOriginal(true);setView('explore');}}><img src={loaded.original} alt={photo.alt+' — original'}/><span><strong>Original</strong><small>Visible light · RGB</small></span></button>{bands.map((b,i)=><button key={b.id} className="band-card" onClick={()=>{chooseBand(i);setView('explore');}}><BandImage loaded={loaded} bandId={b.id} opacity={opacity} effects={effects}/><span><strong>{b.name}</strong><small>{effects.mixBand?'Mixed with '+bands.find(band=>band.id===effects.mixBand)?.short+' · ':''}{b.range} · Simulated</small></span></button>)}</div>}
 {busy&&<><img className="initial-preview" src={photo.src} alt={photo.alt+' — original photo'} fetchPriority="high"/><div className="processing" role="status"><LoaderCircle className="spin" size={24}/><span>Preparing your image…</span></div></>}
 {!busy&&!loaded&&<div className="processing"><ImageIcon size={26}/><span>Choose another image to continue.</span><button className="subtle-button" onClick={()=>fileInput.current?.click()}>Upload image</button></div>}
 
 {dragging&&<div className="drop-overlay"><Upload size={32}/><strong>Drop your image here</strong><span>JPG, PNG, or WebP · Up to 20 MB</span></div>}
 </TabsContent></Tabs>
 <div className="image-credit">{photo.credit?<span>Photo by <a href={photo.source} target="_blank" rel="noreferrer">{photo.credit} <ArrowUpRight size={12}/></a> on Unsplash</span>:<span>Your image · Processed on your device</span>}<span>{view==='all'?(bands.length+1)+' views · Select one to explore':bands.length+' simulated bands + the original'}</span></div>
 <SweepControls playing={playing} onPlaying={value=>{setPlaying(value);if(value){setTool('view');setEffects(e=>({...e,model:{...modelSettings(e.model),showMaterials:false}}));setOriginal(false);setView('explore');}}} speed={speed} onSpeed={setSpeed} disabled={!ready}/>
 <div className="filmstrip-heading"><span>Start with a scene</span><span>6 stock images <ChevronRight size={14}/></span></div>
 <div className="filmstrip">{photos.map((p,i)=><button key={p.id} className={'photo-tile '+(p.id===photo.id?'selected':'')} onClick={()=>selectPhoto(p)} aria-pressed={p.id===photo.id} aria-label={'Explore '+p.title}><div><img src={p.thumbnail||p.src} alt={p.alt} loading="lazy" decoding="async" width={320} height={160}/><span className="photo-number">{p.id===photo.id?<Check size={12}/>:String(i+1).padStart(2,'0')}</span></div><span>{p.category}</span></button>)}</div>
 <div className="upload-hint"><Upload size={15}/><span>Or drop your own image above. <span>JPG, PNG, WebP · Up to 20 MB · Images aren’t saved.</span></span>{uploaded&&<button onClick={()=>selectPhoto(uploaded)} className={'uploaded-chip '+(photo.id==='upload'?'active':'')}><ImageIcon size={14}/> Your image</button>}</div>
 <ReferencePanel sourceKey={photo.src} width={ready&&loaded?loaded.width:0} height={ready&&loaded?loaded.height:0} hasReference={!!reference} onReference={value=>{setReference(value);setPlaying(false);setOriginal(false);setCompare(true);setView('explore');}}/>
 <Favorites current={{bandId:band.id,opacity,effects,compare,split,speed}} onApply={applyFavorite}/>
 </section>
 <aside className="inspector">
 <div className="inspector-title"><Waves size={19}/><h2>EM spectrum</h2><span className="eyebrow">01—{bands.length}</span></div>
 <label className="model-select quick-band"><span>Choose a band</span><select value={band.id} onChange={e=>chooseBand(bands.findIndex(b=>b.id===e.target.value))}>{bands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 <div className="spectrum-overview"><div className="spectrum-bar"/><div><span>RADIO</span><span>VISIBLE</span><span>GAMMA RAYS</span></div></div>
 <div className="current-mode"><span className="mode-orbit" aria-hidden="true">◉</span><div><div className="eyebrow">{original?'ORIGINAL IMAGE':'SIMULATED VIEW'}</div><h3 aria-live="polite">{original?'Visible light':band.name}</h3><span className="wave-value">{original?'Full-color RGB':band.range}</span></div></div>
 <p className="mode-copy">{original?'The world as your camera sees it. Your original photo, with no spectrum transformation.':modelSettings(effects.model).engine==='classic'?`${band.name} in Classic mode: the original artistic photo filter. Switch to Modeled in the studio to explore wavelength, material, and source assumptions.`:band.description}</p>
 <label className="opacity-control"><span className="control-label"><span>Effect opacity</span><output className="accent">{original&&view==='explore'?'Original preview':opacity+'%'}</output></span><Slider className="opacity-slider" value={[opacity]} min={0} max={100} step={1} disabled={!ready||(original&&view==='explore')} onValueChange={value=>{setOpacity(Array.isArray(value)?value[0]:value);setOriginal(false);}}/><span className="scale-labels"><span>Original</span><span>Full effect</span></span></label>
 <ModelControls bandId={band.id} options={effects} onChange={changeEffects} tool={tool} onTool={chooseTool} brush={brush} onBrush={setBrush} radius={radius} onRadius={setRadius} disabled={!ready} onPreview={previewImage}/>
 <EffectControls options={effects} onChange={changeEffects} disabled={!ready} bandId={band.id}/>
 <label className="control-block spectrum-label"><div className="control-label"><span>Explore the spectrum</span><span className="accent">{String(bandIndex+1).padStart(2,'0')} / {bands.length}</span></div><Slider value={[bandIndex]} min={0} max={bands.length-1} step={1} onValueChange={v=>chooseBand(Array.isArray(v)?v[0]:v)} aria-label="Simulated spectrum band" aria-valuetext={band.name} className="spectrum-slider"/><div className="scale-labels"><span>Longer waves</span><span>Shorter waves</span></div></label>
 <RadioGroup value={original?'original':band.id} onValueChange={value=>{const index=bands.findIndex(b=>b.id===value);if(index>=0)chooseBand(index);}} aria-label="Choose a simulated electromagnetic band" className="band-options">
 {bandGroups.map(group=><div className="band-group" key={group}><div className="band-group-label">{group}</div><div className="band-buttons">{bands.filter(b=>b.group===group).map(b=><label key={b.id} className={'band-option '+(!original&&band.id===b.id?'selected':'')} style={{'--option-color':b.color} as CSSProperties}><RadioGroupItem value={b.id} aria-label={b.name+' simulation'}/><span>{b.short}</span></label>)}</div></div>)}
 </RadioGroup>
 <div className="science-note"><Info size={17}/><p><strong>A creative simulation</strong>All light is electromagnetic radiation. These views combine RGB pixels with editable assumptions; they do not measure unseen radiation. <button onClick={()=>setAbout(true)}>How it works <ArrowUpRight size={12}/></button></p></div>
 </aside></div>
 <SpectrumGuide/>
 <footer><div className="footer-identity"><span>SPECTRUM SIMULATIONS <span className="footer-divider">/</span> Explore the light you see. Imagine the light you don’t.</span><span className="creator-credit">Created and designed by <strong>{creatorName}</strong></span><a href={`mailto:${contactEmail}`}>{contactEmail}</a><span className="build-credit">{buildCredit}</span></div><a href="https://science.nasa.gov/ems/" target="_blank" rel="noreferrer">The science of light <ArrowUpRight size={14}/></a></footer>
 </main>
 <Dialog open={about} onOpenChange={setAbout}><DialogContent className="about-dialog"><DialogTitle>Seeing beyond visible light</DialogTitle><DialogDescription>Spectrum is a creative image explorer. Every transformed view is a simulation derived from your photo’s red, green, and blue pixels.</DialogDescription><div className="about-copy"><p><strong>One electromagnetic spectrum</strong>Radio, microwaves, infrared, visible light, ultraviolet, X-rays, and gamma rays are all electromagnetic radiation, ordered here from longer to shorter wavelengths.</p><p><strong>What you’re seeing</strong>Modeled visible bands use a smooth spectral estimate in linear light. NIR, thermal, UV, and radar use editable material assumptions. X-ray uses material attenuation and assumed thickness. Radio and gamma use a hypothetical source you position. Classic preserves the original artistic filters.</p><p><strong>What a photo can’t tell us</strong>An RGB photo cannot reveal radio emissions, radar returns, temperature, UV reflectance, bones, internal structures, or radioactive material. Real measurements require specialized sensors and data. Band ranges are approximate and representative; the selector is not to scale. Microwaves are often treated as part of radio; this app separates them for exploration.</p><p><strong>Compare and inspect</strong>Effect opacity blends the original color photo with its simulation. Split view reveals the original on the left and the blended effect on the right. Scroll over the image to zoom from 1× (fit) to 5× around the cursor, then drag to pan; both sides stay aligned. The +/− buttons also zoom, and Fit resets the view. Scrolling outside the image moves the page. Keyboard: focus the viewer, use +/− to zoom, arrow keys to pan, and 0 to reset. Focus the divider and use arrow keys to move it.</p><p><strong>Make a custom look</strong>In Modeled rendering, strength changes displayed intensity. Palette controls are separate from the underlying assumed signal. Material guesses are simple visible-color rules, not AI recognition or measurements. Mix two effects combines their processed colors before opacity blends the result with the original. Play spectrum cycles through every band at your chosen speed; selecting a band pauses playback.</p><p><strong>Inspect pixels</strong>Turn on Inspect pixels, then hover or tap the image to read original and processed RGB values at the same position. Coordinates start at zero and refer to the resized image. Alpha shows transparency from 0 to 255. With the viewer focused, arrow keys move the sample one pixel; hold Shift to move ten. These values describe image colors, not electromagnetic measurements.</p><p><strong>Save and export</strong>Favorite settings stay in this browser on this device and can be applied to any photo. PNG exports save the full processed image or the current split comparison, including zoom and pan. Animated GIFs crossfade through the 14 bands at your chosen speed, with the image resized to 480 pixels and a limited color palette. A caption identifies every export as an original image or a creative simulation.</p><p><strong>Your images stay on your device</strong>Uploads are processed in your browser and are not saved to a server. Images are resized to a maximum of 1,600 pixels along the longer edge for smooth viewing. Reloading clears your upload.</p><p><strong>Photo credits</strong>The six starter images are by the photographers credited below the viewer, used under the <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License</a>.</p><a className="science-link" href="https://science.nasa.gov/ems/" target="_blank" rel="noreferrer">Learn about the electromagnetic spectrum at NASA <ArrowUpRight size={14}/></a></div></DialogContent></Dialog>
 </div>;
}
