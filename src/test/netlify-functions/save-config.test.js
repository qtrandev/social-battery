// @vitest-environment node
//
// Deliberately NOT inside netlify/functions/ — Netlify's build treats every
// file directly in that directory as a deployable function, and a name like
// "save-config.test" isn't a legal function name (periods aren't allowed).
// That broke a real deploy once; keep function tests out of that directory.
import { describe, it, expect } from 'vitest';
import saveConfig from '../../../netlify/functions/save-config.js';
import { RESERVED_SLUGS } from '../../lib/slug.js';

function req(body, method = 'POST') {
  return new Request('http://localhost/.netlify/functions/save-config', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

const validPayload = {
  slug: 'a-key-unlikely-to-exist-in-any-store-zz',
  wakeTime: '07:00',
  workEndTime: '18:00',
  sleepTime: '00:00',
  timezone: 'America/Chicago',
  theme: 'energetic',
};

// These all hit the request-validation branch, which returns before ever
// touching Netlify Blobs — so no store mocking is needed here.
describe('save-config request validation', () => {
  it('rejects a reserved key with error code "reserved", distinct from a malformed key', async () => {
    const res = await saveConfig(req({ ...validPayload, slug: 'new' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('reserved');
  });

  it('rejects a malformed key with error code "invalid_slug"', async () => {
    const res = await saveConfig(req({ ...validPayload, slug: 'Has Spaces' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_slug');
  });

  it('rejects every reserved word in the shared list, not just "new"', async () => {
    for (const word of RESERVED_SLUGS) {
      const res = await saveConfig(req({ ...validPayload, slug: word }));
      expect((await res.json()).error, `expected "${word}" to come back reserved`).toBe('reserved');
    }
  });

  it('rejects non-POST methods', async () => {
    const res = await saveConfig(req(null, 'GET'));
    expect(res.status).toBe(405);
  });

  it('rejects a payload that fails field validation', async () => {
    const res = await saveConfig(req({ ...validPayload, theme: 'not-a-real-theme' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_fields');
  });
});
