import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Research } from './components/Research';
import { Habits } from './components/Habits';
import { ChallengeWalkthrough } from './components/ChallengeWalkthrough';
import { ChapterNav } from './components/ChapterNav';
import { PageRibbon } from './components/PageRibbon';
import type { HabitId } from './content';
import { useReducedMotion } from './useReducedMotion';
import { TiltCard } from './components/Tilt';

export default function App() {
  const [moment, setMoment] = useState<HabitId>('study');
  const reduced = useReducedMotion();

  return (
    <>
      <Header />
      <ChapterNav />
      <main id="main">
        <Hero
          moment={moment}
          onMoment={setMoment}
          reduced={reduced}
        />
        <Research />
        <Habits moment={moment} onMoment={setMoment} reduced={reduced} />

        <section className="challenge section" id="challenge" aria-labelledby="challenge-title">
          <div className="wrap">
            <div className="challenge__head">
              <h2 id="challenge-title" className="h2">
                The <span className="nowrap">seven-day</span> challenge
              </h2>
              <div>
                <p className="challenge__tag">Preview</p>
                <p>
                  Planned for January 2027. Explore the three steps: record your usual week, try one habit, and
                  reflect on your experience.
                </p>
              </div>
            </div>

            <ChallengeWalkthrough />

            <div className="challenge__details">
              <TiltCard className="challenge__draw glass-surface">
                <h3 className="h3">Planned completion and prize draw</h3>
                <ul className="plain-list">
                  <li>Log your habit on at least five of the seven days and submit a short reflection: one prize-draw entry.</li>
                  <li>Complete a five-question learning quiz: one bonus entry.</li>
                  <li>Winners are drawn randomly. Taking part is voluntary and free.</li>
                </ul>
              </TiltCard>
              <TiltCard className="status glass-surface">
                <h3 className="h3">Registration isn’t open yet</h3>
                <p>
                  Check back here for registration details and challenge updates.
                </p>
              </TiltCard>
            </div>
          </div>
        </section>

        <section className="about section" id="about" aria-labelledby="about-title">
          <div className="wrap about__grid">
            <div>
              <h2 id="about-title" className="h2">
                About the campaign
              </h2>
              <p>
                focus. explains the evidence on short-form media, focus, sleep and school carefully, offers digital
                habits that are manageable for students, and introduces a voluntary seven-day challenge. It’s written
                for high-school students, with teachers and parents in mind too.
              </p>
              <div className="about__survey">
                <h3 className="h3">Screen time, focus and sleep survey</h3>
                <p>Tell us about your own screen time, focus and sleep to help shape the campaign.</p>
                <a
                  className="button"
                  href="https://docs.google.com/forms/d/e/1FAIpQLScDXsB2lFy5_-sxCPuZpFvwPsdOQ6fPeh3PrsLLhREaZSgS5A/viewform"
                  target="_blank"
                  rel="noreferrer"
                >
                  Take the survey
                  <span className="visually-hidden"> (opens a Google Form in a new tab)</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="h3">
                What we’re aiming for by <span className="nowrap">January 19, 2027</span>
              </h3>
              <ul className="goals">
                <li>Four classroom presentations reaching about 100 students</li>
                <li>500 to 1,000 accounts reached online</li>
                <li>50 eligible challenge registrations</li>
                <li>At least 30 completions</li>
              </ul>
              <p className="muted">
                We’re also aiming for a 15% reduction in average daily use of the selected apps across the challenge group.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <PageRibbon />
    </>
  );
}
