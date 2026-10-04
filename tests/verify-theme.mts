import assert from 'node:assert/strict';
import vm from 'node:vm';
import {normalizeTheme,resolveTheme,themeBootScript} from '../lib/theme.ts';
for(const saved of ['light','dark','original','default',null,'bad']) for(const deviceDark of [false,true]) for(const blocked of [false,true]) {
 const classes=new Set(['dark']);let color='';
 const root={dataset:{} as Record<string,string>,style:{} as Record<string,string>,classList:{toggle:(name:string,on:boolean)=>on?classes.add(name):classes.delete(name)}};
 vm.runInNewContext(themeBootScript,{document:{documentElement:root,querySelector:()=>({setAttribute:(_:string,value:string)=>{color=value;}})},localStorage:{getItem:()=>{if(blocked)throw Error('Denied');return saved;}},matchMedia:()=>({matches:deviceDark})});
 const expected=resolveTheme(normalizeTheme(blocked?null:saved),deviceDark);
 assert.equal(root.dataset.theme,expected);assert.equal(root.style.colorScheme,expected==='light'?'light':'dark');assert.equal(classes.has('dark'),expected!=='light');assert.ok(color.startsWith('#'));
}
console.log('PASS: all four preferences, both device settings, invalid/missing preferences, blocked storage, and first-paint theme resolution.');
