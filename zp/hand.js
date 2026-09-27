// zp/hand.js — hands at ANY size with the same pen: geometry scales, line width doesn't.
// ZP hands (measured on crops): a rounded palm, separate long fingers with round tips, the thumb
// clearly separate, 1–2 crease lines at most, no shading. Wrist at (x,y); `ang` is the direction the
// hand points (degrees, 0 = +x); `s` ≈ palm length in px / 12; `flip` mirrors (left vs right hand,
// or palm vs back).
const { I, INK, LW, line, shape } = require('./core');
const D = Math.PI / 180;

// a finger as a capsule outline so the ink stays constant
function fingerPts(base, segs, w) {
  const pts = [base];
  let [x, y] = base;
  segs.forEach(([a, l]) => { x += Math.cos(a * D) * l; y += Math.sin(a * D) * l; pts.push([x, y]); });
  return pts;
}
function tube(pts, w, color, lw = LW.detail) {
  const d = 'M' + pts.map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L');
  I.emit(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${I.n1(w + lw * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  I.emit(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${I.n1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// pose tables: each finger [baseX, baseY, [[angle, len], ...]] in a unit hand pointing +x,
// palm from x=0 (wrist) to x=10, y from -5 (index side) to +5 (little-finger side).
// thumb separate.
const POSES = {
  relaxed: { fingers: [[10, -3.6, [[8, 4.5], [30, 3.6], [55, 2.8]]], [10.6, -1.2, [[10, 5], [34, 3.8], [60, 3]]], [10.4, 1.2, [[14, 4.6], [40, 3.6], [66, 2.8]]], [9.6, 3.4, [[20, 3.8], [46, 3], [70, 2.4]]]], thumb: [3, -4.6, [[-40, 4.5], [-20, 4]]] },
  open: { fingers: [[10, -4, [[-18, 5], [-14, 4], [-10, 3]]], [10.6, -1.4, [[-5, 5.6], [-3, 4.2], [0, 3.2]]], [10.4, 1.3, [[8, 5.2], [8, 4], [8, 3]]], [9.6, 3.6, [[22, 4.2], [22, 3.2], [22, 2.6]]]], thumb: [3, -4.8, [[-70, 5], [-55, 4.4]]] },
  point: { fingers: [[10, -3.6, [[0, 5.2], [0, 4.2], [0, 3.4]]], [10.4, -1.1, [[40, 3.2], [120, 3], [170, 2.2]]], [10.2, 1.3, [[48, 3], [128, 2.8], [175, 2]]], [9.4, 3.4, [[56, 2.6], [135, 2.4], [178, 1.8]]]], thumb: [4, -4.6, [[-10, 4.4], [20, 3.4]]] },
  fist: { fingers: [[10, -3.6, [[40, 3.4], [120, 3], [170, 2.2]]], [10.4, -1.1, [[44, 3.4], [124, 3], [172, 2.2]]], [10.2, 1.3, [[50, 3.2], [128, 2.8], [175, 2]]], [9.4, 3.4, [[58, 2.8], [135, 2.4], [178, 1.8]]]], thumb: [5, -4.6, [[20, 4], [60, 3.4]]] },
  grip: { fingers: [[10, -3.6, [[55, 3.6], [120, 3.2], [165, 2.4]]], [10.4, -1.1, [[60, 3.6], [125, 3.2], [168, 2.4]]], [10.2, 1.3, [[64, 3.4], [130, 3], [172, 2.2]]], [9.4, 3.4, [[70, 3], [135, 2.6], [175, 2]]]], thumb: [5, -4.6, [[30, 4.4], [70, 3.4]]] },
  pinch: { fingers: [[10, -3.6, [[20, 5], [44, 4], [60, 3]]], [10.4, -1.1, [[50, 3.6], [115, 3.2], [160, 2.4]]], [10.2, 1.3, [[58, 3.4], [122, 3], [165, 2.2]]], [9.4, 3.4, [[66, 3], [130, 2.6], [170, 2]]]], thumb: [4, -4.6, [[-5, 5], [25, 4.2]]] },
  flat: { fingers: [[10, -3.4, [[0, 5], [0, 4], [0, 3]]], [10.6, -1.1, [[0, 5.6], [0, 4.3], [0, 3.2]]], [10.4, 1.2, [[2, 5.2], [2, 4], [2, 3]]], [9.6, 3.4, [[6, 4.2], [6, 3.2], [6, 2.6]]]], thumb: [3, -4.6, [[-35, 4.6], [-15, 4]]] },
};

function hand(x, y, ang, s, pose = 'relaxed', o = {}) {
  const P = POSES[pose] || POSES.relaxed;
  const skin = o.skin || '#f6d2b4';
  const flip = o.flip ? -1 : 1;
  const ca = Math.cos(ang * D), sa = Math.sin(ang * D);
  const T = ([u, v]) => [x + (u * ca - v * flip * sa) * s, y + (u * sa + v * flip * ca) * s];
  const fw = 2.85 * s * (o.thick || 1);
  const lw = o.lw ?? LW.detail;
  const n1 = I.n1;
  const pathOf = (pts) => 'M' + pts.map(([px, py]) => `${n1(px)} ${n1(py)}`).join('L');
  // parts in hand space
  const fingers = P.fingers.map(([bx, by, segs]) => fingerPts([bx - 1.4, by * 0.92], segs.map(([a, l]) => [a, l * 1.18]), 2.5).map(T));
  const thumb = fingerPts([P.thumb[0] + 1, P.thumb[1] * 0.9], P.thumb[2].map(([a, l]) => [a, l * 1.1]), 2.5).map(T);
  const palm = [[0.5, -3.6], [5, -4.9], [9.2, -4.6], [10.2, -2], [10.2, 2], [9.4, 4.3], [5, 4.9], [0.5, 3.6]].map(T);
  const wrist = [T([-2.2, 0]), T([1, 0])];
  // 1) one black silhouette: every part stroked wide
  const outline = (d, w) => I.emit(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n1(w + lw * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  const fillp = (d, w, c) => I.emit(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${n1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  const palmD = pathOf(palm) + 'Z';
  I.emit(`<path d="${palmD}" fill="${INK}" stroke="${INK}" stroke-width="${n1(lw * 2)}" stroke-linejoin="round"/>`);
  if (o.wrist !== false) outline(pathOf(wrist), fw * 2.2);
  fingers.forEach((f) => outline(pathOf(f), fw));
  outline(pathOf(thumb), fw * 1.12);
  // 2) skin over it, so parts merge without internal outlines
  I.emit(`<path d="${palmD}" fill="${skin}"/>`);
  if (o.wrist !== false) fillp(pathOf(wrist), fw * 2.2, skin);
  fingers.forEach((f) => fillp(pathOf(f), fw, skin));
  // 3) the thumb on top gets its own outline where it crosses the palm (as inked)
  if (pose === 'fist' || pose === 'grip' || pose === 'pinch' || o.thumbFront) { outline(pathOf(thumb), fw * 1.12); }
  fillp(pathOf(thumb), fw * 1.12, skin);
  // 4) a few interior marks: finger separations at the knuckles, a palm crease
  P.fingers.slice(0, 3).forEach(([bx, by]) => {
    const a0 = T([bx - 1.8, by + 1.25]), a1 = T([bx + 0.4, by + 1.25]);
    line([a0, a1], LW.fine, { taper: [0.3, 0.3] });
  });
  if (pose === 'open' || pose === 'flat' || pose === 'relaxed') line([T([2, -2.8]), T([5, -0.6]), T([7.5, 2.8])], LW.fine, { taper: [0.3, 0.4], op: 0.8 });
  if (pose === 'fist' || pose === 'grip') line([T([7, -3.5]), T([8.5, 0]), T([7.5, 3.5])], LW.fine);
  if (o.object) o.object(T, s);
}

module.exports = { hand, tube, POSES };
