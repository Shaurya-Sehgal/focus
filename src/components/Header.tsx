import { navLinks } from '../content';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="wrap site-header__inner">
        <a href="#top" className="site-header__home" aria-label="focus. home">
          <Logo tone="white" className="site-header__logo" />
        </a>
        <nav aria-label="Main">
          <ul className="site-nav">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
