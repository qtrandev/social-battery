import { getStore } from '@netlify/blobs';
import { isValidSlug } from '../../src/lib/slug.js';
import { validateFields } from '../../src/battery/validate.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const ALLOWED_FIELDS = [
  'name', 'wakeTime', 'workEndTime', 'sleepTime', 'timezone',
  'theme', 'profileImageUrl', 'coverImageUrl', 'lastOverride',
];

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { slug, editToken, patch } = body ?? {};
  if (!isValidSlug(slug)) return json({ error: 'invalid_slug' }, 400);
  if (typeof editToken !== 'string' || !editToken) return json({ error: 'missing_token' }, 400);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return json({ error: 'missing_patch' }, 400);

  const fields = {};
  for (const key of ALLOWED_FIELDS) if (key in patch) fields[key] = patch[key];

  const errors = validateFields(fields, { partial: true });
  if (errors.length) return json({ error: 'invalid_fields', details: errors }, 400);

  try {
    const store = getStore({ name: 'battery-configs', consistency: 'strong' });
    const existing = await store.get(slug, { type: 'json' });
    if (existing === null) return json({ error: 'not_found' }, 404);
    if (existing.editToken !== editToken) return json({ error: 'forbidden' }, 403);

    const updated = { ...existing, ...fields, updatedAt: new Date().toISOString() };
    await store.setJSON(slug, updated);
    return json({ ok: true });
  } catch (err) {
    console.error('update-config error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
