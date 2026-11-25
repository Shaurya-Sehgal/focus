// Self-check for the page ribbon path. Run with: npm run check
import assert from 'node:assert/strict';
import { flowPath, type Guide } from './path.ts';

const guides: Guide[] = [
  { x: 300, y: 0, w: 70 },
  { x: 150, y: 200, w: 60 },
  { x: 60, y: 900, w: 20 },
  { x: 700, y: 1300, w: 120 },
  { x: 1400, y: 2000, w: 40 },
  { x: 500, y: 2600, w: 80 },
];
const p = flowPath(guides, 8);
const n = p.x.length;

assert.ok(n > 100, 'has samples');
assert.ok([...p.x, ...p.y, ...p.nx, ...p.ny, ...p.w].every(Number.isFinite), 'no NaN');
assert.ok(Math.hypot(p.x[0] - 300, p.y[0]) < 1e-3, 'starts on the first guide');
assert.ok(Math.hypot(p.x[n - 1] - 500, p.y[n - 1] - 2600) < 8, 'ends on the last guide');
// Never leaves the area the guides span (no overshoot).
assert.ok(p.x.every((x) => x >= 60 - 1e-3 && x <= 1400 + 1e-3), 'stays within the guides');
for (let i = 1; i < n - 1; i++) {
  assert.ok(Math.hypot(p.x[i] - p.x[i - 1], p.y[i] - p.y[i - 1]) < 8.5, 'even spacing');
  assert.ok(Math.abs(Math.hypot(p.nx[i], p.ny[i]) - 1) < 1e-3, 'unit normals');
}
// Broad curves: direction never turns more than a few degrees between neighbouring samples.
let worst = 0;
for (let i = 2; i < n - 1; i++) {
  const a = Math.atan2(p.y[i - 1] - p.y[i - 2], p.x[i - 1] - p.x[i - 2]);
  const b = Math.atan2(p.y[i] - p.y[i - 1], p.x[i] - p.x[i - 1]);
  worst = Math.max(worst, Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a))));
}
assert.ok(worst < 0.08, `gentle turns (worst ${worst.toFixed(3)} rad per 8 px)`);
console.log(`flowPath ok: ${n} samples, sharpest turn ${((worst * 180) / Math.PI).toFixed(2)}° per 8 px`);
