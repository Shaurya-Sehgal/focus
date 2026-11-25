import { useState } from 'react';
import { findings, sources } from '../content';
import { tabKeys } from './tabKeys';
import { TiltCard } from './Tilt';

export function Research() {
  const [i, setI] = useState(0);
  const f = findings[i];
  const cited = sources.filter((s) => f.sources.includes(s.id));

  return (
    <section className="research section" id="why" aria-labelledby="why-title">
      <div className="wrap research__grid">
        <div className="research__intro">
          <h2 id="why-title" className="h2">
            Why it matters
          </h2>
          <p>
            Explore research on screen use, sleep and attention, including findings from students in Halton.
          </p>
          <div role="tablist" aria-label="Research topics" aria-orientation="vertical" className="topics">
            {findings.map((x, j) => (
              <button
                key={x.topic}
                type="button"
                role="tab"
                id={`topic-${j}`}
                aria-selected={i === j}
                aria-controls="evidence"
                tabIndex={i === j ? 0 : -1}
                className={`topic${i === j ? ' glass-surface' : ''}`}
                onClick={() => setI(j)}
                onKeyDown={(e) => tabKeys(e, j, findings.length, setI)}
              >
                <span className="topic__name">{x.topic}</span>
                <span className="topic__scope">{x.scope}</span>
              </button>
            ))}
          </div>
        </div>

        <TiltCard className="evidence glass-surface" role="tabpanel" id="evidence" aria-labelledby={`topic-${i}`}>
          <div key={i} className="swap-in">
            <p className="evidence__scope">{f.scope}</p>
            <p className="evidence__claim">{f.claim}</p>
            <dl className="evidence__facts">
              <div>
                <dt>Who and how</dt>
                <dd>{f.method}</dd>
              </div>
            </dl>
            <p className="evidence__sources">
              {cited.length > 1 ? 'Sources: ' : 'Source: '}
              {cited.map((s, k) => (
                <span key={s.id}>
                  {k > 0 && ', '}
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.cite}
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </span>
              ))}
            </p>
          </div>
        </TiltCard>

      </div>
    </section>
  );
}
