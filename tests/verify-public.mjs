import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {siteUrl,siteTitle,siteDescription} from '../lib/site-seo.ts';
const root=path.resolve('outputs/public_html');
assert.deepEqual((await fs.readdir(root)).sort(),['.htaccess','assets','favicon.svg','index.html','robots.txt','sitemap.xml','LICENSE.txt','THIRD-PARTY-LICENSES.txt'].sort(),'Only public files belong in the upload package');
const report=JSON.parse(await fs.readFile('./.build/public-build-report.json','utf8'));
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
const head=html.slice(0,html.indexOf('</head>'));
const body=html.slice(html.indexOf('<body>'));
assert.ok(body.includes('mailto:info@spectrumsimulations.com'));
assert.ok(body.includes('David B. Stevens'));
assert.ok(body.includes('BUILT BY GPT6 ASTRA'));
assert.ok((await fs.readFile(path.join(root,'THIRD-PARTY-LICENSES.txt'),'utf8')).includes('SIL OPEN FONT LICENSE'));
const escaped=text=>text.replaceAll('&','&amp;');
assert.ok(head.includes(`<title>${escaped(siteTitle)}</title>`));
assert.ok(head.includes(`name="description" content="${escaped(siteDescription)}"`));
assert.equal((head.match(/rel="canonical"/g)||[]).length,1);
assert.ok(head.includes(`rel="canonical" href="${siteUrl}"`));
for(const field of ['og:title','og:description','og:url','og:type','twitter:title','twitter:description','twitter:card'])assert.ok(head.includes('"'+field+'"'),field);
assert.ok(!head.includes('noindex'));
const schema=JSON.parse(head.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]);
assert.equal(schema['@type'],'WebApplication');assert.equal(schema.url,siteUrl);assert.equal(schema.name,'Spectrum');
assert.equal(schema.aggregateRating,undefined);assert.equal(schema.review,undefined);
assert.ok(schema.description.includes('not measurements'));
for(const phrase of ['Are these real infrared or ultraviolet images?','Are uploaded photos sent to a server?','Can I save my results?','radio, microwave, thermal infrared','Effect strength','Favorite settings'])assert.ok(body.includes(phrase),'Missing pre-rendered content: '+phrase);
assert.equal((body.match(/<h1[ >]/g)||[]).length,1);
assert.equal((body.match(/class="photo-tile /g)||[]).length,6);
assert.equal((body.match(/loading="lazy"/g)||[]).length,6);
assert.ok(body.includes('fetchPriority="high"'));
assert.ok(!html.includes('data:image/'));assert.ok(!html.includes('src="/photos/'));assert.ok(!html.includes('/_next/'));
const refs=[...html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g)].map(match=>match[1]);
for(const ref of refs){const filename=path.resolve(root,ref);assert.ok(filename.startsWith(root+path.sep));assert.ok((await fs.stat(filename)).isFile(),ref);}
for(const filename of report.files){
  const bytes=await fs.readFile(path.join(root,'assets',filename));
  assert.ok(filename.includes(createHash('sha256').update(bytes).digest('hex').slice(0,12)),'Stale asset hash '+filename);
}
const script=await fs.readFile(path.join(root,report.script),'utf8');new vm.Script(script);
assert.ok(script.includes('spectrum-'));assert.ok(script.includes('Inspect pixels'));assert.ok(script.includes('Spectrum animation'));
assert.ok(!script.includes('data:image/jpeg;base64,'));
const css=await fs.readFile(path.join(root,report.stylesheet),'utf8');
assert.ok(/\.view-tabs-root>\.viewer\{flex:(?:none|0 0 auto)\}/.test(css),'Keep the corrected viewer height');
for(const [,ref] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)){assert.ok(!ref.startsWith('http')&&!ref.startsWith('/'),'Unexpected remote or root-relative CSS asset');await fs.stat(path.resolve(root,'assets',ref));}
const runtimeRequire=createRequire(import.meta.url);
const sharp=runtimeRequire('sharp');
for(const photo of Object.values(report.photos)){
  const full=await sharp(await fs.readFile(path.join(root,photo.src))).metadata();
  assert.equal(full.format,'webp');assert.ok(Math.max(full.width,full.height)<=1600);
  const thumb=await sharp(await fs.readFile(path.join(root,photo.thumbnail))).metadata();assert.equal(thumb.width,320);assert.equal(thumb.height,160);
}
const robots=await fs.readFile(path.join(root,'robots.txt'),'utf8');assert.ok(robots.includes(`Sitemap: ${siteUrl}sitemap.xml`));assert.ok(!robots.includes('Disallow: /'));
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');assert.ok(sitemap.includes(`<loc>${siteUrl}</loc>`));
const apache=await fs.readFile(path.join(root,'.htaccess'),'utf8');assert.ok(apache.includes('DirectoryIndex index.html'));assert.ok(apache.includes('DEFLATE'));assert.ok(apache.includes('immutable'));assert.ok(apache.includes('no-cache'));
assert.ok(report.packageBytes<3_000_000);
console.log('PASS: static search-readable content, canonical and sharing metadata, structured app data, local asset links, image dimensions, lazy thumbnails, font path, asset hashes, script parsing, caching rules, sitemap, robots, and viewer-height fix.');
