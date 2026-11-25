// A broad, smooth path for the page ribbon.
// Guide points pull the curve towards them without it having to pass through them (a cubic B-spline),
// so there are no tight corners and no overshoot. Each guide also carries a band width, so the
// strands gather and open out along the way.

export type Guide = { x: number; y: number; w: number };
export type FlowPath = {
  x: Float32Array;
  y: Float32Array;
  nx: Float32Array; // unit normal
  ny: Float32Array;
  w: Float32Array; // band width
  step: number; // arc length between samples
  length: number;
};

export function flowPath(guides: Guide[], step = 8): FlowPath {
  // Repeat the end guides so the curve starts and ends exactly on them.
  const g = [guides[0], guides[0], ...guides, guides[guides.length - 1], guides[guides.length - 1]];
  const dense: Guide[] = [];
  for (let i = 0; i + 3 < g.length; i++) {
    const [a, b, c, d] = [g[i], g[i + 1], g[i + 2], g[i + 3]];
    for (let k = 0; k < 48; k++) {
      const t = k / 48;
      const t2 = t * t;
      const t3 = t2 * t;
      const w0 = (1 - t) ** 3 / 6;
      const w1 = (3 * t3 - 6 * t2 + 4) / 6;
      const w2 = (-3 * t3 + 3 * t2 + 3 * t + 1) / 6;
      const w3 = t3 / 6;
      dense.push({
        x: a.x * w0 + b.x * w1 + c.x * w2 + d.x * w3,
        y: a.y * w0 + b.y * w1 + c.y * w2 + d.y * w3,
        w: a.w * w0 + b.w * w1 + c.w * w2 + d.w * w3,
      });
    }
  }
  dense.push(guides[guides.length - 1]);

  // Resample at even arc length so motion along the path has a steady speed.
  const out: Guide[] = [dense[0]];
  let carry = 0;
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1];
    const b = dense[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    let pos = step - carry;
    while (pos <= seg) {
      const f = pos / seg;
      out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, w: a.w + (b.w - a.w) * f });
      pos += step;
    }
    carry = seg - (pos - step);
  }

  const n = out.length;
  const path: FlowPath = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    nx: new Float32Array(n),
    ny: new Float32Array(n),
    w: new Float32Array(n),
    step,
    length: (n - 1) * step,
  };
  for (let i = 0; i < n; i++) {
    path.x[i] = out[i].x;
    path.y[i] = out[i].y;
    path.w[i] = out[i].w;
    const a = out[Math.max(0, i - 1)];
    const b = out[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    path.nx[i] = -(b.y - a.y) / len;
    path.ny[i] = (b.x - a.x) / len;
  }
  return path;
}
