import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center bg-neutral-950">
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
    </div>
  );
}
