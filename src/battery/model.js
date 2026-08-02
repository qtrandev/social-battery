import { dateStringInZone, zonedTimeToUtc } from '../lib/time.js';
import { valueAt, reanchorTimeline } from '../lib/gauge.js';

// The battery-specific waypoints. Everything above this file (gauge.js,
// time.js) has no idea these numbers exist.
export const WAKE_VALUE = 100;
export const WORK_END_VALUE = 50;
export const FLOOR_VALUE = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The wake→sleep window containing `now`, or the next wake time if `now` falls in the asleep gap. */
export function resolveWindow(config, now) {
  const { timezone, wakeTime, workEndTime, sleepTime } = config;

  for (const dayOffsetMs of [0, -DAY_MS]) {
    const dateStr = dateStringInZone(new Date(now.getTime() + dayOffsetMs), timezone);
    const wake = zonedTimeToUtc(dateStr, wakeTime, timezone);
    let sleep = zonedTimeToUtc(dateStr, sleepTime, timezone);
    if (sleep <= wake) sleep = new Date(sleep.getTime() + DAY_MS);
    let workEnd = zonedTimeToUtc(dateStr, workEndTime, timezone);
    if (workEnd <= wake) workEnd = new Date(workEnd.getTime() + DAY_MS);

    if (now >= wake && now < sleep) {
      return { awake: true, wake, workEnd, sleep };
    }
  }

  const dateStr = dateStringInZone(now, timezone);
  let nextWake = zonedTimeToUtc(dateStr, wakeTime, timezone);
  if (nextWake <= now) nextWake = new Date(nextWake.getTime() + DAY_MS);
  return { awake: false, nextWake };
}

/**
 * Current level (0-100) plus enough context for the UI to render either the
 * live gauge or the "recharging" asleep state.
 */
export function computeBatteryState(config, now = new Date()) {
  const window = resolveWindow(config, now);

  if (!window.awake) {
    return { level: FLOOR_VALUE, awake: false, nextWake: window.nextWake };
  }

  const { wake, workEnd, sleep } = window;
  let timeline = [
    { at: wake, value: WAKE_VALUE },
    { at: workEnd, value: WORK_END_VALUE },
    { at: sleep, value: FLOOR_VALUE },
  ];

  let overridden = false;
  const override = config.lastOverride;
  if (override?.at) {
    const overrideAt = new Date(override.at);
    // Only today's override re-anchors the line — a stale one from a prior
    // wake window is ignored, and the default trajectory resumes untouched.
    if (overrideAt >= wake && overrideAt < sleep) {
      timeline = reanchorTimeline(overrideAt, override.value, sleep, FLOOR_VALUE);
      overridden = true;
    }
  }

  const level = valueAt(timeline, now);
  return { level, awake: true, wake, workEnd, sleep, timeline, overridden };
}
