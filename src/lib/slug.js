// Shared between the frontend (CreateBattery form) and Netlify functions —
// import path stays relative so esbuild can bundle it into the function.

export const SLUG_REGEX = /^[a-z0-9-]{2,40}$/;
export const VERSION_REGEX = /^v[1-9][0-9]*$/;

export const RESERVED_SLUGS = new Set([
  'new', 'about', 'faq', 'help', 'contact', 'admin', 'login',
  'signup', 'settings', 'profile', 'api', 'assets', 'static',
  'robots', 'sitemap', 'favicon',
]);

export function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_REGEX.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function isValidVersion(version) {
  return typeof version === 'string' && VERSION_REGEX.test(version);
}
