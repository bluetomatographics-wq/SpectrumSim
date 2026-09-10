'use client';
import { useEffect, useState } from 'react';
import { Play, Pause, Star, Trash2, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { bands } from '@/lib/spectrum';
import { defaultEffects, favoritesKey, parseFavorites, type EffectOptions, type Favorite } from '@/lib/creative';

export function Choice({label,value,items,onChange,disabled=false}:{label:string;value:string;items:{value:string;label:string}[];onChange:(value:string)=>void;disabled?:boolean}) {
  return <Select value={value} items={items} onValueChange={v=>{if(v!==null)onChange(v);}} disabled={disabled}>
    <SelectTrigger className="lab-select" aria-label={label}><SelectValue/></SelectTrigger>
    <SelectContent className="lab-select-menu">{items.map(item=><SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
  </Select>;
}

export function EffectControls({options,onChange,disabled,bandId}:{options:EffectOptions;onChange:(value:EffectOptions)=>void;disabled:boolean;bandId:string}) {
  const change=(patch:Partial<EffectOptions>)=>onChange({...options,...patch});
  return <div className="effect-tools">
    <label className="lab-range"><span><span>Effect strength</span><output>{(options.strength/100).toFixed(2)}×</output></span>
      <Slider aria-label="Effect strength" className="opacity-slider" min={25} max={200} step={5} value={[options.strength]} disabled={disabled} onValueChange={v=>change({strength:Array.isArray(v)?v[0]:v})}/>
    </label>
    <p className="tool-help">{bandId==='radio'?'Adjust the smoothing radius.':bandId==='microwave'?'Adjust how strongly edges stand out.':'Adjust contrast within the effect.'} 1× is the default.</p>
    <label className="mix-choice"><Switch checked={options.mixBand!==null} disabled={disabled} onCheckedChange={value=>change({mixBand:value?(bandId==='uv'?'nir':'uv'):null})}/><span>Mix two effects</span></label>
    {options.mixBand&&<div className="mix-settings">
      <Choice label="Second effect" value={options.mixBand} items={bands.map(b=>({value:b.id,label:b.name}))} onChange={mixBand=>change({mixBand})} disabled={disabled}/>
      <label className="lab-range"><span><span>Second effect</span><output>{options.mixAmount}%</output></span><Slider aria-label="Second effect percentage" className="opacity-slider" value={[options.mixAmount]} min={0} max={100} step={1} onValueChange={v=>change({mixAmount:Array.isArray(v)?v[0]:v})} disabled={disabled}/></label>
      <p className="tool-help">Blend the two simulations first, then use opacity to blend with the original.</p>
    </div>}
    <button className="text-tool" onClick={()=>onChange({...defaultEffects})} disabled={disabled}><RotateCcw size={13}/>Reset strength & mix</button>
  </div>;
}

export function SweepControls({playing,onPlaying,speed,onSpeed,disabled}:{playing:boolean;onPlaying:(value:boolean)=>void;speed:number;onSpeed:(value:number)=>void;disabled:boolean}) {
  return <div className="sweep-controls" role="group" aria-label="Automatic spectrum sweep">
    <button className={'tool-button '+(playing?'active':'')} onClick={()=>onPlaying(!playing)} disabled={disabled} aria-pressed={playing}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pause sweep':'Play spectrum'}</button>
    <Choice label="Spectrum playback speed" value={String(speed)} items={[{value:'.5',label:'Fast · 0.5 s / band'},{value:'1',label:'Normal · 1 s / band'},{value:'2',label:'Slow · 2 s / band'},{value:'4',label:'Very slow · 4 s / band'}].map(item=>({...item,value:String(Number(item.value))}))} onChange={value=>onSpeed(Number(value))} disabled={disabled}/>
    <span className="tool-help">{playing?'Cycling through all 14 bands':'Pause on any band to inspect it'}</span>
  </div>;
}

type Current = Omit<Favorite,'id'|'name'>;
export function Favorites({current,onApply}:{current:Current;onApply:(favorite:Favorite)=>void}) {
  const [favorites,setFavorites]=useState<Favorite[]>([]),[name,setName]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{try{setFavorites(parseFavorites(localStorage.getItem(favoritesKey)));}catch{setMessage('Device storage is unavailable. Favorites will last for this session.');}},[]);
  function saveList(next:Favorite[]){
    setFavorites(next);
    try{localStorage.setItem(favoritesKey,JSON.stringify(next));return true;}
    catch{setMessage('Device storage is unavailable. Favorites will last for this session.');return false;}
  }
  function save(){
    if(!name.trim()){setMessage('Give this favorite a name first.');return;}
    if(favorites.length>=20){setMessage('You have 20 favorites. Remove one to save another.');return;}
    const favorite={...current,effects:{...current.effects},id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:name.trim()};
    if(saveList([...favorites,favorite]))setMessage(`Saved “${favorite.name}” on this device.`);
    setName('');
  }
  return <details className="favorites-panel"><summary><Star size={16}/> Favorite settings <span>{favorites.length} / 20</span></summary>
    <div className="favorites-content"><p className="tool-help">Save effects, opacity, split position, and playback speed. Apply them to any photo. Images are never stored with a favorite.</p>
      <form className="favorite-form" onSubmit={e=>{e.preventDefault();save();}}><input aria-label="Favorite name" placeholder="Name this look" maxLength={60} value={name} onChange={e=>setName(e.target.value)}/><button type="submit" className="tool-button"><Star size={14}/>Save favorite</button></form>
      {favorites.length===0&&<p className="tool-help">No favorites yet. Adjust an effect and save your first look.</p>}
      <div className="favorite-list">{favorites.map(favorite=><div key={favorite.id}><button onClick={()=>{onApply(favorite);setMessage(`Applied “${favorite.name}”.`);}}><strong>{favorite.name}</strong><span>{bands.find(b=>b.id===favorite.bandId)?.short} · {favorite.opacity}% opacity · {(favorite.effects.strength/100).toFixed(2)}× strength{favorite.effects.mixBand?' · Mixed':''}</span></button><button className="remove-favorite" aria-label={`Remove favorite ${favorite.name}`} onClick={()=>{if(saveList(favorites.filter(item=>item.id!==favorite.id)))setMessage(`Removed “${favorite.name}”.`);}}><Trash2 size={15}/></button></div>)}</div>
      <p className="tool-help" role="status">{message}</p>
    </div>
  </details>;
}
