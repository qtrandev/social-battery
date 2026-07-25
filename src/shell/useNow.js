import { useEffect, useState } from 'react';

/** Current time, re-rendering every `intervalMs` (default 30s — this is a slow gauge, not a stopwatch). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
