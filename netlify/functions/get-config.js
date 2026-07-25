import { getStore } from '@netlify/blobs';
import { isValidSlug, isValidVersion } from '../../src/lib/slug.js';

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...extra } });

function strip(record) {
  if (!record) return record;
  const { editToken, ...rest } = record;
  return rest;
}

export default async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  const version = url.searchParams.get('version');

  if (!isValidSlug(slug)) return json({ error: 'invalid_slug' }, 400);
  if (version && !isValidVersion(version)) return json({ error: 'invalid_version' }, 400);

  try {
    if (version) {
      const store = getStore({ name: 'battery-versions', consistency: 'strong' });
      const data = await store.get(`${slug}:${version}`, { type: 'json' });
      if (data === null) return json({ error: 'not_found' }, 404);
      // pinned snapshots never change — safe to cache hard
      return json(strip(data), 200, { 'Cache-Control': 'public, max-age=31536000, immutable' });
    }

    const store = getStore({ name: 'battery-configs', consistency: 'strong' });
    const data = await store.get(slug, { type: 'json' });
    if (data === null) return json({ error: 'not_found' }, 404);
    return json(strip(data), 200, { 'Cache-Control': 'no-store' });
  } catch (err) {
    console.error('get-config error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
