import { useEffect } from 'react';
import { habits, type HabitId } from '../content';
import { MomentChoice } from './MomentChoice';
import { setMotion } from '../ribbon/core';
import { TiltCard } from './Tilt';

type Props = {
  moment: HabitId;
  onMoment: (m: HabitId) => void;
  reduced: boolean;
};

// The chosen moment is shared with the Habits section.
export function Hero({ moment, onMoment, reduced }: Props) {
  // The ribbon itself is drawn by PageRibbon; the hero sets its shape and whether it moves.
  useEffect(() => setMotion(moment, reduced, reduced), [moment, reduced]);

  const habit = habits[moment];

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div className="hero__text">
          <h1 id="hero-title" className="hero__title">
            Your attention is worth more than a scroll.
          </h1>
          <p className="hero__lede">
            focus. is a digital-wellness campaign for Grades 9–12 about short-form media, focus, sleep and school.
            Explore the research and try practical habits that make more room for focus and rest.
          </p>
          <div className="hero__action">
            <a className="button" href="#challenge">
              Explore the challenge
            </a>
            <p className="hero__note">A voluntary seven-day challenge, planned for January 2027.</p>
          </div>
        </div>

        <div className="hero__try">
          {/* The ribbon gathers at this point; CSS places it per breakpoint. */}
          <span className="hero__anchor" aria-hidden="true" />
          <MomentChoice name="hero-moment" legend="Pick a moment to see a habit" value={moment} onChange={onMoment} />

          <TiltCard className="habit-card glass-surface" aria-live="polite">
            {/* The other habit sits invisibly in the same cell, so the card keeps one height. Otherwise the
                ribbon's gathering point (the anchor above) would move when the text length changes. */}
            <div className="habit-card__stack">
              <div key={moment} className="habit-card__body swap-in">
                <p className="habit-card__kicker">Habit to try</p>
                <p className="habit-card__name">{habit.name}</p>
                <p className="habit-card__text">{habit.text}</p>
              </div>
              <div className="habit-card__body habit-card__sizer" aria-hidden="true">
                <p className="habit-card__kicker">Habit to try</p>
                <p className="habit-card__name">{habits[moment === 'study' ? 'bed' : 'study'].name}</p>
                <p className="habit-card__text">{habits[moment === 'study' ? 'bed' : 'study'].text}</p>
              </div>
            </div>
            <a className="habit-card__link" href="#habits">
              More on both habits
            </a>
          </TiltCard>
        </div>
      </div>

    </section>
  );
}
