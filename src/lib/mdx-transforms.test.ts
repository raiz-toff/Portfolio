import { describe, expect, it } from 'vitest';
import {
  cssStringToObject,
  normalizeAttrName,
  rewriteInternalPath,
} from './mdx-transforms';

describe('rewriteInternalPath', () => {
  it('prefixes migrated section links with /docs and drops trailing slash', () => {
    expect(rewriteInternalPath('/labs/vlan-labs/')).toBe('/docs/labs/vlan-labs');
    expect(rewriteInternalPath('/ccna-labs/1.0-network-f/')).toBe('/docs/ccna-labs/1.0-network-f');
    expect(rewriteInternalPath('/projects/starlight-glide/')).toBe('/docs/projects/starlight-glide');
  });
  it('leaves static assets alone', () => {
    expect(rewriteInternalPath('/projects/network-map/ROAS.html')).toBe('/projects/network-map/ROAS.html');
  });
  it('leaves external and non-section URLs alone', () => {
    expect(rewriteInternalPath('https://example.com/labs/x')).toBe('https://example.com/labs/x');
    expect(rewriteInternalPath('/blog/some-post')).toBe('/blog/some-post');
  });
  it('preserves hash/query suffixes', () => {
    expect(rewriteInternalPath('/labs/vlan-labs/#setup')).toBe('/docs/labs/vlan-labs#setup');
  });
});

describe('cssStringToObject', () => {
  it('camelCases properties and keeps custom properties', () => {
    expect(cssStringToObject('background-color: red; --sl-x: 1px')).toEqual({
      backgroundColor: 'red',
      '--sl-x': '1px',
    });
  });
  it('skips malformed declarations', () => {
    expect(cssStringToObject('color red; ;')).toEqual({});
  });
});

describe('normalizeAttrName', () => {
  it('maps HTML-isms to JSX', () => {
    expect(normalizeAttrName('class')).toBe('className');
    expect(normalizeAttrName('for')).toBe('htmlFor');
    expect(normalizeAttrName('stroke-width')).toBe('strokeWidth');
    expect(normalizeAttrName('xlink:href')).toBe('xlinkHref');
  });
  it('keeps data-* and aria-* hyphenated', () => {
    expect(normalizeAttrName('data-theme')).toBe('data-theme');
    expect(normalizeAttrName('aria-label')).toBe('aria-label');
  });
});
