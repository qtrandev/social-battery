import { THEMES, DEFAULT_THEME, bandForLevel, gradientStops } from './themes.js';

/**
 * The battery-shaped meter itself — landscape renders as the familiar wide
 * pill (fills left→right, nub on the right); portrait rotates the *layout*
 * (not a CSS transform) to a tall pill (fills bottom→top, nub on top) so
 * text and faces stay upright either way.
 */
export default function BatteryGauge({ level, theme = DEFAULT_THEME, orientation = 'landscape' }) {
  const clamped = Math.max(0, Math.min(100, level));
  const stops = gradientStops(theme);
  const band = bandForLevel(theme, clamped);
  const bands = (THEMES[theme] ?? THEMES[DEFAULT_THEME]).bands;

  const gradientCss = `linear-gradient(${orientation === 'landscape' ? 'to right' : 'to top'}, ${stops
    .map(s => `${s.color} ${s.from}%, ${s.color} ${s.to}%`)
    .join(', ')})`;

  const isLandscape = orientation === 'landscape';

  return (
    <div
      className={
        isLandscape
          ? 'flex flex-col items-center gap-6 w-full max-w-4xl px-6'
          : 'flex flex-col items-center gap-6 w-full max-w-sm px-6'
      }
    >
      {/* ── Face row, like the pin's row of smileys ── */}
      <div className={isLandscape ? 'flex gap-3' : 'hidden'}>
        {bands.map(b => (
          <span
            key={b.max}
            className="text-2xl transition-all duration-500"
            style={{
              opacity: b.max === band.max ? 1 : 0.25,
              transform: b.max === band.max ? 'scale(1.4)' : 'scale(1)',
            }}
          >
            {b.face}
          </span>
        ))}
      </div>

      {/* ── The battery shape ── */}
      <div
        className={
          isLandscape
            ? 'relative w-full aspect-[5/2]'
            : 'relative h-[60vh] max-h-[520px] aspect-[2/5]'
        }
      >
        {/* nub */}
        <div
          className={
            isLandscape
              ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-1/4 rounded-r-md bg-white/80'
              : 'absolute -top-3 left-1/2 -translate-x-1/2 h-3 w-1/4 rounded-t-md bg-white/80'
          }
        />
        {/* outline */}
        <div className="relative w-full h-full rounded-[2rem] border-[6px] border-white/80 overflow-hidden bg-black/20">
          {/* fill */}
          <div
            className="absolute bottom-0 left-0 transition-[width,height] duration-1000 ease-out"
            style={{
              background: gradientCss,
              width: isLandscape ? `${clamped}%` : '100%',
              height: isLandscape ? '100%' : `${clamped}%`,
            }}
          />
          {/* lightning bolt at the fill boundary */}
          <div
            className="absolute flex items-center justify-center transition-all duration-1000 ease-out drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]"
            style={
              isLandscape
                ? { left: `${clamped}%`, top: '50%', transform: 'translate(-50%, -50%)' }
                : { bottom: `${clamped}%`, left: '50%', transform: 'translate(-50%, 50%)' }
            }
          >
            <span className="text-3xl text-white">⚡</span>
          </div>
        </div>
      </div>

      {/* ── Readout ── */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl">{band.face}</span>
          <span className="text-5xl font-black tabular-nums text-white">{Math.round(clamped)}%</span>
        </div>
        <p className="text-lg text-white/70 font-medium">{band.mood}</p>
      </div>
    </div>
  );
}
