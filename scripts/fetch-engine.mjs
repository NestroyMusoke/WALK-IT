import {cpSync,existsSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
// npm ci verifies the registry integrity in package-lock.json. Keep this distribution unmodified.
const source=resolve('node_modules/@8thwall/engine-binary');
const pinned=JSON.parse(readFileSync('package.json','utf8')).devDependencies['@8thwall/engine-binary'];
if(JSON.parse(readFileSync(join(source,'package.json'),'utf8')).version!==pinned)throw Error('SDK version differs from pin');
const target=resolve('apps/web/public/vendor/xr');
if(!existsSync(join(source,'dist/xr.js')))throw Error('Official SDK entry missing');
mkdirSync(target,{recursive:true});cpSync(join(source,'dist'),target,{recursive:true});
const license=[join(source,'LICENSE'),join(source,'dist/LICENSE')].find(existsSync);
if(!license)throw Error('SDK license missing');
cpSync(license,join(target,'LICENSE'));
console.log(`SDK ${pinned} staged privately for the local web build; do not commit vendor files.`);
