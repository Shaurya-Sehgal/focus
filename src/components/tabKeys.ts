import type { KeyboardEvent } from 'react';

// Keyboard support for a tab list (WAI-ARIA tabs pattern, selection follows focus).
// Arrow keys in either direction work, so the same list can sit vertically or horizontally.
export function tabKeys(e: KeyboardEvent<HTMLElement>, index: number, count: number, select: (i: number) => void) {
  let i = -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (index + 1) % count;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (index - 1 + count) % count;
  else if (e.key === 'Home') i = 0;
  else if (e.key === 'End') i = count - 1;
  if (i < 0) return;
  e.preventDefault();
  select(i);
  (e.currentTarget.parentElement?.children[i] as HTMLElement | undefined)?.focus();
}
