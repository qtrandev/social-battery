import { useCallback, useEffect, useState } from 'react';

/** Generic fullscreen toggle for a given element ref (defaults to <html>). */
export function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enter = useCallback(() => {
    const el = targetRef?.current ?? document.documentElement;
    el.requestFullscreen?.();
  }, [targetRef]);

  const exit = useCallback(() => {
    document.exitFullscreen?.();
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) exit();
    else enter();
  }, [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
