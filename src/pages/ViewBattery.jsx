import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import FullscreenShell, { shellButtonClass } from '../shell/FullscreenShell.jsx';
import { useNow } from '../shell/useNow.js';
import { useOrientation } from '../shell/useOrientation.js';
import BatteryGauge from '../battery/BatteryGauge.jsx';
import RechargingView from '../battery/RechargingView.jsx';
import OwnerPanel from '../battery/OwnerPanel.jsx';
import SettingsPanel from '../battery/SettingsPanel.jsx';
import { computeBatteryState } from '../battery/model.js';
import { bandForLevel } from '../battery/themes.js';
import { fetchConfig, updateConfig, ApiError } from '../lib/api.js';
import { getEditToken, clearEditToken } from '../lib/ownership.js';
import { recordMyBattery } from '../lib/myBatteries.js';
import { recordRecentlyViewed } from '../lib/recentlyViewed.js';
import { deriveDisplayNameFromKey } from '../lib/displayName.js';

export default function ViewBattery() {
  const { slug, version } = useParams();
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | not_found | error
  const [showSettings, setShowSettings] = useState(false);
  const [guestLevel, setGuestLevel] = useState(null);
  const now = useNow(30_000);
  const orientation = useOrientation();
  // ownerToken: does this browser hold the edit token for this slug at all.
  // editToken: is editing actually allowed on *this* render — never true for
  // a pinned snapshot, since dragging/settings act on the live config, not
  // the frozen version being viewed.
  const ownerToken = getEditToken(slug);
  const editToken = !version ? ownerToken : null;
  const [liveLatestVersion, setLiveLatestVersion] = useState(null);

  // Guests (no editToken) can still tap/drag the gauge to see "what if" —
  // it's purely local, never saved, so someone can temporarily reuse a
  // shared display without touching the owner's actual status. Reset it
  // whenever we land on a different battery.
  useEffect(() => { setGuestLevel(null); }, [slug, version]);

  // A pinned snapshot never carries latestVersion (pin-version.js strips it,
  // since it'd go stale the moment another version gets pinned) — so to let
  // an owner browsing an old version jump to other versions, fetch the live
  // config just for an up-to-date count.
  useEffect(() => {
    if (!version || !ownerToken) { setLiveLatestVersion(null); return; }
    let cancelled = false;
    fetchConfig(slug).then(data => { if (!cancelled) setLiveLatestVersion(data.latestVersion ?? 0); }).catch(() => {});
    return () => { cancelled = true; };
  }, [slug, version, ownerToken]);

  const load = useCallback(async () => {
    try {
      const data = await fetchConfig(slug, version);
      setConfig(data);
      setStatus('ok');
    } catch (err) {
      setStatus(err instanceof ApiError && err.code === 'not_found' ? 'not_found' : 'error');
    }
  }, [slug, version]);

  useEffect(() => { load(); }, [load]);

  // Self-heals the "yours, on this device" list on the home page — covers
  // the case where the history entry got lost (e.g. storage cleared) but the
  // editToken survived, or the display name changed since it was recorded.
  useEffect(() => {
    if (status !== 'ok' || !editToken || !config) return;
    recordMyBattery(slug, config.name || deriveDisplayNameFromKey(slug));
  }, [status, editToken, slug, config]);

  // Lets someone who was just sent a link (no editToken, so not theirs) find
  // their way back to it from the home page later.
  useEffect(() => {
    if (status !== 'ok' || editToken || version || !config) return;
    recordRecentlyViewed(slug, config.name || deriveDisplayNameFromKey(slug));
  }, [status, editToken, version, slug, config]);

  // Optimistic: the visual updates instantly from local state, and the save
  // happens in the background — dragging the gauge shouldn't feel like it's
  // waiting on a network round trip. On failure we just reconcile with the
  // server's actual state (and drop a stale edit token if that's why it failed).
  async function applyOverride(value) {
    const editToken = getEditToken(slug);
    if (!editToken) return;
    const override = { at: new Date().toISOString(), value };
    setConfig(prev => (prev ? { ...prev, lastOverride: override } : prev));
    try {
      await updateConfig(slug, editToken, { lastOverride: override });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) clearEditToken(slug);
      load();
    }
  }

  // Clears the manual override so the level goes back to the default
  // wake→work-end→sleep trajectory, same as a battery no one has touched.
  async function resetOverride() {
    const editToken = getEditToken(slug);
    if (!editToken) return;
    setConfig(prev => (prev ? { ...prev, lastOverride: null } : prev));
    try {
      await updateConfig(slug, editToken, { lastOverride: null });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) clearEditToken(slug);
      load();
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <span className="text-4xl animate-pulse">🔋</span>
      </div>
    );
  }

  if (status !== 'ok') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-neutral-950 text-center px-6">
        <span className="text-5xl">🔍</span>
        <h1 className="text-2xl font-black text-white">
          {status === 'not_found' ? 'Nothing here' : 'Something went wrong'}
        </h1>
        <Link to="/new" className="text-emerald-400 hover:underline">Set up your own battery</Link>
      </div>
    );
  }

  const battery = computeBatteryState(config, now);
  const band = bandForLevel(config.theme, battery.level);
  const displayName = config.name || deriveDisplayNameFromKey(slug);

  const background = config.coverImageUrl
    ? `url(${config.coverImageUrl}) center / cover`
    : `radial-gradient(ellipse at center, ${band.color}33 0%, #0a0a0a 70%)`;

  const editButton = editToken && (
    <button onClick={() => setShowSettings(true)} className={shellButtonClass} aria-label="Edit settings">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  const latestVersionCount = version ? liveLatestVersion : (config.latestVersion ?? 0);

  return (
    <FullscreenShell background={background} topRightExtra={editButton}>
      <div className="h-full flex flex-col items-center justify-center gap-[clamp(0.25rem,2dvh,1rem)] overflow-hidden py-[clamp(0.25rem,2dvh,1rem)]">
        {config.profileImageUrl && (
          <img
            src={config.profileImageUrl}
            alt=""
            className="shrink-0 rounded-full object-cover border-2 border-white/70 shadow-lg"
            style={{ width: 'clamp(1.75rem, 8dvh, 5rem)', height: 'clamp(1.75rem, 8dvh, 5rem)' }}
          />
        )}
        <h1 className="shrink-0 font-bold text-white text-legible text-[clamp(1rem,6dvh,4.5rem)]">
          {displayName}
        </h1>

        {battery.awake ? (
          <BatteryGauge
            level={editToken ? battery.level : guestLevel ?? battery.level}
            theme={config.theme}
            orientation={orientation}
            onCommit={editToken ? applyOverride : setGuestLevel}
          />
        ) : (
          <RechargingView nextWake={battery.nextWake} />
        )}

        {!editToken && guestLevel !== null && (
          <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/50 text-legible">
            Just for you - not saved, resets on reload
          </p>
        )}
      </div>

      {ownerToken && (
        <OwnerPanel
          slug={slug}
          editToken={ownerToken}
          onSetLevel={applyOverride}
          onReset={resetOverride}
          hasOverride={Boolean(battery.overridden)}
          awake={battery.awake}
          nextWake={battery.nextWake}
          viewingVersion={version ?? null}
          latestVersion={latestVersionCount}
          onPinned={load}
        />
      )}

      {showSettings && (
        <SettingsPanel
          slug={slug}
          editToken={editToken}
          config={config}
          onClose={() => setShowSettings(false)}
          onSaved={load}
        />
      )}
    </FullscreenShell>
  );
}
