import { useRef, useState } from 'react';
import { habits, type HabitId } from '../content';
import { MomentChoice } from './MomentChoice';
import { HabitScene, type SceneStatus } from './HabitScene';
import type { SceneConfig } from './habitSceneRenderer';
import { useTilt } from './Tilt';
import studyGlb from '../assets/habits/study.glb?url';
import studyStill from '../assets/habits/study.webp';
import studyStillSmall from '../assets/habits/study-800.webp';
import bedGlb from '../assets/habits/bed.glb?url';
import bedStill from '../assets/habits/bed.webp';
import bedStillSmall from '../assets/habits/bed-800.webp';

// Blender artwork for each moment: concepts/habits-study/v3 and concepts/habits-bedtime/v2, built with
// concepts/tools/. Illustrative only: nothing here connects to a phone.
const STUDY: SceneConfig = {
  glb: studyGlb,
  phone: 'Phone',
  lights: [
    { dir: [-0.573, -0.408, 0.711], color: [1, 0.92, 0.84], intensity: 2.2 }, // key
    { dir: [0.728, -0.562, 0.392], color: [0.74, 0.81, 1], intensity: 0.18 }, // fill
    { dir: [0.223, 0.906, 0.36], color: [0.62, 0.77, 1], intensity: 0.75 }, // rim
  ],
  // Across the desk to the right and turned away, still in view at every panel size.
  away: { dx: 0.06, dz: 0.1, rot: (-31 * Math.PI) / 180 },
  shift: -0.135,
};

const BED: SceneConfig = {
  glb: bedGlb,
  phone: 'Bed_Phone',
  lights: [
    { dir: [0.24, 0.17, 0.885], color: [1, 0.62, 0.32], intensity: 0.37, point: true }, // the reading lamp's bulb
    { dir: [-0.55, -0.62, 0.69], color: [0.55, 0.66, 1], intensity: 0.24 }, // dim moonlight
  ],
  shift: 0.025,
};

const moments = Object.keys(habits) as HabitId[];

type Props = { moment: HabitId; onMoment: (m: HabitId) => void; reduced: boolean };

export function Habits({ moment, onMoment, reduced }: Props) {
  const habit = habits[moment];
  const [away, setAway] = useState(false);
  const [studyStatus, setStudyStatus] = useState<SceneStatus>('loading');
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  useTilt(stage, card, reduced);

  return (
    <section className="habits" id="habits" aria-labelledby="habits-title">
      <div className="wrap habits__grid">
        <div className="habits__copy">
          <h2 id="habits-title" className="h2">
            Two habits to start with
          </h2>
          <MomentChoice name="habit-moment" legend="Choose a moment" value={moment} onChange={onMoment} />
          <div className="habits__live" aria-live="polite">
            <p key={moment} className="habits__text swap-in">
              {habit.text}
            </p>
          </div>
          <p className="habits__aside">
            <strong>See your own numbers.</strong> Your phone already counts daily minutes by app: Screen Time on
            iPhone, Digital Wellbeing on Android. Our planned classroom sessions will show where to find it.
          </p>
        </div>

        <div className="habit-figure">
          {/* The stage never moves, so the tilting panel can't flicker in and out of its own hover area. */}
          <div className="habit-stage" ref={stage}>
            {/* Back to front: the Blender artwork, a translucent caption surface, crisp text. */}
            <div className="habit-panel" ref={card}>
              <div className="habit-panel__art">
                <HabitScene
                  config={STUDY}
                  still={studyStill}
                  stillSmall={studyStillSmall}
                  active={moment === 'study'}
                  reduced={reduced}
                  away={away}
                  onStatus={setStudyStatus}
                />
                <HabitScene config={BED} still={bedStill} stillSmall={bedStillSmall} active={moment === 'bed'} reduced={reduced} />
                <div className="habit-panel__sheen" aria-hidden="true" />
              </div>
              {/* Both captions share one grid cell, so the surface keeps the size of the longer one. */}
              <div className="habit-caption glass-surface">
                {moments.map((id) => (
                  <div key={id} className="habit-caption__item" data-active={id === moment}>
                    <p className="habit-caption__moment">{habits[id].moment}</p>
                    <h3 className="habit-caption__name">{habits[id].name}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Same height for both moments: the button has a fixed slot, empty before bed, so nothing shifts. */}
          <div className="habit-controls">
            <div className="habit-controls__slot">
              {moment === 'study' && studyStatus !== 'failed' && (
                <button
                  type="button"
                  className="habit-controls__toggle"
                  aria-pressed={away}
                  disabled={studyStatus !== 'ready'}
                  onClick={() => setAway(!away)}
                >
                  {away ? 'Put the phone back' : 'Preview phone-free studying'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
