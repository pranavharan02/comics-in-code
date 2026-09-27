// hoku.js — motifs for "Every Line Alive": palette, the mountain she draws (at any skill),
// the great wave, cranes, fish, the cat. The artist herself lives in artist.js.
const I = require('./ink');
const { R, rng, emit, ink, fill, shape, cel, ell, arc, grp, text, INK } = I;

const P = {
  paper: '#fbf5e6', cream: '#f2e5c6', indigo: '#1f3a5f', prussian: '#2c5d8f', sky: '#bcd4de',
  verm: '#d9533a', gold: '#e8b54a', pink: '#f1b9b0', blossom: '#f6cdd3', pine: '#3f5e4d',
  skin: '#f2cda9', skinSh: '#d9a784', blush: '#ee9a86', robe: '#2b4c74', robeSh: '#1e3756',
  robeLt: '#46699a', sash: '#d9533a', wood: '#b07a48', woodSh: '#84552e', grey: '#9a9795',
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function mix(c1, c2, t) {
  const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = h(c1), b = h(c2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}
function hairColor(age) {
  if (age < 40) return '#27222a';
  if (age < 70) return mix('#27222a', '#8f8b92', (age - 40) / 30);
  return mix('#8f8b92', '#f1eee8', clamp((age - 70) / 25));
}

// ------------------------------------------------------------ the mountain she draws
// skill 0 = six-year-old, 1 = a hundred and ten. Drawn inside (0,0)-(w,h).
function fuji(w, h, skill, o = {}) {
  const wob = 3.6 * Math.pow(1 - skill, 1.6) + 0.25;
  const lw = lerp(3.4, 2.2, skill);
  const taper = skill > 0.3 ? [0.2, 0.25] : [0.02, 0.02];
  const col = o.color || INK;
  const L = (pts, ww = lw, oo = {}) => ink(pts, ww, { wob, taper, color: col, vary: lerp(0.05, 0.3, skill), ...oo });
  const base = h * 0.8;
  if (skill < 0.3) {
    // a lopsided triangle, a big sun, a stick bird
    L([[w * 0.12, base], [w * 0.47, h * 0.28], [w * 0.86, base]], lw, { lin: true });
    L([[w * 0.37, h * 0.43], [w * 0.47, h * 0.5], [w * 0.57, h * 0.42]], lw * 0.8, { lin: true });
    ink(ell(w * 0.82, h * 0.2, w * 0.08, w * 0.08, 10), lw * 0.8, { closed: true, wob, color: col });
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; L([[w * 0.82 + Math.cos(a) * w * 0.11, h * 0.2 + Math.sin(a) * w * 0.11], [w * 0.82 + Math.cos(a) * w * 0.15, h * 0.2 + Math.sin(a) * w * 0.15]], lw * 0.7, { lin: true }); }
    L([[w * 0.2, h * 0.22], [w * 0.24, h * 0.18], [w * 0.28, h * 0.22], [w * 0.32, h * 0.18]], lw * 0.7, { lin: true });
    L([[w * 0.04, h * 0.92], [w * 0.96, h * 0.9]], lw * 0.8, { lin: true });
    return;
  }
  // concave Fuji profile, flat summit
  const H = h * lerp(0.46, 0.64, skill);
  const prof = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, d = Math.abs(t - 0.5) * 2;
    const k = Math.pow(1 - Math.max(d, 0.09), lerp(1.2, 1.9, skill));
    prof.push([w * (0.06 + t * 0.88), base - H * k]);
  }
  if (skill > 0.55) {
    // snow cap with drips
    const snow = [];
    const top = prof.slice(5, 12);
    top.forEach((p) => snow.push(p));
    for (let i = 11; i >= 5; i--) { const p = prof[i]; const drip = (i % 2 ? 0.09 : 0.2) * H * (0.8 + rng() * 0.4); snow.push([p[0], p[1] + drip]); }
    if (skill > 0.7) fill(prof.concat([[w * 0.94, base], [w * 0.06, base]]), o.wash || '#8ea6bf', { op: lerp(0.15, 0.45, (skill - 0.7) / 0.3), wob: 0 });
    fill(snow, o.snow || '#ffffff', { wob: wob * 0.5 });
    L(snow.slice(7), lw * 0.6, { taper: [0.3, 0.3] });
  }
  L(prof, lw * 1.1);
  if (skill >= 0.3 && skill < 0.55) L([[w * 0.4, base - H * 0.62], [w * 0.47, base - H * 0.55], [w * 0.53, base - H * 0.62], [w * 0.6, base - H * 0.56]], lw * 0.7);
  // mist bands
  if (skill > 0.45) {
    const n = skill > 0.8 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const y = base - H * (0.18 + i * 0.16), x0 = w * (0.08 + rng() * 0.2);
      L([[x0, y], [x0 + w * 0.12, y - 3], [x0 + w * 0.3, y + 1], [x0 + w * 0.42, y - 2]], lw * 0.6, { taper: [0.4, 0.4] });
    }
  }
  // pines along the base
  if (skill > 0.4) {
    const n = Math.round(lerp(3, 9, skill));
    for (let i = 0; i < n; i++) {
      const x = w * (0.08 + (i / n) * 0.84) + R(4), y = base + 2, s = h * lerp(0.07, 0.1, skill) * (0.7 + rng() * 0.5);
      L([[x, y], [x, y - s]], lw * 0.55, { taper: [0, 0.3] });
      for (let k = 0; k < 3; k++) L([[x - s * 0.35 * (1 - k * 0.25), y - s * (0.25 + k * 0.22)], [x, y - s * (0.4 + k * 0.22)], [x + s * 0.35 * (1 - k * 0.25), y - s * (0.25 + k * 0.22)]], lw * 0.5, { taper: [0.3, 0.3] });
    }
  }
  // the wave in the foreground, once she can draw water
  if (skill > 0.85) grp(`translate(${w * 0.3} ${h}) scale(${w / 700})`, () => greatWave(0, 0, 150, { ink: col, mono: !o.colour, wob }));
  // birds
  const nb = skill > 0.6 ? 3 : 1;
  for (let i = 0; i < nb; i++) { const bx = w * (0.7 + i * 0.07), by = h * (0.16 + i * 0.06), s = w * 0.025; L([[bx - s, by], [bx - s * 0.3, by - s * 0.5], [bx, by], [bx + s * 0.3, by - s * 0.5], [bx + s, by]], lw * 0.5, { taper: [0.3, 0.3] }); }
  L([[w * 0.03, base], [w * 0.97, base + R(1)]], lw * 0.6, { taper: [0.1, 0.1] });
}

// ------------------------------------------------------------ a Great-Wave-ish breaker
// base at (x,y), curling to the right. o.mono: ink-only line drawing.
function greatWave(x, y, s, o = {}) {
  const k = s / 150, inkc = o.ink || INK, wb = o.wob ?? 0.6;
  const Q = ([a, b]) => [x + a * k, y + b * k];
  const outline = [[-170, 0], [-150, -46], [-112, -104], [-56, -146], [4, -164], [60, -154], [98, -124], [112, -92], [104, -66], [86, -56], [70, -62], [66, -78], [78, -84], [70, -98], [48, -106], [22, -104], [0, -90], [-12, -64], [-8, -34], [10, -12], [44, 0]].map(Q);
  if (!o.mono) fill(outline, o.blue || P.prussian, { wob: 0.5 });
  // inner current lines
  [[-150, -8, 0.0], [-128, -8, 0.22], [-104, -6, 0.42]].forEach(([sx, sy, t]) => {
    const band = [[sx, sy], [sx + 10, -60 + t * 30], [-60 + t * 40, -124 + t * 36], [0 + t * 10, -140 + t * 34], [52 - t * 4, -130 + t * 30], [84 - t * 10, -106 + t * 22]].map(Q);
    ink(band, 2.4 * k + 0.5, { color: o.mono ? inkc : '#8db3d6', taper: [0.3, 0.4], wob: wb });
  });
  ink(outline, 3.2 * k + 0.7, { closed: true, color: inkc, wob: 0 });
  // foam claws along the crest, pointing forward/down
  const crest = I.sample([[-112, -104], [-56, -146], [4, -164], [60, -154], [98, -124], [112, -92], [104, -66]].map(Q), false, 2);
  const nC = 11;
  for (let i = 0; i < nC; i++) {
    const idx = Math.floor(((i + 0.5) / nC) * (crest.length - 2)) + 1;
    const p = crest[idx], q = crest[idx + 1];
    let tx = q[0] - p[0], ty = q[1] - p[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = ty, ny = -tx; // outward normal (clockwise outline)
    const L = (14 + 8 * Math.sin(i * 1.7)) * k * (0.6 + (i / nC) * 0.6);
    const dx = tx * 0.7 + nx * 0.7, dy = ty * 0.7 + ny * 0.7;
    const claw = [[p[0] - tx * 6 * k, p[1] - ty * 6 * k], [p[0] + dx * L, p[1] + dy * L], [p[0] + dx * L + tx * 6 * k, p[1] + dy * L + ty * 6 * k], [p[0] + tx * 5 * k, p[1] + ty * 5 * k]];
    if (!o.mono) fill(claw, '#fbf5e6', { wob: 0.2 });
    ink(claw.slice(0, 3), 1.5 * k + 0.5, { color: inkc, taper: [0.1, 0.6], wob: 0.2 });
  }
  for (let i = 0; i < 12; i++) {
    const a = -2.2 + rng() * 2.8, r = (150 + rng() * 40) * k;
    fill(ell(x + 10 * k + Math.cos(a) * r * 0.8, y - 80 * k + Math.sin(a) * r * 0.7, 2.4 * k + 0.6, 2.4 * k + 0.6, 6), o.mono ? inkc : '#fbf5e6', { wob: 0 });
  }
}

// a red-crowned crane in flight, side view, heading +x.
// o.flap: 0 = wings fully up, 1 = wings fully down.
function crane(o = {}) {
  const white = o.fill || '#fbf8f0', shade = '#d9d3c4', f = o.flap ?? 0.3;
  const wing = (near) => {
    // wing is built pointing straight up from the shoulder, then rotated
    const c = Math.cos(f * Math.PI + (near ? 0 : 0.35));
    const sy = Math.sign(c || 1) * Math.max(Math.abs(c), 0.24);
    const L = near ? 1 : 0.86;
    grp(`translate(${near ? 4 : 12} -6) rotate(${near ? -14 : -24}) scale(${L} ${sy})`, () => {
      const outline = [[-12, 2], [-24, -30], [-20, -62], [-6, -96], [8, -120], [22, -104], [28, -78], [32, -50], [30, -20], [18, 2]];
      // black secondaries along the trailing (rear, -x) edge
      fill([[-12, 2], [-24, -30], [-20, -60], [-34, -54], [-40, -34], [-32, -10], [-22, 4]], INK, { wob: 0.3 });
      cel(outline, near ? white : mix(white, shade, 0.5), shade, { w: 2.4, lx: 3, ly: 3, wob: 0.3 });
      // separated primary tips
      [[0, -96, -16], [6, -104, -8], [12, -108, 0], [18, -102, 10]].forEach(([x, y, r]) => grp(`translate(${x} ${y}) rotate(${r})`, () => cel([[-3, 0], [-2, -18], [0, -24], [3, -18], [3, 0]], near ? white : mix(white, shade, 0.5), shade, { w: 1.8, lx: 1, ly: 1, wob: 0.1 })));
      [[-4, -40], [-2, -64], [4, -86]].forEach(([x, y]) => ink([[x + 18, y + 4], [x, y]], 1, { op: 0.45 }));
      // black tertial plumes
      ink([[-16, -20], [-30, -26], [-38, -20]], 5, { taper: [0.1, 0.6] });
      ink([[-14, -8], [-30, -10], [-40, -2]], 5, { taper: [0.1, 0.6] });
    });
  };
  wing(false);
  // legs trailing
  ink([[-40, 4], [-104, 12]], 2.4, { taper: [0.05, 0.3], color: '#3a3533' });
  ink([[-38, 7], [-100, 18]], 2.4, { taper: [0.05, 0.3], color: '#3a3533' });
  // body
  cel([[-44, 2], [-30, -10], [0, -14], [26, -10], [36, -2], [26, 10], [-6, 14], [-34, 12]], white, shade, { w: 2.6, lx: 2, ly: -4 });
  // tail tuft
  cel([[-44, 2], [-60, -4], [-56, 8], [-40, 10]], INK, '#000', { w: 1.6, lx: 0, ly: 0 });
  // neck: black, white nape stripe, a gentle S
  const neck = [[30, -4], [56, -8], [80, -8], [100, -10]];
  ink(neck, 9.6, { taper: [0.05, 0.05], minW: 1, wob: 0.2 });
  ink(neck.slice(2).map(([x, y]) => [x, y - 2.6]), 3, { color: white, taper: [0.2, 0.3], wob: 0.1 });
  // head
  cel(I.ell(104, -11, 8, 6, 10), white, shade, { w: 2, lx: 1, ly: -1 });
  fill([[100, -8], [110, -8], [112, -4], [100, -4]], INK, { wob: 0.2 });
  fill(I.ell(103, -15.5, 4, 2.4, 8), P.verm, { wob: 0.1 });
  fill(I.ell(106, -11.5, 1.3, 1.3, 6), INK, { wob: 0 });
  ink([[110, -11], [130, -8]], 3, { taper: [0.05, 0.9], color: '#8a846e' });
  wing(true);
}

function fish(o = {}) {
  const c = o.color || P.verm;
  shape([[-30, 0], [-40, -14], [-34, 0], [-40, 14]], c, { w: 2 });
  shape([[-32, 0], [-10, -14], [14, -12], [30, 0], [14, 12], [-10, 14]], c, { w: 2.6 });
  fill(ell(4, -4, 10, 5, 8), '#fbf5e6', { op: 0.5 });
  shape(ell(20, -3, 3.4, 3.4, 8), '#fff', { w: 1.2 }); fill(ell(21, -3, 1.6, 1.6, 6), INK, { wob: 0 });
  ink([[-6, -12], [2, -22], [10, -12]], 2, { taper: [0.2, 0.2] });
  ink([[-2, -8], [0, 8]], 1.2, { op: 0.6 }); ink([[8, -8], [10, 8]], 1.2, { op: 0.6 });
}

function cat(o = {}) {
  // a sleeping loaf
  const c = o.color || '#e6a05a';
  shape([[-44, 18], [-46, -4], [-30, -20], [0, -24], [30, -18], [44, 0], [42, 18]], c, { w: 2.8 });
  shape([[18, -16], [22, -34], [30, -20], [40, -34], [42, -12], [30, 0], [16, -4]], c, { w: 2.6 });
  ink(arc(26, -8, 4, 2, 0.2, 2.9, 4), 1.6); ink(arc(36, -8, 4, 2, 0.2, 2.9, 4), 1.6);
  ink([[-44, 16], [-58, 10], [-60, -2], [-50, -6]], 5, { color: c, taper: [0, 0.3], minW: 1 });
  ink([[-44, 16], [-58, 10], [-60, -2], [-50, -6]], 1.8, { taper: [0.1, 0.3] });
  [-16, -2, 10].forEach((x) => ink([[x, -22], [x + 2, -14]], 1.6, { color: '#b86e2f' }));
}

module.exports = { P, mix, lerp, clamp, hairColor, fuji, greatWave, crane, fish, cat };
