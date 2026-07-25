import { describe, it, expect } from 'vitest';
import { THEMES, THEME_KEYS, DEFAULT_THEME, bandForLevel, bandRanges, gradientStops, bandMidpoint } from './themes.js';

describe('every theme (structural invariants the rest of the app relies on)', () => {
  it.each(THEME_KEYS)('%s: bands are sorted ascending and the last one reaches 100', key => {
    const bands = THEMES[key].bands;
    expect(bands.length).toBeGreaterThan(0);
    expect(bands[bands.length - 1].max).toBe(100);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i].max).toBeGreaterThan(bands[i - 1].max);
    }
  });

  it.each(THEME_KEYS)('%s: every band has a color, face, and mood', key => {
    for (const band of THEMES[key].bands) {
      expect(typeof band.color).toBe('string');
      expect(band.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(typeof band.face).toBe('string');
      expect(band.face.length).toBeGreaterThan(0);
      expect(typeof band.mood).toBe('string');
      expect(band.mood.length).toBeGreaterThan(0);
    }
  });

  it('DEFAULT_THEME is itself a valid key', () => {
    expect(THEME_KEYS).toContain(DEFAULT_THEME);
  });
});

describe('bandForLevel', () => {
  it('covers the full 0-100 range with no gaps, for every theme', () => {
    for (const key of THEME_KEYS) {
      for (let level = 0; level <= 100; level += 5) {
        expect(bandForLevel(key, level)).toBeDefined();
      }
    }
  });

  it('falls back to the default theme for an unknown key', () => {
    expect(bandForLevel('not-a-real-theme', 50)).toEqual(bandForLevel(DEFAULT_THEME, 50));
  });
});

describe('the new "zones" theme specifically', () => {
  it('runs blue -> green -> yellow -> red, in that order', () => {
    const colors = THEMES.zones.bands.map(b => b.color);
    expect(colors).toEqual(['#3b82f6', '#22c55e', '#eab308', '#ef4444']);
  });

  it('is picked up automatically by the generic band helpers', () => {
    const ranges = bandRanges('zones');
    expect(ranges).toEqual([
      { max: 25, color: '#3b82f6', face: '😔', mood: 'Blue zone - low and slow', from: 0, to: 25 },
      { max: 50, color: '#22c55e', face: '🙂', mood: 'Green zone - calm and ready', from: 25, to: 50 },
      { max: 75, color: '#eab308', face: '😬', mood: 'Yellow zone - wound up', from: 50, to: 75 },
      { max: 100, color: '#ef4444', face: '🤯', mood: 'Red zone - maxed out', from: 75, to: 100 },
    ]);
    expect(gradientStops('zones')).toHaveLength(4);
    expect(bandMidpoint(ranges[0])).toBe(13); // (0+25)/2, rounded
    expect(bandMidpoint(ranges[3])).toBe(88); // (75+100)/2, rounded
  });

  it('none of its UI-facing mood text uses an em-dash', () => {
    for (const band of THEMES.zones.bands) {
      expect(band.mood).not.toMatch(/—/);
    }
  });
});
