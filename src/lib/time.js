// Generic timezone-aware wall-clock helpers. Not battery-specific — any
// "wake/sleep time in a config's own timezone" tool can reuse this file.

const HHMM_REGEX = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

export function isValidHHMM(value) {
  return typeof value === 'string' && HHMM_REGEX.test(value);
}

/** "2026-07-25" for the given instant, as seen in `timeZone`. */
export function dateStringInZone(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return dtf.format(date); // en-CA gives YYYY-MM-DD
}

/** Offset (minutes, UTC minus local) of `timeZone` at the given instant. */
function timezoneOffsetMinutes(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map(p => [p.type, p.value]));
  const asIfUTC = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    +parts.hour, +parts.minute, +parts.second
  );
  return (asIfUTC - date.getTime()) / 60000;
}

/**
 * Resolve "HH:MM on dateStr, as wall-clock time in timeZone" to the actual UTC instant.
 * dateStr: "YYYY-MM-DD", time: "HH:MM"
 */
export function zonedTimeToUtc(dateStr, time, timeZone) {
  const guess = new Date(`${dateStr}T${time}:00Z`);
  const offset = timezoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60000);
}
