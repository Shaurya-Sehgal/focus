import type { HabitId } from '../content';

// Shared core for the light ribbon: the strand set, the hero strand formula, pointer easing and one clock.
// PageRibbon draws the whole ribbon from this; Hero sets the shape and whether it moves (setMotion),
// so the part below the hero is the same strands, moving in step.

// Vertical values are in units of S = min(height, 0.75 × width), so phones get the same shape, smaller.
export type Shape = {
  entry: number; // where strands enter on the left, relative to the focus point
  rise: number; // where the band leaves on the right, relative to the focus point
  spread0: number; // scatter at the entry edge
  spreadF: number; // band width at the focus point
  spreadEnd: number; // how much the band fans out afterwards
  wobble: number;
  speed: number;
  hue: number;
  bright: number;
};

// Two variations of one ribbon: both come up from the lower left into the same gathering point and continue
// down the page the same way, so switching only reshapes the right-hand sweep, the width and the colour.
export const SHAPES: Record<HabitId, Shape> = {
  // Studying: gathers into a defined (not single-pixel) beam that lifts up and to the right.
  study: { entry: 1.05, rise: -0.4, spread0: 0.26, spreadF: 0.035, spreadEnd: 0.13, wobble: 0.035, speed: 1, hue: 194, bright: 1 },
  // Before bed: the same band, slower and deeper blue, leaving low and opening out softly.
  bed: { entry: 1.1, rise: -0.14, spread0: 0.3, spreadF: 0.05, spreadEnd: 0.2, wobble: 0.03, speed: 0.55, hue: 220, bright: 0.85 },
};
const KEYS = Object.keys(SHAPES.study) as (keyof Shape)[];

export type Strand = { u: number; phase: number; freq: number; sp: number; alpha: number };
export type Pointer = { x: number; y: number; tx: number; ty: number; pull: number; target: number };

// Lighter version for phones: fewer strands, 30 fps.
export const small = matchMedia('(max-width: 40rem)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Seeded so both canvases get the same strands.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = seeded(7);
const count = small ? 22 : 46;
export const strands: Strand[] = Array.from({ length: count }, (_, i) => ({
  u: i / (count - 1) - 0.5 + (rand() - 0.5) * 0.04,
  phase: rand() * Math.PI * 2,
  freq: 1.2 + rand() * 2.2,
  sp: 0.6 + rand() * 0.8,
  alpha: 0.25 + rand() * 0.45,
}));

// Hero geometry in CSS pixels (measured by PageRibbon from the hero section and its anchor).
export const hero = {
  left: 0,
  top: 0, // document coordinates
  W: 0,
  H: 0,
  S: 0,
  fx: 0,
  fy: 0,
  segments: small ? 40 : 64,
};

/** The hero's strand: x and y at t ∈ [0, 1] across the hero, in hero-canvas CSS pixels. */
export function heroX(t: number) {
  return -0.05 * hero.W + t * 1.1 * hero.W;
}
export function heroTf() {
  return Math.min(0.85, Math.max(0.2, (hero.fx + 0.05 * hero.W) / (1.1 * hero.W)));
}
export function heroY(s: Strand, t: number, p: Shape, time: number, tf: number) {
  const { S, fy: FY } = hero;
  let yc: number, spread: number, wob: number;
  if (t < tf) {
    const q = t / tf;
    const k = q * q * (3 - 2 * q);
    const d = 1 - q; // 1 at the edge, 0 at the focus point
    yc = FY + p.entry * S * (1 - k);
    spread = p.spreadF + (p.spread0 - p.spreadF) * d ** 1.4;
    wob = p.wobble * d;
  } else {
    const q = (t - tf) / (1 - tf);
    const k = q * q * (3 - 2 * q);
    yc = FY + p.rise * S * k;
    spread = p.spreadF + (p.spreadEnd - p.spreadF) * q ** 1.2;
    wob = p.wobble * 0.5 * q;
  }
  // A slightly denser core with a few finer outer strands.
  const u = Math.sign(s.u) * 0.5 * Math.abs(2 * s.u) ** 1.25;
  // Long, mostly in-phase waves: strands breathe together instead of crossing and looping.
  return (
    yc +
    u * spread * S +
    Math.sin(t * s.freq * 0.5 * 6.283 + time * s.sp * 0.8 + s.phase * 0.35) * wob * S +
    Math.sin(time * 0.35 + t * 2.4) * 0.012 * S
  );
}
/** The middle of the band at t (no per-strand offset or wave), used to bend strands together. */
export function heroCenterY(t: number, p: Shape, time: number, tf: number) {
  return heroY(CENTRE, t, p, time, tf);
}
const CENTRE: Strand = { u: 0, phase: 0, freq: 0, sp: 0, alpha: 0 };

/** Quick to follow the pointer, slower to let go so strands settle back smoothly. */
export function easePointer(ptr: Pointer, dt: number) {
  const kp = 1 - Math.exp(-dt / 0.08);
  ptr.x += (ptr.tx - ptr.x) * kp;
  ptr.y += (ptr.ty - ptr.y) * kp;
  ptr.pull += (ptr.target - ptr.pull) * (1 - Math.exp(-dt / (ptr.target > ptr.pull ? 0.15 : 0.6)));
}

// One clock for both canvases. It stops while paused, for reduced motion, and when the tab is hidden.
// cur is the shape on screen; vel its rate of change. Switching habit springs every property together.
export const motion = { cur: { ...SHAPES.study } as Shape, vel: zero(), target: 'study' as HabitId, time: 0, still: false };
function zero() {
  return Object.fromEntries(KEYS.map((k) => [k, 0])) as Shape;
}
// Critically damped: starts from rest, no overshoot or bounce, about 95% there after 4.74 / OMEGA s (≈ 0.75 s).
// It keeps position and velocity, so switching again mid-way carries on from what is on screen.
const OMEGA = 6.3;
const subscribers = new Set<(dt: number) => void>();
let raf = 0;
let last = 0;
let skip = false;

function frame(now: number) {
  raf = requestAnimationFrame(frame);
  if (small && (skip = !skip)) return;
  const dt = Math.min((now - (last || now)) / 1000, 0.1);
  last = now;
  const target = SHAPES[motion.target];
  const decay = Math.exp(-OMEGA * dt);
  for (const key of KEYS) {
    // Exact step of a critically damped spring (stable for any dt).
    const e = motion.cur[key] - target[key];
    const v = motion.vel[key];
    const c = (v + OMEGA * e) * dt;
    motion.cur[key] = target[key] + (e + c) * decay;
    motion.vel[key] = (v - OMEGA * c) * decay;
  }
  motion.time += dt * motion.cur.speed;
  for (const fn of subscribers) fn(dt);
}

export function subscribe(fn: (dt: number) => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Paused or reduced motion: stop the clock and draw one still frame. Pausing freezes what is on screen
    (resuming carries on from there); choosing a habit while still shows that habit's shape directly. */
export function setMotion(target: HabitId, still: boolean, settle = false) {
  const changed = target !== motion.target;
  motion.target = target;
  motion.still = still;
  if (still) {
    cancelAnimationFrame(raf);
    raf = 0;
    if (changed || settle) Object.assign(motion.cur, SHAPES[target]); // settle: reduced motion shows the finished shape
    motion.vel = zero();
    for (const fn of subscribers) fn(0);
  } else if (!raf) {
    last = 0;
    raf = requestAnimationFrame(frame);
  }
}
