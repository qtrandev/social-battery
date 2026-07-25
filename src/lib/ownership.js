// Possession of the editToken (stashed here at creation time) is the only
// "auth" this app has — same trust model as the reference repo's local
// drafts, just extended to allow updates to an existing slug.
const KEY_PREFIX = 'social-battery:';

export function getEditToken(slug) {
  try {
    return localStorage.getItem(KEY_PREFIX + slug);
  } catch {
    return null;
  }
}

export function setEditToken(slug, token) {
  try {
    localStorage.setItem(KEY_PREFIX + slug, token);
  } catch {}
}

export function clearEditToken(slug) {
  try {
    localStorage.removeItem(KEY_PREFIX + slug);
  } catch {}
}
