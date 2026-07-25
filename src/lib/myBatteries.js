// Tracks which slugs *this device* has created — same shape as the reference
// repo's `bracketwebb_history`. Right now it just powers the "yours, on this
// device" list on the home page; later this is also the natural signal to
// restrict editing to the device that created a given link (today, any
// device holding the editToken from ownership.js can already edit — this
// list is a superset of that, purely for display).
const HISTORY_KEY = 'social-battery:my-batteries';
const MAX_HISTORY = 20;

export function listMyBatteries() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Records (or refreshes) a created battery at the front of the list. */
export function recordMyBattery(slug, name) {
  try {
    const withoutThisOne = listMyBatteries().filter(b => b.slug !== slug);
    const updated = [{ slug, name, createdAt: new Date().toISOString() }, ...withoutThisOne].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}
