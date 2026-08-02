import { describe, it, expect } from 'vitest';
import { computeBatteryState, WAKE_VALUE, WORK_END_VALUE, FLOOR_VALUE } from './model.js';

const config = {
  timezone: 'America/Chicago',
  wakeTime: '07:00',
  workEndTime: '18:00',
  sleepTime: '00:00',
  lastOverride: null,
};

// July -> Chicago is on CDT (UTC-5)
function chicagoTime(hhmm) {
  return new Date(`2026-07-25T${hhmm}:00-05:00`);
}

describe('computeBatteryState — default trajectory', () => {
  it('is full at wake time', () => {
    expect(computeBatteryState(config, chicagoTime('07:00')).level).toBe(WAKE_VALUE);
  });

  it('hits the work-end waypoint exactly', () => {
    expect(computeBatteryState(config, chicagoTime('18:00')).level).toBe(WORK_END_VALUE);
  });

  it('interpolates between wake and work-end', () => {
    // 07:00 -> 18:00 is 11h; 12:30 is 5h30m in, so 5.5/11 of the way from 100 to 50
    expect(computeBatteryState(config, chicagoTime('12:30')).level).toBeCloseTo(75, 1);
  });
});

describe('computeBatteryState — asleep / recharging window', () => {
  it('reports awake:false with the floor level before wake time, and the correct next wake', () => {
    const state = computeBatteryState(config, chicagoTime('03:00'));
    expect(state.awake).toBe(false);
    expect(state.level).toBe(FLOOR_VALUE);
    expect(state.nextWake.toISOString()).toBe(chicagoTime('07:00').toISOString());
  });
});

describe('computeBatteryState — manual override', () => {
  it('overriding to 100% decays slower than the default line for the rest of the day', () => {
    const overridden = { ...config, lastOverride: { at: chicagoTime('12:00').toISOString(), value: 100 } };
    const defaultLevel = computeBatteryState(config, chicagoTime('21:00')).level;
    const overriddenLevel = computeBatteryState(overridden, chicagoTime('21:00')).level;
    expect(overriddenLevel).toBeGreaterThan(defaultLevel);
  });

  it('overriding to a low value still decays toward the floor by sleep time', () => {
    const low = { ...config, lastOverride: { at: chicagoTime('12:00').toISOString(), value: 20 } };
    expect(computeBatteryState(low, chicagoTime('12:00')).level).toBe(20);
    const later = computeBatteryState(low, chicagoTime('20:00')).level;
    expect(later).toBeLessThan(20);
    expect(later).toBeGreaterThanOrEqual(FLOOR_VALUE);
  });

  it('ignores a stale override from a previous day once wake time is crossed again', () => {
    const stale = { ...config, lastOverride: { at: '2026-07-24T17:00:00-05:00', value: 90 } };
    expect(computeBatteryState(stale, chicagoTime('07:00')).level).toBe(WAKE_VALUE);
  });

  it("only today's override applies — a same-day override takes effect immediately", () => {
    const twiceOverridden = { ...config, lastOverride: { at: chicagoTime('15:00').toISOString(), value: 30 } };
    expect(computeBatteryState(twiceOverridden, chicagoTime('15:00')).level).toBe(30);
  });

  it('reports overridden: true only when an active override is actually applied', () => {
    expect(computeBatteryState(config, chicagoTime('12:00')).overridden).toBe(false);

    const active = { ...config, lastOverride: { at: chicagoTime('12:00').toISOString(), value: 40 } };
    expect(computeBatteryState(active, chicagoTime('12:30')).overridden).toBe(true);

    const stale = { ...config, lastOverride: { at: '2026-07-24T17:00:00-05:00', value: 90 } };
    expect(computeBatteryState(stale, chicagoTime('07:00')).overridden).toBe(false);
  });
});
