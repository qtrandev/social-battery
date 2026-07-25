import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import FullscreenShell from '../shell/FullscreenShell.jsx';
import { useNow } from '../shell/useNow.js';
import { useOrientation } from '../shell/useOrientation.js';
import BatteryGauge from '../battery/BatteryGauge.jsx';
import RechargingView from '../battery/RechargingView.jsx';
import OwnerPanel from '../battery/OwnerPanel.jsx';
import { computeBatteryState } from '../battery/model.js';
import { bandForLevel } from '../battery/themes.js';
import { fetchConfig, ApiError } from '../lib/api.js';
import { getEditToken } from '../lib/ownership.js';
import { deriveDisplayNameFromKey } from '../lib/displayName.js';

export default function ViewBattery() {
  const { slug, version } = useParams();
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | not_found | error
  const now = useNow(30_000);
  const orientation = useOrientation();

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
  const editToken = !version ? getEditToken(slug) : null;
  const displayName = config.name || deriveDisplayNameFromKey(slug);

  const background = config.coverImageUrl
    ? `url(${config.coverImageUrl}) center / cover`
    : `radial-gradient(ellipse at center, ${band.color}33 0%, #0a0a0a 70%)`;

  return (
    <FullscreenShell background={background}>
      {version && (
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-center gap-3 bg-amber-500/90 py-2 text-sm font-semibold text-neutral-950">
          Viewing pinned version {version}
          <Link to={`/${slug}`} className="underline">View latest</Link>
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        {config.profileImageUrl && (
          <img
            src={config.profileImageUrl}
            alt=""
            className="w-20 h-20 rounded-full object-cover border-2 border-white/70 shadow-lg"
          />
        )}
        <h1 className="text-xl font-bold text-white/80">{displayName}</h1>

        {battery.awake ? (
          <BatteryGauge level={battery.level} theme={config.theme} orientation={orientation} />
        ) : (
          <RechargingView nextWake={battery.nextWake} />
        )}
      </div>

      {editToken && (
        <OwnerPanel
          slug={slug}
          editToken={editToken}
          currentLevel={battery.level}
          onChanged={load}
        />
      )}
    </FullscreenShell>
  );
}
