import { useEffect, useRef } from 'react';
import { finePointer, hero, heroCenterY, heroTf, heroX, heroY, motion, SHAPES, small, strands, subscribe, easePointer, type Pointer, type Strand } from '../ribbon/core';
import { flowPath, type FlowPath, type Guide } from '../ribbon/path';

// The whole light ribbon, hero included, drawn on one fixed, viewport-sized canvas.
// In the hero each strand follows the original hero formula. Through the lower hero it eases into
// one broad route down the page (src/ribbon/path.ts), so the bundle narrows before it reaches
// "Why it matters" and every strand is one unbroken line. The pointer bends the finished lines
// through a single smooth field, so nothing can split at a section edge.
// Both habits use the same route; switching reshapes only the hero sweep and the colour (src/ribbon/core.ts),
// so the strands stay one connected band throughout the change.
// The canvas sits between section backgrounds and their content (main .wrap is above it),
// is quieter on light sections, and fades behind page text through a soft mask.

const SECTIONS: { id: string; tone: 'dark' | 'light' }[] = [
  { id: 'why', tone: 'light' },
  { id: 'habits', tone: 'dark' },
  { id: 'challenge', tone: 'light' },
  { id: 'about', tone: 'light' },
];
// Text and controls the ribbon fades behind (outside the hero, where it was always clear of text).
const MASKED = 'main h2, main h3, main p, main li, main legend, main .choices, main .walk__step, main dl, main .button, .chapters';
// In the hero the ribbon is part of the composition, so text there only dims it partly.
const HERO_MASKED = '.hero__title, .hero__lede, .hero__action, .hero .choices';
const HERO_MASK = 0.55;
const MASK_SCALE = 8;
const CONVERGE = 0.26; // the lowest part of the hero (as a share of its height) where strands gather into the route
const JOIN = 300; // px of route over which each strand eases from the hero formula into the route
// Pointer field: smooth, bounded, and the same everywhere on the ribbon.
const RADIUS = 160;
const STRENGTH = 0.7;
const MAX_BEND = 46; // px
const OVERSCAN = 0.3; // extra canvas above and below the screen, as a share of its height

type Rect = { top: number; bottom: number; height: number };
type Band = { top: number; bottom: number; tone: 'hero' | 'dark' | 'light' };
type Anchor = { x: number; y: number; dx: number; dy: number; cy: number; t: number };

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function PageRibbon() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d')!;
    const ptr: Pointer = { x: 0, y: 0, tx: 0, ty: 0, pull: 0, target: 0 };
    let dpr = 1, vw = 0, vh = 0, seam = 0;
    // The canvas scrolls with the page (so the ribbon can't lag behind it) and is moved to stay around
    // the visible area each time it redraws. ct = its top in document coordinates.
    let CH = 0, ct = 0, lastTop = -1, docH = 0, scrollOff = 0;
    let bands: Band[] = [];
    // The route down the page (one for both habits).
    let route: FlowPath | null = null;
    let n = 0;
    let px: Float32Array = new Float32Array(0), py = px, pw = px, pnx = px, pny = px;
    const shapes: Path2D[] = strands.map(() => new Path2D());
    const hx = new Float32Array(hero.segments + 1);
    const hy = new Float32Array(hero.segments + 1);

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      vw = document.documentElement.clientWidth;
      vh = window.innerHeight;
      // Taller than the screen, so there is always drawn ribbon above and below while the page scrolls.
      CH = Math.round(vh * (1 + 2 * OVERSCAN));
      canvas!.width = Math.round(vw * dpr);
      canvas!.height = Math.round(CH * dpr);
      canvas!.style.height = `${CH}px`;
      docH = document.documentElement.scrollHeight;
      lastTop = -1;

      const top = document.getElementById('top');
      const anchorEl = document.querySelector<HTMLElement>('.hero__anchor');
      if (!top) return;
      const hr = top.getBoundingClientRect();
      hero.left = hr.left + window.scrollX;
      hero.top = hr.top + window.scrollY;
      hero.W = hr.width;
      hero.H = hr.height;
      hero.S = Math.min(hero.H, hero.W * 0.75);
      const a = anchorEl?.getBoundingClientRect();
      hero.fx = a ? a.left + a.width / 2 - hr.left : hero.W * 0.6;
      hero.fy = a ? a.top + a.height / 2 - hr.top : hero.H * 0.5;
      seam = hero.top + hero.H;

      const rect = (id: string): Rect | null => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, height: r.height };
      };
      const found = SECTIONS.map((s) => rect(s.id));
      if (found.some((r) => !r)) return;
      const [why, habits, challenge, about] = found as Rect[];
      bands = [
        { top: hero.top, bottom: seam, tone: 'hero' },
        ...SECTIONS.map((s, i) => ({ top: found[i]!.top, bottom: found[i]!.bottom, tone: s.tone })),
      ];

      const wrap = document.querySelector<HTMLElement>('#why .wrap');
      const contentLeft = wrap ? wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft) : 24;
      // Guide x in the side margins; on narrow layouts it moves past the screen edge so half the band runs off-screen.
      const L = contentLeft * 0.32 - Math.max(0, 120 - contentLeft) * 0.35;
      const W = vw;
      const k = Math.min(1, Math.max(0.45, vw / 1440)); // narrower band on small screens
      const narrow = vw < 640;

      // Where the studying strands start to gather, on average, and which way they are heading.
      let cx = 0, cy = 0, dx = 0, dy = 0, hits = 0;
      const tf = heroTf();
      for (const s of strands) {
        const hit = anchorOf(s, SHAPES.study, 0, tf);
        if (hit) {
          cx += hit.x;
          cy += hit.cy;
          dx += hit.dx;
          dy += hit.dy;
          hits++;
        }
      }
      const c = hits ? { x: hero.left + cx / hits, y: hero.top + cy / hits } : { x: hero.left + hero.W * 0.15, y: seam };
      const dl = Math.hypot(dx, dy) || 1;
      const d = hits ? { x: dx / dl, y: dy / dl } : { x: -0.6, y: 0.8 };

      // Shared middle of the route.
      const middle: Guide[] = [
        { x: L, y: why.top + why.height * 0.45, w: 24 * k },
        { x: L, y: why.bottom - why.height * 0.12, w: 22 * k },
        // Phones stack the Habits content, so the band crosses in its empty top padding and reaches the edge sooner.
        { x: W * 0.5, y: habits.top + habits.height * (narrow ? 0.03 : 0.12), w: 130 * k },
        { x: W - L * 0.6, y: habits.top + habits.height * (narrow ? 0.35 : 0.78), w: 60 * k },
        { x: W - L, y: challenge.top + challenge.height * 0.35, w: 24 * k },
        { x: W - L, y: challenge.bottom - challenge.height * 0.1, w: 20 * k },
        { x: W * 0.72, y: about.top + about.height * 0.55, w: 60 * k },
        { x: W * 0.4, y: about.bottom + 40, w: 90 * k },
      ];
      // Starts where the hero strands gather and keeps their heading; a narrow bundle
      // through the hero edge, opening out again further down.
      const study = flowPath(
        [{ x: c.x, y: c.y, w: 40 * k }, { x: c.x + d.x * 240, y: c.y + d.y * 240, w: 32 * k }, ...middle],
        8,
      );
      route = study;
      ({ x: px, y: py, w: pw, nx: pnx, ny: pny } = study);
      n = study.x.length;

      // Soft mask: blurred boxes around page text, at 1/8 scale, in document coordinates.
      // (docH measured above)
      mask.width = Math.ceil(vw / MASK_SCALE);
      mask.height = Math.ceil(docH / MASK_SCALE);
      mctx.setTransform(1 / MASK_SCALE, 0, 0, 1 / MASK_SCALE, 0, 0);
      mctx.clearRect(0, 0, vw, docH);
      mctx.filter = 'blur(2px)';
      mctx.fillStyle = '#000';
      for (const el of document.querySelectorAll<HTMLElement>(MASKED)) {
        if (el.closest('#top')) continue;
        for (const r of el.getClientRects()) {
          if (!r.width || !r.height) continue;
          mctx.fillRect(r.left - 10, r.top + window.scrollY - 8, r.width + 20, r.height + 16);
        }
      }
      mctx.fillStyle = `rgb(0 0 0 / ${HERO_MASK})`;
      for (const el of document.querySelectorAll<HTMLElement>(HERO_MASKED)) {
        for (const r of el.getClientRects()) {
          if (!r.width || !r.height) continue;
          mctx.fillRect(r.left - 10, r.top + window.scrollY - 8, r.width + 20, r.height + 16);
        }
      }
      mctx.filter = 'none';
    }

    // 0 = studying, 1 = before bed; follows the hero's own eased shape change.
    const bedness = () => smooth((motion.cur.hue - SHAPES.study.hue) / (SHAPES.bed.hue - SHAPES.study.hue));

    /** Sample the hero strand into hx/hy (hero coordinates) and find where it reaches the gathering zone. */
    function anchorOf(s: Strand, shape = motion.cur, time = motion.time, tf = heroTf()): Anchor | null {
      const segs = hero.segments;
      for (let j = 0; j <= segs; j++) {
        hx[j] = heroX(j / segs);
        hy[j] = heroY(s, j / segs, shape, time, tf);
      }
      const line = hero.H * (1 - CONVERGE);
      // Walk from the focus point back along the tail to the first point inside the gathering zone.
      for (let j = Math.floor(tf * segs); j > 0; j--) {
        if (hy[j] < line && hy[j - 1] >= line) {
          const f = (line - hy[j]) / (hy[j - 1] - hy[j]);
          const t = (j - f) / segs;
          const l = Math.hypot(hx[j - 1] - hx[j], hy[j - 1] - hy[j]) || 1;
          return {
            x: hx[j] + (hx[j - 1] - hx[j]) * f,
            y: line,
            dx: (hx[j - 1] - hx[j]) / l,
            dy: (hy[j - 1] - hy[j]) / l,
            cy: heroCenterY(t, shape, time, tf),
            t,
          };
        }
      }
      return null;
    }

    // Position of strand s at sample i of the current route, in document coordinates.
    function along(s: Strand, i: number, step: number, out: { x: number; y: number }) {
      const d = i * step;
      const t = motion.time;
      const w = pw[i];
      // Twist: strands swap sides slowly along the band; the twist itself drifts with time. Near the hero the
      // order is held as it arrives, so strands don't all cross over each other in the join.
      const free = Math.cos(d / 520 + Math.sin(d / 1900) * 1.4 - t * 0.22 + 0.6);
      const hold = smooth(d / 700);
      const twist = 1 + (free - 1) * hold;
      // The hero's own wave, travelling down the page.
      const wave = Math.sin((d / 700) * s.freq * 6.283 - t * s.sp + s.phase);
      const off = s.u * w * 2 * twist + wave * w * 0.28 + Math.sin(t * 0.35 + d / 900) * w * 0.15;
      out.x = px[i] + pnx[i] * off;
      out.y = py[i] + pny[i] * off;
    }

    // One pointer field for the whole ribbon. Points move by the offset of the band's middle from the
    // pointer, so neighbouring strands bend together and keep their spacing; the strength fades
    // smoothly with distance and the movement is capped.
    function bend(pt: { x: number; y: number }, cx: number, cy: number) {
      if (ptr.pull < 0.001) return;
      const pX = ptr.x;
      const pY = ptr.y + scrollOff; // pointer is in screen coordinates; the canvas follows the page
      const ddx = pX - pt.x;
      const ddy = pY - pt.y;
      const d2 = ddx * ddx + ddy * ddy;
      const cut = Math.max(0, 1 - d2 / (2.6 * RADIUS) ** 2);
      const f = STRENGTH * ptr.pull * Math.exp(-d2 / (2 * RADIUS * RADIUS)) * cut * cut;
      if (f < 1e-4) return;
      let mx = (pX - cx) * f;
      let my = (pY - cy) * f;
      const m = Math.hypot(mx, my);
      const soft = 1 / Math.sqrt(1 + (m / MAX_BEND) ** 2); // smooth cap instead of a hard limit
      mx *= soft;
      my *= soft;
      pt.x += mx;
      pt.y += my;
    }

    // Alpha on the sections below the hero: starts as faint as the hero's tail, fades out before the footer.
    function fade(y: number) {
      const a = 0.15 + 0.85 * smooth((y - seam) / 480);
      return a * Math.min(1, Math.max(0, (py[n - 1] - y) / 700));
    }

    function draw(_dt: number) {
      const c = ctx!;
      const sy = window.scrollY;
      // Keep the canvas around the visible part of the page; it moves only when it redraws.
      ct = Math.max(0, Math.min(Math.max(0, docH - CH), Math.round(sy - vh * OVERSCAN)));
      if (ct !== lastTop) {
        canvas!.style.transform = `translateY(${ct}px)`;
        lastTop = ct;
      }
      scrollOff = sy - ct;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.clearRect(0, 0, vw, CH);
      if (!route || !n || !hero.W) return;
      const b = bedness();
      if (hero.top - ct > CH || py[n - 1] - ct < 0) return;

      const step = route.step;
      const top = ct - 40;
      const bottom = ct + CH + 40;
      let lo = 0, hi = n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (py[mid] < top - 300) lo = mid + 1;
        else hi = mid;
      }
      const first = lo;
      const pt = { x: 0, y: 0 };
      const tf = heroTf();
      const joinEnd = Math.round(JOIN / step);
      const heroOn = hero.top - ct < CH && seam - ct > -JOIN;
      const ox = hero.left;
      const oy = hero.top - ct; // hero coordinates → canvas
      const segs = hero.segments;
      const cur = motion.cur, time = motion.time;

      // Where the middle of the hero band reaches the gathering zone. One value for every strand, and it
      // moves smoothly, so nothing can jump. Both habits come down here, so the join never switches off.
      let tA = -1;
      if (heroOn) {
        const line = hero.H * (1 - CONVERGE);
        let yPrev = heroCenterY(Math.floor(tf * segs) / segs, cur, time, tf);
        for (let j = Math.floor(tf * segs); j > 0; j--) {
          const y = heroCenterY((j - 1) / segs, cur, time, tf);
          if (yPrev < line && y >= line) {
            tA = (j - (line - yPrev) / (y - yPrev)) / segs;
            break;
          }
          yPrev = y;
        }
      }
      const dT = tA > 0 ? Math.min(tA, JOIN / (1.1 * hero.W)) : 0;

      strands.forEach((s, si) => {
        const path = (shapes[si] = new Path2D());
        let drawing = false;
        const put = (x: number, y: number, cx: number, cy: number) => {
          // x, y, cx, cy in canvas coordinates
          pt.x = x;
          pt.y = y;
          bend(pt, cx, cy);
          if (y < -40 || y > CH + 40) {
            drawing = false;
            return;
          }
          if (drawing) path.lineTo(pt.x, pt.y);
          else path.moveTo(pt.x, pt.y);
          drawing = true;
        };

        let from = first;
        if (heroOn) {
          // 1. The original hero strand, from the right edge back to where it starts to gather.
          const stop = tA > 0 ? tA : 0;
          for (let j = segs; j >= 0 && j / segs >= stop; j--) {
            const t = j / segs;
            put(ox + heroX(t), oy + heroY(s, t, cur, time, tf), ox + heroX(t), oy + heroCenterY(t, cur, time, tf));
          }
          if (tA > 0) {
            // 2. Blend the strand's own continuation into its place on the route. Both curves are smooth
            //    and heading the same way, so the blend has no corners or loops.
            for (let q = 0; q <= joinEnd; q++) {
              const u = q / joinEnd;
              const w = u * u * u * (u * (u * 6 - 15) + 10); // smootherstep: no kink at either end
              const t = tA - dT * u;
              const hxq = ox + heroX(t);
              const hyq = oy + heroY(s, t, cur, time, tf);
              along(s, q, step, pt);
              const rx = pt.x, ry = pt.y - ct;
              const ccy = oy + heroCenterY(t, cur, time, tf);
              put(hxq + (rx - hxq) * w, hyq + (ry - hyq) * w, hxq + (px[q] - hxq) * w, ccy + (py[q] - ct - ccy) * w);
            }
            from = joinEnd + 1;
          } else {
            drawing = false; // layouts where the band never reaches the gathering zone: the route starts on its own
            from = 0;
          }
        }

        // 3. The route down the page.
        for (let i = from; i < n; i++) {
          if (py[i] > bottom + 300) break;
          along(s, i, step, pt);
          put(pt.x, pt.y - ct, px[i], py[i] - ct);
        }
      });

      const h = motion.cur.hue;
      const bright = motion.cur.bright;
      const lightHue = 224 + 10 * b;
      for (const band of bands) {
        const y0 = band.top - ct;
        const y1 = band.bottom - ct;
        if (y1 <= 0 || y0 >= CH) continue;
        c.save();
        c.beginPath();
        c.rect(0, Math.max(0, y0), vw, Math.min(CH, y1) - Math.max(0, y0));
        c.clip();
        c.lineCap = 'round';
        if (band.tone === 'hero') heroStyle(c, h, bright, oy);
        else {
          const dark = band.tone === 'dark';
          const grad = (l: number) => {
            const g = c.createLinearGradient(0, 0, 0, CH);
            for (let q = 0; q <= 8; q++) {
              const f = q / 8;
              const a = fade(ct + f * CH);
              g.addColorStop(f, dark ? `hsla(${h}, 92%, ${l}%, ${a})` : `hsla(${lightHue}, 100%, ${l}%, ${a})`);
            }
            return g;
          };
          c.globalCompositeOperation = dark ? 'lighter' : 'source-over';
          if (dark) {
            // Wide, faint pass = the hero's restrained glow. On white it barely shows, so it is skipped there.
            c.lineWidth = 14;
            c.strokeStyle = grad(62);
            c.globalAlpha = 0.07 * bright;
            for (let i = 0; i < shapes.length; i += 3) c.stroke(shapes[i]);
          }
          c.lineWidth = dark ? 1.1 : 1;
          c.strokeStyle = dark ? grad(70) : grad(56);
          strands.forEach((s, i) => {
            c.globalAlpha = s.alpha * (dark ? 0.8 * bright : 0.5 - 0.1 * b);
            c.stroke(shapes[i]);
          });
        }
        c.restore();
      }

      // Fade the ribbon behind page text.
      c.globalCompositeOperation = 'destination-out';
      c.globalAlpha = 0.85;
      c.imageSmoothingEnabled = true;
      c.drawImage(mask, 0, ct / MASK_SCALE, vw / MASK_SCALE, CH / MASK_SCALE, 0, 0, vw, CH);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
    }

    // The original hero look: a soft glow where the band gathers, faint while scattered,
    // brightest at the focus point. Clipped to the hero by the caller.
    function heroStyle(c: CanvasRenderingContext2D, h: number, bright: number, oy: number) {
      const { W, S, fx, fy, left } = hero;
      const FX = left + fx;
      const FY = oy + fy;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 1;
      const glow = c.createRadialGradient(FX, FY, 0, FX, FY, S * 0.5);
      glow.addColorStop(0, `hsla(${h}, 100%, 62%, ${0.16 * bright})`);
      glow.addColorStop(1, `hsla(${h}, 100%, 50%, 0)`);
      c.fillStyle = glow;
      c.fillRect(left, oy, W, hero.H);

      const fN = Math.min(0.97, Math.max(0.03, fx / W));
      const line = c.createLinearGradient(left, 0, left + W, 0);
      line.addColorStop(0, `hsla(${h}, 90%, 60%, 0.05)`);
      line.addColorStop(Math.max(0.01, fN - 0.35), `hsla(${h}, 90%, 62%, 0.18)`);
      line.addColorStop(Math.max(0.02, fN - 0.1), `hsla(${h}, 90%, 66%, 0.32)`); // keep it soft behind the headline
      // Brightest at the gathering point, but kept below white so overlapping strands stay cyan and distinct.
      line.addColorStop(fN, `hsla(${h - 4}, 100%, 76%, 0.85)`);
      line.addColorStop(Math.min(0.99, fN + 0.2), `hsla(${h}, 95%, 68%, 0.55)`);
      line.addColorStop(1, `hsla(${h}, 90%, 62%, 0.3)`);
      c.strokeStyle = line;
      c.lineWidth = 14; // wide, faint pass = restrained glow
      c.globalAlpha = 0.07 * bright;
      for (let i = 0; i < shapes.length; i += 3) c.stroke(shapes[i]);
      c.lineWidth = 1.1;
      strands.forEach((s, i) => {
        c.globalAlpha = s.alpha * bright;
        c.stroke(shapes[i]);
      });
    }

    const unsubscribe = subscribe((dt) => {
      if (motion.still) ptr.pull = ptr.target = 0;
      else easePointer(ptr, dt);
      draw(dt);
    });
    function onScroll() {
      if (motion.still) draw(0); // otherwise the running clock redraws on the next frame (the canvas scrolls with the page meanwhile)
    }
    function onPointer(e: PointerEvent) {
      if (motion.still) return;
      ptr.tx = e.clientX;
      ptr.ty = e.clientY;
      if (ptr.pull < 0.01) {
        ptr.x = ptr.tx; // start bending where the pointer enters, not from the corner
        ptr.y = ptr.ty;
      }
      ptr.target = 1;
    }
    function release() {
      ptr.target = 0; // pointer left the window or the tab lost focus: settle back
    }
    const relayout = () => {
      layout();
      draw(0);
    };
    relayout();
    const ro = new ResizeObserver(relayout);
    ro.observe(document.body);
    window.addEventListener('resize', relayout);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.fonts?.ready.then(relayout);
    if (finePointer) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', release);
      window.addEventListener('blur', release);
    }
    return () => {
      unsubscribe();
      ro.disconnect();
      window.removeEventListener('resize', relayout);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', release);
      window.removeEventListener('blur', release);
    };
  }, []);

  return (
    <div className="page-ribbon" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
