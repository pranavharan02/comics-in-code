// zp/page.js — page, panels, captions, titles and effects with ZP's measured geometry:
// 980 px wide, 48 px side margins, ~17 px gutters between panels, ~21 px between rows,
// 2–3 px panel borders (or none), captions in plain boxes or straight on the panel colour.
const I = require('../lib/ink');
const core = require('./core');
const { INK, LW, line, shape } = core;

// PAGE.rough: default displacement of panel art (the brush now carries the hand-made feel; 0 = off)
// PAGE: page-wide finish switches. hand: per-glyph hand lettering; inkedBoxes: irregular brush-inked
// balloons/captions; paper: paper texture instead of uniform digital grain. Set any to false for the old look.
const PAGE = { rough: 0.4, hand: true, inkedBoxes: true, paper: true, paperK: 0.18, fibreK: 0.08, glow: 'rings' };
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

// draw a panel: clipped art (through a slight "rough ink" displacement, as in ELA), multiply grain,
// crisp captions on top, then an inked border with a little hand wobble.
//   o.rough: displacement scale (default 1.8, 0 = off)   o.grain: grain opacity (default 0.09)
//   o.border: border width (default 2.8, 0 = none)       o.borderRough: border wobble (default 0.45)
function panel(r, bg, art, post, o = {}) {
  I.grp(`translate(${r.x} ${r.y})`, () => {
    I.clipRect(0, 0, r.w, r.h, () => {
      if (bg) I.rect(-2, -2, r.w + 4, r.h + 4, bg);
      const rough = o.rough ?? PAGE.rough;
      if (rough > 0) I.emit(`<g filter="url(#${roughFilter(rough)})">`);
      art(r.w, r.h);
      if (rough > 0) I.emit('</g>');
      if (o.grain !== false) {
        if (PAGE.paper && o.paper !== false) {
          // paper: low-frequency tooth (blotchy, not uniform) + sparse fibres, multiplied over the art
          const g = (o.grain ?? 0.09) / 0.09;
          I.emit(`<rect x="0" y="0" width="${r.w}" height="${r.h}" fill="#000" filter="url(#zppaper)" opacity="${(PAGE.paperK * g).toFixed(3)}" style="mix-blend-mode:multiply"/>`);
          I.emit(`<rect x="0" y="0" width="${r.w}" height="${r.h}" fill="#000" filter="url(#zpfibre)" opacity="${(PAGE.fibreK * g).toFixed(3)}" style="mix-blend-mode:multiply"/>`);
        } else I.emit(`<rect x="0" y="0" width="${r.w}" height="${r.h}" fill="#000" filter="url(#zpgrain)" opacity="${o.grain ?? 0.09}" style="mix-blend-mode:multiply"/>`);
      }
      if (post) post(r.w, r.h);
    });
    const b = o.border ?? 2.8;
    if (b > 0) {
      const h = b / 2;
      I.ink([[h, h], [r.w - h, h], [r.w - h, r.h - h], [h, r.h - h]], b, { closed: true, lin: true, wob: o.borderRough ?? 0.45, vary: 0.1 });
    }
  });
}
const ROUGH = {};
function roughFilter(scale) {
  const id = `zprough${String(scale).replace('.', '_')}`;
  if (!ROUGH[id]) ROUGH[id] = `<filter id="${id}" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  return id;
}

// ---- lettering ----------------------------------------------------------------------------------
// exact advance widths from the fonts (zp/metrics.json, built with fontTools)
const MET = require('./metrics.json');
function textW(str, size, font = 'Letter', ls = 0.8) {
  const m = MET[font] || MET.Letter;
  let w = 0;
  for (const ch of plain(str)) w += (m.adv[ch] ?? m.default) * size + ls;
  return w - ls;
}
// ---- hand lettering: every glyph placed on its own with a tiny seeded rotation, baseline jitter, scale and
// skew, so repeated letters are never identical. Markup: *word* = bold italic emphasis (ZP style).
function hashStr(str, a = 0, b = 0) { let h = (2166136261 ^ Math.round(a * 7 + b * 13)) >>> 0; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngOf(seed) { let t = seed || 1; return () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const HAND = { rot: 3.5, base: 1.0, scale: 0.05, skew: 3.5, felt: 0.025 };
function segments(str) {
  const out = []; let bold = false, buf = '';
  for (const ch of str) { if (ch === '*') { if (buf) out.push([buf, bold]); buf = ''; bold = !bold; } else buf += ch; }
  if (buf) out.push([buf, bold]);
  return out;
}
function plain(str) { return String(str).replace(/\*/g, ''); }
function glyphRun(x, y, str, o = {}) {
  const size = o.size || 18, font = o.font || 'Letter', ls = o.ls ?? 0.6, anchor = o.anchor || 'middle';
  const J = { ...HAND, ...(o.jitter || {}) };
  const segs = segments(String(str));
  const advOf = (ch, it) => { const m = MET[it && font === 'Letter' ? 'LetterItalic' : font] || MET.Letter; return (m.adv[ch] ?? m.default) * size; };
  let total = 0; segs.forEach(([t, b]) => { for (const ch of t) total += advOf(ch, b || o.italic) + ls; }); total -= ls;
  let cx = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  const rnd = rngOf(hashStr(String(str), x, y));
  const col = o.color || INK;
  const st = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 4}" paint-order="stroke" stroke-linejoin="round"` : '';
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  const out = [];
  segs.forEach(([t, b]) => {
    const ital = b || o.italic;
    const bw = b ? Math.max(0.5, size * 0.035) : 0;
    for (const ch of t) {
      const adv = advOf(ch, ital);
      if (ch !== ' ') {
        const r = (rnd() * 2 - 1) * J.rot, dy = (rnd() * 2 - 1) * J.base, sc = 1 + (rnd() * 2 - 1) * J.scale * 0.5, sx = sc * (1 + (rnd() * 2 - 1) * J.scale), sk = (rnd() * 2 - 1) * J.skew;
        const e = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // felt-tip: a thin stroke of the same colour fattens and softens every glyph (bold adds more)
        const fw = (J.felt || 0) * size + bw;
        const boldS = fw > 0 && !o.stroke ? ` stroke="${col}" stroke-width="${fw.toFixed(2)}" stroke-linejoin="round"` : '';
        out.push(`<text transform="translate(${I.n1(cx + adv / 2)} ${I.n1(y + dy)}) rotate(${I.n1(r)}) skewX(${I.n1(sk)}) scale(${sx.toFixed(3)} ${sc.toFixed(3)})" font-family="${font}" font-size="${size}" text-anchor="middle" fill="${col}"${ital ? ' font-style="italic"' : ''}${st || boldS}>${e}</text>`);
      }
      cx += adv + ls;
    }
  });
  const tf = o.rot ? ` transform="rotate(${o.rot} ${I.n1(x)} ${I.n1(y)})"` : '';
  I.emit(`<g${tf}${op}>${out.join('')}</g>`);
  return total;
}
// text(): hand-lettered by default (o.hand: false or PAGE.hand = false → one plain <text>; Title font stays plain)
function text(x, y, str, o = {}) {
  if (o.ls == null && (o.hand ?? PAGE.hand)) o = { ...o, ls: 0.1 };
  const hand = o.hand ?? (PAGE.hand && (o.font || 'Letter') !== 'Title');
  if (!hand) return I.text(x, y, plain(str), { font: 'Letter', ls: 0.6, ...o });
  glyphRun(x, y, str, { ls: 0.6, ...o });
}

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
  if (style === 'box') {
    if (PAGE.inkedBoxes && o.inked !== false) {
      // a hand-ruled box: corners a touch off square, sides very slightly bowed, brush-inked
      const rnd = rngOf(hashStr(lines.join('|'), x, y)), j = (k = 1) => (rnd() * 2 - 1) * k;
      const c = [[x + j(0.8), y + j(0.8)], [x + w + j(0.8), y + j(0.8)], [x + w + j(0.8), y + h + j(0.8)], [x + j(0.8), y + h + j(0.8)]];
      const pts = [];
      c.forEach((a, i) => { const b = c[(i + 1) % 4]; const bw = j(0.9); for (let t = 0; t < 0.99; t += 0.25) { const bow = Math.sin(t * Math.PI) * bw; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; pts.push([a[0] + dx * t - dy / l * bow, a[1] + dy * t + dx / l * bow]); } });
      I.fill(pts, o.fill || '#ffffff', { wob: 0, lin: true });
      core.brush(pts, 2.0, { closed: true, lin: true, wob: 0, thick: 0.3 });
    } else I.emit(`<rect x="${I.n1(x)}" y="${I.n1(y)}" width="${I.n1(w)}" height="${I.n1(h)}" fill="${o.fill || '#ffffff'}" stroke="${INK}" stroke-width="1.8"/>`);
  }
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
  if (o.bounce === false || !PAGE.hand) {
    I.text(x + size * 0.05, y + size * 0.06, str, { font: 'Title', size, color: o.shadow || INK, rot, ls: o.ls ?? 2, anchor: o.anchor || 'middle' });
    I.text(x, y, str, { font: 'Title', size, color: o.color || '#ffffff', stroke: INK, sw: o.sw || Math.max(3, size / 16), rot, ls: o.ls ?? 2, anchor: o.anchor || 'middle' });
    return;
  }
  // bouncing letters: each glyph rotated / scaled / lifted a little, a thick outline and a drop shadow
  const J = { rot: 7, base: size * 0.05, scale: 0.08, skew: 3 };
  const sw = o.sw || Math.max(3.4, size / 13);
  const common = { font: 'Title', size, rot, ls: o.ls ?? 2, anchor: o.anchor || 'middle', jitter: J };
  glyphRun(x + size * 0.05, y + size * 0.06, str, { ...common, color: o.shadow || INK, stroke: o.shadow || INK, sw });
  glyphRun(x, y, str, { ...common, color: o.color || '#ffffff', stroke: INK, sw });
}

// speech balloon sized to its text (measured), with a short curved tail aimed at (tx,ty) that stops
// before it reaches the speaker (ZP tails are short and never cross a face). o.quiet: dashed border.
function balloon(cx, cy, lines, tx, ty, o = {}) {
  if (!PAGE.inkedBoxes || o.inked === false || o.quiet) return balloonEll(cx, cy, lines, tx, ty, o);
  const size = o.size || 15, lh = size * 1.2;
  const tw = Math.max(...lines.map((l) => textW(l, size))), th = lines.length * lh;
  const a = tw / 2 * 1.16 + 14, b = th / 2 * 1.3 + 10;
  const rnd = rngOf(hashStr(lines.join('|'), cx, cy));
  // a hand-drawn oval: the radius breathes with slow harmonics (never a perfect ellipse)
  const p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28, k1 = 0.03 + rnd() * 0.015, k2 = 0.018 + rnd() * 0.012;
  const Rr = (t) => 1 + k1 * Math.sin(2 * t + p1) + k2 * Math.sin(3 * t + p2) + 0.025 * Math.sin(t + p3);
  // slightly flattened bottom: the lower half is squashed a little and its sides pushed out
  const E = (t) => { const sn = Math.sin(t), fl = sn > 0 ? 1 - 0.12 * sn * sn : 1; return [cx + Math.cos(t) * a * Rr(t) * (sn > 0 ? 1 + 0.03 * sn : 1), cy + sn * b * Rr(t) * fl]; };
  const ang = Math.atan2((ty - cy) / b, (tx - cx) / a);
  const edge = E(ang);
  const dist = Math.hypot(tx - edge[0], ty - edge[1]);
  const L = Math.max(14, o.tail ? Math.min(o.tail, dist - 16) : dist - 16);
  const ux = (tx - edge[0]) / (dist || 1), uy = (ty - edge[1]) / (dist || 1);
  const tip = [edge[0] + ux * L, edge[1] + uy * L];
  // tail root: two points on the oval either side of the aim; both sides curve the same way (a hooked wedge)
  const half = Math.min(0.15, (Math.min(a, b) * 0.28) / Math.max(a, b)) * (o.tailW ?? 1);
  const bend = (o.bend ?? 0.35) * (ux >= 0 ? 1 : -1);
  const nx = -uy, ny = ux;
  const pts = [];
  const n = 72;
  for (let k = 0; k <= n; k++) { const t = ang + half + (k / n) * (Math.PI * 2 - 2 * half); pts.push(E(t)); }
  const r1 = E(ang + half), r2 = E(ang - half);
  const q = (p0, c, p1, t) => [(1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1]];
  const ctl = (p, s2) => [(p[0] + tip[0]) / 2 + nx * L * s2, (p[1] + tip[1]) / 2 + ny * L * s2];
  const tailA = [], tailB = [];
  for (let k = 1; k <= 6; k++) tailA.push(q(r2, ctl(r2, bend * 0.4), tip, k / 7));
  for (let k = 1; k <= 6; k++) tailB.push(q(tip, ctl(r1, bend * 0.3), r1, k / 7));
  const outline = o.noTail ? pts : pts.concat(tailA, [tip], tailB);
  I.fill(outline, '#ffffff', { wob: 0, lin: true });
  core.brush(outline, 2.1, { closed: true, lin: true, wob: 0, thick: 0.55 });
  lines.forEach((l, i) => text(cx, cy - th / 2 + size * 0.92 + i * lh, l, { size, anchor: 'middle', italic: o.italic }));
  return { a, b };
}
// the old perfect-ellipse balloon (o.inked: false, PAGE.inkedBoxes = false, and dashed o.quiet whispers)
function balloonEll(cx, cy, lines, tx, ty, o = {}) {
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
// glow(x, y, r, color, strength, o): light around a source. o.style:
//   'rings' (default): 2-3 flat stepped rings, ZP's flat-shape light;  'rays': hand-drawn radiating strokes
//   around a small flat disc;  'soft': the old radial gradient.  o.steps (rings, 2-4), o.n (rays), o.seed
function glow(x, y, r, color = '#ffcf6a', strength = 0.8, o = {}) {
  const style = o.style || PAGE.glow;
  if (style === 'soft') {
    const g = radial(x, y, r, [[0, color, strength], [0.45, color, strength * 0.45], [1, color, 0]]);
    I.emit(`<circle cx="${I.n1(x)}" cy="${I.n1(y)}" r="${I.n1(r)}" fill="${g}"/>`);
    return;
  }
  const rnd = rngOf(hashStr(color + (o.seed || ''), x, y));
  const blob = (rad) => { const p1 = rnd() * 6.28, n = 36, pts = []; for (let k = 0; k < n; k++) { const t = (k / n) * 6.283; const rr = rad * (1 + 0.035 * Math.sin(3 * t + p1) + 0.02 * Math.sin(5 * t + p1 * 2)); pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]); } return pts; };
  if (style === 'rays') {
    I.fill(blob(r * 0.34), color, { wob: 0, op: Math.min(1, strength * 0.55) });
    const n = o.n || 14;
    for (let k = 0; k < n; k++) {
      const t = (k / n) * 6.283 + rnd() * 0.25, r0 = r * (0.42 + rnd() * 0.08), r1 = r * (0.7 + rnd() * 0.3);
      core.line([[x + Math.cos(t) * r0, y + Math.sin(t) * r0], [x + Math.cos(t) * r1, y + Math.sin(t) * r1]], Math.max(1.6, r * 0.025), { color, op: Math.min(1, strength), taper: [0.1, 0.6] });
    }
    return;
  }
  const steps = Math.max(2, Math.min(4, o.steps || 3));
  for (let k = 0; k < steps; k++) {
    const f = 1 - k / steps;
    I.fill(blob(r * (0.35 + 0.65 * f)), color, { wob: 0, op: Math.min(1, strength * (0.16 + 0.1 * k)) });
  }
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}" viewBox="0 0 ${Wd} ${Hd}">${require('./fonts')()}<defs>${Object.values(ROUGH).join('')}<filter id="zppaper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="3" seed="7" result="lo"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="hi"/><feComposite in="hi" in2="lo" operator="arithmetic" k1="2.2" k2="0" k3="0" k4="-0.12" result="m"/><feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"/></filter><filter id="zpfibre" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="21" result="f"/><feColorMatrix in="f" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  20 0 0 0 -14.6"/></filter><filter id="zpgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.3"/></filter></defs>${body}</svg>`;
}

module.exports = { PAGE, HAND, glow, W, MARGIN, GUT_H, GUT_V, CONTENT, row, panel, caption, sfx, balloon, ticks, rays, groundShadow, text, textW, linear, radial, svgDoc };
