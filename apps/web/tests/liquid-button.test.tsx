import {expect,it} from 'vitest';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LiquidButton} from '../src/components/ui/liquid-glass-button';

it('keeps navigation as a link while adding the liquid treatment',()=>{
  const html=renderToStaticMarkup(<LiquidButton asChild><a href="./live.html">Open field build</a></LiquidButton>);
  expect(html).toContain('<a ');
  expect(html).toContain('href="./live.html"');
  expect(html).toContain('liquid-action');
  expect(html).not.toContain('<button');
});

it('keeps a disabled action a native disabled button',()=>{
  const html=renderToStaticMarkup(<LiquidButton disabled>Save route</LiquidButton>);
  expect(html).toContain('<button');
  expect(html).toContain('disabled=""');
});
