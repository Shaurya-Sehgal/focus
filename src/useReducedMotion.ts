import { useEffect, useState } from 'react';

const query = '(prefers-reduced-motion: reduce)';

// True when the visitor's device asks for less motion; updates if they change the setting.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
