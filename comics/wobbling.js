// WOBBLING WILL — Frances E. Willard, A Wheel Within a Wheel (1895). A Zen-Pencils-style strip.
// node comics/wobbling.js -> out/wobbling-will.svg
//
// Colour script: cold blue-grey mornings of falling (Peg's mustard cardigan is the only warm thing in
// them) -> violet dusk on the bench -> grey close-up on the wheel -> the turn: the world takes her
// colour, warm orange, when she lifts her head to the bridge.
// Repetition: the same park framing three times (DAY 4 / 11 / 19), the same fall in the same spot,
// one change each: the puddle, the kids, the bandages.
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, line, shape, cel, shade } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const BK = require('../zp/bike');
const { hand } = require('../zp/hand');

I.seed(1895);
SC.setSeed(53);
const W = 980;
let H = 0;
const mix = F.mix;
const D = Math.PI / 180;
const BIKE = '#2f7a8a';
const TITLE_TEAL = '#2f6f82';

// ---- cast -----------------------------------------------------------------------------------------
const peg = {
  H: 3.5, build: 1.12,
  head: { face: 'peg', skin: '#f0c9a8', hair: '#b9b4ac', hairLine: '#8a857e', hairStyle: 'bun', R: 27, tall: 1.1, jawW: 0.7, eyeW: 0.22, eyeH: 0.26, jaw: 0.95, lashes: 1, age: 0.55, glasses: '#b8342e', blush: 1 },
  top: { color: '#dea033', sleeve: 'long', type: 'cardigan' }, bottom: { type: 'skirt', color: '#4f6584', socks: '#e8d8c0' }, shoes: '#6a3a2a',
};
const kid = (hair, top, st, face, legs = '#3d4458') => ({ H: 2.7, head: { face, skin: '#f4cfae', hair, hairStyle: st, R: 22, blush: 1 }, top: { color: top, sleeve: 'short' }, bottom: { type: 'shorts', color: legs }, shoes: '#2a2224' });
const BOY = kid('#2a1f24', '#d9544a', 'short', 'boy');
const GIRL = kid('#c9642a', '#3f68b0', 'pigtails', 'girl', '#6a4a7a');
const tint = (ch, t) => { if (!t) return ch; const c = F.tinted(ch, t[0], t[1]); return { ...c, head: { ...c.head, glasses: ch.head.glasses } }; };

// ---- palettes (the colour script) -----------------------------------------------------------------
const COLD = {
  sky: '#b9c8d3', skyLow: '#e2e6e4', far: '#a9b8b8', farTree: '#8ea3a2', tree: '#5f7f78', grass: '#9cb09c', grassSh: '#86998a',
  bank: '#8fa593', river: '#98b4c4', path: '#d9d5c6', pathEdge: '#b9b3a2', hedge: '#4f6e62', bridge: '#b7aa92', bench: '#7d6452', cloud: '#eef1f2',
  tint: ['#7d93b3', 0.16],
};
const DUSK = {
  sky: '#5b6386', skyLow: '#b8a0ac', far: '#6d7090', farTree: '#4e5372', tree: '#3a3f5c', grass: '#666d80', grassSh: '#565c70',
  river: '#8c8aa6', path: '#9a97a6', hedge: '#3a3f58', bridge: '#50526c', bench: '#4a3d44', tint: ['#5b6386', 0.24],
};
const WARM = {
  sky: '#f39a52', skyLow: '#ffdf9c', far: '#f0b27a', farTree: '#d99a5e', tree: '#8f8a38', grass: '#c7b75a', grassSh: '#ad9c46',
  bank: '#b8a54e', river: '#ffcf80', path: '#fbe6b4', pathEdge: '#e0c07c', hedge: '#6f7a30', bridge: '#b86a3a', bench: '#8a4f32', cloud: '#fff1cf',
  tint: ['#ff9a4a', 0.12],
};

// ---- local helpers ---------------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
// a flat band of path/ground between two polylines, edges inked
function band(top, bot, color, o = {}) {
  const poly = top.concat(bot.slice().reverse());
  I.fill(poly, color, { wob: 0.3 });
  if (o.edge !== false) { line(top, o.w ?? 1.9, { taper: [0, 0], color: o.edgeColor }); line(bot, o.w ?? 1.9, { taper: [0, 0], color: o.edgeColor }); }
  return poly;
}
function curve(p0, p1, p2, n = 12) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([lerp(lerp(p0[0], p1[0], t), lerp(p1[0], p2[0], t), t), lerp(lerp(p0[1], p1[1], t), lerp(p1[1], p2[1], t), t)]); } return out; }
// wobbly hand-lettered sound effect: every letter bobs and tilts on its own
function wobbleWord(x, y, str, o = {}) {
  const size = o.size || 36; let tx = x;
  str.split('').forEach((ch, i) => {
    PG.sfx(tx, y + Math.sin(i * 1.9 + (o.ph || 0)) * size * 0.14, ch, { size, color: o.color || '#ffffff', anchor: 'start', rot: Math.sin(i * 2.3 + (o.ph || 0)) * 9 + (o.rot || 0), ls: 0, sw: o.sw });
    tx += PG.textW(ch, size, 'Title', 0) + size * 0.14;
  });
}
// motion arcs: short parallel curved strokes (wobble marks) on one side of a point
function arcs(cx, cy, r, a0, a1, n = 3, gap = 7, w = 2) {
  for (let k = 0; k < n; k++) { const rr = r + k * gap; const pts = []; for (let a = a0; a <= a1 + 0.01; a += (a1 - a0) / 6) pts.push([cx + Math.cos(a * D) * rr, cy + Math.sin(a * D) * rr]); line(pts, w * (1 - k * 0.18), { taper: [0.3, 0.3] }); }
}
// a kid's kick scooter seen from the side; returns the bar grip and deck points
function scooter(x, y, s, dir, color) {
  const L = 62 * s, wr = 7 * s;
  const back = [x - dir * L * 0.5, y - wr], front = [x + dir * L * 0.5, y - wr];
  const bar = [front[0] - dir * 10 * s, y - 104 * s];
  line([front, bar], 5 * s + 3.2, { taper: [0, 0] }); line([front, bar], 5 * s, { color: '#b9bec2', taper: [0, 0] });
  line([[bar[0] - 11 * s, bar[1]], [bar[0] + 11 * s, bar[1]]], 5 * s + 3, { taper: [0, 0] }); line([[bar[0] - 11 * s, bar[1]], [bar[0] + 11 * s, bar[1]]], 5 * s, { color: '#2c282b', taper: [0, 0] });
  cel([[back[0] - dir * 4 * s, y - wr - 5 * s], [front[0] - dir * 6 * s, y - wr - 5 * s], [front[0], y - wr + 1], [back[0], y - wr + 1]], color, { w: 2, lin: true, k: 0.3 });
  [back, front].forEach((c) => { shape(I.ell(c[0], c[1], wr, wr, 12), '#2c282b', { w: 2 }); I.fill(I.ell(c[0], c[1], wr * 0.4, wr * 0.4, 8), '#b9bec2', { wob: 0 }); });
  return { bar, deck: [x, y - wr - 5 * s] };
}
// a kid riding a scooter (one foot on the deck, one pushing or both on); o.arm: 'bars' | 'point' | 'up'
function scooterKid(ch, x, y, s, dir, color, o = {}) {
  const sc = scooter(x, y, s, dir, color);
  const u = 2.25 * ch.head.R * s;
  const base = { x: x - dir * u * 0.05, y: sc.deck[1], s, yaw: 58 * dir, legN: [4, 8], legF: [-24, 30], lean: 6, reachN: sc.bar, reachF: [sc.bar[0] + dir * 3, sc.bar[1] + 2], bendN: 1, bendF: 1, handN: 'grip', handF: 'grip', shadow: false, head: { mood: 'joy', ...(o.head || {}) } };
  if (o.arm === 'point') Object.assign(base, { reachN: null, armN: [98, 6, 6], handN: 'point', handAngN: dir > 0 ? -8 : 188 });
  if (o.arm === 'up') Object.assign(base, { reachN: null, reachF: null, armN: [168, 14, 16], armF: [158, 22, 18], handN: 'open', handF: 'open', legF: [0, 4], lean: -4, curve: -8 });
  if (o.arm === 'fist') Object.assign(base, { reachN: null, armN: [170, 30, 18], handN: 'fist' });
  if (o.arm === 'belly') Object.assign(base, { reachN: 'hipN', handN: 'flat', lean: -8, curve: -10, head: { mood: 'joy', mouth: 'laugh', pitch: 10, ...(o.head || {}) } });
  const r = F.fig(tint(ch, o.tint), { ...base, ...(o.pose || {}) });
  return r;
}
// the duck: swimming (SC.duck), or airborne with wings up
function duckFly(x, y, s, dir = 1, o = {}) {
  const T = ([u, v]) => [x + u * s * dir, y + v * s];
  const wingB = [[-2, -4], [-16, -30], [-30, -42], [-12, -20], [-6, -10]].map(T);
  cel(wingB, '#dfe2e2', { w: 2, k: 0.3 });
  cel([[-20, 0], [-10, -9], [8, -9], [18, -3], [14, 5], [-6, 8], [-24, 4], [-30, -2]].map(T), '#ffffff', { w: 2.3, k: 0.5 });
  cel([[16, -6], [24, -18], [30, -20], [34, -14], [26, -4]].map(T), '#ffffff', { w: 2, k: 0.3 });
  cel(I.ell(...T([31, -21]), 7 * s, 6.5 * s, 12), '#3f7a4a', { w: 2, k: 0.3 });
  shape([T([36, -22]), T([47, -19]), T([45, -16]), T([36, -17])], '#f2a23a', { w: 1.6 });
  I.fill(I.ell(...T([33, -23]), 1.4 * s, 1.4 * s, 6), INK, { wob: 0 });
  line([T([24, -9]), T([26, -5])], 1.2, { color: '#ffffff' });
  const wingF = [[0, -6], [8, -36], [4, -58], [-6, -30], [-8, -8]].map(T);
  cel(wingF, '#ffffff', { w: 2.3, k: 0.4 });
  line([T([4, -30]), T([2, -44])], 1.2, { color: '#c9cfcf' }); line([T([0, -24]), T([-2, -36])], 1.2, { color: '#c9cfcf' });
  shape([T([-10, 6]), T([-18, 14]), T([-12, 13]), T([-8, 16])], '#f2a23a', { w: 1.4 });
  if (o.drops) for (let k = 0; k < 5; k++) I.drop(...T([-26 + k * 9, 26 + (k % 2) * 12 + k * 3]), 0.28 * s, 0, o.drops);
}
// a price tag on a string
function priceTag(p, s = 1, rot = 14) {
  line([p, [p[0] + 6 * s, p[1] + 16 * s]], 1.3, { taper: [0, 0] });
  I.grp(`translate(${I.n1(p[0] + 6 * s)} ${I.n1(p[1] + 16 * s)}) rotate(${rot})`, () => {
    const q = [[-2, 0], [2, 0], [18, 6], [18, 24], [-18, 24], [-18, 6]].map(([a, b]) => [a * s, b * s]);
    cel(q, '#fff8e8', { w: 1.8, lin: true, k: 0.2 });
    I.fill(I.ell(0, 5 * s, 1.8 * s, 1.8 * s, 6), INK, { wob: 0 });
    I.text(0, 20 * s, '£15', { font: 'Letter', size: 11 * s, anchor: 'middle', color: '#b8342e' });
  });
}
// plaster (sticking plaster) cross
function plaster(x, y, s = 1, a = 30) {
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) rotate(${a})`, () => {
    [0, 90].forEach((b) => I.grp(`rotate(${b})`, () => { shape(I.rectPts(-7 * s, -2.4 * s, 14 * s, 4.8 * s), '#f2d6b8', { w: 1.3, lin: true }); I.fill(I.rectPts(-2.4 * s, -2 * s, 4.8 * s, 4 * s), '#e6c29e', { wob: 0 }); }));
  });
}
function kneeBandage(k, a, s = 1) {
  I.grp(`translate(${I.n1(k[0])} ${I.n1(k[1])}) rotate(${a})`, () => {
    shape(I.rectPts(-9 * s, -7 * s, 18 * s, 14 * s), '#ffffff', { w: 1.6, lin: true });
    [-3, 2].forEach((d) => line([[-9 * s, d * s], [9 * s, (d + 1.5) * s]], 1, { color: '#b9bec2', taper: [0, 0] }));
  });
}
function sweat(x, y, s = 1) { I.drop(x, y, s, 0, '#dff2fb'); }
// embarrassment hatching on a cheek
function flush(x, y, s = 1) { for (let k = 0; k < 3; k++) line([[x + k * 4 * s, y + 3 * s], [x + k * 4 * s + 3 * s, y - 3 * s]], 1.3, { color: '#d0564a', taper: [0.2, 0.2] }); }
// dashed ground shadow under a bike
function bikeShadow(x, y, len) { line([[x - len * 0.5, y + 1], [x + len * 0.2, y + 1.5]], 3, { taper: [0.25, 0.25], color: '#000', op: 0.35 }); line([[x + len * 0.26, y + 1], [x + len * 0.5, y + 1]], 3, { taper: [0.25, 0.25], color: '#000', op: 0.35 }); }
// a bike lying on its side, flattened onto the ground
function bikeFlat(x, y, s, o = {}) {
  I.emit(`<g transform="translate(${I.n1(x)} ${I.n1(y)}) rotate(${o.rot || -3}) scale(1 ${o.sq || 0.34}) translate(${I.n1(-x)} ${I.n1(-y)})">`);
  const b = BK.bike(x, y, s, { dir: o.dir ?? -1, color: o.color || BIKE, basket: true, crank: 140, spin: 0.4 });
  I.emit('</g>');
  return b;
}
// the tyre track: a wavering line on the path behind a wobbling bike
function track(pts, amp, n, color = '#8f8a7c') {
  const out = I.sample(pts, false, 4).map(([x, y], i, a) => [x, y + Math.sin((i / a.length) * n * Math.PI * 2) * amp]);
  line(out, 1.6, { color, taper: [0.6, 0.05] });
}

// a clipped box hedge seen a little from above: a lit top face (yT..yF) and a front face (yF..yB) with a
// bumpy outline, leaf marks and a cel shadow at the foot. o.hole: a dark ragged hole in the top face.
function boxHedge(x0, x1, yT, yF, yB, color, o = {}) {
  I.seed(4000 + (o.seed || 0));
  const top = [], front = [];
  for (let x = x0; x <= x1; x += 12) top.push([x, yT + (I.rng() - 0.5) * 6 - 3 * Math.sin(x * 0.07)]);
  for (let x = x1; x >= x0; x -= 14) front.push([x, yF + (I.rng() - 0.5) * 5]);
  const lit = mix(color, '#dfe9d0', 0.22), dark = shade(color, 0.3);
  if (!o.frontOnly) {
    I.fill(top.concat(front), lit, { wob: 0.3 });
    // scallops on the top face
    for (let k = 0; k < (x1 - x0) / 16; k++) { const x = x0 + I.rng() * (x1 - x0), y = lerp(yT + 4, yF - 4, I.rng()); if (o.hole && Math.hypot((x - o.hole[0]) / 1.4, y - o.hole[1]) < 44) continue; line([[x - 5, y], [x, y + 3], [x + 5, y]], 1.2, { color: shade(lit, 0.25), taper: [0.3, 0.3] }); }
    line(top, 2.4, { taper: [0, 0] });
    if (o.hole) { const [hx, hy] = o.hole; const hp = []; for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; const rr = 1 + (k % 2 ? 0.18 : -0.05); hp.push([hx + Math.cos(a) * 48 * rr, hy + Math.sin(a) * 13 * rr]); } I.fill(hp, '#101412', { wob: 0.5 }); }
    return;
  }
  // front face (drawn over whatever went into the hedge)
  const fr = front.slice().reverse();
  const poly = fr.concat([[x1, yB], [x0, yB]]);
  I.fill(poly, color, { wob: 0.3 });
  I.clipPoly(poly, () => {
    I.fill([[x0, yB - (yB - yF) * 0.28], [x1, yB - (yB - yF) * 0.34], [x1, yB], [x0, yB]], dark, { wob: 0.4 });
    for (let k = 0; k < (x1 - x0) / 40; k++) { const x = x0 + I.rng() * (x1 - x0), y = yF + 20 + I.rng() * (yB - yF - 30); const bl = []; for (let j = 0; j <= 10; j++) { const a = (j / 10) * Math.PI * 2; bl.push([x + Math.cos(a) * (22 + (j % 2) * 6), y + Math.sin(a) * (12 + (j % 2) * 4)]); } I.fill(bl, shade(color, 0.12), { wob: 1 }); }
    for (let k = 0; k < (x1 - x0) * (yB - yF) / 700; k++) { const x = x0 + I.rng() * (x1 - x0), y = yF + 8 + I.rng() * (yB - yF - 8); I.ink(I.arc(x - 4, y, 4, 3.5, Math.PI * 1.05, Math.PI * 1.95, 5).concat(I.arc(x + 4, y, 4, 3.5, Math.PI * 1.05, Math.PI * 1.95, 5)), 1.2, { color: shade(color, 0.34), wob: 0.2 }); }
    for (let k = 0; k < (x1 - x0) / 30; k++) { const x = x0 + I.rng() * (x1 - x0), y = yF + 4 + I.rng() * 18; line([[x - 5, y + 2], [x, y - 2], [x + 5, y + 2]], 1.2, { color: lit, taper: [0.3, 0.3] }); }
  });
  line(fr, 2.2, { taper: [0, 0] });
}

// hand-drawn sunburst: rays of irregular width and length with wobbly edges (not a mechanical fan)
function sunRays(cx, cy, r0, r1, n, color, seed = 1) {
  let q = seed * 9301 + 49297; const rnd = () => ((q = (q * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.08, sp = 0.018 + rnd() * 0.04, L = r1 * (0.55 + rnd() * 0.45);
    const pts = [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a - sp) * L, cy + Math.sin(a - sp) * L], [cx + Math.cos(a) * L * 1.02, cy + Math.sin(a) * L * 1.02], [cx + Math.cos(a + sp * (0.7 + rnd() * 0.6)) * L * 0.97, cy + Math.sin(a + sp * (0.7 + rnd() * 0.6)) * L * 0.97]];
    I.fill(pts, color, { wob: 1.6 });
  }
}

// ---- hand lettering --------------------------------------------------------------------------------
// ZP captions are hand-lettered caps: Patrick Hand (Journal) upper case, each line on its own slightly
// tilted baseline, emphasis words bigger and heavier, in a box inked with a hand wobble (or straight on the
// panel colour). lines: array of strings; words wrapped in *stars* are emphasised.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function hcap(x, y, lines, o = {}) {
  const size = o.size || 18, big = size * (o.emphK || 1.32), ls = 0.6, lh = size * 1.12;
  const segs = lines.map((l) => l.split(/(\*[^*]+\*)/).filter(Boolean).map((t) => (t[0] === '*' ? { t: t.slice(1, -1).toUpperCase(), s: big, e: true } : { t: t.toUpperCase(), s: size })));
  const lw = segs.map((ss) => ss.reduce((a, g) => a + PG.textW(g.t, g.s, 'Journal', ls), 0));
  const lhs = segs.map((ss) => Math.max(...ss.map((g) => g.s)) * 1.02);
  const pad = o.plain ? 0 : o.pad ?? 12;
  const bw = Math.max(...lw) + pad * 2, bh = lhs.reduce((a, b) => a + b, 0) + (lines.length - 1) * (lh - size) * 0.5 + pad * 2 - size * 0.18;
  const X = o.anchor === 'end' ? x - bw : o.anchor === 'middle' ? x - bw / 2 : x;
  if (!o.plain) {
    const c = [[X - 1, y + 1], [X + bw * 0.5, y - 1.2], [X + bw + 1, y], [X + bw - 0.5, y + bh * 0.55], [X + bw + 1.2, y + bh + 1], [X + bw * 0.45, y + bh + 0.6], [X - 0.8, y + bh], [X + 0.6, y + bh * 0.4]];
    I.fill(c, o.fill || '#fffdf6', { wob: 0.3, lin: true });
    I.ink(c, 2.1, { closed: true, lin: true, wob: 0.6, vary: 0.25 });
  }
  let yy = y + pad;
  segs.forEach((ss, i) => {
    yy += lhs[i];
    const rot = (o.tilt ?? 0) + Math.sin(i * 2.1 + x * 0.01) * 0.7;
    const cx = o.align === 'start' || o.plain ? X + pad : X + bw / 2 - lw[i] / 2;
    let tx = cx;
    const parts = ss.map((g) => { const r = `<tspan x="${I.n1(tx)}" font-size="${I.n1(g.s)}"${g.e ? ` stroke="${o.color || INK}" stroke-width="0.7"` : ''}>${esc(g.t)}</tspan>`; tx += PG.textW(g.t, g.s, 'Journal', ls); return r; }).join('');
    I.emit(`<text y="${I.n1(yy - lhs[i] * 0.2)}" font-family="Journal" letter-spacing="${ls}" fill="${o.color || INK}" transform="rotate(${I.n1(rot)} ${I.n1(cx)} ${I.n1(yy)})">${parts}</text>`);
    yy += (lh - size) * 0.5;
  });
  return { w: bw, h: bh, x: X };
}
// a footbridge in perspective over the river: near end on the near bank (xN, yN), far end on the far bank
// (xF, yF); an arched deck with railings, stone abutments on both banks, the arch opening in shadow.
function footbridge(xN, yN, xF, yF, rise, col, o = {}) {
  const N = 18, thN = o.th ?? rise * 0.28, thF = thN * 0.6, rN = o.rail ?? rise * 0.75, rF = rN * 0.6;
  const P = (t) => [lerp(xN, xF, t), lerp(yN, yF, t) - Math.sin(Math.PI * t) * rise];
  const top = [], bot = [], rail = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = P(t), th = lerp(thN, thF, t); top.push(p); bot.push([p[0], p[1] + th]); rail.push([p[0], p[1] - lerp(rN, rF, t)]); }
  // arch underside: deep at the abutments, shallow at the crown
  const und = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = bot[i]; const base = lerp(yN, yF, t) + lerp(thN, thF, t) * 1.2; const u = Math.min(1, Math.abs(t - 0.5) / 0.38); und.push([p[0], lerp(p[1] + 2, base + 2, Math.pow(u, 3))]); }
  const water = [[xN, yN + thN * 1.3], [xF, yF + thF * 1.3]];
  // shadow under the arch on the water
  I.fill(und.concat([water[1], water[0]]), shade(o.water || '#8aa0ae', 0.45), { wob: 0.2 });
  const dark = shade(col, 0.22);
  cel(top.concat(und.slice().reverse()), col, { w: 1.9, k: 0.5, shade: 0.2 });
  line(bot.slice(3, N - 2), 1.1, { color: dark, taper: [0.2, 0.2] });
  // abutments: stone blocks on each bank
  [[xN, yN, thN * 1.5], [xF, yF, thF * 1.5]].forEach(([x, y, a], i) => {
    const d = i ? -1 : 1;
    const q = [[x - d * a * 0.9, y - a * 0.2], [x + d * a * 0.8, y - a * 0.1], [x + d * a * 1.0, y + a * 1.1], [x - d * a * 1.1, y + a * 1.1]];
    cel(q, o.stone || '#b9b2a4', { w: 1.8, lin: true, k: 0.3 });
    line([[x - d * a * 0.95, y + a * 0.45], [x + d * a * 0.9, y + a * 0.5]], 1, { color: '#7a7466', taper: [0, 0] });
  });
  // railing: posts and a top rail
  for (let i = 0; i <= N; i += 2) line([top[i], rail[i]], lerp(2.2, 1.3, i / N), { taper: [0, 0], color: o.railC || INK });
  line(rail, 2, { taper: [0.05, 0.05], color: o.railC || INK });
  line(rail.map(([x, y], i) => [x, y + lerp(rN, rF, i / N) * 0.5]), 1.1, { taper: [0.05, 0.05], color: o.railC || INK });
  return { top };
}

// the engine basket sits ahead of the swept-back bars; real baskets hang on struts to the front axle and a
// bracket on the head tube, so draw those to anchor it
function struts(b) {
  if (!b || !b.front || !b.headTop) return b;
  const G = [-0.4, 1.05], v = [b.headTop[0] - b.front[0], b.headTop[1] - b.front[1]];
  const d = b.dir || 1, R = b.Rw;
  const a = Math.atan2(v[1], v[0]) - Math.atan2(-G[1], G[0] * d);
  const rot = ([x, yy]) => [b.front[0] + (x * Math.cos(a) - yy * Math.sin(a)), b.front[1] + (x * Math.sin(a) + yy * Math.cos(a))];
  const p1 = rot([d * -0.28 * R, -1.2 * R]), p2 = rot([d * 0.26 * R, -1.2 * R]), hb = rot([d * -0.34 * R, -1.02 * R]);
  const pw = Math.max(1.1, R * 0.03);
  [p1, p2].forEach((q) => { line([q, b.front], pw + 1.6, { taper: [0, 0], wob: 0 }); line([q, b.front], pw, { color: '#b9bec2', taper: [0, 0], wob: 0 }); });
  line([b.headTop, hb], pw * 1.8 + 1.6, { taper: [0, 0], wob: 0 }); line([b.headTop, hb], pw * 1.8, { color: '#9aa1a6', taper: [0, 0], wob: 0 });
  return b;
}
const ride = (ch, o) => { const r = F.POSES.bike.ride(ch, o); if (o.basket) struts(r.bike); return r; };
const wheelB = (ch, o) => { const r = F.POSES.bike.wheel(ch, o); if (o.basket) struts(r.bike); return r; };

// ---- the park, one designed set (river, footbridge, hedges, trees in depth) -----------------------
// Used as the fixed framing for the three mornings. Returns the ground points the actors use.
function park(w, h, P, o = {}) {
  SC.sky(w, h, P.sky, P.skyLow, { mid: 0.62 });
  if (o.clouds !== false) { SC.cloud(w * 0.22, h * 0.14, 8, P.cloud, { kind: 'stratus', w: 1.6 }); SC.cloud(w * 0.8, h * 0.13, 11, P.cloud, { kind: 'stratus', w: 1.6 }); }
  // far bank: hazy hills, a treeline and a church spire of poplars
  const far = SC.hills(w, h * 0.42, 6, P.far, { n: 1.5, depth: 0.8, w: 1.2 });
  SC.treeline(far, { h: h * 0.07, leaf: P.farTree, depth: 0.75 });
  // the footbridge over the river, far right, with its path climbing to it
  const ry = h * 0.5;
  SC.hills(w, h * 0.47, 3, P.bank, { n: 1, depth: 0.5, w: 1.3 });
  SC.river(w, ry, h * 0.09, P.river, { rise: h * 0.02 });
  if (o.bridge !== false) { const b = o.bridge || [0.6, 0.93]; footbridge(w * b[0], ry + h * 0.085 - (b[0] * h * 0.02), w * b[1], ry - b[1] * h * 0.02 + 1, h * 0.07, P.bridge, { water: P.river, stone: mix(P.bridge, '#9aa0a0', 0.4) }); }
  // middle-ground trees on the near bank (behind the path)
  SC.tree(w * 0.43, h * 0.6, h * 0.3, { kind: 'round', leaf: mix(P.tree, P.far, 0.35), depth: 0.5, seed: 3 });
  SC.tree(w * 0.54, h * 0.6, h * 0.22, { kind: 'poplar', leaf: mix(P.tree, P.far, 0.45), depth: 0.6, seed: 4 });
  // near grass
  I.fill([[-10, h * 0.6], [w + 10, h * 0.57], [w + 10, h + 10], [-10, h + 10]], P.grass, { wob: 0.3 });
  line([[-10, h * 0.6], [w * 0.5, h * 0.585], [w + 10, h * 0.57]], 1.5, { taper: [0, 0] });
  // the bench, near bank, right of centre, and the hedge running behind it
  SC.hedge(w * 0.62, w + 20, h * 0.66, h * 0.1, { leaf: P.hedge, seed: 7 });
  if (o.bench !== false) SC.bench(w * 0.7, h * 0.7, w * 0.16, { color: P.bench });
  // the path: sweeps in from bottom left, bends away to the bridge
  const top = curve([-10, h * 0.78], [w * 0.5, h * 0.66], [w + 10, h * 0.71]);
  const bot = curve([-10, h * 0.96], [w * 0.52, h * 0.8], [w + 10, h * 0.84]);
  band(top, bot, P.path, { w: 1.6 });
  SC.grass({ x: 0, y: h * 0.86, w, h: h * 0.14 }, { n: 6, color: P.grassSh, seed: 2 });
  // foreground framing: an oak at the left edge, cut by the frame, its shadow pocket a spot black
  if (o.oak !== false) SC.tree(w * 0.02, h * 1.02, h * 0.95, { kind: 'oak', leaf: P.tree, depth: 0, seed: 11 });
  // the duck on the river (the running witness)
  if (o.duck !== false) SC.duck(o.duckX ?? w * 0.36, ry + h * 0.055, o.duckS ?? 0.7);
  return { ground: (x) => lerp(h * 0.87, h * 0.76, x / w) };
}

// ---- the page --------------------------------------------------------------------------------------
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}

// panels: a slightly lighter inked border than the default (the page's many small panels made borders dominate
// the ink-width statistic)
const panel = (r, bg, art, post, o = {}) => PG.panel(r, bg, art, post, { border: 2.3, ...o });

function page() {
  // ---------------------------------------------------------------- title
  // ZP title block: big outlined block letters (they wobble, letter by letter), the author's name reversed out
  // of a black brush banner, credits hand-lettered underneath
  { let tx = 58; 'WOBBLING'.split('').forEach((ch, i) => { PG.sfx(tx, 112 + Math.sin(i * 1.3) * 7, ch, { size: 88, color: TITLE_TEAL, anchor: 'start', rot: Math.sin(i * 1.7) * 7, sw: 2.6, ls: 0 }); tx += PG.textW(ch, 88, 'Title', 0) + 2; }); }
  PG.sfx(418, 120, 'WILL', { size: 104, color: '#e0a53a', anchor: 'start', rot: -3, sw: 2.8, ls: 2 });
  // brush banner
  { const bx0 = 54, bx1 = 470, by = 152; const top = [], bot = []; for (let i = 0; i <= 14; i++) { const t = i / 14; top.push([lerp(bx0, bx1, t), by - 15 + Math.sin(t * 9) * 1.4 - (t < 0.05 ? (0.05 - t) * 60 : 0)]); bot.push([lerp(bx0 + 6, bx1 + 10, t), by + 15 + Math.sin(t * 7 + 1) * 1.6]); }
    I.fill(top.concat(bot.reverse(), [[bx0 - 4, by + 2]]), INK, { wob: 0.8 });
    [[bx1 + 4, by - 6, 16], [bx1 + 14, by + 4, 10]].forEach(([x, yy, L]) => line([[x - L, yy], [x, yy + 1]], 3, { taper: [0.1, 0.9] }));
    hcap(bx0 + 22, by - 17, ['WORDS BY *FRANCES E. WILLARD*'], { plain: true, size: 19, emphK: 1.2, color: '#ffffff' }); }
  hcap(58, 170, ['ART BY CLAUDE'], { plain: true, size: 15, color: '#6b6474' });
  // a riderless bicycle wobbling beside the title (kept clear of the page edge)
  // seen in 3/4 from the front (foreshortened and skewed), not the side elevation used on the page
  I.grp('translate(790 176) skewY(-9) scale(0.74 1) translate(-790 -176)', () => struts(BK.bike(790, 176, 0.62, { color: BIKE, basket: true, tilt: -6, crank: 40 })));
  arcs(884, 134, 30, -60, 40, 3, 6, 1.8); arcs(694, 144, 26, 140, 230, 3, 6, 1.8);
  line([[690, 180], [760, 177], [830, 179], [900, 176]], 2.6, { taper: [0.3, 0.3] });
  let y = 230;
  const G = PG.GUT_V;
  let r;

  // ---------------------------------------------------------------- 1 — the shed
  r = PG.row(y, 340, [1]);
  panel(r[0], null, (w, h) => {
    const gy = h * 0.93;
    SC.sky(w, h, '#c6d2da', '#eceeea', { mid: 0.7 });
    SC.cloud(w * 0.62, h * 0.12, 10, '#f3f5f5', { kind: 'stratus' });
    // next door's roofs and a tree over the fence
    SC.tree(w * 0.8, h * 0.5, h * 0.5, { kind: 'round', leaf: '#8ea3a0', depth: 0.6, seed: 21 });
    shape([[w * 0.46, h * 0.36], [w * 0.52, h * 0.18], [w * 0.66, h * 0.18], [w * 0.72, h * 0.36]], '#a58d86', { w: 1.6, lin: true });
    shape(I.rectPts(w * 0.62, h * 0.08, 16, h * 0.12), '#a58d86', { w: 1.6, lin: true });
    // the board fence round the garden
    SC.fence(w * 0.3, w + 10, h * 0.66, h * 0.36, { style: 'board', color: '#c2b294' });
    // lawn and a paving path from the shed door to the gate
    I.fill([[-10, h * 0.64], [w + 10, h * 0.64], [w + 10, h + 10], [-10, h + 10]], '#9cb09c', { wob: 0.3 });
    line([[-10, h * 0.66], [w + 10, h * 0.66]], 1.6, { taper: [0, 0] });
    I.fill([[w * 0.2, h * 0.8], [w + 10, h * 0.8], [w + 10, h + 10], [w * 0.14, h + 10]], '#d6d0c0', { wob: 0.2, lin: true });
    line([[w * 0.2, h * 0.8], [w + 10, h * 0.8]], 1.6, { taper: [0, 0] }); line([[w * 0.2, h * 0.8], [w * 0.14, h + 10]], 1.6, { taper: [0, 0] });
    for (let k = 1; k < 7; k++) line([[w * 0.2 + k * 110, h * 0.8], [w * 0.16 + k * 118, h + 4]], 1.2, { color: '#aaa393', taper: [0, 0] });
    line([[w * 0.18, h * 0.9], [w + 10, h * 0.9]], 1.2, { color: '#aaa393', taper: [0, 0] });
    SC.bush(w * 0.72, h * 0.7, w * 0.12, h * 0.12, { leaf: '#6f8c7a', seed: 61 });
    SC.flowerBed({ x: w * 0.36, y: h * 0.64, w: w * 0.3, h: h * 0.1 }, { colors: ['#d9d0e0', '#c98a9a', '#e8d9a0'], kinds: ['daisy', 'tulip', 'dot'], patches: 4, s: 0.8, seed: 62 });
    // a robin on the fence, watching
    { const rx = w * 0.68, ry = h * 0.3 - 2; cel([[rx - 9, ry], [rx - 6, ry - 9], [rx + 4, ry - 11], [rx + 9, ry - 6], [rx + 6, ry], [rx - 2, ry + 2]], '#6a5a4c', { w: 1.6, k: 0.2 }); I.fill([[rx + 1, ry - 7], [rx + 8, ry - 6], [rx + 5, ry - 1], [rx, ry - 1]], '#d8703a', { wob: 0 }); line([[rx + 9, ry - 8], [rx + 13, ry - 8]], 1.4); I.fill(I.ell(rx + 5, ry - 9, 0.9, 0.9, 5), INK, { wob: 0 }); line([[rx - 9, ry - 2], [rx - 15, ry + 1]], 2); }
    // the shed: stained boards, a pitched felt roof, the door flung open on a dark inside
    const sx0 = w * 0.02, sx1 = w * 0.3, eave = h * 0.18;
    cel([[sx0, gy - 8], [sx0, eave + 18], [sx1, eave + 18], [sx1, gy - 8]], '#6f8481', { lin: true, w: 2.4, k: 1.2, shade: 0.18 });
    for (let x = sx0 + 16; x < sx1; x += 16) line([[x, eave + 20], [x, gy - 10]], 1.1, { color: '#566866', taper: [0, 0] });
    cel([[sx0 - 14, eave + 22], [(sx0 + sx1) / 2, -4], [sx1 + 14, eave + 22]], '#3d4046', { lin: true, w: 2.6, k: 0.6 });
    line([[sx0 - 14, eave + 22], [sx1 + 14, eave + 22]], 2.4, { taper: [0, 0] });
    // dark doorway: the only big black in the strip so far
    const dx0 = w * 0.08, dx1 = w * 0.24, dy0 = h * 0.28;
    I.fill([[dx0, dy0], [dx1, dy0], [dx1, gy - 6], [dx0, gy - 6]], '#16171b', { wob: 0, lin: true });
    // inside, in the gloom: a shelf of tins and pots, a coiled hose, a rake and a spade, a cobweb,
    // and the pale patch of floor where the bicycle stood all winter
    I.clipRect(dx0, dy0, dx1 - dx0, gy - dy0, () => {
      const g1 = '#3a3e48', g2 = '#4a4e5a';
      // the back wall: planks catching a little light from the door, a lit wedge of floor
      I.fill([[dx0, dy0], [dx1, dy0], [dx1, gy], [dx0, gy]], '#2a2d35', { wob: 0, lin: true });
      for (let x = dx0 + 12; x < dx1; x += 18) line([[x, dy0], [x, gy - 30]], 1, { color: '#363a44', taper: [0, 0] });
      I.fill([[dx0 + 20, gy - 6], [dx1, gy - 6], [dx1, gy - 34], [dx0 + 60, gy - 30]], '#4a4f5a', { wob: 0, lin: true, op: 0.8 });
      I.fill([[dx0, gy - 6], [dx1, gy - 6], [dx1 - 10, gy - 30], [dx0 + 10, gy - 30]], '#24262c', { wob: 0, lin: true });
      shape([[dx0 + 30, gy - 14], [dx1 - 20, gy - 14], [dx1 - 26, gy - 22], [dx0 + 36, gy - 22]], '#30333a', { w: 0 });
      line([[dx0 + 4, dy0 + 58], [dx1 - 4, dy0 + 58]], 3, { color: g2, taper: [0, 0] });
      [[10, 16, 20], [30, 14, 26], [48, 18, 16], [70, 12, 22], [90, 20, 18]].forEach(([dx, ww, hh], i) => shape(I.rectPts(dx0 + dx, dy0 + 58 - hh, ww, hh), i % 2 ? g1 : g2, { w: 1, lin: true, color: '#1a1b20' }));
      I.ink(I.ell(dx1 - 34, dy0 + 100, 20, 20, 16), 3, { closed: true, color: g2, wob: 0 }); I.ink(I.ell(dx1 - 34, dy0 + 100, 13, 13, 14), 3, { closed: true, color: g2, wob: 0 });
      line([[dx0 + 20, dy0 + 70], [dx0 + 34, gy - 8]], 3.2, { color: g2, taper: [0, 0] });
      line([[dx0 + 12, dy0 + 68], [dx0 + 30, dy0 + 66]], 3, { color: g2, taper: [0, 0] });
      line([[dx1 - 60, dy0 + 70], [dx1 - 66, gy - 26]], 3, { color: g2, taper: [0, 0] });
      shape([[dx1 - 72, gy - 26], [dx1 - 58, gy - 26], [dx1 - 60, gy - 10], [dx1 - 70, gy - 10]], g2, { w: 1 });
      for (let k = 0; k < 5; k++) line([[dx0 + 2, dy0 + 2], [dx0 + 30 - k * 6, dy0 + 2 + k * 7]], 0.9, { color: '#8a8e98', taper: [0, 0] });
      I.ink(I.arc(dx0 + 2, dy0 + 2, 14, 14, 0, Math.PI / 2, 5), 0.9, { color: '#8a8e98', wob: 0 });
      I.ink(I.arc(dx0 + 2, dy0 + 2, 24, 24, 0, Math.PI / 2, 6), 0.9, { color: '#8a8e98', wob: 0 });
    });
    line([[dx0, dy0], [dx1, dy0]], 2.4, { taper: [0, 0] });
    // the open door, swung out toward us, in perspective
    cel([[dx1, dy0], [dx1 + 46, dy0 - 10], [dx1 + 46, gy + 6], [dx1, gy - 6]], '#7c918d', { lin: true, w: 2.4, k: 0.8 });
    line([[dx1 + 14, dy0 + 6], [dx1 + 14, gy - 2]], 1.1, { color: '#566866', taper: [0, 0] }); line([[dx1 + 30, dy0 + 1], [dx1 + 30, gy + 2]], 1.1, { color: '#566866', taper: [0, 0] });
    shape(I.ell(dx1 + 38, h * 0.56, 3, 3, 8), '#c9b27a', { w: 1.2 });
    // watering can and a flowerpot by the shed wall
    const wx = w * 0.8, wy = h * 0.86;
    cel([[wx, wy], [wx + 2, wy - 28], [wx + 28, wy - 28], [wx + 30, wy]], '#5d8a6a', { lin: true, w: 2, k: 0.5 });
    line([[wx + 28, wy - 22], [wx + 48, wy - 40]], 4.4, { taper: [0, 0] }); line([[wx + 28, wy - 22], [wx + 48, wy - 40]], 2, { color: '#5d8a6a', taper: [0, 0] });
    I.ink(I.arc(wx + 15, wy - 28, 12, 12, Math.PI, Math.PI * 2, 8), 2.2);
    // Peg wheels the bike out into the light: she is walking it, the price tag still swinging
    const bx = w * 0.4;
    const t0 = I.take(); const b0 = BK.bike(bx, gy, 0.86, { dir: 1, basket: true, crank: 60 }); I.take(); I.emit(t0);
    const res = wheelB(tint(peg, COLD.tint), { x: bx, y: gy, s: 0.86, dir: 1, color: BIKE, basket: true, pose: { lean: 12, curve: 6, reachN: [b0.grip[0] - 10, b0.grip[1] + 4], bendN: 1, handN: 'grip', head: { yaw: 40, pitch: 4, look: [0.9, 0.35], mood: 'determined', mouth: 'smile' } } });
    priceTag([res.bike.grip[0] + 14, res.bike.grip[1] - 2], 1.25, 10);
    bikeShadow(bx, gy, res.bike.Rw * 3.2);
    // a robin on the fence, the steaming mug on the post
    shape(I.rectPts(w * 0.92, h * 0.28, 24, h * 0.6), '#a8977a', { w: 2, lin: true });
    shape([[w * 0.92 + 4, h * 0.28 - 18], [w * 0.92 + 20, h * 0.28 - 18], [w * 0.92 + 19, h * 0.28], [w * 0.92 + 5, h * 0.28]], '#ffffff', { w: 1.6, lin: true });
    for (let k = 0; k < 2; k++) line([[w * 0.92 + 9 + k * 6, h * 0.28 - 22], [w * 0.92 + 6 + k * 6, h * 0.28 - 30], [w * 0.92 + 10 + k * 6, h * 0.28 - 38]], 1.4, { color: '#8aa2b0', taper: [0.3, 0.3] });
  });
  y += 340 + G;

  // ---------------------------------------------------------------- 2 — push off (wobble)   3 — CRASH
  r = PG.row(y, 300, [1.2, 1]);
  panel(r[0], null, (w, h) => {
    park(w, h, COLD, { duckX: w * 0.2, bench: false, oak: false, clouds: false, bridge: [0.06, 0.34] });
    SC.cloud(w * 0.3, h * 0.12, 9, COLD.cloud, { kind: 'stratus', w: 1.6 });
    SC.tree(w * 1.02, h * 1.0, h * 0.9, { kind: 'round', leaf: COLD.tree, depth: 0, seed: 19 });
    SC.lamppost(w * 0.06, h * 0.86, h * 0.55, { color: '#2e3440' });
    const gy = h * 0.9;
    // the wavering tyre track she leaves on the path
    track([[-10, h * 0.95], [w * 0.2, h * 0.92], [w * 0.38, gy + 2]], 3.5, 3.5);
    const res = ride(tint(peg, COLD.tint), { x: w * 0.6, y: gy, s: 0.82, dir: 1, basket: true, wobble: true, color: BIKE, tilt: -7, pose: { head: { yaw: 40, pitch: -12, look: [0.3, 1], mood: 'worried', mouth: 'wobble' } } });
    const b = res.bike;
    arcs(b.front[0], b.front[1], b.Rw * 1.08, -40, 40, 3, 7, 2.2);
    arcs(b.front[0], b.front[1], b.Rw * 1.08, 140, 200, 2, 7, 2);
    arcs(res.rig.headC[0], res.rig.headC[1], res.rig.R * 1.7, -150, -110, 2, 6, 1.8);
    sweat(res.rig.headC[0] - res.rig.R * 1.55, res.rig.headC[1] - res.rig.R * 0.2, 1.0);
    wobbleWord(w * 0.66, h * 0.2, 'WOBBLE', { size: 36, ph: 0 });
    wobbleWord(w * 0.72, h * 0.34, 'WOBBLE', { size: 29, ph: 1.4 });
  });
  panel(r[1], null, (w, h) => {
    park(w, h, COLD, { duck: false, clouds: false, bench: false, oak: false, bridge: false });
    SC.tree(w * 0.12, h * 0.6, h * 0.42, { kind: 'oak', leaf: mix(COLD.tree, COLD.far, 0.3), depth: 0.3, seed: 23 });
    // the clipped box hedge along the path, seen a little from above: top face, front face
    const yT = h * 0.6, yF = h * 0.7;
    const hole = [w * 0.4, h * 0.645];
    boxHedge(-20, w + 20, yT, yF, h * 0.88, '#4d6c5f', { hole, seed: 3 });
    // bike: nose-dived into the hedge top, back end up, rear wheel still spinning (clipped where it goes in)
    let bb;
    I.clipPoly([[-10, -10], [w + 10, -10], [w + 10, h * 0.66], [w * 0.55, h * 0.635], [-10, h * 0.66]], () => { bb = BK.bike(w * 0.74, h * 0.72, 0.66, { dir: -1, color: BIKE, basket: false, tilt: 36, spin: 0.7, crank: 200 }); });
    // Peg, upside down, head first into the hole: only her legs kick in the air
    const pegT = tint(peg, COLD.tint);
    const pose = { x: 0, y: 0, s: 0.66, yaw: 14, legN: [12, 40, 20], legF: [-8, 46, 18], shadow: false, parts: ['legN', 'legF'] };
    const r0 = F.rig(pegT, pose);
    const th = r0.hip, hipAt = [hole[0], hole[1] - 20];
    const C = [(hipAt[0] + th[0]) / 2, (hipAt[1] + th[1]) / 2];
    I.clipPoly([[-10, -10], [w + 10, -10], [w + 10, hole[1]], [-10, hole[1]]], () => F.fig(pegT, { ...pose, rot: 178, rotC: C }));
    // re-cover the top face in front of the hole, so she really goes down into it
    I.fill([[hole[0] - 60, hole[1] + 2], [hole[0] + 60, hole[1] + 2], [hole[0] + 60, yF + 2], [hole[0] - 60, yF + 2]], mix('#4d6c5f', '#dfe9d0', 0.22), { wob: 0 });
    // her rump, skirt pulled tight over it, sticking up out of the hole; the hem flops down round the rim
    const skc = mix(peg.bottom.color, COLD.tint[0], 0.12);
    const hem = []; for (let k = 0; k <= 14; k++) { const t = k / 14, a = Math.PI * (1 + t); hem.push([hole[0] + Math.cos(a) * 46 + (k % 2 ? 0 : 3), hole[1] + 2 + Math.sin(a) * 10 + (k % 2 ? 5 : -2)]); }
    cel(hem.concat([[hole[0] + 44, hole[1] + 10], [hole[0] - 44, hole[1] + 10]]), shade(skc, 0.12), { w: 2.2, k: 0.4 });
    const rump = []; for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; rump.push([hipAt[0] + Math.cos(a) * 30 + Math.sin(a * 2) * 3, hipAt[1] + 8 + Math.sin(a) * 21 + Math.abs(Math.cos(a * 2)) * -3]); }
    cel(rump.concat([[hipAt[0] + 36, hole[1] + 4], [hipAt[0] - 36, hole[1] + 4]]), skc, { w: 2.4, k: 0.8 });
    line([[hipAt[0] + 2, hipAt[1] - 16], [hipAt[0], hole[1]]], 1.3, { color: shade(skc, 0.4) });
    [-26, -12, 14, 28].forEach((dx) => line([[hole[0] + dx, hole[1] - 2], [hole[0] + dx * 1.2, hole[1] + 8]], 1.1, { color: shade(skc, 0.4) }));
    // broken twigs and leaves bursting out of the hole
    [[-50, -8, -30], [48, -6, 20], [-30, -2, -60], [34, 0, 70]].forEach(([dx, dy, a]) => line([[hole[0] + dx * 0.7, hole[1] + dy], [hole[0] + dx * 0.7 + Math.cos(a * D - Math.PI / 2) * 22, hole[1] + dy + Math.sin(a * D - Math.PI / 2) * 22]], 2, { color: '#3a2e26', taper: [0.1, 0.6] }));
    for (let k = 0; k < 16; k++) { const a = (-172 + k * 11) * D, d = 70 + (k % 3) * 26; const lx = hole[0] + Math.cos(a) * d * 1.35, ly = hole[1] - 20 + Math.sin(a) * d * 0.9; cel(I.ell(lx, ly, 6, 3.4, 8, a + 0.8), k % 2 ? '#7a9a78' : '#557868', { w: 1.3, k: 0.2 }); }
    boxHedge(-20, w + 20, yT, yF, h * 0.88, '#4d6c5f', { seed: 3, frontOnly: true });
    I.fill([[-10, h * 0.88], [w + 10, h * 0.88], [w + 10, h + 10], [-10, h + 10]], COLD.path, { wob: 0.2, lin: true });
    line([[-10, h * 0.885], [w + 10, h * 0.885]], 2, { taper: [0, 0] });
    track([[-10, h * 0.96], [w * 0.3, h * 0.94], [w * 0.62, h * 0.9]], 3, 3);
    // one shoe flying off
    // her glasses, flung off and spinning
    I.grp(`translate(${I.n1(w * 0.18)} ${I.n1(h * 0.4)}) rotate(-28)`, () => {
      [-9, 9].forEach((dx) => { I.ink(I.ell(dx, 0, 8, 7.4, 16), 5.4, { closed: true, wob: 0 }); I.ink(I.ell(dx, 0, 8, 7.4, 16), 3, { closed: true, wob: 0, color: '#b8342e' }); I.fill(I.ell(dx, 0, 6, 5.4, 12), '#eef4f6', { wob: 0, op: 0.7 }); });
      line([[-17, -1], [-26, -4]], 3, { color: '#b8342e', taper: [0, 0] }); line([[17, -1], [26, 3]], 3, { color: '#b8342e', taper: [0, 0] });
      line([[-3, -2], [3, -2]], 3, { color: '#b8342e', taper: [0, 0] });
    });
    arcs(w * 0.18, h * 0.4, 24, 30, 110, 2, 6, 1.6);
    // impact marks and the spinning wheel
    arcs(hole[0], hole[1] - 60, 70, -165, -120, 3, 9, 2.4); arcs(hole[0], hole[1] - 60, 70, -60, -15, 3, 9, 2.4);
    arcs(bb.rear[0], bb.rear[1], bb.Rw * 1.25, -80, 10, 3, 7, 2);
    PG.sfx(w * 0.5, h * 0.2, 'CRASH!', { size: 70, color: '#f2c230', rot: -7 });
  });
  y += 300 + G;

  // ---------------------------------------------------------------- 4–6 — three mornings, one framing
  // The same camera on the same stretch of path; what changes is the weather (the weeks passing), the fall
  // (splash, tangle, over the handlebars) and her face (shock, embarrassment, grim determination).
  r = PG.row(y, 262, [1, 1, 1]);
  const DAY4 = { ...COLD, sky: '#a3afb9', skyLow: '#c9cfd3', cloud: '#dde1e4', grass: '#93a894' };
  const DAY11 = { ...COLD, sky: '#b9c8d2', skyLow: '#e9e5d8', tree: '#8d8a55', hedge: '#6f7a52' };
  const DAY19 = { ...COLD, sky: '#cfdae1', skyLow: '#f0f3f3', grass: '#c3cfc7', grassSh: '#a7b6ae', bank: '#b7c5bd', hedge: '#6a8078', tree: '#66807a', far: '#c3cdcf', farTree: '#aebcbd', river: '#b3c8d2' };
  const dayCap = (t) => (w, h) => hcap(10, 9, [t], { size: 17 });
  // DAY 4: drizzle, SPLOSH into the puddle
  panel(r[0], null, (w, h) => {
    park(w, h, DAY4, { duckX: w * 0.33, duckS: 0.55 });
    const px = w * 0.5, py = h * 0.87;
    cel(I.ell(px, py, 84, 14, 22), '#8499a6', { w: 1.8, k: 0.4 });
    [[-1, px - 70], [1, px + 66]].forEach(([sg, sx]) => { for (let k = 0; k < 4; k++) { const a = (-90 + sg * (18 + k * 16)) * D; const q0 = [sx, py - 4], q1 = [sx + Math.cos(a) * (40 - k * 5), py - 4 + Math.sin(a) * (40 - k * 5)]; line([q0, q1], 2, { color: '#5d7f92', taper: [0.1, 0.8] }); I.drop(q1[0] + Math.cos(a) * 7, q1[1] + Math.sin(a) * 7, 0.5, a / D + 90, '#cfe3ec'); } });
    F.POSES.bike.crash(tint(peg, COLD.tint), { x: w * 0.44, y: h * 0.86, s: 0.58, dir: 1, color: BIKE, basket: true, pose: { head: { mood: 'shock', mouth: 'o', look: [0, -0.4] } } });
    SC.rain(w, h, 36, '#eef3f6', 76);
    PG.sfx(w * 0.72, h * 0.4, 'SPLOSH!', { size: 30, color: '#ffffff', rot: 7 });
  }, dayCap('DAY 4'));
  // DAY 11: autumn wind; she's on her back under the bike, legs tangled in it; the kids arrive
  panel(r[1], null, (w, h) => {
    park(w, h, DAY11, { duck: false });
    const gy = h * 0.86;
    // the bike on its side on the path; she's on her back, her legs over the frame and one foot through the
    // front wheel (its tyre is drawn again over her shin)
    const bxl = w * 0.66, s11 = 0.5, Rw = 60 * s11, sq = 0.42;
    bikeFlat(bxl, gy + 2, s11, { dir: 1, sq, rot: -2 });
    const lp = F.POSES.lyingBed(peg, { x: w * 0.04, y: gy - 6, s: 0.54 });
    F.fig(tint(peg, COLD.tint), { ...lp, legN: [58, 30, 16], legF: [30, 50, 10], armN: [60, 40, 20], armF: [100, 30, 20], handN: 'open', handF: 'open', shadow: false, head: { yaw: 40, pitch: 6, blink: false, mood: 'embarrassed', look: [0.9, -0.3] } });
    const fw = [bxl + Rw * 1.62, gy + 2 - Rw * sq];
    const arc = []; for (let t = 200; t <= 320; t += 8) arc.push([fw[0] + Math.cos(t * D) * Rw, fw[1] + Math.sin(t * D) * Rw * sq * 2.2]);
    line(arc, 7, { taper: [0.1, 0.1] }); line(arc, 4, { color: '#2c282b', taper: [0.1, 0.1] });
    arcs(fw[0], fw[1] - 20, 26, -150, -40, 2, 6, 1.5);
    // blowing leaves
    for (let k = 0; k < 10; k++) { const lx = (k * 67) % w, ly = 30 + ((k * 41) % 120); cel(I.ell(lx, ly, 5, 2.6, 8, k), k % 2 ? '#c98a3a' : '#a8742e', { w: 1.1, k: 0.2 }); line([[lx - 18, ly + 3], [lx - 6, ly + 1]], 1, { color: '#ffffff', taper: [0.8, 0.1] }); }
    // two kids on scooters, laughing; one points
    scooterKid(BOY, w * 0.95, h * 0.66, 0.3, -1, '#f2c230', { arm: 'belly', tint: COLD.tint });
    scooterKid(GIRL, w * 0.83, h * 0.68, 0.32, -1, '#e05a5a', { arm: 'point', tint: COLD.tint, head: { mouth: 'laugh', yaw: -40 } });
    PG.sfx(w * 0.84, h * 0.46, 'HA HA!', { size: 24, color: '#ffffff', rot: 8 });
  }, dayCap('DAY 11'));
  // DAY 19: frost; plasters on, knees bandaged, and the front wheel hits a stone: over the handlebars she goes
  panel(r[2], null, (w, h) => {
    park(w, h, DAY19, { duck: false });
    const gy = h * 0.87;
    for (let k = 0; k < 14; k++) line([[(k * 53) % w, h * 0.9 + (k % 4) * 6], [(k * 53) % w + 8, h * 0.9 + (k % 4) * 6]], 1.2, { color: '#ffffff', taper: [0.3, 0.3] });
    // the front wheel has hit a stone: the back of the bike kicks up and she pitches forward over the bars,
    // still gripping them, her legs flung up behind
    const bx = w * 0.42;
    const ro = { x: bx, y: gy, s: 0.54, dir: 1, basket: true, color: BIKE, tilt: 22, crank: 80, pose: { lean: 62, curve: 16, footN: null, footF: null, legN: [-70, 30, 10], legF: [-44, 60, 12], head: { mood: 'grimace', pitch: -10 } } };
    const tmp = I.take(); const d0 = F.POSES.bike.ride(peg, ro); I.take(); I.emit(tmp);
    const ddy = gy - (d0.bike.front[1] + d0.bike.Rw);
    let rr; I.grp(`translate(0 ${I.n1(ddy)})`, () => { rr = ride(tint(peg, COLD.tint), ro).rig; plaster(rr.headC[0] + rr.R * 0.2, rr.headC[1] - rr.R * 0.8, 0.6, 20); kneeBandage(rr.legN[1], 10, 0.6); kneeBandage(rr.legF[1], -10, 0.55); });
    const fr = [d0.bike.front[0], d0.bike.front[1] + ddy];
    SC.stone(fr[0] + 14, gy - 12, 24, 15, '#a9aea8');
    arcs(d0.bike.rear[0], d0.bike.rear[1] + ddy, 30, -160, -90, 2, 6, 1.6);
    const C = [rr.headC[0], rr.headC[1] + ddy];
    arcs(C[0] - 10, C[1] + 20, 40, 150, 230, 3, 7, 1.8);
    // the duck takes off in alarm; her breath and the frost
    duckFly(w * 0.16, h * 0.3, 0.5, -1, {});
    PG.sfx(w * 0.83, h * 0.76, 'WHUMP!', { size: 21, color: '#ffffff', rot: -6 });
  }, dayCap('DAY 19'));
  y += 262 + G;

  // ---------------------------------------------------------------- 7 — the notebook   8 — dusk bench
  r = PG.row(y, 290, [1, 1.55]);
  panel(r[0], null, (w, h) => {
    // kitchen table, early light: wood grain, a mug, the box of plasters
    I.rect(0, 0, w, h, '#b9a58c');
    for (let k = 0; k < 7; k++) line([[-10, k * 46 + 12], [w + 10, k * 46 + 4]], 1.2, { color: '#9d8a72', taper: [0, 0] });
    I.grp(`translate(${I.n1(w * 0.46)} ${I.n1(h * 0.5)}) rotate(-5)`, () => {
      cel([[-122, -110], [120, -112], [124, 104], [-118, 106]], '#fbf6e2', { w: 2.6, lin: true, k: 0.4, shade: 0.08 });
      for (let k = 0; k < 8; k++) line([[-116, -72 + k * 24], [118, -72 + k * 24]], 1.1, { color: '#8fc4e2', taper: [0, 0] });
      line([[-88, -110], [-86, 104]], 1.4, { color: '#e07a7a', taper: [0, 0] });
      for (let k = 0; k < 5; k++) I.fill(I.ell(-108, -80 + k * 40, 4, 4, 8), '#b9a58c', { wob: 0 });
      I.text(-76, -80, 'FALLS', { font: 'Journal', size: 28, anchor: 'start', color: '#2a3a6a' });
      line([[-76, -74], [-8, -76]], 1.6, { color: '#2a3a6a' });
      // 23 tally marks: four gates of five and three strokes, the last one being drawn now
      for (let g = 0; g < 5; g++) for (let k = 0; k < (g < 4 ? 5 : 3); k++) {
        const x = -74 + g * 38 + k * 6, yy = -50 + (g % 2) * 3;
        if (k < 4 || g === 4) line([[x, yy], [x + 1.5, yy + 30]], 2.3, { color: '#2a3a6a', taper: [0.1, 0.2] });
        else line([[x - 26, yy + 24], [x + 3, yy + 5]], 2.3, { color: '#2a3a6a', taper: [0.1, 0.2] });
      }
      I.text(-76, 12, 'knees: 2', { font: 'Journal', size: 18, anchor: 'start', color: '#2a3a6a' });
      I.text(-76, 36, 'pride: 0', { font: 'Journal', size: 18, anchor: 'start', color: '#2a3a6a' });
      I.text(-76, 60, 'duck: unimpressed', { font: 'Journal', size: 18, anchor: 'start', color: '#2a3a6a' });
    });
    // her arm comes in from the corner: cardigan sleeve with a ribbed cuff, then the hand, pencil pinched,
    // finishing mark 23
    const wr = [w * 0.86, h * 0.7], ang = -118, da = (ang + 180) * D, dv = [Math.cos(da), Math.sin(da)], nv = [-dv[1], dv[0]];
    const at = (t, k) => [wr[0] + dv[0] * t + nv[0] * k, wr[1] + dv[1] * t + nv[1] * k];
    cel([at(8, -24), at(8, 24), at(260, 44), at(260, -44)], '#dea033', { w: 2.6, k: 1, lin: true });
    cel([at(4, -22), at(4, 22), at(26, 25), at(26, -25)], '#d39426', { w: 2.2, lin: true, k: 0.3 });
    for (let k = -3; k <= 3; k++) line([at(6, k * 6.5), at(24, k * 7.2)], 1.1, { color: '#a8721a', taper: [0, 0] });
    for (let k = 0; k < 3; k++) line([at(60 + k * 40, -30 + k * 8), at(90 + k * 40, -10 + k * 6)], 1.2, { color: '#b27a1e', taper: [0.3, 0.3] });
    hand(wr[0], wr[1], -110, 5.6, 'pen', { skin: '#f0c9a8', object: 'pen', objectColor: '#e0b63a', age: 0.5, flip: true });
  });
  panel(r[1], null, (w, h) => {
    // dusk: violet sky, the park gone to silhouettes, one lamp not yet lit
    SC.sky(w, h, DUSK.sky, DUSK.skyLow, { mid: 0.75 });
    SC.moon(w * 0.46, h * 0.2, 11, '#e8e2f0', DUSK.sky, { glow: false });
    SC.stars(w, h * 0.35, 7, '#e8e2f0', { max: 2.2 });
    const far = SC.hills(w, h * 0.5, 8, DUSK.far, { n: 1.4, depth: 0.6, w: 1.2 });
    SC.treeline(far, { h: h * 0.08, leaf: DUSK.farTree, depth: 0.5 });
    SC.river(w, h * 0.56, h * 0.06, DUSK.river, { rise: h * 0.01 });
    footbridge(w * 0.7, h * 0.6, w * 0.95, h * 0.555, h * 0.05, DUSK.bridge, { water: DUSK.river, stone: '#5d5f78', railC: '#1e2030' });
    I.fill([[-10, h * 0.64], [w + 10, h * 0.63], [w + 10, h + 10], [-10, h + 10]], DUSK.grass, { wob: 0.3 });
    line([[-10, h * 0.64], [w + 10, h * 0.63]], 1.5, { taper: [0, 0] });
    SC.tree(w * 0.1, h * 0.72, h * 0.62, { kind: 'oak', leaf: DUSK.tree, leafShade: '#2a2e46', trunk: '#2e2a38', seed: 41 });
    SC.lamppost(w * 0.86, h * 0.72, h * 0.48, { color: '#262838' });
    // the bench, and Peg on it, elbows on knees
    const bx = w * 0.3, by = h * 0.9;
    SC.bench(bx, by, w * 0.36, { color: DUSK.bench, iron: '#1e1f2a' });
    const seatY = by - w * 0.36 * 0.2;
    // chin sunk in her hands, elbows on her knees (engine pose)
    F.fig(tint(peg, DUSK.tint), F.POSES.benchDejected(peg, { x: bx + w * 0.16, y: seatY, s: 0.95, yaw: 30, chin: true, head: { yaw: 26, pitch: -10, look: [0.3, 0.7], mood: 'dejected' } }));
    // the bicycle, dropped on its side in the grass
    bikeFlat(w * 0.84, h * 0.93, 0.68, { dir: -1, color: mix(BIKE, DUSK.sky, 0.25) });
  }, (w, h) => hcap(w - 20, 16, ['I *FINALLY* CONCLUDED'], { anchor: 'end', size: 20, emphK: 1.25 }));
  y += 290 + G;

  // ---------------------------------------------------------------- 9 — eyes locked on the wobbling wheel
  // Head-on and low, in front of the bike: the bars and her white-knuckled hands across the middle, her face
  // above them staring straight down, the front wheel below wobbling left and right.
  // 9a: an extreme close-up strip on her eyes, pupils dropped to the wheel
  r = PG.row(y, 150, [1]);
  panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, '#b9c3cd');
    HD.head({ ...peg.head }, { x: w * 0.5, y: h * 0.3, s: 8.6, yaw: 0, pitch: -12, look: [0.3, 1], mood: 'worried', mouth: 'wobble' });
  });
  y += 150 + G;
  r = PG.row(y, 400, [1]);
  panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, '#c3ccd5');
    // a close side view on the bike: her head big at top left, bent over the bars, her hand clamped on the grip,
    // and the front wheel below, wobbling (ghost wheels turning left and right)
    const s9 = 1.55, bo = { x: 0, y: 0, s: s9, dir: 1, basket: true, color: BIKE, wobble: true, tilt: -2 };
    const t0 = I.take(); const d0 = F.POSES.bike.ride(peg, bo); I.take(); I.emit(t0);
    const off = [w * 0.26 - d0.rig.headC[0], h * 0.13 - d0.rig.headC[1]];
    const fw = [d0.bike.front[0] + off[0], d0.bike.front[1] + off[1]], Rw = d0.bike.Rw;
    for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; I.fill([[fw[0] + Math.cos(a - 0.012) * Rw * 1.2, fw[1] + Math.sin(a - 0.012) * Rw * 1.2], [fw[0] + Math.cos(a) * 1600, fw[1] + Math.sin(a) * 1600], [fw[0] + Math.cos(a + 0.03) * 1600, fw[1] + Math.sin(a + 0.03) * 1600]], '#b3bdc8', { wob: 0 }); }
    ride(peg, { ...bo, x: off[0], y: off[1], pose: { head: { yaw: 42, pitch: -18, look: [0.55, 1], mood: 'worried', mouth: 'wobble' } } });
    // ghost wheels: as the front wheel swings, it narrows to an ellipse one way, then the other
    [[0.45, -16, 0.45], [0.7, 14, 0.5]].forEach(([k, a, op]) => { I.emit(`<g opacity="${op}"><ellipse cx="${I.n1(fw[0])}" cy="${I.n1(fw[1])}" rx="${I.n1(Rw * k)}" ry="${I.n1(Rw)}" transform="rotate(${a} ${I.n1(fw[0])} ${I.n1(fw[1])})" fill="none" stroke="${INK}" stroke-width="${I.n1(Rw * 0.12)}"/></g>`); });
    arcs(fw[0], fw[1], Rw * 1.12, -60, -20, 3, 10, 2.6); arcs(fw[0], fw[1], Rw * 1.12, -160, -120, 3, 10, 2.6);
    sweat(w * 0.24 - 70, h * 0.1, 1.7);
    // her eye-line, dotted, from the glasses down to the wheel
    { const e = [w * 0.24 + 56, h * 0.2], t = [fw[0] - 10, fw[1] - Rw * 0.9]; for (let k = 1; k < 10; k++) { const f = k / 10; I.fill(I.ell(lerp(e[0], t[0], f), lerp(e[1], t[1], f), 2.4, 2.4, 6), '#ffffff', { wob: 0 }); } }
  }, (w, h) => hcap(w - 22, 18, ['THAT ALL FAILURE', 'WAS FROM A', '*WOBBLING WILL*'], { anchor: 'end', size: 20, emphK: 1.45 }));
  y += 400 + G;

  // ---------------------------------------------------------------- 10 — the turn: she lifts her head
  // 10a: the lift itself, the moment the colour changes (cold on the left of her face, sunrise on the right).
  // 10b: the result: head up, eyes on the bridge, and her tyre track goes from wobbling to straight.
  r = PG.row(y, 300, [1, 2.05]);
  panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, h, w, 0, [[0, '#9fb0bf'], [0.45, '#c9b8a6'], [0.62, '#f6b06a'], [1, '#ffd98f']]));
    sunRays(w * 1.1, h * 0.1, 30, 900, 20, '#ffe3a8', 3);
    const hc = [w * 0.44, h * 0.56];
    arcs(hc[0] - 10, hc[1] + 40, 110, 40, 90, 3, 10, 2.4);
    cel([[hc[0] - 120, h + 10], [hc[0] - 90, h * 0.86], [hc[0] + 40, h * 0.84], [hc[0] + 90, h + 10]], mix('#d79a30', '#ffb050', 0.15), { w: 3, k: 1.5 });
    HD.head({ ...peg.head, skin: mix(peg.head.skin, '#ffc890', 0.25), hair: mix(peg.head.hair, '#ffd8a0', 0.2) }, { x: hc[0], y: hc[1], s: 3.1, yaw: 48, pitch: 12, look: [0.7, -0.5], mood: 'surprise', mouth: 'o' });
    [[hc[0] + 72, hc[1] - 36]].forEach(([x, yy]) => { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; line([[x, yy], [x + Math.cos(a) * 16, yy + Math.sin(a) * 16]], 2.4, { color: '#ffffff', taper: [0, 1] }); } });
  });
  panel(r[1], null, (w, h) => {
    SC.sky(w, h, WARM.sky, WARM.skyLow, { mid: 0.7 });
    const sun = [w * 0.78, h * 0.5];
    sunRays(sun[0], sun[1], 50, 1100, 30, '#ffe3a8', 5);
    SC.sun(sun[0], sun[1], 36, '#fff4d0', { glow: '#ffe7a8' });
    const far = SC.hills(w, h * 0.54, 5, WARM.far, { n: 1.2, depth: 0.5, w: 1.2 });
    SC.treeline(far, { h: h * 0.06, leaf: WARM.farTree, depth: 0.5 });
    const ry = h * 0.58;
    SC.river(w, ry, h * 0.08, '#ffdf9e', { rise: h * 0.01 });
    footbridge(w * 0.66, ry + h * 0.075, w * 0.9, ry - 2, h * 0.07, '#8a4a2a', { water: '#ffdf9e', stone: '#b98a60', railC: '#3a2418' });
    I.fill([[-10, h * 0.665], [w + 10, h * 0.655], [w + 10, h + 10], [-10, h + 10]], WARM.grass, { wob: 0.3 });
    line([[-10, h * 0.665], [w + 10, h * 0.655]], 1.5, { taper: [0, 0] });
    const top = curve([-10, h * 0.84], [w * 0.45, h * 0.76], [w * 0.66, h * 0.665], 12);
    const bot = curve([-10, h * 1.02], [w * 0.55, h * 0.9], [w * 0.72, h * 0.665], 12);
    band(top, bot, WARM.path, { w: 1.5 });
    SC.grass({ x: 0, y: h * 0.7, w, h: h * 0.3 }, { n: 8, color: WARM.grassSh, seed: 9 });
    const gx = w * 0.3, gy = h * 0.9;
    const tr = I.sample([[-10, h * 0.975], [w * 0.1, h * 0.95], [gx - 50, gy + 2]], false, 4).map(([x, yy], i, a) => [x, yy + Math.sin((i / a.length) * 3.5 * Math.PI * 2) * 5 * (1 - i / a.length)]);
    line(tr, 2.6, { color: '#8a6a3a', taper: [0.5, 0] });
    line([[gx - 52, gy + 2], [gx + 20, gy]], 2.6, { color: '#8a6a3a', taper: [0, 0] });
    ride(tint(peg, WARM.tint), { x: gx + 40, y: gy, s: 0.62, dir: 1, basket: true, color: BIKE, tilt: -3, pose: { lean: 10, head: { yaw: 58, pitch: 8, look: [1, -0.2], mood: 'determined', mouth: 'smile' } } });
  }, (w, h) => hcap(w - 20, 16, ['RATHER THAN A', '*WOBBLING WHEEL.*'], { anchor: 'end', size: 20, emphK: 1.45 }));
  y += 300 + G;

  // ---------------------------------------------------------------- 11 — she rides
  const SH = 580;
  r = PG.row(y, SH, [1]);
  panel(r[0], null, (w, h) => {
    SC.sky(w, h, '#f28a48', '#ffe2a2', { mid: 0.6 });
    const sun = [w * 0.82, h * 0.4];
    sunRays(sun[0], sun[1], 70, 1400, 36, '#ffe0a0', 7);
    SC.sun(sun[0], sun[1], 56, '#fff6d8', { glow: '#fff1c2' });
    const far = SC.hills(w, h * 0.44, 8, WARM.far, { n: 1.2, depth: 0.5, w: 1.2 });
    SC.treeline(far, { h: h * 0.05, leaf: WARM.farTree, depth: 0.5 });
    SC.hills(w, h * 0.47, 2, WARM.bank, { n: 1, depth: 0.4, w: 1.2 });
    SC.river(w, h * 0.5, h * 0.09, '#ffdf9e', { rise: h * 0.035 });
    footbridge(w * 0.7, h * 0.575, w * 0.94, h * 0.47, h * 0.06, '#9a5a32', { water: '#ffdf9e', stone: '#c09066', railC: '#3a2418' });
    const gTop = [[-10, h * 0.6], [w * 0.5, h * 0.585], [w + 10, h * 0.57]];
    I.fill(gTop.concat([[w + 10, h + 10], [-10, h + 10]]), WARM.grass, { wob: 0.3 });
    line(gTop, 1.5, { taper: [0, 0] });
    const top = curve([-10, h * 0.88], [w * 0.5, h * 0.745], [w + 10, h * 0.6]);
    const bot = curve([-10, h * 1.06], [w * 0.5, h * 0.87], [w + 10, h * 0.665]);
    band(top, bot, WARM.path, { w: 1.6 });
    const yOn = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const t = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return lerp(pts[i - 1][1], pts[i][1], t); } return pts[pts.length - 1][1]; };
    SC.grass({ x: 0, y: h * 0.62, w, h: h * 0.38 }, { n: 12, color: WARM.grassSh, seed: 5 });
    SC.flowerBed({ x: w * 0.02, y: h * 0.9, w: w * 0.3, h: h * 0.1 }, { colors: ['#fff1cf', '#e8663a', '#f2c230'], kinds: ['daisy', 'poppy', 'dot'], patches: 4, s: 1.1, seed: 71 });
    // the kids: the boy jumps with both arms up; the girl scoots after her, one fist in the air
    scooterKid(BOY, w * 0.1, h * 0.72, 0.74, 1, '#f2c230', { arm: 'up', head: { mouth: 'laugh', yaw: 30 } });
    scooterKid(GIRL, w * 0.25, h * 0.7, 0.68, 1, '#e05a5a', { arm: 'fist', head: { mouth: 'laugh', yaw: 50 } });
    // Peg riding up the path, pedalling, laughing, the low sun behind her
    const bxF = w * 0.5, byF = lerp(yOn(top, bxF), yOn(bot, bxF), 0.6);
    PG.glow(bxF + 20, byF - 200, 230, '#fff1c2', 0.55);
    const res = ride(tint(peg, WARM.tint), { x: bxF, y: byF, s: 1.3, dir: 1, basket: true, color: BIKE, tilt: -14, crank: 35, pose: { lean: 20, head: { yaw: 60, pitch: 8, mood: 'joy', mouth: 'laugh' } } });
    for (let k = 0; k < 9; k++) { const yy = res.rig.hip[1] - 120 + k * 26; line([[res.rig.hip[0] - 110 - (k % 3) * 24, yy + 34], [res.rig.hip[0] - 40 - (k % 2) * 16, yy + 18]], 2.4, { color: '#ffffff', taper: [0.9, 0.1] }); }
    duckFly(w * 0.76, h * 0.2, 1.5, 1, { drops: '#fff1cf' });
    PG.ticks(w * 0.78, h * 0.14, 60, 3, -160, -110, 10);
  }, (w, h) => hcap(w - 24, h - 96, ['– *FRANCES E. WILLARD*,', 'WHO LEARNED TO RIDE A BICYCLE AT 53'], { anchor: 'end', size: 19, emphK: 1.3 }));
  y += SH;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, 'Frances E. Willard, A Wheel Within a Wheel: How I Learned to Ride the Bicycle (1895). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 5', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'wobbling-will.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
