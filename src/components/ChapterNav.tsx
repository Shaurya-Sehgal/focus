import { useEffect, useState } from 'react';
import { navLinks } from '../content';

// Wide screens only (CSS hides it below 96rem). Hidden while the hero is in view.
export function ChapterNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = ['top', ...navLinks.map((l) => l.href.slice(1))];
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    // A section is "current" when it crosses a thin band just above the middle of the window.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id === 'top' ? null : `#${e.target.id}`);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="chapters" aria-label="Chapters" data-visible={active !== null}>
      <ol>
        {navLinks.map((l) => (
          <li key={l.href}>
            <a href={l.href} aria-current={active === l.href ? 'location' : undefined}>
              {l.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
