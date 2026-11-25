import { navLinks, sources } from '../content';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        <div className="site-footer__brand">
          <Logo tone="white" className="site-footer__logo" />
          <p>A digital-wellness campaign for Grades 9–12.</p>
          <nav aria-label="Footer">
            <ul className="site-footer__nav">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
              <li>
                <a href="#sources">Sources</a>
              </li>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
            </ul>
          </nav>
        </div>

        <section id="sources" aria-labelledby="sources-title">
          <h2 id="sources-title" className="site-footer__title">
            Sources
          </h2>
          <ol className="source-list">
            {sources.map((s) => (
              <li key={s.id} id={`source-${s.id}`}>
                {s.cite}. {s.title}.{' '}
                <a href={s.url} target="_blank" rel="noreferrer">
                  Read the source<span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section id="privacy" aria-labelledby="privacy-title">
          <h2 id="privacy-title" className="site-footer__title">
            Privacy
          </h2>
          <p>
            This website only shares information. It has no accounts, forms, cookies or analytics, and it doesn’t
            collect anything about you or track your phone.
          </p>
        </section>
      </div>
      <div className="wrap site-footer__credits">
        <p>Typeface: Archivo by Omnibus-Type, SIL Open Font License. Research links belong to their publishers.</p>
      </div>
    </footer>
  );
}
