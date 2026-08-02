import { useRef, useState } from 'react';
import { DEFAULT_THEME, bandForLevel, bandRanges, bandMidpoint, gradientStops } from './themes.js';
import { WORK_END_VALUE } from './model.js';
import FloatingIcons from './FloatingIcons.jsx';
import { BOOST_ICONS, DRAIN_ICONS } from './energyIcons.js';

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

  // The tap-to-adjust "game" icons floating beside the gauge — separate from
  // dragging, so a tap just nudges the *current* value by the icon's delta.
  function handleGameTap(delta) {
    if (!editable) return;
    onCommit(Math.max(0, Math.min(100, Math.round(clamped + delta))));
  }

  const batteryShape = (
    <div
      className={
        isLandscape
          ? 'relative w-full h-[min(30cqw,75cqh)]'
          : 'relative h-full w-[min(40cqh,100cqw)]'
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
        {/* work-end reference — where the default trajectory expects you to be by work-end, always */}
        <div
          data-testid="work-end-marker"
          className="absolute bg-white/40 pointer-events-none"
          style={
            isLandscape
              ? { left: `${WORK_END_VALUE}%`, top: 0, bottom: 0, width: '2px', transform: 'translateX(-50%)' }
              : { bottom: `${WORK_END_VALUE}%`, left: 0, right: 0, height: '2px', transform: 'translateY(50%)' }
          }
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
  );

  // Always claims the full width (landscape) or full height (portrait) of
  // the space it's given; the other dimension self-limits via container
  // query units so it can't overflow a short/narrow screen. Flanked by the
  // tap-to-adjust game icons: boost (left) / drain (right) beside it in
  // portrait, or boost (above) / drain (below) it in landscape.
  const fitBox = (
    <div className="relative flex-1 min-h-0 w-full flex items-center justify-center [container-type:size]">
      {batteryShape}
    </div>
  );

  const boostZone = (
    <FloatingIcons
      icons={BOOST_ICONS}
      onTap={handleGameTap}
      tone="boost"
      editable={editable}
      className={isLandscape ? 'w-full h-[clamp(2.5rem,10dvh,4rem)] shrink-0' : 'h-full w-[clamp(2.75rem,16dvw,4.5rem)] shrink-0'}
    />
  );
  const drainZone = (
    <FloatingIcons
      icons={DRAIN_ICONS}
      onTap={handleGameTap}
      tone="drain"
      editable={editable}
      className={isLandscape ? 'w-full h-[clamp(2.5rem,10dvh,4rem)] shrink-0' : 'h-full w-[clamp(2.75rem,16dvw,4.5rem)] shrink-0'}
    />
  );

  return (
    <div
      className={
        isLandscape
          ? 'flex flex-1 min-h-0 flex-col items-center justify-center gap-[clamp(0.5rem,3dvh,1.5rem)] w-full max-w-4xl px-6'
          : 'flex flex-1 min-h-0 flex-col items-center justify-center gap-[clamp(0.5rem,3dvh,1.5rem)] w-full max-w-sm px-6'
      }
    >
      {/* ── Face row, like the pin's row of smileys — tap one to jump there, if editable ── */}
      <div className="flex gap-3 shrink-0">
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
              className="text-[clamp(1rem,5dvh,2.5rem)] transition-all duration-500 cursor-pointer"
              style={style}
            >
              {r.face}
            </button>
          ) : (
            <span key={r.max} className="text-[clamp(1rem,5dvh,2.5rem)] transition-all duration-500" style={style}>
              {r.face}
            </span>
          );
        })}
      </div>

      {isLandscape ? (
        <>
          {boostZone}
          {fitBox}
          {drainZone}
        </>
      ) : (
        <div className="flex flex-1 min-h-0 w-full">
          {boostZone}
          {fitBox}
          {drainZone}
        </div>
      )}

      {/* ── Readout — sized off dvh, not a fixed rem, so it yields room to the gauge on short screens ── */}
      <div className="flex flex-col items-center gap-1 shrink-0 max-w-full px-2">
        <div className="flex items-baseline gap-3">
          <span className="text-[clamp(1.75rem,9dvh,5.5rem)]">{band.face}</span>
          <span className="text-[clamp(1.5rem,8dvh,4.5rem)] font-black tabular-nums text-white text-legible">{Math.round(clamped)}%</span>
        </div>
        {/* Some theme mood strings run long (e.g. "Green zone - calm and
            ready") — shrink the cap a bit for those, and center + balance
            as the guaranteed fallback for whatever still wraps. */}
        <p
          className={`text-center text-balance text-white font-medium text-legible ${
            band.mood.length > 18 ? 'text-[clamp(0.8rem,3dvh,1.75rem)]' : 'text-[clamp(0.9rem,4dvh,2.5rem)]'
          }`}
        >
          {band.mood}
        </p>
      </div>
    </div>
  );
}
