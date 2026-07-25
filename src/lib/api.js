const BASE = '/.netlify/functions';

export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'unknown_error', res.status);
  return data;
}

export function fetchConfig(slug, version) {
  const params = new URLSearchParams({ slug });
  if (version) params.set('version', version);
  return fetch(`${BASE}/get-config?${params}`).then(handle);
}

export function createConfig(payload) {
  return fetch(`${BASE}/save-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}

export function updateConfig(slug, editToken, patch) {
  return fetch(`${BASE}/update-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, editToken, patch }),
  }).then(handle);
}

export function pinVersion(slug, editToken) {
  return fetch(`${BASE}/pin-version`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, editToken }),
  }).then(handle);
}
