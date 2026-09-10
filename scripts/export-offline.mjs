import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {siteUrl,siteTitle,siteDescription,appSchema,creatorName,buildCredit} from '../lib/site-seo.ts';
const project=path.resolve(import.meta.dirname,'..');
const require=createRequire(path.join(project,'package.json'));
const esbuild=require('esbuild');
const photos={};
for(const id of ['landscape','city','people','animal','flowers','coast'])photos['/photos/'+id+'.jpg']='data:image/jpeg;base64,'+(await fs.readFile(path.join(project,'public/photos/'+id+'.jpg'))).toString('base64');
const result=await esbuild.build({
 stdin:{contents:"import {createRoot} from 'react-dom/client';import App from './app/page';createRoot(document.getElementById('root')).render(<App/>);",loader:'tsx',resolveDir:project,sourcefile:'offline-entry.tsx'},
 absWorkingDir:project,bundle:true,write:false,minify:true,format:'iife',platform:'browser',target:['chrome110','safari16','firefox110'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},tsconfigRaw:{compilerOptions:{jsx:'react-jsx',target:'ES2022'}},
 plugins:[{name:'portable-resolver',setup(build){build.onResolve({filter:/.*/},args=>{let target;const base=args.resolveDir||project;if(args.path.startsWith('@/'))target=path.join(project,args.path.slice(2));else if(args.path.startsWith('.'))target=path.resolve(base,args.path);else {target=createRequire(path.join(base,'resolver.cjs')).resolve(args.path);}return {path:target,namespace:'portable'};});build.onLoad({filter:/.*/,namespace:'portable'},async args=>{let filename=args.path;for(const suffix of ['', '.tsx','.ts','.js','/index.tsx','/index.ts','/index.js']){try{const stat=await fs.stat(args.path+suffix);if(stat.isFile()){filename=args.path+suffix;break;}}catch{}}let source=await fs.readFile(filename,'utf8');if(filename.endsWith('page.tsx')){for(const [url,data] of Object.entries(photos))source=source.replaceAll(url,data);source=source.replace('href="/"','href="#"');}return {contents:source,loader:filename.endsWith('.tsx')?'tsx':filename.endsWith('.ts')?'ts':filename.endsWith('.json')?'json':'jsx',resolveDir:path.dirname(filename)};});}}]
});
const files=await fs.readdir(path.join(project,'.build'),{recursive:true});
const cssFiles=files.filter(f=>f.endsWith('.css'));
let css='';for(const name of cssFiles)css+=await fs.readFile(path.join(project,'.build',name),'utf8');
const fonts=files.filter(f=>f.endsWith('.woff2'));
const fontName=fonts.find(f=>f.includes('geist-sans-')&&!f.includes('ext'))||fonts.find(f=>!f.includes('mono'));
if(fontName){const bytes=await fs.readFile(path.join(project,'.build',fontName));css+='@font-face{font-family:SpectrumSans;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,'+bytes.toString('base64')+')}';}
css+=':root{--font-geist-sans:SpectrumSans,Arial,sans-serif;--font-geist-mono:ui-monospace,monospace}';
const script=result.outputFiles[0].text.replaceAll('</script','<\\/script');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const seo='<meta name="author" content="'+escape(creatorName)+'"><meta name="creator" content="'+escape(creatorName)+'"><meta name="designer" content="'+escape(creatorName)+'"><meta name="generator" content="'+escape(buildCredit)+'"><link rel="canonical" href="'+escape(siteUrl)+'"><meta property="og:type" content="website"><meta property="og:url" content="'+escape(siteUrl)+'"><meta property="og:title" content="'+escape(siteTitle)+'"><meta property="og:description" content="'+escape(siteDescription)+'"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="'+escape(siteTitle)+'"><meta name="twitter:description" content="'+escape(siteDescription)+'"><script type="application/ld+json">'+JSON.stringify(appSchema).replaceAll('<','\\u003c')+'</script>';
const html='<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="'+escape(siteDescription)+'"><title>'+escape(siteTitle)+'</title>'+seo+'<style>'+css+'</style></head><body><div id="root"></div><noscript>Please enable JavaScript to use Spectrum.</noscript><script>'+script+'</script></body></html>';
const dest=path.join(project,'outputs/Spectrum.html');
await fs.writeFile(dest,html);
if(!script.includes('data:image/jpeg;base64,'))throw Error('Missing embedded photos');
if(script.includes('/photos/landscape.jpg'))throw Error('Unresolved stock image path');
if((html.match(/data:image\/jpeg;base64,/g)||[]).length!==6)throw Error('Incorrect stock photo count');
console.log('Standalone app created: six embedded photos, bundled controls, stylesheet, and image processor.');
console.log('Bytes: '+Buffer.byteLength(html));
