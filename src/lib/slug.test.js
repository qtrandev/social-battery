import { describe, it, expect } from 'vitest';
import { SLUG_REGEX, RESERVED_SLUGS, isValidSlug, isValidVersion } from './slug.js';

describe('isValidSlug', () => {
  it('accepts well-formed, non-reserved keys', () => {
    expect(isValidSlug('quyen')).toBe(true);
    expect(isValidSlug('mike-2')).toBe(true);
  });

  it('rejects malformed keys', () => {
    expect(isValidSlug('Quyen')).toBe(false); // uppercase not allowed
    expect(isValidSlug('a')).toBe(false); // below min length
    expect(isValidSlug('has space')).toBe(false);
    expect(isValidSlug('under_score')).toBe(false); // hyphens only, not underscores
  });

  it('rejects every entry in the reserved list', () => {
    for (const word of RESERVED_SLUGS) {
      expect(isValidSlug(word), `expected "${word}" to be rejected as reserved`).toBe(false);
    }
  });

  it('specifically blocks "new" so a user config can never shadow the /new route', () => {
    expect(RESERVED_SLUGS.has('new')).toBe(true);
    expect(SLUG_REGEX.test('new')).toBe(true); // well-formed on its own...
    expect(isValidSlug('new')).toBe(false); // ...but still rejected, because reserved
  });
});

describe('isValidVersion', () => {
  it('accepts v1, v2, ... with no leading zero', () => {
    expect(isValidVersion('v1')).toBe(true);
    expect(isValidVersion('v42')).toBe(true);
  });

  it('rejects v0, bare numbers, and non-version words', () => {
    expect(isValidVersion('v0')).toBe(false);
    expect(isValidVersion('2')).toBe(false);
    expect(isValidVersion('latest')).toBe(false);
  });
});
