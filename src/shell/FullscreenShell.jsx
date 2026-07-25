import { useRef } from 'react';
import { useFullscreen } from './useFullscreen.js';
import { useOrientation } from './useOrientation.js';

/**
 * Generic ambient-display shell: fullscreen toggle + a landscape/portrait
 * class on the root so battery-specific layouts can respond to either.
 * Knows nothing about batteries — reusable for any single-purpose gauge page.
 */
export default function FullscreenShell({ children, background }) {
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
      <button
        onClick={toggle}
        className="absolute top-3 right-3 z-20 rounded-full bg-black/30 p-2.5 text-white/70 backdrop-blur-sm transition hover:bg-black/50 hover:text-white"
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
      {children}
    </div>
  );
}
