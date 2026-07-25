import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { shellButtonClass } from '../shell/FullscreenShell.jsx';
import { createConfig, ApiError } from '../lib/api.js';
import { setEditToken } from '../lib/ownership.js';
import { recordMyBattery } from '../lib/myBatteries.js';
import { THEME_KEYS, THEMES, DEFAULT_THEME } from '../battery/themes.js';
import { SLUG_REGEX, RESERVED_SLUGS } from '../lib/slug.js';
import { deriveDisplayNameFromKey } from '../lib/displayName.js';

const DEFAULT_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function CreateBattery() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    slug: '',
    name: '',
    wakeTime: '07:00',
    workEndTime: '18:00',
    sleepTime: '00:00',
    timezone: DEFAULT_TZ,
    theme: DEFAULT_THEME,
    profileImageUrl: '',
    coverImageUrl: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  function handleKeyChange(e) {
    // Key always drives Display name, even overwriting a manually-typed one —
    // editing Key again means the old suggestion was based on a stale key.
    const key = e.target.value;
    setForm(prev => ({ ...prev, slug: key, name: deriveDisplayNameFromKey(key) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const slug = form.slug.trim().toLowerCase();
    if (!SLUG_REGEX.test(slug)) {
      setError('Key must be 2-40 characters: lowercase letters, numbers, hyphens.');
      return;
    }
    if (RESERVED_SLUGS.has(slug)) {
      setError('That key is reserved - try another.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        slug,
        name: form.name.trim() || null,
        wakeTime: form.wakeTime,
        workEndTime: form.workEndTime,
        sleepTime: form.sleepTime,
        timezone: form.timezone,
        theme: form.theme,
        profileImageUrl: form.profileImageUrl.trim() || null,
        coverImageUrl: form.coverImageUrl.trim() || null,
      };
      const result = await createConfig(payload);
      setEditToken(slug, result.editToken);
      recordMyBattery(slug, payload.name || deriveDisplayNameFromKey(slug));
      navigate(`/${slug}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'taken') {
        setError('That key is already taken - try another.');
      } else if (err instanceof ApiError && err.code === 'reserved') {
        setError("That key isn't available.");
      } else {
        setError('Something went wrong - try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 px-6 py-12">
      <Link to="/" className={`fixed top-3 right-3 z-20 ${shellButtonClass}`} aria-label="Go home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-white">Set up your battery</h1>
          <p className="text-white/50 text-sm mt-1">
            This becomes your URL - pick something short and yours.
          </p>
        </div>

        <Field label="Key" hint="social-battery.example/your-key">
          <input
            value={form.slug}
            onChange={handleKeyChange}
            placeholder="quyen"
            required
            className="input"
          />
        </Field>

        <Field label="Display name" hint="Auto-filled from your key - edit freely to override.">
          <input value={form.name} onChange={set('name')} placeholder="Quyen" className="input" />
        </Field>

        <Field label="Wake">
          <input type="time" value={form.wakeTime} onChange={set('wakeTime')} required className="input" />
        </Field>
        <Field label="Work ends">
          <input type="time" value={form.workEndTime} onChange={set('workEndTime')} required className="input" />
        </Field>
        <Field label="Sleep">
          <input type="time" value={form.sleepTime} onChange={set('sleepTime')} required className="input" />
        </Field>

        <Field label="Timezone" hint="Detected automatically - the battery runs on this clock no matter who's viewing.">
          <input value={form.timezone} onChange={set('timezone')} required className="input" />
        </Field>

        <Field label="Theme">
          <select value={form.theme} onChange={set('theme')} className="input">
            {THEME_KEYS.map(key => (
              <option key={key} value={key}>{THEMES[key].label}</option>
            ))}
          </select>
        </Field>

        <Field label="Profile image URL" hint="Optional - we only store the link, never the image itself.">
          <input value={form.profileImageUrl} onChange={set('profileImageUrl')} placeholder="https://…" className="input" />
        </Field>

        <Field label="Cover image URL" hint="Optional - falls back to the theme gradient if left blank.">
          <input value={form.coverImageUrl} onChange={set('coverImageUrl')} placeholder="https://…" className="input" />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, children }) {
  // Hint text lives outside the <label> on purpose — nesting it inside would
  // fold it into the field's accessible name (screen readers would announce
  // it every time the field is focused, and it breaks label-text lookups).
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-white/80">{label}</span>
        {children}
      </label>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </div>
  );
}
