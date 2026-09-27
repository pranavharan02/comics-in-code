// THE BUTTERFLY — Chuang Tzu, tr. Herbert A. Giles (1889). A Zen-Pencils-style strip drawn in code.
// node comics/butterfly.js -> out/the-butterfly.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, limb } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand, tube } = require('../zp/hand');

I.seed(1889);
const W = 980;
let H = 0;
const mix = F.mix;
const TIE = '#2f5fa8', DOT = '#f2c230';
const chen = { H: 3.7, build: 1.02, head: { skin: '#f0cfa8', hair: '#1f1a1c', hairStreak: '#4a5a78', hairStyle: 'short', hairline: 0.2, napeLevel: 0.3, R: 27, tall: 1.12, jaw: 1.2, jawW: 0.66, eyeW: 0.24, eyeH: 0.26, age: 0.35, nose: 'button', noseLen: 0.14, browThick: 1.1 },
  top: { color: '#f4f4f0', sleeve: 'long', collar: '#ffffff', details: (r) => tie(r) }, bottom: { type: 'pants', color: '#3d4458' }, shoes: '#2a2224' };
const OFFICE = { wall: '#5f7f86', wallDark: '#3f5a62', desk: '#8aa3a4', floor: '#4a666c', screen: '#bfe6e8', tint: ['#3f5a62', 0.18] };

function tie(r) {
  if (Math.abs(r.yaw) > 95) return;
  // a loosened tie with the yellow dots the butterfly will wear
  const n = r.neck, dir = r.dir, u = r.unit;
  const knot = [n[0] + dir * u * 0.04, n[1] + u * 0.1];
  const pts = [[knot[0] - u * 0.05, knot[1]], [knot[0] + u * 0.05, knot[1]], [knot[0] + u * 0.09, knot[1] + u * 0.75], [knot[0], knot[1] + u * 0.85], [knot[0] - u * 0.07, knot[1] + u * 0.74]];
  shape(pts, TIE, { w: LW.detail });
  [[0, 0.25], [0.03, 0.45], [-0.02, 0.62], [0.02, 0.78]].forEach(([dx, dy]) => I.fill(I.ell(knot[0] + dx * u, knot[1] + dy * u, u * 0.022, u * 0.022, 8), DOT, { wob: 0 }));
  shape(I.ell(knot[0], knot[1], u * 0.06, u * 0.05, 10), TIE, { w: LW.detail });
}
// the butterfly: blue wings with the tie's yellow dots. o.open 0..1 (wings shut .. spread)
function butterfly(x, y, s, o = {}) {
  const open = o.open ?? 0.8, rot = o.rot || 0;
  I.grp(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, () => {
    const wing = (sd, up) => {
      const k = up ? 1 : 0.7;
      const sx = sd * (0.25 + 0.75 * open);
      const pts = up ? [[0, -2], [sx * 10, -22 * k], [sx * 26, -26 * k], [sx * 30, -12 * k], [sx * 22, 2], [sx * 4, 4]] : [[0, 2], [sx * 18, 6], [sx * 24, 18 * k], [sx * 14, 26 * k], [sx * 4, 16]];
      shape(pts, o.color || TIE, { w: 1.8 });
      I.clipPoly(pts, () => {
        I.fill(pts.map(([px, py]) => [px * 0.7, py * 0.7]), mix(o.color || TIE, '#ffffff', 0.25), { wob: 0 });
        (up ? [[sx * 20, -18 * k, 3.2], [sx * 12, -10 * k, 2.4], [sx * 24, -8 * k, 2.2]] : [[sx * 14, 14 * k, 2.6], [sx * 8, 8, 1.8]]).forEach(([dx, dy, r]) => I.fill(I.ell(dx, dy, r, r, 8), o.dot || DOT, { wob: 0 }));
      });
    };
    wing(-1, false); wing(1, false); wing(-1, true); wing(1, true);
    shape(I.ell(0, 2, 2.2, 10, 10), INK, { w: 1 });
    line([[0, -8], [-5, -16], [-7, -17]], 1); line([[0, -8], [5, -16], [7, -17]], 1);
  });
}
function flower(x, y, s, petal, centre = '#f2c230') {
  line([[x, y + 30 * s], [x + 2 * s, y]], 2.4, { color: '#3f7a3a' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; shape(I.ell(x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 7 * s, 7 * s, 10), petal, { w: 1.5 }); }
  shape(I.ell(x, y, 5 * s, 5 * s, 10), centre, { w: 1.5 });
}
function monitor(x, y, s, on = true) {
  if (on) PG.glow(x, y - 30 * s, 110 * s, '#bff0ff', 0.45);
  shape(I.rectPts(x - 44 * s, y - 64 * s, 88 * s, 56 * s), '#2a3238', { w: LW.detail, lin: true });
  shape(I.rectPts(x - 38 * s, y - 58 * s, 76 * s, 44 * s), on ? OFFICE.screen : '#3a4a50', { w: 1.4, lin: true });
  if (on) for (let k = 0; k < 5; k++) line([[x - 30 * s, y - (50 - k * 8) * s], [x + (10 - (k % 3) * 12) * s, y - (50 - k * 8) * s]], 1.4, { color: '#6aa8b0', taper: [0, 0] });
  shape(I.rectPts(x - 5 * s, y - 8 * s, 10 * s, 8 * s), '#2a3238', { w: 1.4, lin: true });
  shape(I.rectPts(x - 20 * s, y, 40 * s, 4 * s), '#2a3238', { w: 1.4, lin: true });
}
function desk(x, y, w, s = 1, c = OFFICE.desk) {
  shape(I.rectPts(x, y, w, 10 * s), c, { w: LW.detail, lin: true });
  shape(I.rectPts(x + w - 60 * s, y + 10 * s, 56 * s, 70 * s), mix(c, '#000000', 0.15), { w: LW.detail, lin: true });
  line([[x + w - 54 * s, y + 34 * s], [x + w - 12 * s, y + 34 * s]], 1.2, { lin: true });
  shape(I.rectPts(x + 6 * s, y + 10 * s, 8 * s, 70 * s), mix(c, '#000000', 0.15), { w: LW.detail, lin: true });
}
// office chair: seat, back and a star base on castors
function officeChair(x, y, s, dir = 1, c = '#2a3238') {
  shape(I.rectPts(x - 26 * s, y - 62 * s, 52 * s, 9 * s), c, { w: LW.detail, lin: true });
  shape([[x - dir * 30 * s, y - 60 * s], [x - dir * 36 * s, y - 130 * s], [x - dir * 22 * s, y - 132 * s], [x - dir * 16 * s, y - 60 * s]], c, { w: LW.detail, lin: true });
  shape(I.rectPts(x - 4 * s, y - 53 * s, 8 * s, 40 * s), '#4a5560', { w: 1.6, lin: true });
  line([[x - 30 * s, y - 8 * s], [x + 30 * s, y - 8 * s]], 4, { taper: [0, 0] });
  [-30, 0, 30].forEach((dx) => shape(I.ell(x + dx * s, y - 4 * s, 4 * s, 4 * s, 8), '#1a1618', { w: 1 }));
}
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}

function page() {
  // ---- title: the words drift like a butterfly
  PG.sfx(116, 110, 'THE', { size: 56, color: DOT, anchor: 'start', rot: -4, sw: 3 });
  PG.sfx(116, 204, 'BUTTERFLY', { size: 112, color: TIE, anchor: 'start', rot: -3, sw: 3.4, ls: 3 });
  credits(118, 244, [['WORDS BY ', INK], ['CHUANG TZU', TIE], ['   (TR. H. A. GILES)      ART BY ', INK], ['CLAUDE', '#c99a1a']]);
  I.ink([[640, 150], [700, 110], [720, 150], [780, 90], [800, 120], [860, 60]], 1.6, { color: '#8aa3a4', taper: [0.4, 0.4] });
  butterfly(870, 60, 2.2, { rot: 20 });
  let y = 276;
  const G = PG.GUT_V;
  let r;

  // 1 — the office at 3 a.m.
  r = PG.row(y, 380, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, OFFICE.wallDark);
    // night windows along the back wall
    for (let k = 0; k < 5; k++) {
      const wx = 30 + k * 180, ww = 130;
      I.rect(wx, 24, ww, 170, '#16213a');
      I.clipRect(wx, 24, ww, 170, () => { SC.skyline(ww + wx + 40, 194, '#0e1628', { windows: 0.12, windowColor: '#e8c86a', min: 50, var: 120 }); });
      shape([[wx, 24], [wx + ww, 24], [wx + ww, 194], [wx, 194], [wx, 24], [wx - 6, 18], [wx - 6, 200], [wx + ww + 6, 200], [wx + ww + 6, 18], [wx - 6, 18]], '#4f6a72', { w: LW.detail, lin: true });
    }
    I.rect(0, 200, w, h - 200, OFFICE.floor);
    line([[-4, 200], [w + 4, 200]], LW.detail, { taper: [0, 0] });
    // rows of empty desks with dark monitors, one lit desk far right
    [[40, 250, 0.7], [250, 250, 0.7], [460, 250, 0.7]].forEach(([x, yy, s]) => { desk(x, yy, 170 * s * 1.3, s); monitor(x + 60, yy, s, false); monitor(x + 130, yy, s, false); });
    [[0, 320, 1], [300, 320, 1]].forEach(([x, yy, s]) => { desk(x, yy, 240, s); monitor(x + 70, yy, s, false); monitor(x + 170, yy, s, false); });
    // the one lit desk, and Chen hunched at it
    desk(620, 300, 240, 1);
    monitor(760, 300, 1, true);
    officeChair(690, 380, 0.9, 1);
    const c0 = F.rig(chen, { x: 690, y: 380, sit: 60, s: 0.9, yaw: 55, lean: 22 });
    shape([[736, 296], [760, 294], [762, 302], [738, 304]], '#2a3238', { w: 1.4 });
    F.fig(chen, { x: 690, y: 380, sit: 60, s: 0.9, yaw: 55, lean: 22, legN: [4, 4], legF: [0, 10], reachN: [748, 296], reachF: [c0.headC[0] + 8, c0.headC[1] + c0.R * 1.1], handN: 'grip', handF: 'fist', armOver: false, tint: OFFICE.tint, head: { yaw: 60, pitch: -12, look: [0.8, 0], mood: 'tired' } });
    // wall clock on the pillar, 3:07
    const ccx = 30 + 3 * 180 + 130 + 25, ccy = 70;
    shape(I.ell(ccx, ccy, 20, 20, 20), '#f4f4f0', { w: LW.detail });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; line([[ccx + Math.cos(a) * 15, ccy + Math.sin(a) * 15], [ccx + Math.cos(a) * 17.5, ccy + Math.sin(a) * 17.5]], 1, { taper: [0, 0] }); }
    const hand_ = (deg, L, wd) => { const a = ((deg - 90) * Math.PI) / 180; line([[ccx, ccy], [ccx + Math.cos(a) * L, ccy + Math.sin(a) * L]], wd, { taper: [0, 0.3] }); };
    hand_(90 + 3.5, 9, 2.6); hand_(42, 14, 1.8);
  }, (w, h) => PG.caption(16, 16, ['ONCE UPON A TIME, I, CHUANG TZŬ,', 'DREAMT I WAS A BUTTERFLY,']));
  y += 380 + G;

  // 2 — close: head sinking; 3 — the butterfly lifts off his back
  r = PG.row(y, 300, [1, 1.3]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, OFFICE.wallDark);
    PG.glow(w * 0.85, h * 0.3, 200, '#bff0ff', 0.4);
    shape([[-10, h * 0.66], [w + 10, h * 0.66], [w + 10, h + 10], [-10, h + 10]], OFFICE.desk, { w: LW.detail });
    // keyboard
    shape([[w * 0.54, h * 0.72], [w * 0.98, h * 0.72], [w * 1.02, h * 0.84], [w * 0.5, h * 0.84]], '#2a3238', { w: LW.detail, lin: true });
    for (let k = 0; k < 14; k++) for (let j = 0; j < 2; j++) I.rect(w * 0.54 + k * 14 + j * 4, h * 0.745 + j * 12, 10, 8, '#4a5a64');
    // folded arms and the head going down onto them
    tube([[-30, h * 0.8], [w * 0.5, h * 0.7]], 44, '#f4f4f0', 2.3);
    tube([[-30, h * 0.92], [w * 0.46, h * 0.82]], 44, '#f4f4f0', 2.3);
    HD.head(chen.head, { x: w * 0.3, y: h * 0.5, s: 2.2, yaw: 40, pitch: -15, blink: true, mood: 'shut' });
    I.text(w * 0.6, h * 0.3, 'z', { font: 'Title', size: 28, color: '#dff4f6' });
    I.text(w * 0.68, h * 0.2, 'z', { font: 'Title', size: 36, color: '#dff4f6' });
  });
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, OFFICE.wallDark);
    PG.glow(w * 0.8, h * 0.6, 240, '#bff0ff', 0.35);
    shape([[-10, h * 0.7], [w + 10, h * 0.7], [w + 10, h + 10], [-10, h + 10]], OFFICE.desk, { w: LW.detail });
    monitor(w * 0.82, h * 0.7, 1.2, true);
    // Chen slumped, seen from behind and above; a butterfly rising off his back
    officeChair(w * 0.36, h * 0.98, 1.05, -1);
    const cr = F.rig(chen, { x: w * 0.36, y: h * 0.98, sit: 60, s: 1.05, yaw: 145, lean: 55, headDX: 26, headDY: 34 });
    F.fig(chen, { x: w * 0.36, y: h * 0.98, sit: 60, s: 1.05, yaw: 145, lean: 55, headDX: 26, headDY: 34, legN: [0, 0], legF: [0, 0], reachN: [cr.headC[0] + 34, h * 0.7 - 4], reachF: [cr.headC[0] + 20, h * 0.7 - 8], bendN: -1, bendF: -1, handN: 'flat', handF: 'flat', tint: OFFICE.tint, head: { yaw: 160, pitch: -15 } });
    for (let k = 0; k < 10; k++) I.fill(I.ell(cr.shN[0] + 20 + I.rng() * 60, cr.shN[1] - 30 - I.rng() * 50, 1.6, 1.6, 6), k % 2 ? TIE : DOT, { wob: 0 });
    // a dotted trail of flight
    for (let k = 0; k < 7; k++) I.fill(I.ell(cr.shN[0] + 10 + k * 20, cr.shN[1] - 20 - k * 14 + Math.sin(k) * 8, 1.8, 1.8, 6), '#dff4f6', { wob: 0 });
    butterfly(cr.shN[0] + 170, cr.shN[1] - 130, 1.6, { rot: 15, open: 0.7 });
  }, (w, h) => PG.caption(16, 16, ['FLUTTERING HITHER AND THITHER,', 'TO ALL INTENTS AND PURPOSES', 'A BUTTERFLY.']));
  y += 300 + G;

  // 4 — out over the night city
  r = PG.row(y, 300, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, '#0f1a38'], [0.7, '#2c3f6e'], [1, '#e8a36a']]));
    SC.stars(w, h * 0.4, 60, '#fff3cf');
    SC.skyline(w, h * 0.95, '#1a2340', { windows: 0.25, windowColor: '#f2c86a', min: 70, var: 150, gap: 4 });
    SC.skyline(w, h + 20, '#0d1428', { windows: 0.15, windowColor: '#f2c86a', min: 30, var: 90, gap: 2 });
    for (let k = 0; k < 20; k++) I.fill(I.ell(80 + k * 30 + Math.sin(k) * 10, h * 0.62 - k * 8 + Math.cos(k * 1.3) * 12, 1.6, 1.6, 6), '#fff3cf', { wob: 0, op: 0.8 });
    butterfly(w * 0.78, h * 0.3, 1.1, { rot: 25 });
  });
  y += 300 + G;

  // 5 — the dream: a sunlit rooftop meadow; 6 — on a flower
  r = PG.row(y, 340, [1.5, 1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, '#7fd3f0'], [1, '#e8f7ff']]));
    SC.sun(w * 0.86, h * 0.18, 34, '#fff6c8', { glow: '#fff6c8' });
    // distant towers, pale in the haze
    SC.skyline(w, h * 0.62, '#b9dcee', { min: 40, var: 90, gap: 6 });
    shape([[-10, h * 0.58], [w * 0.4, h * 0.52], [w + 10, h * 0.6], [w + 10, h + 10], [-10, h + 10]], '#7cc26a', { w: SC.BG });
    const cols = ['#ef6a7a', '#f2c230', '#ffffff', '#b884e0', '#ff9a4a'];
    // water tank on the next roof
    shape(I.rectPts(w * 0.72, h * 0.3, 60, 44), '#8a6a50', { w: LW.fine, lin: true });
    shape([[w * 0.72 - 4, h * 0.3], [w * 0.72 + 30, h * 0.24], [w * 0.72 + 64, h * 0.3]], '#6a4a38', { w: LW.fine, lin: true });
    [0, 20, 40, 56].forEach((dx) => line([[w * 0.72 + dx + 2, h * 0.3 + 44], [w * 0.72 + dx, h * 0.42]], 2, { taper: [0, 0] }));
    // flowers, smaller toward the back, in drifts
    for (let k = 0; k < 90; k++) { const t = ((k * 37) % 100) / 100; const fx = ((k * 97) % (w + 40)) - 20, fy = h * (0.58 + t * 0.3); flower(fx, fy, 0.4 + t * 0.9, cols[(k * 3) % cols.length]); }
    // the parapet of the roof
    shape([[-10, h * 0.9], [w + 10, h * 0.9], [w + 10, h + 10], [-10, h + 10]], '#b9a58a', { w: LW.detail, lin: true });
    for (let x = 0; x < w; x += 40) line([[x, h * 0.9], [x, h + 4]], 1.2, { color: '#8a7a64', taper: [0, 0] });
    [[0.2, 0.3, 1.2, -10, '#ef6a7a'], [0.34, 0.2, 0.9, 20, '#b884e0'], [0.6, 0.34, 1.0, 5, '#f2a23a'], [0.72, 0.5, 0.8, -20, '#ffffff']].forEach(([x, yy, s, rt, c]) => butterfly(x * w, yy * h, s * 1.3, { rot: rt, color: c, dot: '#2a2224' }));
    butterfly(w * 0.48, h * 0.4, 1.9, { rot: -8 });
  }, (w, h) => PG.caption(16, 16, ['I WAS CONSCIOUS ONLY OF FOLLOWING', 'MY FANCIES AS A BUTTERFLY,']));
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, PG.radial(w * 0.6, h * 0.3, w, [[0, '#fff6c8'], [1, '#7fd3f0']]));
    PG.rays(w * 0.7, h * 0.2, 30, 600, 24, '#ffffff', 2, { spread: 0.04 });
    line([[w * 0.46, h + 10], [w * 0.5, h * 0.7], [w * 0.48, h * 0.56]], 6, { color: '#3f7a3a', taper: [0, 0.3] });
    shape([[w * 0.5, h * 0.8], [w * 0.7, h * 0.7], [w * 0.62, h * 0.82]], '#5aa04a', { w: LW.detail });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; shape(I.ell(w * 0.48 + Math.cos(a) * 40, h * 0.5 + Math.sin(a) * 22, 26, 16, 14, a), '#ef6a7a', { w: LW.detail }); }
    shape(I.ell(w * 0.48, h * 0.5, 22, 13, 14), '#f2c230', { w: LW.detail });
    for (let k = 0; k < 12; k++) I.fill(I.ell(w * 0.48 + ((k * 13) % 30) - 15, h * 0.5 + ((k * 7) % 14) - 7, 1.6, 1.6, 6), '#c98a1a', { wob: 0 });
    butterfly(w * 0.5, h * 0.4, 3.4, { open: 0.95 });
  }, (w, h) => PG.caption(16, h - 72, ['AND WAS UNCONSCIOUS OF', 'MY INDIVIDUALITY AS A MAN.'], { size: 14 }));
  y += 340 + G;

  // 7 — BRRRING
  r = PG.row(y, 330, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, '#e8d9a0');
    PG.rays(w * 0.5, h * 0.55, 40, 800, 36, '#f5e7b8', 3);
    shape([[-10, h * 0.78], [w + 10, h * 0.78], [w + 10, h + 10], [-10, h + 10]], OFFICE.desk, { w: LW.detail });
    // the phone rattling
    const px = w * 0.8, py = h * 0.74;
    shape([[px - 40, py], [px - 32, py - 30], [px + 32, py - 30], [px + 40, py]], '#c0392b', { w: LW.detail });
    shape(I.ell(px, py - 16, 13, 9, 16), '#f4f4f0', { w: 1.6 });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; I.fill(I.ell(px + Math.cos(a) * 8, py - 16 + Math.sin(a) * 5.5, 1.6, 1.4, 6), INK, { wob: 0 }); }
    // the handset jumping off its cradle, cord curling
    I.grp(`translate(${px} ${py - 52}) rotate(-12)`, () => { shape([[-48, 6], [-44, -8], [-30, -10], [-26, 0], [26, 0], [30, -10], [44, -8], [48, 6], [30, 10], [-30, 10]], '#c0392b', { w: LW.detail }); });
    for (let k = 0; k < 6; k++) I.ink(I.ell(px + 44 + k * 3, py - 24 + k * 4, 5, 4, 10), 1.2, { closed: true });
    [[-60, -40], [-66, -20], [60, -40], [66, -20]].forEach(([dx, dy]) => line([[px + dx, py + dy], [px + dx * 1.3, py + dy * 1.2]], 2.4, { taper: [0.2, 0.5] }));
    PG.sfx(px - 10, py - 70, 'BRRRING!', { size: 44, color: '#ffffff', rot: 6 });
    // Chen jolting upright, papers flying
    I.grp(`rotate(-12 ${w * 0.36} ${h * 0.98})`, () => { officeChair(w * 0.36, h * 0.98, 1.3, 1); F.fig(chen, { x: w * 0.36, y: h * 0.98, sit: 84, s: 1.35, yaw: 20, lean: -10, legN: [30, 10], legF: [20, 20], armN: [160, -30], armF: [150, -20], handN: 'open', handF: 'open', head: { yaw: 25, pitch: 6, look: [0.9, 0], mood: 'shock', mouth: 'o' } }); });
    PG.ticks(w * 0.42, h * 0.2, 60, 5, -170, -10, 16);
    [[0.18, 0.3, -20], [0.26, 0.12, 15], [0.62, 0.2, 30], [0.68, 0.42, -12], [0.12, 0.56, 8]].forEach(([x, yy, rt]) => SC.sheet(x * w, yy * h, 44, 56, rt, (ww, hh) => { for (let k = 0; k < 5; k++) line([[-ww / 2 + 6, -hh / 2 + 10 + k * 8], [ww / 2 - 8, -hh / 2 + 10 + k * 8]], 1, { color: '#9aa', taper: [0, 0] }); }));
  }, (w, h) => PG.caption(16, 16, ['SUDDENLY, I AWAKED, AND THERE', 'I LAY, MYSELF AGAIN.']));
  y += 330 + G;

  // 8 — his fingertips glitter with wing dust (a pause, centred on white)
  const pw = 400, ph = 230;
  PG.panel({ x: (W - pw) / 2, y, w: pw, h: ph }, null, (w, h) => {
    I.rect(0, 0, w, h, '#f4ecd8');
    tube([[-40, h * 0.9], [w * 0.4, h * 0.62]], 56, '#f4f4f0', 2.3);
    I.grp(`translate(${w * 0.4} ${h * 0.62})`, () => hand(0, 0, -30, 7.5, 'open', { skin: chen.head.skin }));
    // shimmer on the fingertips: blue and yellow dust
    for (let k = 0; k < 60; k++) { const a = -Math.PI * (0.1 + I.rng() * 0.8), d = 60 + I.rng() * 90; I.fill(I.ell(w * 0.58 + Math.cos(a) * d * 0.9, h * 0.34 + Math.sin(a) * d * 0.4 + 30, 1.6 + I.rng() * 1.6, 1.6 + I.rng() * 1.6, 6), I.rng() < 0.5 ? TIE : DOT, { wob: 0 }); }
    PG.ticks(w * 0.62, h * 0.3, 70, 5, -160, -20, 12);
  });
  y += ph + G + 10;

  // 9 — sunrise at the open window, a butterfly on his finger
  const SH = 560;
  r = PG.row(y, SH, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, '#f6c77c'], [0.55, '#fbe3b0'], [1, '#fff4d8']]));
    SC.sun(w * 0.62, h * 0.62, 70, '#fff6d8', { glow: '#fff1c2' });
    PG.rays(w * 0.62, h * 0.62, 80, 1000, 30, '#fff1c2', 2, { spread: 0.03 });
    SC.skyline(w, h * 0.86, '#c98a6a', { windows: 0.1, windowColor: '#fff1c2', min: 60, var: 140, gap: 4 });
    // the big window frame
    const fx = w * 0.06, fy = h * 0.06, fw = w * 0.88, fh = h * 0.8;
    shape([[fx - 30, fy - 30], [fx + fw + 30, fy - 30], [fx + fw + 30, fy + fh + 40], [fx - 30, fy + fh + 40], [fx - 30, fy - 30], [fx, fy], [fx, fy + fh], [fx + fw, fy + fh], [fx + fw, fy], [fx, fy]], '#5f7f86', { w: LW.contour, lin: true });
    // the right-hand pane swung open outward
    // the open pane: a frame you can see through
    const pane = [[fx + fw / 2, fy], [fx + fw * 0.8, fy + 30], [fx + fw * 0.8, fy + fh - 30], [fx + fw / 2, fy + fh]];
    const inner = [[fx + fw / 2 + 14, fy + 18], [fx + fw * 0.8 - 12, fy + 40], [fx + fw * 0.8 - 12, fy + fh - 40], [fx + fw / 2 + 14, fy + fh - 18]];
    I.emit(`<path fill-rule="evenodd" fill="#5f7f86" stroke="#070506" stroke-width="2" d="M${pane.map((q) => q.join(' ')).join('L')}Z M${inner.map((q) => q.join(' ')).join('L')}Z"/>`);
    I.fill(inner, '#fff4d8', { lin: true, op: 0.22, wob: 0 });
    line([inner[0].map((v, i) => v + (i ? 30 : 10)), inner[0].map((v, i) => v + (i ? 90 : 40))], 3, { color: '#ffffff', op: 0.7 });
    // Chen leaning out toward the sun, the butterfly at eye level on his finger
    const c = F.fig(chen, { x: w * 0.3, y: h + 90, s: 2.2, yaw: 60, lean: 10, reachN: [w * 0.5, h * 0.36], bendN: 1, reachF: [w * 0.34, fy + fh - 8], handN: 'point', handF: 'flat', armOver: true, tint: ['#c98a6a', 0.12], head: { yaw: 58, pitch: 4, look: [0.9, -0.1], mood: 'smile' } });
    shape(I.rectPts(fx - 40, fy + fh + 22, fw + 80, h), '#5f7f86', { w: LW.detail, lin: true });
    shape(I.rectPts(fx - 40, fy + fh, fw + 80, 22), '#8aa3a4', { w: LW.detail, lin: true });
    const [hx, hy] = c.armN[2];
    butterfly(hx + 22, hy - 34, 2.0, { open: 0.6, rot: -20 });
    // tie loosened, top button undone, the dawn on his face
  }, (w, h) => {
    PG.caption(w - 420, h - 150, ['NOW I DO NOT KNOW WHETHER I WAS', 'THEN A MAN DREAMING I WAS A BUTTERFLY,', 'OR WHETHER I AM NOW A BUTTERFLY', 'DREAMING I AM A MAN.'], { size: 15, attrib: '– CHUANG TZU' });
  });
  y += SH;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, 'Chuang Tzu (Zhuangzi), ch. II, tr. Herbert A. Giles (1889). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 3', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'the-butterfly.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
