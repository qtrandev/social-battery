// Tracks batteries *this device* has viewed but doesn't own — so someone
// handed a link can find their way back to it from the home page even
// though they have no editToken for it. Deliberately separate from
// myBatteries.js's "yours, on this device" list, which is for owned batteries.
const HISTORY_KEY = 'social-battery:recently-viewed';
const MAX_HISTORY = 20;

export function listRecentlyViewed() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Records (or refreshes) a viewed battery at the front of the list. */
export function recordRecentlyViewed(slug, name) {
  try {
    const withoutThisOne = listRecentlyViewed().filter(b => b.slug !== slug);
    const updated = [{ slug, name, viewedAt: new Date().toISOString() }, ...withoutThisOne].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}
