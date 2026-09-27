// face.js — a 3/4-view head built the way Zen Pencils builds them:
// big round skull, the face a smaller bean at the front, nose poking past the far contour,
// two tall oval eyes almost touching with small dot pupils, the ear far back at the end of a
// long jaw diagonal, a short off-centre mouth, hatch-line blush, hair as a dark mass with
// zig-zag highlight streaks. Faces +x. Origin ≈ centre of the head; ~100 tall.
const I = require('./ink');
const { emit, ink, fill, cel, ell, arc, grp, INK } = I;
const { mix, lerp, clamp, hairColor } = require('./hoku');

const SKIN = '#f3cda8', SKIN_SH = '#dea582';

function hairLight(hair, age) {
  return age >= 55 ? '#ffffff' : mix(hair, '#6f8fb3', 0.75);
}

function head(o = {}) {
  const age = o.age ?? 30, child = age < 14, old = clamp((age - 55) / 50), mood = o.mood || 'neutral';
  const hair = hairColor(age), hairSh = mix(hair, '#000000', 0.3), hi = hairLight(hair, age);
  const lw = o.lw ?? 3; // outer contour weight; interior lines are thinner
  const look = o.look || [1, 0];
  const C = child;

  // --- bun + brush pin (behind everything)
  if (o.bun !== false) {
    const bx = -22, by = -60;
    ink([[bx - 26, by + 14], [bx + 24, by - 20]], 6.6, { taper: [0, 0], minW: 1, wob: 0 });
    ink([[bx - 26, by + 14], [bx + 24, by - 20]], 3.6, { color: C ? '#d9533a' : '#b07a48', taper: [0, 0], minW: 1, wob: 0 });
    cel(ell(bx, by, C ? 15 : 17, C ? 13 : 14, 12), hair, hairSh, { w: lw * 0.9, lx: 4, ly: -3 });
    ink(arc(bx + 2, by + 1, 9, 6, -2.6, -0.5, 5), 1.3, { color: hi, op: 0.9 });
  }
  // --- neck (behind the face), with the shadow under the jaw
  const nk = o.neck ?? 72;
  cel([[-15, 20], [10, 34], [13, nk], [-13, nk]], SKIN, SKIN_SH, { w: lw * 0.85, lx: 0, ly: 12, wob: 0.2 });

  // --- face silhouette (3/4 facing right)
  const face = C
    ? [[-28, -8], [-10, -38], [14, -40], [30, -32], [35, -18], [33, -9], [35, -3], [41, 5], [36, 9], [35, 13], [36, 17], [33, 20], [34, 23], [31, 31], [22, 38], [8, 40], [-6, 34], [-18, 24], [-23, 14], [-26, 4]]
    : [[-28, -8], [-10, -40], [14, -40], [30, -32], [35, -18], [33, -10], [35, -4], [44, 6], [37, 10], [36, 13], [37, 16], [34, 19], [36, 22], [34 - old * 2, 31], [26, 40 + old * 2], [12, 43 + old * 2], [-4, 38], [-17, 29], [-24, 18], [-28, 6]];
  cel(face, SKIN, SKIN_SH, { w: lw, lx: 6, ly: -3, wob: 0.35 });

  // --- eyes: two tall ovals, nearly touching; the far one a little narrower
  const eyes = [[9, -4, C ? 9 : 8.2, C ? 12.5 : 11], [25, -4, C ? 7.2 : 6.6, C ? 12 : 10.5]];
  if (mood === 'joy' || mood === 'shut') {
    eyes.forEach(([x, y, rx]) => ink(arc(x, y + (mood === 'joy' ? 4 : 0), rx, mood === 'joy' ? 7 : 4, mood === 'joy' ? Math.PI * 1.1 : 0.25, mood === 'joy' ? Math.PI * 1.9 : Math.PI - 0.25, 6), 2.6, { taper: [0.25, 0.25] }));
  } else {
    eyes.forEach(([x, y, rx, ry], i) => {
      cel(ell(x, y, rx, ry, 16), '#ffffff', '#e8e4ee', { w: 2.2, lx: 0, ly: 2, wob: 0.15 });
      const px = x + look[0] * rx * 0.42, py = y + look[1] * ry * 0.45;
      fill(ell(px, py, C ? 3 : 2.7, C ? 3.4 : 3, 8), INK, { wob: 0.05 });
      if (C) fill(ell(px + 1, py - 1.2, 0.9, 0.9, 5), '#ffffff', { wob: 0 });
      // lids: sleepy with age, low for concentration or sadness
      const lid = mood === 'focus' ? 0.48 : mood === 'sad' ? 0.3 : lerp(0, 0.42, old);
      if (lid > 0.04) {
        const ly = y - ry + ry * 2 * lid;
        I.clipPoly(ell(x, y, rx, ry, 16), () => fill([[x - rx - 2, y - ry - 2], [x + rx + 2, y - ry - 2], [x + rx + 2, ly + (mood === 'sad' ? (i ? 3 : -3) : 0)], [x - rx - 2, ly - (mood === 'sad' ? (i ? 3 : -3) : 0)]], SKIN, { lin: true, wob: 0 }));
        ink([[x - rx + 0.5, ly - (mood === 'sad' ? (i ? 3 : -3) : 0)], [x + rx - 0.5, ly + (mood === 'sad' ? (i ? 3 : -3) : 0)]], 2.2, { taper: [0.15, 0.15], wob: 0.1 });
      }
    });
    // lash flick at the outer corner of the near eye (grown women)
    if (!C) ink([[1.5, -12], [-3, -15]], 1.8, { taper: [0.1, 0.8], wob: 0 });
  }
  // --- brows
  const browCol = old > 0.5 ? '#e8e4dc' : hair;
  const bw = old > 0.5 ? 4.2 : C ? 3 : 2.6;
  const by = C ? -21 : -19;
  if (mood === 'sad') { ink([[1, by], [15, by - 5]], bw, { color: browCol, taper: [0.3, 0.2] }); ink([[20, by - 5], [31, by - 1]], bw, { color: browCol, taper: [0.2, 0.3] }); }
  else if (mood === 'focus') { ink([[1, by - 2], [15, by + 2]], bw + 0.6, { color: browCol, taper: [0.3, 0.2] }); ink([[20, by + 2], [31, by - 2]], bw + 0.6, { color: browCol, taper: [0.2, 0.3] }); }
  else { ink([[0, by + 1], [8, by - 3], [15, by - 2]], bw, { color: browCol, taper: [0.3, 0.3] }); ink([[20, by - 2], [26, by - 3], [31, by]], bw * 0.9, { color: browCol, taper: [0.3, 0.3] }); }
  if (old > 0.5) { ink([[1, by + 1], [15, by - 2]], 1, { op: 0.7 }); }
  // --- nose: the tip is in the silhouette; add the nostril and a bridge hint
  ink(C ? [[36, 7], [33, 9]] : [[38, 8], [34, 9.5]], 1.5, { taper: [0.2, 0.4], wob: 0 });
  // --- mouth
  if (mood === 'joy') {
    cel([[18, 16], [36, 14], [35, 24], [28, 31], [21, 26]], '#6a2530', '#4a1520', { w: 2.2, lx: 0, ly: 0, wob: 0.2 });
    I.clipPoly([[18, 16], [36, 14], [35, 24], [28, 31], [21, 26]], () => { fill(ell(28, 29, 7, 4, 8), '#e27b80', { wob: 0 }); fill([[18, 16], [36, 14], [35, 17.5], [19, 19]], '#ffffff', { lin: true, wob: 0 }); });
  } else if (mood === 'o') {
    cel(ell(29, 21, 3.4, 4.2, 8), '#6a2530', '#4a1520', { w: 2, lx: 0, ly: 0 });
  } else if (mood === 'focus' && C) {
    ink([[22, 20], [33, 19]], 2, { taper: [0.3, 0.2] });
    cel([[30, 19], [36, 21], [35, 25], [30, 23]], '#e27b80', '#c95f66', { w: 1.6, lx: 0, ly: 0, wob: 0.1 });
  } else if (mood === 'sad') {
    ink([[21, 22], [27, 20], [33, 21.5]], 2, { taper: [0.3, 0.3] });
  } else {
    ink([[21, 20], [28, 20.5], [33, 19]], 2, { taper: [0.3, 0.3] });
    ink([[20, 18.5], [21.5, 21]], 1.2, { taper: [0.1, 0.1], wob: 0 });
  }
  // --- blush as hatching (Zen Pencils does this instead of pink circles)
  if (o.blush !== false && mood !== 'sad') [0, 1, 2].forEach((k) => ink([[4 + k * 4.5, 15], [7 + k * 4.5, 10]], 1.3, { color: '#d9826c', taper: [0.2, 0.2], wob: 0 }));
  // --- age lines
  if (old > 0.05) {
    ink([[-2, -3], [-6, -5]], 1.1, { op: 0.8 }); ink([[-2, 1], [-6, 2]], 1.1, { op: 0.8 });
    ink(arc(9, 6, 7, 3, 0.4, 2.7, 5), 1, { op: 0.7 });
    ink([[35, 11], [30, 16], [30, 24]], 1.2, { op: lerp(0.4, 0.9, old) });
    ink([[4, -28], [22, -29]], 1, { op: 0.45 * old + 0.2 });
    if (old > 0.4) { ink([[12, 43], [4, 38]], 1.1, { op: 0.6 }); ink([[6, -33], [20, -34]], 1, { op: 0.35 }); }
  }
  // --- hair: dark mass with zig-zag highlights
  const hairPts = [[31, -30], [26, -44], [10, -57], [-14, -59], [-34, -49], [-45, -28], [-47, -4], [-42, 14], [-33, 26], [-27, 16], [-30, 2], [-27, -9], [-17, -12], [-12, -24], [-2, -33], [16, -37]];
  cel(hairPts, hair, hairSh, { w: lw, lx: 5, ly: -5, wob: 0.3 });
  I.clipPoly(hairPts, () => {
    const band = [[-36, -38], [-28, -48], [-22, -40], [-12, -52], [-6, -43], [4, -53], [9, -45], [18, -48], [22, -41], [14, -40], [8, -38], [2, -45], [-6, -36], [-12, -44], [-20, -32], [-28, -40], [-34, -30]];
    fill(band, hi, { lin: true, wob: 0.3, op: age >= 55 ? 0.8 : 1 });
    fill([[-44, -12], [-38, -20], [-36, -12], [-31, -18], [-30, -10], [-36, -6], [-38, -12], [-44, -4]], hi, { lin: true, wob: 0.3, op: age >= 55 ? 0.8 : 1 });
  });
  ink([[-14, -26], [-24, -16]], 1.2, { color: hairSh });
  // child: a short fringe
  if (C) {
    const fr = [[33, -26], [28, -42], [12, -50], [-2, -46], [2, -34], [12, -30], [16, -36], [22, -28]];
    cel(fr, hair, hairSh, { w: lw * 0.9, lx: 3, ly: -3 });
    I.clipPoly(fr, () => fill([[4, -44], [12, -48], [16, -43], [24, -45], [26, -40], [16, -38], [12, -42], [6, -39]], hi, { lin: true, wob: 0.2 }));
  }
  // --- ear, far back, at the end of the jaw
  cel(ell(-22, 2, 7.5, 11, 12), SKIN, SKIN_SH, { w: lw * 0.8, lx: 2, ly: -2, wob: 0.2 });
  ink([[-19, -3], [-24, -2], [-25, 5], [-21, 8]], 1.4, { taper: [0.2, 0.3], wob: 0.1 });

  // --- glasses
  if (o.glasses) {
    const gc = '#6b4a2e';
    ink(ell(9, -3, 12.5, 12, 16), 2, { closed: true, color: gc, wob: 0.1 });
    ink(ell(26, -3, 9, 11.5, 16), 2, { closed: true, color: gc, wob: 0.1 });
    ink([[21.2, -5], [17.2, -5]], 2, { color: gc, taper: [0, 0], wob: 0 });
    ink([[-3.4, -5], [-18, -2]], 2, { color: gc, taper: [0, 0], wob: 0 });
    ink(arc(9, -3, 9, 8.5, -2.6, -1.8, 4), 2.2, { color: '#ffffff', op: 0.8 });
  }
}

module.exports = { SKIN, SKIN_SH, head };
