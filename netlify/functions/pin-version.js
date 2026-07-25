import { getStore } from '@netlify/blobs';
import { isValidSlug } from '../../src/lib/slug.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { slug, editToken } = body ?? {};
  if (!isValidSlug(slug)) return json({ error: 'invalid_slug' }, 400);
  if (typeof editToken !== 'string' || !editToken) return json({ error: 'missing_token' }, 400);

  try {
    const configStore = getStore({ name: 'battery-configs', consistency: 'strong' });
    const record = await configStore.get(slug, { type: 'json' });
    if (record === null) return json({ error: 'not_found' }, 404);
    if (record.editToken !== editToken) return json({ error: 'forbidden' }, 403);

    const nextVersion = (record.latestVersion ?? 0) + 1;
    const versionKey = `v${nextVersion}`;
    // snapshots are public reads — never carry the edit token, and don't need latestVersion
    const { editToken: _token, latestVersion: _lv, ...snapshotFields } = record;
    const snapshot = { ...snapshotFields, version: versionKey, pinnedAt: new Date().toISOString() };

    const versionStore = getStore({ name: 'battery-versions', consistency: 'strong' });
    await versionStore.setJSON(`${slug}:${versionKey}`, snapshot);

    await configStore.setJSON(slug, {
      ...record,
      latestVersion: nextVersion,
      updatedAt: new Date().toISOString(),
    });

    return json({ ok: true, version: versionKey });
  } catch (err) {
    console.error('pin-version error:', err?.message ?? err);
    return json({ error: 'server_error' }, 500);
  }
};
