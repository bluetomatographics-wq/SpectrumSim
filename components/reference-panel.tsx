'use client';
import { useEffect, useRef, useState } from 'react';
import { validateUpload } from '@/lib/spectrum';
export type ReferenceImage={pixels:ImageData;name:string};
export function ReferencePanel({sourceKey,width,height,onReference,hasReference}:{sourceKey:string;width:number;height:number;onReference:(ref:ReferenceImage|null)=>void;hasReference:boolean}){
 const input=useRef<HTMLInputElement>(null),sequence=useRef(0);const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{sequence.current++;setMessage('');setBusy(false);},[sourceKey]);
 useEffect(()=>()=>{sequence.current++;},[]);
 async function load(file?:File){
  if(!file||!width||!height)return;const error=validateUpload(file);if(error){setMessage(error);return;}
  const ticket=++sequence.current,url=URL.createObjectURL(file);setBusy(true);setMessage('Opening reference…');
  try{
   const image=new Image();image.src=url;await image.decode();
   if(image.naturalWidth*image.naturalHeight>40_000_000)throw Error('Choose a reference smaller than 40 megapixels.');
   if(Math.abs(image.naturalWidth/image.naturalHeight/(width/height)-1)>.03)throw Error('Use the same crop and aspect ratio as the current photo. Align the two images before loading the reference.');
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Reference could not be opened.');ctx.drawImage(image,0,0,width,height);
   if(ticket!==sequence.current)return;
   onReference({pixels:ctx.getImageData(0,0,width,height),name:file.name});setMessage('Reference loaded: '+file.name+'. Split view compares it with the simulation.');
  }catch(e){if(ticket===sequence.current)setMessage(e instanceof Error?e.message:'This reference could not be opened.');}
  finally{URL.revokeObjectURL(url);if(ticket===sequence.current)setBusy(false);}
 }
 return <details className="reference-panel"><summary>Compare with a real capture</summary><div className="reference-content"><p>Have a matching infrared, thermal, UV, or other sensor image? Load it beside your photo to judge the simulation. Both images must already show the same scene, pose, and crop. Reference authenticity is supplied by you.</p><div className="model-actions"><button className="tool-button" disabled={busy||!width} onClick={()=>input.current?.click()}>{busy?'Opening…':'Load reference image'}</button>{hasReference&&<button className="tool-button" onClick={()=>{sequence.current++;setBusy(false);onReference(null);setMessage('Reference removed. Split view uses the original photo.');}}>Remove reference</button>}</div><input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Load matching reference image" onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/><p className="tool-help" role="status">{message}</p><p className="tool-help">The app resizes your reference to the photo dimensions. It does not align images automatically, read radiometric temperature data, or convert RGB values to physical measurements. Files stay in your browser.</p><div className="reference-links"><a href="https://www.epfl.ch/labs/ivrl/research/downloads/rgb-nir-scene-dataset/" target="_blank" rel="noreferrer">EPFL: corresponding RGB + NIR scenes ↗</a><a href="https://science.nasa.gov/ems/08_nearinfraredwaves/" target="_blank" rel="noreferrer">NASA: real near-infrared examples ↗</a><a href="https://fermi.gsfc.nasa.gov/science/constellations/" target="_blank" rel="noreferrer">NASA Fermi: visible and gamma sky ↗</a></div></div></details>;
}
