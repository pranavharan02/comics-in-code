// THE GREAT OCEAN — Isaac Newton (reported; Spence 1820, Brewster 1855). A Zen-Pencils-style strip.
// node comics/ocean.js  -> out/the-great-ocean.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, cel, shade, mix, tubePts } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand } = require('../zp/hand');
const C = require('./cast_ocean');

I.seed(1727);
const W = 980;
let H = 0;
const RECTS = {};
const NG = 0.8; // night saturation
const PO = { border: 2.2 }; // panel border: ZP's 2-3 px, at the light end
const rec = (name, r) => { RECTS[name] = r; return r; };

// colour script: hot gold ballroom -> cool saturated blue beach -> the torch's warm circle -> a huge
// dark sky and sea lit by stars and blue-green glowing waves. Night blues are saturated (they read dark
// but keep their value, so the page does not go muddy).
const GOLD = { wall: '#f4c56a', wallLit: '#fbd98a', wallDark: '#dc9a3c', ceil: '#c9803a', pil: '#fae0a0', red: '#b8342e', redDark: '#8a2228', carpet: '#9a2a30', gold: '#e8b83a' };
const NIGHT = { top: '#0a1033', mid: '#2c46a4', low: '#3f66c2', haze: '#5a8ad2', sea: '#2c4ca8', seaNear: '#2442a0', sand: '#4d60b4', sandLit: '#6476c4', wet: '#3a54ac', glow: '#62f5e0', foam: '#dcfff8' };
const TORCH = { hot: '#fff6c8', warm: '#ffd97a', sand: '#e8c98a' };

function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, '&#160;')}</tspan>`).join('')}</text>`);
}
const rn = (a, b) => a + I.rng() * (b - a);
const pick = (arr) => arr[Math.floor(I.rng() * arr.length) % arr.length];

// ---------------------------------------------------------------- props
// trophy: base at (x, y), ~48 px tall at s = 1
function trophy(x, y, s = 1, o = {}) {
  const g = o.color || GOLD.gold;
  const T = (pts) => pts.map(([u, v]) => [x + u * s, y + v * s]);
  const w = Math.max(1.2, 1.9 * Math.min(1.6, s));
  cel(T([[-12, -9], [12, -9], [13, 0], [-13, 0]]), '#3a2320', { w, lin: true, k: s * 0.4 });
  shape(T([[-8, -8], [8, -8], [8, -4], [-8, -4]]), '#f3d27a', { w: w * 0.6, lin: true });
  cel(T([[-8, -9], [8, -9], [5, -14], [-5, -14]]), g, { w, lin: true, k: s * 0.4 });
  cel(T([[-2.4, -14], [2.4, -14], [2, -22], [-2, -22]]), g, { w, lin: true, k: s * 0.3 });
  cel(I.ell(x, y - 22 * s, 4.5 * s, 2.2 * s, 10), g, { w, k: s * 0.3 });
  // handles behind the bowl
  [-1, 1].forEach((d) => { line(T([[d * 12, -44], [d * 20, -42], [d * 19, -33], [d * 9, -28]]), w * 2.6, { color: INK, taper: [0.1, 0.1] }); line(T([[d * 12, -44], [d * 20, -42], [d * 19, -33], [d * 9, -28]]), w * 1.1, { color: g, taper: [0.1, 0.1] }); });
  cel(T([[-14, -47], [14, -47], [13, -38], [9, -29], [3, -24], [-3, -24], [-9, -29], [-13, -38]]), g, { w, k: s * 0.5, shade: 0.28 });
  I.fill(I.ell(x, y - 47 * s, 14 * s, 2.6 * s, 16), shade(g, 0.4), { wob: 0 });
  line(T([[-8, -43], [-7, -34], [-3, -28]]), Math.max(1, 1.6 * s), { color: '#fff8dc', taper: [0.3, 0.3] });
  if (o.sparkle) sparkle(x - 6 * s, y - 40 * s, 7 * s, '#fffbe6');
}
function sparkle(x, y, L, c = '#ffffff') {
  const t = L * 0.16;
  I.fill([[x, y - L], [x + t, y - t], [x + L * 0.8, y], [x + t, y + t], [x, y + L], [x - t, y + t], [x - L * 0.8, y], [x - t, y - t]], c, { wob: 0, lin: true });
}
// scallop shell, ~24 px wide at s = 1, hinge at the bottom
function shell(x, y, s, c = '#f7cdb4', rot = 0) {
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) rotate(${rot}) scale(${s})`, () => {
    const fan = [];
    for (let k = 0; k <= 16; k++) { const a = Math.PI * (1.08 + (k / 16) * 0.84); const r = 12 + (k % 2 ? 0.9 : -0.3); fan.push([Math.cos(a) * r, 4 + Math.sin(a) * r]); }
    fan.push([3.5, 5], [5, 8.5], [-5, 8.5], [-3.5, 5]);
    cel(fan, c, { w: 1.7, k: 0.35, shade: 0.2 });
    [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].forEach((u) => line([[0, 5], [u * 11, -5.5 - (1 - Math.abs(u)) * 1.8]], 0.9, { color: shade(c, 0.35), taper: [0.3, 0.1], wob: 0.1 }));
    line([[-7, -2], [-4, -6.5]], 1, { color: '#fff6ee', taper: [0.3, 0.3] });
  });
}
function pebble(x, y, s, c = '#b8b2c8') { cel(I.ell(x, y, 9 * s, 6 * s, 14, 0.2), c, { w: 1.5, k: s * 0.5 }); I.fill(I.ell(x - 3 * s, y - 2.5 * s, 2.6 * s, 1.2 * s, 8, 0.2), '#ffffff', { op: 0.5, wob: 0 }); }
// torch: back end at (x, y), pointing at ang (deg); ~30 px long at s = 1
function torch(x, y, ang, s = 1, o = {}) {
  const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const P = (u, v) => [x + ca * u * s - sa * v * s, y + sa * u * s + ca * v * s];
  if (o.beam) {
    const L = o.beam, sp = o.spread ?? 0.42;
    const g = PG.linear(P(18, 0)[0], P(18, 0)[1], P(18 + L, 0)[0], P(18 + L, 0)[1], [[0, TORCH.hot, 0.75], [0.6, TORCH.warm, 0.25], [1, TORCH.warm, 0]]);
    I.fill([P(18, -5), P(18 + L, -L * sp), P(18 + L, L * sp), P(18, 5)], g, { lin: true, wob: 0 });
  }
  const w = Math.max(1.2, 1.8 * Math.min(1.5, s));
  cel([P(-12, -4), P(8, -4.4), P(12, -6.8), P(18, -7), P(18, 7), P(12, 6.8), P(8, 4.4), P(-12, 4)], o.color || '#e84a3a', { w, lin: true, k: s * 0.4 });
  shape([P(-2, -4.2), P(4, -4.3), P(4, 4.3), P(-2, 4.2)], '#2a2228', { w: 0, lin: true });
  shape([P(17, -6.4), P(20, -6.4), P(20, 6.4), P(17, 6.4)], '#c9c2c8', { w: w * 0.8, lin: true });
  if (o.on !== false) { I.fill(I.ell(...P(20.5, 0), 2.6 * s, 6 * s, 12, a), TORCH.hot, { wob: 0 }); PG.glow(...P(22, 0), 16 * s, '#fffbe0', 0.9); }
}
// a small plastic bucket with a handle, bottom centre at (x, y)
function bucket(x, y, s = 1, c = '#e8b32a') {
  const T = (pts) => pts.map(([u, v]) => [x + u * s, y + v * s]);
  line(T([[-11, -18], [-10, -30], [0, -34], [10, -30], [11, -18]]), 1.5 * s, { color: INK, taper: [0.1, 0.1] });
  cel(T([[-12, -20], [12, -20], [9, 0], [-9, 0]]), c, { w: 1.8 * Math.min(1.5, s), lin: true, k: s * 0.5 });
  I.fill(I.ell(x, y - 20 * s, 12 * s, 3 * s, 16), shade(c, 0.5), { wob: 0 });
  line(T([[-12, -20], [12, -20]]), 1.4 * s, { taper: [0, 0] });
  line(T([[-10.5, -12], [10.5, -12]]), 1.1 * s, { color: shade(c, 0.3), taper: [0, 0] });
}
function footprints(x0, y0, x1, y1, n, c, size = 1, o = {}) {
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, sz = size * (o.grow ? 0.5 + t * 0.5 : 1);
    const side = k % 2 ? 1 : -1;
    I.fill(I.ell(x, y + side * 2.2 * sz, 3.4 * sz, 1.5 * sz, 8, 0.05), c, { wob: 0, op: o.op ?? 1 });
  }
}

// ---------------------------------------------------------------- night sky, milky way, sea
function nightSky(w, h, o = {}) {
  const hz = o.horizon ?? h;
  I.rect(-2, -2, w + 4, hz + 4, PG.linear(0, 0, 0, hz, o.stops || [[0, NIGHT.top], [0.45, NIGHT.mid], [0.85, NIGHT.low], [1, NIGHT.haze]]));
}
// a milky way drawn as designed flat shapes (ZP style): nested lumpy bands in flat value steps with thin
// inked edges (halo, band, bright core, a warm bulge near o.core), a dark rift of ragged flat shapes with
// its own edge, and dots of stars. Every call draws new shapes (seeded by the page rng).
function milkyWay(w, h, path, wid, o = {}) {
  const N = 60, core = o.core ?? 0.2;
  const nrm = (t) => { const a = path(Math.max(0, t - 0.01)), b = path(Math.min(1, t + 0.01)); const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const at = (t, off) => { const p = path(t), n = nrm(t); return [p[0] + n[0] * off, p[1] + n[1] * off]; };
  const bulge = (t) => 1 + 0.6 * Math.exp(-((t - core) ** 2) / 0.012);
  const wave = () => { const ph = [rn(0, 6), rn(0, 6), rn(0, 6)], f = [rn(4, 7), rn(11, 17), rn(23, 37)]; return (t) => 0.16 * Math.sin(t * f[0] + ph[0]) + 0.08 * Math.sin(t * f[1] + ph[1]) + 0.05 * Math.sin(t * f[2] + ph[2]); };
  const band = (k, t0 = 0, t1 = 1, off = () => 0) => {
    const wt = wave(), wb = wave(), top = [], bot = [];
    for (let i = 0; i <= N; i++) { const t = t0 + (t1 - t0) * i / N, e = Math.sin(Math.PI * (i / N)) ** 0.35, ww = wid * k * bulge(t) * e; top.push(at(t, off(t) - ww * (1 + wt(t)))); bot.push(at(t, off(t) + ww * (1 + wb(t)))); }
    return top.concat(bot.reverse());
  };
  const layer = (pts, fill, edge, lw = 1.2) => { I.fill(pts, fill, { wob: 0.6 }); I.ink(pts, lw, { closed: true, wob: 0.5, color: edge, vary: 0.3 }); };
  const C0 = o.colors || ['#3a56b6', '#5a78d4', '#94aaec', '#dfe4fb', '#fff1d0'];
  layer(band(1.2), C0[0], '#2e48a8');
  layer(band(0.85, 0.02, 0.98, (t) => wid * 0.12 * Math.sin(t * 5)), C0[1], '#3c58bc');
  layer(band(0.5, 0.05, 0.92, (t) => wid * 0.1 * Math.sin(t * 5 + 0.6)), C0[2], '#5a76d0');
  layer(band(0.26, Math.max(0, core - 0.14), Math.min(1, core + 0.5), (t) => wid * 0.08 * Math.sin(t * 6)), C0[3], '#8a9ee6', 1);
  layer(band(0.22, Math.max(0, core - 0.08), core + 0.12), C0[4], '#d8c49a', 1);
  // star clouds: flat pale islands along the band
  for (let k = 0; k < (o.clouds ?? 8); k++) { const t = rn(0.05, 0.9), [x, y] = at(t, rn(-0.5, 0.5) * wid), r = wid * rn(0.08, 0.16); const pts = I.ell(x, y, r * rn(1.4, 2.4), r, 18, Math.atan2(nrm(t)[0], -nrm(t)[1])); I.fill(pts, '#eef1ff', { wob: r * 0.08, op: 0.5 }); }
  for (let k = 0; k < (o.n ?? 900); k++) { const t = I.rng(), g = (I.rng() + I.rng() + I.rng() - 1.5) * wid * 1.2 * bulge(t); const [x, y] = at(t, g), r = I.rng() < 0.93 ? rn(0.4, 0.9) : rn(1, 1.7); I.fill(I.ell(x, y, r, r, 5), I.rng() < 0.15 ? '#ffe7c4' : '#ffffff', { wob: 0, op: rn(0.5, 1) }); }
  // the rift: ragged dark ribbons with inked edges, one main lane and branches
  (o.lanes || [[0.0, 0.7, 0.04, 0.1], [0.1, 0.42, -0.26, 0.06], [0.34, 0.6, 0.24, 0.05]]).forEach(([t0, t1, off0, k]) => {
    const wt = wave(), top = [], bot = [];
    for (let i = 0; i <= 36; i++) { const u = i / 36, t = t0 + (t1 - t0) * u, c = wid * (off0 * (1 - u) + 0.12 * Math.sin(t * 13 + off0 * 9)), ww = wid * k * bulge(t) * Math.sin(Math.PI * u) ** 0.6 * (0.6 + 0.8 * Math.abs(wt(t) * 4)); top.push(at(t, c - ww)); bot.push(at(t, c + ww * rn(0.6, 1.2))); }
    const pts = top.concat(bot.reverse());
    I.fill(pts, o.dust || '#34489e', { wob: 0.6 }); I.ink(pts, 1, { closed: true, wob: 0.5, color: '#22357e', vary: 0.3 });
  });
}
let MWB = 0;
// sea surface: every crest is its own mark: a random depth (perspective), length, lean and kind
// (hump, double hump, breaking hook, long flat swell with foam dots); near crests glow. Hand texture:
// short horizontal dashes, denser and longer toward the viewer.
function glowSea(w, y, h, o = {}) {
  I.rect(-2, y, w + 4, h + 2, PG.linear(0, y, 0, y + h, [[0, o.far || '#4a78cc'], [0.25, NIGHT.sea], [1, o.near || NIGHT.seaNear]]));
  line([[-4, y], [w + 4, y]], 1.2, { taper: [0, 0], color: '#23388e' });
  const G = o.glow ?? 1, amp0 = o.amp ?? 10, step = o.step ?? 150;
  const blurId = `gs${++MWB}`; I.emit(`<defs><filter id="${blurId}" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="${o.blur ?? 3}"/></filter></defs>`);
  for (let k = 0; k < (o.dashes ?? w * h / 260); k++) {
    const t = Math.pow(I.rng(), 0.8), yy = y + h * Math.pow(t, 1.8) * 0.98, L = 3 + t * t * step * rn(0.15, 0.5), x = rn(-20, w + 20);
    line([[x, yy], [x + L * 0.5, yy + rn(-0.6, 0.6)], [x + L, yy]], 0.5 + t * 1.2, { color: I.rng() < 0.5 ? mix('#5f8ae0', '#86a8ee', t) : '#2c4aa4', taper: [0.4, 0.4] });
  }
  const n = o.crests ?? Math.round((o.rows || 8) * w / 70 * (o.crestP ?? 1));
  const crests = [];
  for (let k = 0; k < n; k++) crests.push(Math.pow(I.rng(), 0.75));
  crests.sort((a, b) => a - b).forEach((t) => {
    const yy = y + h * Math.pow(t, 1.8) * 0.97, amp = (0.8 + t * t * amp0) * rn(0.5, 1.4), l = (12 + t * t * step) * rn(0.4, 1.4), x = rn(-l * 0.5, w + l * 0.2);
    const kind = pick(['hump', 'hump', 'double', 'hook', 'flat']), sk = rn(0.3, 0.7);
    let pts;
    if (kind === 'double') pts = [[x, yy], [x + l * 0.2, yy - amp * 0.8], [x + l * 0.4, yy - amp * 0.3], [x + l * 0.62, yy - amp], [x + l, yy + amp * 0.1]];
    else if (kind === 'flat') pts = [[x, yy], [x + l * 0.4, yy - amp * 0.35], [x + l * 1.3, yy - amp * 0.2], [x + l * 1.6, yy]];
    else pts = [[x, yy + amp * 0.25], [x + l * sk * 0.5, yy - amp * 0.6], [x + l * sk, yy - amp], [x + l * (sk + (1 - sk) * 0.5), yy - amp * 0.4], [x + l, yy + amp * 0.2]];
    const lit = t >= (o.glowFrom ?? 0.45) && I.rng() < 0.75;
    if (lit) { I.emit(`<g filter="url(#${blurId})" opacity="${(0.3 + t * 0.55) * G}">`); line(pts, 3 + t * 11, { color: NIGHT.glow, taper: [0.35, 0.35], wob: 0 }); I.emit('</g>'); }
    if (t > 0.35 && kind !== 'flat') I.fill([[x + l * 0.1, yy + amp * 0.2], [x + l * sk, yy - amp * 0.8], [x + l * 0.92, yy + amp * 0.1], [x + l * sk, yy + amp * 0.9]], '#24409a', { wob: 0, op: 0.5 });
    line(pts, (0.7 + t * 2.2) * rn(0.7, 1.2), { color: lit ? mix('#8ff7ea', NIGHT.foam, t) : mix('#7ea2ea', '#a9c2f4', t), taper: [rn(0.2, 0.4), rn(0.2, 0.5)] });
    if (kind === 'hook' && t > 0.4) { const c = [x + l * sk, yy - amp]; line([c, [c[0] + amp * 0.9, c[1] + amp * 0.1], [c[0] + amp * 0.8, c[1] + amp * 0.7]], 0.8 + t * 1.6, { color: lit ? NIGHT.foam : '#a9c2f4', taper: [0.1, 0.6] }); }
    if ((kind === 'flat' || lit) && t > 0.5 && I.rng() < 0.6) for (let f = 0; f < 2 + Math.floor(I.rng() * 4); f++) I.fill(I.ell(x + l * rn(0.2, 0.9), yy - amp * rn(0.5, 1.3) - 2, 0.8 + t * rn(0.6, 1.8), 0.6 + t * 0.9, 6), NIGHT.foam, { wob: 0 });
  });
  if (o.glitter != null) for (let k = 0; k < (o.glitterN ?? 50); k++) { const yy = y + h * Math.pow(I.rng(), 1.4); const x = o.glitter + (I.rng() - 0.5) * (14 + (yy - y) * 0.7); const L = 2 + (yy - y) / h * 8; line([[x - L, yy], [x + L, yy]], 1.2 + (yy - y) / h * 1.2, { color: '#f4f0ff', taper: [0.4, 0.4], op: 0.8 }); }
}
// the surf line: a glowing breaking wave lip across the panel and a lace of foam over wet sand
function surf(w, y, o = {}) {
  const amp = o.amp ?? 6, G = o.glow ?? 1;
  const pts = []; for (let x = -20; x <= w + 20; x += 24) pts.push([x, y + Math.sin(x / 70 + (o.ph || 0)) * amp + Math.sin(x / 23) * amp * 0.3]);
  const blurId = `sf${++MWB}`; I.emit(`<defs><filter id="${blurId}" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="${o.blur ?? 6}"/></filter></defs>`);
  I.emit(`<g filter="url(#${blurId})" opacity="${0.85 * G}">`); line(pts, o.gw ?? 22, { color: NIGHT.glow, taper: [0, 0], wob: 0 }); I.emit('</g>');
  line(pts, o.lw ?? 4, { color: NIGHT.foam, taper: [0, 0] });
  // lace: scallops of foam with sea holes
  for (let x = -10; x < w + 10; x += rn(14, 30)) { const yy = y + Math.sin(x / 70 + (o.ph || 0)) * amp + rn(3, o.lace ?? 12); const rx = rn(6, 16); I.fill(I.ell(x, yy, rx, rx * 0.22, 10), NIGHT.foam, { wob: 0.3, op: rn(0.5, 0.95) }); if (I.rng() < 0.5) I.fill(I.ell(x + rn(-3, 3), yy + 0.5, rx * 0.5, rx * 0.1, 8), '#2f63b8', { wob: 0 }); }
}

// night panels are drawn through a gentle desaturation: the blues keep their value but lose a little
// chroma, so the page reads as night without going neon
function nightGrade(k, fn) {
  const id = `ng${++MWB}`;
  I.emit(`<defs><filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${k}"/></filter></defs><g filter="url(#${id})">`);
  fn();
  I.emit('</g>');
}

// ---------------------------------------------------------------- ballroom extras
const EXTRA = {
  bearded: { face: 'bearded', skin: '#c89070', hair: '#3a2c24', hairStyle: 'short', R: 22, age: 0.5, beard: '#3a2c24' },
  woman: { face: 'woman', skin: '#f0c9a8', hair: '#8a4a2a', hairStyle: 'long', R: 22, age: 0.3, lashes: 2 },
  woman2: { face: 'woman', skin: '#a8704a', hair: '#1f1a1c', hairStyle: 'bun', R: 22, age: 0.35, lashes: 2 },
  granny: { face: 'granny', skin: '#e3b08a', hair: '#dcd8d0', hairStyle: 'bun', R: 22, age: 0.8, glasses: '#6b4a2e' },
  oldman: { face: 'oldman', skin: '#8a5a3e', hair: '#e6e2da', hairStyle: 'short', hairline: -1.1, R: 22, age: 0.9, moustache: '#e6e2da', browCol: '#e6e2da' },
  man: { face: 'bearded', skin: '#f0cfa8', hair: '#c8a060', hairStyle: 'short', R: 22, age: 0.35 },
};
const guest = (head, top, bottom) => ({ H: 3.6, head, top, bottom, shoes: '#1a1418' });
const TUX = { color: '#1d1a24', sleeve: 'long', type: 'coat', collar: '#f4f0e6' };
// a guest seen from behind, standing and clapping above the head
function clapper(ch, x, headY, s, o = {}) {
  const yaw = o.yaw ?? 165;
  const y = headY - (F.rig(ch, { x, y: 0, s, yaw }).headC[1]);
  const r0 = F.rig(ch, { x, y, s, yaw });
  const u = r0.unit;
  const hc = r0.headC, lean = o.lean ?? 0;
  const cx = hc[0] + (o.hx ?? 0) * u, cy = hc[1] - (o.hy ?? 0.8) * u;
  const open = o.open ?? 0.035;
  F.fig(ch, { x, y, s, yaw, lean, shadow: false, reachN: [cx + open * u, cy], reachF: [cx - open * u, cy + 0.02 * u], bendN: 1, bendF: -1, handN: 'flat', handF: 'flat', handAngN: -90 + (o.tilt ?? 24), handAngF: -90 - (o.tilt ?? 24), head: { yaw: yaw + (o.hyaw ?? 0), pitch: 4 } });
  if (o.ticks !== false) PG.ticks(cx, cy - 0.1 * u, 0.32 * u, 3, -160, -20, 0.2 * u);
}

// ---------------------------------------------------------------- title
function title(y0) {
  const words = [['THE', 60, 118, y0 + 70, '#e2b24a'], ['GREAT', 118, 116, y0 + 172, '#1c2f86'], ['OCEAN', 118, 418, y0 + 172, '#1f9aa8']];
  words.forEach(([t, sz, x, y, c]) => PG.sfx(x, y, t, { size: sz, color: c, anchor: 'start', rot: -2, sw: 3, ls: 3 }));
  const wy = y0 + 196;
  I.ink([[110, wy], [260, wy - 10], [420, wy + 4], [560, wy - 8], [690, wy + 2]], 6, { color: '#1f9aa8', taper: [0.1, 0.6] });
  credits(118, y0 + 228, [['WORDS BY ', INK], ['ISAAC NEWTON', '#1f9aa8'], ['      ART BY ', INK], ['CLAUDE', '#e2b24a']]);
  // spot: an old hand holding a shell up to the milky way, over a glowing sea
  I.grp(`translate(800 ${y0 + 118})`, () => {
    I.clipPoly(I.ell(0, 0, 84, 84, 40), () => {
      I.rect(-90, -90, 180, 180, PG.linear(0, -84, 0, 84, [[0, NIGHT.top], [0.6, NIGHT.mid], [1, NIGHT.low]]));
      SC.moon(34, -34, 24, '#fff3c4', NIGHT.mid, { glowK: 1.2 });
      for (let k = 0; k < 30; k++) { const a = I.rng() * 6.28, r = I.rng() * 80; I.fill(I.ell(Math.cos(a) * r, Math.sin(a) * r, 0.8, 0.8, 5), '#fff6dc', { wob: 0 }); }
      sparkle(-44, -40, 6, '#fff6dc'); sparkle(40, -52, 4, '#fff6dc');
      glowSea(170, 40, 50, { rows: 3, glow: 1, glowFrom: 0.3, step: 40, amp: 3 });
      I.emit('<g transform="translate(-85 0)"></g>');
      const dv = [0.34, -0.94], nv = [0.94, 0.34], wr = [8, 44];
      const at = (t, o) => [wr[0] + dv[0] * t + nv[0] * o, wr[1] + dv[1] * t + nv[1] * o];
      cel([at(-2, -9), at(-2, 9), at(-60, 11), at(-60, -10)], C.ada.head.skin, { w: 2.4, k: 0.8 });
      cel([at(-22, -13), at(-20, 13), at(-90, 18), at(-90, -18)], C.ada.top.color, { w: 2.4, k: 0.8 });
      line([at(-24, -12), at(-22, 12)], 2, { color: GOLD.gold });
      hand(wr[0], wr[1], -70, 3.3, 'pinch', { skin: C.ada.head.skin, old: true, age: 0.8, flip: true, object: (T, sc, A) => { const c = T(A.c); shell(c[0] + 2, c[1] - 12, 1.25, '#f7cdb4', 8); } });
    });
    I.ink(I.ell(0, 0, 84, 84, 40), 3, { closed: true, wob: 0.4 });
  });
}

// ---------------------------------------------------------------- page
function page() {
  title(18);
  let y = 270;
  const G = PG.GUT_V;
  let r;

  // 1 — the ballroom: a real event, seen from the back of the hall over the applauding guests
  r = PG.row(y, 440, [1]);
  PG.panel(rec('p1', r[0]), null, (w, h) => panel1(w, h), (w, h) => PG.caption(16, 16, ['I DO NOT KNOW WHAT I MAY', 'APPEAR TO THE WORLD,']), PO);
  y += 440 + G;

  // 2 — her polite smile, eyes sliding to the door; 3 — slipping out barefoot
  r = PG.row(y, 340, [1, 1.3]);
  PG.panel(rec('p2', r[0]), null, (w, h) => panel2(w, h), null, PO);
  PG.panel(rec('p3', r[1]), null, (w, h) => panel3(w, h), (w, h) => PG.caption(14, 14, ['BUT TO MYSELF I SEEM TO HAVE BEEN', 'ONLY LIKE A BOY PLAYING', 'ON THE SEA-SHORE,']), PO);
  y += 340 + G;

  // 4 — the beach at night, wide; a torch far away
  r = PG.row(y, 300, [1]);
  PG.panel(rec('p4', r[0]), null, (w, h) => nightGrade(NG, () => panel4(w, h)), null, PO);
  y += 300 + G;

  // 5 — crouched beside the boy with the torch; 6 — hands and a shell
  r = PG.row(y, 350, [1.3, 1]);
  PG.panel(rec('p5', r[0]), null, (w, h) => nightGrade(NG, () => panel5(w, h)), (w, h) => PG.caption(14, 14, ['AND DIVERTING MYSELF IN NOW AND', 'THEN FINDING A SMOOTHER PEBBLE']), PO);
  PG.panel(rec('p6', r[1]), null, (w, h) => panel6(w, h), (w, h) => PG.caption(14, 14, ['OR A PRETTIER SHELL', 'THAN ORDINARY,']), PO);
  y += 350 + G;

  // 7 — a pause: the two of them from behind, looking up
  const ph = 250;
  r = PG.row(y, ph, [1]);
  PG.panel(rec('p7', r[0]), null, (w, h) => nightGrade(NG, () => panel7(w, h)), null, PO);
  y += ph + G;

  // 8 — the great ocean
  const sh = 720;
  r = PG.row(y, sh, [1]);
  PG.panel(rec('p8', r[0]), null, (w, h) => nightGrade(NG, () => panel8(w, h)), (w, h) => {
    PG.caption(30, 30, ['WHILST THE GREAT OCEAN OF TRUTH', 'LAY ALL UNDISCOVERED BEFORE ME.'], { size: 19, attrib: '– ISAAC NEWTON' });
  }, PO);
  y += sh;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, "Newton, as reported in Spence's Anecdotes (1820) and Brewster's Memoirs (1855). A homage to Zen Pencils by Gavin Aung Than.", { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 2', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

// ================================================================ panel 1: the ballroom
function panel1(w, h) {
  // camera close to the stage: the hall is drawn at 1.35x about the stage
  I.emit(`<g transform="translate(${I.n1(w * 0.5)} ${I.n1(h * 0.28)}) scale(1.35) translate(${I.n1(-w * 0.5)} ${I.n1(-h * 0.28)})">`);
  const vp = [w * 0.5, h * 0.33];
  const bx0 = w * 0.2, bx1 = w * 0.8, by0 = h * 0.02, by1 = h * 0.66;
  // perspective helpers: a point on the left/right wall at screen x, height v (0 floor .. 1 top)
  const wallY = (x, yb) => vp[1] + (yb - vp[1]) * (x - vp[0]) / ((x < vp[0] ? bx0 : bx1) - vp[0]);
  const wp = (x, v) => { const yt = wallY(x, by0), yf = wallY(x, by1); return [x, yf + (yt - yf) * v]; };
  // back wall, side walls, ceiling
  I.rect(-2, -2, w + 4, h + 4, GOLD.ceil);
  I.fill([[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]], PG.linear(0, by0, 0, by1, [[0, GOLD.wallDark], [0.55, GOLD.wall], [1, GOLD.wallLit]]), { lin: true, wob: 0 });
  I.fill([wp(-2, 1), [bx0, by0], [bx0, by1], wp(-2, 0)], PG.linear(0, 0, bx0, 0, [[0, '#d38e38'], [1, '#eab25a']]), { lin: true, wob: 0 });
  I.fill([wp(w + 2, 1), [bx1, by0], [bx1, by1], wp(w + 2, 0)], PG.linear(w, 0, bx1, 0, [[0, '#d38e38'], [1, '#eab25a']]), { lin: true, wob: 0 });
  line([[bx0, by0], [bx0, by1]], 1.6, { color: shade(GOLD.wall, 0.4), taper: [0, 0] });
  line([[bx1, by0], [bx1, by1]], 1.6, { color: shade(GOLD.wall, 0.4), taper: [0, 0] });
  // side walls: tall arched windows full of blue night (the sea is out there) between gilt pilasters
  [[0.02, 0.1], [0.12, 0.17]].forEach(([u0, u1]) => [[u0 * w, u1 * w], [w - u1 * w, w - u0 * w]].forEach(([xa, xb]) => {
    const pts = [wp(xa, 0.22), wp(xb, 0.22)];
    const topA = wp(xa, 0.78), topB = wp(xb, 0.78);
    const arch = []; for (let k = 0; k <= 10; k++) { const t = k / 10; const x = xb + (xa - xb) * t; const base = wp(x, 0.78); arch.push([x, base[1] - Math.sin(t * Math.PI) * Math.abs(xb - xa) * 0.9]); }
    const win = [pts[0], pts[1], topB, ...arch, topA];
    cel(win.map(([x, yy]) => [x + (xa < w / 2 ? -3 : 3), yy - 2]), GOLD.pil, { w: 0, lin: true });
    shape(win, PG.linear(0, topA[1] - 30, 0, pts[0][1], [[0, NIGHT.top], [0.7, NIGHT.mid], [1, NIGHT.low]]), { w: 2, lin: true });
    I.clipPoly(win, () => { for (let k = 0; k < 8; k++) I.fill(I.ell(rn(Math.min(xa, xb), Math.max(xa, xb)), rn(topA[1] - 20, pts[0][1] - 10), 0.9, 0.9, 5), '#fff6dc', { wob: 0 }); line([wp((xa + xb) / 2, 0.22), [(xa + xb) / 2, wp((xa + xb) / 2, 0.78)[1] - Math.abs(xb - xa) * 0.9]], 1.6, { color: GOLD.pil, taper: [0, 0] }); });
  }));
  [0.0, 0.1, 0.175].forEach((u) => [u * w + 4, w - u * w - 4].forEach((x) => { const a = wp(x - 5, 0), b = wp(x - 5, 1.05), c = wp(x + 5, 1.05), d = wp(x + 5, 0); cel([b, c, d, a], GOLD.pil, { w: 1.6, lin: true, shade: 0.12 }); }));
  // back wall: two tall arched windows onto the night, a coffered frieze, and the stage with its drape
  [[w * 0.245, w * 0.31], [w * 0.69, w * 0.755]].forEach(([xa, xb]) => {
    const yt = h * 0.2, yb = h * 0.55, rr = (xb - xa) / 2;
    const win = [[xa, yb], [xb, yb], [xb, yt]].concat(I.arc((xa + xb) / 2, yt, rr, rr, 0, -Math.PI, 12).map(([x, yy]) => [x, yy])).concat([[xa, yt]]);
    shape(win.map(([x, yy]) => [x + (x < w / 2 ? 1 : -1) * 0, yy]), GOLD.pil, { w: 0 });
    const inner = [[xa + 5, yb], [xb - 5, yb], [xb - 5, yt]].concat(I.arc((xa + xb) / 2, yt, rr - 5, rr - 5, 0, -Math.PI, 12)).concat([[xa + 5, yt]]);
    shape(inner, PG.linear(0, yt - rr, 0, yb, [[0, NIGHT.top], [0.6, NIGHT.mid], [1, NIGHT.low]]), { w: 2 });
    I.clipPoly(inner, () => { for (let k = 0; k < 10; k++) I.fill(I.ell(rn(xa, xb), rn(yt - rr, yb - 20), 0.9, 0.9, 5), '#fff6dc', { wob: 0 }); sparkle(rn(xa + 8, xb - 8), yt + 6, 3.5, '#fff6dc'); I.rect(xa, yb - 22, xb - xa, 22, '#12297a'); line([[xa, yb - 22], [xb, yb - 22]], 1, { color: NIGHT.glow }); line([[(xa + xb) / 2, yt - rr], [(xa + xb) / 2, yb]], 2, { color: GOLD.pil, taper: [0, 0] }); line([[xa, yt + 20], [xb, yt + 20]], 2, { color: GOLD.pil, taper: [0, 0] }); });
    I.ink(win, 1.8, { closed: true, wob: 0.3 });
  });
  I.fill([[bx0, by0], [bx1, by0], [bx1, by0 + 16], [bx0, by0 + 16]], shade(GOLD.wall, 0.18), { lin: true, wob: 0 });
  line([[bx0, by0 + 16], [bx1, by0 + 16]], 1.6, { taper: [0, 0], color: shade(GOLD.wall, 0.5) });
  // moulded wall panels and sconces on the back wall
  [[w * 0.335, w * 0.385], [w * 0.615, w * 0.665]].forEach(([xa, xb]) => { I.ink([[xa, h * 0.3], [xb, h * 0.3], [xb, h * 0.52], [xa, h * 0.52]], 1.2, { closed: true, lin: true, color: shade(GOLD.wall, 0.35), wob: 0.3 }); const sx = (xa + xb) / 2; PG.glow(sx, h * 0.25, 26, '#fff3c4', 0.6); shape([[sx - 4, h * 0.27], [sx + 4, h * 0.27], [sx + 2, h * 0.29], [sx - 2, h * 0.29]], GOLD.gold, { w: 1.2, lin: true }); I.rect(sx - 1.3, h * 0.24, 2.6, h * 0.03, '#fffaf0'); I.fill(I.ell(sx, h * 0.235, 1.6, 2.6, 8), '#ffcf5a', { wob: 0 }); });
  // proscenium drape and side curtains framing the stage
  const sx0 = w * 0.34, sx1 = w * 0.66, sTop = h * 0.585, sFront = h * 0.665;
  SC.drape(bx0, by0 + 14, bx1 - bx0, 40, { color: GOLD.red, swags: 4 });
  SC.banner(w * 0.395, h * 0.19, w * 0.21, 28, '#1c2f86', 'LIFETIME ACHIEVEMENT', { size: 12.5, color: '#fbe7a8' });
  // spotlight
  I.emit('<g style="mix-blend-mode:screen">');
  I.fill([[w * 0.58, -4], [w * 0.64, -4], [w * 0.545, sTop + 4], [w * 0.455, sTop + 4]], PG.linear(0, 0, 0, sTop, [[0, '#fff6d8', 0.1], [1, '#fff6d8', 0.55]]), { lin: true, wob: 0 });
  I.emit('</g>');
  // stage: boards, front apron, steps
  const st = [[sx0 - 30, sTop], [sx1 + 30, sTop], [sx1 + 36, sFront], [sx0 - 36, sFront]];
  cel(st, '#a0522d', { w: 2.2, lin: true });
  I.clipPoly([[sx0 - 30, sTop], [sx1 + 30, sTop], [sx1 + 32, sTop + 10], [sx0 - 32, sTop + 10]], () => I.rect(0, 0, w, h, '#c46a3a'));
  line([[sx0 - 32, sTop + 10], [sx1 + 32, sTop + 10]], 1.6, { taper: [0, 0] });
  for (let k = 1; k < 10; k++) line([[sx0 - 34 + k * (sx1 - sx0 + 68) / 10, sTop + 12], [sx0 - 34 + k * (sx1 - sx0 + 68) / 10, sFront - 2]], 1, { color: '#6e3420', taper: [0, 0] });
  I.fill(I.ell(w * 0.5, sTop + 4, 56, 7, 20), '#fff3c4', { wob: 0, op: 0.6 });
  // lectern with a microphone
  const lx = w * 0.6;
  cel([[lx - 12, sTop + 2], [lx + 12, sTop + 2], [lx + 10, sTop - 40], [lx - 10, sTop - 40]], '#6e3a24', { w: 1.8, lin: true });
  shape([[lx - 15, sTop - 44], [lx + 15, sTop - 44], [lx + 13, sTop - 39], [lx - 13, sTop - 39]], '#8a4a2e', { w: 1.6, lin: true });
  I.fill(I.ell(lx, sTop - 22, 5, 5, 12), GOLD.gold, { wob: 0 });
  line([[lx - 4, sTop - 44], [lx - 12, sTop - 58]], 1.6, { taper: [0, 0.2] });
  I.fill(I.ell(lx - 13, sTop - 60, 2.5, 3.5, 8, 0.6), '#2a2228', { wob: 0 });
  // Ada, small in the light, lifting the trophy a little, polite
  const s = 0.44;
  const tgt = [w * 0.5 + 14, sTop - 86];
  const a = F.fig(C.ada, { ...F.POSES.stand(C.ada, {}), x: w * 0.5, y: sTop + 2, s, yaw: 12, reachN: tgt, bendN: 1, handN: 'grip', handAngN: -80, armF: [10, 30, 10], handF: 'relaxed', head: { yaw: 12, pitch: 2, mood: 'smile' } });
  trophy(a.armN[2][0] + 1, a.armN[2][1] + 8, 0.5, { sparkle: true });
  SC.chandelier(w * 0.325, 10, 1.05);
  SC.chandelier(w * 0.675, 10, 1.05);
  I.emit('</g>');
  // the audience on its feet, from behind: a hazed back crowd, then a row of real figures, all different,
  // most of them clapping over their heads (hands on arms), a few turned to each other
  const keep = SC.CLOTHES.slice(); SC.CLOTHES.splice(0, SC.CLOTHES.length, '#1d1a24', '#1d1a24', '#2a2a3a', '#243a6a', '#6a1f3a', '#1f5a5a', '#c8903a', '#3a2a4a', '#8a2a2a', '#f0e6d0');
  SC.crowd(-20, w + 20, h * 0.95, { rows: 2, s: 11, view: 'back', haze: '#c98a40', hazeMax: 0.45, seed: 7, density: 1.1, rowGap: 1.6 });
  SC.CLOTHES.splice(0, SC.CLOTHES.length, ...keep);
  const HAIR = ['#1f1a1c', '#3a2418', '#8a4a2a', '#c8a060', '#dcd8d0', '#5a3422', '#2a1f24', '#b9b4ac'];
  const SKIN = ['#f0c9a8', '#8a5a3e', '#c89070', '#e3b08a', '#a8704a', '#5e3a28', '#f4d2b4'];
  const people = [
    { face: 'bearded', hairStyle: 'short', beard: 1, top: TUX },
    { face: 'woman', hairStyle: 'bun', top: { color: '#6a1f3a', sleeve: 'none' }, dress: 1 },
    { face: 'oldman', hairStyle: 'short', hairline: -1.1, moustache: 1, glasses: '#2a2228', top: { color: '#243a6a', sleeve: 'long', type: 'coat', collar: '#f4f0e6' } },
    { face: 'woman', hairStyle: 'long', top: { color: '#1f7a7a', sleeve: 'none' }, dress: 1 },
    { face: 'granny', hairStyle: 'bun', glasses: '#8a6a3a', top: { color: '#5a2a5a', sleeve: 'long' }, dress: 1 },
    { face: 'bearded', hairStyle: 'short', top: TUX },
    { face: 'woman', hairStyle: 'bob', top: { color: '#c8903a', sleeve: 'none' }, dress: 1 },
    { face: 'oldman', hairStyle: 'bald', top: TUX },
    { face: 'oldman', hairStyle: 'bald', glasses: '#2a2228', top: { color: '#2a2a3a', sleeve: 'long', type: 'coat', collar: '#f4f0e6' } },
    { face: 'woman', hairStyle: 'bun', glasses: '#c8342e', top: { color: '#1d1a24', sleeve: 'none' }, dress: 1 },
  ];
  const row = [ // x, head y (fraction), scale, yaw, clapping, person
    [0.03, 0.8, 1.45, 170, 1, 0], [0.15, 0.85, 1.15, 125, 0, 2], [0.26, 0.8, 1.3, 160, 1, 1], [0.37, 0.87, 1.1, 215, 1, 4],
    [0.63, 0.86, 1.15, 145, 1, 8], [0.74, 0.8, 1.3, 200, 1, 5], [0.85, 0.85, 1.15, 235, 0, 6], [0.96, 0.79, 1.45, 185, 1, 3],
  ];
  row.forEach(([u, v, sc, yaw, clap, pi], i) => {
    const pp = people[pi];
    const head = { face: pp.face, skin: SKIN[(i * 3 + 1) % SKIN.length], hair: pp.hairline ? '#dcd8d0' : HAIR[(i * 5) % HAIR.length], hairStyle: pp.hairStyle, R: 22, age: pp.face === 'granny' || pp.face === 'oldman' ? 0.8 : 0.4, glasses: pp.glasses, hairline: pp.hairline, moustache: pp.moustache ? '#dcd8d0' : undefined, beard: pp.beard ? HAIR[(i * 5) % HAIR.length] : undefined };
    const ch = guest(head, pp.top, { type: pp.dress ? 'dress' : 'pants', color: pp.top.color });
    if (clap) clapper(ch, w * u, h * v, sc, { yaw, hx: (i % 2 ? 0.08 : -0.06), tilt: 18 + (i % 3) * 6, ticks: i % 2 === 0 });
    else { const y = h * v - F.rig(ch, { x: 0, y: 0, s: sc, yaw }).headC[1]; F.fig(ch, { x: w * u, y, s: sc, yaw, shadow: false, head: { yaw: yaw < 180 ? yaw - 60 : yaw + 60, pitch: 4, mood: 'joy' } }); }
  });
  // applause: hand-lettered, each one different
  [['CLAP', w * 0.2, h * 0.5, -12, 26], ['CLAP', w * 0.83, h * 0.46, 9, 30], ['clap', w * 0.5, h * 0.93, -3, 20], ['CLAP!', w * 0.63, h * 0.64, 6, 18]].forEach(([t, x, yy, rot, sz], i) => {
    PG.sfx(x, yy, t.toUpperCase(), { size: sz, color: i % 2 ? '#fff3c4' : '#ffffff', rot, sw: 2.2 });
    PG.ticks(x, yy - sz * 0.35, sz * 1.3, 4, -170 + i * 10, -10 - i * 8, sz * 0.35);
  });
}

// ================================================================ panel 2: the polite smile
function panel2(w, h) {
  I.rect(-2, -2, w + 4, h + 4, PG.radial(w * 0.3, h * 0.3, w * 1.1, [[0, '#ffe3a0'], [0.6, GOLD.wall], [1, GOLD.wallDark]]));
  // chandelier bokeh
  for (let k = 0; k < 14; k++) { const rr = rn(10, 26); I.fill(I.ell(rn(0, w), rn(0, h * 0.55), rr, rr, 18), '#fff6d8', { op: rn(0.12, 0.3), wob: 0 }); }
  // the balcony door edge, just in frame at the right: blue night
  I.fill([[w * 0.9, -2], [w + 4, -2], [w + 4, h + 2], [w * 0.9, h + 2]], PG.linear(0, 0, 0, h, [[0, NIGHT.top], [1, NIGHT.mid]]), { lin: true, wob: 0 });
  I.clipRect(w * 0.9, 0, w, h, () => { for (let k = 0; k < 6; k++) I.fill(I.ell(rn(w * 0.9, w), rn(0, h * 0.6), 0.9, 0.9, 5), '#fff6dc', { wob: 0 }); SC.moon(w * 0.955, h * 0.16, 9, '#fff3c4', NIGHT.top); I.rect(w * 0.9, h * 0.62, w * 0.1, h * 0.38, NIGHT.sea); [0.66, 0.72, 0.8, 0.9].forEach((v, i) => line([[w * 0.905, h * v], [w * 0.96 + i * 3, h * v - 2]], 1.4 + i * 0.5, { color: i > 1 ? NIGHT.glow : '#8fb0ee' })); });
  shape([[w * 0.9 - 8, -4], [w * 0.9 + 2, -4], [w * 0.9 + 2, h + 4], [w * 0.9 - 8, h + 4]], GOLD.pil, { w: 2, lin: true });
  // her shoulders in the gown (scoop neckline, gold beads); the head draws its own neck, which runs down
  // into a chest shape whose top is hidden behind the neck (no hard edge under the jaw)
  const hx = w * 0.44, hy = h * 0.42, s = 3.3;
  const g = C.ada.top.color, skin = C.ada.head.skin;
  cel([[hx - 34, h * 0.74], [hx + 30, h * 0.74], [hx + 56, h * 0.8], [hx + 96, h * 0.84], [hx + 60, h * 0.95], [hx - 70, h * 0.95], [hx - 96, h * 0.86], [hx - 58, h * 0.8]], skin, { w: 2.4, k: 1.5, shade: 0.16, lx: -7, ly: -6 });
  const gown = [[-10, h + 10], [-6, h * 0.94], [w * 0.1, h * 0.86], [hx - 100, h * 0.82], [hx - 66, h * 0.88], [hx - 20, h * 0.96], [hx + 30, h * 0.96], [hx + 72, h * 0.87], [hx + 108, h * 0.82], [w * 0.88, h * 0.88], [w * 0.96, h + 10]];
  cel(gown, g, { w: 3, k: 2 });
  [[hx - 116, h * 0.9, hx - 98, h + 4], [hx + 126, h * 0.9, hx + 116, h + 4]].forEach(([x0, y0, x1, y1]) => line([[x0, y0], [x1, y1]], 1.4, { color: shade(g, 0.4) }));
  I.arc(hx + 2, h * 0.87, 60, 34, 0.35, Math.PI - 0.35, 16).forEach(([x, yy]) => cel(I.ell(x, yy, 3.2, 3.2, 8), GOLD.gold, { w: 0.9, k: 0.2 }));
  HD.head({ ...C.ada.head, lid: 0.12 }, { x: hx, y: hy, s, yaw: -16, pitch: 5, neck: 1.6, look: [1, -0.5], mood: 'neutral', mouth: 'smile' });
  // the trophy she holds up for the room, in the lower-left corner: her hand round the stem, gleaming, ignored
  const ts = 2.6, tx = w * 0.13, tb = h + 12;
  trophy(tx, tb, ts, { sparkle: true });
  hand(tx - 30, tb - 18 * ts + 6, -10, 3.6, 'grip', { skin, old: true, age: 0.8, object: 'bar', objectColor: GOLD.gold });
  // the pull of the door: the night strip glows faintly into the room
  I.emit('<g style="mix-blend-mode:screen">'); PG.glow(w * 0.95, h * 0.4, 90, '#3a60c0', 0.35); I.emit('</g>');
}

// ================================================================ panel 3: slipping out
function panel3(w, h) {
  const floorY = h * 0.86;
  I.rect(-2, -2, w + 4, h + 4, PG.linear(0, 0, 0, floorY, [[0, GOLD.wallDark], [1, GOLD.wall]]));
  // wall panelling
  // wainscot rail
  line([[-4, h * 0.6], [w * 0.5 - 12, h * 0.6]], 2, { color: shade(GOLD.wall, 0.4), taper: [0, 0] });
  I.rect(-2, h * 0.6, w * 0.5 - 10, floorY - h * 0.6, shade(GOLD.wall, 0.1));
  // the balcony: french doors open onto the night; the curtain lifts in the sea wind
  const dx = w * 0.5, dw = w * 0.34, dy = h * 0.1, dh = floorY - h * 0.1;
  I.rect(dx, dy, dw, dh, PG.linear(0, dy, 0, dy + dh, [[0, NIGHT.top], [0.55, NIGHT.mid], [1, NIGHT.low]]));
  I.clipRect(dx, dy, dw, dh, () => {
    SC.stars(dw, dh * 0.5, 30, '#fff6dc', { x0: dx, y0: dy });
    SC.moon(dx + dw * 0.72, dy + dh * 0.18, 9, '#fff3c4', NIGHT.top);
    glowSea(dx + dw, dy + dh * 0.58, dh * 0.24, { rows: 4, glow: 0.4, glowFrom: 0.7, step: 60, amp: 4 });
    I.rect(dx, dy + dh * 0.8, dw, dh * 0.2, '#2a3a86');
    // balustrade
    line([[dx, dy + dh * 0.74], [dx + dw, dy + dh * 0.74]], 5, { color: '#e8d6a8', taper: [0, 0] });
    for (let x = dx + 6; x < dx + dw; x += 14) shape([[x - 3, dy + dh * 0.75], [x + 3, dy + dh * 0.75], [x + 4, dy + dh * 0.86], [x - 4, dy + dh * 0.86]], '#d9c492', { w: 1.2, lin: true });
    line([[dx, dy + dh * 0.86], [dx + dw, dy + dh * 0.86]], 3, { color: '#e8d6a8', taper: [0, 0] });
  });
  // door frame and the two leaves (the right one swung wide)
  shape([[dx - 12, dy - 12], [dx + dw + 12, dy - 12], [dx + dw + 12, floorY], [dx + dw, floorY], [dx + dw, dy], [dx, dy], [dx, floorY], [dx - 12, floorY]], GOLD.pil, { w: 2, lin: true });
  const leaf = (x0, x1, top, bot) => { cel([[x0, dy + top], [x1, dy + top * 0.3], [x1, floorY + bot], [x0, floorY]], '#f6e6be', { w: 2, lin: true, shade: 0.12 }); };
  leaf(dx + dw, dx + dw + dw * 0.3, 0, 8);
  const gl = [[dx + dw + 8, dy + 14], [dx + dw + dw * 0.3 - 8, dy + 12], [dx + dw + dw * 0.3 - 8, floorY - 20], [dx + dw + 8, floorY - 16]];
  shape(gl, '#3a55a8', { w: 1.4, lin: true });
  line([[dx + dw + 8 + (dw * 0.3 - 16) / 2, dy + 13], [dx + dw + 8 + (dw * 0.3 - 16) / 2, floorY - 18]], 3, { color: '#f6e6be', taper: [0, 0] });
  // curtain billowing in off the open leaf: gathered on the rod, flaring out, a zig-zag hem, folds that
  // start in the gathers and open toward the hem
  const cx0 = dx + dw - 4, top = dy - 14;
  const hem = [[cx0 + 96, dy + dh * 0.7], [cx0 + 78, dy + dh * 0.76], [cx0 + 70, dy + dh * 0.72], [cx0 + 54, dy + dh * 0.8], [cx0 + 44, dy + dh * 0.75], [cx0 + 28, dy + dh * 0.84], [cx0 + 18, dy + dh * 0.8], [cx0 + 4, dy + dh * 0.88]];
  const cu = [[cx0 - 2, top], [cx0 + 34, top], [cx0 + 52, dy + dh * 0.2], [cx0 + 84, dy + dh * 0.46], [cx0 + 100, dy + dh * 0.64]].concat(hem).concat([[cx0 + 2, dy + dh * 0.5], [cx0 - 4, dy + dh * 0.2]]);
  cel(cu, '#f3ead6', { w: 2.2, k: 1.4, shade: 0.16 });
  [[6, 7], [14, 5], [22, 3], [30, 1]].forEach(([tx, hi]) => line([[cx0 + tx, top + 4], [cx0 + tx * 1.6 + 6, dy + dh * 0.3], hem[hi]], 1.2, { color: shade('#f3ead6', 0.4), taper: [0.1, 0.5] }));
  for (let k = 0; k < 7; k++) line([[cx0 + k * 5, top], [cx0 + k * 5 + 2, top + 10]], 1, { color: shade('#f3ead6', 0.4) });
  line([[dx - 18, top], [dx + dw + 48, top]], 3.4, { color: GOLD.gold, taper: [0, 0] });
  I.fill(I.ell(dx + dw + 50, top, 4, 4, 10), GOLD.gold, { wob: 0 });
  // floor: boards receding to the vanishing point at the door (eye level at mid-panel)
  const vp = [dx + dw * 0.5, h * 0.48];
  I.rect(-2, floorY, w + 4, h - floorY + 2, '#b8683a');
  I.clipRect(-2, floorY, w + 4, h - floorY + 2, () => {
    for (let k = -14; k <= 14; k++) { const xb = vp[0] + k * 70; line([[vp[0] + (xb - vp[0]) * (floorY - vp[1]) / (h + 40 - vp[1]), floorY], [xb, h + 40]], 1, { color: '#8a4a2a', taper: [0, 0] }); }
    [0.25, 0.55].forEach((t) => { const yy = floorY + (h - floorY) * t; line([[-4, yy], [w + 4, yy]], 0.9, { color: '#9a5630', taper: [0, 0] }); });
  });
  line([[-4, floorY], [w + 4, floorY]], 2, { taper: [0, 0] });
  // gilt chair in the foreground, the trophy left on its seat
  const cs = 1.55, cx = w * 0.06, cy = h * 0.7;
  const seat = goldChair(cx, cy, floorY + 40, cs);
  trophy(seat[0] + 2, seat[1] + 4, 1.25, { sparkle: true });
  PG.glow(seat[0], seat[1] - 36, 60, '#fff6d8', 0.4);
  // Ada tiptoeing out, barefoot, her shoes dangling from one hand, a glance back over her shoulder
  const pose = F.POSES.sneakBarefoot(C.ada, { x: dx - 10, y: floorY + 6, s: 0.66, yaw: 60 });
  const a = F.fig({ ...C.ada, shoes: C.ada.head.skin }, { ...pose, reachN: null, armN: [-14, 20, 10], handN: 'grip', holdN: null, armF: [52, 34, 20], handF: 'relaxed', head: { yaw: -30, pitch: 0, look: [-0.8, 0.05], mood: 'smile', mouth: 'smirk' } });
  heels(a.armN[2][0], a.armN[2][1] + 3, 1.1);
}
// a pair of gold evening shoes hanging by their straps from (x, y)
function heels(x, y, s = 1) {
  // two gold court shoes hooked on the fingers by their heels, hanging toe down
  [[-3, 1, 96], [5, 3, 78]].forEach(([dx, dy, rot], i) => I.grp(`translate(${I.n1(x + dx * s)} ${I.n1(y + dy * s)}) rotate(${rot}) scale(${s * 0.62})`, () => {
    const g = i ? GOLD.gold : shade(GOLD.gold, 0.1);
    shape([[1, 7], [3, 7.5], [1, 19], [-1.5, 19]], shade(g, 0.35), { w: 1.6, lin: true });
    cel([[0, 0], [-1.5, 5], [0, 8], [5, 9.5], [12, 13], [20, 17], [27, 17.5], [28, 15], [24, 12], [15, 8], [8, 2.5]], g, { w: 2.2, k: 0.5 });
    I.fill([[1.5, 1.5], [8, 3.4], [14, 7.6], [9, 6.4], [2, 4]], '#5a3a1a', { wob: 0.2 });
    line([[16, 10.5], [24, 14.5]], 1.4, { color: '#fff3c4' });
  }));
}
// a gilt ballroom chair in 3/4 view (seat front-left corner at (x, y)); returns the seat centre
function goldChair(x, y, yFloor, s) {
  const gld = '#e6b64a', P = (u, v) => [x + u * s, y + v * s];
  const fl = P(0, 0), fr = P(46, 5), br = P(60, -9), bl = P(14, -13);
  const leg = (p, dy, w0 = 2.6) => shape([[p[0] - w0 * s, p[1]], [p[0] + w0 * s, p[1]], [p[0] + w0 * 0.6 * s + (p[0] - x) * 0.02, p[1] + dy], [p[0] - w0 * 0.6 * s + (p[0] - x) * 0.02, p[1] + dy]], gld, { w: 1.8, lin: true, cel: true });
  // back posts and rails, behind the seat
  leg(br, yFloor - br[1] - 10 * s); leg(bl, yFloor - bl[1] - 12 * s);
  const post = (p) => cel([[p[0] - 2.6 * s, p[1]], [p[0] + 2.6 * s, p[1]], [p[0] + 3.4 * s, p[1] - 78 * s], [p[0] - 1.8 * s, p[1] - 78 * s]], gld, { w: 1.8, lin: true, k: 0.4 });
  post(bl); post(br);
  [[-74, 5], [-56, 1.6], [-40, 1.6]].forEach(([v, t]) => shape([[bl[0], bl[1] + v * s - t * s], [br[0], br[1] + v * s - t * s + 4 * s], [br[0], br[1] + v * s + t * s + 4 * s], [bl[0], bl[1] + v * s + t * s]], gld, { w: 1.6, lin: true }));
  // cushion
  cel([fl, fr, br, bl], GOLD.red, { w: 2, lin: true, k: 0.6 });
  shape([fl, fr, [fr[0], fr[1] + 7 * s], [fl[0], fl[1] + 7 * s]], GOLD.redDark, { w: 1.8, lin: true });
  shape([fl, fr, [fr[0], fr[1] + 3 * s], [fl[0], fl[1] + 3 * s]], gld, { w: 1.4, lin: true });
  leg([fl[0], fl[1] + 7 * s], yFloor - fl[1]); leg([fr[0], fr[1] + 7 * s], yFloor - fr[1] + 4 * s);
  return [(fl[0] + br[0]) / 2, (fl[1] + br[1]) / 2 + 2];
}

// ================================================================ panel 4: the beach at night
function panel4(w, h) {
  const hz = h * 0.42;
  nightSky(w, h, { horizon: hz });
  SC.stars(w, hz, 120, '#fff6dc', { max: 1.6 });
  SC.moon(w * 0.62, h * 0.15, 11, '#fff3c4', NIGHT.mid, { glowK: 0.8 });
  glowSea(w, hz, h * 0.34, { rows: 7, glow: 0.55, glowFrom: 0.55, step: 130, glitter: w * 0.62, glitterN: 40 });
  // beach
  const by = h * 0.72;
  const top = [[-10, by + 6], [w * 0.3, by], [w * 0.7, by + 4], [w + 10, by - 2]];
  shape(top.concat([[w + 10, h + 10], [-10, h + 10]]), PG.linear(0, by, 0, h, [[0, NIGHT.wet], [0.25, NIGHT.sand], [1, NIGHT.sandLit]]), { w: 1.8 });
  surf(w, by + 1, { amp: 3, glow: 0.6, gw: 12, lw: 2.4, lace: 6, blur: 4 });
  for (let k = 0; k < 14; k++) { const yy = rn(by + 20, h - 6), x = rn(w * 0.3, w); line([[x, yy], [x + rn(20, 50), yy + rn(-1, 1)]], 1, { color: '#5a6cb8', taper: [0.4, 0.4] }); }
  for (let k = 0; k < 16; k++) { const x = w * 0.62 + rn(-12, 12), yy = by + 8 + rn(0, 14); line([[x - 5, yy], [x + 5, yy]], 1.2, { color: '#f4f0ff', taper: [0.4, 0.4], op: 0.6 }); }
  // the headland with the grand hotel lit up on top, far left; a stair zig-zags down to the sand
  hotel(w, h, by);
  // her footprints from the steps, and her small figure walking along the waterline
  footprints(w * 0.29, h * 0.76, w * 0.47, h * 0.86, 10, '#2a3a86', 0.9);
  const aw = F.fig({ ...C.ada, shoes: C.ada.head.skin }, { ...F.POSES.walk(C.ada, {}), x: w * 0.5, y: h * 0.87, s: 0.28, yaw: 70, barefoot: true, handN: 'grip', head: { yaw: 70 } });
  heels(aw.armN[2][0], aw.armN[2][1] + 1, 0.42);
  // far away: a small warm torch and a tiny figure
  const tx = w * 0.86, ty = h * 0.86;
  I.emit(`<g transform="translate(${tx} ${ty}) scale(1 0.35)">`); PG.glow(0, 0, 70, TORCH.warm, 0.7); I.emit('</g>');
  F.fig(C.toby, { ...F.POSES.crouchSand(C.toby, {}), x: tx + 6, y: ty, s: 0.2, yaw: -50, head: { yaw: -50 } });
  PG.glow(tx - 6, ty - 4, 10, '#fffbe0', 1);
}

function hotel(w, h, by) {
  // far rock layer, near rock layer with strata, shrubs on the crest
  const far = crag([[-10, h * 0.28], [w * 0.2, h * 0.3], [w * 0.25, h * 0.42], [w * 0.31, h * 0.54], [w * 0.36, by - 2]], 5).concat([[-10, by + 4]]);
  shape(far, '#1f2d7a', { w: 1.6, lin: true });
  const near = crag([[-10, h * 0.3], [w * 0.15, h * 0.31], [w * 0.19, h * 0.4], [w * 0.2, h * 0.5], [w * 0.25, h * 0.6], [w * 0.28, by + 6]], 7).concat([[-10, by + 12]]);
  cel(near, '#15206a', { w: 2, k: 2, shade: 0.3, lin: true });
  [[0.24, 18, 8], [0.275, 11, 6], [0.3, 7, 4]].forEach(([u, rx, ry]) => cel(crag(I.ell(w * u, by + 5 - ry * 0.4, rx, ry, 8).slice(4).concat([[w * u - rx, by + 6], [w * u + rx, by + 6]]), 2), '#1a2670', { w: 1.6, k: 0.6, shade: 0.3, lin: true }));
  [[0.02, 0.4, 0.16, 0.42], [0.04, 0.52, 0.2, 0.55], [0.08, 0.64, 0.24, 0.66], [0.2, 0.4, 0.28, 0.5]].forEach(([x0, y0, x1, y1]) => line([[w * x0, h * y0], [(w * x0 + w * x1) / 2, h * (y0 + y1) / 2 + 3], [w * x1, h * y1]], 1.1, { color: '#3a4aa0' }));
  // stair with a rail, zig-zagging down the rock face
  const st = [[w * 0.16, h * 0.32], [w * 0.2, h * 0.42], [w * 0.17, h * 0.47], [w * 0.23, h * 0.6], [w * 0.21, h * 0.66], [w * 0.28, by + 2]];
  // stair: steps as small treads (lit) and risers (dark) down each flight, a rail with posts on the sea side
  for (let k = 0; k < st.length - 1; k++) {
    const [a0, a1] = [st[k], st[k + 1]], n = Math.max(3, Math.round(Math.abs(a1[1] - a0[1]) / 5)), dir = Math.sign(a1[0] - a0[0]) || 1;
    for (let q = 0; q < n; q++) { const t = q / n, x = a0[0] + (a1[0] - a0[0]) * t, y = a0[1] + (a1[1] - a0[1]) * t, sx = (a1[0] - a0[0]) / n, sy = (a1[1] - a0[1]) / n;
      I.fill([[x - 5, y], [x + 5, y], [x + 5 + sx, y + sy * 0.4], [x - 5 + sx, y + sy * 0.4]], '#5a6ab4', { lin: true, wob: 0 });
      I.fill([[x - 5 + sx, y + sy * 0.4], [x + 5 + sx, y + sy * 0.4], [x + 5 + sx, y + sy], [x - 5 + sx, y + sy]], '#26347e', { lin: true, wob: 0 }); }
    line([[a0[0] + 6 * dir, a0[1] - 8], [a1[0] + 6 * dir, a1[1] - 8]], 1.1, { color: '#8a9ae0', taper: [0, 0] });
    for (let q = 0; q <= 2; q++) { const t = q / 2, x = a0[0] + (a1[0] - a0[0]) * t + 6 * dir, y = a0[1] + (a1[1] - a0[1]) * t; line([[x, y], [x, y - 8]], 1, { color: '#8a9ae0', taper: [0, 0] }); }
  }
  // the hotel: a long lit facade with a mansard roof, dormers and a little tower
  const hx1 = w * 0.17, top = h * 0.14, base = h * 0.31;
  PG.glow(w * 0.08, h * 0.16, 150, '#ffcf6a', 0.3);
  cel([[-10, base], [hx1, base], [hx1, top], [-10, top]], '#2c3c94', { w: 1.8, lin: true });
  shape([[-10, top], [hx1 + 6, top], [hx1 - 6, top - h * 0.05], [-10, top - h * 0.05]], '#18236a', { w: 1.8, lin: true });
  [0.02, 0.06, 0.1, 0.14].forEach((u) => { shape([[w * u - 5, top - h * 0.02], [w * u + 5, top - h * 0.02], [w * u + 5, top - h * 0.06], [w * u, top - h * 0.08], [w * u - 5, top - h * 0.06]], '#2c3c94', { w: 1.2, lin: true }); I.rect(w * u - 2.5, top - h * 0.055, 5, 6, '#ffd67a'); });
  const tx = w * 0.12;
  cel([[tx - 10, top - h * 0.04], [tx + 10, top - h * 0.04], [tx + 10, top - h * 0.12], [tx - 10, top - h * 0.12]], '#2c3c94', { w: 1.6, lin: true });
  shape([[tx - 13, top - h * 0.12], [tx + 13, top - h * 0.12], [tx, top - h * 0.2]], '#18236a', { w: 1.6, lin: true });
  line([[tx, top - h * 0.2], [tx, top - h * 0.26]], 1.2, { taper: [0, 0] }); I.fill([[tx, top - h * 0.26], [tx + 9, top - h * 0.245], [tx, top - h * 0.23]], '#e84a3a', { wob: 0.2 });
  // two rows of windows, and the ballroom's tall bright arches below
  for (let k = 0; k < 8; k++) for (let rr = 0; rr < 2; rr++) { const x = w * 0.005 + k * w * 0.021, y = top + 6 + rr * 14; I.rect(x, y, 7, 9, (k * 3 + rr) % 5 === 2 ? '#3f55a8' : '#ffd67a'); }
  for (let k = 0; k < 6; k++) { const x = w * 0.01 + k * w * 0.027, y = base - 22; I.fill([[x, y + 18], [x + 11, y + 18], [x + 11, y + 5], [x + 5.5, y], [x, y + 5]], '#fff0b0', { wob: 0 }); }
  PG.glow(w * 0.08, base - 12, 60, '#ffe39a', 0.5);
  line([[-10, base - 25], [hx1, base - 25]], 1.6, { color: '#18236a', taper: [0, 0] });
  // the balcony she left by: doors open, light spilling
  const bx = w * 0.155;
  I.fill([[bx, base - 22], [bx + 9, base - 22], [bx + 9, base - 4], [bx, base - 4]], '#fff6c8', { wob: 0 });
  for (let k = 0; k < 5; k++) line([[bx - 6 + k * 5, base - 4], [bx - 6 + k * 5, base + 2]], 1, { color: '#8a9ae0', taper: [0, 0] });
  line([[bx - 8, base - 4], [bx + 16, base - 4]], 1.6, { color: '#8a9ae0', taper: [0, 0] });
  // shrubs and two palms on the crest
  for (let k = 0; k < 7; k++) I.fill(I.ell(w * (0.01 + k * 0.03), base + 3, rn(8, 14), rn(4, 7), 10), '#0e1650', { wob: 1 });
  [[w * 0.19, h * 0.32, 1], [w * 0.215, h * 0.38, 0.8]].forEach(([x, y, k]) => palm(x, y, k));
}
// jagged rock contour: subdivide a polyline and push points in and out
function crag(pts, amp) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14)); for (let k = 0; k < n; k++) { const t = k / n; out.push([a[0] + (b[0] - a[0]) * t + rn(-amp, amp) * 0.4, a[1] + (b[1] - a[1]) * t + (k % 2 ? -1 : 1) * rn(0, amp)]); } }
  out.push(pts[pts.length - 1]);
  return out;
}
function palm(x, y, k) {
  const top = [x + 8 * k, y - 60 * k];
  line([[x, y], [x + 5 * k, y - 30 * k], top], 3.4 * k, { color: '#0e1650', taper: [0, 0.3] });
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + i * 0.13), L = rn(22, 30) * k; const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.5 + L * 0.35]; I.fill([top, [(top[0] + tip[0]) / 2 + 2, (top[1] + tip[1]) / 2 - 5 * k], tip, [(top[0] + tip[0]) / 2 - 2, (top[1] + tip[1]) / 2 + 2]], '#0e1650', { wob: 0.4 }); }
}

// ================================================================ panel 5: the boy with the torch
function panel5(w, h) {
  const hz = h * 0.3;
  nightSky(w, h, { horizon: hz, stops: [[0, NIGHT.mid], [1, NIGHT.low]] });
  SC.stars(w, hz, 40, '#fff6dc', { max: 1.4 });
  glowSea(w, hz, h * 0.2, { rows: 4, glow: 0.45, glowFrom: 0.6, step: 90, amp: 5 });
  const by = h * 0.5;
  I.rect(-2, by, w + 4, h - by + 2, PG.linear(0, by, 0, h, [[0, NIGHT.wet], [0.3, NIGHT.sand], [1, NIGHT.sandLit]]));
  surf(w, by + 2, { amp: 2, glow: 0.5, gw: 10, lw: 2.2, lace: 5, blur: 3 });
  for (let k = 0; k < 70; k++) I.fill(I.ell(rn(0, w), rn(by + 16, h), 1.1, 0.8, 6), '#5c70c0', { wob: 0 });
  // the torch pool on the sand: warm, strong, the only warm thing on the beach
  const px = w * 0.5, py = h * 0.86;
  const pool = (rx, ry, stops) => I.fill(I.ell(px, py, rx, ry, 40), PG.radial(px, py, rx, stops), { wob: 0, extra: ` transform="translate(0 ${I.n1(py * (1 - ry / rx))}) scale(1 ${I.n1(ry / rx)})"` });
  I.fill(I.ell(px, py, 250, 250 * 0.3, 40), PG.radial(px, py, 250, [[0, TORCH.warm, 0.95], [0.45, TORCH.warm, 0.55], [1, TORCH.warm, 0]]), { wob: 0, extra: ` transform="translate(0 ${I.n1(py * 0.7)}) scale(1 0.3)"` });
  void pool;
  I.fill(I.ell(px, py, 120, 120, 40), PG.radial(px, py, 120, [[0, TORCH.hot, 0.95], [1, TORCH.hot, 0]]), { wob: 0, extra: ` transform="translate(0 ${I.n1(py * 0.7)}) scale(1 0.3)"` });
  PG.glow(px, h * 0.62, 180, TORCH.warm, 0.2);
  for (let k = 0; k < 40; k++) I.fill(I.ell(px + rn(-150, 150), py + rn(-30, 30), 1.1, 0.8, 6), '#c8a060', { wob: 0, op: 0.7 });
  pebble(px + 64, py + 22, 0.7, '#a8a2c0'); shell(px + 10, py + 20, 0.8, '#f7cdb4', 15);
  bucket(w * 0.9, h * 0.97, 1.4, '#e84a3a');
  shell(w * 0.9 - 4, h * 0.97 - 30, 0.8, '#f2e6c8', -20); shell(w * 0.9 + 8, h * 0.97 - 31, 0.7, '#f7cdb4', 25);
  // Ada crouched on the left holding up a smooth pebble to her glasses; Toby opposite with the torch
  const warm = ['#ffd97a', 0.1];
  const ya = h * 0.9, sa = 0.9;
  const ra0 = F.rig(C.ada, F.POSES.crouchSand(C.ada, { x: w * 0.28, y: ya, s: sa, yaw: 50 }));
  void ra0;
  const ra = F.fig({ ...C.ada, shoes: C.ada.head.skin }, F.POSES.crouchSand(C.ada, { x: w * 0.28, y: ya, s: sa, yaw: 50, barefoot: true, tint: warm, head: { yaw: 45, pitch: -8, look: [0.7, 0.5], mood: 'joy' } }));
  const pp = [ra.armN[2], ra.armF[2]].sort((a, b) => a[1] - b[1])[0];
  pebble(pp[0] + 14, pp[1] - 8, 0.75, '#d8d2e4');
  const xt = w * 0.7;
  const rt0 = F.rig(C.toby, F.POSES.crouchSand(C.toby, { x: xt, y: ya, s: sa, yaw: -50 }));
  const u = rt0.unit;
  const rt = F.fig(C.toby, F.POSES.crouchSand(C.toby, { x: xt, y: ya, s: sa, yaw: -50, tint: warm, reachN: 'kneeN', bendN: 1, handN: 'relaxed', head: { yaw: -45, pitch: -10, look: [-0.6, 0.5], mood: 'smile' } }));
  // the torch lies propped in the sand at his feet, shining back across the sand at their finds
  { const tx = px + 100, ty = py + 16, ang = Math.atan2(py - 4 - ty, px - 60 - tx) * 180 / Math.PI; torch(tx, ty, ang, 1.0, { beam: Math.hypot(px - 60 - tx, py - ty), spread: 0.22 }); }
  const tp = rt.armF[2];
  shell(tp[0] - 13, tp[1] - 5, 0.75, '#f7cdb4', -20);
  // the torch light lifting the undersides of faces and hands
  I.emit('<g style="mix-blend-mode:screen">'); PG.glow(px, py - 30, 230, '#ffc86a', 0.28); I.emit('</g>');
}

// ================================================================ panel 6: hands and a shell
function panel6(w, h) {
  // sand under the torch: a warm circle fading to night blue at the corners
  I.rect(-2, -2, w + 4, h + 4, NIGHT.sand);
  I.fill(I.ell(w * 0.5, h * 0.56, w * 0.7, h * 0.6, 48), PG.radial(w * 0.5, h * 0.56, w * 0.7, [[0, '#fff4d0'], [0.45, TORCH.sand], [0.75, '#b89a74'], [0.92, '#6a70a8', 0.9], [1, NIGHT.sand, 0]]), { wob: 0 });
  for (let k = 0; k < 160; k++) { const x = rn(0, w), yy = rn(0, h); I.fill(I.ell(x, yy, rn(0.8, 1.8), rn(0.6, 1.2), 6), I.rng() < 0.7 ? '#a8885a' : '#fff6e0', { wob: 0, op: rn(0.4, 0.8) }); }
  // ripples in the sand
  for (let k = 0; k < 7; k++) { const yy = h * (0.12 + k * 0.13) + rn(-6, 6); line([[-4, yy], [w * 0.3, yy - 4], [w * 0.6, yy + 3], [w + 4, yy - 2]], 1.1, { color: '#b0915e', taper: [0.3, 0.3], op: 0.6 }); }
  pebble(w * 0.84, h * 0.84, 1.6, '#c8c0d8');
  shell(w * 0.9, h * 0.52, 1.1, '#efe4cc', 40);
  const ada = C.ada.head.skin, toby = C.toby.head.skin;
  // her arm from the lower left (emerald sleeve, gold bangle), the old hand open, palm up; his small hand
  // from the upper right in a pyjama sleeve, one finger touching the shell he has put in her palm
  const wa = [w * 0.28, h * 0.97], angA = -62, scA = 1.55;
  const TA = frame(wa, angA), shellC = TA(46 * scA, 2 * scA);
  const angT = 172, scT = 1.3, dT = [Math.cos(angT * Math.PI / 180), Math.sin(angT * Math.PI / 180)], nT = [-dT[1], dT[0]];
  const tipL = [93.5 * scT, -11 * scT], tgt = [shellC[0] + 18, shellC[1] - 24];
  const wt = [tgt[0] - dT[0] * tipL[0] - nT[0] * tipL[1], tgt[1] - dT[1] * tipL[0] - nT[1] * tipL[1]];
  I.emit('<g opacity="0.2" transform="translate(12 14)">'); palmUp(wa, angA, scA, { shadow: '#2a1a2a' }); pointBack(wt, angT, scT, { shadow: '#2a1a2a' }); I.emit('</g>');
  const arm = (wr, ang, len, r0, r1, skin, sleeve, cuff, cuffAt, fold) => {
    const B = frame(wr, ang + 180);
    cel([B(-6, -r0), B(-6, r0), B(len, r1), B(len, -r1)], skin, { w: 3, k: 2 });
    cel([B(cuffAt, -r1 * 1.35), B(cuffAt - 5, 0), B(cuffAt, r1 * 1.35), B(400, r1 * 2), B(400, -r1 * 2)], sleeve, { w: 3, k: 2 });
    line([B(cuffAt + 4, -r1 * 1.25), B(cuffAt, 0), B(cuffAt + 4, r1 * 1.25)], 2.6, { color: cuff });
    line([B(cuffAt + 40, fold), B(cuffAt + 100, fold * 1.4)], 1.8, { color: shade(sleeve, 0.4) });
    return B;
  };
  const BA = arm(wa, angA, 150, 20, 25, '#5e3624', C.ada.top.color, GOLD.gold, 58, 10);
  cel([BA(20, -24), BA(18, 22), BA(30, 25), BA(32, -23)], GOLD.gold, { w: 2.2, k: 0.6, lin: true });
  arm(wt, angT, 120, 13, 16, toby, C.toby.top.color, '#f2f2f2', 46, -8);
  palmUp(wa, angA, scA, { old: true });
  shell(shellC[0], shellC[1], 2.5, '#f7cdb4', 30);
  pointBack(wt, angT, scT, { skin: toby });
  sparkle(shellC[0] - 34, shellC[1] - 30, 7, '#fffbe6');
}

// close-up hands for p6, drawn in local (u along the fingers, v across) px coordinates
function frame(o, ang) { const d = [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)], n = [-d[1], d[0]]; return (u, v) => [o[0] + d[0] * u + n[0] * v, o[1] + d[1] * u + n[1] * v]; }
const bend = (b, ang, L, c = 0) => { const a = ang * Math.PI / 180; const p1 = [b[0] + Math.cos(a) * L * 0.45, b[1] + Math.sin(a) * L * 0.45]; const a2 = a + c; const p2 = [p1[0] + Math.cos(a2) * L * 0.33, p1[1] + Math.sin(a2) * L * 0.33]; const a3 = a2 + c; return [b, p1, p2, [p2[0] + Math.cos(a3) * L * 0.22, p2[1] + Math.sin(a3) * L * 0.22]]; };
// her old right hand, palm up, fingers relaxed; dark skin: palm and finger pads lighter, the back shows
// as a darker rim along the edges. o.shadow: draw only the silhouette in one colour.
function palmUp(wr, ang, sc, o = {}) {
  const T = frame(wr, ang), S = (u, v) => T(u * sc, v * sc);
  const back = o.back || '#5e3624', palm = o.palm || '#c9926f', pSh = o.palmShade || '#a46e50', ink = o.ink || INK;
  const lw = 2.6, sh = o.shadow;
  const F = [ // base [u,v], angle (deg, + toward the thumb side), length, width, curl
    [[70, -25], -12, 42, 15, -0.12], [[78, -10], -4, 52, 17, -0.07], [[80, 6], 2, 57, 18, -0.03], [[75, 21], 9, 51, 17, 0.04]];
  const fingerPts = (f, k = 1) => { const [b, a, L, wd, c] = f; const cl = bend(b, a, L, c); return tubePts(cl.map(([u, v]) => S(u, v)), [wd / 2, wd * 0.49, wd * 0.46, wd * 0.42].map((r) => r * sc * k)); };
  const thumb = bend([34, 30], 34, 44, -0.18);
  const thumbPts = (k = 1) => tubePts(thumb.map(([u, v]) => S(u, v)), [12, 11, 10, 8.6].map((r) => r * sc * k));
  const palmPoly = [[-2, -18], [10, -26], [30, -32], [52, -33], [68, -30], [76, -20], [80, -4], [80, 10], [76, 22], [68, 30], [54, 34], [38, 36], [22, 30], [8, 24], [-2, 18]];
  if (sh) { F.forEach((f) => I.fill(fingerPts(f), sh, { wob: 0 })); I.fill(thumbPts(), sh, { wob: 0 }); I.fill(palmPoly.map(([u, v]) => S(u, v)), sh, { wob: 0 }); return; }
  const piece = (pts, inner, lwk = 1) => { cel(pts, back, { w: lw * lwk, k: 0.4, ink }); I.fill(inner, palm, { wob: 0.2 }); };
  F.forEach((f) => {
    const outer = fingerPts(f), inner = fingerPts([[f[0][0] + 3, f[0][1] - 1.2], f[1], f[2] - 4, f[3], f[4]], 0.66);
    piece(outer, inner, 0.9);
    const cl = bend(...f.slice(0, 2), f[2], f[4]);
    // pads and creases: two joint creases across each finger, a pad shadow at the tip
    [0.45, 0.78].forEach((t) => { const i = t < 0.6 ? 1 : 2; const p = cl[i], wd = f[3] * 0.3; line([S(p[0] - 1, p[1] - wd), S(p[0] + 1.5, p[1]), S(p[0] - 1, p[1] + wd)], 1.2, { color: pSh, taper: [0.3, 0.3] }); if (o.old) line([S(p[0] + 3, p[1] - wd * 0.7), S(p[0] + 4, p[1] + wd * 0.6)], 0.9, { color: pSh, taper: [0.3, 0.3] }); });
    const tip = cl[3]; I.fill(I.ell(...S(tip[0] - 5, tip[1]), 4 * sc, 3 * sc, 8, (ang + f[1]) * Math.PI / 180), pSh, { wob: 0, op: 0.6 });
  });
  const tIn = tubePts(thumb.map(([u, v]) => S(u - 2, v - 3)), [12, 11, 10, 8.6].map((r) => r * sc * 0.62));
  piece(thumbPts(), tIn, 0.95);
  { const p = thumb[2]; line([S(p[0] - 5, p[1] + 6), S(p[0], p[1] + 1), S(p[0] + 6, p[1] - 5)], 1.2, { color: pSh, taper: [0.3, 0.3] }); }
  const P = palmPoly.map(([u, v]) => S(u, v));
  const inner = palmPoly.map(([u, v]) => [Math.max(-2, 42 + (u - 42) * 0.84), 2 + (v - 2) * 0.8]).map(([u, v]) => S(u, v));
  cel(P, back, { w: lw, k: 0.5, ink });
  cel(inner, palm, { w: 0, k: 0.5 * sc, shade: pSh, lx: 4, ly: -6, wob: 0.2 });
  // the thenar mound: a soft line round the thumb's root; palm lines; finger-root creases
  line([[70, 22], [52, 18], [36, 16], [18, 16], [4, 10]].map(([u, v]) => S(u, v)), 1.5, { color: pSh, taper: [0.2, 0.4] });
  line([[64, -22], [60, -6], [62, 8], [70, 18]].map(([u, v]) => S(u, v)), 1.4, { color: pSh, taper: [0.3, 0.3] });
  line([[52, -26], [46, -8], [48, 6]].map(([u, v]) => S(u, v)), 1.3, { color: pSh, taper: [0.3, 0.3] });
  [[74, -24, -15], [78, -9, -6], [79, 7, 1], [74, 22, 9]].forEach(([u, v]) => line([S(u - 2, v - 6), S(u + 1, v), S(u - 2, v + 6)], 1.2, { color: pSh, taper: [0.3, 0.3] }));
  if (o.old) for (let k = 0; k < 3; k++) line([S(4 + k * 4, -14), S(6 + k * 4, 0), S(4 + k * 4, 14)], 0.9, { color: pSh, taper: [0.3, 0.3], op: 0.7 });
  return { center: S(40, 2), T: S };
}
// his small right hand, back to us, index pointing; the others curled under with knuckle bumps
function pointBack(wr, ang, sc, o = {}) {
  const T = frame(wr, ang), S = (u, v) => T(u * sc, v * sc);
  const skin = o.skin || '#f4cfae', sk2 = shade(skin, 0.2), ink = o.ink || INK, sh = o.shadow;
  const idx = bend([40, -11], 2, 48, 0.02), idxPts = () => tubePts(idx.map(([u, v]) => S(u, v)), [6.2, 6, 5.6, 5.2].map((r) => r * sc));
  const thumb = bend([14, -16], -22, 34, 0.3), thPts = () => tubePts(thumb.map(([u, v]) => S(u, v)), [7.5, 7, 6.2, 5.6].map((r) => r * sc));
  const curls = [[50, 1, 7.4], [49, 13, 7], [44, 23, 6.2]].map(([u, v, r]) => I.ell(...S(u, v), r * 1.25 * sc, r * sc, 12, ang * Math.PI / 180));
  const back = [[-2, -15], [20, -17], [40, -18], [46, -8], [48, 6], [44, 22], [34, 26], [16, 22], [-2, 16]].map(([u, v]) => S(u, v));
  if (sh) { [idxPts(), thPts(), back, ...curls].forEach((p) => I.fill(p, sh, { wob: 0 })); return; }
  cel(thPts(), skin, { w: 2.2, k: 0.4, ink });
  curls.forEach((c) => cel(c, skin, { w: 2, k: 0.3, ink }));
  // fingernails of the curled fingers peek at the front
  [[52, 2], [51, 13], [46, 22]].forEach(([u, v]) => I.fill(I.ell(...S(u, v), 2.4 * sc, 1.8 * sc, 8), '#f7ded0', { wob: 0 }));
  cel(back, skin, { w: 2.4, k: 0.6, ink, shade: 0.14 });
  cel(idxPts(), skin, { w: 2.2, k: 0.4, ink });
  // knuckle dimples and a nail on the pointing finger
  [[40, -11], [42, 1], [41, 12], [37, 21]].forEach(([u, v]) => line([S(u - 1, v - 3), S(u + 1, v), S(u - 1, v + 3)], 1.1, { color: sk2, taper: [0.3, 0.3] }));
  { const p = idx[2]; line([S(p[0], p[1] - 3.5), S(p[0] + 1.5, p[1]), S(p[0], p[1] + 3.5)], 1.1, { color: sk2 }); }
  const tp = idx[3]; shape(I.ell(...S(tp[0] - 3, tp[1]), 3.6 * sc, 3 * sc, 10, ang * Math.PI / 180), '#fbe4d8', { w: 1, ink: sk2 });
  { const p = thumb[3]; shape(I.ell(...S(p[0] - 2.5, p[1] + 1), 3 * sc, 2.4 * sc, 8, ang * Math.PI / 180), '#fbe4d8', { w: 0.9, ink: sk2 }); }
  return { tip: S(tp[0] + 5.5, tp[1]) };
}

// ================================================================ panel 7: both look up
function panel7(w, h) {
  // the torch is off: the sky fills with stars (no milky way yet: that is the splash's reveal); a shooting star
  const hz = h * 0.62;
  nightSky(w, h, { horizon: hz, stops: [[0, '#0c1238'], [0.6, NIGHT.mid], [1, NIGHT.haze]] });
  SC.stars(w, hz, 260, '#fff6dc', { max: 1.9 });
  for (let k = 0; k < 6; k++) sparkle(rn(20, w - 20), rn(8, hz - 30), rn(3, 6), '#fff6dc');
  const m0 = [w * 0.66, h * 0.1], m1 = [w * 0.84, h * 0.26];
  I.fill([[m0[0], m0[1] - 1.2], m1, [m0[0], m0[1] + 1.2]], '#fff6dc', { wob: 0, op: 0.8 });
  sparkle(m1[0], m1[1], 6, '#ffffff');
  glowSea(w, hz, h * 0.18, { rows: 5, glow: 0.8, glowFrom: 0.4, step: 90, amp: 4 });
  const by = h * 0.8;
  I.rect(-2, by, w + 4, h - by + 2, PG.linear(0, by, 0, h, [[0, NIGHT.wet], [1, NIGHT.sand]]));
  surf(w, by + 1, { amp: 2, glow: 0.9, gw: 10, lw: 2, lace: 4, blur: 3 });
  // both crouched side by side from behind, heads tipped back; he points at the shooting star
  const dim = ['#1c2f86', 0.25], fy = h * 1.02;
  F.fig({ ...C.ada, shoes: C.ada.head.skin }, F.POSES.crouchSand(C.ada, { x: w * 0.47, y: fy, s: 0.8, yaw: 160, tint: dim, reachN: 'kneeN', reachF: 'kneeF', head: { yaw: 168, pitch: 14 } }));
  F.fig(C.toby, F.POSES.crouchSand(C.toby, { x: w * 0.56, y: fy, s: 0.8, yaw: -160, tint: dim, armN: [165, 8, 12], reachN: null, handN: 'point', head: { yaw: -165, pitch: 14 } }));
  torch(w * 0.64, h * 0.97, 10, 0.8, { on: false });
  bucket(w * 0.36, h * 0.99, 1.1, '#e84a3a');
}

// ================================================================ panel 8: the great ocean
function panel8(w, h) {
  const hz = h * 0.54;
  nightSky(w, h, { horizon: hz, stops: [[0, '#070b26'], [0.3, '#121c62'], [0.72, '#2848a8'], [0.93, '#4a82cc'], [1, '#6ab4d8']] });
  // the milky way rises out of the sea left of centre and arcs across to the top right
  const mw = (t) => [w * (0.3 + t * 0.78) - Math.sin(t * Math.PI) * w * 0.06, hz + 30 - t * (hz + 120) - Math.sin(t * Math.PI) * 20];
  milkyWay(w, h, mw, 92, { core: 0.12, n: 3200, clouds: 110 });
  SC.stars(w, hz, 220, '#fff6dc', { max: 2 });
  for (let k = 0; k < 7; k++) sparkle(rn(20, w - 20), rn(10, hz - 30), rn(4, 8), '#fff6dc');
  // sea: long swells, sparse glowing crests, a light column under the galaxy's core
  glowSea(w, hz, h * 0.26, { rows: 12, glow: 0.9, glowFrom: 0.3, step: 220, amp: 9, crestP: 0.55, far: '#3a6cc4', near: '#123080' });
  for (let k = 0; k < 70; k++) { const yy = hz + 3 + Math.pow(I.rng(), 1.3) * h * 0.26; const x = w * 0.3 + (I.rng() - 0.5) * (10 + (yy - hz) * 0.7); const L = 2 + (yy - hz) / (h * 0.26) * 10; line([[x - L, yy], [x + L, yy]], 1 + (yy - hz) / (h * 0.26) * 1.4, { color: '#eef0ff', taper: [0.4, 0.4], op: 0.75 }); }
  I.emit(`<g transform="translate(${I.n1(w * 0.33)} ${I.n1(hz)}) scale(0.35 1)">`); PG.glow(0, 40, 160, '#c8d4ff', 0.3); I.emit('</g>');
  // the big glowing breaker rolling in across the whole panel
  breaker(w, h * 0.8, h * 0.075);
  // wet sand, mirroring the glow and the sky
  const sy = h * 0.875;
  I.rect(-2, sy, w + 4, h - sy + 2, PG.linear(0, sy, 0, h, [[0, '#2f7cc4'], [0.35, '#2450a8'], [1, '#1a3488']]));
  surf(w, sy, { amp: 7, glow: 1, gw: 26, lw: 3.6, lace: 16, blur: 7, ph: 1.3 });
  for (let k = 0; k < 40; k++) { const yy = rn(sy + 18, h - 4), x = w * 0.3 + rn(-30, 30); line([[x - 6, yy], [x + 6, yy]], 1.2, { color: '#eef0ff', taper: [0.4, 0.4], op: 0.5 }); }
  for (let k = 0; k < 10; k++) { const yy = rn(sy + 20, h - 6), x = rn(0, w); line([[x, yy], [x + rn(30, 80), yy]], 1, { color: '#6ab4e8', taper: [0.4, 0.4], op: 0.7 }); }
  // two tiny figures on the wet sand, dark against the glow, with their reflections
  const fx = w * 0.6, fy = h * 0.965, fs = 0.3;
  footprints(w * 0.9, h * 0.99, fx + 20, fy + 2, 10, '#15307e', 0.8, { op: 0.8 });
  const sil = '#0c1440';
  const figs = (c = null, dx = 0, dy = 0) => {
    const t = c ? { sil: c } : { tint: ['#1a3a8e', 0.42] };
    F.fig({ ...C.ada, shoes: C.ada.head.skin }, { ...F.POSES.lookUpBack(C.ada, {}), x: fx + dx, y: fy + dy, s: fs, ...t, shadow: false, reachF: [fx + 20, fy - fs * 150], bendF: 1, handF: 'relaxed' });
    F.fig(C.toby, { ...F.POSES.lookUpBack(C.toby, {}), x: fx + 26 + dx, y: fy + dy, s: fs, ...t, armN: [165, 8, 12], handN: 'point', shadow: false });
  };
  I.emit(`<g opacity="0.35" transform="translate(0 ${I.n1(fy * 2 + 2)}) scale(1 -1)">`); figs(sil); I.emit('</g>');
  PG.glow(fx + 6, fy - 20, 40, NIGHT.glow, 0.25);
  // rim light from the glowing surf behind them
  I.emit('<g style="mix-blend-mode:screen">'); PG.glow(fx + 12, fy - 30, 70, NIGHT.glow, 0.45); I.emit('</g>');
  figs();
}
// a long breaking wave across the panel: dark face, glowing lip, foam spray and a curl
function breaker(w, y, H) {
  const crest = []; for (let x = -30; x <= w + 30; x += 12) crest.push([x, y + Math.sin(x / 90) * H * 0.18 + Math.sin(x / 31) * H * 0.06]);
  const face = crest.concat([[w + 30, y + H * 1.1], [-30, y + H * 1.1]]);
  I.fill(face, PG.linear(0, y, 0, y + H, [[0, '#1a50a8'], [0.45, '#11307a'], [1, '#183e90']]), { wob: 0 });
  // luminous face: the water glows through where it thins under the lip
  I.clipPoly(face, () => {
    const id = `bk${++MWB}`; I.emit(`<defs><filter id="${id}" x="-10%" y="-100%" width="120%" height="300%"><feGaussianBlur stdDeviation="${H * 0.25}"/></filter></defs>`);
    I.emit(`<g filter="url(#${id})" opacity="0.45">`); line(crest.map(([x, yy]) => [x, yy + H * 0.18]), H * 0.35, { color: NIGHT.glow, taper: [0, 0], wob: 0 }); I.emit('</g>');
    for (let k = 0; k < 30; k++) { const x = rn(-10, w + 10), y0 = y + H * rn(0.35, 0.95); line([[x, y0], [x + rn(20, 60), y0 + rn(-1, 1)]], rn(0.8, 1.6), { color: I.rng() < 0.5 ? '#8ff7ea' : '#0f2a70', taper: [0.4, 0.4], op: 0.6 }); }
  });
  const id2 = `bk${++MWB}`; I.emit(`<defs><filter id="${id2}" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="${H * 0.2}"/></filter></defs>`);
  I.emit(`<g filter="url(#${id2})" opacity="0.95">`); line(crest, H * 0.45, { color: NIGHT.glow, taper: [0, 0], wob: 0 }); I.emit('</g>');
  line(crest, 4.4, { color: NIGHT.foam, taper: [0, 0] });
  line(crest.map(([x, yy]) => [x, yy - 1.6]), 1.6, { color: INK, taper: [0, 0], op: 0.5 });
  // breaking foam: thicker white patches along the lip where it tumbles
  for (let k = 0; k < 9; k++) { const cx = rn(0, w), cy = y + Math.sin(cx / 90) * H * 0.18 + Math.sin(cx / 31) * H * 0.06, L = rn(30, 90); I.fill([[cx - L / 2, cy], [cx - L * 0.2, cy - H * 0.12], [cx + L * 0.25, cy - H * 0.1], [cx + L / 2, cy], [cx + L * 0.2, cy + H * 0.14], [cx - L * 0.25, cy + H * 0.12]], NIGHT.foam, { wob: 1, op: 0.9 }); }
  // spray: foam dots flung up off the lip
  for (let k = 0; k < 120; k++) { const x = rn(-10, w + 10), c = y + Math.sin(x / 90) * H * 0.18; const d = Math.pow(I.rng(), 2) * H * 0.7; I.fill(I.ell(x, c - d, rn(0.8, 2.2), rn(0.8, 1.8), 6), NIGHT.foam, { wob: 0, op: rn(0.5, 1) }); }
}

if (require.main === module) {
page();
  const out = I.take();
  fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
  fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'the-great-ocean.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
  if (process.env.RECTS) fs.writeFileSync(process.env.RECTS, JSON.stringify(RECTS));
  console.log('wrote', H);
}
module.exports = { trophy, shell, torch, pebble, heels };
