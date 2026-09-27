// zp/page.js — page, panels, captions, titles and effects with ZP's measured geometry:
// 980 px wide, 48 px side margins, ~17 px gutters between panels, ~21 px between rows,
// 2–3 px panel borders (or none), captions in plain boxes or straight on the panel colour.
const I = require('../lib/ink');
const { INK, LW, line, shape } = require('./core');

const W = 980, MARGIN = 48, GUT_H = 17, GUT_V = 21, CONTENT = W - 2 * MARGIN;

let GID = 0;
const uid = (p) => `${p}${++GID}`;
function linear(x1, y1, x2, y2, stops) {
  const id = uid('lg');
  I.emit(`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a ?? 1}"/>`).join('')}</linearGradient></defs>`);
  return `url(#${id})`;
}
function radial(cx, cy, r, stops) {
  const id = uid('rg');
  I.emit(`<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a ?? 1}"/>`).join('')}</radialGradient></defs>`);
  return `url(#${id})`;
}

// a row of panels: widths as fractions (they share the row minus gutters). returns rects.
function row(y, h, fracs = [1], o = {}) {
  const x0 = o.x0 ?? MARGIN, total = o.w ?? CONTENT, g = o.gutter ?? GUT_H;
  const avail = total - g * (fracs.length - 1);
  const sum = fracs.reduce((a, b) => a + b, 0);
  let x = x0;
  return fracs.map((f) => { const w = Math.round((avail * f) / sum); const r = { x, y, w, h }; x += w + g; return r; });
}

// draw a panel: clipped art, light grain, crisp captions on top, then the border
function panel(r, bg, art, post, o = {}) {
  I.grp(`translate(${r.x} ${r.y})`, () => {
    I.clipRect(0, 0, r.w, r.h, () => {
      if (bg) I.rect(-2, -2, r.w + 4, r.h + 4, bg);
      art(r.w, r.h);
      if (o.grain !== false) I.emit(`<rect x="0" y="0" width="${r.w}" height="${r.h}" fill="#000" filter="url(#zpgrain)" opacity="${o.grain ?? 0.07}"/>`);
      if (post) post(r.w, r.h);
    });
    const b = o.border ?? 2.6;
    if (b > 0) I.emit(`<rect x="${b / 2}" y="${b / 2}" width="${r.w - b}" height="${r.h - b}" fill="none" stroke="${INK}" stroke-width="${b}"/>`);
  });
}

// ---- lettering ----------------------------------------------------------------------------------
// exact advance widths from the fonts (zp/metrics.json, built with fontTools)
const MET = require('./metrics.json');
function textW(str, size, font = 'Letter', ls = 0.8) {
  const m = MET[font] || MET.Letter;
  let w = 0;
  for (const ch of str) w += (m.adv[ch] ?? m.default) * size + ls;
  return w - ls;
}
function text(x, y, str, o = {}) { I.text(x, y, str, { font: 'Letter', ls: 0.6, ...o }); }

// caption box. o.style: 'box' (white box, thin border) | 'plain' (text on the panel colour)
// | 'lined' (journal paper: cream with blue rules, Journal font, sentence case)
function caption(x, y, lines, o = {}) {
  const style = o.style || 'box';
  const font = style === 'lined' ? 'Journal' : 'Letter';
  const size = o.size || (style === 'lined' ? 21 : 15.5);
  const lh = size * (style === 'lined' ? 1.25 : 1.28);
  const pad = o.pad ?? (style === 'plain' ? 0 : 11);
  const tw = Math.max(...lines.map((l) => textW(l, size, font, style === 'lined' ? 0.2 : 0.8)));
  const w = o.w || tw + pad * 2;
  const h = lines.length * lh + pad * 2 - (lh - size) * 0.6 + (o.attrib ? size * 1.2 : 0);
  const align = o.align || (style === 'plain' ? 'start' : 'middle');
  const tx = align === 'middle' ? x + w / 2 : align === 'end' ? x + w - pad : x + pad;
  if (style === 'box') I.emit(`<rect x="${I.n1(x)}" y="${I.n1(y)}" width="${I.n1(w)}" height="${I.n1(h)}" fill="${o.fill || '#ffffff'}" stroke="${INK}" stroke-width="1.8"/>`);
  if (style === 'lined') {
    I.emit(`<rect x="${I.n1(x)}" y="${I.n1(y)}" width="${I.n1(w)}" height="${I.n1(h)}" fill="#fbf6e2" stroke="#b8ab86" stroke-width="1.5"/>`);
    for (let k = 0; k < lines.length; k++) I.emit(`<line x1="${I.n1(x)}" x2="${I.n1(x + w)}" y1="${I.n1(y + pad + size * 1.08 + k * lh)}" y2="${I.n1(y + pad + size * 1.08 + k * lh)}" stroke="#7fc4e6" stroke-width="1.2"/>`);
  }
  lines.forEach((l, i) => text(tx, y + pad + size * 0.84 + i * lh, l, { size, font, anchor: align, color: o.color || INK, ls: style === 'lined' ? 0.2 : 0.8, italic: o.italic }));
  if (o.attrib) text(tx, y + pad + size * 0.84 + lines.length * lh + 2, o.attrib, { size: size * 0.78, anchor: align, color: o.color || INK, ls: 1.2 });
  return { w, h };
}

// big hand-lettered word (sound effect / shout / climax): fill + black outline + drop shadow
function sfx(x, y, str, o = {}) {
  const size = o.size || 60;
  const rot = o.rot || 0;
  I.text(x + size * 0.05, y + size * 0.06, str, { font: 'Title', size, color: o.shadow || INK, rot, ls: o.ls ?? 2, anchor: o.anchor || 'middle' });
  I.text(x, y, str, { font: 'Title', size, color: o.color || '#ffffff', stroke: INK, sw: o.sw || Math.max(3, size / 16), rot, ls: o.ls ?? 2, anchor: o.anchor || 'middle' });
}

// speech balloon sized to its text (measured), with a short curved tail aimed at (tx,ty) that stops
// before it reaches the speaker (ZP tails are short and never cross a face). o.quiet: dashed border.
function balloon(cx, cy, lines, tx, ty, o = {}) {
  const size = o.size || 15, lh = size * 1.2;
  const tw = Math.max(...lines.map((l) => textW(l, size))), th = lines.length * lh;
  const a = tw / 2 * 1.16 + 14, b = th / 2 * 1.3 + 10;
  const ang = Math.atan2(ty - cy, tx - cx);
  // point on the ellipse edge toward the target
  const ex = cx + Math.cos(ang) * a, ey = cy + Math.sin(ang) * b;
  const dist = Math.hypot(tx - ex, ty - ey);
  // tails always reach the speaker: they stop ~16 px short of the target point
  const L = Math.max(14, o.tail ? Math.min(o.tail, dist - 16) : dist - 16);
  const ux = (tx - ex) / (dist || 1), uy = (ty - ey) / (dist || 1);
  const tip = [ex + ux * L, ey + uy * L];
  const bw = Math.min(a, b) * 0.34, px = -uy * bw, py = ux * bw;
  const bx = cx + Math.cos(ang) * a * 0.82, by = cy + Math.sin(ang) * b * 0.82;
  const bend = o.bend ?? 0.25;
  const mid = [(bx + tip[0]) / 2 - uy * L * bend * 0.4, (by + tip[1]) / 2 + ux * L * bend * 0.4];
  const tail = [[bx + px, by + py], [mid[0] + px * 0.3, mid[1] + py * 0.3], tip, [mid[0] - px * 0.1, mid[1] - py * 0.1], [bx - px, by - py]];
  const dash = o.quiet ? ' stroke-dasharray="5 4"' : '';
  const ellD = 'M' + I.ell(cx, cy, a, b, 40).map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L') + 'Z';
  const tailD = 'M' + tail.map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L') + 'Z';
  if (!o.noTail) I.emit(`<path d="${tailD}" fill="#ffffff" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"${dash}/>`);
  I.emit(`<path d="${ellD}" fill="#ffffff" stroke="${INK}" stroke-width="1.9"${dash}/>`);
  if (!o.noTail) I.emit(`<path d="${tailD}" fill="#ffffff" stroke="none" transform="translate(${I.n1(-ux * 3)} ${I.n1(-uy * 3)})"/>`);
  lines.forEach((l, i) => text(cx, cy - th / 2 + size * 0.92 + i * lh, l, { size, anchor: 'middle', italic: o.italic }));
  return { a, b };
}

// soft warm light: a radial gradient from colour to transparent
function glow(x, y, r, color = '#ffcf6a', strength = 0.8) {
  const g = radial(x, y, r, [[0, color, strength], [0.45, color, strength * 0.45], [1, color, 0]]);
  I.emit(`<circle cx="${I.n1(x)}" cy="${I.n1(y)}" r="${I.n1(r)}" fill="${g}"/>`);
}

// emanata: little ticks around a point (surprise / effort)
function ticks(x, y, r, n = 3, a0 = -150, a1 = -30, len = 10) {
  for (let i = 0; i < n; i++) {
    const a = ((a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))) * Math.PI) / 180;
    line([[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * (r + len), y + Math.sin(a) * (r + len)]], LW.detail, { taper: [0.2, 0.5] });
  }
}
// radial burst lines (ZP uses them for revelations)
function rays(cx, cy, r0, r1, n, color, w = 3, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (o.phase || 0);
    const k = o.jitter ? 0.85 + I.rng() * 0.3 : 1;
    I.fill([[cx + Math.cos(a - 0.004 * w) * r0, cy + Math.sin(a - 0.004 * w) * r0], [cx + Math.cos(a - (o.spread || 0.06)) * r1 * k, cy + Math.sin(a - (o.spread || 0.06)) * r1 * k], [cx + Math.cos(a + (o.spread || 0.06)) * r1 * k, cy + Math.sin(a + (o.spread || 0.06)) * r1 * k], [cx + Math.cos(a + 0.004 * w) * r0, cy + Math.sin(a + 0.004 * w) * r0]], color, { lin: true, wob: 0 });
  }
}
// ground shadow: a few dashed black strokes (as in ZP)
function groundShadow(x, y, w) {
  line([[x - w * 0.5, y], [x + w * 0.2, y + 0.5]], 3.4, { taper: [0.25, 0.25] });
  line([[x + w * 0.28, y], [x + w * 0.5, y]], 3.2, { taper: [0.25, 0.25] });
}

function svgDoc(Wd, Hd, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}" viewBox="0 0 ${Wd} ${Hd}">${require('./fonts')()}<defs><filter id="zpgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25"/></filter></defs>${body}</svg>`;
}

module.exports = { glow, W, MARGIN, GUT_H, GUT_V, CONTENT, row, panel, caption, sfx, balloon, ticks, rays, groundShadow, text, textW, linear, radial, svgDoc };
