import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createConfig, ApiError } from '../lib/api.js';
import { setEditToken } from '../lib/ownership.js';
import { THEME_KEYS, THEMES, DEFAULT_THEME } from '../battery/themes.js';
import { isValidSlug } from '../lib/slug.js';

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const slug = form.slug.trim().toLowerCase();
    if (!isValidSlug(slug)) {
      setError('Slug must be 2-40 characters: lowercase letters, numbers, hyphens.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        slug,
        name: form.name.trim() || slug,
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
      navigate(`/${slug}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'taken') {
        setError('That slug is already taken — try another.');
      } else if (err instanceof ApiError && err.code === 'reserved') {
        setError("That slug isn't available.");
      } else {
        setError('Something went wrong — try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-6 py-12">
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black text-white">Set up your battery</h1>
          <p className="text-white/50 text-sm mt-1">
            This becomes your URL — pick something short and yours.
          </p>
        </div>

        <Field label="Slug" hint="social-battery.example/your-slug">
          <input
            value={form.slug}
            onChange={set('slug')}
            placeholder="quyen"
            required
            className="input"
          />
        </Field>

        <Field label="Display name">
          <input value={form.name} onChange={set('name')} placeholder="Quyen" className="input" />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Wake">
            <input type="time" value={form.wakeTime} onChange={set('wakeTime')} required className="input" />
          </Field>
          <Field label="Work ends">
            <input type="time" value={form.workEndTime} onChange={set('workEndTime')} required className="input" />
          </Field>
          <Field label="Sleep">
            <input type="time" value={form.sleepTime} onChange={set('sleepTime')} required className="input" />
          </Field>
        </div>

        <Field label="Timezone" hint="Detected automatically — the battery runs on this clock no matter who's viewing.">
          <input value={form.timezone} onChange={set('timezone')} required className="input" />
        </Field>

        <Field label="Theme">
          <select value={form.theme} onChange={set('theme')} className="input">
            {THEME_KEYS.map(key => (
              <option key={key} value={key}>{THEMES[key].label}</option>
            ))}
          </select>
        </Field>

        <Field label="Profile image URL" hint="Optional — we only store the link, never the image itself.">
          <input value={form.profileImageUrl} onChange={set('profileImageUrl')} placeholder="https://…" className="input" />
        </Field>

        <Field label="Cover image URL" hint="Optional — falls back to the theme gradient if left blank.">
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
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-white/80">{label}</span>
      {children}
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </label>
  );
}
