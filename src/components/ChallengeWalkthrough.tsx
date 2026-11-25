import { useState, type CSSProperties } from 'react';
import { challenge, stages, type StageId } from '../content';
import { tabKeys } from './tabKeys';
import { TiltCard } from './Tilt';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// What happens in each week, said once per week rather than marked on every day.
const weeks = [
  { ...challenge.baseline, role: 'Record your daily minutes on the selected apps.' },
  { ...challenge.challenge, role: 'Keep recording the same way, and practise your habit.' },
];

// Illustration only: shows which dates each stage covers. It holds no data and records nothing.
function Calendar({ stage }: { stage: StageId }) {
  return (
    <div className="cal" data-stage={stage} aria-hidden="true">
      {weeks.map((w, row) => (
        <div key={w.label} className="cal__week" data-week={row + 1}>
          <p className="cal__head">
            <span className="cal__label">{w.label}</span> <span className="cal__dates">{w.dates}</span>
          </p>
          <ol className="cal__days">
            {weekdays.map((d, k) => (
              <li key={d} className="cal__day" style={{ '--i': k } as CSSProperties}>
                <span className="cal__name">{d}</span>
                <span className="cal__date">{w.start + k}</span>
              </li>
            ))}
          </ol>
          <p className="cal__role">{w.role}</p>
        </div>
      ))}
      <div className="cal__compare">
        <span>Compare</span>
      </div>
    </div>
  );
}

export function ChallengeWalkthrough() {
  const [i, setI] = useState(0);
  const stage = stages[i];
  const last = i === stages.length - 1;

  return (
    <div className="walk" style={{ '--step': i } as CSSProperties}>
      <div role="tablist" aria-label="Challenge steps" className="walk__steps">
        {stages.map((s, j) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`step-${s.id}`}
            aria-selected={i === j}
            data-done={j < i}
            aria-controls="walk-panel"
            tabIndex={i === j ? 0 : -1}
            className="walk__step"
            onClick={() => setI(j)}
            onKeyDown={(e) => tabKeys(e, j, stages.length, setI)}
          >
            <span className="walk__num">{j + 1}</span>
            <span className="walk__title">{s.title}</span>
          </button>
        ))}
      </div>

      <div className="walk__panel" role="tabpanel" id="walk-panel" aria-labelledby={`step-${stage.id}`}>
        <Calendar stage={stage.id} />
        <TiltCard className="walk__text glass-surface">
          {/* Keyed so the text plays its swap animation; the button stays outside so focus isn't lost. */}
          <div key={stage.id} className="swap-in">
            <p className="walk__when">{stage.when}</p>
            <h3 className="walk__heading">{stage.title}</h3>
            <p>{stage.body}</p>
            {stage.note && <p className="walk__note">{stage.note}</p>}
          </div>
          <button type="button" className="walk__next" onClick={() => setI(last ? 0 : i + 1)}>
            {last ? 'Back to step 1' : `Next: ${stages[i + 1].title}`}
          </button>
        </TiltCard>
      </div>
    </div>
  );
}
