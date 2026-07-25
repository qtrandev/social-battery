export default function RechargingView({ nextWake }) {
  const time = nextWake?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <span className="text-7xl animate-pulse">🔌</span>
      <h1 className="text-3xl font-black text-white">Recharging</h1>
      {time && <p className="text-lg text-white/60">Back online around {time}</p>}
    </div>
  );
}
