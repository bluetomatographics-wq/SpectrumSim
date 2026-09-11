import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire,isBuiltin} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {siteUrl,siteTitle,siteDescription,appSchema,creatorName,buildCredit} from '../lib/site-seo.ts';

const project=path.resolve(import.meta.dirname,'..');
const output=path.join(project,'outputs/public_html');
const require=createRequire(path.join(project,'package.json'));
const sharp=require('sharp');
const esbuild=require('esbuild');
await fs.mkdir(path.join(output,'assets'),{recursive:true});
const assetFiles=new Set();
async function asset(name,extension,bytes){
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const filename=`${name}.${hash}.${extension}`;
  await fs.writeFile(path.join(output,'assets',filename),bytes);
  assetFiles.add(filename);
  return './assets/'+filename;
}

const photos={};
for(const id of ['landscape','city','people','animal','flowers','coast']){
  const input=await fs.readFile(path.join(project,'public/photos',id+'.jpg'));
  const full=await sharp(input).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:6}).toBuffer();
  const thumbnail=await sharp(input).rotate().resize(320,160,{fit:'cover',position:'centre'}).webp({quality:75,effort:5}).toBuffer();
  photos['/photos/'+id+'.jpg']={src:await asset(id,'webp',full),thumbnail:await asset(id+'-thumb','webp',thumbnail)};
}

function resolver(){return {name:'portable-public-resolver',setup(build){
  build.onResolve({filter:/.*/},args=>{
    if(isBuiltin(args.path))return {path:args.path,external:true};
    const base=args.resolveDir||project;
    const target=args.path.startsWith('@/')?path.join(project,args.path.slice(2)):args.path.startsWith('.')?path.resolve(base,args.path):createRequire(path.join(base,'resolver.cjs')).resolve(args.path);
    return {path:target,namespace:'portable'};
  });
  build.onLoad({filter:/.*/,namespace:'portable'},async args=>{
    let filename=args.path;
    for(const suffix of ['', '.tsx','.ts','.js','/index.tsx','/index.ts','/index.js']){try{if((await fs.stat(args.path+suffix)).isFile()){filename=args.path+suffix;break;}}catch{}}
    let source=await fs.readFile(filename,'utf8');
    if(filename.replaceAll('\\','/').endsWith('/app/page.tsx')){
      for(const [url,value] of Object.entries(photos)){
        const match=`src:'${url}'`;
        if(!source.includes(match))throw Error('Missing photo entry '+url);
        source=source.replace(match,`src:${JSON.stringify(value.src)},thumbnail:${JSON.stringify(value.thumbnail)}`);
      }
      source=source.replace('href="/"','href="./"');
    }
    return {contents:source,loader:filename.endsWith('.tsx')?'tsx':filename.endsWith('.ts')?'ts':filename.endsWith('.json')?'json':'jsx',resolveDir:path.dirname(filename)};
  });
}};}
const base={absWorkingDir:project,bundle:true,write:false,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},tsconfigRaw:{compilerOptions:{jsx:'react-jsx',target:'ES2022'}},plugins:[resolver()]};
const client=await esbuild.build({...base,platform:'browser',target:['chrome110','safari16','firefox110'],format:'iife',stdin:{contents:"import {hydrateRoot} from 'react-dom/client';import App from './app/page';hydrateRoot(document.getElementById('root'),<App/>,{identifierPrefix:'spectrum-'});",loader:'tsx',resolveDir:project,sourcefile:'public-client.tsx'}});
const script=await asset('spectrum','js',client.outputFiles[0].contents);
const server=await esbuild.build({...base,platform:'node',target:['node22'],format:'esm',banner:{js:"import {createRequire as __createRequire} from 'node:module';const require=__createRequire(import.meta.url);"},stdin:{contents:"import {renderToString} from 'react-dom/server';import App from './app/page';export const html=renderToString(<App/>,{identifierPrefix:'spectrum-'});",loader:'tsx',resolveDir:project,sourcefile:'public-prerender.tsx'}});
const renderPath=path.join(project,'.build/public-render.mjs');
await fs.writeFile(renderPath,server.outputFiles[0].contents);
const {html:body}=await import(pathToFileURL(renderPath).href+'?build='+Date.now());

const staticRoot=path.join(project,'.build');
const files=await fs.readdir(staticRoot,{recursive:true});
let css='';
for(const filename of files.filter(name=>name.endsWith('.css')))css+=await fs.readFile(path.join(staticRoot,filename),'utf8');
// The prerendered app uses one local variable font, without framework font URLs.
css=css.replace(/@font-face\s*\{[^}]*\}/g,'');
const fonts=files.filter(name=>name.endsWith('.woff2'));
const fontName=fonts.find(name=>name.includes('geist-sans-')&&!name.includes('ext'))||fonts.find(name=>!name.includes('mono'));
if(!fontName)throw Error('No built font found');
const font=await asset('spectrum-sans','woff2',await fs.readFile(path.join(staticRoot,fontName)));
css+=`@font-face{font-family:SpectrumSans;font-weight:100 900;font-display:swap;src:url("${path.posix.basename(font)}") format("woff2")} :root{--font-geist-sans:SpectrumSans,Arial,sans-serif;--font-geist-mono:ui-monospace,monospace}`;
const stylesheet=await asset('spectrum','css',Buffer.from(css));
const icon=await fs.readFile(path.join(project,'public/favicon.svg'),'utf8');
await fs.writeFile(path.join(output,'favicon.svg'),icon);
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const schema=JSON.stringify(appSchema).replaceAll('<','\\u003c');
const html=`<!doctype html>
<html lang="en" class="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(siteTitle)}</title><meta name="description" content="${escape(siteDescription)}">
<meta name="author" content="${escape(creatorName)}"><meta name="creator" content="${escape(creatorName)}"><meta name="designer" content="${escape(creatorName)}"><meta name="generator" content="${escape(buildCredit)}">
<link rel="canonical" href="${escape(siteUrl)}"><meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#111413"><link rel="icon" type="image/svg+xml" href="./favicon.svg">
<meta property="og:type" content="website"><meta property="og:site_name" content="Spectrum"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${escape(siteTitle)}"><meta property="og:description" content="${escape(siteDescription)}"><meta property="og:url" content="${escape(siteUrl)}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(siteTitle)}"><meta name="twitter:description" content="${escape(siteDescription)}">
<link rel="preload" href="${escape(font)}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${escape(stylesheet)}"><script type="application/ld+json">${schema}</script>
<script src="${escape(script)}" defer></script>
</head><body><noscript><style>.processing{display:none!important}.initial-preview{opacity:1!important}</style><p class="no-script-notice">Enable JavaScript to apply effects, upload photos, and export images. You can still view the sample photo and read about Spectrum below.</p></noscript><div id="root">${body}</div></body></html>`;
await fs.writeFile(path.join(output,'index.html'),html);
await fs.writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`);
await fs.writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(siteUrl)}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod></url></urlset>\n`);
await fs.writeFile(path.join(output,'.htaccess'),`DirectoryIndex index.html
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType image/webp .webp
  AddType font/woff2 .woff2
  AddType image/svg+xml .svg
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json application/xml text/xml image/svg+xml
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\\.[a-f0-9]{12}\\.(js|css|webp|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "^(index\\.html|robots\\.txt|sitemap\\.xml)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
`);
// Remove only stale generated assets inside this explicit output directory.
for(const filename of await fs.readdir(path.join(output,'assets'))){
  if(!assetFiles.has(filename)&&/^[a-z-]+\.[a-f0-9]{12}\.(webp|css|js|woff2)$/.test(filename))await fs.unlink(path.join(output,'assets',filename));
}
const sizes={html:Buffer.byteLength(html),javascript:client.outputFiles[0].contents.length,stylesheet:Buffer.byteLength(css),assets:0};
for(const filename of assetFiles)sizes.assets+=(await fs.stat(path.join(output,'assets',filename))).size;
const initial=[Buffer.from(html),client.outputFiles[0].contents,Buffer.from(css)];
const networkEstimate=initial.reduce((sum,bytes)=>sum+gzipSync(bytes).length,0)+(await fs.stat(path.join(output,font))).size+(await fs.stat(path.join(output,photos['/photos/landscape.jpg'].src))).size;
const report={url:siteUrl,...sizes,packageBytes:sizes.assets+sizes.html,estimatedCompressedInitialBytes:networkEstimate,files:[...assetFiles],script,stylesheet,font,photos};
await fs.writeFile(path.join(project,'.build/public-build-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({url:siteUrl,htmlBytes:sizes.html,totalBytes:report.packageBytes,estimatedCompressedInitialBytes:networkEstimate,prerendered:body.includes('Are these real infrared')},null,2));
