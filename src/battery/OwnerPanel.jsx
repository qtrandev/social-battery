import { useState } from 'react';
import { Link } from 'react-router';
import { pinVersion } from '../lib/api.js';
import { formatClockTime } from '../lib/time.js';

const PRESETS = [20, 50, 75, 100];

export default function OwnerPanel({
  slug,
  editToken,
  onSetLevel,
  onReset,
  hasOverride = false,
  awake,
  nextWake,
  viewingVersion = null,
  latestVersion = 0,
  onPinned,
}) {
  const [open, setOpen] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [pinnedVersion, setPinnedVersion] = useState(null);
  const [pinError, setPinError] = useState(null);

  const versionOptions =
    typeof latestVersion === 'number' && latestVersion > 0
      ? ['latest', ...Array.from({ length: latestVersion }, (_, i) => `v${i + 1}`)]
      : [];
  const activeVersion = viewingVersion ?? 'latest';

  async function handlePin() {
    setPinning(true);
    setPinError(null);
    try {
      const { version } = await pinVersion(slug, editToken);
      setPinnedVersion(version);
      onPinned?.();
    } catch {
      setPinError('Could not pin a version - try again.');
    } finally {
      setPinning(false);
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
          {viewingVersion ? (
            <p className="text-xs text-white/40">
              Viewing a pinned snapshot ({viewingVersion}) - it's frozen, so level and settings can't be changed here.
            </p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Set level</p>
              {awake ? (
                <>
                  <div className="flex gap-2">
                    {hasOverride && (
                      <button
                        onClick={onReset}
                        aria-label="Reset to default level"
                        title="Reset to default"
                        className="rounded-lg bg-white/10 px-2.5 text-sm hover:bg-white/20 transition-colors"
                      >
                        🔄
                      </button>
                    )}
                    {PRESETS.map(p => (
                      <button
                        key={p}
                        onClick={() => onSetLevel(p)}
                        className="flex-1 rounded-lg bg-white/10 py-1.5 text-sm font-semibold hover:bg-white/20 transition-colors"
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-white/40">Or drag the battery itself.</p>
                </>
              ) : (
                <p className="text-xs text-white/40">
                  Recharging{nextWake ? ` until ${formatClockTime(nextWake)}` : ''} - level updates resume at wake.
                </p>
              )}
            </div>
          )}

          {versionOptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Versions</p>
              <div className="flex flex-wrap gap-1.5">
                {versionOptions.map(v => {
                  const isActive = v === activeVersion;
                  const label = v === 'latest' ? 'Latest' : v;
                  return isActive ? (
                    <span
                      key={v}
                      aria-current="page"
                      className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/30"
                    >
                      {label}
                    </span>
                  ) : (
                    <Link
                      key={v}
                      to={v === 'latest' ? `/${slug}` : `/${slug}/${v}`}
                      className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20 transition-colors"
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {!viewingVersion && (
            <>
              <button
                disabled={pinning}
                onClick={handlePin}
                className="rounded-lg bg-white/10 py-2 text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-40"
              >
                📌 Pin current state as a version
              </button>
              {pinnedVersion && (
                <p className="text-xs text-emerald-300">Pinned as /{slug}/{pinnedVersion}</p>
              )}
              {pinError && <p className="text-xs text-red-400">{pinError}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
