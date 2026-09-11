import { defaultModel, modelSettings, validModel, type ModelSettings } from './models';
import { bands, transformPixels } from './spectrum';
import { blendPixels, type Size, type ViewPose, imageRectangle } from './viewer';

export type EffectOptions = { strength: number; mixBand: string | null; mixAmount: number; model?: Partial<ModelSettings> };
export const defaultEffects: EffectOptions = { strength: 100, mixBand: null, mixAmount: 50 };
export type Favorite = {
  id: string; name: string; bandId: string; opacity: number; effects: EffectOptions;
  compare: boolean; split: number; speed: number;
};
export const favoritesKey = 'spectrum.favorites.v1';

export function createEffect(source: Uint8ClampedArray, bandId: string, size: Size, options: EffectOptions) {
  const primary = transformPixels(source, bandId, size, options.strength,options.model);
  if (!options.mixBand || options.mixAmount === 0) return primary;
  const secondary = transformPixels(source, options.mixBand, size, options.strength);
  return blendPixels(primary, secondary, options.mixAmount);
}

export function effectLabel(bandId: string, options: EffectOptions) {
  const primary = bands.find(b => b.id === bandId)?.short ?? bandId;
  const secondary = bands.find(b => b.id === options.mixBand)?.short;
  const m=modelSettings(options.model); const suffix=m.showMaterials?'Material map':m.engine==='classic'?'Classic':bandId==='xray'?`${m.energy} keV · ${m.thickness} mm assumed`:bandId==='uv'?m.uvMode==='reflected'?'Reflected UV':'UV fluorescence':bandId==='thermal'?'Assumed thermal':bandId==='radio'||bandId==='gamma'?'Assumed source':'Modeled';
  const name=secondary ? `${primary} + ${secondary} (${options.mixAmount}%)` : primary; return `${name} · ${suffix}`;
}

// Pointer coordinates are relative to the surface, including letterboxing and pan.
export function pixelAt(point: { x: number; y: number }, size: Size, viewport: Size, pose: ViewPose) {
  const rect = imageRectangle(size, viewport, pose);
  if (!rect.width || !rect.height) return null;
  const x = Math.floor((point.x - rect.left) / rect.width * size.width);
  const y = Math.floor((point.y - rect.top) / rect.height * size.height);
  return x < 0 || y < 0 || x >= size.width || y >= size.height ? null : { x, y };
}

const validBand = (value: unknown) => typeof value === 'string' && bands.some(b => b.id === value);
const inRange = (value: unknown, low: number, high: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high;
export function parseFavorites(raw: string | null): Favorite[] {
  try {
    const values: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(values)) return [];
    const ids = new Set<string>();
    return values.filter((value): value is Favorite => {
      if (!value || typeof value !== 'object') return false;
      const p = value as Favorite, e = p.effects;
      if (typeof p.id !== 'string' || p.id.length > 100 || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60 || !validBand(p.bandId) || !inRange(p.opacity,0,100) || !e || !inRange(e.strength,25,200) || !(e.mixBand === null || validBand(e.mixBand)) || !inRange(e.mixAmount,0,100) || typeof p.compare !== 'boolean' || !inRange(p.split,0,100) || ![.5,1,2,4].includes(p.speed)) return false;
      if(e.model!==undefined&&!validModel(e.model))return false;
      ids.add(p.id); return true;
    }).slice(0,20).map(p=>({...p,effects:{...p.effects,model:p.effects.model??{...defaultModel,engine:'classic',regions:[]}}}));
  } catch { return []; }
}
