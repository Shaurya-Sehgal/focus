import { useEffect, useRef, type HTMLAttributes, type RefObject } from 'react';
import { useReducedMotion } from '../useReducedMotion';

// Panel response. The scene inside turns a little against the panel (habitSceneRenderer.ts PARALLAX) and the
// caption rides ahead of it (habits.css), so the three layers read as depth rather than one flat card turning.
const TILT = { y: 5.5, x: 4.5, lift: 6, tau: 0.16 }; // degrees around each axis, px, s

/** Tilt toward the pointer with a small lift. A response curve makes the middle of the panel react too, not
    only its edges. The sheen and caption read the same eased value (--tilt-x/y/m), and the scene's parallax
    uses the same easing time, so the layers move as one piece and settle together with no bounce.
    Fine pointers only; touch and reduced motion get the still treatment in habits.css. */
export function useTilt(stageRef: RefObject<HTMLDivElement | null>, cardRef: RefObject<HTMLDivElement | null>, reduced: boolean) {
  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card || reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const cur = { x: 0, y: 0, lift: 0 };
    const tgt = { ...cur };
    let raf = 0, last = 0;

    function frame(now: number) {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-dt / TILT.tau);
      let busy = false;
      for (const key of Object.keys(cur) as (keyof typeof cur)[]) {
        cur[key] += (tgt[key] - cur[key]) * k;
        if (Math.abs(tgt[key] - cur[key]) > 0.002) busy = true;
        else cur[key] = tgt[key];
      }
      // Back to no transform at rest, so text and the scene render at full sharpness.
      card!.style.transform =
        !busy && tgt.lift === 0
          ? ''
          : `translateY(${-TILT.lift * cur.lift}px) rotateX(${-TILT.x * cur.y}deg) rotateY(${TILT.y * cur.x}deg)`;
      card!.style.setProperty('--tilt-x', cur.x.toFixed(3));
      card!.style.setProperty('--tilt-y', cur.y.toFixed(3));
      card!.style.setProperty('--tilt-m', Math.min(1, Math.hypot(cur.x, cur.y)).toFixed(3));
      raf = busy ? requestAnimationFrame(frame) : 0;
    }
    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    function onMove(e: PointerEvent) {
      const r = stage!.getBoundingClientRect();
      tgt.x = curve(((e.clientX - r.left) / r.width) * 2 - 1);
      tgt.y = curve(((e.clientY - r.top) / r.height) * 2 - 1);
      tgt.lift = 1;
      wake();
    }
    function onLeave() {
      tgt.x = tgt.y = tgt.lift = 0;
      wake();
    }
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      card.style.transform = '';
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--tilt-m');
    };
  }, [stageRef, cardRef, reduced]);
}

/** Clamped to ±1 and eased so half-way across the panel already gives about 70% of the tilt. */
function curve(v: number) {
  const c = Math.max(-1, Math.min(1, v));
  return Math.sign(c) * Math.abs(c) ** 0.55;
}

/** A glass card with the Habits panel's hover: the outer div is the stationary hit area, the inner one tilts. */
export function TiltCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  useTilt(stage, card, useReducedMotion());
  return (
    <div ref={stage} className="tilt-stage">
      <div ref={card} className={className} {...rest}>
        {children}
      </div>
    </div>
  );
}
