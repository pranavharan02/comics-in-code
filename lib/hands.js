// hands.js — jointed cartoon hands, built the way Zen Pencils draws them: a flat palm shape and
// separate round-ended fingers, each bent at its knuckles. Fingers are "tubes" (a dark stroke with
// a skin stroke on top), so whichever finger is drawn later overlaps the earlier ones with a clean
// outline, exactly like inked overlaps.
// All poses are RIGHT hands in their own frame: wrist at the origin, hand pointing +x.
const I = require('./ink');
const { emit, ink, fill, cel, n1, INK } = I;

const SKIN = '#f3cda8', SKIN_SH = '#dea582';
const D = Math.PI / 180;

function tubePath(pts) { return 'M' + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L'); }
function tube(pts, w, o = {}) {
  const d = tubePath(pts), lw = o.line ?? 1.9;
  emit(`<path d="${d}" fill="none" stroke="${o.ink || INK}" stroke-width="${n1(w + lw * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  emit(`<path d="${d}" fill="none" stroke="${o.color || SKIN}" stroke-width="${n1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  if (o.shade) {
    // a thin shadow along the underside
    const sh = pts.map(([x, y]) => [x + o.shade[0], y + o.shade[1]]);
    emit(`<path d="${tubePath(sh)}" fill="none" stroke="${SKIN_SH}" stroke-width="${n1(w * 0.35)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`);
  }
}
// a finger from base point, with three segment angles (degrees) and lengths
function finger(base, angs, lens, w, o = {}) {
  const pts = [base];
  let [x, y] = base;
  angs.forEach((a, i) => { x += Math.cos(a * D) * lens[i]; y += Math.sin(a * D) * lens[i]; pts.push([x, y]); });
  tube(pts, w, o);
  // nail on the last segment when the back of the finger faces us
  if (o.nail) {
    const [px, py] = pts[pts.length - 2], a = angs[angs.length - 1] * D;
    const nx = px + Math.cos(a) * lens[lens.length - 1] * 0.55, ny = py + Math.sin(a) * lens[lens.length - 1] * 0.55;
    ink([[nx - Math.sin(a) * w * 0.28, ny + Math.cos(a) * w * 0.28], [nx + Math.cos(a) * w * 0.35, ny + Math.sin(a) * w * 0.35], [nx + Math.sin(a) * w * 0.28, ny - Math.cos(a) * w * 0.28]], 1.1, { op: 0.6, taper: [0.2, 0.2], wob: 0 });
  }
  // knuckle crease
  if (o.crease !== false && pts.length > 2) {
    const [kx, ky] = pts[1], a = ((angs[0] + angs[1]) / 2) * D;
    ink([[kx - Math.sin(a) * w * 0.3, ky + Math.cos(a) * w * 0.3], [kx - Math.sin(a) * w * 0.05, ky + Math.cos(a) * w * 0.05]], 1, { op: 0.55, taper: [0.2, 0.2], wob: 0 });
  }
  return pts;
}
function palm(pts, o = {}) { cel(pts, o.color || SKIN, SKIN_SH, { w: (o.line ?? 1.9) * 1.6, lx: o.lx ?? 0, ly: o.ly ?? -5, wob: 0.2 }); }

// a brush or pen, from the tip (x0,y0) to the end of the handle (x1,y1)
function brush(x0, y0, x1, y1, o = {}) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
  const at = (t) => [x0 + ux * L * t, y0 + uy * L * t];
  const w = o.w ?? 5;
  tube([at(0.2), at(1)], w, { color: o.handle || '#b07a48', line: 1.8 });
  tube([at(0.19), at(0.27)], w + 1.2, { color: '#3a3533', line: 1.6 });
  // bristles: a teardrop to a point
  const px = -uy, py = ux, [bx, by] = at(0.19);
  cel([[bx + px * w * 0.7, by + py * w * 0.7], [x0 + ux * L * 0.08 + px * w * 0.55, y0 + uy * L * 0.08 + py * w * 0.55], [x0, y0], [x0 + ux * L * 0.08 - px * w * 0.55, y0 + uy * L * 0.08 - py * w * 0.55], [bx - px * w * 0.7, by - py * w * 0.7]], o.tip || '#1e1b1d', '#000', { w: 1.8, lx: 0, ly: 0, wob: 0.1 });
}

// ------------------------------------------------------------------ poses
// Pinch grip, seen from the thumb side. The brush tip lands at (tip) in hand space ≈ [44, 40].
// Drawing order: tucked fingers, palm, brush, then index + thumb over the top.
function gripHand(o = {}) {
  const s = o.scale || 1, w = 8.4, L = o.line ?? 1.9;
  I.grp(`scale(${s})`, () => {
    // ring + little finger, curled under the palm
    finger([24, 12], [70, 150, 200], [8, 7, 5], w * 0.9);
    finger([28, 8], [60, 130, 190], [10, 8, 6], w * 0.95);
    // middle finger: under the brush, supporting it
    finger([31, 3], [55, 100, 150], [12, 9, 7], w);
    palm([[-2, -9], [14, -13], [30, -8], [34, 2], [30, 12], [16, 16], [-2, 10]]);
    ink([[12, -6], [20, 2]], 1, { op: 0.45 });
    // the brush, slanting back up toward the wrist
    brush(44, 40, 2, -46, { w: o.bw || 5.2, tip: o.tipColor });
    // index finger lying along the top of the brush
    finger([30, -6], [38, 62, 76], [13, 10, 8], w, { nail: true });
    // thumb pinching from the near side
    finger([6, -6], [10, 40, 58], [12, 10, 8], w * 1.05, { nail: true });
    if (o.old) { ink([[4, 0], [14, 2]], 1, { op: 0.5 }); ink([[6, 5], [15, 7]], 1, { op: 0.5 }); }
  });
}

// Open hand held up, palm to the viewer, fingers slightly spread. Wrist at the origin, pointing up.
function openHand(o = {}) {
  const s = o.scale || 1, w = 8.2, L = o.line ?? 1.9;
  I.grp(`scale(${s}) rotate(${o.rot || 0})`, () => {
    palm([[-13, 0], [-15, -18], [-12, -32], [0, -36], [13, -33], [17, -20], [14, -2], [0, 4]], { ly: -3, lx: 3 });
    finger([-10, -32], [-104, -100, -97], [10, 8, 6.5], w * 0.95, { crease: false });
    finger([-3, -35], [-94, -92, -90], [12, 9, 7], w, { crease: false });
    finger([5, -34], [-84, -86, -88], [11, 9, 7], w, { crease: false });
    finger([12, -30], [-72, -76, -80], [9, 7, 6], w * 0.88, { crease: false });
    finger([-12, -10], [-160, -130, -110], [9, 9, 7], w * 1.05, { crease: false });
    // palm creases
    ink([[-12, -22], [-2, -26], [10, -24]], 1.2, { op: 0.6, wob: 0.2 });
    ink([[-10, -14], [0, -12], [6, -18]], 1.2, { op: 0.5, wob: 0.2 });
  });
}

// Hand resting flat on a surface, seen from above-front, fingers pointing +x.
function restHand(o = {}) {
  const s = o.scale || 1, w = 8, L = o.line ?? 1.9;
  I.grp(`scale(${s})`, () => {
    finger([26, 6], [10, 20, 30], [9, 7, 6], w * 0.85, { nail: true });
    finger([30, 2], [4, 14, 24], [11, 9, 7], w * 0.95, { nail: true });
    finger([30, -3], [0, 10, 20], [12, 9, 7], w, { nail: true });
    palm([[-2, -9], [16, -12], [32, -8], [32, 8], [18, 12], [-2, 9]]);
    finger([30, -8], [-6, 6, 14], [11, 9, 7], w, { nail: true });
    finger([10, -9], [-20, 0, 12], [10, 9, 7], w * 1.05, { nail: true });
  });
}

// Fist holding a brush up in triumph (brush pointing up and back). Wrist at the origin, hand up.
function raisedHand(o = {}) {
  const s = o.scale || 1, w = 8.4, L = o.line ?? 1.9;
  I.grp(`scale(${s}) rotate(${o.rot || 0})`, () => {
    brush(-30, -60, 22, 12, { w: 5.4 });
    palm([[-9, 2], [-12, -16], [-6, -30], [8, -32], [16, -20], [12, 2]], { lx: 3, ly: -3 });
    // curled fingers wrapped round the handle
    [[-6, -30], [0, -32], [6, -31], [11, -28]].forEach(([x, y], i) => finger([x, y], [-60, 20, 110], [6, 7, 5], w * (i === 3 ? 0.85 : 0.95), { crease: false }));
    finger([-10, -12], [-120, -80, -40], [9, 8, 6], w * 1.05, { nail: true, crease: false });
  });
}

module.exports = { SKIN, SKIN_SH, tube, finger, palm, brush, gripHand, openHand, restHand, raisedHand };
