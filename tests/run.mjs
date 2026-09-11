import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
process.chdir(path.resolve(import.meta.dirname,'..'));
await fs.mkdir('.build',{recursive:true});
for(const name of ['spectrum','viewer','wheel','creative','models']){
 const result=spawnSync(process.execPath,['--experimental-transform-types','--import','./tests/register.mjs',`tests/verify-${name}.mts`],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
