import { useState, useEffect } from 'react';

/** Matches theme fitting-room-lite.js mobile breakpoint (768px, we use 798 for collection parity). */
export default function useMobileMode(breakpoint = 798) {
  const query = `(max-width: ${breakpoint}px)`;

  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return mobile;
}
