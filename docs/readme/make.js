// make.js — draws the images used in the README, with the same engine as the comics.
// node docs/readme/make.js  -> docs/readme/*.svg (render with lib/render.js)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const I = require(ROOT + '/lib/ink');
const F = require(ROOT + '/zp/figure');
const HD = require(ROOT + '/zp/head');
const PG = require(ROOT + '/zp/page');
const SC = require(ROOT + '/zp/scene');
const { hand } = require(ROOT + '/zp/hand');
const { line, shape, LW, INK } = require(ROOT + '/zp/core');

// pull a cast definition out of a comic script without running the comic
function castFrom(file, name) {
  const src = fs.readFileSync(path.join(ROOT, 'comics', file), 'utf8');
  const i = src.indexOf(`const ${name} = {`);
  let k = src.indexOf('{', i), depth = 0, j = k;
  for (; j < src.length; j++) { if (src[j] === '{') depth++; if (src[j] === '}' && --depth === 0) break; }
  const lit = src.slice(k, j + 1).replace(/details: \(r\) => \w+\(r\)/g, 'details: null');
  return Function(`return (${lit});`)();
}
const UP = require(ROOT + '/comics/cast_uphill');
const OC = require(ROOT + '/comics/cast_ocean');
const CAST = {
  isla: UP.isla, grandad: UP.grandad, ada: OC.ada, toby: OC.toby,
  chen: castFrom('butterfly.js', 'chen'), maya: castFrom('thousand.js', 'maya'),
  dad: castFrom('thousand.js', 'dad'), peg: castFrom('wobbling.js', 'peg'),
};
CAST.maya.top.color = '#f2a23a';

function save(name, w, h, body) {
  fs.writeFileSync(path.join(__dirname, name + '.svg'), PG.svgDoc(w, h, body));
  console.log('wrote', name);
}

// ---- banner: the whole cast on one stage
I.seed(7);
(function banner() {
  const W = 1280, H = 420;
  I.rect(0, 0, W, H, PG.linear(0, 0, 0, H, [[0, '#f6c77c'], [0.6, '#fbe3b0'], [1, '#fff4d8']]));
  PG.rays(W * 0.5, H * 0.95, 60, 1400, 44, '#fff1c2', 2, { spread: 0.03 });
  SC.sun(W * 0.5, H * 0.95, 90, '#fff6d8', { glow: '#fff1c2' });
  SC.hills(W, H * 0.8, 30, '#a8c46a', { n: 3, bottom: H + 20 });
  const row = [
    ['peg', 0.08, 30, 'joy'], ['grandad', 0.2, 20, 'smile'], ['isla', 0.3, 25, 'joy'], ['ada', 0.41, 15, 'smile'],
    ['toby', 0.53, -10, 'joy'], ['chen', 0.65, -15, 'smile'], ['dad', 0.78, -20, 'smile'], ['maya', 0.9, -25, 'joy'],
  ];
  row.forEach(([k, x, yaw, mood], i) => {
    const up = i % 3 === 0;
    F.fig(CAST[k], { x: W * x, y: H * 0.94, s: 0.95, yaw, armN: up ? [150, 20] : [20, 30], armF: [-10, 10], handN: up ? 'open' : 'relaxed', head: { yaw, mood } });
  });
  PG.sfx(W * 0.5, 120, 'COMICS IN CODE', { size: 108, color: '#2f7a8a', rot: -2, sw: 4, ls: 3 });
  I.text(W * 0.5, 168, 'ZEN PENCILS-STYLE COMICS, DRAWN LINE BY LINE WITH JAVASCRIPT', { font: 'Letter', size: 17, ls: 2 });
  save('banner', W, H, I.take());
})();

// ---- turnaround: one head design, many angles
(function turnaround() {
  const W = 1280, H = 300;
  I.rect(0, 0, W, H, '#4fb3bd');
  const yaws = [-150, -90, -60, -30, 0, 30, 60, 90];
  yaws.forEach((y, i) => HD.head(CAST.peg.head, { x: 90 + i * 157, y: 128, s: 1.9, yaw: y, mood: 'smile' }));
  yaws.forEach((y, i) => I.text(90 + i * 157, 268, `${y}°`, { font: 'Letter', size: 18, color: '#ffffff' }));
  save('turnaround', W, H, I.take());
})();

// ---- moods
(function moods() {
  const W = 1280, H = 260;
  I.rect(0, 0, W, H, '#f2e6d0');
  const ms = ['neutral', 'smile', 'joy', 'worried', 'sad', 'shock', 'angry', 'focus', 'tired', 'shut'];
  ms.forEach((m, i) => { HD.head(CAST.toby.head, { x: 70 + i * 126, y: 110, s: 1.8, yaw: 20, mood: m, mouth: m === 'shut' ? 'smile' : undefined, blink: m === 'shut' }); I.text(70 + i * 126, 232, m.toUpperCase(), { font: 'Letter', size: 14 }); });
  save('moods', W, H, I.take());
})();

// ---- poses: the rig with IK
(function poses() {
  const W = 1280, H = 360;
  I.rect(0, 0, W, H, '#dfe8ee');
  const g = H * 0.9;
  line([[0, g], [W, g]], 2);
  // walking
  F.fig(CAST.chen, { x: 110, y: g, s: 1, yaw: 60, legN: [26, -6], legF: [-22, 24], armN: [-26, 14], armF: [28, 18], head: { yaw: 55, mood: 'smile' } });
  // pointing up (IK)
  F.fig(CAST.grandad, { x: 280, y: g, s: 1, yaw: 40, reachN: [380, 60], bendN: -1, handN: 'point', head: { yaw: 40, pitch: 10, look: [0.6, -1], mood: 'smile' } });
  // sitting on a bench
  shape(I.rectPts(420, g - 64, 120, 10), '#8a5a3a', { w: 2, lin: true });
  shape(I.rectPts(426, g - 54, 8, 54), '#8a5a3a', { w: 2, lin: true }); shape(I.rectPts(526, g - 54, 8, 54), '#8a5a3a', { w: 2, lin: true });
  F.fig(CAST.ada, { x: 480, y: g - 64, sit: 0, s: 1, yaw: 25, legN: [4, 4], legF: [0, 10], armN: [30, 60], head: { yaw: 25, mood: 'smile' } });
  // kneeling
  F.fig(CAST.toby, { x: 640, y: g, sit: 0, plant: true, kneel: true, s: 1.1, yaw: 60, lean: 16, legN: [30, -5], legF: [-50, -85], reachN: [700, g - 20], handN: 'pinch', head: { yaw: 55, pitch: -10, look: [0.4, 0.9], mood: 'focus' } });
  // cheering
  F.fig(CAST.maya, { x: 800, y: g, s: 1.1, yaw: 0, armN: [160, 10], armF: [160, 10], handN: 'open', handF: 'open', head: { yaw: 0, mood: 'joy' } });
  // back view
  F.fig(CAST.dad, { x: 930, y: g, s: 1, yaw: 170, head: { yaw: 170 } });
  // holding hands (IK on both)
  const a = F.rig(CAST.peg, { x: 1080, y: g, s: 1, yaw: 60 });
  const b = F.rig(CAST.isla, { x: 1180, y: g, s: 1, yaw: -60 });
  const mid = [(a.shN[0] + b.shN[0]) / 2, b.shN[1] + 30];
  F.fig(CAST.peg, { x: 1080, y: g, s: 1, yaw: 60, reachN: mid, head: { yaw: 50, mood: 'smile' } });
  F.fig(CAST.isla, { x: 1180, y: g, s: 1, yaw: -60, reachN: [mid[0] + 4, mid[1] - 2], head: { yaw: -40, pitch: 8, look: [-0.5, -0.6], mood: 'joy' } });
  ['WALK', 'POINT (IK)', 'SIT', 'KNEEL', 'CHEER', 'FROM BEHIND', 'HOLD HANDS (IK)'].forEach((t, i) => I.text([110, 300, 480, 650, 800, 930, 1130][i], 30, t, { font: 'Letter', size: 15 }));
  save('poses', W, H, I.take());
})();

// ---- hands
(function hands() {
  const W = 1280, H = 250;
  I.rect(0, 0, W, H, '#f2e6d0');
  ['relaxed', 'open', 'point', 'fist', 'grip', 'pinch', 'flat'].forEach((p, i) => {
    hand(90 + i * 176, 190, -80, 6.2, p, { skin: i % 2 ? '#8a5a3e' : '#f3cda8' });
    I.text(110 + i * 176, 236, p.toUpperCase(), { font: 'Letter', size: 14 });
  });
  save('hands', W, H, I.take());
})();
