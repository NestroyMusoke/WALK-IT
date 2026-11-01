import {expect,it} from 'vitest';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {App} from '../src/welcome';

it('explains the journey and preserves the three visual signatures',()=>{
  const html=renderToStaticMarkup(<App/>);
  expect((html.match(/<h1\b/g)??[])).toHaveLength(1);
  expect(html).toContain('data-layout="editorial"');
  expect(html).toContain('Start at a place people know');
  expect(html).toContain('Arrive at the exact place');
  expect(html).toContain('mmw-root');
  expect(html).toContain('hairline-route-stones.html');
  expect(html).toContain('liquid-action');
  expect(html).toContain('href="./live.html"');
  expect(html).toContain('href="./evidence.html"');
  expect(html).not.toContain('—');
});
