import { useEffect, useRef, useState } from 'react';
import type { SceneApi, SceneConfig } from './habitSceneRenderer';

export type SceneStatus = 'loading' | 'ready' | 'failed';

type Props = {
  config: SceneConfig;
  still: string;
  stillSmall: string;
  active: boolean;
  reduced: boolean;
  away?: boolean;
  onStatus?: (s: SceneStatus) => void;
};

// One habit artwork: the Blender still shows straight away (and stays if WebGL or the model can't
// load); the live 3D scene loads the first time this moment is shown near the screen, and fades in over the still.
export function HabitScene({ config, still, stillSmall, active, reduced, away = false, onStatus }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<SceneApi | null>(null);
  const [wanted, setWanted] = useState(false);
  const [ready, setReady] = useState(false);
  const live = useRef({ reduced, onStatus, away });
  live.current = { reduced, onStatus, away };

  const [near, setNear] = useState(false);
  // Only fetch three.js and the model once the panel is close to the screen.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (active && near) setWanted(true);
  }, [active, near]);

  useEffect(() => {
    const el = host.current;
    if (!wanted || !el) return;
    let cancelled = false;
    import('./habitSceneRenderer').then(
      ({ mountScene }) => {
        if (cancelled) return;
        api.current = mountScene(el, config, {
          reduced: () => live.current.reduced,
          onReady: () => {
            if (live.current.away) api.current?.setAway(true, true);
            setReady(true);
            live.current.onStatus?.('ready');
          },
          onFail: () => live.current.onStatus?.('failed'),
        });
      },
      () => live.current.onStatus?.('failed'),
    );
    return () => {
      cancelled = true;
      api.current?.dispose();
      api.current = null;
    };
  }, [wanted, config]);

  // Reduced motion: the phone appears in its new place without sliding.
  useEffect(() => api.current?.setAway(away, reduced), [away, reduced]);

  return (
    <div ref={host} className="habit-scene" data-active={active} data-ready={ready} aria-hidden="true">
      <img
        className="habit-scene__still"
        src={still}
        srcSet={`${stillSmall} 800w, ${still} 1600w`}
        sizes="(min-width: 56rem) 52vw, 100vw"
        alt=""
        decoding="async"
      />
    </div>
  );
}
