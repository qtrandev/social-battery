import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listMyBatteries } from '../lib/myBatteries.js';

export default function Home() {
  const [mine, setMine] = useState([]);

  // Read once on mount rather than at module scope, since this is
  // per-browser state that server-rendering (if this ever gets any) wouldn't have.
  useEffect(() => {
    setMine(listMyBatteries());
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-16 text-center bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl">🔋</span>
        <h1 className="text-4xl font-black text-white">Social Battery</h1>
        <p className="max-w-md text-white/60">
          A live status page for your energy level — leave it fullscreen on a monitor,
          or prop your phone up, so people can see at a glance without asking.
        </p>
      </div>
      <Link
        to="/new"
        className="px-8 py-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition-colors"
      >
        Set up yours
      </Link>

      {mine.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">Yours, on this device</p>
          {mine.map(b => (
            <Link
              key={b.slug}
              to={`/${b.slug}`}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-emerald-400/50 hover:bg-white/10"
            >
              <span className="font-semibold text-white">{b.name}</span>
              <span className="text-xs text-white/40">/{b.slug}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
