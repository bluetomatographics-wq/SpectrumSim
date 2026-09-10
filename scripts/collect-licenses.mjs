import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const store=path.join(root,'node_modules/.pnpm');
const packages=new Map();
async function inspect(dir){
 let pkg;try{pkg=JSON.parse(await fs.readFile(path.join(dir,'package.json'),'utf8'));}catch{return;}
 if(!pkg.name||packages.has(pkg.name+'@'+pkg.version))return;
 const files=(await fs.readdir(dir)).filter(n=>/^(licen[cs]e|copying|notice|copyright)(\.|$)/i.test(n));
 const blocks=[];
 for(const f of files){const file=path.join(dir,f);if((await fs.stat(file)).isFile())blocks.push(f+'\n'+await fs.readFile(file,'utf8'));}
 packages.set(pkg.name+'@'+pkg.version,[`${pkg.name}@${pkg.version}`,`License: ${JSON.stringify(pkg.license||'See package source')}`,`Source: ${JSON.stringify(pkg.repository||pkg.homepage||'See package metadata')}`,...blocks].join('\n\n'));
}
for(const entry of await fs.readdir(store)){
 const modules=path.join(store,entry,'node_modules');
 let children;try{children=await fs.readdir(modules);}catch{continue;}
 for(const child of children){
  const dir=path.join(modules,child);
  if(child.startsWith('@')){for(const name of await fs.readdir(dir))await inspect(path.join(dir,name));}
  else await inspect(dir);
 }
}
if(!packages.size)throw Error('Install dependencies with pnpm before collecting notices.');
await fs.writeFile(path.join(root,'licenses/DEPENDENCIES.txt'),[...packages].sort(([a],[b])=>a.localeCompare(b)).map(([,text])=>text).join('\n\n'+'='.repeat(72)+'\n\n')+'\n');
console.log(`Collected notices for ${packages.size} installed packages.`);
