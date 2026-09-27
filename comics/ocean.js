// THE GREAT OCEAN — Isaac Newton (reported; Spence 1820, Brewster 1855). A Zen-Pencils-style strip.
// node comics/ocean.js  -> out/the-great-ocean.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, limb } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand, tube } = require('../zp/hand');
const C = require('./cast_ocean');

I.seed(1727);
const W = 980;
let H = 0;
const GOLD = { wall: '#f2c26b', wallDark: '#d9993f', light: '#fff1c6', crowd: '#7a4a2a', stage: '#a8522f', banner: '#b8342e' };
const NIGHT = { top: '#0c1330', mid: '#1b2a5a', low: '#2c4a7a', sea: '#12264e', sand: '#394a78', sandLight: '#56679a', glow: '#6ff0e0' };

function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}

// crowd seen from behind: heads and shoulders, some hands clapping above
function crowd(w, y0, rows, color, o = {}) {
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * 34, s = 1 + r * 0.25;
    for (let x = -20 + (r % 2) * 22; x < w + 30; x += 44 * s) {
      const c = F.mix(color, '#000000', 0.12 * (rows - r) / rows);
      const k = Math.abs(Math.floor(x * 7 + r * 13)) % 5;
      const hair = F.mix(['#3a2418', '#1f1a1c', '#8a6a4a', '#d9d4c8', '#5a3a28'][k], '#7a4a2a', 0.35);
      shape([[x - 22 * s, y + 60 * s], [x - 20 * s, y + 12 * s], [x - 8 * s, y + 2 * s], [x + 8 * s, y + 2 * s], [x + 20 * s, y + 12 * s], [x + 22 * s, y + 60 * s]], c, { w: LW.fine });
      shape(I.ell(x, y - 10 * s, (k === 3 ? 12 : 11) * s, 13 * s, 12), hair, { w: LW.fine });
      if (false) { shape(I.ell(x - 6 * s, y - 34 * s, 4 * s, 7 * s, 8, -0.3), c, { w: LW.fine }); shape(I.ell(x + 4 * s, y - 36 * s, 4 * s, 7 * s, 8, 0.3), c, { w: LW.fine }); PG.ticks(x, y - 36 * s, 10 * s, 3, -150, -30, 6); }
    }
  }
}
function chandelier(x, y, s) {
  line([[x, -10], [x, y - 20 * s]], 1.4);
  PG.glow(x, y, 80 * s, '#fff1c6', 0.7);
  shape([[x - 26 * s, y - 10 * s], [x + 26 * s, y - 10 * s], [x + 14 * s, y + 10 * s], [x - 14 * s, y + 10 * s]], '#e2b24a', { w: LW.fine });
  for (let k = -2; k <= 2; k++) { shape(I.ell(x + k * 11 * s, y - 16 * s, 2.4 * s, 5 * s, 8), '#fff6d8', { w: 1.1 }); }
}
function trophy(x, y, s, c = '#e2b24a') {
  shape([[x - 12 * s, y - 34 * s], [x + 12 * s, y - 34 * s], [x + 9 * s, y - 16 * s], [x + 3 * s, y - 12 * s], [x + 3 * s, y - 6 * s], [x + 8 * s, y - 2 * s], [x - 8 * s, y - 2 * s], [x - 3 * s, y - 6 * s], [x - 3 * s, y - 12 * s], [x - 9 * s, y - 16 * s]], c, { w: LW.detail });
  shape(I.rectPts(x - 10 * s, y - 2 * s, 20 * s, 6 * s), '#7a4a2a', { w: LW.detail, lin: true });
  line([[x - 12 * s, y - 30 * s], [x - 18 * s, y - 26 * s], [x - 10 * s, y - 20 * s]], LW.detail, { color: c });
  line([[x + 12 * s, y - 30 * s], [x + 18 * s, y - 26 * s], [x + 10 * s, y - 20 * s]], LW.detail, { color: c });
  line([[x - 6 * s, y - 30 * s], [x - 4 * s, y - 20 * s]], 1.2, { color: '#fff6d8' });
}
function torch(x, y, ang, s = 1, beam = null) {
  const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  if (beam) I.fill([[x + ca * 12 * s, y + sa * 12 * s], [x + ca * beam + -sa * beam * 0.35, y + sa * beam + ca * beam * 0.35], [x + ca * beam + sa * beam * 0.35, y + sa * beam - ca * beam * 0.35]], '#fff3b0', { lin: true, wob: 0, op: 0.35 });
  shape([[x - ca * 12 * s - sa * 4 * s, y - sa * 12 * s + ca * 4 * s], [x + ca * 8 * s - sa * 4 * s, y + sa * 8 * s + ca * 4 * s], [x + ca * 12 * s - sa * 6 * s, y + sa * 12 * s + ca * 6 * s], [x + ca * 12 * s + sa * 6 * s, y + sa * 12 * s - ca * 6 * s], [x + ca * 8 * s + sa * 4 * s, y + sa * 8 * s - ca * 4 * s], [x - ca * 12 * s + sa * 4 * s, y - sa * 12 * s - ca * 4 * s]], '#3f8f4f', { w: LW.detail, lin: true });
  shape(I.ell(x + ca * 12.5 * s, y + sa * 12.5 * s, 2.4 * s, 6 * s, 10, a), '#fff6c8', { w: 1.2 });
}
function shell(x, y, s, c = '#f7d9c4', rot = 0) {
  I.grp(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, () => {
    shape([[-12, 4], [-10, -6], [-4, -12], [4, -12], [10, -6], [12, 4], [0, 8]], c, { w: 1.6 });
    [-8, -3, 2, 7].forEach((k) => line([[0, 7], [k, -9]], 1.1, { color: F.mix(c, '#7a4a2a', 0.5), taper: [0.2, 0.3] }));
  });
}
function pebble(x, y, s, c = '#b8b2c8') { shape(I.ell(x, y, 9 * s, 6 * s, 14, 0.2), c, { w: 1.5 }); I.fill(I.ell(x - 3 * s, y - 2 * s, 3 * s, 1.5 * s, 8, 0.2), '#ffffff', { op: 0.5, wob: 0 }); }

function nightSky(w, h, o = {}) {
  I.rect(-2, -2, w + 4, h + 4, PG.linear(0, 0, 0, h, [[0, NIGHT.top], [0.7, NIGHT.mid], [1, NIGHT.low]]));
  // the milky way: a soft band of dust and a dense star field along it
  if (o.milky) {
    // a curved, feathered band: several soft layers along an arc, with a dark dust lane and dense stars
    const arc = (t, off) => { const x = t * w, yy = h * (0.72 - t * 0.62 + 0.28 * t * t); return [x, yy + off]; };
    const band = (wid) => { const top = [], bot = []; for (let k = 0; k <= 24; k++) { const t = -0.1 + (k / 24) * 1.2; const wv = wid * (0.7 + 0.5 * Math.sin(t * 5.3)); top.push(arc(t, -wv)); bot.push(arc(t, wv)); } return top.concat(bot.reverse()); };
    [[120, 0.08], [80, 0.1], [46, 0.12], [22, 0.16]].forEach(([wd, op]) => { I.emit(`<g opacity="${op}">`); I.fill(band(wd), '#c9d4ff', { wob: 0 }); I.emit('</g>'); });
    I.emit('<g opacity="0.35">'); I.fill(band(6).map(([x, yy], i) => [x, yy + 10 * Math.sin(i * 0.7)]), '#0a1030', { wob: 0 }); I.emit('</g>');
    for (let k = 0; k < 420; k++) { const t = I.rng() * 1.2 - 0.1; const g = (I.rng() + I.rng() + I.rng() - 1.5) * 90; const [bx, by] = arc(t, g); I.fill(I.ell(bx, by, 0.5 + I.rng() * 1.1, 0.5 + I.rng() * 1.1, 5), '#f6f3ff', { wob: 0, op: 0.4 + I.rng() * 0.6 }); }
  }
  SC.stars(w, h * (o.band || 0.6), o.n || 90, '#fff6dc');
}
function glowingSea(w, y, h, o = {}) {
  I.rect(-2, y, w + 4, h, PG.linear(0, y, 0, y + h, [[0, '#0f1f45'], [1, NIGHT.sea]]));
  line([[-4, y], [w + 4, y]], LW.detail, { taper: [0, 0], color: '#0a1230' });
  // wave crests in perspective: far rows thin and close together, near rows long, thick and foaming
  const rows = o.rows || 7;
  for (let r = 0; r < rows; r++) {
    const t = (r + 1) / rows, yy = y + h * Math.pow(t, 1.7) * 0.94;
    const amp = 1 + t * t * 9, step = 18 + t * t * 120;
    for (let x = -30 - I.rng() * step; x < w + 40; x += step * (0.7 + I.rng() * 0.6)) {
      const l = step * (0.45 + I.rng() * 0.5);
      const pts = [[x, yy], [x + l * 0.3, yy - amp], [x + l * 0.65, yy - amp * 0.5], [x + l, yy + amp * 0.1]];
      const near = t > 0.55;
      if (near && I.rng() < 0.75) { I.emit(`<g opacity="${0.25 + t * 0.4}">`); line(pts, 4 + t * 10, { color: NIGHT.glow, taper: [0.4, 0.4] }); I.emit('</g>'); }
      line(pts, 0.9 + t * 2.4, { color: near ? '#c9fff6' : F.mix('#5d7fb8', '#9fb8e0', t), taper: [0.3, 0.3] });
      if (near && I.rng() < 0.4) for (let f = 0; f < 3; f++) I.fill(I.ell(x + l * (0.3 + f * 0.15), yy - amp - 3 - f, 1.5 + t * 1.5, 1.2 + t, 6), '#e8fffb', { wob: 0 });
    }
  }
  // moon/star glitter path on the water
  if (o.glitter) for (let k = 0; k < 40; k++) { const yy = y + h * Math.pow(I.rng(), 1.3); const x = o.glitter + (I.rng() - 0.5) * (20 + (yy - y) * 0.6); line([[x - 4, yy], [x + 4, yy]], 1.4, { color: '#e8fffb', taper: [0.4, 0.4] }); }
}
function sand(w, y, h, o = {}) {
  const top = [[-10, y + 10], [w * 0.3, y], [w * 0.7, y + 6], [w + 10, y - 4]];
  shape(top.concat([[w + 10, y + h + 10], [-10, y + h + 10]]), o.color || NIGHT.sand, { w: SC.BG });
  // wet edge that shines
  line(top, 3, { color: o.shine || '#6f84c0', taper: [0.1, 0.1] });
  for (let k = 0; k < (o.dots ?? 40); k++) { const x = I.rng() * w, yy = y + 12 + I.rng() * (h - 12); I.fill(I.ell(x, yy, 1.2, 0.9, 6), o.dot || NIGHT.sandLight, { wob: 0 }); }
}

// ---------------------------------------------------------------- title
function title(y0) {
  const words = [['THE', 60, 118, y0 + 70, '#e2b24a'], ['GREAT', 118, 116, y0 + 172, '#1b2a5a'], ['OCEAN', 118, 452, y0 + 172, '#2b8a9a']];
  words.forEach(([t, sz, x, y, c]) => PG.sfx(x, y, t, { size: sz, color: c, anchor: 'start', rot: -2, sw: 3, ls: 3 }));
  // a wave curling under the title
  const wy = y0 + 196;
  I.ink([[110, wy], [260, wy - 10], [420, wy + 4], [600, wy - 8], [760, wy + 2]], 6, { color: '#2b8a9a', taper: [0.1, 0.6] });
  credits(118, y0 + 228, [['WORDS BY ', INK], ['ISAAC NEWTON', '#2b8a9a'], ['      ART BY ', INK], ['CLAUDE', '#e2b24a']]);
  // spot: a shell and a pebble on a hand
  I.grp(`translate(820 ${y0 + 120})`, () => {
    I.fill(I.ell(0, 0, 80, 80, 30), '#1b2a5a', { wob: 0 });
    for (let k = 0; k < 30; k++) { const a = I.rng() * 6.28, r = I.rng() * 70; I.fill(I.ell(Math.cos(a) * r, Math.sin(a) * r, 1, 1, 5), '#fff6dc', { wob: 0 }); }
    hand(-40, 50, -40, 3.2, 'flat', { skin: '#7a4a32', flip: true });
    shell(-4, 4, 1.4);
  });
}

// ---------------------------------------------------------------- page
function page() {
  title(18);
  let y = 270;
  const G = PG.GUT_V;
  let r;

  // 1 — the ballroom
  r = PG.row(y, 400, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, GOLD.wallDark], [0.5, GOLD.wall], [1, '#e8ad55']]));
    // columns and a big red banner
    [0.08, 0.3, 0.7, 0.92].forEach((x) => { shape(I.rectPts(x * w - 18, -10, 36, h), '#f6d08a', { w: LW.fine, lin: true }); line([[x * w - 8, 0], [x * w - 8, h]], 1.2, { color: '#d9a44f' }); });
    shape([[w * 0.25, 30], [w * 0.75, 30], [w * 0.73, 90], [w * 0.27, 90]], GOLD.banner, { w: LW.detail, lin: true });
    I.text(w * 0.5, 58, 'LIFETIME ACHIEVEMENT', { font: 'Letter', size: 18, color: '#fff1c6', ls: 3 });
    I.text(w * 0.5, 80, 'IN PHYSICS', { font: 'Letter', size: 13, color: '#fff1c6', ls: 4 });
    chandelier(w * 0.18, 70, 1); chandelier(w * 0.82, 70, 1);
    // stage + spotlight
    I.fill([[w * 0.44, 0], [w * 0.56, 0], [w * 0.64, h * 0.72], [w * 0.36, h * 0.72]], '#fff6d8', { lin: true, op: 0.3, wob: 0 });
    shape([[w * 0.12, h * 0.72], [w * 0.88, h * 0.72], [w * 0.92, h * 0.8], [w * 0.08, h * 0.8]], GOLD.stage, { w: LW.detail, lin: true });
    shape(I.rectPts(w * 0.62, h * 0.5, 50, h * 0.22), '#7a4a2a', { w: LW.detail, lin: true });
    const a = F.fig(C.ada, { x: w * 0.5, y: h * 0.74, s: 0.86, yaw: 10, lean: 4, armN: [150, 20], armF: [8, 10], handN: 'grip', head: { yaw: 10, pitch: -4, look: [0.3, 0], mood: 'smile' } });
    trophy(a.armN[2][0], a.armN[2][1] + 4, 0.8);
    crowd(w, h * 0.78, 3, GOLD.crowd, { clap: true });
  }, (w, h) => PG.caption(18, 110, ['I DO NOT KNOW WHAT I MAY', 'APPEAR TO THE WORLD,']));
  y += 400 + G;

  // 2 — her face; 3 — slipping out
  r = PG.row(y, 330, [1, 1.45]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.radial(w * 0.4, h * 0.4, w, [[0, '#ffe1a0'], [1, GOLD.wallDark]]));
    for (let k = 0; k < 7; k++) I.fill(I.ell(I.rng() * w, I.rng() * h * 0.6, 14 + I.rng() * 16, 14 + I.rng() * 16, 14), '#fff6d8', { op: 0.18, wob: 0 });
    // shoulders in green, the face in close-up; eyes slide toward the balcony door
    shape([[-10, h + 10], [10, h * 0.86], [w * 0.3, h * 0.8], [w * 0.7, h * 0.8], [w * 0.95, h * 0.9], [w + 10, h + 10]], C.ada.top.color, { w: LW.contour });
    HD.head(C.ada.head, { x: w * 0.5, y: h * 0.47, s: 3.2, yaw: -8, look: [0.95, 0.1], mood: 'neutral', mouth: 'smile' });
  });
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, GOLD.wall);
    // the balcony door, open onto blue night
    const dx = w * 0.52, dw = w * 0.34, dy = h * 0.08, dh = h * 0.8;
    I.rect(dx, dy, dw, dh, PG.linear(0, dy, 0, dy + dh, [[0, NIGHT.top], [1, NIGHT.low]]));
    I.clipRect(dx, dy, dw, dh, () => { SC.stars(dx + dw, dy + dh, 30, '#fff6dc'); I.rect(dx, dy + dh * 0.62, dw, dh, NIGHT.sea); line([[dx, dy + dh * 0.62], [dx + dw, dy + dh * 0.62]], 1.4, { color: '#5d7fb8' }); });
    shape([[dx, dy], [dx + dw, dy], [dx + dw, dy + dh], [dx, dy + dh], [dx, dy], [dx - 12, dy - 12], [dx - 12, dy + dh + 4], [dx + dw + 12, dy + dh + 4], [dx + dw + 12, dy - 12], [dx - 12, dy - 12]], '#f6d08a', { w: LW.detail, lin: true });
    // the door leaf swung inward
    shape([[dx + dw, dy], [dx + dw + dw * 0.35, dy - 10], [dx + dw + dw * 0.35, dy + dh + 14], [dx + dw, dy + dh]], '#f8e2b0', { w: LW.detail, lin: true });
    I.rect(0, h * 0.88, w, h * 0.12, '#b8603a');
    line([[-4, h * 0.88], [w + 4, h * 0.88]], LW.detail, { taper: [0, 0] });
    // a gilt chair with the trophy left on it
    const cx = w * 0.22;
    shape(I.rectPts(cx - 34, h * 0.36, 10, h * 0.52), '#d9a44f', { w: LW.detail, lin: true });
    shape(I.rectPts(cx - 34, h * 0.62, 70, 10), '#b8342e', { w: LW.detail, lin: true });
    shape(I.rectPts(cx - 30, h * 0.66, 8, h * 0.22), '#d9a44f', { w: LW.detail, lin: true });
    shape(I.rectPts(cx + 24, h * 0.66, 8, h * 0.22), '#d9a44f', { w: LW.detail, lin: true });
    trophy(cx + 2, h * 0.62, 1.1);
    PG.ticks(cx + 2, h * 0.5, 18, 3, -150, -30, 8);
    // Ada slipping through the door, shoes in hand
    const a = F.fig({ ...C.ada, shoes: C.ada.head.skin }, { x: dx + dw * 0.35, y: h * 0.88, s: 0.95, yaw: 60, lean: 6, legN: [18, -4], legF: [-14, 16], armN: [-8, 8], armF: [10, 10], handN: 'grip', head: { yaw: 40, look: [0.9, 0], mood: 'sly', mouth: 'smile' } });
    const [hx, hy] = a.armN[2];
    [[0, 0], [8, 4]].forEach(([ox, oy]) => { line([[hx + ox, hy], [hx + ox + 2, hy + 10]], 1.2); shape([[hx + ox - 6, hy + 10 + oy], [hx + ox + 8, hy + 10 + oy], [hx + ox + 12, hy + 16 + oy], [hx + ox - 6, hy + 18 + oy]], '#d4aa3c', { w: LW.detail }); });
  }, (w, h) => PG.caption(16, 16, ['BUT TO MYSELF I SEEM TO HAVE BEEN', 'ONLY LIKE A BOY PLAYING', 'ON THE SEA-SHORE,']));
  y += 330 + G;

  // 4 — the beach, wide
  r = PG.row(y, 300, [1]);
  PG.panel(r[0], null, (w, h) => {
    nightSky(w, h, { n: 110 });
    // cliff with the hotel lit up, far left
    shape([[-10, h * 0.1], [w * 0.1, h * 0.18], [w * 0.2, h * 0.34], [w * 0.24, h * 0.62], [-10, h * 0.66]], '#1a2346', { w: SC.BG });
    shape([[-10, h * 0.06], [w * 0.17, h * 0.06], [w * 0.17, h * 0.26], [-10, h * 0.3]], '#2a3358', { w: LW.fine, lin: true });
    shape([[-10, h * 0.02], [w * 0.18, h * 0.02], [w * 0.18, h * 0.07], [-10, h * 0.07]], '#3a4470', { w: LW.fine, lin: true });
    for (let k = 0; k < 14; k++) I.rect(w * 0.01 + (k % 7) * 20, h * 0.1 + Math.floor(k / 7) * 22, 8, 11, '#ffd67a');
    glowingSea(w, h * 0.5, h * 0.3, { rows: 5 });
    sand(w, h * 0.78, h * 0.3);
    // her small figure and footprints; the torch far away
    for (let k = 0; k < 9; k++) I.fill(I.ell(w * 0.26 + k * 22, h * 0.9 - (k % 2) * 4, 3, 1.6, 6), '#26335e', { wob: 0 });
    F.fig(C.ada, { x: w * 0.5, y: h * 0.88, s: 0.4, yaw: 70, legN: [18, -4], legF: [-14, 16], armN: [-10, 10], head: { yaw: 70 } });
    PG.glow(w * 0.84, h * 0.84, 40, '#fff3b0', 0.8);
    I.fill(I.ell(w * 0.84, h * 0.84, 3, 3, 8), '#fff6c8', { wob: 0 });
  });
  y += 300 + G;

  // 5 — the boy with the torch; 6 — hands and a shell
  r = PG.row(y, 340, [1.25, 1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, NIGHT.mid);
    I.rect(0, 0, w, h * 0.3, NIGHT.top);
    SC.stars(w, h * 0.28, 30, '#fff6dc');
    glowingSea(w, h * 0.3, h * 0.2, { rows: 3 });
    sand(w, h * 0.5, h * 0.5, { dots: 60 });
    // the torch circle on the sand
    I.emit(`<g transform="translate(${w * 0.48} ${h * 0.8}) scale(1 0.3)">`); PG.glow(0, 0, 170, '#ffe79a', 0.85); I.emit('</g>');
    PG.glow(w * 0.5, h * 0.62, 120, '#ffe79a', 0.3);
    pebble(w * 0.44, h * 0.8, 1); shell(w * 0.56, h * 0.79, 0.9, '#f7d9c4', 20); pebble(w * 0.36, h * 0.84, 0.7, '#9fa6c4');
    // Ada kneels on the sand; Toby crouches opposite with the torch
    const shellPt = [w * 0.5, h * 0.8];
    F.fig({ ...C.ada, shoes: C.ada.head.skin }, { x: w * 0.3, y: h * 0.9, sit: 0, plant: true, kneel: true, s: 1.0, yaw: 60, lean: 22, legN: [30, -5], legF: [-70, -95], reachN: [shellPt[0] - 22, shellPt[1] - 2], bendN: 1, hideF: true, handN: 'pinch', head: { yaw: 50, pitch: -12, look: [0.4, 0.9], mood: 'smile' } });
    const t = F.fig(C.toby, { x: w * 0.7, y: h * 0.9, sit: 0, plant: true, kneel: true, s: 1.0, yaw: -60, lean: 20, legN: [30, -5], legF: [-70, -95], armN: [70, 20], hideF: true, handN: 'grip', head: { yaw: -40, pitch: -6, look: [-0.5, 0.6], mood: 'joy' } });
    torch(t.armN[2][0] - 8, t.armN[2][1] + 4, 150, 1.1, 60);
  }, (w, h) => PG.caption(16, 16, ['AND DIVERTING MYSELF IN NOW AND', 'THEN FINDING A SMOOTHER PEBBLE']));
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, NIGHT.sand);
    I.fill(I.ell(w * 0.5, h * 0.58, w * 0.62, h * 0.5, 40), '#e8d9a8', { wob: 0 });
    I.fill(I.ell(w * 0.5, h * 0.58, w * 0.62, h * 0.5, 40), PG.radial(w * 0.5, h * 0.58, w * 0.62, [[0, '#fff7d0'], [1, '#c9b77e']]), { wob: 0 });
    for (let k = 0; k < 40; k++) I.fill(I.ell(I.rng() * w, h * 0.3 + I.rng() * h * 0.7, 1.4, 1, 6), '#b3a06a', { wob: 0 });
    // her old hand from the left, his small hand from the right, a shell passed between
    tube([[-20, h * 0.78], [w * 0.28, h * 0.66]], 36, C.ada.head.skin, 2.3);
    I.grp(`translate(${w * 0.28} ${h * 0.66})`, () => hand(0, 0, -16, 4.2, 'flat', { skin: C.ada.head.skin }));
    for (let k = 0; k < 4; k++) line([[w * 0.2 + k * 8, h * 0.72 + k * 2], [w * 0.22 + k * 8, h * 0.7 + k * 2]], 1, { op: 0.6 });
    tube([[w + 20, h * 0.8], [w * 0.74, h * 0.62]], 30, C.toby.head.skin, 2.3);
    I.grp(`translate(${w * 0.74} ${h * 0.62})`, () => hand(0, 0, 196, 3.4, 'flat', { skin: C.toby.head.skin, flip: true }));
    shell(w * 0.52, h * 0.52, 2.8, '#f7c9b2', -10);
  }, (w, h) => PG.caption(16, 16, ['OR A PRETTIER SHELL', 'THAN ORDINARY,']));
  y += 340 + G;

  // 7 — a pause: the two of them from behind, small, on white
  const pw = 380, ph = 190;
  PG.panel({ x: (W - pw) / 2, y, w: pw, h: ph }, null, (w, h) => {
    nightSky(w, h, { n: 40 });
    glowingSea(w, h * 0.45, h * 0.3, { rows: 4 });
    sand(w, h * 0.72, h * 0.3, { dots: 20 });
    const dim = ['#16244a', 0.45];
    PG.glow(w * 0.5, h * 0.5, 160, '#6ff0e0', 0.25);
    F.fig(C.ada, { x: w * 0.42, y: h * 0.9, sit: 0, plant: true, kneel: true, s: 0.62, yaw: 165, legN: [30, -5], legF: [-50, -85], tint: dim, head: { yaw: 172, pitch: 8 } });
    F.fig(C.toby, { x: w * 0.6, y: h * 0.9, sit: 0, plant: true, kneel: true, s: 0.62, yaw: 172, legN: [30, -5], legF: [-50, -85], tint: dim, head: { yaw: 168, pitch: 10 } });
  });
  y += ph + G + 10;

  // 8 — the great ocean
  const sh = 640;
  r = PG.row(y, sh, [1]);
  PG.panel(r[0], null, (w, h) => {
    nightSky(w, h, { milky: true, n: 160, band: 0.65 });
    glowingSea(w, h * 0.55, h * 0.36, { rows: 9, glitter: w * 0.47 });
    sand(w, h * 0.9, h * 0.12, { dots: 30 });
    // the two tiny figures at the bottom, with the torch now switched off, and their footprints
    for (let k = 0; k < 12; k++) I.fill(I.ell(w * 0.1 + k * 26, h * 0.97 - (k % 2) * 3, 3, 1.6, 6), '#26335e', { wob: 0 });
    PG.glow(w * 0.47, h * 0.97, 120, '#6ff0e0', 0.35);
    I.emit(`<g opacity="0.35" transform="translate(0 ${h * 1.94}) scale(1 -1)">`); F.fig(C.ada, { x: w * 0.44, y: h * 0.97, s: 0.62, yaw: 170, sil: '#0a1433', head: { yaw: 175 } }); I.emit('</g>');
    const lit = ['#123060', 0.4];
    F.fig(C.ada, { x: w * 0.44, y: h * 0.97, s: 0.62, yaw: 170, tint: lit, head: { yaw: 172, pitch: 10 } });
    F.fig(C.toby, { x: w * 0.51, y: h * 0.97, s: 0.62, yaw: 175, reachN: [w * 0.48, h * 0.83], tint: lit, head: { yaw: 168, pitch: 12 } });
  }, (w, h) => {
    PG.caption(w * 0.5 - 250, 40, ['WHILST THE GREAT OCEAN OF TRUTH', 'LAY ALL UNDISCOVERED BEFORE ME.'], { size: 21, style: 'plain', align: 'middle', w: 500, color: '#f4f1ff' });
    PG.caption(w - 300, h - 44, ['– ISAAC NEWTON'], { style: 'plain', size: 15, color: '#f4f1ff' });
  });
  y += sh;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, "Newton, as reported in Spence's Anecdotes (1820) and Brewster's Memoirs (1855). A homage to Zen Pencils by Gavin Aung Than.", { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 2', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'the-great-ocean.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
