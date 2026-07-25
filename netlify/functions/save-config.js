import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { isValidSlug } from '../../src/lib/slug.js';
import { validateFields } from '../../src/battery/validate.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const ALLOWED_FIELDS = [
  'name', 'wakeTime', 'workEndTime', 'sleepTime', 'timezone',
  'theme', 'profileImageUrl', 'coverImageUrl',
];

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { slug, ...rest } = body ?? {};
  if (!isValidSlug(slug)) return json({ error: 'invalid_slug' }, 400);

  const payload = {};
  for (const key of ALLOWED_FIELDS) if (key in rest) payload[key] = rest[key];

  const errors = validateFields(payload, { partial: false });
  if (errors.length) return json({ error: 'invalid_fields', details: errors }, 400);

  try {
    const store = getStore({ name: 'battery-configs', consistency: 'strong' });
    const existing = await store.get(slug, { type: 'json' });
    if (existing !== null) return json({ error: 'taken' }, 409);

    const now = new Date().toISOString();
    const editToken = randomUUID();
    const record = {
      slug,
      editToken,
      name: payload.name,
      wakeTime: payload.wakeTime,
      workEndTime: payload.workEndTime,
      sleepTime: payload.sleepTime,
      timezone: payload.timezone,
      theme: payload.theme,
      profileImageUrl: payload.profileImageUrl ?? null,
      coverImageUrl: payload.coverImageUrl ?? null,
      lastOverride: null,
      latestVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    await store.setJSON(slug, record);
    return json({ ok: true, slug, editToken });
  } catch (err) {
    console.error('save-config error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
