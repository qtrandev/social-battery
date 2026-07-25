import { useState } from 'react';
import { updateConfig, ApiError } from '../lib/api.js';
import { clearEditToken } from '../lib/ownership.js';
import { THEME_KEYS, THEMES } from './themes.js';

/** Full settings editor (name, times, theme, image URLs) — reached via the pencil icon, owners only. */
export default function SettingsPanel({ slug, editToken, config, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: config.name ?? '',
    wakeTime: config.wakeTime,
    workEndTime: config.workEndTime,
    sleepTime: config.sleepTime,
    theme: config.theme,
    profileImageUrl: config.profileImageUrl ?? '',
    coverImageUrl: config.coverImageUrl ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateConfig(slug, editToken, {
        name: form.name.trim() || null,
        wakeTime: form.wakeTime,
        workEndTime: form.workEndTime,
        sleepTime: form.sleepTime,
        theme: form.theme,
        profileImageUrl: form.profileImageUrl.trim() || null,
        coverImageUrl: form.coverImageUrl.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        clearEditToken(slug);
        onClose();
      } else {
        setError('Could not save - try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSave}
        className="flex max-h-[85vh] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-5 text-white"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        <Field label="Display name">
          <input value={form.name} onChange={set('name')} placeholder={slug} className="input" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
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

        <Field label="Theme">
          <select value={form.theme} onChange={set('theme')} className="input">
            {THEME_KEYS.map(key => (
              <option key={key} value={key}>{THEMES[key].label}</option>
            ))}
          </select>
        </Field>

        <Field label="Profile image URL">
          <input value={form.profileImageUrl} onChange={set('profileImageUrl')} placeholder="https://…" className="input" />
        </Field>

        <Field label="Cover image URL">
          <input value={form.coverImageUrl} onChange={set('coverImageUrl')} placeholder="https://…" className="input" />
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-500 py-2.5 font-bold text-neutral-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-white/80">{label}</span>
      {children}
    </label>
  );
}
