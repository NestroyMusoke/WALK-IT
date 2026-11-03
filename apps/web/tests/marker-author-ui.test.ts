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

it('tells the author to build the folded target and serves both generated sheets',()=>{
 const page=readFileSync(new URL('../live.html',import.meta.url),'utf8');
 expect(page).toContain('href="/start-marker-a4-panel2.svg"');
 expect(page).toContain('fold to 90 degrees');
 expect(page).toContain('Never cut the 25 mm white border');
 expect(page).toContain('facing the crease');
 // The served sheets must be the generated ones, or the phone hands out paper that the
 // geometry does not describe and the fold lands in the wrong place.
 for(const name of ['start-marker-a4.svg','start-marker-a4-panel2.svg'])
  expect(readFileSync(new URL(`../public/${name}`,import.meta.url),'utf8'))
   .toBe(readFileSync(new URL(`../../../design/${name}`,import.meta.url),'utf8'));
 const config=JSON.parse(readFileSync(new URL('../../../config/vision.yaml',import.meta.url),'utf8'));
 const sheet=readFileSync(new URL('../public/start-marker-a4-panel2.svg',import.meta.url),'utf8');
 expect(sheet).toContain(`data-marker-id="${config.MARKER_COMPANION_ID}"`);
 expect(sheet).toContain(`data-panel-index="1"`);
 expect(sheet).toContain(`data-panel-count="${config.MARKER_PANEL_COUNT}"`);
 expect(sheet).toContain(`data-fold-angle-deg="${config.MARKER_FOLD_ANGLE_DEG}"`);
 expect(Number(/data-quiet-margin-mm="([^"]+)"/.exec(sheet)![1]))
  .toBeCloseTo(config.MARKER_PANEL_QUIET_MARGIN_M*1000,9);
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
