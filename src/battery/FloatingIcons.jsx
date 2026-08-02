import { useEffect, useRef, useState } from 'react';

const ICON_SIZE = 32; // px — keep in sync with the button's h-8/w-8 below
const SPEED = 36; // px/second — the only knob for how "frantic" the icons feel
const OVERFLOW = 14; // px an icon may drift past the box edge before bouncing

const TONE_CLASSES = {
  boost: 'bg-emerald-400/10 hover:bg-emerald-400/25 active:bg-emerald-400/40',
  drain: 'bg-red-400/10 hover:bg-red-400/25 active:bg-red-400/40',
};

/**
 * A bounding box of tappable emoji that drift around and bounce off its
 * edges (a little "DVD screensaver" of icons) — tapping one calls
 * `onTap(icon.delta)`. Positions are driven straight onto each icon's DOM
 * node via refs every animation frame, not React state, so the constant
 * motion never triggers a re-render of the rest of the gauge.
 *
 * Position and hover/active scaling live on two different elements
 * (wrapper vs. button) on purpose — they both animate via `transform`, and
 * inline styles beat CSS classes, so if they shared one element every
 * animation frame would instantly stomp the hover-scale class back to
 * nothing, which is what caused the "grows then snaps" hover jump (and
 * broke clicking, since the element kept shifting under the cursor).
 */
export default function FloatingIcons({ icons, onTap, tone = 'boost', editable = true, className = '' }) {
  const containerRef = useRef(null);
  const iconRefs = useRef([]);
  // Latest {x,y} per icon, kept alongside the animation loop's own particle
  // state so a tap can spawn its "+7%" popup at wherever the icon actually is.
  const positionsRef = useRef([]);
  const [popups, setPopups] = useState([]);
  const nextPopupId = useRef(0);

  useEffect(() => {
    if (!editable) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const bounds = { minX: -OVERFLOW, minY: -OVERFLOW, maxX: rect.width - ICON_SIZE + OVERFLOW, maxY: rect.height - ICON_SIZE + OVERFLOW };

    const particles = icons.map(() => {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * Math.max(1, bounds.maxX - bounds.minX) + bounds.minX,
        y: Math.random() * Math.max(1, bounds.maxY - bounds.minY) + bounds.minY,
        vx: Math.cos(angle) * SPEED,
        vy: Math.sin(angle) * SPEED,
      };
    });
    positionsRef.current = particles.map(p => ({ x: p.x, y: p.y }));

    let rafId;
    let last = performance.now();

    function tick(now) {
      // Clamp dt so a backgrounded tab resuming doesn't fling icons across the screen.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const currentRect = container.getBoundingClientRect();
      const b = {
        minX: -OVERFLOW,
        minY: -OVERFLOW,
        maxX: currentRect.width - ICON_SIZE + OVERFLOW,
        maxY: currentRect.height - ICON_SIZE + OVERFLOW,
      };

      particles.forEach((p, i) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < b.minX) { p.x = b.minX; p.vx = Math.abs(p.vx); }
        else if (p.x > b.maxX) { p.x = b.maxX; p.vx = -Math.abs(p.vx); }
        if (p.y < b.minY) { p.y = b.minY; p.vy = Math.abs(p.vy); }
        else if (p.y > b.maxY) { p.y = b.maxY; p.vy = -Math.abs(p.vy); }

        positionsRef.current[i] = { x: p.x, y: p.y };
        const el = iconRefs.current[i];
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      });

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [icons, editable]);

  if (!editable) return null;

  function handleTap(icon, i) {
    onTap(icon.delta);
    const pos = positionsRef.current[i] ?? { x: 0, y: 0 };
    const id = nextPopupId.current++;
    setPopups(prev => [...prev, { id, x: pos.x, y: pos.y, delta: icon.delta }]);
    function remove() {
      setPopups(prev => prev.filter(pp => pp.id !== id));
    }
    // Safety net alongside onAnimationEnd below — if the animation never
    // fires (e.g. prefers-reduced-motion suppressing it), don't leak the
    // popup forever. Slightly longer than the CSS duration so the real
    // animationend wins in the normal case.
    setTimeout(remove, 950);
  }

  return (
    <div ref={containerRef} className={`relative overflow-visible ${className}`}>
      {icons.map((icon, i) => (
        <div key={i} ref={el => (iconRefs.current[i] = el)} className="absolute left-0 top-0 h-8 w-8">
          <button
            type="button"
            onClick={() => handleTap(icon, i)}
            aria-label={`${icon.label ?? icon.emoji}: ${icon.delta > 0 ? '+' : ''}${icon.delta}%`}
            className={`flex h-full w-full items-center justify-center rounded-lg text-xl leading-none backdrop-blur-sm transition-transform hover:scale-125 active:scale-90 ${TONE_CLASSES[tone]}`}
          >
            {icon.emoji}
          </button>
        </div>
      ))}

      {/* Tap feedback — floats up and fades, then removes itself. Position
          (left/top, static per popup) and the float-up animation (transform,
          owned by the keyframe) are on different properties so they can't
          fight the way the icon's own position/hover-scale transforms did. */}
      {popups.map(p => (
        <div
          key={p.id}
          className="pointer-events-none absolute left-0 top-0 -translate-x-1/2"
          style={{ left: p.x + ICON_SIZE / 2, top: p.y }}
        >
          <span
            onAnimationEnd={() => setPopups(prev => prev.filter(pp => pp.id !== p.id))}
            className={`block animate-[float-up_0.9s_ease-out_forwards] text-sm font-black text-legible ${
              p.delta > 0 ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {p.delta > 0 ? '+' : ''}{p.delta}%
          </span>
        </div>
      ))}
    </div>
  );
}
