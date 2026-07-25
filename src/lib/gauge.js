// Generic time-driven gauge engine: a value that moves toward a target by a
// target time along a piecewise-linear timeline, and can be manually
// re-anchored at any point. No knowledge of "battery" or any other domain
// lives here — this is the part meant to lift out into a shared template.

/** Value of a piecewise-linear timeline at instant `at`, clamped at both ends. */
export function valueAt(timeline, at) {
  const points = [...timeline].sort((a, b) => a.at - b.at);
  const first = points[0];
  const last = points[points.length - 1];
  if (at <= first.at) return first.value;
  if (at >= last.at) return last.value;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (at >= a.at && at <= b.at) {
      const span = b.at - a.at;
      const t = span === 0 ? 0 : (at - a.at) / span;
      return a.value + (b.value - a.value) * t;
    }
  }
  return last.value;
}

/**
 * Discard everything after `fromAt` and draw a fresh straight line from
 * (fromAt, fromValue) to (toAt, toValue). This is the manual-override trick.
 */
export function reanchorTimeline(fromAt, fromValue, toAt, toValue) {
  return [
    { at: fromAt, value: fromValue },
    { at: toAt, value: toValue },
  ];
}
