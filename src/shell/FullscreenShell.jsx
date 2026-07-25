import { useRef } from 'react';
import { Link } from 'react-router';
import { useFullscreen } from './useFullscreen.js';
import { useOrientation } from './useOrientation.js';

export const shellButtonClass =
  'rounded-full bg-black/30 p-2.5 text-white/70 backdrop-blur-sm transition hover:bg-black/50 hover:text-white';

/**
 * Generic ambient-display shell: fullscreen toggle + a landscape/portrait
 * class on the root so battery-specific layouts can respond to either.
 * Knows nothing about batteries — reusable for any single-purpose gauge page.
 *
 * Pass `homeHref={false}` to hide the home button; defaults to "/".
 * Pass `topRightExtra` (a node) to append more buttons under Home — e.g. an
 * owner-only edit button. The shell has no idea what it is; it just stacks it.
 */
export default function FullscreenShell({ children, background, homeHref = '/', topRightExtra }) {
  const rootRef = useRef(null);
  const { isFullscreen, toggle } = useFullscreen(rootRef);
  const orientation = useOrientation();

  return (
    <div
      ref={rootRef}
      data-orientation={orientation}
      className="relative min-h-screen w-full overflow-hidden"
      style={background ? { background } : undefined}
    >
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={toggle}
          className={shellButtonClass}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3v4a2 2 0 0 1-2 2H3M15 3v4a2 2 0 0 0 2 2h4M9 21v-4a2 2 0 0 0-2-2H3M15 21v-4a2 2 0 0 1 2-2h4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            </svg>
          )}
        </button>
        {homeHref && (
          <Link to={homeHref} className={shellButtonClass} aria-label="Go home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        {topRightExtra}
      </div>
      {children}
    </div>
  );
}
