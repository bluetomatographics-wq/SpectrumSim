import { bands, fitDimensions } from './spectrum';
import { createEffect, effectLabel, type EffectOptions } from './creative';
import { blendPixels } from './viewer';
import { GifEncoder } from './gif';

export function downloadBlob(blob: Blob, filename: string) {
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function exportName(title:string,suffix:string) {
  return `${title.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'image'}-spectrum-${suffix}`;
}
export function canvasBlob(canvas:HTMLCanvasElement):Promise<Blob> {
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed')),'image/png'));
}

export async function exportSweep(pixels:ImageData,options:EffectOptions,opacity:number,speed:number,startBand:number,signal:AbortSignal,onProgress:(percent:number)=>void) {
  const size=fitDimensions(pixels.width,pixels.height,480);
  const source=document.createElement('canvas');source.width=pixels.width;source.height=pixels.height;
  source.getContext('2d')!.putImageData(pixels,0,0);
  const small=document.createElement('canvas');small.width=size.width;small.height=size.height;
  const ctx=small.getContext('2d')!;ctx.drawImage(source,0,0,size.width,size.height);
  const input=ctx.getImageData(0,0,size.width,size.height);
  const output=document.createElement('canvas');output.width=Math.max(320,size.width);output.height=size.height+48;
  const out=output.getContext('2d')!;
  const gif=new GifEncoder(output.width,output.height), steps=4;
  const render=(index:number)=>blendPixels(input.data,createEffect(input.data,bands[index].id,size,options),opacity);
  let current=render(startBand);
  for(let i=0;i<bands.length;i++) {
    const index=(startBand+i)%bands.length,nextIndex=(index+1)%bands.length,next=render(nextIndex);
    for(let step=0;step<steps;step++) {
      if(signal.aborted)throw new DOMException('Export canceled','AbortError');
      ctx.putImageData(new ImageData(blendPixels(current,next,step/steps*100),size.width,size.height),0,0);
      out.fillStyle='#111413';out.fillRect(0,0,output.width,output.height);
      out.drawImage(small,(output.width-size.width)/2,0);
      out.fillStyle='#d6eea2';out.font='12px Arial';
      out.fillText('SPECTRUM · CREATIVE SIMULATION',10,size.height+18);
      out.fillStyle='#f1f3ec';out.fillText(`${effectLabel(bands[index].id,options)} → ${bands[nextIndex].short} · ${opacity}%`,10,size.height+36,output.width-20);
      const delay=Math.round((step+1)*speed*100/steps)*10-Math.round(step*speed*100/steps)*10;
      gif.addFrame(out.getImageData(0,0,output.width,output.height).data,delay);
      onProgress(Math.round((i*steps+step+1)/(bands.length*steps)*100));
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    current=next;
  }
  if(signal.aborted)throw new DOMException('Export canceled','AbortError');
  return new Blob([gif.finish()],{type:'image/gif'});
}
