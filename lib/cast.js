// cast.js — the two characters: Mira (the painter) and The Voice (her doubt).
const { R, ink, fill, shape, ell, arc, grp, drop, INK } = require('./ink');

const C = {
  skin: '#f4c9a6', skinSh: '#dc9f7e', blush: '#ef8f82',
  hair: '#c8452b', hairSh: '#8f2c1c', hairHi: '#e46a4c',
  smock: '#5f7fa6', smockSh: '#46638a', smockLt: '#7b9bbf',
  wood: '#a86a3c', woodSh: '#7d4a27',
  voice: '#8a85a3', voiceSh: '#66617f', voiceLt: '#a9a4c2',
  mouth: '#5b1f2a', tongue: '#e0707a',
  yellow: '#f5c83b', blue: '#2f5fa8', white: '#fffefb',
};

// a rod with an ink outline (brush handles, easel legs, stool legs)
function rod(pts, w, color, o = {}) {
  ink(pts, w + 3.4, { taper: [0, 0], minW: 1, vary: 0.05, wob: 0, ...o });
  ink(pts, w, { color, taper: [0, 0], minW: 1, vary: 0.05, wob: 0, ...o });
}

// a paintbrush from (x0,y0) handle end to (x1,y1) bristle tip
function brush(x0, y0, x1, y1, w = 5, paint = C.yellow) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const at = (t) => [x0 + dx * t, y0 + dy * t];
  rod([at(0), at(0.68)], w, C.wood);
  const fw = w * 0.85;
  const f0 = at(0.66), f1 = at(0.8);
  shape([[f0[0] - uy * fw, f0[1] + ux * fw], [f1[0] - uy * fw, f1[1] + ux * fw], [f1[0] + uy * fw, f1[1] - ux * fw], [f0[0] + uy * fw, f0[1] - ux * fw]], '#b9bcc4', { w: 2, lin: true, wob: 0.2 });
  const b0 = at(0.8);
  shape([[b0[0] - uy * fw, b0[1] + ux * fw], [x1 - uy * w * 0.2, y1 + ux * w * 0.2], [x1 + ux * 3, y1 + uy * 3], [b0[0] + uy * fw, b0[1] - ux * fw]], paint, { w: 2, wob: 0.3 });
}

// ---------------------------------------------------------------- Mira's head
// origin = centre of face. o.fx: -1..1 turns the face; o.look: pupil direction.
function miraHead(o = {}) {
  const fx = (o.fx || 0) * 11;
  const mood = o.mood || 'neutral';
  const look = o.look || [0, 0];

  // brush through the bun (behind), then the bun
  const bx = -fx * 0.6 + 6, by = -66;
  if (o.bun !== false) {
    brush(bx - 44, by + 18, bx + 44, by - 30, 4.2);
    shape(ell(bx, by, 25, 20, 14), C.hair, { w: 3 });
    ink(arc(bx - 2, by + 2, 15, 11, -2.6, -0.4, 6), 1.5, { color: C.hairSh });
    ink(arc(bx + 3, by - 2, 9, 7, 0.4, 2.6, 5), 1.4, { color: C.hairSh });
  }
  // hair behind the face
  shape([[-60, 26], [-67, -14], [-54, -52], [-16, -70], [22, -70], [56, -52], [68, -14], [62, 24], [48, 36], [44, 8], [-44, 8], [-50, 36]], C.hair, { w: 3.2 });
  // ear
  const ex = fx >= 0 ? -51 + fx * 0.25 : 51 + fx * 0.25;
  shape(ell(ex, 12, 9, 12, 10), C.skin, { w: 2.6 });
  ink(arc(ex, 12, 4, 6, fx >= 0 ? -1.8 : -1.3, fx >= 0 ? 1.8 : -4.4, 5).map((p) => [p[0] + (fx >= 0 ? 0 : 0), p[1]]), 1.4);
  // neck shading lives in the body; face
  const face = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    let x = Math.cos(a) * 52, y = Math.sin(a) * 55;
    if (Math.sin(a) > 0) { y *= 1.08; x *= 1 - 0.16 * Math.sin(a); }
    face.push([x + fx * 0.25, y]);
  }
  shape(face, C.skin, { w: 3.3 });
  if (o.blush !== false) {
    fill(ell(-25 + fx, 23, 10, 5.5, 10), C.blush, { op: 0.55 });
    fill(ell(25 + fx, 23, 10, 5.5, 10), C.blush, { op: 0.55 });
  }
  if (o.smudge) fill([[16 + fx, 26], [34 + fx, 20], [40 + fx, 27], [22 + fx, 33]], o.smudge, { op: 0.95 });

  eyes(fx, look, mood);

  // nose
  ink([[fx * 0.9 + 1, 11], [fx * 0.9 + 5, 18], [fx * 0.9 - 1, 21]], 2.2, { taper: [0.5, 0.3] });
  mouth(fx, mood);

  // fringe
  shape([[-56, 4], [-60, -26], [-44, -54], [-10, -64], [26, -61], [52, -46], [60, -20], [56, 2], [48, -16], [40, -26], [30, -21], [21, -32], [9, -26], [-4, -36], [-16, -27], [-28, -33], [-38, -22], [-48, -10]].map((p) => [p[0] + fx * 0.3, p[1]]), C.hair, { w: 3.1 });
  ink([[-30 + fx * 0.3, -54], [-20 + fx * 0.3, -42], [-18 + fx * 0.3, -32]], 1.4, { color: C.hairSh });
  ink([[12 + fx * 0.3, -60], [16 + fx * 0.3, -44], [10 + fx * 0.3, -30]], 1.4, { color: C.hairSh });
  ink([[40 + fx * 0.3, -46], [46 + fx * 0.3, -32]], 1.3, { color: C.hairSh });
  fill([[-34 + fx * 0.3, -56], [-14 + fx * 0.3, -62], [-20 + fx * 0.3, -57], [-32 + fx * 0.3, -52]], C.hairHi, { op: 0.9 });

  if (o.sweat) { drop(-62, -34, 0.9, -20); drop(60, -44, 1.1, 18); drop(66, 0, 0.7, 25); }
}

function eyes(fx, look, mood) {
  const ey = 2;
  [-19 + fx, 19 + fx].forEach((x, side) => {
    const s = side ? 1 : -1; // -1 left eye, +1 right eye; inner corner is at -s
    if (mood === 'joy') {
      ink(arc(x, ey + 6, 11, 10, Math.PI * 1.05, Math.PI * 1.95, 6), 3.2, { taper: [0.25, 0.25] });
      ink([[x + s * 12, ey - 14], [x + s * 2, ey - 19], [x - s * 9, ey - 17]], 2.8);
      return;
    }
    if (mood === 'shut') {
      ink([[x - 11, ey + 3], [x, ey + 6], [x + 11, ey + 3]], 3, { taper: [0.3, 0.3] });
      ink([[x + s * 12, ey - 12], [x - s * 9, ey - 18]], 2.6);
      return;
    }
    const ry = mood === 'shock' ? 16.5 : 15;
    shape(ell(x, ey, 11.5, ry, 14), '#fff', { w: 2.4, wob: 0.4 });
    const pr = mood === 'shock' ? 3.2 : 5;
    const px = x + look[0] * 5, py = ey + look[1] * 6.5;
    fill(ell(px, py, pr, pr * 1.2, 10), INK, { wob: 0.2 });
    fill(ell(px + 1.6, py - 2.2, 1.4, 1.6, 6), '#fff', { wob: 0 });
    if (mood === 'determined') {
      // heavy lid: inner end lower
      fill([[x - 14, ey - 20], [x + 14, ey - 20], [x + 14, ey - (s < 0 ? 1 : 9)], [x - 14, ey - (s < 0 ? 9 : 1)]], C.skin, { wob: 0, lin: true });
      ink([[x - 12.5, ey - (s < 0 ? 9 : 2)], [x + 12.5, ey - (s < 0 ? 2 : 9)]], 3.2, { taper: [0.1, 0.1] });
      ink([[x + s * 15, ey - 22], [x + s * 3, ey - 20], [x - s * 10, ey - 12]], 4, { taper: [0.2, 0.15] });
    } else if (mood === 'worried' || mood === 'shock') {
      ink([[x + s * 14, ey - 18], [x + s * 3, ey - 22], [x - s * 8, ey - 28]], 3.4, { taper: [0.2, 0.2] });
      ink(arc(x, ey + 1, 10, 14, 0.6, 2.5, 5), 1.2, { op: 0.6 });
    } else if (mood === 'calm') {
      fill([[x - 14, ey - 20], [x + 14, ey - 20], [x + 14, ey - 4], [x - 14, ey - 4]], C.skin, { wob: 0, lin: true });
      ink(arc(x, ey + 2, 12.5, 7, Math.PI * 1.02, Math.PI * 1.98, 6), 3, { taper: [0.1, 0.1] });
      ink([[x + s * 13, ey - 20], [x + s * 2, ey - 25], [x - s * 9, ey - 22]], 2.8);
    } else {
      ink([[x + s * 13, ey - 21], [x + s * 2, ey - 25], [x - s * 9, ey - 22]], 3);
    }
  });
}

function mouth(fx, mood) {
  const m = fx * 0.8;
  if (mood === 'worried') {
    shape([[m - 11, 35], [m - 5, 31], [m + 1, 34], [m + 7, 31], [m + 12, 35], [m + 6, 38], [m - 5, 38]], C.mouth, { w: 2.2, wob: 0.3 });
    fill([[m - 8, 34], [m + 9, 33.5], [m + 8, 35.5], [m - 7, 35.8]], '#fff', { wob: 0 });
  } else if (mood === 'determined') {
    ink([[m - 12, 35], [m - 2, 33], [m + 10, 34.5]], 3, { taper: [0.25, 0.3] });
    ink([[m - 14, 32], [m - 12, 36]], 1.5);
  } else if (mood === 'joy') {
    shape([[m - 20, 27], [m - 6, 31], [m + 8, 31], [m + 21, 26], [m + 15, 41], [m + 2, 48], [m - 12, 43]], C.mouth, { w: 2.8 });
    fill(ell(m + 1, 42, 9, 5, 10), C.tongue, { wob: 0.3 });
    fill([[m - 17, 28.5], [m + 18, 27.5], [m + 16, 32], [m - 15, 32.5]], '#fff', { wob: 0 });
  } else if (mood === 'shock') {
    shape(ell(m, 36, 6, 8, 10), C.mouth, { w: 2.4 });
  } else if (mood === 'calm') {
    ink(arc(m + 1, 26, 14, 10, 0.35, 2.8, 6), 2.8, { taper: [0.3, 0.3] });
  } else {
    ink([[m - 8, 34], [m + 1, 36], [m + 9, 33]], 2.6);
  }
}

// ---------------------------------------------------------------- The Voice
// A smoky, lavender-grey blob. origin = middle of the face.
function voice(o = {}) {
  const mood = o.mood || 'menace';
  const body = [[-12, -74], [30, -70], [60, -42], [66, 0], [56, 38], [34, 62], [22, 90], [2, 118], [-30, 138], [-60, 142], [-40, 128], [-24, 104], [-30, 80], [-50, 60], [-66, 26], [-68, -12], [-52, -50]];
  // wisps
  ink([[-60, 142], [-84, 136], [-96, 118], [-86, 104], [-74, 110]], 2.2, { color: C.voiceSh });
  ink([[62, -44], [80, -58], [90, -48], [82, -38]], 2, { color: C.voiceSh });
  shape(body, C.voice, { w: 3.6 });
  fill([[36, -60], [60, -34], [64, 4], [52, 40], [30, 62], [18, 90], [4, 110], [14, 80], [30, 50], [46, 16], [48, -24]], C.voiceSh, { op: 0.9 });
  fill([[-40, -58], [-18, -68], [-26, -58], [-46, -44]], C.voiceLt);
  ink([[-40, 96], [-28, 88], [-22, 96]], 1.4, { color: C.voiceSh });
  ink([[-54, 40], [-44, 30], [-36, 36]], 1.4, { color: C.voiceSh });

  if (mood === 'menace') {
    [[-22, -24, 17], [22, -28, 19]].forEach(([x, y, r], i) => {
      shape(ell(x, y, r, r * 1.05, 14), '#fbf6e9', { w: 2.8 });
      fill(ell(x + (o.look || 0) * 6, y + 3, 3.6, 4, 8), INK, { wob: 0.2 });
      const s = i ? 1 : -1;
      ink([[x + s * 22, y - 30], [x + s * 6, y - 26], [x - s * 14, y - 14]], 7, { taper: [0.15, 0.2] });
    });
    // grin with teeth
    shape([[-44, 10], [-20, 20], [10, 20], [44, 4], [36, 26], [14, 44], [-14, 46], [-36, 32]], '#2b1d2c', { w: 3 });
    const teeth = [[-40, 12]];
    for (let i = 0; i < 9; i++) teeth.push([-36 + i * 9 + 4.5, 20 + (i % 2 ? -1 : 9)], [-36 + (i + 1) * 9, 19 - i * 0.4]);
    teeth.push([42, 6]);
    fill(teeth.concat([[40, 4], [-42, 9]]), '#fbf6e9', { lin: true, wob: 0.3 });
    fill(ell(0, 38, 14, 5, 10), '#6b3445');
  } else if (mood === 'shock') {
    [[-22, -24, 20], [22, -26, 22]].forEach(([x, y, r], i) => {
      shape(ell(x, y, r, r * 1.08, 14), '#fbf6e9', { w: 2.8 });
      fill(ell(x - 1, y, 2.6, 3, 8), INK, { wob: 0.1 });
      const s = i ? 1 : -1;
      ink([[x - s * 10, y - 34], [x + s * 4, y - 40], [x + s * 18, y - 36]], 4.5);
    });
    shape(ell(0, 26, 9, 12, 12), '#2b1d2c', { w: 2.6 });
    drop(64, -52, 1, 20); drop(-70, -40, 0.8, -25);
  } else if (mood === 'sulk') {
    [[-20, -20, 15], [20, -22, 16]].forEach(([x, y, r], i) => {
      shape(ell(x, y, r, r, 14), '#fbf6e9', { w: 2.6 });
      fill(ell(x + (i ? -3 : -3), y + 4, 3.4, 3.8, 8), INK, { wob: 0.1 });
      fill([[x - r - 3, y - r - 4], [x + r + 3, y - r - 4], [x + r + 3, y - 1], [x - r - 3, y - 1]], C.voice, { lin: true, wob: 0 });
      ink([[x - r + 1, y - 1], [x + r - 1, y - 1]], 3, { taper: [0.1, 0.1] });
    });
    // silenced: a big dab of yellow paint across the mouth
    shape([[-34, 14], [-8, 8], [22, 10], [38, 12], [34, 28], [6, 30], [-20, 30], [-36, 26]], C.yellow, { w: 2.6 });
    ink([[-24, 18], [0, 16], [24, 18]], 1.4, { color: '#d9a21c' });
    fill(ell(-12, 32, 3, 6, 8), C.yellow); fill(ell(18, 31, 2.4, 4.5, 8), C.yellow);
  }
  if (o.arms !== false) {
    // two stubby clawed arms reaching toward +x
    const reach = o.reach || 1;
    ink([[40, 30], [70 * reach, 36], [92 * reach, 22]], 9, { color: C.voice, taper: [0, 0.2], minW: 1 });
    ink([[40, 30], [70 * reach, 36], [92 * reach, 22]], 2.4, { taper: [0.1, 0.1] });
    [[0, 0], [6, 8], [2, 14]].forEach(([dx, dy]) => ink([[92 * reach + dx - 2, 22 + dy - 4], [104 * reach + dx, 14 + dy], [110 * reach + dx, 18 + dy]], 2.8, { taper: [0.1, 0.6] }));
  }
}

module.exports = { C, rod, brush, miraHead, voice, eyes, mouth };
