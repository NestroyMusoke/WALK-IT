import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

it('gives the author a printable marker and one-walk capture instructions',()=>{
 const page=readFileSync(new URL('../live.html',import.meta.url),'utf8');
 expect(page).toContain('href="/start-marker-a4.svg"');
 expect(page).toContain('check bar measures 100 mm');
 expect(page).toContain('first ten recorded frames');
 expect(page).toContain('one continuous walk');
 expect(page).toContain('id="check-author-marker"');
 expect(page).toContain('id="author-marker-status"');
});

it('allows the protected phone marker check enough time for upload and OpenCV startup',()=>{
 const config=JSON.parse(readFileSync(new URL('../../../config/vision.yaml',import.meta.url),'utf8'));
 expect(config.MARKER_SCAN_REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(30000);
 const source=readFileSync(new URL('../src/live.ts',import.meta.url),'utf8');
 expect(source).toContain('AbortSignal.timeout(settings.MARKER_SCAN_REQUEST_TIMEOUT_MS)');
});

it('starts the reviewed route upload automatically after the final image approval',()=>{
 const source=readFileSync(new URL('../src/capture-ui.ts',import.meta.url),'utf8');
 expect(source).toMatch(/else\{this\.clearReview\(\);[^\n]+void this\.save\(\)/);
});
