import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
test('web dependencies are exact, locked and the engine stays outside Git',()=>{
  const manifest=JSON.parse(readFileSync('package.json','utf8'));
  const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
  for(const [name,version] of Object.entries({...manifest.dependencies,...manifest.devDependencies})){
    assert.match(version,/^\d+\.\d+\.\d+$/);
    assert.equal(lock.packages[`node_modules/${name}`].version,version);
    assert.ok(lock.packages[`node_modules/${name}`].integrity);
  }
  assert.ok(existsSync('apps/web/public/vendor/xr/xr.js'));
  assert.ok(existsSync('apps/web/public/vendor/xr/LICENSE'));
  const ignored=execFileSync('git',['check-ignore','apps/web/public/vendor/xr/xr.js'],{encoding:'utf8'});
  assert.match(ignored,/vendor/);
  assert.equal(execFileSync('git',['ls-files','apps/web/public/vendor'],{encoding:'utf8'}).trim(),'');
});
