import { describe, expect, it } from 'vitest';
import { postDate, readingMinutes } from './content-utils';

describe('postDate', () => {
  it('passes Date instances through', () => {
    const d = new Date('2026-01-01');
    expect(postDate(d)).toBe(d);
  });
  it('parses date strings', () => {
    expect(postDate('2026-01-01')?.getUTCFullYear()).toBe(2026);
  });
  it('returns null for empty string, garbage, and undefined', () => {
    expect(postDate('')).toBeNull();
    expect(postDate('not a date')).toBeNull();
    expect(postDate(undefined)).toBeNull();
  });
});

describe('readingMinutes', () => {
  it('never returns less than 1', () => {
    expect(readingMinutes('short text')).toBe(1);
  });
  it('rounds by ~220 wpm', () => {
    expect(readingMinutes(Array(2200).fill('word').join(' '))).toBe(10);
  });
});
