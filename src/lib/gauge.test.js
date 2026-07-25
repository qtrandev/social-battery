import { describe, it, expect } from 'vitest';
import { valueAt, reanchorTimeline } from './gauge.js';

const timeline = [
  { at: new Date('2026-07-25T07:00:00Z'), value: 100 },
  { at: new Date('2026-07-25T18:00:00Z'), value: 50 },
  { at: new Date('2026-07-26T00:00:00Z'), value: 5 },
];

describe('valueAt', () => {
  it('clamps to the first value before the timeline starts', () => {
    expect(valueAt(timeline, new Date('2026-07-25T00:00:00Z'))).toBe(100);
  });

  it('clamps to the last value after the timeline ends', () => {
    expect(valueAt(timeline, new Date('2026-07-27T00:00:00Z'))).toBe(5);
  });

  it('returns exact waypoint values', () => {
    expect(valueAt(timeline, timeline[1].at)).toBe(50);
  });

  it('interpolates linearly between two waypoints', () => {
    // halfway between 07:00 (100) and 18:00 (50) is 12:30
    expect(valueAt(timeline, new Date('2026-07-25T12:30:00Z'))).toBeCloseTo(75, 5);
  });
});

describe('reanchorTimeline', () => {
  it('discards prior points and draws a fresh two-point line', () => {
    const from = new Date('2026-07-25T12:00:00Z');
    const to = new Date('2026-07-26T00:00:00Z');
    expect(reanchorTimeline(from, 100, to, 5)).toEqual([
      { at: from, value: 100 },
      { at: to, value: 5 },
    ]);
  });
});
