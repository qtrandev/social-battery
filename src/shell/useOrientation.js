import { useEffect, useState } from 'react';

/** 'landscape' | 'portrait', tracked live via matchMedia. */
export function useOrientation() {
  const query = '(orientation: landscape)';
  const [orientation, setOrientation] = useState(() =>
    window.matchMedia(query).matches ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = e => setOrientation(e.matches ? 'landscape' : 'portrait');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return orientation;
}
