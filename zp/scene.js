// zp/scene.js — backgrounds and props in ZP's manner: flat colour fields, a thinner pen than the
// figures (backgrounds sit back), a few texture marks rather than rendering, strong silhouettes.
const I = require('../lib/ink');
const { INK, LW, line, shape } = require('./core');
const BG = 1.8; // background line weight

// ---- nature -------------------------------------------------------------------------------------
function hills(w, y, amp, color, o = {}) {
  const pts = [[-10, o.bottom ?? y + 400]];
  const n = o.n || 5, ph = o.phase || 0;
  for (let i = 0; i <= 40; i++) {
    const x = -10 + (i / 40) * (w + 20);
    pts.push([x, y - amp * (0.5 + 0.5 * Math.sin((i / 40) * Math.PI * n * 0.5 + ph)) - (o.slope || 0) * (x / w)]);
  }
  pts.push([w + 10, o.bottom ?? y + 400]);
  shape(pts, color, { w: o.w ?? BG });
  if (o.tufts) for (let i = 0; i < o.tufts; i++) { const x = I.rng() * w; const yy = y + 12 + I.rng() * 60; line([[x, yy], [x + 3, yy - 6], [x + 6, yy]], 1.3, { color: o.tuftColor || INK, taper: [0.2, 0.2] }); }
}
function sea(w, y, h, color, o = {}) {
  I.rect(-2, y, w + 4, h, color);
  line([[-4, y], [w + 4, y]], BG, { taper: [0, 0] });
  const lc = o.lineColor || '#ffffff';
  for (let i = 0; i < (o.waves ?? 14); i++) {
    const x = I.rng() * w, yy = y + 10 + I.rng() * (h - 20), l = 14 + I.rng() * 26;
    line([[x, yy], [x + l * 0.5, yy - 3], [x + l, yy]], 1.6, { color: lc, taper: [0.3, 0.3] });
  }
}
function tree(x, y, h, o = {}) {
  const trunk = o.trunk || '#7a4e31', leaf = o.leaf || '#4f8a4a';
  shape([[x - h * 0.04, y], [x - h * 0.03, y - h * 0.45], [x + h * 0.03, y - h * 0.45], [x + h * 0.05, y]], trunk, { w: BG, lin: true });
  const blobs = o.blobs || [[0, -0.62, 0.3], [-0.18, -0.52, 0.2], [0.18, -0.5, 0.2], [0, -0.82, 0.22]];
  const pts = [];
  blobs.forEach(([dx, dy, r]) => { for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; pts.push([x + dx * h + Math.cos(a) * r * h, y + dy * h + Math.sin(a) * r * h]); } });
  const hull = require('./head').convexHull(pts);
  const bumpy = hull.map(([px, py], i) => [px + (i % 2 ? 0 : (px - x) * 0.02), py + (i % 2 ? 0 : (py - (y - 0.62 * h)) * 0.03)]);
  shape(bumpy, leaf, { w: BG });
  for (let i = 0; i < 6; i++) { const a = I.rng() * Math.PI * 2, rr = I.rng() * h * 0.2; const cx = x + Math.cos(a) * rr, cy = y - h * 0.62 + Math.sin(a) * rr; line([[cx - 5, cy], [cx, cy - 4], [cx + 5, cy]], 1.2, { color: o.leafLine || '#2f5a2e', taper: [0.3, 0.3] }); }
}
function cloud(x, y, s, color = '#ffffff', o = {}) {
  const pts = [];
  [[0, 0, 1], [-0.9, 0.25, 0.7], [0.9, 0.25, 0.75], [-0.4, -0.35, 0.7], [0.45, -0.3, 0.65]].forEach(([dx, dy, r]) => { for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; pts.push([x + (dx + Math.cos(a) * r) * s, y + (dy + Math.sin(a) * r * 0.8) * s]); } });
  let hull = require('./head').convexHull(pts);
  hull = hull.filter(([, py]) => py <= y + 0.5 * s);
  shape(hull, color, { w: o.w ?? BG });
}
function stars(w, h, n, color = '#fff6d6', o = {}) {
  for (let i = 0; i < n; i++) {
    const x = I.rng() * w, y = I.rng() * h * (o.band || 1), r = 0.8 + I.rng() * (o.max || 1.8);
    if (I.rng() < 0.12) { line([[x - r * 3, y], [x + r * 3, y]], 1.2, { color, taper: [0.4, 0.4] }); line([[x, y - r * 3], [x, y + r * 3]], 1.2, { color, taper: [0.4, 0.4] }); }
    else I.fill(I.ell(x, y, r, r, 6), color, { wob: 0 });
  }
}
function moon(x, y, r, color = '#fff3c4', sky) {
  shape(I.ell(x, y, r, r, 24), color, { w: 0 });
  if (sky) I.fill(I.ell(x + r * 0.45, y - r * 0.2, r * 0.9, r * 0.9, 24), sky, { wob: 0 });
}
function sun(x, y, r, color = '#ffe7a3', o = {}) {
  if (o.glow) I.fill(I.ell(x, y, r * 2.2, r * 2.2, 24), o.glow, { wob: 0, op: 0.35 });
  shape(I.ell(x, y, r, r, 24), color, { w: o.w ?? 0 });
}
function rain(w, h, n, color = '#ffffff', ang = 78) {
  const a = (ang * Math.PI) / 180;
  for (let i = 0; i < n; i++) { const x = I.rng() * (w + 60) - 30, y = I.rng() * h, l = 10 + I.rng() * 14; line([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 1.3, { color, taper: [0.3, 0.3] }); }
}

// ---- interiors ----------------------------------------------------------------------------------
// back wall + floor: a floor line with a couple of boards/tiles; optional skirting
function room(w, h, o) {
  I.rect(-2, -2, w + 4, o.floorY + 2, o.wall);
  if (o.wallLines) for (let x = o.wallLines.start; x < w; x += o.wallLines.step) line([[x, -4], [x, o.floorY]], 1.2, { color: o.wallLines.color, taper: [0, 0] });
  I.rect(-2, o.floorY, w + 4, h - o.floorY + 4, o.floor);
  line([[-4, o.floorY], [w + 4, o.floorY]], BG, { taper: [0, 0] });
  if (o.skirting) { I.rect(-2, o.floorY - 8, w + 4, 8, o.skirting); line([[-4, o.floorY - 8], [w + 4, o.floorY - 8]], 1.4, { taper: [0, 0] }); }
  if (o.boards) {
    const vp = o.vp || [w / 2, o.floorY - 200];
    for (let x0 = -w; x0 < w * 2; x0 += o.boards) {
      const t = (h - vp[1]) / (o.floorY - vp[1]);
      line([[x0, o.floorY], [vp[0] + (x0 - vp[0]) * t, h + 4]], 1.2, { color: o.boardColor || INK, taper: [0, 0], op: 0.6 });
    }
  }
}
function windowFrame(x, y, w, h, o = {}) {
  const f = o.frame || '#ffffff';
  I.rect(x, y, w, h, o.sky || '#9fd3e8');
  if (o.view) I.clipRect(x, y, w, h, () => o.view(x, y, w, h));
  const t = o.t || 8;
  shape([[x - t, y - t], [x + w + t, y - t], [x + w + t, y + h + t], [x - t, y + h + t], [x - t, y - t], [x, y], [x, y + h], [x + w, y + h], [x + w, y], [x, y]], f, { w: BG, lin: true });
  if (o.cross !== false) {
    shape(I.rectPts(x + w / 2 - t / 3, y, (t * 2) / 3, h), f, { w: 1.4, lin: true });
    shape(I.rectPts(x, y + h / 2 - t / 3, w, (t * 2) / 3), f, { w: 1.4, lin: true });
  }
  if (o.sill) shape(I.rectPts(x - t - 8, y + h + t, w + 2 * t + 16, 8), f, { w: BG, lin: true });
}
function door(x, y, w, h, color, o = {}) {
  shape(I.rectPts(x, y, w, h), color, { w: BG, lin: true });
  shape(I.rectPts(x + w * 0.14, y + h * 0.08, w * 0.72, h * 0.36), o.panel || color, { w: 1.3, lin: true });
  shape(I.rectPts(x + w * 0.14, y + h * 0.52, w * 0.72, h * 0.4), o.panel || color, { w: 1.3, lin: true });
  shape(I.ell(x + w * 0.84, y + h * 0.52, 4, 4, 8), o.knob || '#e0b64a', { w: 1.3 });
}
function table(x, y, w, legH, color = '#b07a48', o = {}) {
  shape(I.rectPts(x, y, w, o.thick || 10), color, { w: BG, lin: true });
  shape(I.rectPts(x + 8, y + (o.thick || 10), 9, legH), color, { w: BG, lin: true });
  shape(I.rectPts(x + w - 17, y + (o.thick || 10), 9, legH), color, { w: BG, lin: true });
}
function chair(x, y, h, color = '#b07a48', dir = 1) {
  const seat = y - h * 0.48;
  shape(I.rectPts(x - h * 0.22, seat, h * 0.44, 7), color, { w: BG, lin: true });
  shape(I.rectPts(x - dir * h * 0.22 - (dir > 0 ? 0 : 7), y - h, 7, h * 0.52 + 7), color, { w: BG, lin: true });
  shape(I.rectPts(x - h * 0.2, seat + 7, 6, h * 0.48 - 7), color, { w: BG, lin: true });
  shape(I.rectPts(x + h * 0.14, seat + 7, 6, h * 0.48 - 7), color, { w: BG, lin: true });
}
function frame(x, y, w, h, color, fn, o = {}) {
  shape(I.rectPts(x - 6, y - 6, w + 12, h + 12), o.frame || '#8a5a33', { w: BG, lin: true });
  I.rect(x, y, w, h, color);
  if (fn) I.clipRect(x, y, w, h, () => fn(x, y, w, h));
  line(I.rectPts(x, y, w, h).concat([[x, y]]), 1.4, { lin: true, taper: [0, 0] });
}
// a sheet of paper, optionally rotated, with contents
function sheet(x, y, w, h, rot, fn, color = '#ffffff') {
  I.grp(`translate(${x} ${y}) rotate(${rot})`, () => {
    shape(I.rectPts(-w / 2, -h / 2, w, h), color, { w: 1.6, lin: true });
    if (fn) I.clipRect(-w / 2, -h / 2, w, h, () => fn(w, h));
  });
}
function books(x, y, n, colors, o = {}) {
  let cx = x;
  for (let i = 0; i < n; i++) {
    const bw = (o.w || 12) + I.rng() * 6, bh = (o.h || 60) * (0.75 + I.rng() * 0.3);
    shape(I.rectPts(cx, y - bh, bw, bh), colors[i % colors.length], { w: 1.5, lin: true });
    line([[cx + 3, y - bh * 0.8], [cx + bw - 3, y - bh * 0.8]], 1, { lin: true, taper: [0, 0], op: 0.6 });
    cx += bw + 1;
  }
  return cx;
}

// ---- city ---------------------------------------------------------------------------------------
function skyline(w, y, color, o = {}) {
  let x = -10;
  while (x < w + 10) {
    const bw = 30 + I.rng() * 60, bh = (o.min || 60) + I.rng() * (o.var || 140);
    shape(I.rectPts(x, y - bh, bw, bh + 400), color, { w: o.w ?? 0, lin: true });
    if (o.windows) for (let wy = y - bh + 10; wy < y - 10; wy += 16) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (I.rng() < o.windows) I.rect(wx, wy, 5, 7, o.windowColor || '#ffe7a3');
    x += bw + (o.gap ?? 2);
  }
}

module.exports = { BG, hills, sea, tree, cloud, stars, moon, sun, rain, room, windowFrame, door, table, chair, frame, sheet, books, skyline };
