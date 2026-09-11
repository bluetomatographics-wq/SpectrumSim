'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Eye, Minus, Plus, RotateCcw, Pipette, Download, LoaderCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { bands, type Band } from '@/lib/spectrum';
import { blendPixels, imageRectangle, initialPose, zoomPose, type Size, type ViewPose } from '@/lib/viewer';
import { createEffect, effectLabel, pixelAt, type EffectOptions } from '@/lib/creative';
import { canvasBlob, downloadBlob, exportName, exportSweep } from '@/lib/export-image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { EditTool } from './model-controls';
import type { ReferenceImage } from './reference-panel';
import { modelSettings } from '@/lib/models';
import { bindWheelZoom } from '@/lib/wheel-zoom';

type Loaded = { pixels: ImageData; width: number; height: number };
type Props = { reference:ReferenceImage|null; tool:EditTool; onEditPoint:(x:number,y:number)=>void; loaded: Loaded; band: Band; opacity: number; effects: EffectOptions; compare:boolean; onCompare:(value:boolean)=>void; split:number; onSplit:(value:number)=>void; speed:number; onPause:()=>void; original: boolean; onOriginalChange: (value: boolean) => void; alt: string; title:string };

export function SpectrumViewer({ reference,tool,onEditPoint,loaded, band, opacity, effects, compare, onCompare, split, onSplit, speed, onPause, original, onOriginalChange, alt, title }: Props) {
  const [pose, setPose] = useState<ViewPose>(initialPose);
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const wheelMotion = useRef<ReturnType<typeof bindWheelZoom> | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [panning, setPanning] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const beforeCanvas = useRef<HTMLCanvasElement>(null);
  const effectCanvas = useRef<HTMLCanvasElement>(null);
  const processed = useMemo(()=>createEffect(loaded.pixels.data,band.id,loaded,effects),[loaded,band.id,effects]);
  const displayed = useMemo(()=>blendPixels(loaded.pixels.data,processed,original?0:opacity),[loaded,processed,opacity,original]);
  const [inspect,setInspect]=useState(false),[point,setPoint]=useState<{x:number;y:number}|null>(null);
  const [exportOpen,setExportOpen]=useState(false),[exporting,setExporting]=useState(false),[progress,setProgress]=useState(0),[exportMessage,setExportMessage]=useState('');
  const exportAbort=useRef<AbortController|null>(null);
  const gesture = useRef<{ id: number; startX: number; startY: number; pan: { x: number; y: number } } | null>(null);
  const editTap = useRef<{id:number;x:number;y:number;pixel:{x:number;y:number}}|null>(null);
  const splitVisible = compare && !original;
  const rectangle = imageRectangle(loaded, viewport, pose);
  const imageStyle: CSSProperties = { width: loaded.width, height: loaded.height, left: 0, top: 0, transformOrigin: '0 0', transform: `translate3d(${rectangle.left}px, ${rectangle.top}px, 0) scale(${rectangle.width / loaded.width})`, willChange: 'transform' };
  const model=modelSettings(effects.model);
  const beforeLabel=reference?'Your reference':'Original';
  const label=effectLabel(band.id,effects);
  const pixelIndex=point?(point.y*loaded.width+point.x)*4:0;
  const originalRGB=point?Array.from(loaded.pixels.data.slice(pixelIndex,pixelIndex+3)):null;
  const processedRGB=point?Array.from(displayed.slice(pixelIndex,pixelIndex+3)):null;

  useEffect(()=>()=>exportAbort.current?.abort(),[]);

  useEffect(() => {
    if (!surface.current) return;
    const motion = bindWheelZoom(surface.current, loaded, viewport, () => poseRef.current, next => { poseRef.current = next; setPose(next); }, () => gesture.current !== null);
    wheelMotion.current = motion;
    return () => { motion.destroy(); if (wheelMotion.current === motion) wheelMotion.current = null; };
  }, [loaded, viewport]);

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const measure = () => setViewport({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const before = beforeCanvas.current;
    if (!before) return;
    before.width = loaded.width;
    before.height = loaded.height;
    before.getContext('2d')?.putImageData(reference?.pixels??loaded.pixels, 0, 0);
  }, [loaded,reference]);

  useEffect(() => {
    const canvas = effectCanvas.current;
    if (!canvas) return;
    canvas.width = loaded.width;
    canvas.height = loaded.height;
    canvas.getContext('2d')?.putImageData(new ImageData(displayed, loaded.width, loaded.height), 0, 0);
  }, [loaded, displayed]);

  function inspectAt(event:PointerEvent<HTMLDivElement>){
    if(!inspect||(event.target as Element).closest('[data-viewer-control]'))return;
    const bounds=event.currentTarget.getBoundingClientRect();
    setPoint(pixelAt({x:event.clientX-bounds.left,y:event.clientY-bounds.top},loaded,viewport,pose));
  }

  async function savePNG(comparison:boolean){
    setExporting(true);setExportMessage('Preparing PNG…');
    try{
      const output=document.createElement('canvas');
      const width=comparison?Math.max(1,Math.round(viewport.width)):Math.max(320,loaded.width);
      const height=comparison?Math.max(1,Math.round(viewport.height)):loaded.height;
      output.width=width;output.height=height+44;
      const ctx=output.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
      if(comparison){
        ctx.fillStyle='#111413';ctx.fillRect(0,0,width,height);
        const draw=(canvas:HTMLCanvasElement|null,left:number,right:number)=>{
          if(!canvas)return;ctx.save();ctx.beginPath();ctx.rect(left,0,right-left,height);ctx.clip();
          ctx.drawImage(canvas,rectangle.left,rectangle.top,rectangle.width,rectangle.height);ctx.restore();
        };
        draw(beforeCanvas.current,0,width*split/100);draw(effectCanvas.current,width*split/100,width);
        ctx.fillStyle='#f1f3ec';ctx.fillRect(width*split/100,0,1,height);
      }else{ctx.putImageData(new ImageData(displayed,loaded.width,loaded.height),Math.floor((width-loaded.width)/2),0);}
      ctx.fillStyle='#111413';ctx.fillRect(0,height,width,44);ctx.fillStyle='#d6eea2';ctx.font='13px Arial';
      ctx.fillText(original?'SPECTRUM · ORIGINAL RGB':model.showMaterials?'SPECTRUM · ASSUMED MATERIAL MAP':'SPECTRUM · SIMULATION / ASSUMED DATA',10,height+17,width-20);
      ctx.fillStyle='#f1f3ec';ctx.fillText(`${comparison?beforeLabel+' | ':''}${original?'Original photo':`${label} · ${opacity}% opacity · ${(effects.strength/100).toFixed(2)}× strength`}`,10,height+34,width-20);
      const blob=await canvasBlob(output);
      downloadBlob(blob,exportName(title,`${comparison?'comparison':original?'original':band.id}.png`));
      setExportMessage('PNG prepared. Check your browser’s downloads.');
    }catch{setExportMessage('The image could not be exported. Please try again.');}
    finally{setExporting(false);}
  }

  async function saveAnimation(){
    const controller=new AbortController();exportAbort.current=controller;
    setExporting(true);setProgress(0);setExportMessage('Building your animated spectrum…');
    try{
      const blob=await exportSweep(loaded.pixels,effects,opacity,speed,bands.findIndex(b=>b.id===band.id),controller.signal,setProgress);
      if(controller.signal.aborted)return;
      downloadBlob(blob,exportName(title,'sweep.gif'));
      setExportMessage('Animated GIF prepared. Check your browser’s downloads.');
    }catch(error){setExportMessage(error instanceof DOMException&&error.name==='AbortError'?'Export canceled.':'The animation could not be exported. Try again.');}
    finally{exportAbort.current=null;setExporting(false);}
  }

  function changeZoom(next: number) {
    wheelMotion.current?.cancel();
    setPose(current => zoomPose(loaded, viewport, current, next));
  }

  function resetView() {
    wheelMotion.current?.cancel();
    setPose(initialPose);
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if(tool!=='view'&&event.button===0&&!(event.target as Element).closest('[data-viewer-control]')){
      const bounds=event.currentTarget.getBoundingClientRect();const pixel=pixelAt({x:event.clientX-bounds.left,y:event.clientY-bounds.top},loaded,viewport,pose);
      if(pixel){editTap.current={id:event.pointerId,x:event.clientX,y:event.clientY,pixel};event.currentTarget.focus({preventScroll:true});}return;
    }
    inspectAt(event);
    if (event.button !== 0 || pose.zoom <= 1 || (event.target as Element).closest('[data-viewer-control]')) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, pan: rectangle.pan };
    setPanning(true);
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    if(editTap.current&&Math.hypot(event.clientX-editTap.current.x,event.clientY-editTap.current.y)>7)editTap.current=null;
    inspectAt(event);
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    const next = imageRectangle(loaded, viewport, { zoom: pose.zoom, pan: { x: active.pan.x + event.clientX - active.startX, y: active.pan.y + event.clientY - active.startY } });
    setPose({ zoom: pose.zoom, pan: next.pan });
  }

  function stopPan(event: PointerEvent<HTMLDivElement>) {
    const tap=editTap.current;editTap.current=null;
    if(tap?.id===event.pointerId&&event.type==='pointerup'&&tool!=='view'){
      setPoint(tap.pixel);onEditPoint((tap.pixel.x+.5)/loaded.width,(tap.pixel.y+.5)/loaded.height);
    }
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if(tool!=='view'&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onEditPoint((point?.x??loaded.width/2)/loaded.width,(point?.y??loaded.height/2)/loaded.height);return;}
    if((inspect||tool!=='view')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();const step=event.shiftKey?10:1;
      setPoint(current=>({x:Math.max(0,Math.min(loaded.width-1,(current?.x??Math.floor(loaded.width/2))+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0))),y:Math.max(0,Math.min(loaded.height-1,(current?.y??Math.floor(loaded.height/2))+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)))}));return;
    }
    const keys: Record<string, { x: number; y: number }> = { ArrowLeft: { x: 40, y: 0 }, ArrowRight: { x: -40, y: 0 }, ArrowUp: { x: 0, y: 40 }, ArrowDown: { x: 0, y: -40 } };
    if (['+', '=', '-', '0', 'Home', ...Object.keys(keys)].includes(event.key)) event.preventDefault();
    if (event.key === '+' || event.key === '=') changeZoom(pose.zoom + .25);
    else if (event.key === '-') changeZoom(pose.zoom - .25);
    else if (event.key === '0' || event.key === 'Home') resetView();
    else if (keys[event.key]) {
      wheelMotion.current?.cancel();
      const delta = keys[event.key];
      const next = imageRectangle(loaded, viewport, { zoom: pose.zoom, pan: { x: rectangle.pan.x + delta.x, y: rectangle.pan.y + delta.y } });
      setPose({ zoom: pose.zoom, pan: next.pan });
    }
  }

  return <><div className="spectrum-canvas-viewer">
    <div ref={surface} className={'comparison-surface ' + (pose.zoom > 1 ? 'zoomed ' : '') + (panning ? 'panning' : '')+(tool!=='view'?' editing':'')}
      tabIndex={0} role="group" aria-label={tool!=='view'?'Image editor. Tap to place. Arrow keys move the target, Enter places it.':inspect?'Image viewer. Scroll wheel or plus and minus zoom. Arrow keys move the inspected pixel; Shift moves ten pixels.':'Image viewer. Scroll wheel or plus and minus zoom, arrow keys pan, zero resets.'}
      onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan} onLostPointerCapture={stopPan} onKeyDown={keyboard}>
      <div className="original-window" style={{ clipPath: splitVisible ? `inset(0 ${100-split}% 0 0)` : 'inset(0 100% 0 0)' }}>
        <canvas ref={beforeCanvas} className="aligned-image" style={imageStyle} aria-hidden="true"/>
      </div>
      <div className="effect-window" style={{ clipPath: splitVisible ? `inset(0 0 0 ${split}%)` : undefined }}>
        <canvas ref={effectCanvas} className="aligned-image" style={imageStyle} aria-hidden="true"/>
      </div>
      <span className="sr-only" role="img" aria-label={alt + (splitVisible ? ` — ${beforeLabel} on the left, ${label} simulation at ${opacity}% opacity on the right` : original ? ' — original visible light' : ` — ${label} simulation at ${opacity}% opacity`)}/>
      <div className="comparison-caption left-caption">{splitVisible ? beforeLabel : original ? 'Original' : `${label} · ${opacity}%`}</div>
      {splitVisible && <div className="comparison-caption right-caption">{label} · {opacity}% · Simulated</div>}
      {splitVisible && <label className="split-control" data-viewer-control>
        <span className="sr-only">Comparison divider, {beforeLabel.toLowerCase()} left and simulation right</span>
        <Slider className="split-reveal" thumbAlignment="center" min={0} max={100} step={1} value={[split]} onValueChange={value => onSplit(Array.isArray(value) ? value[0] : value)}/>
      </label>}
      {(inspect||tool!=='view')&&point&&<span className="pixel-crosshair" aria-hidden="true" style={{left:rectangle.left+(point.x+.5)/loaded.width*rectangle.width,top:rectangle.top+(point.y+.5)/loaded.height*rectangle.height}}/>}
      {tool!=='view'&&<span className="editor-banner">{tool==='source'?'Tap to position the assumed source':'Tap to stamp a material'} · Enter places at target</span>}
      {(band.id==='radio'||band.id==='gamma')&&model.engine==='informed'&&!original&&<span className="source-pin" aria-label="Assumed source location" style={{left:rectangle.left+model.sourceX/100*rectangle.width,top:rectangle.top+model.sourceY/100*rectangle.height}}>+</span>}
      {inspect?<div className="pixel-readout" aria-label="Pixel inspector">
        {point&&originalRGB&&processedRGB?<><span>Pixel {point.x}, {point.y} · RGB</span><span><i style={{background:`rgb(${originalRGB.join(',')})`}}/>Original <code>{originalRGB.join(', ')}</code></span><span><i style={{background:`rgb(${processedRGB.join(',')})`}}/>{original?'Preview':'Processed'} <code>{processedRGB.join(', ')}</code></span><small>Alpha {loaded.pixels.data[pixelIndex+3]} / 255 · Hover, tap, or use arrow keys</small></>:<span>Point or tap inside the image to inspect its RGB values.</span>}
      </div>:<div className="viewer-guidance"><span>{pose.zoom > 1 ? 'Scroll to zoom · Drag to pan' : splitVisible ? 'Scroll to zoom · Drag the divider to compare' : original ? 'Original RGB · Scroll to zoom' : 'Modeled / artistic simulation · Scroll to zoom'}</span><span>{loaded.width} × {loaded.height}</span></div>}
    </div>
    <div className="viewer-controls">
      <label className="compare-choice"><Switch checked={splitVisible} onCheckedChange={value => { onCompare(value); if (value) onOriginalChange(false); }}/><span>Split view</span></label>
      <button className={'preview-original ' + (original ? 'active' : '')} onClick={() => onOriginalChange(!original)} aria-pressed={original}><Eye size={15}/>{original ? 'Show effect' : 'View original'}</button>
      <button className={'preview-original '+(inspect?'active':'')} aria-pressed={inspect} onClick={()=>{setInspect(!inspect);if(!inspect){onPause();setPoint({x:Math.floor(loaded.width/2),y:Math.floor(loaded.height/2)});}}}><Pipette size={15}/>Inspect pixels</button>
      <button className="preview-original" onClick={()=>{wheelMotion.current?.cancel();onPause();setExportMessage('');setExportOpen(true);}}><Download size={15}/>Export</button>
      <div className="zoom-controls" role="group" aria-label="Synchronized zoom">
        <button onClick={() => changeZoom(pose.zoom - .25)} disabled={pose.zoom <= 1} aria-label="Zoom out"><Minus size={16}/></button>
        <output aria-live="polite" aria-label="Zoom relative to fitted image">{Number(pose.zoom.toFixed(2))}×</output>
        <button onClick={() => changeZoom(pose.zoom + .25)} disabled={pose.zoom >= 5} aria-label="Zoom in"><Plus size={16}/></button>
        <button className="fit-button" onClick={resetView} aria-label="Fit image and reset pan"><RotateCcw size={14}/>Fit</button>
      </div>
    </div>
  </div>
  <Dialog open={exportOpen} onOpenChange={value=>{if(!value)exportAbort.current?.abort();setExportOpen(value);}}><DialogContent className="about-dialog export-dialog"><DialogTitle>Export your view</DialogTitle><DialogDescription>Download locally with your current effect strength, mix, and opacity. Each export includes a small caption identifying the simulation.</DialogDescription>
    <div className="export-options">
      <button className="export-option" onClick={()=>void savePNG(false)} disabled={exporting}><Download size={18}/><span><strong>Image · PNG</strong><small>Full processed image, up to 1,600 pixels. {original?'Exports the original preview.':'Includes your current effect.'}</small></span></button>
      <button className="export-option" onClick={()=>void savePNG(true)} disabled={exporting||!splitVisible}><Download size={18}/><span><strong>Split comparison · PNG</strong><small>{splitVisible?'Matches the divider, zoom, and pan you see.':'Enable Split view to export a comparison.'}</small></span></button>
      <button className="export-option" onClick={()=>void saveAnimation()} disabled={exporting||model.showMaterials}><Download size={18}/><span><strong>Spectrum animation · GIF</strong><small>Turn off the material map for animation. One looping sweep, with transitions between all 14 bands. {speed} seconds per band. Image resized to 480 pixels; GIF uses a limited color palette.</small></span></button>
    </div>
    {exporting&&exportAbort.current&&<div className="export-progress"><progress aria-label="Animation export progress" max={100} value={progress}/><span>{progress}%</span><button className="tool-button" onClick={()=>exportAbort.current?.abort()}>Cancel</button></div>}
    <p className="export-status" role="status">{exporting&&<LoaderCircle size={15} className="spin"/>}{exportMessage}</p>
  </DialogContent></Dialog></>;
}
