import { useEffect, useRef, useState } from 'react';
import { applyTheme, readTheme, normalizeTheme, themeStorageKey, type ThemePreference } from '@/lib/theme';

export function ThemeSelector() {
 const [preference,setPreference]=useState<ThemePreference>('default');
 const current=useRef<ThemePreference>('default');
 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const set=(next:ThemePreference)=>{current.current=next;setPreference(next);applyTheme(next);};
  set(readTheme());
  const systemChanged=()=>applyTheme(current.current);
  const stored=(event:StorageEvent)=>{if(event.key===themeStorageKey||event.key===null)set(readTheme());};
  media.addEventListener('change',systemChanged);window.addEventListener('storage',stored);
  return()=>{media.removeEventListener('change',systemChanged);window.removeEventListener('storage',stored);};
 },[]);
 function change(value:string){const next=normalizeTheme(value);current.current=next;setPreference(next);applyTheme(next);try{localStorage.setItem(themeStorageKey,next);}catch{/* The selection still works for this visit. */}}
 return <label className="theme-selector"><span>Theme</span><select aria-label="Color theme" title="Default follows your device setting; Original restores Spectrum's green design" value={preference} onChange={event=>change(event.target.value)}><option value="light">Light</option><option value="dark">Dark</option><option value="original">Original</option><option value="default">Default (device)</option></select></label>;
}
