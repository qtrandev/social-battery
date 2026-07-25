import { useState } from 'react';
import { updateConfig, pinVersion, ApiError } from '../lib/api.js';
import { clearEditToken } from '../lib/ownership.js';

const PRESETS = [20, 50, 75, 100];

export default function OwnerPanel({ slug, editToken, currentLevel, onChanged }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [slider, setSlider] = useState(Math.round(currentLevel));
  const [pinnedVersion, setPinnedVersion] = useState(null);
  const [error, setError] = useState(null);

  async function setOverride(value) {
    setPending(true);
    setError(null);
    try {
      await updateConfig(slug, editToken, { lastOverride: { at: new Date().toISOString(), value } });
      onChanged?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        clearEditToken(slug);
        setError('This device no longer has edit access.');
      } else {
        setError('Could not update — try again.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handlePin() {
    setPending(true);
    setError(null);
    try {
      const { version } = await pinVersion(slug, editToken);
      setPinnedVersion(version);
    } catch {
      setError('Could not pin a version — try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="absolute bottom-3 left-3 z-20">
      <button
        onClick={() => setOpen(o => !o)}
        className="rounded-full bg-black/30 p-2.5 text-white/70 backdrop-blur-sm transition hover:bg-black/50 hover:text-white"
        aria-label="Edit battery"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 w-64 rounded-xl bg-black/70 backdrop-blur-md p-4 flex flex-col gap-4 text-white">
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Set level</p>
            <div className="flex gap-2 mb-3">
              {PRESETS.map(p => (
                <button
                  key={p}
                  disabled={pending}
                  onClick={() => setOverride(p)}
                  className="flex-1 rounded-lg bg-white/10 py-1.5 text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-40"
                >
                  {p}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={slider}
                onChange={e => setSlider(Number(e.target.value))}
                className="flex-1"
              />
              <button
                disabled={pending}
                onClick={() => setOverride(slider)}
                className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-40"
              >
                Set
              </button>
            </div>
          </div>

          <button
            disabled={pending}
            onClick={handlePin}
            className="rounded-lg bg-white/10 py-2 text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            📌 Pin current state as a version
          </button>
          {pinnedVersion && (
            <p className="text-xs text-emerald-300">Pinned as /{slug}/{pinnedVersion}</p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
