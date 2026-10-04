export type ThemePreference = 'default' | 'light' | 'dark' | 'original';
export const themeStorageKey = 'spectrum-theme';
export function normalizeTheme(value:unknown):ThemePreference {
 return value==='light'||value==='dark'||value==='original'?value:'default';
}
export function resolveTheme(preference:ThemePreference,deviceDark:boolean) {
 return preference==='default'?(deviceDark?'dark':'light'):preference;
}
export function readTheme():ThemePreference {
 try{return normalizeTheme(localStorage.getItem(themeStorageKey));}catch{return 'default';}
}
export function applyTheme(preference:ThemePreference) {
 const theme=resolveTheme(preference,window.matchMedia('(prefers-color-scheme: dark)').matches);
 const dark=theme!=='light';
 document.documentElement.dataset.theme=theme;
 document.documentElement.classList.toggle('dark',dark);
 document.documentElement.classList.toggle('light',!dark);
 document.documentElement.style.colorScheme=dark?'dark':'light';
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f5f7f0':theme==='dark'?'#161719':'#111413');
}
// Before first paint, including in the standalone file. Keep in sync with applyTheme.
export const themeBootScript=`(()=>{let p='default';try{p=localStorage.getItem('spectrum-theme')||p}catch{}if(!['light','dark','original'].includes(p))p='default';const t=p==='default'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;const d=t!=='light';document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('light',!d);document.documentElement.style.colorScheme=d?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',t==='light'?'#f5f7f0':t==='dark'?'#161719':'#111413')})()`;
