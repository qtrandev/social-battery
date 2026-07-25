import { useRef, useState } from 'react';
import { DEFAULT_THEME, bandForLevel, bandRanges, bandMidpoint, gradientStops } from './themes.js';

/**
 * The battery-shaped meter itself — landscape renders as the familiar wide
 * pill (fills left→right, nub on the right); portrait rotates the *layout*
 * (not a CSS transform) to a tall pill (fills bottom→top, nub on top) so
 * text and faces stay upright either way.
 *
 * Pass `onCommit(level)` to make it draggable (owners only — viewers get a
 * static, non-interactive gauge). Dragging only updates local state; the
 * network call fires once, on release, not on every pointer move.
 */
export default function BatteryGauge({ level, theme = DEFAULT_THEME, orientation = 'landscape', onCommit }) {
  const trackRef = useRef(null);
  const [dragLevel, setDragLevel] = useState(null);
  const isDragging = dragLevel !== null;

  const clamped = Math.max(0, Math.min(100, dragLevel ?? level));
  const stops = gradientStops(theme);
  const band = bandForLevel(theme, clamped);
  const ranges = bandRanges(theme);

  const gradientCss = `linear-gradient(${orientation === 'landscape' ? 'to right' : 'to top'}, ${stops
    .map(s => `${s.color} ${s.from}%, ${s.color} ${s.to}%`)
    .join(', ')})`;

  const isLandscape = orientation === 'landscape';
  const editable = Boolean(onCommit);

  function levelFromPointer(e) {
    const rect = trackRef.current.getBoundingClientRect();
    const fraction = isLandscape
      ? (e.clientX - rect.left) / rect.width
      : (rect.bottom - e.clientY) / rect.height;
    return Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  }

  function handlePointerDown(e) {
    if (!editable) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragLevel(levelFromPointer(e));
  }

  function handlePointerMove(e) {
    if (dragLevel === null) return;
    setDragLevel(levelFromPointer(e));
  }

  function handlePointerUp(e) {
    if (dragLevel === null) return;
    const final = levelFromPointer(e);
    setDragLevel(null);
    onCommit(final);
  }

  function handlePointerCancel() {
    setDragLevel(null);
  }

  return (
    <div
      className={
        isLandscape
          ? 'flex flex-col items-center gap-6 w-full max-w-4xl px-6'
          : 'flex flex-col items-center gap-6 w-full max-w-sm px-6'
      }
    >
      {/* ── Face row, like the pin's row of smileys — tap one to jump there, if editable ── */}
      <div className="flex gap-3">
        {ranges.map(r => {
          const isActive = r.max === band.max;
          const style = {
            opacity: isActive ? 1 : editable ? 0.5 : 0.25,
            transform: isActive ? 'scale(1.4)' : 'scale(1)',
          };
          return editable ? (
            <button
              key={r.max}
              type="button"
              onClick={() => onCommit(bandMidpoint(r))}
              aria-label={`Set level to ${r.mood}`}
              className="text-2xl transition-all duration-500 cursor-pointer"
              style={style}
            >
              {r.face}
            </button>
          ) : (
            <span key={r.max} className="text-2xl transition-all duration-500" style={style}>
              {r.face}
            </span>
          );
        })}
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
        {/* outline — the draggable track, when editable */}
        <div
          ref={trackRef}
          role={editable ? 'slider' : undefined}
          aria-label={editable ? 'Social battery level' : undefined}
          aria-valuenow={editable ? Math.round(clamped) : undefined}
          aria-valuemin={editable ? 0 : undefined}
          aria-valuemax={editable ? 100 : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative w-full h-full rounded-[2rem] border-[6px] border-white/80 overflow-hidden bg-black/20 ${
            editable ? 'cursor-grab active:cursor-grabbing touch-none' : ''
          }`}
        >
          {/* fill */}
          <div
            className={`absolute bottom-0 left-0 ${isDragging ? '' :'transition-[width,height] duration-1000 ease-out'}`}
            style={{
              background: gradientCss,
              width: isLandscape ? `${clamped}%` : '100%',
              height: isLandscape ? '100%' : `${clamped}%`,
            }}
          />
          {/* lightning bolt at the fill boundary — also the drag handle */}
          <div
            className={`absolute flex items-center justify-center drop-shadow-[0_0_6px_rgba(0,0,0,0.5)] ${
              isDragging ? '' :'transition-all duration-1000 ease-out'
            }`}
            style={
              isLandscape
                ? { left: `${clamped}%`, top: '50%', transform: 'translate(-50%, -50%)' }
                : { bottom: `${clamped}%`, left: '50%', transform: 'translate(-50%, 50%)' }
            }
          >
            <span className={`text-3xl text-white ${editable ? 'scale-125' : ''}`}>⚡</span>
          </div>
        </div>
      </div>

      {/* ── Readout ── */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl">{band.face}</span>
          <span className="text-5xl font-black tabular-nums text-white text-legible">{Math.round(clamped)}%</span>
        </div>
        <p className="text-lg text-white font-medium text-legible">{band.mood}</p>
      </div>
    </div>
  );
}
