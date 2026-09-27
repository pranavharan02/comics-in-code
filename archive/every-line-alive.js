// every-line-alive.js — a Zen-Pencils-style strip, drawn entirely in code.
// Words: Katsushika Hokusai, afterword to One Hundred Views of Mount Fuji (1834), condensed.
// Run: node every-line-alive.js  → out/every-line-alive.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { R, rng, emit, ink, fill, cel, ell, arc, rect, grp, clipRect, clip, clipPoly, burst, text, caption, INK } = I;
const { P, mix, fuji, greatWave, crane, fish, cat } = require('../lib/hoku');
const A = require('../lib/artist');
const F = require('../lib/face');
const Hd = require('../lib/hands');

I.seed(1834);
const W = 980, H = 3330, X0 = 52, IW = 876, G = 20;

// ------------------------------------------------------------ page helpers
let GID = 0;
const grad = (kind, attrs, stops) => {
  const id = 'g' + (++GID);
  emit(`<defs><${kind} id="${id}" gradientUnits="userSpaceOnUse" ${attrs}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a ?? 1}"/>`).join('')}</${kind}></defs>`);
  return `url(#${id})`;
};
const linear = (x1, y1, x2, y2, stops) => grad('linearGradient', `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`, stops);
const radial = (cx, cy, r, stops) => grad('radialGradient', `cx="${cx}" cy="${cy}" r="${r}"`, stops);

// panel: art goes through a slight "rough ink" displacement; captions (post) stay crisp on top
function panel(x, y, w, h, bg, art, post) {
  grp(`translate(${x} ${y})`, () => {
    clipRect(0, 0, w, h, () => {
      rect(-2, -2, w + 4, h + 4, bg);
      emit('<g filter="url(#rough)">'); art(w, h); emit('</g>');
      emit(`<rect x="0" y="0" width="${w}" height="${h}" fill="#000" filter="url(#grain)" opacity="0.16" style="mix-blend-mode:multiply"/>`);
      if (post) post(w, h);
    });
    ink([[0, 0], [w, 0], [w, h], [0, h]], 3.6, { closed: true, lin: true, wob: 0.5, vary: 0.12 });
  });
}
function words(x, y, lines, o = {}) {
  const size = o.size || 16, lh = size * 1.26;
  lines.forEach((l, i) => text(x, y + i * lh, l, { size, anchor: o.anchor || 'start', color: o.color || INK, ls: 1.1, italic: o.italic }));
}
function ageTag(x, y, n) {
  // a small red hanko seal with the age
  grp(`translate(${x} ${y}) rotate(-5)`, () => {
    fill([[-19, -19], [19, -20], [20, 19], [-18, 20]].map(([a, b]) => [a + R(1.2), b + R(1.2)]), P.verm, { lin: true, wob: 0 });
    emit('<rect x="-14.5" y="-14.5" width="29" height="29" fill="none" stroke="#fbf5e6" stroke-width="1.8" rx="2"/>');
    text(0, 6.5, String(n), { font: 'Title', size: String(n).length > 2 ? 15 : 19, color: '#fbf5e6', ls: 0.3 });
  });
}

// ------------------------------------------------------------ rooms
// back wall + a wooden beam, and a tatami floor in one-point perspective toward vp
function room(w, h, o) {
  const fy = o.floorY, vp = o.vp;
  if (o.wall !== 'none') rect(0, 0, w, fy, o.wall);
  if (o.wallShade) rect(0, 0, w, fy, o.wallShade);
  const by = o.beamY ?? 26;
  cel([[-6, by], [w + 6, by], [w + 6, by + 14], [-6, by + 14]], o.wood || '#b58a5c', o.woodSh || '#8c6440', { lin: true, w: 2.4, lx: 0, ly: -4 });
  (o.posts || []).forEach((x) => {
    cel([[x, by + 14], [x + 18, by + 14], [x + 18, fy], [x, fy]], o.wood || '#b58a5c', o.woodSh || '#8c6440', { lin: true, w: 2.4, lx: 5, ly: 0 });
  });
  const tat = o.tatami || '#d9cf98', edge = o.edge || '#3b4a3a';
  rect(-2, fy, w + 4, h - fy + 4, tat);
  for (let yy = fy + 6; yy < h; yy += 6 + (yy - fy) * 0.06) ink([[-4, yy], [w + 4, yy]], 0.8, { color: mix(tat, '#000000', 0.16), taper: [0, 0], wob: 0.3, op: 0.8 });
  // tatami seams converging to the vanishing point
  for (let x0 = -600; x0 < w + 600; x0 += o.mat || 190) {
    const t = (h + 10 - vp[1]) / (fy - vp[1]);
    const xb = vp[0] + (x0 - vp[0]) * t;
    ink([[x0, fy], [xb, h + 10]], 3.4, { color: edge, taper: [0, 0], wob: 0.4, minW: 1 });
  }
  [0.22, 0.62].forEach((f) => { const yy = fy + (h - fy) * f; ink([[-4, yy], [w + 4, yy + R(1)]], 3, { color: edge, taper: [0, 0], wob: 0.5 }); });
  ink([[-4, fy], [w + 4, fy]], 3, { taper: [0, 0], wob: 0.4 });
  rect(-2, fy, w + 4, 8, '#000000', { op: 0.08 });
}

function shoji(x, y, w, h, o = {}) {
  cel(I.rectPts(x, y, w, h), o.paper || '#f7efd9', o.paperSh || '#e7dcc0', { lin: true, w: 3, lx: 0, ly: 0 });
  const cols = o.cols || 3, rows = o.rows || 5;
  for (let i = 1; i < cols; i++) ink([[x + (w * i) / cols, y], [x + (w * i) / cols, y + h]], 3, { color: o.frame || '#8c6440', taper: [0, 0], lin: true, wob: 0.3 });
  for (let j = 1; j < rows; j++) ink([[x, y + (h * j) / rows], [x + w, y + (h * j) / rows]], 3, { color: o.frame || '#8c6440', taper: [0, 0], lin: true, wob: 0.3 });
  ink(I.rectPts(x, y, w, h), 3, { closed: true, lin: true, wob: 0.3 });
}

// the view through the round window
function vista(cx, cy, r, o = {}) {
  const top = cy - r, bot = cy + r, L = cx - r, Rr = cx + r;
  rect(L, top, r * 2, r * 2, o.skyGrad ? linear(0, top, 0, bot, o.skyGrad) : (o.sky || '#bfdbe6'));
  if (o.sun) fill(ell(o.sun[0], o.sun[1], o.sun[2], o.sun[2], 18), o.sunColor || '#fff4d6', { wob: 0.3 });
  if (o.clouds) o.clouds.forEach(([x, y, s]) => { fill(ell(x, y, 34 * s, 11 * s, 12), '#ffffff', { op: 0.85 }); fill(ell(x + 18 * s, y - 7 * s, 20 * s, 10 * s, 10), '#ffffff', { op: 0.85 }); });
  const ms = o.mScale || 1, skyLow = o.skyGrad ? o.skyGrad[1][1] : (o.sky || '#bfdbe6');
  const mw = r * 1.9 * ms, mh = r * 0.95 * ms, base = cy + r * (o.mBase ?? 0.45), mx = cx - mw / 2 + r * 0.1 * ms + r * (o.mShift || 0);
  const prof = [];
  for (let i = 0; i <= 18; i++) { const t = i / 18, d = Math.abs(t - 0.5) * 2; prof.push([mx + t * mw, base - mh * Math.pow(1 - Math.max(d, 0.085), 1.8)]); }
  fill([[L, base - r * 0.05], [cx - r * 0.5, base - r * 0.16], [cx + r * 0.2, base - r * 0.04], [Rr, base - r * 0.14], [Rr, bot], [L, bot]], mix(o.mountain || P.indigo, skyLow, 0.6), { wob: 0.6 });
  cel(prof.concat([[mx + mw, bot], [mx, bot]]), o.mountain || P.indigo, mix(o.mountain || P.indigo, '#000000', 0.3), { lx: 16 * ms, ly: 0, w: 2.4, wob: 0.3 });
  const snow = prof.slice(6, 13).concat(prof.slice(6, 13).reverse().map(([a, b], i) => [a, b + mh * (i % 2 ? 0.1 : 0.2)]));
  fill(snow, o.snow || '#f6f2e8', { wob: 0.3 });
  ink(snow.slice(7), 1.6, { taper: [0.2, 0.2] });
  for (let i = 0; i < 4; i++) { const t = 0.3 + i * 0.12; ink([[mx + mw * t, base - mh * 0.62], [mx + mw * (t - 0.06), base - mh * 0.2]], 1.2, { op: 0.35, color: '#ffffff' }); }
  fill([[L, base - r * 0.02], [Rr, base - r * 0.08], [Rr, base + r * 0.06], [L, base + r * 0.1]], '#ffffff', { op: 0.35, wob: 1 });
  cel([[L, base + r * 0.12], [cx - r * 0.3, base + r * 0.02], [cx + r * 0.4, base + r * 0.16], [Rr, base + r * 0.06], [Rr, bot], [L, bot]], o.hill || P.pine, mix(o.hill || P.pine, '#000000', 0.25), { lx: 0, ly: 8, w: 2.2 });
  if (o.season === 'blossom') {
    ink([[L - 10, top + r * 0.35], [L + r * 0.5, top + r * 0.3], [L + r * 0.9, top + r * 0.1]], 6, { color: '#5a3b2c', taper: [0, 0.6] });
    ink([[L + r * 0.4, top + r * 0.31], [L + r * 0.6, top + r * 0.5]], 3, { color: '#5a3b2c', taper: [0, 0.8] });
    for (let i = 0; i < 34; i++) { const t = rng(); cel(ell(L + t * r * 0.95 + R(12), top + r * (0.34 - t * 0.24) + R(14), 5.5, 5, 7), '#f9dfe3', '#eeb3bd', { w: 1, lx: 1, ly: -1 }); }
    for (let i = 0; i < 10; i++) fill(ell(L + rng() * r * 2, top + rng() * r * 1.6, 2.4, 1.6, 6), P.blossom, { wob: 0 });
  } else if (o.season === 'autumn') {
    ink([[Rr + 10, top + r * 0.3], [Rr - r * 0.6, top + r * 0.22]], 6, { color: '#5a3b2c', taper: [0, 0.6] });
    for (let i = 0; i < 26; i++) { const x = Rr - rng() * r * 0.8, y = top + r * (0.1 + rng() * 0.3); fill([[x, y - 5], [x + 5, y], [x, y + 5], [x - 5, y]], i % 2 ? '#d9533a' : '#e8904a', { wob: 0.6 }); }
    for (let i = 0; i < 8; i++) { const x = L + rng() * r * 2, y = top + rng() * r * 1.8; fill([[x, y - 3], [x + 3, y], [x, y + 3], [x - 3, y]], '#e8904a', { wob: 0.4 }); }
  }
  if (o.extra) o.extra();
}
function roundWindow(cx, cy, r, o) {
  clip(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`, () => {
    vista(cx, cy, r, o);
    emit(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="10"/>`);
  });
  emit(`<circle cx="${cx}" cy="${cy}" r="${r + 7}" fill="none" stroke="${o.frame || '#a8784a'}" stroke-width="14"/>`);
  ink(ell(cx, cy, r, r, 30), 2.6, { closed: true, wob: 0.3 });
  ink(ell(cx, cy, r + 14, r + 14, 32), 3.2, { closed: true, wob: 0.3 });
  ink(arc(cx, cy, r + 7, r + 7, Math.PI * 0.15, Math.PI * 0.85, 10), 1.4, { color: '#6b4a2e', op: 0.7 });
}

// low writing desk seen at a slight angle
function lowDesk(x, y, w, d, h, o = {}) {
  const top = [[x, y], [x + w, y], [x + w + d, y - d * 0.6], [x + d, y - d * 0.6]];
  const wood = o.wood || '#b07a48', sh = o.sh || '#84552e';
  [x + 6, x + w - 14].forEach((lx) => cel([[lx, y + 8], [lx + 10, y + 8], [lx + 10, y + h], [lx, y + h]], sh, mix(sh, '#000', 0.3), { lin: true, w: 2.4, lx: 3, ly: 0 }));
  cel([[x + w - 4, y + 4], [x + w + d - 10, y - d * 0.6 + 4], [x + w + d - 10, y - d * 0.6 + h - 6], [x + w - 4, y + h - 4]], sh, mix(sh, '#000', 0.3), { lin: true, w: 2.2 });
  cel([[x, y], [x + w, y], [x + w, y + 10], [x, y + 10]], sh, mix(sh, '#000', 0.25), { lin: true, w: 2.6, lx: 0, ly: -3 });
  cel([[x + w, y], [x + w + d, y - d * 0.6], [x + w + d, y - d * 0.6 + 10], [x + w, y + 10]], mix(sh, '#000', 0.15), mix(sh, '#000', 0.3), { lin: true, w: 2.4 });
  cel(top, wood, sh, { lin: true, w: 2.8, lx: 10, ly: -4 });
  ink([[x + 16, y - 6], [x + w * 0.7, y - 7]], 1.1, { color: sh, lin: true, op: 0.7 });
}
// a sheet lying on a desk: drawn flat then squashed into the desk's perspective
function paperOn(x, y, w, h, fn, o = {}) {
  const sq = o.squash ?? 0.42, sk = o.skew ?? 0.9;
  emit(`<g transform="matrix(1 0 ${sk * sq} ${sq} ${x} ${y})">`);
  cel(I.rectPts(0, -h, w, h), '#fbf6e8', '#e9dfc6', { lin: true, w: 1.8, lx: 3, ly: -3, wob: 0.2 });
  clipRect(2, -h + 2, w - 4, h - 4, () => grp(`translate(0 ${-h})`, () => fn(w, h)));
  emit('</g>');
}
function inkstone(x, y, s = 1) {
  grp(`translate(${x} ${y}) scale(${s})`, () => {
    cel([[-26, -8], [22, -8], [30, -16], [-18, -16]], '#3a3740', '#2a2830', { lin: true, w: 2 });
    cel([[-26, -8], [22, -8], [22, 2], [-26, 2]], '#2a2830', '#1c1a20', { lin: true, w: 2.2 });
    cel([[22, -8], [30, -16], [30, -6], [22, 2]], '#232128', '#1c1a20', { lin: true, w: 2 });
    fill(ell(-4, -12, 14, 3, 10), '#16151a', { wob: 0.2 }); fill(ell(-8, -13, 4, 1, 6), '#6f7a8c', { wob: 0 });
  });
}
function brushPot(x, y, s = 1) {
  grp(`translate(${x} ${y}) scale(${s})`, () => {
    [[-8, -58, -10], [0, -64, 0], [8, -56, 12], [3, -60, 5]].forEach(([dx, dy, r]) => grp(`rotate(${r})`, () => {
      ink([[dx, 0], [dx, dy]], 5.4, { taper: [0, 0], minW: 1, wob: 0 }); ink([[dx, 0], [dx, dy]], 2.6, { color: P.wood, taper: [0, 0], minW: 1, wob: 0 });
      fill([[dx - 2.4, dy], [dx + 2.4, dy], [dx, dy - 9]], INK);
    }));
    cel([[-16, -30], [16, -30], [14, 0], [-14, 0]], '#6d8b8a', '#4f6b6a', { w: 2.4, lin: true, lx: 5, ly: 0 });
    ink([[-12, -22], [12, -22]], 1.2, { color: '#3d5352', lin: true });
  });
}
function scatteredSheet(x, y, rot, fn, s = 1) {
  grp(`translate(${x} ${y}) scale(${s} ${s * 0.5}) rotate(${rot})`, () => {
    cel(I.rectPts(-36, -26, 72, 52), '#fbf6e8', '#e5dbc2', { lin: true, w: 2, lx: 3, ly: -3 });
    clipRect(-34, -24, 68, 48, () => grp('translate(-36 -26)', () => fn(72, 52)));
  });
}
function pinned(x, y, w, h, rot, fn, bg = '#fbf6e8') {
  grp(`translate(${x} ${y}) rotate(${rot})`, () => {
    fill(I.rectPts(4, 5, w, h), '#000', { op: 0.12, lin: true, wob: 0 });
    cel(I.rectPts(0, 0, w, h), bg, mix(bg, '#8a7a5a', 0.25), { lin: true, w: 1.8, lx: 4, ly: -4, wob: 0.3 });
    clipRect(2, 2, w - 4, h - 4, () => fn(w, h));
    fill(ell(w / 2, 6, 3.4, 3.4, 8), P.verm, { wob: 0 });
    fill(ell(w / 2 - 1, 5, 1.1, 1.1, 6), '#ffd9c9', { wob: 0 });
  });
}
function doodle(kind, x, y, s = 1) {
  // a six-year-old's drawings: fat wobbly lines
  const o = { wob: 2, taper: [0.02, 0.02], vary: 0.05 };
  grp(`translate(${x} ${y}) scale(${s})`, () => {
    if (kind === 'cat') {
      ink(ell(0, 10, 26, 16, 10), 3.2, { ...o, closed: true });
      ink([[-10, -4], [-8, -18], [0, -8], [8, -18], [10, -4]], 3, { ...o, lin: true });
      fill(ell(-5, 4, 2, 2, 6), INK); fill(ell(5, 4, 2, 2, 6), INK);
      ink([[26, 12], [40, 0], [38, -10]], 3, o);
    } else if (kind === 'fish') {
      ink([[-24, 0], [0, -14], [24, 0], [0, 14], [-24, 0], [-36, -10], [-36, 10], [-24, 0]], 3, { ...o, lin: true });
      fill(ell(12, -3, 2.4, 2.4, 6), INK);
    } else if (kind === 'hand') {
      ink([[-20, 30], [-22, 0], [-26, -24], [-16, -26], [-12, -4], [-10, -34], [0, -34], [0, -6], [4, -30], [14, -28], [10, 0], [16, -16], [24, -12], [16, 14], [10, 30]], 3, { ...o, lin: true });
    } else if (kind === 'sun') {
      ink(ell(0, 0, 14, 14, 10), 3, { ...o, closed: true });
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; ink([[Math.cos(a) * 19, Math.sin(a) * 19], [Math.cos(a) * 27, Math.sin(a) * 27]], 3, { ...o, lin: true }); }
    } else if (kind === 'bird') {
      ink([[-20, 0], [-8, -10], [0, 0], [8, -10], [20, 0]], 3, { ...o, lin: true });
    }
  });
}
// a close-up drawing hand coming in from the right: the brush tip lands on (tx,ty);
// forearm and sleeve run off-panel toward (ex,ey)
function drawingHand(tx, ty, s, ex, ey, o = {}) {
  const r = ((o.rot || 0) * Math.PI) / 180;
  const rx = -44 * s, ry = 40 * s; // tip relative to wrist, mirrored hand
  const wx = tx - (rx * Math.cos(r) - ry * Math.sin(r)), wy = ty - (rx * Math.sin(r) + ry * Math.cos(r));
  const sleeve = o.sleeve || '#3d6fa8', sh = o.sleeveSh || '#2c5486';
  const mx = wx + (ex - wx) * 0.4, my = wy + (ey - wy) * 0.4;
  Hd.tube([[wx - 2 * s, wy + 2 * s], [mx, my]], 10.5 * s, { line: 1.9 * s });
  const dx = ex - mx, dy = ey - my, dl = Math.hypot(dx, dy), ux = -dy / dl, uy = dx / dl;
  cel([[mx + ux * 11 * s, my + uy * 11 * s], [ex + ux * 26 * s, ey + uy * 26 * s], [ex - ux * 26 * s, ey - uy * 26 * s], [mx - ux * 11 * s, my - uy * 11 * s]], sleeve, sh, { w: 2.2 * s, lx: 0, ly: -4 * s });
  fill(ell(mx + (dx / dl) * 3 * s, my + (dy / dl) * 3 * s, 3.5 * s, 9 * s, 10, Math.atan2(dy, dx)), sh, { wob: 0.2 });
  grp(`translate(${wx} ${wy}) rotate(${o.rot || 0}) scale(${-s} ${s})`, () => Hd.gripHand({ old: o.old }));
}
function cushion(x, y, rx, ry, c = '#c9553f') {
  cel(ell(x, y, rx, ry, 16), c, mix(c, '#000', 0.25), { w: 2.6, lx: 0, ly: -6 });
  ink(ell(x, y - 2, rx * 0.8, ry * 0.6, 14), 1.2, { closed: true, color: mix(c, '#000', 0.3), op: 0.7 });
}
function goldfishBowl(x, y, s = 1) {
  grp(`translate(${x} ${y}) scale(${s})`, () => {
    fill(ell(0, 30, 30, 6, 12), '#000', { op: 0.12, wob: 0 });
    cel(ell(0, 0, 32, 30, 20), '#d8ecf1', '#b9d7e0', { w: 0, lx: -6, ly: -4 });
    clipRect(-40, 0, 80, 40, () => fill(ell(0, 0, 31, 29, 20), '#8fc3d4', { op: 0.85, wob: 0 }));
    grp('translate(2 6) scale(0.42) rotate(-6)', () => fish());
    ink(ell(0, 0, 32, 30, 20), 2.6, { closed: true, wob: 0.3 });
    ink(ell(0, -26, 16, 4, 12), 2, { closed: true, wob: 0.2 });
    ink(arc(0, 0, 24, 22, -2.5, -1.9, 4), 3, { color: '#ffffff', op: 0.9 });
    ink([[-31, 1], [31, 1]], 1.4, { color: '#5d97ab' });
  });
}
function catCel(x, y, s = 1, c = '#e6a05a') {
  grp(`translate(${x} ${y}) scale(${s})`, () => {
    fill(ell(0, 18, 46, 6, 12), '#000', { op: 0.12, wob: 0 });
    ink([[-44, 16], [-58, 10], [-60, -2], [-50, -6]], 8, { taper: [0.05, 0.3], minW: 1 });
    ink([[-44, 16], [-58, 10], [-60, -2], [-50, -6]], 4.6, { color: c, taper: [0.05, 0.3], minW: 1 });
    cel([[-44, 18], [-46, -4], [-30, -20], [0, -24], [30, -18], [44, 0], [42, 18]], c, mix(c, '#7a3d10', 0.35), { w: 2.8, lx: 6, ly: -6 });
    cel([[18, -16], [21, -36], [31, -22], [40, -36], [43, -12], [31, 1], [16, -4]], c, mix(c, '#7a3d10', 0.35), { w: 2.6, lx: 3, ly: -3 });
    fill([[23, -30], [25, -24], [28, -24]], '#f3b9a6', { wob: 0 }); fill([[39, -30], [38, -24], [35, -24]], '#f3b9a6', { wob: 0 });
    ink(arc(26, -8, 4, 2, 0.2, 2.9, 4), 1.6); ink(arc(36, -8, 4, 2, 0.2, 2.9, 4), 1.6);
    ink([[30, -3], [31, -1], [32, -3]], 1.3);
    [-18, -4, 8].forEach((xx) => ink([[xx, -22], [xx + 2, -13]], 1.8, { color: mix(c, '#7a3d10', 0.5) }));
    ink([[44, -4], [58, -8]], 0.9); ink([[44, -1], [58, 0]], 0.9);
  });
}

// ------------------------------------------------------------ the page
emit(`<defs>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.3"/></filter>
<filter id="rough" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
</defs>`);
emit(`<rect width="${W}" height="${H}" fill="#fffdf7"/>`);

// ---- title block
(function title() {
  text(112, 72, "Hokusai's", { font: 'Hand', size: 42, color: P.verm, anchor: 'start', ls: 1, rot: -3 });
  text(116, 172, 'EVERY LINE', { font: 'Title', size: 106, color: '#14283f', anchor: 'start', ls: 3 });
  text(110, 166, 'EVERY LINE', { font: 'Title', size: 106, color: '#4a8fcb', stroke: INK, sw: 3, anchor: 'start', ls: 3 });
  text(246, 266, 'ALIVE', { font: 'Title', size: 112, color: '#5a1d14', anchor: 'start', ls: 6 });
  text(240, 260, 'ALIVE', { font: 'Title', size: 112, color: P.verm, stroke: INK, sw: 3, anchor: 'start', ls: 6 });
  ink([[98, 212], [228, 208]], 28, { taper: [0.04, 0.1], vary: 0.1, wob: 0.6 });
  text(164, 217, 'A LIFE IN LINES', { size: 11, color: '#fffdf7', ls: 2 });
  text(112, 300, 'WORDS BY', { size: 13, ls: 2.2, anchor: 'start' });
  text(206, 300, 'KATSUSHIKA HOKUSAI', { size: 13, ls: 2.2, anchor: 'start', color: P.verm });
  text(446, 300, 'ART BY', { size: 13, ls: 2.2, anchor: 'start' });
  text(514, 300, 'CLAUDE', { size: 13, ls: 2.2, anchor: 'start', color: P.verm });
  grp('translate(790 190)', () => {
    grp('rotate(-7)', () => {
      fill(I.rectPts(-86, 22, 172, 94), '#000', { op: 0.1, lin: true, wob: 0 });
      cel(I.rectPts(-92, 14, 172, 94), '#fbf6e8', '#e9dfc6', { lin: true, w: 2.6, lx: 4, ly: -4 });
      grp('translate(-86 20)', () => fuji(160, 84, 0.93));
    });
    grp('translate(-10 -64) rotate(-10) scale(0.72)', () => crane({ flap: 0.3 }));
    ink([[-30, 30], [-42, 0], [-30, -30]], 1.4, { op: 0.4 });
    [[-50, -10], [-66, -40], [56, -100], [40, 0], [-20, -110]].forEach(([a, b]) => fill(ell(a, b, 2.6, 2.6, 6), INK, { wob: 0 }));
  });
})();

// ================================================================ A: age six
let y = 324;
panel(X0, y, IW, 400, '#efe0c0', (w, h) => {
  room(w, h, { wall: '#efe0c0', floorY: 300, vp: [420, 180], posts: [300, 790], beamY: 22 });
  shoji(812, 50, 64, 250, { cols: 2, rows: 6 });
  roundWindow(560, 160, 100, { season: 'blossom', sky: '#bfdde6', hill: '#7fa66f', mountain: '#3b5f8a', clouds: [[620, 110, 0.8]] });
  fill([[470, 300], [650, 300], [720, 400], [400, 400]], '#fff4d0', { op: 0.18, lin: true });
  pinned(24, 158, 72, 56, -6, (a, b) => doodle('sun', a / 2, b / 2 + 2, 0.8));
  pinned(104, 150, 70, 54, 5, (a, b) => doodle('cat', a / 2 - 4, b / 2 + 2, 0.75));
  pinned(186, 160, 80, 60, -3, (a, b) => fuji(a, b, 0.02));
  pinned(34, 226, 66, 52, 7, (a, b) => doodle('fish', a / 2 + 4, b / 2, 0.7));
  pinned(112, 216, 60, 66, -5, (a, b) => doodle('hand', a / 2, b / 2 + 4, 0.75));
  pinned(196, 232, 70, 50, 4, (a, b) => doodle('bird', a / 2, b / 2 + 4, 1));
  cel([[650, 262], [706, 262], [700, 300], [656, 300]], '#8c6440', '#6b4a2e', { lin: true, w: 2.4 });
  goldfishBowl(678, 232, 0.9);
  cushion(770, 360, 58, 18);
  catCel(772, 340, 0.9);
  [[60, 330, 10, (a, b) => fuji(a, b, 0.03)], [150, 372, -14, (a, b) => doodle('cat', a / 2, b / 2 + 4, 0.6)], [560, 350, 8, (a, b) => fuji(a, b, 0.05)], [640, 384, -8, (a, b) => doodle('fish', a / 2, b / 2, 0.6)]].forEach(([a, b, r, fn]) => scatteredSheet(a, b, r, fn));
  lowDesk(318, 318, 170, 36, 52);
  paperOn(330, 318, 118, 60, (a, b) => fuji(a, b, 0.04));
  inkstone(470, 312, 0.7);
  brushPot(504, 300, 0.7);
  grp('translate(248 384)', () => A.kneeler({ age: 6, mood: 'neutral', look: [1, 1], handAt: [128, -122] }));
}, (w, h) => {
  words(24, 68, ['FROM THE AGE OF SIX I HAD', 'A MANIA FOR DRAWING', 'THE SHAPES OF THINGS.'], { size: 17 });
  ageTag(w - 30, h - 30, 6);
});

// ================================================================ B: the shapes of things
y += 400 + G;
const bw = (IW - 2 * G) / 3, bh = 250;
const sheet = (x, y0, rot, w, h, fn) => grp(`translate(${x} ${y0}) rotate(${rot})`, () => {
  fill(I.rectPts(-w / 2 + 4, -h / 2 + 4, w, h), '#000', { op: 0.12, lin: true, wob: 0 });
  cel(I.rectPts(-w / 2, -h / 2, w, h), '#fbf6e8', '#e9dfc6', { lin: true, w: 2, lx: 4, ly: -4 });
  fn();
});
panel(X0, y, bw, bh, '#e9d6b0', (w, h) => {
  rect(0, 0, w, h, linear(0, 0, 0, h, [[0, '#ecdab6'], [1, '#d9c393']]));
  cushion(96, 108, 84, 28);
  catCel(98, 84, 1.25);
  sheet(150, 196, -8, 140, 92, () => doodle('cat', -6, -2, 1.15));
  drawingHand(190, 190, 1.9, 330, 70);
});
panel(X0 + bw + G, y, bw, bh, '#cfe3e6', (w, h) => {
  rect(0, 0, w, h, linear(0, 0, 0, h, [[0, '#d5e8ea'], [1, '#b6d2d6']]));
  goldfishBowl(92, 104, 2.1);
  sheet(170, 204, 6, 140, 92, () => doodle('fish', 2, -2, 1.3));
  drawingHand(202, 200, 1.9, 330, 80);
});
panel(X0 + 2 * (bw + G), y, bw, bh, '#f1d4c8', (w, h) => {
  rect(0, 0, w, h, linear(0, 0, 0, h, [[0, '#f3d9cd'], [1, '#e2b6a4']]));
  Hd.tube([[74, 196], [60, 270]], 30, { line: 4 });
  cel([[40, 250], [84, 244], [88, 262], [36, 268]], '#2c5486', '#223f66', { w: 3 });
  cel([[30, 262], [94, 256], [100, 280], [24, 280]], '#3d6fa8', '#2c5486', { w: 3.4 });
  grp('translate(76 204)', () => Hd.openHand({ scale: 2.7, rot: -6 }));
  sheet(192, 180, 4, 106, 120, () => doodle('hand', -2, 2, 1.2));
  drawingHand(212, 196, 1.8, 330, 80);
  [[222, 118, -30], [246, 106, 0], [202, 132, -50]].forEach(([a, b, r]) => grp(`translate(${a} ${b}) rotate(${r})`, () => ink([[0, 0], [0, -12]], 2.4, { taper: [0.2, 0.6] })));
});

// ================================================================ C: fifty
y += bh + G;
const c1 = 540, c2 = IW - c1 - G, ch = 340;
panel(X0, y, c1, ch, '#b6b3ad', (w, h) => {
  room(w, h, { wall: '#b6b3ad', floorY: 262, vp: [260, 150], posts: [], beamY: -40, tatami: '#b7b089', edge: '#3d3f3a', wood: '#8d8378', woodSh: '#6c645b' });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
    const px = 6 + c * 68 + (r % 2) * 22, py = 8 + r * 56;
    if (px > 100 && px < 280 && py > 40) continue;
    pinned(px, py, 56, 42, R(5), (a, b) => fuji(a, b, 0.45 + rng() * 0.08), '#e4dfd4');
  }
  const tower = (x, n, base) => { for (let i = 0; i < n; i++) { const ww = 76 + R(8); cel(I.rectPts(x + R(5), base - (i + 1) * 13, ww, 11), i % 3 ? '#d9d4c8' : '#8c8883', '#aaa59a', { lin: true, w: 1.8, lx: 0, ly: -3, wob: 0.4 }); } };
  tower(446, 18, 340); tower(10, 7, 340);
  [[120, 318], [380, 322], [404, 304], [96, 296]].forEach(([a, b]) => {
    const pts = []; for (let i = 0; i < 10; i++) { const t = (i / 10) * 6.28, k = 0.75 + rng() * 0.4; pts.push([a + Math.cos(t) * 13 * k, b + Math.sin(t) * 10 * k]); }
    cel(pts, '#ece6d8', '#c9c1ae', { lin: true, w: 2 }); ink([[a - 6, b - 2], [a, b + 3], [a + 5, b - 4]], 1.1, { lin: true });
  });
  lowDesk(260, 280, 150, 30, 62, { wood: '#8f7a64', sh: '#6b5a48' });
  paperOn(272, 280, 110, 56, (a, b) => fuji(a, b, 0.5));
  inkstone(394, 274, 0.62);
  grp('translate(190 340) scale(0.84)', () => A.kneeler({ age: 50, mood: 'sad', look: [1, 1], handAt: [131, -79], lean: 8 }));
}, (w, h) => {
  caption(300, 14, ['BY FIFTY I HAD', 'PUBLISHED MORE', 'PICTURES THAN I', 'COULD COUNT...'], { size: 15 });
});
panel(X0 + c1 + G, y, c2, ch, '#7d7b79', (w, h) => {
  rect(0, 0, w, h, radial(220, 150, 260, [[0, '#9a9794'], [1, '#6c6a68']]));
  cel([[-20, 350], [-10, 300], [40, 272], [110, 264], [170, 286], [200, 350]], '#4a5873', '#36415a', { w: 3.2, lx: 12, ly: -6 });
  ink([[62, 268], [96, 306], [130, 350]], 7, { color: '#efe7d6', taper: [0, 0], minW: 1 }); ink([[62, 268], [96, 306], [130, 350]], 1.6);
  grp('translate(92 216) scale(1.7)', () => F.head({ age: 52, mood: 'sad', look: [1, 0.1], neck: 60 }));
  cel([[300, 200], [340, 180], [340, 250], [296, 250]], '#4a5873', '#36415a', { w: 3 });
  Hd.tube([[308, 196], [300, 196]], 20, {});
  [[304, 150], [306, 166], [304, 182]].forEach(([a, b]) => Hd.finger([a + 4, b], [186, 180, 172], [10, 8, 6], 8.4));
  grp('translate(186 118) rotate(5)', () => {
    fill(I.rectPts(6, 8, 104, 84), '#000', { op: 0.18, lin: true, wob: 0 });
    cel(I.rectPts(0, 0, 104, 84), '#e8e3d8', '#cfc8b8', { lin: true, w: 2.2, lx: 4, ly: -4 });
    clipRect(2, 2, 100, 80, () => fuji(104, 84, 0.5));
  });
  Hd.finger([306, 204], [200, 192, 184], [12, 10, 7], 9.2, { nail: true });
}, (w, h) => {
  words(16, 34, ['...YET NOTHING I DREW', 'BEFORE SEVENTY WAS', 'WORTH NOTICING.'], { color: '#fbf5e6', size: 15 });
  ageTag(w - 28, h - 28, 50);
});

// ================================================================ D: seventy-three, dawn
y += ch + G;
const dh = 360;
panel(X0, y, IW, dh, '#f1d9c6', (w, h) => {
  room(w, h, { wall: '#f3dcc8', wallShade: linear(0, 0, w, 0, [[0, '#e8b89a', 0.35], [0.7, '#fff2dc', 0]]), floorY: 290, vp: [560, 150], posts: [262, 850], tatami: '#dfd09c' });
  roundWindow(706, 164, 122, {
    skyGrad: [[0, '#f2a987'], [0.6, '#f8d8a2'], [1, '#fcebc4']], sun: [790, 220, 24], mountain: '#44567e', hill: '#6e8a67',
    extra: () => {
      ink([[616, 300], [628, 226], [620, 160], [636, 108]], 11, { color: '#4a3326', taper: [0, 0.4] });
      [[600, 128, 44], [646, 160, 38], [614, 200, 46], [658, 110, 32]].forEach(([a, b, r]) => cel(ell(a, b, r, r * 0.42, 14), P.pine, '#2d4637', { w: 2, lx: 0, ly: -5, wob: 1 }));
      grp('translate(784 220) scale(0.55)', () => {
        ink([[-4, 34], [-8, 96]], 3.4, { color: '#3a3533' }); ink([[14, 34], [18, 96]], 3.4, { color: '#3a3533' });
        cel([[-40, 18], [-8, -10], [34, -6], [46, 16], [10, 36], [-26, 34]], '#fbf8f0', '#d9d3c4', { w: 3, lx: 3, ly: -4 });
        cel([[-42, 18], [-72, 30], [-48, 42], [-24, 34]], INK, '#000', { w: 2 });
        ink([[36, -2], [48, -60], [44, -112]], 9, { taper: [0.05, 0.05], minW: 1 }); ink([[40, -60], [44, -104]], 3, { color: '#fbf8f0', taper: [0.2, 0.3] });
        cel(ell(48, -118, 11, 8, 10), '#fbf8f0', '#d9d3c4', { w: 2.4, lx: 1, ly: -1 }); fill(ell(48, -124, 5.5, 3, 8), P.verm);
        fill(ell(51, -119, 1.6, 1.6, 6), INK, { wob: 0 });
        ink([[58, -118], [84, -112]], 3.2, { taper: [0.1, 0.8], color: '#8a846e' });
      });
    },
  });
  fill([[600, 290], [800, 290], [880, 360], [520, 360]], '#fff2d0', { op: 0.22, lin: true });
  pinned(24, 166, 86, 64, -4, (a, b) => grp(`translate(${a / 2} ${b / 2 + 4}) scale(0.5)`, () => fish({ color: '#fbf5e6' })));
  pinned(118, 158, 72, 62, 5, (a, b) => {
    ink(ell(a / 2, b / 2 + 4, 12, 16, 12), 1.8, { closed: true }); ink([[a / 2, b / 2 - 12], [a / 2, b / 2 + 20]], 1.2);
    [-1, 1].forEach((s) => [-6, 4, 14].forEach((d) => ink([[a / 2 + s * 11, b / 2 + d], [a / 2 + s * 22, b / 2 + d - 6]], 1.4)));
    ink([[a / 2 - 4, b / 2 - 14], [a / 2 - 10, b / 2 - 24]], 1.2); ink([[a / 2 + 4, b / 2 - 14], [a / 2 + 10, b / 2 - 24]], 1.2);
  });
  pinned(24, 250, 84, 58, -6, (a, b) => { for (let i = 0; i < 10; i++) ink([[8 + i * 7, b - 4], [6 + i * 7 + R(8), 8 + rng() * 22]], 1.6, { taper: [0, 0.8] }); });
  pinned(118, 236, 96, 64, 3, (a, b) => grp(`translate(${a / 2 + 4} ${b / 2 + 14}) scale(0.34)`, () => crane({ flap: 0.1, fill: '#fbf6e8' })));
  pinned(206, 170, 76, 60, -3, (a, b) => grp(`translate(${a / 2} ${b / 2 + 8}) scale(0.4)`, () => cat({ color: '#fbf6e8' })));
  pinned(208, 246, 70, 70, 6, (a, b) => { ink([[a / 2, b - 6], [a / 2 - 4, 30], [a / 2 + 4, 10]], 2.6, { taper: [0, 0.5] }); [[a / 2 - 14, 26], [a / 2 + 12, 34], [a / 2, 16]].forEach(([p, q]) => ink(arc(p, q, 14, 5, Math.PI, Math.PI * 2, 6), 1.6)); });
  lowDesk(420, 300, 170, 36, 50);
  paperOn(432, 300, 124, 62, (a, b) => fuji(a, b, 0.62));
  inkstone(580, 294, 0.7);
  brushPot(612, 282, 0.72);
  grp('translate(360 356) scale(0.8)', () => A.kneeler({ age: 73, mood: 'focus', look: [1, 1], glasses: true, handAt: [137, -80] }));
}, (w, h) => {
  caption(16, 52, ['AT SEVENTY-THREE I BEGAN TO GRASP', 'HOW BIRDS AND BEASTS ARE BUILT,', 'INSECTS AND FISH, AND HOW', 'GRASSES AND TREES GROW.'], { size: 14.5 });
  ageTag(w - 30, h - 30, 73);
});

// ================================================================ E: the same view, again and again
y += dh + G;
const ew = (IW - 2 * G) / 3, eh = 330;
function overShoulder(o) {
  return (w, h) => {
    room(w, h, { wall: o.wall, floorY: 190, vp: [170, 90], posts: [], beamY: -40, tatami: o.tatami || '#dccf9c' });
    roundWindow(212, 86, 52, o.view);
    cel([[40, 200], [272, 200], [272, 300], [20, 300]], '#b07a48', '#8f6038', { lin: true, w: 2.8, lx: 0, ly: -8 });
    ink([[40, 200], [272, 200]], 2, { lin: true, color: '#e0b27e' });
    grp('translate(104 214) rotate(-2)', () => {
      fill(I.rectPts(4, 5, 156, 78), '#000', { op: 0.14, lin: true, wob: 0 });
      cel(I.rectPts(0, 0, 156, 78), '#fbf6e8', '#e9dfc6', { lin: true, w: 1.8, lx: 3, ly: -3 });
      clipRect(2, 2, 152, 74, () => fuji(156, 78, o.skill));
    });
    inkstone(250, 294, 0.7);
    grp('translate(56 382) scale(0.78)', () => A.backView({ age: o.age, glasses: true }));
    Hd.tube([[140, 306], [122, 264]], 11, {});
    grp('translate(120 262) rotate(-30)', () => Hd.gripHand({ old: true }));
  };
}
[
  { age: 80, skill: 0.74, wall: '#f3e1c5', view: { season: 'blossom', sky: '#c6dde6', hill: '#86a56f', mountain: '#3f5d86' }, words: ['AT EIGHTY', "I'LL HAVE", 'GONE', 'FURTHER.'] },
  { age: 90, skill: 0.87, wall: '#f5dcc0', view: { sky: '#a9d0e6', hill: '#5f8f5a', mountain: '#2f4f7c', clouds: [[210, 60, 0.8]] }, words: ['AT NINETY', "I'LL SEE", 'INTO THE', 'HEART OF', 'THINGS.'] },
  { age: 100, skill: 0.95, wall: '#f7d6b6', view: { season: 'autumn', sky: '#f2c79a', hill: '#9a6b44', mountain: '#3b4a70' }, words: ['AT ONE', 'HUNDRED,', 'PERHAPS,', 'SOMETHING', 'MARVELLOUS...'] },
].forEach((o, i) => panel(X0 + i * (ew + G), y, ew, eh, o.wall, overShoulder(o), (w, h) => {
  words(12, 34, o.words, { size: 13.5 });
  ageTag(w - 28, h - 28, o.age);
}));

// ================================================================ F: her eyes
y += eh + G;
const fh = 170;
panel(X0, y, IW, fh, A.SKIN, (w, h) => {
  rect(0, 0, w, h, linear(0, 0, 0, h, [[0, '#f0c7a2'], [1, '#e2a883']]));
  const eye = (cx, s) => {
    for (let i = 0; i < 9; i++) ink([[cx - s * 70 + i * s * 15, 20 + Math.abs(i - 4) * 2], [cx - s * 60 + i * s * 15, 14 + Math.abs(i - 4) * 2]], 5, { color: '#f4f1ea', taper: [0.2, 0.6] });
    ink([[cx - s * 74, 30], [cx, 20], [cx + s * 70, 30]], 1.6, { op: 0.4 });
    const white = [[cx - 62, 92], [cx - 30, 64], [cx + 16, 58], [cx + 58, 80], [cx + 66, 96], [cx + 30, 114], [cx - 20, 116], [cx - 54, 104]];
    cel(white, '#fbf8f2', '#e3d8d0', { w: 3.4, lx: 0, ly: 6 });
    clipPoly(white, () => {
      fill(ell(cx + 4, 86, 32, 32, 20), radial(cx + 4, 86, 32, [[0, '#3a2718'], [0.5, '#6b4a2e'], [1, '#2a1d12']]), { wob: 0 });
      fill(ell(cx + 4, 86, 15, 15, 16), '#111', { wob: 0.1 });
      fill(ell(cx - 6, 74, 13, 9, 12), '#ffffff', { op: 0.9, wob: 0.2 });
      emit('<g opacity="0.8">'); grp(`translate(${cx + 8} 78) scale(0.13)`, () => fuji(160, 100, 0.95, { color: '#f6efe2', snow: 'none', wash: '#f6efe2' })); emit('</g>');
      fill(ell(cx + 22, 104, 4, 3, 8), '#ffffff', { op: 0.6, wob: 0 });
      fill([[cx - 70, 40], [cx + 76, 40], [cx + 76, 80], [cx + 30, 68], [cx - 20, 66], [cx - 70, 88]], A.SKIN_SH, { wob: 0.3 });
    });
    ink([[cx - 62, 92], [cx - 20, 66], [cx + 30, 66], [cx + 70, 86]], 4.2, { taper: [0.15, 0.2] });
    ink([[cx - 58, 82], [cx - 16, 56], [cx + 34, 56], [cx + 72, 76]], 1.6, { taper: [0.2, 0.2], op: 0.8 });
    ink([[cx - 44, 124], [cx, 132], [cx + 40, 124]], 1.6, { op: 0.7 });
    ink([[cx - 34, 138], [cx, 146], [cx + 30, 140]], 1.3, { op: 0.5 });
    [[0, 0], [8, 12], [4, -12]].forEach(([dx, dy]) => ink([[cx + s * (76 + dx), 92 + dy], [cx + s * (102 + dx), 86 + dy * 1.6]], 1.4, { op: 0.7 }));
    ink(ell(cx + 2, 90, 84, 72, 30), 3.4, { closed: true, color: '#6b4a2e', wob: 0.3 });
    ink(arc(cx + 2, 90, 74, 62, -2.4, -1.6, 6), 5, { color: '#ffffff', op: 0.55, taper: [0.3, 0.3] });
  };
  eye(w / 2 - 170, -1); eye(w / 2 + 170, 1);
  ink([[w / 2 - 86, 84], [w / 2 - 30, 70], [w / 2 + 30, 70], [w / 2 + 86, 84]], 3.4, { color: '#6b4a2e' });
  ink([[w / 2 - 14, 112], [w / 2 - 10, 150], [w / 2 - 16, 172]], 2.2, { taper: [0.4, 0.1], op: 0.7 });
});

// ================================================================ the pause
y += fh + 36;
panel(W / 2 - 160, y, 320, 170, '#fbf6e8', (w, h) => {
  grp('translate(26 18)', () => fuji(250, 128, 0.97));
  drawingHand(186, 104, 1.6, 350, 20, { old: true, sleeve: '#2f4f7c', sleeveSh: '#223b60' });
});

// ================================================================ G: one hundred and ten
y += 170 + 36;
const gh = H - y - 90;
panel(X0, y, IW, gh, '#f3c38f', (w, h) => {
  rect(0, 0, w, h, linear(0, 0, 0, h, [[0, '#d9452f'], [0.45, '#f2a25c'], [0.8, '#f8d49a'], [1, '#fbe8c0']]));
  const cx = 590, cy = 300, r = 250;
  burst(cx, cy, r + 20, 900, 64, '#fbdca8', 5);
  clip(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`, () => {
    vista(cx, cy, r, { skyGrad: [[0, '#e35a3c'], [0.55, '#f7ab62'], [1, '#fbe0a8']], sun: [cx + 120, cy + 10, 58], sunColor: '#fff2cf', mountain: P.indigo, hill: '#3f5e4d', mScale: 0.4, mBase: 0.52, mShift: 0.55 });
  });
  emit(`<circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="none" stroke="#a8784a" stroke-width="16"/>`);
  ink(ell(cx, cy, r, r, 44), 3, { closed: true, wob: 0.4 }); ink(ell(cx, cy, r + 16, r + 16, 44), 3.4, { closed: true, wob: 0.4 });

  room(w, h, { wall: 'none', floorY: h - 150, vp: [440, 380], posts: [], beamY: -60, tatami: '#e3d49e' });
  lowDesk(300, h - 110, 200, 40, 70);
  paperOn(314, h - 110, 150, 70, (a, b) => fuji(a, b, 1));
  grp(`translate(380 ${h - 126})`, () => greatWave(0, 0, 215));
  for (let i = 0; i < 16; i++) {
    const t = i / 15, bx = 400 + t * 260 + R(20), by = h - 420 - Math.sin(t * Math.PI) * 90 + R(20), s = 0.5 + rng() * 0.5;
    grp(`translate(${bx} ${by}) scale(${s}) rotate(${-20 + R(20)})`, () => {
      const v = [[-16, 2], [-7, -7], [0, 0], [7, -8], [16, 0]];
      ink(v, 6.4, { taper: [0.3, 0.3], wob: 0.2 }); ink(v, 3.2, { color: '#fbf6e8', taper: [0.35, 0.35], wob: 0 });
    });
  }
  [[560, 190, 0.6, -18, 0.05], [700, 120, 0.5, -12, 0.4], [480, 260, 0.52, -26, 0.25], [820, 200, 0.4, -8, 0.1], [640, 40, 0.38, -14, 0.3], [800, 80, 0.32, -10, 0.55]].forEach(([a, b, s, rot, f]) => grp(`translate(${a} ${b}) rotate(${rot}) scale(${s})`, () => crane({ flap: f })));
  [[120, 230, 0.8, -30], [300, 300, 0.7, -60], [60, 360, 0.7, -10]].forEach(([a, b, s, rr]) => grp(`translate(${a} ${b}) rotate(${rr}) scale(${s})`, () => fish()));
  for (let i = 0; i < 30; i++) { const a = -Math.PI * (0.15 + rng() * 0.7), d = 140 + rng() * 380; fill(ell(400 + Math.cos(a) * d, h - 120 + Math.sin(a) * d, 2.5 + rng() * 3, 2.5 + rng() * 3, 7), INK, { wob: 0.5 }); }
  catCel(700, h - 70, 0.9);
  inkstone(470, h - 118, 0.7);
  grp(`translate(150 ${h - 34}) scale(0.9)`, () => A.kneeler({ age: 110, mood: 'joy', hand: 'up', lean: -16 }));
}, (w, h) => {
  caption(18, 18, ['...AND AT A HUNDRED AND TEN,', 'EVERY DOT AND EVERY LINE', 'WILL BE ALIVE.'], { size: 19, attrib: '– KATSUSHIKA HOKUSAI' });
  ageTag(w - 34, h - 34, 110);
});

// ---- footer
text(X0, H - 58, "Adapted from Hokusai's afterword to One Hundred Views of Mount Fuji (1834), condensed in my own words.", { size: 11, color: '#8b8497', ls: 0.6, anchor: 'start' });
text(X0, H - 40, 'A homage to Zen Pencils by Gavin Aung Than. Every line on this page was drawn with code.', { size: 11, color: '#8b8497', ls: 0.6, anchor: 'start' });
text(W - X0, H - 40, 'ART BY CLAUDE', { font: 'Title', size: 16, color: P.verm, anchor: 'end', ls: 2 });

const body = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out', 'archive'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'out', 'archive', 'every-line-alive.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${require('../lib/fonts')()}${body}</svg>`);
console.log('wrote out/every-line-alive.svg');
