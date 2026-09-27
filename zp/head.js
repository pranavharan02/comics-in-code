// zp/head.js — one character design drawn at any turn, the way a Zen Pencils cartoonist builds a head:
// a big round skull, a smaller bean-shaped face mass at the front whose profile (brow, notch, tiny
// hook nose, lip bumps, rounded chin) IS the silhouette in 3/4 and profile, a long soft jaw diagonal up
// to an ear set far back, two tall oval eyes nearly touching and always inside the face, hair as a dark
// mass round and behind the skull with light streaks, one flat cel shadow on skin and hair.
//
// yaw 0 = facing the viewer, +90 = profile facing right, ±180 = back of the head.
// Head-local units are the skull radius R (x right, y down, z toward the face).
//
// Silhouette model: the head is a stack of horizontal slices. Each slice is the union of a skull
// ellipse and a face ellipse (x half-width a, z half-depth b, centre z0), projected exactly for the
// yaw; the mid-line profile (nose, lips, chin) is added on top with a cartoon cheat so the profile
// features reach the contour already in 3/4 view, as ZP draws them. The outline is the per-row union,
// so turnarounds stay consistent from -180 to 180.
const core = require('./core');
const { I, INK } = core;
const D = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const isHex = (c) => typeof c === 'string' && c[0] === '#' && c.length === 7;
function mixC(c1, c2, t) {
  if (!isHex(c1) || !isHex(c2)) return c1;
  const a = hex(c1), b = hex(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
// flat skin shadow: darker, desaturated and slightly cool (not orange)
function flatShadow(c) {
  if (!isHex(c)) return c;
  const [r, g, b] = hex(c), L = 0.299 * r + 0.587 * g + 0.114 * b;
  const k = 0.86, ds = 0.14;
  return '#' + [r, g, b].map((v, i) => Math.round(clamp((v + (L - v) * ds) * k + [-2, -1, 4][i], 0, 255)).toString(16).padStart(2, '0')).join('');
}
const shadeC = (c, k = 0.22) => (!isHex(c) ? c : core.shade ? core.shade(c, k) : mixC(c, '#000000', k));
const lum = (c) => { if (!isHex(c)) return 0.5; const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

// ---- character designs ------------------------------------------------------------------------
// every field has a default so a design only lists what makes that character distinctive
const BASE = {
  skin: '#f6d2b4', hair: '#1f1a1c', hairLine: null, hairStreak: null,
  R: 30,            // skull radius (px) at scale 1
  jaw: 0.95,        // chin depth (bigger = longer face)
  jawW: 0.62,       // jaw width (x R)
  chinPoint: 0.25,  // 0 round chin .. 1 pointed
  eyeW: 0.26, eyeH: 0.36, eyeY: 0.05, eyeSep: 26,
  pupil: 0.075,
  lashes: 0, brow: 1, browCol: null, browThick: 1,
  nose: 'button',   // button | long | hook | small
  noseLen: 0.12, napeLevel: 0.55, sideburn: 0.22, square: 0, deep: 1,
  tall: 1.12, wide: 1.0, hairVol: 1.0, hairTop: 'round',
  earY: 0.2,
  mouthY: 0.58,
  hairStyle: 'short', // short | ponytail | bun | long | flattop | bald | bob | pigtails
  hairline: 0.55,
  age: 0,           // 0..1 : lids, bags, wrinkles, jowls
  kid: null,        // true/false; default: a design with blush and no age is a child
  neck: 1.3,        // neck length below the skull centre (x R); 0 = no neck
  glasses: null,
  blush: 0,
  beard: null, moustache: null,
  accessory: null,  // 'flower'
  // ---- face construction (round 2). Every key is optional; presets and inference fill them in.
  face: undefined,  // preset name (FACES), false = no preset / no fingerprinting
  sex: null,        // 'm' | 'f' (softens the jaw, lashes, lips)
  shape: 'oval',    // oval | long | round | square | heart
  chin: 'soft',     // soft | round | square | pointed | jowly
  cheek: 0.2,       // cheekbone prominence 0..1 (contour bump + cheek line on elderly)
  noseType: null,   // button | small | straight | long | hook | bulbous | broad (falls back to `nose`)
  noseSize: 1,
  browShape: 'soft',// soft | arch | flat | angled | bushy
  browW: null,      // brow thickness (x brow pen); falls back to browThick
  eyeStyle: null,   // round (kids) | almond (adults) | hooded (elderly)
  lid: null,        // resting upper-lid cover 0..0.7 (almond ~0.28, hooded ~0.42)
  crease: 1,        // lid crease line above almond eyes (0 = monolid)
  bags: 0,          // under-eye bags 0..1
  lips: 0,          // 0 = a line; 0.3+ = lower lip; 0.7+ = full shaded lips
  lipCol: null,
  earSize: 1, neckW: 1,
  freckles: 0,      // number of freckles on cheeks + nose
  parting: null,    // left | right | centre : hairline notch + parting line + swept fringe locks
  fringeDrop: 0,    // lowers the front hairline (bangs), R units
  locks: 0,         // number of pointed fringe locks along the front hairline
  hairLobes: null,  // clumps in the hair outline (default by style)
  spiky: 0,         // 0..1 sticky-up tufts (Toby)
  glassesShape: 'round', glassesW: 1,
};

// ---- face presets: distinct construction per cast member ------------------------------------------
// `override` is applied over the caller's design (fixes old keys that were tuned for the round-1 template).
const FACES = {
  isla: { sex: 'f', kid: true, shape: 'round', chin: 'soft', cheek: 0.3, noseType: 'button', noseSize: 0.8, browShape: 'soft', browW: 0.95, eyeStyle: 'round', earSize: 0.9, neckW: 0.9, parting: 'left', fringeDrop: 0.2, locks: 6, hairLobes: 4, override: { eyeW: 0.27, eyeH: 0.33, hairVol: 1.02, tall: 1.02, sideburn: 0.55 } },
  grandad: { sex: 'm', shape: 'long', chin: 'jowly', cheek: 0.7, noseType: 'hook', noseSize: 1.2, browShape: 'bushy', browW: 2.1, eyeStyle: 'hooded', lid: 0.42, bags: 0.9, earSize: 1.12, neckW: 0.82, mouthW: 0.05, override: { eyeW: 0.26, eyeH: 0.3, jaw: 1.15 } },
  ada: { sex: 'f', shape: 'oval', chin: 'round', cheek: 1, noseType: 'broad', noseSize: 1.05, browShape: 'arch', browW: 1.0, eyeStyle: 'hooded', lid: 0.36, bags: 0.45, lips: 0.85, lipCol: '#5a2a24', earSize: 0.95, neckW: 0.78, override: { eyeW: 0.24, eyeH: 0.28, jaw: 1.05, hairVol: 1.04, curly: true } },
  toby: { sex: 'm', kid: true, shape: 'round', chin: 'round', cheek: 0.2, noseType: 'button', noseSize: 0.95, browShape: 'flat', browW: 1.05, eyeStyle: 'round', freckles: 11, earSize: 1.2, spiky: 1, hairLobes: 0, override: { fringe: 0, eyeW: 0.27, eyeH: 0.34 } },
  chen: { sex: 'm', shape: 'square', chin: 'square', cheek: 0.45, noseType: 'straight', noseSize: 0.85, browShape: 'flat', browW: 1.55, eyeStyle: 'almond', lid: 0.42, crease: 0, bags: 0.7, earSize: 1.0, neckW: 0.95, parting: 'left', locks: 0, hairLobes: 3, override: { eyeW: 0.24, eyeH: 0.27 } },
  maya: { sex: 'f', kid: true, shape: 'heart', chin: 'soft', cheek: 0.3, noseType: 'broad', noseSize: 0.8, browShape: 'arch', browW: 1.0, eyeStyle: 'round', lips: 0.35, earSize: 0.9, override: { fringe: 0, eyeW: 0.26, eyeH: 0.32 } },
  dad: { sex: 'm', shape: 'square', chin: 'square', cheek: 0.35, noseType: 'broad', noseSize: 1.1, browShape: 'angled', browW: 1.9, eyeStyle: 'almond', lid: 0.44, bags: 0.75, lips: 0.3, earSize: 1.1, neckW: 1.18, hairLobes: 0, override: { eyeW: 0.22, eyeH: 0.22 } },
  peg: { sex: 'f', shape: 'round', chin: 'jowly', cheek: 0.15, noseType: 'bulbous', noseSize: 0.9, browShape: 'arch', browW: 0.85, eyeStyle: 'almond', lid: 0.24, bags: 0.35, lips: 0.5, earSize: 0.95, neckW: 1.0, parting: 'right', override: { eyeW: 0.22, eyeH: 0.26, jaw: 0.95 } },
  // background extras
  granny: { sex: 'f', shape: 'long', chin: 'pointed', cheek: 0.6, noseType: 'hook', noseSize: 1.0, browShape: 'arch', browW: 0.7, eyeStyle: 'hooded', lid: 0.4, bags: 0.6, lips: 0.2, earSize: 1.1, neckW: 0.75, parting: 'centre' },
  bearded: { sex: 'm', shape: 'square', chin: 'square', cheek: 0.3, noseType: 'bulbous', noseSize: 1.35, browShape: 'bushy', browW: 1.7, eyeStyle: 'almond', lid: 0.35, earSize: 1.1, neckW: 1.2 },
  girl: { sex: 'f', kid: true, shape: 'oval', chin: 'pointed', cheek: 0.2, noseType: 'small', noseSize: 0.8, browShape: 'arch', browW: 0.9, eyeStyle: 'round', parting: 'centre', freckles: 0 },
  woman: { sex: 'f', shape: 'heart', chin: 'pointed', cheek: 0.55, noseType: 'straight', noseSize: 0.8, browShape: 'arch', browW: 0.9, eyeStyle: 'almond', lid: 0.3, lips: 0.75, earSize: 0.9, neckW: 0.8, parting: 'right' },
  oldman: { sex: 'm', shape: 'long', chin: 'jowly', cheek: 0.6, noseType: 'broad', noseSize: 1.2, browShape: 'bushy', browW: 1.8, eyeStyle: 'hooded', lid: 0.45, bags: 0.9, earSize: 1.3, neckW: 0.85 },
  boy: { sex: 'm', kid: true, shape: 'oval', chin: 'round', cheek: 0.1, noseType: 'button', noseSize: 1.0, browShape: 'flat', browW: 1.2, eyeStyle: 'round', earSize: 1.15, parting: 'right', locks: 4, fringeDrop: 0.08 },
};
// recognise the existing cast designs (comics that predate the `face` key) by their signature keys
function fingerprint(d) {
  const L = lum(d.skin || BASE.skin), age = d.age || 0;
  if (d.hat && d.hat.type === 'cap' && d.moustache && age >= 0.7) return 'grandad';
  if (d.hairStyle === 'bob' && d.blush) return 'isla';
  if (d.glasses && age >= 0.7 && L < 0.45) return 'ada';
  if (d.blush && d.fringe && String(d.hair).toLowerCase() === '#d9793a') return 'toby';
  if (String(d.hairStreak).toLowerCase() === '#4a5a78') return 'chen';
  if (d.blush && d.glasses && (d.hairVol || 1) > 1.2) return 'maya';
  if (d.moustache && !d.hat && age < 0.7 && L < 0.45) return 'dad';
  if (d.hairStyle === 'bun' && d.glasses && age < 0.7) return 'peg';
  if (d.hairStyle === 'bun' && d.glasses) return 'granny';
  if (d.beard) return 'bearded';
  if (d.moustache && age >= 0.8) return 'oldman';
  if (d.hairStyle === 'long' && !d.blush) return 'woman';
  if (d.blush && !d.age && d.hairStyle === 'pigtails') return 'girl';
  if (d.blush && !d.age && d.hairStyle === 'short') return 'boy';
  return null;
}
// sensible defaults from the old keys when no preset applies
function infer(d) {
  const age = d.age || 0, kid = d.kid ?? (!age && !!d.blush);
  const fem = d.sex ? d.sex === 'f' : (d.lashes > 0 || ['bun', 'long', 'bob', 'ponytail', 'pigtails'].includes(d.hairStyle)) && !d.moustache && !d.beard;
  const o = { sex: fem ? 'f' : 'm' };
  if (kid) Object.assign(o, { eyeStyle: 'round', shape: 'round', chin: 'soft', noseType: 'button', browShape: fem ? 'arch' : 'flat' });
  else if (age > 0.6) Object.assign(o, { eyeStyle: 'hooded', lid: 0.4, bags: 0.6, shape: 'long', chin: fem ? 'pointed' : 'jowly', cheek: 0.5, browShape: fem ? 'arch' : 'bushy', noseType: d.nose === 'button' ? 'bulbous' : d.nose, noseSize: 1.2 });
  else Object.assign(o, { eyeStyle: 'almond', lid: 0.3, shape: fem ? 'heart' : 'square', chin: fem ? 'pointed' : 'square', cheek: 0.35, browShape: fem ? 'arch' : 'flat', browW: fem ? 0.9 : 1.4, noseType: fem ? 'straight' : d.nose === 'button' ? 'straight' : d.nose, noseSize: fem ? 0.8 : 1.1, lips: fem ? 0.6 : 0.2, bags: age > 0.3 ? 0.5 : 0 });
  return o;
}
function design(d) {
  if (d && d.__resolved) return d;
  const name = d.face ?? d.preset ?? (d.face === false ? null : fingerprint(d));
  const pre = (name && FACES[name]) || {};
  const { override, ...pk } = pre;
  const r = { ...BASE, ...infer(d), ...pk, ...d, ...(override || {}), __resolved: true, faceName: name || null };
  if (!r.noseType) r.noseType = r.nose;
  r._partT = r.parting === 'left' ? -0.32 : r.parting === 'right' ? 0.32 : r.parting === 'centre' ? 0 : null;
  return r;
}

// ---- sphere projection (kept for callers) -------------------------------------------------------
function proj(lon, lat, r, yaw, R) {
  const a = (lon + yaw) * D, b = lat * D;
  return { x: Math.sin(a) * Math.cos(b) * R * r, y: -Math.sin(b) * R * r, z: Math.cos(a) * Math.cos(b) };
}

// 1-D Catmull-Rom (Hermite) through [y, v] control points
function curve(pts) {
  const n = pts.length;
  return (y) => {
    if (y <= pts[0][0]) return pts[0][1];
    if (y >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (i < n - 2 && pts[i + 1][0] < y) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const h = p2[0] - p1[0] || 1e-6, t = (y - p1[0]) / h;
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0] || 1e-6)) * h, m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0] || 1e-6)) * h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
}

// ---- the head model (all in R units) -----------------------------------------------------------
const SHAPES = {
  oval: { len: 0, jawK: 1.0, cheek: 0 },
  long: { len: 0.15, jawK: 0.9, cheek: -0.02 },
  round: { len: -0.07, jawK: 1.06, cheek: 0.03 },
  square: { len: 0.04, jawK: 1.04, cheek: 0 },
  heart: { len: 0.03, jawK: 0.86, cheek: 0.05 },
};
// w: chin half-width as a fraction of the jaw; n: superellipse closure (2 = round, 4+ = boxy, <2 = pointed)
// ang: how far back the jaw angle sits in profile (square jaws turn a corner under the ear)
const CHINS = {
  soft: { w: 0.5, n: 2.2, fwd: 0, ang: 0 },
  round: { w: 0.56, n: 2.5, fwd: 0.01, ang: 0.05 },
  square: { w: 0.56, n: 3.0, fwd: 0.02, ang: 0.2 },
  pointed: { w: 0.34, n: 2.0, fwd: 0.04, ang: -0.04 },
  jowly: { w: 0.66, n: 2.5, fwd: -0.02, ang: 0.1, sag: 1 },
};
// nose profile per type: [bridge bump, tip projection, tip drop, underside] (x nl)
const NOSES = {
  button: { len: 0.15, bump: 0.2, drop: -0.02, up: 0.55 },
  small: { len: 0.11, bump: 0.25, drop: 0, up: 0.5 },
  straight: { len: 0.2, bump: 0.5, drop: 0, up: 0.75 },
  long: { len: 0.27, bump: 0.55, drop: 0.03, up: 0.75 },
  hook: { len: 0.25, bump: 0.92, drop: 0.05, up: 0.95 },
  bulbous: { len: 0.22, bump: 0.3, drop: 0.02, up: 0.9 },
  broad: { len: 0.19, bump: 0.5, drop: 0.01, up: 0.85 },
};
function model(d) {
  d = d.__resolved ? d : design(d);
  const kid = d.kid ?? (!d.age && !!d.blush);
  const old = clamp((d.age - 0.4) / 0.45, 0, 1);
  const SH = SHAPES[d.shape] || SHAPES.oval, CH = CHINS[d.chin] || CHINS.soft;
  const fem = d.sex === 'f';
  const top = d.tall * (kid ? 1.16 : 1);
  const ye = d.eyeY + (kid ? 0.16 : 0.03);
  const cb = (kid ? 0.9 + d.jaw * 0.2 + SH.len * 0.4 : 0.78 + d.jaw * 0.38 + SH.len - (fem ? 0.04 : 0)) + old * 0.05;
  const yb = ye - 0.22, yn = ye + 0.03;
  const NT = NOSES[d.noseType] || NOSES.button;
  const nl = NT.len * d.noseSize * (kid ? 0.62 : 1);
  const yt = ye + (kid ? 0.25 : 0.36) + (d.noseType === 'long' || d.noseType === 'hook' ? 0.04 : 0) + NT.drop * d.noseSize;
  const ym = yt + 0.13 + (cb - yt - 0.3) * 0.33 + (d.mouthY - 0.58) + (kid ? 0.04 : 0);
  const jwk = clamp(d.jawW / 0.62, 0.8, 1.3) * SH.jawK;
  const skullFront = (y) => { const s = skull(y); return s ? s.z0 + s.b : 0.9; };
  function skull(y) {
    const bot = 0.84;
    if (y < -top || y > bot) return null;
    const r = y <= 0 ? Math.sqrt(Math.max(0, 1 - (y / top) ** 2)) : Math.sqrt(Math.max(0, 1 - (y / bot) ** 2));
    const z0 = (-0.04 - 0.3 * sstep(yb, bot, y)) * d.deep, b = r * d.deep;
    const front = z0 + b, back0 = z0 - b, back = lerp(back0, Math.max(back0, -0.6), sstep(0.05, 0.55, y));
    return { z0: (front + back) / 2, a: r * d.wide * (kid ? 1.03 : 1), b: (front - back) / 2, low: y > 0.3 };
  }
  const L = d.lips || 0;
  // mid-line profile: brow, bridge notch, the nose by type, lips, chin
  const mid = curve([
    [yb - 0.16, skullFront(yb - 0.16)],
    [yb, kid ? 0.975 : 0.99],
    [yn, kid ? 0.94 : 0.935],
    [lerp(yn, yt, 0.55), 0.94 + nl * NT.bump],
    [yt - 0.055, 0.95 + nl * 0.9],
    [yt - 0.005, 0.95 + nl],
    [yt + 0.045, 0.93 + nl * (0.5 + NT.up * 0.4)],
    [yt + 0.085, 0.9],
    [ym - 0.065, (kid ? 0.915 : 0.925) + L * 0.025],
    [ym, 0.89],
    [ym + 0.06, (kid ? 0.905 : 0.912) + L * 0.03],
    [ym + 0.13, 0.865],
    [cb - 0.12, (kid ? 0.87 : 0.9) + CH.fwd - old * 0.02],
    [cb - 0.035, 0.8],
    [cb, 0.58]]);
  const earB = ye + 0.5;
  const cheekF = (kid ? 0.92 : 0.87) + d.cheek * 0.04 + SH.cheek;
  const f = curve([[ye - 0.12, 0.86], [ye + 0.25, cheekF], [ym, kid ? 0.86 : 0.82], [cb - 0.12, 0.8 + CH.fwd], [cb - 0.02, 0.64], [cb, 0.5]]);
  const angK = CH.ang * (fem ? 0.5 : 1) + old * 0.05;
  // profile jaw: a diagonal from under the ear to the chin; square/jowly jaws hold a corner further back
  const bk = curve([[ye - 0.12, -0.7], [ye + 0.3, -0.52], [earB, -0.36], [lerp(earB, cb, 0.45), lerp(-0.36, 0.45, 0.45) - angK], [lerp(earB, cb, 0.78), lerp(-0.36, 0.45, 0.78) - angK * 0.6], [cb - 0.02, 0.45], [cb, 0.5]]);
  // face half-width: forehead → cheekbone → jaw at the mouth, then a superellipse closure to the chin
  const Wym = kid ? 0.9 * clamp(SH.jawK, 0.9, 1.08) : Math.min(0.74, (kid ? 0.82 : 0.68 + old * 0.04) * jwk * (fem ? 0.94 : 1));
  const upper = kid ? curve([[ye - 0.12, 0.9], [ye + 0.3, 0.97 + SH.cheek * 0.5], [ym, Wym]]) : curve([[ye - 0.12, 0.88], [ye + 0.28, 0.83 + d.cheek * 0.05 + SH.cheek], [ym, Wym]]);
  const n = kid ? 2.1 : CH.n * (fem ? 0.9 : 1);
  const a = (y) => {
    if (y <= ym) return upper(y);
    const u = clamp((y - ym) / (cb - ym), 0, 1);
    const w = lerp(Wym, Wym * (kid ? 0.8 : CH.w), Math.pow(u, kid ? 1.6 : 1.3)) + (CH.sag ? 0.05 * Math.sin(Math.PI * u) * (0.4 + old) : 0);
    return Math.max(0.02, w * Math.pow(Math.max(0, 1 - Math.pow(u, n)), 1 / n));
  };
  function face(y) {
    if (y < ye - 0.12 || y > cb) return null;
    const F = f(y);
    let B = bk(y);
    // the chin closes in depth as well as width, so a 3/4 view has no flat shelf under the jaw
    if (y > ym) { const u = clamp((y - ym) / (cb - ym), 0, 1), cl = Math.pow(Math.max(0, 1 - Math.pow(u, n + 0.6)), 1 / (n + 0.6)); B = F - (F - B) * Math.max(kid ? 0.25 : 0.4, cl); }
    return { z0: (F + B) / 2, a: a(y), b: (F - B) / 2, front: F };
  }
  // nose protrusion above the plain bridge line (used for the 3/4 cheat)
  const noseP = (y) => { if (y < yn || y > yt + 0.1) return 0; const base = lerp(0.935, 0.9, (y - yn) / (yt + 0.1 - yn)); return Math.max(0, mid(y) - base); };
  return { kid, old, fem, top, ye, cb, yb, yn, yt, ym, nl, NT, skull, face, mid, noseP, midR: [yb - 0.16, cb], earB };
}

// ---- head -------------------------------------------------------------------------------------
// o: { x, y, s (scale), yaw, pitch (deg, + looks up), look [dx,dy] (-1..1), mood, blink, mouth, neck }
function head(dz, o = {}) {
  const d = design(dz);
  const s = o.s || 1, R = d.R * s, X = o.x || 0, Y = o.y || 0;
  let yaw = o.yaw ?? 0; yaw = ((((yaw + 180) % 360) + 360) % 360) - 180; if (yaw === -180) yaw = 180;
  const side = Math.sign(yaw) || 1, ay = Math.abs(yaw);
  const C = Math.cos(yaw * D), S = Math.sin(yaw * D);
  const pitch = clamp(o.pitch || 0, -18, 14);
  const mood = o.mood || 'neutral';
  const M = model(d);
  const k = clamp(R / 30, 0.8, 2);           // pen scale
  // pen: the contour grows sub-linearly with the head (ZP close-ups have a thin, even contour and more
  // interior lines); interior lines are ~0.65 of the contour
  const cw = Math.min(3.6, 2.4 + 0.012 * R);
  const W = { contour: cw, hair: cw * 0.95, lid: cw * 0.85, feat: cw * 0.66, fine: cw * 0.48, brow: cw * 1.25 };
  const skin = d.skin, skinSh = mixC(flatShadow(skin), shadeC(skin, 0.15), 0.45); // warm-neutral, never grey
  const sil = !!d.silhouette;

  // cartoon cheat for mid-line features: they turn "faster" than the sphere
  const fadeM = sstep(-0.1, 0.35, C);
  // kids: features turn slower than the head (ZP kids read flat and frontal in 3/4), converging by profile
  const yawF = M.kid && ay < 90 ? yaw * lerp(0.6, 1, sstep(45, 88, ay)) : yaw;
  const SF = Math.sin(yawF * D);
  const cheat = Math.sign(SF) * Math.min(1, Math.pow(Math.abs(SF), 0.45) + 0.1 * Math.abs(Math.sin(2 * yawF * D)));
  const Sm = lerp(SF, cheat, fadeM);
  const Sf = lerp(SF, Sm, 0.6); // feature layout: between the true turn and the silhouette cheat
  const fadeP = sstep(-0.4, -0.02, C); // the profile mid-line stays in up to full profile, fades only toward the back
  // in 3/4 the nose is pushed out past the far cheek (cartoon cheat): ZP noses always break the contour
  // 20-60 deg: the nose is drawn inside the face (interior line), only the tip breaks the contour a little;
  // near profile the full profile nose returns
  const noseK = 1 - 0.62 * sstep(6, 22, ay) * (1 - sstep(55, 82, ay));
  const midEff = (y) => { const fc = M.face(y); const base = fc ? fc.front : M.skull(y) ? M.skull(y).z0 + M.skull(y).b : 0; const v = M.mid(y) + M.noseP(y) * (noseK - 1); return base + (v - base) * fadeP; };

  // ---- silhouette rows
  const rows = [];
  const y0 = -M.top, y1 = M.cb, N = Math.ceil((y1 - y0) / 0.012);
  for (let i = 0; i <= N; i++) {
    const y = y0 + ((y1 - y0) * i) / N;
    let L = Infinity, Rt = -Infinity, fL = Infinity, fR = -Infinity;
    [M.skull(y), M.face(y)].forEach((c, ci) => {
      if (!c) return;
      const tuck = C >= 0 ? 1 : ci === 1 ? lerp(1, 0.3, sstep(0, 0.9, -C) * sstep(M.ye + 0.1, M.ye + 0.5, y)) : lerp(1, 0.55, sstep(0, 0.9, -C) * sstep(0.3, 0.84, y));
      // seen from behind, the lower face tucks in under the ear (lost profile), leaving only a cheek edge
      const tz = ci === 1 && C < 0 ? lerp(1, 0.35, sstep(0, 0.7, -C) * sstep(M.ye + 0.15, M.ym, y)) : 1;
      const cx = c.z0 * S * tz, h = Math.hypot(c.a * C * tuck, c.b * S * tz);
      // 3/4 cheat: the far cheek sits inside the nose (ZP), so the far side of the face mass is pulled in
      const pull = ci === 1 && C > 0 && !M.kid ? 1 - 0.07 * Math.abs(Math.sin(2 * yaw * D)) * sstep(M.ye - 0.1, M.ye + 0.15, y) * sstep(M.cb + 0.05, M.ym, y) : 1;
      const hL = side > 0 ? h : h * pull, hR = side > 0 ? h * pull : h;
      L = Math.min(L, cx - hL); Rt = Math.max(Rt, cx + hR);
      if (ci === 1 || y < M.ye + 0.2) { fL = Math.min(fL, cx - hL); fR = Math.max(fR, cx + hR); }
    });
    if (y >= M.midR[0] && y <= M.midR[1] && C > -0.35) {
      const xm = midEff(y) * Sm;
      if (Sm > 0) { Rt = Math.max(Rt, xm); fR = Math.max(fR, xm); } else if (Sm < 0) { L = Math.min(L, xm); fL = Math.min(fL, xm); }
    }
    if (L === Infinity) continue;
    rows.push([y, L, Rt, fL, fR]);
  }
  const edgeAt = (y, dir) => {
    if (y <= rows[0][0]) return dir > 0 ? rows[0][2] : rows[0][1];
    for (let i = 1; i < rows.length; i++) if (rows[i][0] >= y) { const [ya, la, ra] = rows[i - 1], [yb2, lb, rb] = rows[i]; const t = (y - ya) / (yb2 - ya || 1); return dir > 0 ? lerp(ra, rb, t) : lerp(la, lb, t); }
    const r = rows[rows.length - 1]; return dir > 0 ? r[2] : r[1];
  };
  const P = (x, y) => [X + x * R, Y + y * R];
  CENTER = [X, Y];
  const outline = rows.map(([y, , r]) => P(r, y)).concat(rows.slice().reverse().map(([y, l]) => P(l, y)));
  const outlineD = I.poly(outline);

  // 3-D point on the head (real projection), used for hair, ears, hat
  const F = (x, y, z) => {
    x *= d.wide; z *= d.deep;
    const yy = y < 0 ? y * M.top : y;
    return { x: X + (x * C + z * S) * R, y: Y + yy * R, z: -x * S + z * C };
  };
  o.F = F;

  // pitch: tilt the whole head in profile, slide the features in front view
  const rot = -side * pitch * Math.abs(S) * 0.9;
  const fy = (-pitch / 14) * 0.09 * Math.abs(C);
  if (rot) I.emit(`<g transform="rotate(${rot.toFixed(2)} ${I.n1(X)} ${I.n1(Y + R * 0.3)})">`);

  const md = MOODS[mood] || MOODS.neutral;
  const ex = clamp((30 - R) / 18, 0, 1); // small heads: exaggerate brows, lids and mouths so moods read
  const ctx = { d, M, R, X, Y, P, F, W, S, C, Sm, Sf, side, ay: Math.abs(yawF), ayReal: ay, yaw, yawF, k, edgeAt, midEff, skin, skinSh, fy, mood, md, o, sil, outlineD, ex };

  // ---- back hair (behind everything)
  hairExtras(ctx);
  // ---- ears that sit behind the head outline (front and back views)
  const ears = earList(ctx);
  ears.filter((e) => e.behind).forEach((e) => drawEar(ctx, e));

  // ---- skin mass with its cel shadow
  // skin cel shadow: a flat shape on the far side. On women and kids, and on every small head, the shadow
  // must not creep along the jaw (it reads as stubble): the vertical shift shrinks, and below R 20 it is gone
  const softJaw = M.fem || M.kid;
  const lx = R * (R < 20 ? 0.06 : 0.12), ly = -R * (R < 20 ? 0 : softJaw ? 0.03 : 0.08);
  I.clip(outlineD, () => {
    I.emit(`<path d="${outlineD}" fill="${sil ? skin : skinSh}"/>`);
    if (!sil) {
      const q = outline.map(([x, y]) => [x + lx, y + ly]);
      // from behind, the nape is in shadow down into the neck (no pale strip between head and collar)
      if (C < -0.2) I.clip(I.poly(I.ell(X, Y - R * 0.55, R * 1.6, R * 0.95, 28)), () => I.emit(`<path d="${I.poly(q)}" fill="${skin}"/>`));
      else I.emit(`<path d="${I.poly(q)}" fill="${skin}"/>`);
      // under-chin / jaw shadow wedge
      if (ay < 150) {
        const jaw = [];
        for (let y = M.ym + 0.12; y <= M.cb; y += 0.03) jaw.push(P(edgeAt(y, -side) + side * 0.02, y));
        void jaw;
      }
    }
  });

  // head contour (the hair mass drawn next covers it where there is hair)
  if (C < -0.2 && (o.neck ?? d.neck) > 0) {
    // from behind, the neck continues the nape: no contour across the neck column
    const nw = (d.neckW || 1) * (M.kid ? 0.24 : 0.27), nh = Math.hypot(nw * C, nw * 1.2 * S) * 0.92, ncx = X - 0.2 * S * R;
    const big = `M${I.n1(X - R * 8)} ${I.n1(Y - R * 8)}H${I.n1(X + R * 8)}V${I.n1(Y + R * 8)}H${I.n1(X - R * 8)}Z`;
    I.clip(`${big} M${I.n1(ncx - nh * R)} ${I.n1(Y + R * 0.3)}V${I.n1(Y + R * 3)}H${I.n1(ncx + nh * R)}V${I.n1(Y + R * 0.3)}Z`, () => tt(outline, W.contour, { closed: true, center: [X, Y + R * 0.2] }));
  } else tt(outline, W.contour, { closed: true, center: [X, Y + R * 0.2] });
  // ---- neck: over the lower skull, under the jaw (clipped outside the face mass)
  const fr = rows.filter((r) => r[3] !== Infinity && (r[0] < M.ye + 0.2 || C > -0.2));
  const faceMask = fr.map(([y, , , , r]) => P(r, y)).concat(fr.slice().reverse().map(([y, , , l]) => P(l, y)));
  if ((o.neck ?? d.neck) > 0) {
    const big = `M${I.n1(X - R * 8)} ${I.n1(Y - R * 8)}H${I.n1(X + R * 8)}V${I.n1(Y + R * 8)}H${I.n1(X - R * 8)}Z`;
    const cid = 'nk' + (++HAIRCLIP) + Math.floor(Math.random() * 1e6);
    I.emit(`<clipPath id="${cid}"><path clip-rule="evenodd" d="${big} ${I.poly(faceMask)}"/></clipPath><g clip-path="url(#${cid})">`);
    drawNeck(ctx, o.neck ?? d.neck);
    I.emit('</g>');
    // the jaw line, from the chin up to the ear, over the neck
    if (C > -0.2 && ay > 8 && !(M.kid && ay < 70)) {
      const jl = fr.filter((r) => r[0] > M.earB - 0.08).map((r) => P(side > 0 ? r[3] : r[4], r[0]));
      if (jl.length > 2) ln(jl, W.contour * 0.95, { taper: [0.35, 0], wob: 0.2 });
    }
  }
  // ---- hair
  const bald = d.hairStyle === 'bald';
  if (!bald) drawHair(ctx, outline, outlineD, lx, ly).finish();

  // ---- ears in front of hair (3/4 and profile)
  ears.filter((e) => !e.behind).forEach((e) => drawEar(ctx, e));

  if (sil || ay > 96) {
    if (d.hat) drawHat(ctx);
    if (rot) I.emit('</g>');
    return;
  }
  const E = eyeLayout(ctx);
  ctx.E = E;
  if (d.beard) drawBeard(ctx, outline);
  drawNose(ctx);
  drawAge(ctx);
  drawMouth(ctx);
  if (d.moustache || d.beard) drawMoustache(ctx);
  drawEyes(ctx);
  drawBrows(ctx);
  if (d.freckles) drawFreckles(ctx);
  if ((d.blush && d.age < 0.7) || md.blushK) drawBlush(ctx);
  if (md.sweat) sweatDrop(ctx);
  if (d.glasses) drawGlasses(ctx, ears);
  if (d.hat) drawHat(ctx);
  if (d.accessory === 'flower') { const p = F(-0.45, -0.75, 0.6); flower(ctx, [p.x, p.y]); }
  if (rot) I.emit('</g>');
}

// ---- pen helpers --------------------------------------------------------------------------------
// thick-thin brush (ZP inking): the width follows the light. Heavier where the outward normal faces away
// from the light (the cel-shadow side, lower left, and undersides), lighter on lit edges, tapering into the
// ends; no per-point jitter. Uses core.thickThin when the BODY lead exports it.
const SHD = (() => { const x = -((core.LIGHT && core.LIGHT.lx) ?? 7), y = -((core.LIGHT && core.LIGHT.ly) ?? -6), l = Math.hypot(x, y); return [x / l, y / l]; })();
let CENTER = [0, 0];
function tt(pts, w, o = {}) {
  // core.thickThin scales k by INK_STYLE.thick; our k is the absolute amount (contour 0.38, features 0.25)
  if (typeof core.thickThin === 'function') { const base = (core.INK_STYLE && core.INK_STYLE.thick) || 0.375; return core.thickThin(pts, w, { center: CENTER, ...o, k: (o.k ?? 0.38) / base }); }
  const closed = !!o.closed;
  const src = o.wob ? I.wobble(pts, o.wob) : pts;
  const s = o.lin ? I.sampleLin(src, closed, 3) : I.sample(src, closed, 2.5);
  const n = s.length;
  if (n < 2) return;
  const [cx, cy] = o.center || CENTER;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const total = cum[n - 1] || 1, K = o.k ?? 0.38, minW = o.minW ?? 0.18;
  const [ta, tb] = o.taper || [0.2, 0.25];
  const L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const a = closed ? s[(i - 1 + n) % n] : s[Math.max(0, i - 1)], b = closed ? s[(i + 1) % n] : s[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    let nx = -ty, ny = tx;
    if (nx * (s[i][0] - cx) + ny * (s[i][1] - cy) < 0) { nx = -nx; ny = -ny; }
    const mod = 1 + K * (nx * SHD[0] + ny * SHD[1]);
    let prof = 1;
    if (!closed) {
      const t = cum[i] / total;
      if (ta > 0 && t < ta) prof = Math.sin((t / ta) * Math.PI / 2); else if (tb > 0 && t > 1 - tb) prof = Math.sin(((1 - t) / tb) * Math.PI / 2);
      prof = minW + (1 - minW) * prof;
    }
    const hw = (w / 2) * prof * mod;
    L.push([s[i][0] - ty * hw, s[i][1] + tx * hw]); Rr.push([s[i][0] + ty * hw, s[i][1] - tx * hw]);
  }
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  const col = o.color || INK;
  if (closed) I.emit(`<path d="${I.poly(L)} ${I.poly(Rr.reverse())}" fill="${col}" fill-rule="evenodd"${op}/>`);
  else I.emit(`<path d="${I.poly(L.concat(Rr.reverse()))}" fill="${col}"${op}/>`);
}
function ln(pts, w, o = {}) { tt(pts, w, { taper: o.taper || [0.2, 0.25], minW: o.minW ?? 0.2, color: o.color, op: o.op, k: o.k ?? 0.25, wob: o.wob ?? 0.04, lin: o.lin }); }
function centroid(p) { let x = 0, y = 0; p.forEach((q) => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
function celFill(pts, base, sh, dx, dy, o = {}) {
  const d = I.poly(I.sample(pts, true));
  I.clip(d, () => {
    I.emit(`<path d="${d}" fill="${sh}"/>`);
    I.emit(`<path d="${I.poly(I.sample(pts.map(([x, y]) => [x + dx, y + dy]), true))}" fill="${base}"/>`);
    if (o.inner) o.inner();
  });
  if (o.w) tt(pts, o.w, { closed: true, color: o.ink, center: centroid(pts) });
}

// ---- neck ---------------------------------------------------------------------------------------
function drawNeck(c, len) {
  // an organic neck: sides curve in from the jaw to a slight waist and flare toward the collar; the jaw
  // throws a curved shadow on it; seen from behind the neck is all in shadow and sits behind the skull
  const { M, S, C, R, P, W, skin, skinSh, side, sil, ayReal } = c;
  const nw = c.d.neckW || 1, hw = (M.kid ? 0.24 : 0.27) * nw, hd = (M.kid ? 0.27 : 0.32) * nw;
  const half = Math.hypot(hw * C, hd * S);
  const cx = -0.2 * S, y0 = 0.3, y1 = Math.max(M.cb + 0.1, len);
  const lean = side * 0.04 * Math.abs(S);
  const N = 10, Ls = [], Rs = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = lerp(y0, y1, t);
    const wv = half * (1 - 0.06 * Math.sin(Math.PI * Math.min(1, t * 1.3)) + 0.16 * sstep(0.6, 1, t) * Math.max(0, (y1 - y0 - 0.5) / 0.6));
    const x = cx + lean * t;
    Ls.push(P(x - wv, y)); Rs.push(P(x + wv, y));
  }
  const pts = Ls.concat(Rs.slice().reverse());
  const back = C < -0.2;
  const d = I.poly(pts);
  const body = () => {
    I.clip(d, () => {
      I.emit(`<path d="${d}" fill="${sil ? skin : skinSh}"/>`);
      if (!sil && !back) {
        // lit part below a curved jaw-shadow edge, lit toward the light side
        const yS = M.cb + 0.06, sag = 0.1;
        const lit = [];
        for (let i = 0; i <= 12; i++) { const u = -1.6 + (3.2 * i) / 12; lit.push(P(cx + u * half + 0.05, yS + sag * (1 - u * u / 2.6))); }
        lit.push(P(cx + 1.6 * half, y1 + 1), P(cx - 1.6 * half + 0.1, y1 + 1));
        I.fill(lit, skin, { wob: 0 });
        // the far side stays in shadow: a flat band on the shadow side
        I.fill([P(cx + half * 0.55, yS), P(cx + half * 1.7, yS), P(cx + half * 1.7, y1 + 1), P(cx + half * 0.7, y1 + 1)], skinSh, { wob: 0, lin: true });
      }
    });
    if (sil) return;
    // sternocleidomastoid hint in close-ups: from behind the ear down toward the pit of the neck
    if (!back && R > 40 && ayReal > 20 && ayReal < 110) {
      const a = P(cx - side * half * 0.75, M.cb + 0.12), b = P(cx + side * half * 0.35, y1 - 0.02);
      ln([a, [lerp(a[0], b[0], 0.5) - side * R * 0.02, lerp(a[1], b[1], 0.5)], b], W.fine, { taper: [0.5, 0.6], op: 0.55 });
    }
  };
  // clip: in front/3-4 views the neck hides behind the face mass (faceMask clip is set by the caller);
  // from behind it also goes behind the whole skull
  const big = `M${I.n1(c.X - R * 8)} ${I.n1(c.Y - R * 8)}H${I.n1(c.X + R * 8)}V${I.n1(c.Y + R * 8)}H${I.n1(c.X - R * 8)}Z`;
  if (back) {
    const bid = 'nkb' + (++HAIRCLIP) + Math.floor(Math.random() * 1e6);
    I.emit(`<clipPath id="${bid}"><path clip-rule="evenodd" d="${big} ${c.outlineD}"/></clipPath><g clip-path="url(#${bid})">`);
    body(); I.emit('</g>');
  } else body();
  // neck sides only where they leave the head outline, tapering off at the collar
  const id = 'nkl' + (++HAIRCLIP) + Math.floor(Math.random() * 1e6);
  I.emit(`<clipPath id="${id}"><path clip-rule="evenodd" d="${big} ${c.outlineD}"/></clipPath><g clip-path="url(#${id})">`);
  if (!back) { ln(Ls, W.contour * 0.85, { taper: [0, 0.4], k: 0.38 }); ln(Rs, W.contour * 0.85, { taper: [0, 0.4], k: 0.38 }); }
  I.emit('</g>');
  if (back) { ln(Ls.slice(2), W.contour * 0.85, { taper: [0.15, 0.4], k: 0.38 }); ln(Rs.slice(2), W.contour * 0.85, { taper: [0.15, 0.4], k: 0.38 }); }
}

// ---- ears ---------------------------------------------------------------------------------------
function earList(c) {
  const { d, M, S, C, F, R } = c;
  if (['bob', 'long'].includes(d.hairStyle)) return [];
  const out = [];
  [-1, 1].forEach((sg) => {
    const nz = -sg * S - 0.25 * C;
    if (nz < -0.5) return;
    const p = F(sg * 0.97, M.ye + d.earY - 0.02, -0.1 - 0.05 * sg * 0);
    const fw = lerp(0.55, 1, clamp((nz + 0.25) / 1.1, 0, 1));
    const faceX = c.X + 0.6 * S * R;
    const fdir = Math.sign(faceX - p.x) || -sg;
    out.push({ x: p.x, y: p.y, fw, fdir, behind: Math.abs(S) < 0.22, sg });
  });
  return out;
}
function drawEar(c, e) {
  const { R, W, skin, skinSh, M, sil, k } = c;
  const es = c.d.earSize || 1;
  const ew = R * (M.kid ? 0.19 : 0.2) * e.fw * es, eh = R * (M.kid ? 0.27 : 0.3) * (1 + c.M.old * 0.12) * es;
  const f = e.fdir, x = e.x - f * ew * 0.25, y = e.y;
  // C shape: straighter on the face side, round at the back
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    let px = Math.cos(a), py = Math.sin(a);
    if (px * f > 0) px *= 0.6;           // flatter where it joins the head
    if (py > 0) px *= 1 - py * 0.35;      // lobe narrower
    pts.push([x + px * ew, y + py * eh - (px * -f > 0 ? eh * 0.06 : 0)]);
  }
  celFill(pts, skin, sil ? skin : skinSh, 1.5 * k * f, -1.5 * k, { w: W.feat * 1.15 });
  if (sil) return;
  const q = (u, v) => [x + (-f) * u * ew, y + v * eh];
  ln([q(-0.35, -0.5), q(0.25, -0.45), q(0.45, 0), q(0.2, 0.3), q(-0.15, 0.28)], W.fine, { taper: [0.25, 0.3] });
  ln([q(-0.05, 0.28), q(-0.15, 0.05)], W.fine * 0.9, { taper: [0.2, 0.4] });
}

// ---- hair ---------------------------------------------------------------------------------------
// fringe locks + parting notch along the front hairline (t: 0 front centre, ±1 ears, ±2 back)
function locks(d, t) {
  const a = Math.abs(t);
  if (a > 0.8) return 0;
  const env = Math.pow(1 - a / 0.8, 0.6);
  let y = (d.fringeDrop || 0) * env;
  const pt = d._partT;
  if (pt != null) y -= 0.09 * Math.max(0, 1 - Math.abs(t - pt) / 0.14);
  if (d.locks) {
    const dir = pt == null ? 1 : Math.sign(t - pt) || 1;
    const ph = ((t - (pt || 0)) * dir) * d.locks * 0.75;
    const fr = ph - Math.floor(ph);
    const tri = fr < 0.72 ? fr / 0.72 : (1 - fr) / 0.28; // swept, pointed lock tips
    y += 0.1 * tri * env * Math.min(1, Math.abs(t - (pt || 0)) / 0.1);
  } else if (d.hairline > -0.3 && !d.fringeDrop) y += 0.03 * Math.sin(t * 17) * env;
  return y;
}
const HL = (d, t) => {
  const f = d.hairline;
  const fore = -0.8 + f * 0.6, temple = -0.62 + f * 0.35, burn = d.sideburn, nape = 0.42 + d.napeLevel * 0.4;
  const a = Math.abs(t);
  const ease = (u) => u * u * (3 - 2 * u);
  if (a < 0.45) return fore + (temple - fore) * ease(a / 0.45) + locks(d, t);
  if (a < 0.84) return temple + 0.07 * ease((a - 0.45) / 0.39) + locks(d, t);
  if (a < 0.98) return temple + 0.07 + (burn - temple - 0.07) * ease((a - 0.84) / 0.14);
  if (a < 1.25) return burn + (nape * 0.8 - burn) * ease((a - 0.98) / 0.27);
  return nape * 0.8 + (nape - nape * 0.8) * ((a - 1.25) / 0.75);
};
function hairPt(c, t, r = 1.02) {
  const { d, F } = c;
  const ang = t * 90 * D, y = HL(d, t);
  const rr = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, y * y)));
  return F(Math.sin(ang) * rr * r, y, Math.cos(ang) * rr * r);
}
function visibleHairline(c) {
  const { d, F, R } = c;
  const N = 120, pts = [];
  const top = F(0, -1, 0);
  for (let i = 0; i < N; i++) {
    const t = -2 + (i / N) * 4; const q = hairPt(c, t);
    const off = HL(d, t) < -0.97;
    pts.push([q.x, off ? top.y - R * 10 : q.y, t, off ? true : q.z > 0.0]);
  }
  let best = null;
  for (let st = 0; st < N; st++) {
    if (!pts[st][3] || pts[(st - 1 + N) % N][3]) continue;
    let k = 0; while (k < N && pts[(st + k) % N][3]) k++;
    if (!best || k > best[1]) best = [st, k];
  }
  if (!best) return pts.every((p) => p[3]) ? pts.map((p) => p.slice(0, 3)) : [];
  const out = [];
  for (let k = 0; k < best[1]; k++) out.push(pts[(best[0] + k) % N].slice(0, 3));
  return out;
}
function hairColors(d) {
  const L = lum(d.hair);
  const light = L > 0.62;
  // spot black: dark hair masses get a solid black shadow shape (matches the body's dark cloth)
  const sh = light ? mixC(d.hair, '#6c7890', 0.32) : L < 0.25 ? '#120e11' : shadeC(d.hair, 0.24);
  const hi = d.hairStreak || (light ? '#ffffff' : L < 0.25 ? mixC(d.hair, '#7f97bd', 0.55) : mixC(d.hair, '#fff4e0', 0.38));
  return { base: d.hair, sh, hi, strand: d.hairLine || (light ? mixC(d.hair, '#58627a', 0.45) : L < 0.25 ? null : shadeC(d.hair, 0.4)) };
}
function drawHair(c, headOutline, headD, lx, ly) {
  const { d, M, R, X, Y, P, S, C, W, F, ay, sil, yaw } = c;
  // skin region = everything under the hairline (evenodd with a big box → hair clip)
  const hl = visibleHairline(c);
  let skinRegion = null;
  if (hl.length > 1) {
    // below/in front of the hairline: the visible run, closed by a wide arc round the bottom
    const A = hl[0], B = hl[hl.length - 1];
    const ang = ([x, y]) => Math.atan2(y - Y, x - X);
    let aB = ang(B), aA = ang(A);
    // sweep from B to A through "down" (+90deg)
    const norm = (t) => { while (t < 0) t += Math.PI * 2; while (t >= Math.PI * 2) t -= Math.PI * 2; return t; };
    let dA = norm(aA - aB); const dDown = norm(Math.PI / 2 - aB);
    const ccw = dDown <= dA; // going in +angle direction from B reaches down before A
    const span = ccw ? dA : -(Math.PI * 2 - dA);
    const arc = [];
    for (let i = 0; i <= 16; i++) { const t = aB + (span * i) / 16; arc.push([X + Math.cos(t) * R * 4, Y + Math.sin(t) * R * 4]); }
    skinRegion = hl.map(([x, y]) => [x, y]).concat(arc);
  }
  const big = `M${I.n1(X - R * 6)} ${I.n1(Y - R * 6)}H${I.n1(X + R * 6)}V${I.n1(Y + R * 6)}H${I.n1(X - R * 6)}Z`;
  const sk = skinRegion ? 'M' + skinRegion.map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L') + 'Z' : '';
  const hairD = `${big} ${sk}`;

  // hair mass: the skull swollen by the hair volume
  const hc = hairColors(d);
  const hv = 1.08 + (d.hairVol - 1) * 0.9;
  const lift = (d.hairVol - 1) * 0.7 + 0.04;
  const rows = [];
  const top = M.top * hv + lift, bot = 0.84 * hv + 0.04;
  for (let i = 0; i <= 90; i++) {
    const y = -top + ((top + bot) * i) / 90;
    let yy = y; if (d.hairTop === 'flat' && y < -M.top * 1.02) continue;
    const r = y <= 0 ? Math.sqrt(Math.max(0, 1 - (y / top) ** 2)) : Math.sqrt(Math.max(0, 1 - (y / bot) ** 2));
    let z0 = (-0.06 - 0.22 * sstep(-0.3, bot, y)) * d.deep, a = r * d.wide * hv, b = r * d.deep * hv;
    { const fr = z0 + b, bk0 = z0 - b, bk = lerp(bk0, Math.max(bk0, -0.66 - (hv - 1)), sstep(0.1, 0.6, y)); z0 = (fr + bk) / 2; b = (fr - bk) / 2; }
    const cx = z0 * S, h = Math.hypot(a * C, b * S);
    rows.push([yy, cx - h, cx + h]);
  }
  let mass = rows.map(([y, , r]) => P(r, y)).concat(rows.slice().reverse().map(([y, l]) => P(l, y)));
  const curly = d.curly ?? d.hairVol >= 1.1;
  mass = mass.map(([x, y], i) => {
    const dx = x - X, dy = y - (Y - R * 0.1), l = Math.hypot(dx, dy) || 1, th = Math.atan2(dy, dx);
    let push = 0;
    const up = sstep(0.25, -0.35, dy / R); // 1 on the crown, 0 below the ears
    const ph = th + yaw * D * 0.9;
    if (curly) { const big = d.hairVol >= 1.15; push = R * (big ? 0.07 : 0.045) * (Math.abs(Math.sin(th * (big ? 7 : 11) + yaw * D * 0.9)) - 0.5); }
    else if (d.spiky) push = R * 0.16 * d.spiky * Math.pow(Math.abs(Math.sin(ph * 4.5 + 0.4)), 10) * up + R * 0.02 * up;
    else {
      // designed clumps: bulging lobes with pointed valleys, plus a few small tufts
      const nl = d.hairLobes ?? (['bob', 'long'].includes(d.hairStyle) ? 4 : 3);
      if (nl) push = R * 0.05 * (Math.pow(Math.abs(Math.sin(ph * nl * 0.5 + 0.7)), 0.45) - 0.72) * up;
      if (!['bob', 'long'].includes(d.hairStyle)) push += R * 0.035 * Math.pow(Math.abs(Math.sin(ph * 6)), 4) * sstep(-0.45, -0.75, dy / R) * (i % 2 ? 1 : 0.6);
    }
    return [x + (dx / l) * push, y + (dy / l) * push];
  });
  mass = I.wobble(mass, 0.08);
  // skin shadow cast by the hair onto the forehead / neck
  if (!sil && skinRegion && d.hairline >= -0.9) {
    I.clip(headD, () => I.emit(`<path fill-rule="evenodd" d="${hairD}" transform="translate(${I.n1(R * 0.03)} ${I.n1(R * 0.1)})" fill="${c.skinSh}"/>`));
  }
  const clipId = 'hc' + (++HAIRCLIP) + Math.floor(Math.random() * 1e6);
  I.emit(`<clipPath id="${clipId}"><path clip-rule="evenodd" d="${hairD}"/></clipPath><g clip-path="url(#${clipId})">`);
  // bald / receding (hairline < -0.9): only a horseshoe ribbon round the back and sides (built on the sphere,
  // visible runs only), high at the back of the skull and dropping to just above the ears, tufty top edge
  let baldG = false;
  if (d.hairline < -0.9) {
    const up = [], lo = [], vis = [];
    for (let i = 0; i <= 64; i++) {
      const t = 0.9 + (i / 64) * 2.2, ang = t * 90 * D, cb2 = Math.cos(ang) < 0 ? Math.pow(-Math.cos(ang), 0.7) : 0;
      // under a hat: a thin fringe under the brim, fuller over the ears, skin above the nape (not a bandage)
      const yB = d.hat ? lerp(0.12, -0.13, cb2) + (i % 4 === 1 ? 0.03 : 0) : 0.12 + 0.4 * cb2, endT = sstep(0, 0.22, Math.min(i, 64 - i) / 64);
      const yT = lerp(yB - 0.02, (d.hat ? -0.38 : -0.1 - 0.28 * cb2) + (!d.hat && i % 2 ? 0.04 : 0), endT);
      const P3 = (y, r) => { const rr = Math.sqrt(Math.max(0.05, 1 - y * y)) * r; return F(Math.sin(ang) * rr, y, Math.cos(ang) * rr); };
      const qa = P3(yT, 1.1), qb = P3(yB, 1.1);
      up.push([qa.x, qa.y]); lo.push([qb.x, qb.y]); vis.push(qa.z > -0.3);
    }
    const runs = []; let cur = null;
    vis.forEach((v, i) => { if (v) { if (!cur) runs.push(cur = []); cur.push(i); } else cur = null; });
    const dd = runs.filter((r) => r.length > 1).map((r) => I.poly(r.map((i) => up[i]).concat(r.slice().reverse().map((i) => lo[i])))).join(' ');
    const front = (i) => { const ang = (0.9 + (i / 64) * 2.2) * 90 * D; return -Math.sin(ang) * c.S + Math.cos(ang) * c.C > 0.05; };
    c.baldEdge = runs.map((r) => r.filter(front).map((i) => up[i])).concat(runs.map((r) => r.filter(front).map((i) => lo[i])));
    const bid = 'bd' + (++HAIRCLIP) + Math.floor(Math.random() * 1e6);
    I.emit(`</g><clipPath id="${bid}"><path d="${dd || 'M0 0Z'}"/></clipPath><g clip-path="url(#${bid})">`);
    baldG = true;
  }
  const showMass = d.hairline > -0.6 || true;
  if (showMass) {
    celFill(mass, hc.base, sil ? hc.base : hc.sh, lx * 1.1, ly * 1.1, {
      inner: () => { if (!sil) hairHighlights(c, hc); },
    });
    // the hair's own outer contour
    tt(mass, W.hair, { closed: true, center: [X, Y] });
  }
  I.emit('</g>');
  if (baldG && !sil) I.clip(headD, () => c.baldEdge.forEach((e) => { if (e.length > 2) ln(e, W.lid, { taper: [0.2, 0.2] }); }));
  return {
    skinD: `M${I.n1(X - R * 6)} ${I.n1(Y - R * 6)}H${I.n1(X + R * 6)}V${I.n1(Y + R * 6)}H${I.n1(X - R * 6)}Z`,
    finish: () => {
      // hairline edge where hair meets skin (lighter than the contour)
      if (sil || hl.length < 2 || d.hairline < -0.9) return;
      const inside = pointIn(headOutline);
      let seg = [];
      const flush = () => { if (seg.length > 1) ln(seg, W.lid, { taper: [0.15, 0.15] }); seg = []; };
      hl.forEach(([x, y]) => { if (inside(x, y, -R * 0.02)) seg.push([x, y]); else flush(); });
      flush();
      if (d.fringe) fringe(c, hc);
    },
  };
}
let HAIRCLIP = 0;
function pointIn(poly) {
  return (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
}
function hairHighlights(c, hc) {
  const { d, F, yaw, W } = c;
  const face = -yaw; // longitude facing the viewer
  const hv = 1.08 + (d.hairVol - 1) * 0.9;
  const P3 = (lon, lat) => { const y = lat, r = Math.sqrt(Math.max(0.02, 1 - y * y)) * hv; return F(Math.sin(lon * D) * r, y * hv - (lat < 0 ? (d.hairVol - 1) * 0.3 : 0), Math.cos(lon * D) * r); };
  const dark = lum(d.hair) < 0.3;
  const curly = d.curly ?? d.hairVol >= 1.1;
  const pl = d._partT != null ? d._partT * 90 : null; // parting longitude (head-local)
  // sheen: one long lens-shaped streak (+ a short second one) following the skull, toward the light
  const lens = (lon0, lon1, lat0, lat1, thick, zig) => {
    const topE = [], botE = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n, lon = lerp(lon0, lon1, t), lat = lerp(lat0, lat1, t);
      const env = Math.pow(Math.sin(Math.PI * t), 0.8);
      const z = zig ? (i % 2 ? zig : -zig) * env : 0;
      const a = P3(lon, lat + z - thick * env / 2), b = P3(lon + 2, lat + z * 0.6 + thick * env / 2);
      if (a.z > -0.05) { topE.push([a.x, a.y]); botE.push([b.x, b.y]); }
    }
    if (topE.length > 2) I.fill(topE.concat(botE.reverse()), hc.hi, { wob: 0.15, op: lum(d.hair) > 0.62 ? 0.85 : 1 });
  };
  const lc = face - 20;
  if (curly) {
    // curls: small spiral curl marks over the mass (ZP white curls), in the strand colour; one glint
    const cc = lum(d.hair) > 0.62 ? mixC(d.hair, '#6a7088', 0.45) : hc.hi;
    [[-50, -0.55], [-10, -0.78], [30, -0.6], [-28, -0.3], [55, -0.35], [10, -0.42], [-70, -0.2], [70, -0.7], [-40, -0.9]].forEach(([dl, lat], i) => {
      const q = P3(lc + dl, lat);
      if (q.z < 0.15) return;
      const r = c.R * (0.05 + 0.012 * (i % 3)), a0 = (i * 1.7) % 6.28;
      const pts = []; for (let j = 0; j <= 9; j++) { const t = a0 + (j / 9) * Math.PI * 1.45, rr = r * (1 - j * 0.045); pts.push([q.x + Math.cos(t) * rr, q.y + Math.sin(t) * rr * 0.85]); }
      ln(pts, W.fine * 1.05, { color: cc, taper: [0.2, 0.5] });
    });
    return;
  }
  lens(lc - 55, lc + 40, -0.7, -0.62, 0.1, 0);
  lens(lc - 50, lc - 5, -0.42, -0.36, 0.06, 0);
  // parting: a line from the hairline back over the crown, strands sweeping away from it
  if (pl != null) {
    const pts = []; for (let j = 0; j <= 8; j++) { const q = P3(pl, lerp(-0.62, -0.98, j / 8)); if (q.z > 0.05) pts.push([q.x, q.y]); }
    if (pts.length > 2) ln(pts, W.fine, { color: dark ? mixC(hc.hi, '#000000', 0.2) : hc.strand || shadeC(d.hair, 0.45), taper: [0.2, 0.5] });
  }
  if (hc.strand) {
    [-45, -5, 35].forEach((dl, i) => {
      const pts = [];
      const lon0 = pl != null ? pl + (dl > 0 ? 8 : -8) : face + dl;
      for (let j = 0; j <= 6; j++) { const lat = lerp(-0.92, -0.2 - i * 0.05, j / 6); const q = P3(lon0 + (dl - (pl != null ? 0 : 0)) * (j / 6) * 1.2, lat); if (q.z > 0.1) pts.push([q.x, q.y]); }
      if (pts.length > 2) ln(pts, W.fine * 0.9, { color: hc.strand, taper: [0.3, 0.5] });
    });
  }
}
function fringe(c, hc) {
  const { d, F, W } = c;
  for (let k = 0; k < d.fringe; k++) {
    const t = -0.55 + (k / Math.max(1, d.fringe - 1)) * 1.1, ang = t * 80 * D;
    const y = HL(d, t);
    const r = Math.sqrt(Math.max(0.05, 1 - y * y));
    const a = F(Math.sin(ang - 0.14) * r * 1.02, y - 0.04, Math.cos(ang - 0.14) * r * 1.02), b = F(Math.sin(ang + 0.14) * r * 1.02, y - 0.04, Math.cos(ang + 0.14) * r * 1.02);
    const tip = F(Math.sin(ang + 0.22) * r * 1.03, y + 0.18, Math.cos(ang + 0.22) * r * 1.03);
    if (a.z > 0.15 && b.z > 0.15) {
      I.fill([[a.x, a.y], [tip.x, tip.y], [b.x, b.y]], hc.base, { wob: 0 });
      ln([[a.x, a.y], [tip.x, tip.y], [b.x, b.y]], W.lid, { taper: [0.1, 0.1] });
    }
  }
}

// ---- expressions ----------------------------------------------------------------------------------
// eye: open | wide | happy (joy arcs) | closed | squint ; lid: extra upper-lid cover ; tilt: + inner lid end
// lower (angry), - inner end higher (worry) ; brow: { inner (+ down), all (+ down), arch } in R units
const MOODS = {
  neutral: {},
  smile: { mouth: 'smile', low: 1, brow: { all: -0.015 }, cheek: 1 },
  joy: { eye: 'happy', mouth: 'laugh', brow: { all: -0.07 }, cheek: 1 },
  sad: { mouth: 'frown', lid: 0.2, tilt: -1, brow: { inner: -0.1, all: 0.03 } },
  worried: { mouth: 'wobble', lid: 0.04, tilt: -0.9, brow: { inner: -0.13, all: 0.0 }, pupil: 0.85 },
  shock: { eye: 'wide', mouth: 'o', brow: { all: -0.14, arch: 0.03 }, pupil: 0.62 },
  surprise: { eye: 'wide', mouth: 'gasp', brow: { all: -0.15, arch: 0.04 }, pupil: 0.7 },
  angry: { mouth: 'grit', lid: 0.24, tilt: 1, brow: { inner: 0.12, all: 0.04 } },
  determined: { mouth: 'set', lid: 0.2, tilt: 0.8, brow: { inner: 0.1, all: 0.03 }, pupil: 0.9 },
  focus: { mouth: 'flat', lid: 0.26, tilt: 0.3, brow: { inner: 0.05 } },
  tired: { mouth: 'flat', lid: 0.46, brow: { inner: -0.04, all: 0.03 }, bags: 0.5 },
  sleepy: { mouth: 'droop', lid: 0.6, tilt: -0.3, brow: { inner: -0.05, all: -0.02 }, bags: 0.6 },
  sly: { mouth: 'smirk', lid: 0.42, low: 1, brow: { asym: 1 } },
  shut: { eye: 'closed', mouth: 'flat' },
  tears: { mouth: 'cry', lid: 0.1, tilt: -1, brow: { inner: -0.15 }, tears: 1, pupil: 0.9 },
  grimace: { eye: 'squint', mouth: 'grimace', brow: { inner: 0.1, all: 0.05 } },
  embarrassed: { mouth: 'wobble', lid: 0.14, tilt: -0.6, brow: { inner: -0.1, all: -0.03 }, pupil: 0.8, blushK: 2, sweat: 1 },
  dejected: { mouth: 'frown', lid: 0.42, tilt: -1, brow: { inner: -0.13, all: 0.05 }, pupil: 0.9 },
};
MOODS.embarrassment = MOODS.embarrassed; MOODS.shy = MOODS.embarrassed; MOODS.dejection = MOODS.dejected; MOODS.determination = MOODS.determined;
MOODS.worry = MOODS.worried; MOODS.happy = MOODS.joy; MOODS.cry = MOODS.tears; MOODS.surprised = MOODS.surprise;

// ---- eyes ---------------------------------------------------------------------------------------
function eyeLayout(c) {
  const { d, M, side, ay, Sf: Sm, edgeAt, midEff, fy } = c;
  const S = Math.sin(c.yawF * D);
  const u = sstep(8, 60, ay);
  const kidEye = d.eyeStyle === 'round';
  const exE = 1 + (kidEye ? 0.1 : 0.35) * (c.ex || 0); // small heads: bigger eyes so the whites survive the lid line
  const ew = d.eyeW * (kidEye ? 0.86 : 0.88) * exE, eh = d.eyeH * (kidEye ? 0.9 : 0.74) * exE;
  const y = M.ye + fy;
  const xb = midEff(M.yn) * Sm;
  const wn = ew * (1 - 0.3 * Math.abs(S)), wf = ew * (1 - 0.55 * u);
  const gap = d.glasses ? 0.17 : kidEye ? 0.12 : 0.1;
  const e0 = ew + gap / 2;
  let far = xb + side * e0 * (1 - u) - side * u * (wf * 0.55);
  // keep the far eye clear of the contour (bridge + brow): at 30-45 deg it sits behind the nose bridge
  const cx = Math.min(side * edgeAt(y - 0.12, side), side * edgeAt(y, side), side * edgeAt(y + 0.05, side)) * side;
  const lim = cx - side * (wf + 0.07 + 0.09 * u);
  if (side * far > side * lim) far = lim;
  let near = far - side * (wf + wn + gap + 0.03 * u);
  const farVis = ay < 70;
  if (!farVis) near = xb - side * (wn + 0.12 + 0.08 * sstep(72, 90, ay));
  const list = [{ x: near, w: wn, h: eh, near: true }];
  if (farVis) list.push({ x: far, w: wf * (ay > 50 ? 1 - (ay - 50) / 36 : 1), h: eh * (1 - 0.05 * u), near: false });
  return { y, list, u, ew, eh };
}
function eyeShape(x, y, w, h, kidEye, n = 22) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, sy = Math.sin(a);
    pts.push([x + Math.cos(a) * w, y + sy * h * (sy > 0 && !kidEye ? 0.8 : 1)]);
  }
  return pts;
}
function drawEyes(c) {
  const { d, M, R, P, W, o, md, E, skin } = c;
  const lk = o.look || [0, 0];
  const kidEye = d.eyeStyle === 'round';
  const eyeMode = o.blink ? 'closed' : md.eye || 'open';
  // one shared gaze for both eyes (never cross-eyed): clamp by the tightest eye
  const prBase = R * d.pupil * (kidEye ? 1.3 : 1.05) * (md.pupil || 1) * (eyeMode === 'wide' ? 0.85 : 1);
  let gx = lk[0] * 0.55 + c.side * E.u * 0.25, gy = lk[1] * 0.5;
  const glim = Math.min(...E.list.map((e) => 1 - prBase / (Math.min(e.w, e.h) * R) - 0.06));
  { const m = Math.hypot(gx, gy); if (m > glim) { gx *= glim / m; gy *= glim / m; } }
  E.list.forEach((e) => {
    const outer = e.near ? -c.side : c.side, inner = -outer;
    let [x, y] = P(e.x, E.y); let w = e.w * R, h = e.h * R;
    e.px = x; e.py = y; e.pw = w; e.ph = h;
    if (eyeMode === 'closed' || eyeMode === 'happy' || eyeMode === 'squint') {
      if (eyeMode === 'happy') ln([[x - w, y + h * 0.2], [x - w * 0.35, y - h * 0.32], [x + w * 0.35, y - h * 0.32], [x + w, y + h * 0.2]], W.lid * 1.1, { taper: [0.3, 0.3] });
      else if (eyeMode === 'squint') { ln([[x + inner * w * 1.0, y - h * 0.05], [x, y + h * 0.05], [x + outer * w * 1.05, y - h * 0.25]], W.lid * 1.1, { taper: [0.2, 0.4] }); ln([[x + inner * w * 0.6, y + h * 0.3], [x + outer * w * 0.7, y + h * 0.22]], W.fine, { taper: [0.3, 0.3] }); }
      else ln([[x - w, y - h * 0.02], [x - w * 0.35, y + h * 0.26], [x + w * 0.35, y + h * 0.26], [x + w, y - h * 0.02]], W.lid * 1.05, { taper: [0.3, 0.3] });
      if (eyeMode === 'closed') ln([[x + outer * w * 0.92, y + h * 0.05], [x + outer * w * 1.22, y - h * 0.1]], W.fine, { taper: [0, 0.6] });
      if (d.eyeStyle === 'hooded' || d.bags > 0.5) ln(I.arc(x, y + h * 0.35, w * 0.75, h * 0.7, Math.PI * 0.25, Math.PI * 0.75, 6), W.fine, { taper: [0.3, 0.3], op: 0.8 });
      return;
    }
    const wide = eyeMode === 'wide';
    if (wide) { w *= 1.06; h *= kidEye ? 1.08 : 1.2; }
    const eye = eyeShape(x, y, w, h, kidEye);
    celFill(eye, '#ffffff', '#e6e1ea', 0, h * 0.18, {});
    // lid cover: resting (by style) + mood
    let lidT = kidEye ? 0 : (d.lid ?? (d.eyeStyle === 'hooded' ? 0.4 : 0.28)) * 0.75 * (1 - 0.5 * c.ex);
    if (wide) lidT *= 0.15;
    lidT = clamp(lidT + (md.lid || 0) * (kidEye ? 1.1 : 1) * (1 + 0.4 * c.ex), 0, 0.75);
    const tilt = (md.tilt || 0) * h * 0.32; // + = inner end lower
    const lidY = (xx) => { const t = (xx - x) / w * inner; return y - h + 2 * h * lidT + tilt * t * 0.9 + (1 - t * t) * -h * 0.05 * (1 - lidT); };
    // pupil / iris
    const pr = prBase;
    const pcx = x + gx * w;
    let pcy = y + gy * h;
    // adults: the pupil hangs from the upper lid (ZP), unless looking down
    if (!kidEye && lidT > 0.02 && gy < 0.35) pcy = Math.max(pcy, lidY(pcx) + pr * 0.7);
    I.clipPoly(eye, () => {
      I.fill(I.ell(pcx, pcy, pr * (e.near ? 1 : 0.9), pr * 1.1, 14), INK, { wob: 0 });
      if (kidEye || R > 55 || md.tears) {
        I.fill(I.ell(pcx - pr * 0.38, pcy - pr * 0.42, pr * 0.32, pr * 0.32, 8), '#ffffff', { wob: 0 });
        if (md.tears) I.fill(I.ell(pcx + pr * 0.4, pcy + pr * 0.35, pr * 0.18, pr * 0.18, 6), '#ffffff', { wob: 0 });
      }
      if (lidT > 0.02) {
        const top = [];
        for (let i = 0; i <= 12; i++) { const xx = x - w * 1.1 + (2.2 * w * i) / 12; top.push([xx, lidY(xx)]); }
        I.fill(top.concat([[x + w * 1.2, y - h * 1.5], [x - w * 1.2, y - h * 1.5]]), skin, { wob: 0, lin: true });
      }
    });
    // outline: kids get a full ring; adults a heavy upper lid and a fine lower lid
    if (kidEye) I.ink(eye, W.feat, { closed: true, wob: 0.15, vary: 0.15 });
    else ln(I.arc(x, y, w, h * 0.8, Math.PI * 0.08, Math.PI * 0.92, 8), W.fine, { taper: [0.35, 0.35] });
    if (lidT > 0.02) {
      const ex = (s) => x + s * w * 1.02;
      ln([[ex(inner * 1.0), lidY(ex(inner))], [x, lidY(x)], [ex(outer * 1.0), lidY(ex(outer))], [ex(outer * 1.22), lidY(ex(outer)) + h * 0.06]], W.lid * (kidEye ? 1 : 1.3), { taper: [0.15, 0.45] });
    } else {
      const a0 = Math.PI * (outer < 0 ? 0.97 : 1.12), a1 = Math.PI * (outer < 0 ? 1.88 : 2.03);
      ln(I.arc(x, y, w * 1.02, h * 1.02, a0, a1, 10), W.lid * (kidEye ? 1 : 1.2), { taper: outer < 0 ? [0.1, 0.4] : [0.4, 0.1] });
    }
    if (!kidEye && !wide) {
      const ly0 = Math.min(lidY(x), y - h * 0.4);
      if (d.eyeStyle === 'hooded') ln([[x + inner * w * 0.55, ly0 - h * 0.38], [x, ly0 - h * 0.46], [x + outer * w * 0.95, ly0 - h * 0.12], [x + outer * w * 1.2, ly0 + h * 0.12]], W.feat * 0.9, { taper: [0.4, 0.3] });
      else if (d.crease) ln([[x + inner * w * 0.3, y - h * 1.28], [x + outer * w * 0.2, y - h * 1.34], [x + outer * w * 0.85, y - h * 1.05]], W.fine * 0.9, { taper: [0.4, 0.4], op: 0.85 });
    }
    // lower lid for smiles
    if (md.low) ln(I.arc(x, y + h * 0.18, w * 0.85, h * 0.9, Math.PI * 0.25, Math.PI * 0.75, 6), W.fine, { taper: [0.3, 0.3] });
    // lashes: flicks at the outer upper corner
    if (d.lashes) for (let q = 0; q < d.lashes; q++) {
      const bx = x + outer * w * (0.95 - q * 0.22), by = (lidT > 0.02 ? lidY(x + outer * w * (0.95 - q * 0.22)) : y - h * (0.35 + q * 0.4));
      ln([[bx, by], [bx + outer * R * 0.075, by - R * 0.055]], W.feat * 0.9, { taper: [0.05, 0.8] });
    }
    // bags and age
    const bags = clamp(d.bags + (md.bags || 0) * 0.5, 0, 1.2);
    if (bags > 0.15) {
      const bc = mixC(skin, INK, 0.55);
      ln(I.arc(x + outer * w * 0.2, y + h * 0.35, w * 0.7, h * 0.95, Math.PI * 0.25, Math.PI * 0.72, 6), W.fine, { color: bc, taper: [0.35, 0.35], op: 0.55 + 0.35 * Math.min(1, bags) });
      if (bags > 0.75) ln(I.arc(x + outer * w * 0.3, y + h * 0.62, w * 0.5, h * 0.9, Math.PI * 0.3, Math.PI * 0.65, 5), W.fine * 0.8, { color: bc, taper: [0.3, 0.3], op: 0.5 });
    }
    if (d.age > 0.5 && e.near && !md.cheek) {
      const bx = x + outer * (w + R * 0.07), by = y + h * 0.1;
      [-0.35, 0, 0.35].forEach((a) => ln([[bx, by + a * h * 0.35], [bx + outer * R * 0.08, by + a * h * 0.35 + a * R * 0.06]], W.fine * 0.8, { taper: [0.2, 0.6], op: 0.75 }));
    }
    if (md.tears) tearDrop(c, x + outer * w * 0.2, y + h * 0.9, e.near);
  });
}
function tearDrop(c, x, y, near) {
  const { R, W } = c;
  const s = R * 0.07;
  // wet line along the lower lid + a stream down the cheek ending in a drop
  const st = [[x, y], [x - c.side * s * 0.3, y + s * 2.2], [x - c.side * s * 0.1, y + s * 4.2]];
  if (near) ln(st, W.feat * 1.4, { color: '#9fd3ee', taper: [0.1, 0.1], wob: 0.1 });
  const dx = x - c.side * s * (near ? 0.1 : 0), dy = y + s * (near ? 4.6 : 1.4);
  const drop = [[dx, dy - s * 1.3], [dx + s * 0.6, dy], [dx + s * 0.45, dy + s * 0.55], [dx, dy + s * 0.75], [dx - s * 0.45, dy + s * 0.55], [dx - s * 0.6, dy]];
  I.fill(drop, '#bfe6f7', { wob: 0 });
  I.ink(drop, W.fine, { closed: true, wob: 0, color: '#2a6a9a' });
  I.fill(I.ell(dx - s * 0.2, dy + s * 0.05, s * 0.14, s * 0.2, 6), '#ffffff', { wob: 0 });
}
// brows are solid ink shapes (a key acting tool in ZP): shape by design, pose by mood
function drawBrows(c) {
  const { d, M, R, P, E, md, W, side } = c;
  if (!d.brow) return;
  const light = lum(d.hair) > 0.62 && (d.age > 0.4 || d.browCol);
  const col = d.browCol || (light ? mixC(d.hair, '#8a8478', 0.3) : lum(d.hair) < 0.25 ? INK : mixC(d.hair, INK, 0.45));
  const bw = (d.browW ?? d.browThick) * (M.kid ? 0.85 : 1) * (1 + 0.45 * c.ex);
  const B0 = md.brow || {}, xk = 1 + 0.9 * c.ex;
  const B = { inner: (B0.inner || 0) * xk, all: (B0.all || 0) * xk, arch: (B0.arch || 0) * xk, asym: B0.asym };
  const hooded = d.eyeStyle === 'hooded';
  E.list.forEach((e, ei) => {
    const [x, y0] = P(e.x, E.y);
    const w = e.w * R * (M.kid ? 1.12 : 1.25), h = e.h * R;
    const inner = e.near ? side : -side;
    const base = y0 - h * (M.kid ? 1 : 0.9) - R * (M.kid ? 0.13 : hooded ? 0.07 : 0.085);
    const T = W.brow * 0.78 * bw;
    const asym = B.asym && ei === 1 ? -0.07 : 0;
    const N = 9, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N; // 0 inner .. 1 outer
      let yy;
      switch (d.browShape) {
        case 'flat': yy = -0.025 * Math.sin(Math.PI * u); break;
        case 'angled': yy = u < 0.62 ? -0.09 * (u / 0.62) : -0.09 + 0.07 * ((u - 0.62) / 0.38); break;
        case 'arch': yy = -0.085 * Math.sin(Math.PI * Math.pow(u, 0.75)); break;
        case 'bushy': yy = -0.05 * Math.sin(Math.PI * u) + 0.05 * u * u * u; break;
        default: yy = -0.055 * Math.sin(Math.PI * u);
      }
      yy -= (B.arch || 0) * Math.sin(Math.PI * u);
      yy += (B.inner || 0) * Math.pow(1 - u, 1.6) + (B.all || 0) + asym;
      const xx = x + inner * w * (0.85 - 1.95 * u);
      const th = T * (d.browShape === 'flat' || d.browShape === 'angled' ? 1.05 - 0.4 * u : d.browShape === 'bushy' ? 1.15 - 0.25 * u : 0.55 + 0.65 * Math.sin(Math.PI * (0.15 + 0.7 * u)) - 0.25 * u);
      const jag = d.browShape === 'bushy' && i % 2 ? T * 0.55 : 0;
      top.push([xx, base + yy * R - th * 0.55 - jag]);
      bot.push([xx, base + yy * R + th * 0.45]);
    }
    const pts = top.concat(bot.reverse());
    I.fill(pts, col, { wob: 0.1, lin: d.browShape === 'bushy' });
    if (light) I.ink(pts, W.fine * 0.8, { closed: true, wob: 0.1, color: INK, lin: d.browShape === 'bushy', op: 0.8 });
  });
}

// ---- nose ---------------------------------------------------------------------------------------
function noseInfo(c) {
  const { M, Sm, side, edgeAt, midEff, fy, S } = c;
  const yt = M.yt + fy * 0.8;
  const tip = midEff(M.yt) * Sm;
  const onC = Math.abs(S) > 0.25 && side * tip >= side * edgeAt(M.yt, side) - 0.09;
  return { tip, yt, onC };
}
function drawNose(c) {
  const { d, M, R, P, W, side, ay } = c;
  const n = noseInfo(c);
  const [tx, ty] = P(n.tip, n.yt);
  const t = d.noseType;
  const sz = R * (0.36 + M.nl * 1.1) * (M.kid ? 0.85 : 1);
  const wide = t === 'broad' ? 1.4 : t === 'bulbous' ? 1.25 : t === 'button' || t === 'small' ? 0.8 : 1;
  const adult = !M.kid;
  if (adult && ay >= 13 && ay <= 64) {
    // ZP 3/4 nose, drawn inside the face: a bridge line from between the eyes (a 7 / L), round the tip,
    // back under it into the nostril hook, and one flat shadow shape under the nose
    const E = c.E, far = E.list.find((e) => !e.near), near = E.list[0];
    const sx = far ? (far.x - side * far.w + near.x + side * near.w) / 2 + side * 0.02 : near.x + side * (near.w + 0.08);
    const [bx, by] = P(sx, E.y + E.eh * 0.35);
    const len = t === 'button' || t === 'small' ? 0.55 : 1;
    const q = (u, v) => [tx - side * u * sz, ty + v * sz];
    const b0 = [lerp(q(0.1, -0.1)[0], bx, len), lerp(q(0.1, -0.1)[1], by, len)];
    const hook = t === 'hook' ? 0.05 : 0;
    I.clip(c.outlineD, () => I.fill([q(0.34 * wide, 0.12), q(0.04, 0.12), q(0.02, 0.18), q(0.2, 0.27), q(0.36 * wide, 0.21)], c.skinSh, { wob: 0.05 }));
    ln([b0, [lerp(b0[0], q(0.06, -0.12)[0], 0.55) + side * R * (0.012 + hook), lerp(b0[1], q(0.06, -0.12)[1], 0.55)], q(0.02, -0.08 + hook), q(-0.02, 0.02 + hook), q(0.06, 0.1), q(0.16, 0.12)], W.feat, { taper: [0.55, 0.1] });
    ln([q(0.18 * wide + 0.08, 0.12), q(0.3 * wide + 0.02, 0.07), q(0.32 * wide, -0.02), q(0.24 * wide, -0.06)], W.feat * 0.9, { taper: [0.2, 0.45] });
    return;
  }
  if (n.onC) {
    // tip in the silhouette: nostril wing curl behind the tip + a dark nostril
    const wx = tx - side * sz * (0.3 + 0.06 * wide), q = (u, v) => [wx - side * u * sz * wide, ty + v * sz];
    ln([q(-0.1, -0.13), q(0.06, -0.08), q(0.09, 0.03), q(0.0, 0.1), q(-0.1, 0.09)], W.feat * 0.9, { taper: [0.35, 0.25] });
    if (adult) I.fill(I.ell(tx - side * sz * 0.2, ty + sz * 0.05, sz * 0.05 * wide, sz * 0.025, 8), INK, { wob: 0 });
    return;
  }
  if (ay < 12) {
    const x = tx;
    if ((t === 'button' || t === 'small') && !(d.glasses && adult)) {
      ln([[x - sz * 0.1, ty], [x - sz * 0.02, ty + sz * 0.08], [x + sz * 0.1, ty + sz * 0.02]], W.feat * 0.85, { taper: [0.4, 0.4] });
      ln([[x + sz * 0.07, ty - sz * 0.22], [x + sz * 0.1, ty - sz * 0.05]], W.fine, { taper: [0.5, 0.3], op: 0.7 });
      return;
    }
    // J on the shadow side (bridge down to the tip), small wing curls, nostril ticks for broad noses
    const ww = sz * 0.2 * wide;
    // glasses always rest on a visible bridge
    if ((t !== 'broad' && t !== 'bulbous') || d.glasses) ln([[x + sz * 0.08, ty - sz * 0.6], [x + sz * 0.11, ty - sz * 0.1], [x + sz * 0.06, ty + sz * 0.1], [x - sz * 0.06, ty + sz * 0.12]], W.feat * 0.85, { taper: [0.5, 0.3] });
    else ln([[x - ww * 0.4, ty + sz * 0.12], [x, ty + sz * 0.15], [x + ww * 0.4, ty + sz * 0.12]], W.feat * 0.85, { taper: [0.3, 0.3] });
    [-1, 1].forEach((sg) => ln([[x + sg * ww * 0.65, ty - sz * 0.08], [x + sg * ww * 1.05, ty + sz * 0.02], [x + sg * ww * 0.8, ty + sz * 0.11]], W.feat * 0.8, { taper: [0.4, 0.3] }));
    if (t === 'broad' || t === 'bulbous') [-1, 1].forEach((sg) => I.fill(I.ell(x + sg * ww * 0.45, ty + sz * 0.07, sz * 0.045 * wide, sz * 0.025, 8), INK, { wob: 0 }));
    return;
  }
  // part-turned: bridge line down the near side of the nose, curling round the tip into the wing
  const bx = tx - side * sz * 0.03;
  if (t !== 'button' && t !== 'small' && adult) ln([[bx - side * sz * 0.12, ty - sz * 0.75], [bx - side * sz * 0.03, ty - sz * 0.3], [bx, ty - sz * 0.15]], W.feat * 0.85, { taper: [0.6, 0.2] });
  ln([[bx - side * sz * 0.02, ty - sz * 0.2], [bx + side * sz * 0.05, ty - sz * 0.02], [bx + side * sz * 0.02, ty + sz * 0.1], [bx - side * sz * 0.1, ty + sz * 0.12]], W.feat * 0.9, { taper: [0.4, 0.2] });
  const wx = bx - side * sz * 0.2 * wide;
  ln([[bx - side * sz * 0.08, ty - sz * 0.02], [wx - side * sz * 0.06, ty + sz * 0.02], [wx, ty + sz * 0.12], [bx - side * sz * 0.1, ty + sz * 0.13]], W.feat * 0.85, { taper: [0.3, 0.2] });
}
function midEff0(c, y) { return c.midEff(y) * c.Sm; }

// ---- mouth --------------------------------------------------------------------------------------
function mouthPos(c) {
  const { M, R, side, Sm, Sf, midEff, fy, E, d } = c;
  const u = E.u;
  const ym = M.ym + fy * 0.7;
  const xm = Math.abs(c.S) > 0.5 ? midEff(M.ym) * Sm : midEff(M.ym) * Sf;
  const mw = (M.kid ? 0.17 : 0.2) * (1 - 0.3 * u) * (1 + (d.mouthW || 0)) * (1 + 0.35 * (c.ex || 0));
  // 3/4: the front end of the mouth sits just inside the lip contour
  const front = midEff(M.ym) * Sm;
  const mx = lerp(xm - side * 0.03, front - side * (mw * 1.08 + 0.05), u);
  return { x: mx, y: ym, w: mw, R };
}
function drawMouth(c) {
  const { d, M, R, P, W, side, o, md, skin } = c;
  const m = mouthPos(c);
  const [x, y] = P(m.x, m.y), w = m.w * R;
  const f = side; // +f = toward the front of the face
  const Q = (u, v) => [x + f * u * w, y + v * R];
  const kind = o.mouth || md.mouth || 'flat';
  const lw = W.feat;
  const dark = '#4a1620', tongue = '#d8676f';
  const lipC = d.lipCol || mixC(skin, '#8a2a2a', lum(skin) < 0.45 ? 0.25 : 0.3);
  const L = d.lips || 0;
  const open = (pts, teethTop, teethBot, tng = 0.55) => {
    I.clip(c.outlineD, () => {
      I.fill(pts, dark, { wob: 0.08 });
      I.clipPoly(pts, () => {
        const ys = pts.map((p) => p[1]), top = Math.min(...ys), bot = Math.max(...ys), hgt = bot - top;
        if (teethTop) I.fill([[x - w * 3, top - 5], [x + w * 3, top - 5], [x + w * 3, top + hgt * teethTop], [x - w * 3, top + hgt * teethTop * 0.85]], '#ffffff', { lin: true, wob: 0 });
        if (teethBot) I.fill([[x - w * 3, bot + 5], [x + w * 3, bot + 5], [x + w * 3, bot - hgt * teethBot], [x - w * 3, bot - hgt * teethBot * 0.9]], '#f4f0ea', { lin: true, wob: 0 });
        if (tng) I.fill(I.ell(x + f * w * 0.15, bot + hgt * 0.05, w * 0.62, hgt * tng * 0.55, 12), tongue, { wob: 0 });
      });
      I.ink(pts, lw, { closed: true, wob: 0.08 });
    });
  };
  const cheekPush = () => {
    // smile crease: from the nose wing round the near mouth corner
    const n = noseInfo(c);
    const [nx, ny] = P(n.tip - side * (0.2 + 0.12 * (1 - c.E.u)), n.yt + 0.04);
    const [cx0, cy0] = Q(-1.42, -0.1);
    ln([[nx, ny], [(nx + cx0) / 2 - f * R * 0.06, (ny + cy0) / 2], [cx0, cy0 + R * 0.05]], W.fine, { taper: [0.25, 0.4], op: 0.9 });
  };
  const lowerLip = (v = 0.075, s = 1) => {
    if (L >= 0.7) {
      const lip = [Q(-0.7 * s, v - 0.04), Q(0, v - 0.035), Q(0.75 * s, v - 0.045), Q(0.55 * s, v + 0.03), Q(0, v + 0.05), Q(-0.5 * s, v + 0.025)];
      I.fill(lip, lipC, { wob: 0.05 });
      ln([Q(-0.45 * s, v + 0.045), Q(0.05, v + 0.065), Q(0.45 * s, v + 0.045)], W.fine, { taper: [0.3, 0.3] });
    } else if (L >= 0.3) ln([Q(-0.35 * s, v), Q(0.05, v + 0.018), Q(0.4 * s, v)], W.fine, { taper: [0.35, 0.35], op: 0.85 });
  };
  switch (kind) {
    case 'flat':
      lowerLip();
      ln([Q(-1, 0.005), Q(0, 0.012), Q(0.95, -0.005)], lw, { taper: [0.3, 0.25] });
      ln([Q(-1.08, -0.03), Q(-0.98, 0.03)], W.fine, { taper: [0.1, 0.1] });
      break;
    case 'smile':
      lowerLip(0.085, 0.9);
      ln([Q(-1.1, -0.08), Q(-0.4, 0.04), Q(0.4, 0.05), Q(1, -0.03)], lw, { taper: [0.25, 0.25] });
      ln([Q(-1.17, -0.11), Q(-1.02, -0.03)], W.fine, { taper: [0.1, 0.2] });
      if (!M.kid && R > 45 && c.ay < 12) cheekPush();
      break;
    case 'smirk':
      ln([Q(-0.9, 0.03), Q(0.1, 0.03), Q(0.95, -0.07)], lw, { taper: [0.3, 0.2] });
      ln([Q(0.9, -0.1), Q(1.05, -0.02)], W.fine);
      break;
    case 'frown':
      lowerLip(0.06);
      ln([Q(-1, 0.07), Q(-0.3, -0.015), Q(0.4, -0.02), Q(1, 0.06)], lw, { taper: [0.25, 0.25] });
      break;
    case 'set':
      // determined: a firm line, corners pulled down, chin muscle tick
      ln([Q(-1.05, 0.045), Q(-0.7, 0.0), Q(0.5, -0.005), Q(0.95, 0.03)], lw * 1.1, { taper: [0.2, 0.2] });
      ln([Q(-0.3, 0.12), Q(0.25, 0.125)], W.fine, { taper: [0.3, 0.3], op: 0.8 });
      break;
    case 'wobble':
      ln([Q(-1, 0.035), Q(-0.5, -0.015), Q(0, 0.025), Q(0.5, -0.015), Q(1, 0.02)], lw, { taper: [0.2, 0.2] });
      break;
    case 'droop':
      ln([Q(-0.8, 0.02), Q(0, 0.035), Q(0.7, 0.01)], lw, { taper: [0.3, 0.3] });
      ln([Q(-0.3, 0.09), Q(0.2, 0.095)], W.fine, { taper: [0.3, 0.3], op: 0.7 });
      break;
    case 'o':
      open(I.ell(x + f * w * 0.15, y + R * 0.045, w * 0.42, R * 0.1, 14), 0, 0, 0.5);
      break;
    case 'gasp':
      open(I.ell(x + f * w * 0.1, y + R * 0.07, w * 0.58, R * 0.15, 16), 0.22, 0, 0.5);
      break;
    case 'laugh': case 'grin': case 'open':
      open([Q(-1.25, -0.07), Q(-0.3, -0.03), Q(1.05, -0.09), Q(0.9, 0.08), Q(0.2, 0.22), Q(-0.7, 0.15)], 0.3, 0, 0.6);
      ln([Q(-1.34, -0.11), Q(-1.2, -0.02)], W.fine);
      if (!M.kid || kind === 'laugh') cheekPush();
      break;
    case 'cry':
      open([Q(-1.15, 0.06), Q(-0.4, -0.04), Q(0.5, -0.05), Q(1.0, 0.05), Q(0.6, 0.17), Q(-0.6, 0.16)], 0.22, 0, 0.55);
      break;
    case 'grit': case 'grimace': {
      const g = kind === 'grimace';
      const pts = g ? [Q(-1.35, 0.02), Q(-0.6, -0.07), Q(0.6, -0.08), Q(1.2, 0.0), Q(0.7, 0.1), Q(-0.7, 0.11)] : [Q(-1.1, -0.05), Q(1.0, -0.07), Q(0.95, 0.07), Q(-1.0, 0.08)];
      I.clip(c.outlineD, () => {
        I.fill(pts, '#ffffff', { lin: !g, wob: 0 });
        I.clipPoly(pts, () => ln([Q(-1.4, 0.015), Q(0, 0.005), Q(1.3, 0.005)], W.fine, { taper: [0, 0] }));
        I.clipPoly(pts, () => [-0.7, -0.2, 0.3, 0.75].forEach((u) => ln([Q(u, -0.1), Q(u + 0.02, 0.12)], W.fine * 0.8, { taper: [0, 0] })));
        I.ink(pts, lw, { closed: true, lin: !g, wob: 0.08 });
      });
      if (g) { ln([Q(-1.45, 0.0), Q(-1.55, 0.09)], W.fine); ln([Q(1.25, -0.01), Q(1.3, 0.08)], W.fine); }
      break;
    }
    default: ln([Q(-1, 0.005), Q(0.95, -0.005)], lw);
  }
}

// ---- age, blush, freckles ------------------------------------------------------------------------
function drawAge(c) {
  const { d, M, P, W, side, E, md } = c;
  const n = noseInfo(c), m = mouthPos(c);
  const e = E.list[0];
  if (d.cheek > 0.55 && d.age >= 0.3) // cheekbone line under the near eye
    ln([P(e.x - side * e.w * 0.2, E.y + E.eh + 0.2), P(e.x - side * (e.w + 0.05), E.y + E.eh + 0.26), P(e.x - side * (e.w + 0.12), E.y + E.eh + 0.4)], W.fine * 0.85, { taper: [0.3, 0.4], op: 0.55 });
  if (d.age < 0.3 || md.cheek) return;
  // nasolabial fold on the near side
  const nx = n.tip - side * (0.26 + 0.1 * (1 - E.u)), ny = n.yt + 0.03;
  const fk = clamp((d.age - 0.25) / 0.4, 0.35, 1); // young adults: only the upper part of the fold
  const fe = [m.x - side * (m.w + 0.08), m.y + 0.03];
  ln([P(nx, ny), P(lerp(nx, fe[0], fk * 0.5) - side * 0.05 * fk, lerp(ny, fe[1], fk * 0.5)), P(lerp(nx, fe[0], fk), lerp(ny, fe[1], fk))], W.fine, { taper: [0.2, 0.5], op: 0.8 });
  if (M.old > 0.3 && !d.hat && !d.fringeDrop) {
    [0.2, 0.3].forEach((dy, i) => { const y = M.yb - dy; const x0 = e.x - 0.1, x1 = e.x + side * 0.45; ln([P(x0, y + 0.02), P((x0 + x1) / 2, y - 0.01), P(x1, y + 0.015)], W.fine * 0.85, { taper: [0.35, 0.35], op: 0.7 - i * 0.15 }); });
  }
  // marionette / jowl crease
  if (M.old > 0.4 || d.chin === 'jowly') { const yy = m.y + 0.12; ln([P(m.x - side * (m.w + 0.1), yy - 0.06), P(m.x - side * (m.w + 0.12), yy + 0.06), P(m.x - side * (m.w + 0.06), yy + 0.14)], W.fine, { taper: [0.3, 0.3], op: 0.7 }); }
}
function drawBlush(c) {
  const { d, M, R, P, W, side, E, S } = c;
  const bk = c.md.blushK || 1;
  const col = mixC(d.skin, '#d0302a', (lum(d.skin) < 0.45 ? 0.35 : 0.5) * (bk > 1 ? 1.4 : 1));
  E.list.forEach((e) => {
    if (!e.near && Math.abs(S) > 0.6) return;
    const cx = e.x + (e.near ? -side : side) * e.w * 0.3, cy = E.y + (M.kid ? 0.36 : 0.32) + E.eh * 0.3;
    if (bk > 1 && c.ex > 0.3) { const [bx, by] = P(cx, cy); I.fill(I.ell(bx, by, e.w * R * 0.9, R * 0.08, 12), col, { wob: 0, op: 0.55 }); return; }
    const nq = bk > 1 ? 5 : 3;
    for (let q = 0; q < nq; q++) {
      const x = cx - e.w * 0.6 * (bk > 1 ? 1.4 : 1) + q * e.w * 0.48;
      ln([P(x, cy + 0.06), P(x + 0.06, cy - 0.05)], W.fine, { color: col, taper: [0.2, 0.2] });
    }
  });
  void R;
}
function sweatDrop(c) {
  const { R, W, P, M, E, side } = c;
  const far = E.list.find((e) => !e.near) || E.list[0];
  const [x, y] = P(far.x + side * (far.w + 0.12), E.y - E.eh - 0.12);
  const s = R * 0.09 * (1 + 0.6 * c.ex);
  const dr = [[x, y - s * 1.3], [x + s * 0.6, y], [x + s * 0.45, y + s * 0.55], [x, y + s * 0.75], [x - s * 0.45, y + s * 0.55], [x - s * 0.6, y]];
  I.fill(dr, '#bfe6f7', { wob: 0 });
  tt(dr, W.fine, { closed: true, color: '#2a6a9a', center: [x, y] });
  void M;
}
function drawFreckles(c) {
  const { d, M, R, P, side, E, S } = c;
  const col = mixC(d.skin, '#9a3a14', 0.62);
  let k = 0;
  E.list.forEach((e) => {
    if (!e.near && Math.abs(S) > 0.7) return;
    const cx = e.x + (e.near ? -side : side) * e.w * 0.1, cy = E.y + E.eh + (M.kid ? 0.14 : 0.12);
    const nn = Math.round(d.freckles / 2);
    for (let q = 0; q < nn; q++) {
      const a = q * 2.4 + (e.near ? 0 : 1), r = 0.05 + 0.13 * Math.sqrt((q + 0.5) / nn);
      const [x, y] = P(cx + Math.cos(a) * r * (e.near ? 1 : 0.7), cy + Math.sin(a) * r * 0.5);
      I.fill(I.ell(x, y, R * 0.026, R * 0.022, 6), col, { wob: 0 }); k++;
    }
  });
}

// ---- glasses: frames with thickness, glare, eyes visible through ---------------------------------
function drawGlasses(c, ears) {
  const { d, R, P, W, side, E, ay } = c;
  const g = d.glasses;
  const ft = R * 0.05 * (d.glassesW || 1);
  const sq = d.glassesShape === 'square' ? 0.6 : d.glassesShape === 'oval' ? 0.1 : 0;
  const lensPts = (l, grow) => {
    const pts = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2; let cx = Math.cos(a), sy = Math.sin(a);
      if (sq) [cx, sy] = sqz(cx, sy, sq);
      pts.push([l.x + cx * (l.rx + grow), l.y + sy * (l.ry + grow)]);
    }
    return pts;
  };
  const lens = E.list.map((e) => {
    const [x, y] = P(e.x, E.y);
    const rx = (e.w + 0.085) * R, ry = Math.max((E.eh * 0.9 + 0.07) * R, (E.ew + 0.085) * R * (d.glassesShape === 'oval' ? 0.72 : 0.95));
    const prof = ay > 70;
    return { x: x + (prof ? side * rx * 0.1 : 0), y: y + R * 0.01, rx: prof ? rx * 0.45 : rx, ry, near: e.near };
  });
  lens.forEach((l) => {
    const inner = lensPts(l, 0), outer = lensPts(l, ft);
    I.fill(inner, '#ffffff', { wob: 0, op: 0.1 });
    // glare: two parallel diagonal strokes in the upper corner
    I.clipPoly(inner, () => {
      const gx = l.x - l.rx * 0.35, gy = l.y - l.ry * 0.35;
      ln([[gx - l.rx * 0.28, gy + l.ry * 0.28], [gx + l.rx * 0.2, gy - l.ry * 0.32]], W.feat * 1.2, { color: '#ffffff', taper: [0.2, 0.2], wob: 0, op: 0.85 });
      ln([[gx + l.rx * 0.05, gy + l.ry * 0.4], [gx + l.rx * 0.38, gy - l.ry * 0.02]], W.fine, { color: '#ffffff', taper: [0.2, 0.2], wob: 0, op: 0.75 });
    });
    const ring = 'M' + outer.map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L') + 'Z M' + inner.slice().reverse().map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L') + 'Z';
    I.emit(`<path fill-rule="evenodd" d="${ring}" fill="${g}"/>`);
    I.ink(outer, W.fine * 0.75, { closed: true, wob: 0.05, vary: 0.1 });
    I.ink(inner, W.fine * 0.6, { closed: true, wob: 0.05, vary: 0.1 });
  });
  if (lens.length === 2) {
    const [a, b] = lens[0].x < lens[1].x ? lens : [lens[1], lens[0]];
    const br = [[a.x + a.rx + ft * 0.3, a.y - a.ry * 0.2], [(a.x + a.rx + b.x - b.rx) / 2, Math.min(a.y, b.y) - a.ry * 0.36], [b.x - b.rx - ft * 0.3, b.y - b.ry * 0.2]];
    ln(br, ft * 1.25, { color: INK, taper: [0, 0], wob: 0.03 });
    ln(br, ft * 0.6, { color: g, taper: [0, 0], wob: 0 });
  }
  const near = lens.find((l) => l.near);
  const ear = ears.find((e) => !e.behind) || null;
  const arm = (p0, p1) => { ln([p0, p1], ft * 1.3, { color: INK, taper: [0, 0.2], wob: 0.03 }); ln([p0, p1], ft * 0.65, { color: g, taper: [0, 0.3], wob: 0 }); };
  if (near && ay > 18) {
    const sx = near.x - side * (near.rx + ft), sy = near.y - near.ry * 0.25;
    const ex = ear ? ear.x + ear.fdir * R * 0.06 : sx - side * R * 0.6, ey = ear ? ear.y - R * 0.2 : sy;
    arm([sx, sy], [ex, ey]);
  } else if (near && ay <= 18) {
    lens.forEach((l) => { const dir = Math.sign(l.x - c.X) || 1; arm([l.x + dir * (l.rx + ft * 0.5), l.y - l.ry * 0.25], [l.x + dir * (l.rx + R * 0.14), l.y - l.ry * 0.3]); });
  }
}
function sqz(cx, sy, k) {
  const n = 2 + k * 3, e = 2 / n;
  return [Math.sign(cx) * Math.pow(Math.abs(cx), e), Math.sign(sy) * Math.pow(Math.abs(sy), e)];
}

function drawMoustache(c) {
  const { R, P, W, side, edgeAt, E } = c;
  const d = { ...c.d, moustache: c.d.moustache || c.d.beard };
  const n = noseInfo(c), m = mouthPos(c);
  const f = side, u0 = E.u;
  const w = m.w * (1.5 - 0.15 * u0);
  const cx = m.x + f * m.w * 0.15 * u0;
  const mk = c.o.mouth || (c.md && c.md.mouth) || 'flat';
  const openM = ['laugh', 'grin', 'open', 'o', 'gasp', 'cry', 'grit', 'grimace'].includes(mk);
  const yTop = n.yt + 0.075, yBot = m.y + (openM ? -0.05 : 0.01);
  const X0 = (u, y) => { let x = cx + f * u * w; const lo = edgeAt(y, -1) - 0.015, hi = edgeAt(y, 1) + 0.015; return P(clamp(x, lo, hi), y); };
  const pts = [];
  // arched top from tip to tip, tapering to points that droop past the mouth corners
  const th = Math.max(0.06, yBot - yTop);
  pts.push(X0(-1.18, yBot + 0.07));
  for (let i = 0; i <= 8; i++) { const u = -0.95 + (i / 8) * 1.9; pts.push(X0(u, yTop + u * u * th * 0.55)); }
  pts.push(X0(1.15, yBot + 0.06));
  // bottom edge: a soft droop with two shallow notches (hair, not a row of teeth)
  for (let i = 1; i < 12; i++) { const u = 0.95 - (i / 12) * 1.9; pts.push(X0(u, yBot + 0.012 + 0.035 * u * u - 0.02 * Math.exp(-(((Math.abs(u) - 0.35) / 0.08) ** 2)))); }
  const light = lum(d.moustache) > 0.6;
  const sh = light ? mixC(d.moustache, '#7c8aa0', 0.35) : '#120e11';
  celFill(pts, d.moustache, sh, R * 0.03 * f, -R * 0.04, { w: W.feat });
  // strand notches: short strokes up from the lower edge, fanning out from the middle
  [-0.62, -0.2, 0.25, 0.65].forEach((u) => { const [x, y] = X0(u, yBot + 0.012 + 0.035 * u * u); ln([[x, y], [x - f * u * R * 0.03, y - R * th * 0.45]], W.fine * 0.8, { color: light ? mixC(d.moustache, '#4a5060', 0.55) : '#000000', taper: [0.1, 0.8], op: 0.85 }); });
  // the mouth corner shows under the moustache: upturned for smiles, level otherwise
  const smiley = ['smile', 'laugh', 'grin', 'smirk'].includes(mk) || (c.md && c.md.cheek);
  if (!openM) {
    // corners emerge past the moustache tips (both sides when the far one is on the face), with a lip
    const a0 = X0(-1.0, yBot + 0.09), a1 = X0(-1.3, yBot + (smiley ? 0.05 : 0.09)), a2 = X0(-1.48, yBot + (smiley ? -0.02 : 0.1));
    const cw2 = lum(c.skin) < 0.45 ? W.feat * 1.15 : W.feat;
    ln([a0, a1, a2], cw2, { taper: [0.1, 0.45] });
    if (smiley && E.u < 0.7) { const b0 = X0(1.0, yBot + 0.085), b1 = X0(1.25, yBot + 0.04), b2 = X0(1.38, yBot - 0.02); ln([b0, b1, b2], cw2 * 0.9, { taper: [0.1, 0.45] }); }
    if (smiley) ln([X0(-0.5, yBot + 0.1), X0(0, yBot + 0.115), X0(0.5, yBot + 0.1)], W.fine, { taper: [0.3, 0.3], op: 0.85 });
    if (!smiley) ln([X0(-0.3, yBot + 0.075), X0(0.3, yBot + 0.07)], W.fine, { taper: [0.3, 0.3], op: 0.8 });
  }
}
function drawBeard(c, outline) {
  const { d, M, R, P, W, S, C, side, F } = c;
  // upper boundary: sideburn → cheek → under the mouth, on the visible side
  const pts = [];
  for (let lon = -110; lon <= 110; lon += 10) {
    const a = Math.abs(lon) / 110;
    const y = lerp(M.ym + 0.1, M.ye + 0.28, sstep(0.35, 0.8, a));
    const fc = M.face(y); if (!fc) continue;
    const x3 = Math.sin(lon * D) * fc.a, z3 = fc.z0 + Math.cos(lon * D) * fc.b;
    const vz = -x3 * S + z3 * C; if (vz < -0.05) continue;
    pts.push([c.X + (x3 * C + z3 * S) * R, c.Y + y * R]);
  }
  if (pts.length < 2) return;
  pts.sort((a, b) => a[0] - b[0]);
  const deep = c.Y + R * 4;
  const region = [[pts[0][0] - R * 3, pts[0][1]]].concat(pts, [[pts[pts.length - 1][0] + R * 3, pts[pts.length - 1][1]], [pts[pts.length - 1][0] + R * 3, deep], [pts[0][0] - R * 3, deep]]);
  I.clipPoly(region, () => {
    I.clip(I.poly(outline), () => celFill(outline, d.beard, shadeC(d.beard, 0.25), 7 * c.k * 0.8, -6 * c.k * 0.8, {}));
    tt(outline, W.contour, { closed: true, center: [c.X, c.Y] });
  });
  const inside = pointIn(outline);
  const seg = pts.filter(([x, y]) => inside(x, y));
  if (seg.length > 1) ln(seg, W.feat, { taper: [0.2, 0.2] });
  void side; void F;
}

// ---- hat ----------------------------------------------------------------------------------------
function drawHat(c) {
  const { d, F, W, k, sil } = c;
  const h = d.hat, col = h.color || '#7b6a58';
  if (h.type !== 'cap') return;
  const pts = [];
  for (let q = 0; q < 36; q++) {
    const a = (q / 36) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
    // the cap sits ON the skull: band just outside the skull at y -0.3, a soft crown sloping to the peak
    const band = F(cx * 1.0, -0.3, cz * 1.0 - 0.02);
    const mid = F(cx * 1.01, -0.62, cz * 1.0 + 0.06 * Math.max(0, cz));
    const top = F(cx * 0.78, -1.05 - 0.02 * Math.max(0, -cz) + 0.24 * Math.max(0, cz), cz * 0.88 + 0.18);
    pts.push([band.x, band.y], [mid.x, mid.y], [top.x, top.y]);
  }
  const crown = convexHull(pts);
  const peakC = F(0, -0.34, 1.2);
  const inner = [], outer = [];
  for (let a = -70; a <= 70; a += 10) {
    const tw = 0.07 * Math.sin(a * D) * Math.abs(c.S) * -c.side;
    const q = F(Math.sin(a * D) * 1.0, -0.33 + tw, Math.cos(a * D) * 1.0);
    const r2 = 1.0 + 0.5 * Math.cos(a * D * 1.2);
    const p2 = F(Math.sin(a * D) * r2, -0.33 + 0.16 * Math.cos(a * D) + tw, Math.cos(a * D) * r2);
    inner.push([q.x, q.y]); outer.push([p2.x, p2.y]);
  }
  let brim = inner.concat(outer.reverse());
  if (Math.abs(c.S) > 0.8 && c.C > -0.3) {
    // near profile the peak is seen edge-on: a thin wedge off the front of the crown
    brim = [F(0, -0.42, 0.96), F(0, -0.22, 1.42), F(0, -0.17, 1.4), F(0, -0.27, 0.98)].map((q) => [q.x, q.y]);
  }
  const behind = peakC.z < -0.25;
  // spot-black shadow cast by the peak onto the forehead / hair under it
  if (!sil && !behind && c.C > -0.2) {
    const sb = inner.map(([x, y]) => [x, y]).concat(inner.slice().reverse().map(([x, y]) => [x + c.R * 0.02 * c.side, y + c.R * (0.13 + 0.06 * Math.abs(c.C))]));
    I.clip(c.outlineD, () => I.fill(sb, '#141015', { wob: 0 }));
  }
  const dark = shadeC(col, 0.25);
  if (behind) celFill(brim, dark, shadeC(col, 0.4), 0, 0, { w: W.contour * 0.9 });
  celFill(crown, col, sil ? col : dark, 7 * k * 0.8, -6 * k * 0.8, { w: W.contour });
  if (!behind) celFill(brim, sil ? col : mixC(col, '#000000', 0.1), sil ? col : dark, 0, -4 * k, { w: W.contour * 0.9 });
  if (sil) return;
  const seam = [F(0, -0.6, 0.86), F(0, -0.9, 0.4), F(0, -0.96, -0.2), F(0, -0.66, -0.8)].filter((q) => q.z > -0.1);
  if (seam.length > 1) ln(seam.map((q) => [q.x, q.y]), W.fine, { color: mixC(col, '#000000', 0.5) });
  const bandL = []; for (let a = -80; a <= 80; a += 10) { const q = F(Math.sin(a * D) * 1.07, -0.47, Math.cos(a * D) * 1.07); if (q.z > 0) bandL.push([q.x, q.y]); }
  void bandL;
}
function flower(c, [x, y]) {
  const r = c.R * 0.16, W = c.W;
  for (let q = 0; q < 5; q++) { const a = (q / 5) * Math.PI * 2; const p = I.ell(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, r * 0.75, 10); I.fill(p, '#e8667a', { wob: 0 }); I.ink(p, W.fine, { closed: true, wob: 0 }); }
  const p = I.ell(x, y, r * 0.45, r * 0.45, 8); I.fill(p, '#b9384f', { wob: 0 }); I.ink(p, W.fine, { closed: true, wob: 0 });
}

// ---- back hair: ponytail, pigtails, bun, long, bob ---------------------------------------------
function hairExtras(c) {
  const { d, F, R, X, Y, W, side, S, C, k, sil } = c;
  if (d.hairStyle === 'bald') return;
  const hc = hairColors(d), tie = d.tie || '#d94a4a';
  const shc = sil ? hc.base : hc.sh;
  const lx = 7 * k * 0.8, ly = -6 * k * 0.8;
  const tail = (root, dirx, len, wid) => {
    const [x, y] = [root.x, root.y];
    const pts = [[x - wid * 0.45, y - wid * 0.1], [x + dirx * wid * 0.85, y + len * 0.22], [x + dirx * wid * 1.05, y + len * 0.62], [x + dirx * wid * 0.6, y + len * 0.95], [x + dirx * wid * 0.35, y + len * 0.78], [x + dirx * wid * 0.08, y + len * 0.5], [x - dirx * wid * 0.25, y + len * 0.15]];
    celFill(pts, hc.base, shc, lx, ly, { w: W.hair, inner: () => { if (!sil) I.fill([[x + dirx * wid * 0.2, y + len * 0.12], [x + dirx * wid * 0.55, y + len * 0.3], [x + dirx * wid * 0.45, y + len * 0.55], [x + dirx * wid * 0.3, y + len * 0.3]], hc.hi, { wob: 0.1, op: 0.9 }); } });
    if (hc.strand && !sil) ln([[x + dirx * wid * 0.15, y + len * 0.15], [x + dirx * wid * 0.55, y + len * 0.6], [x + dirx * wid * 0.55, y + len * 0.85]], W.fine, { color: hc.strand });
    const b = I.ell(x, y, wid * 0.3, wid * 0.36, 10);
    celFill(b, sil ? hc.base : tie, sil ? hc.base : shadeC(tie, 0.25), 0, -wid * 0.1, { w: W.feat });
  };
  const st = d.hairStyle;
  if (st === 'ponytail') {
    const r = F(0, 0.1, -1.02);
    const dx = r.x - X; const dirx = Math.abs(dx) > R * 0.2 ? Math.sign(dx) : -side;
    tail(r, dirx, R * 1.1, R * 0.55);
  } else if (st === 'pigtails') {
    [-1, 1].forEach((sd) => { const r = F(sd * 0.95, 0.3, -0.3); if (r.z < 0.6) tail(r, Math.sign(r.x - X) || sd, R * 0.95, R * 0.45); });
  } else if (st === 'bun') {
    const r = F(0, -0.8, -0.74); // high on the back of the crown so it reads in 3/4
    if (d.pin) { ln([[r.x - R * 0.7, r.y + R * 0.3], [r.x + R * 0.7, r.y - R * 0.35]], 5.4 * k, { taper: [0, 0], minW: 1 }); ln([[r.x - R * 0.7, r.y + R * 0.3], [r.x + R * 0.7, r.y - R * 0.35]], 2.6 * k, { color: d.pin, taper: [0, 0], minW: 1 }); }
    const b = I.ell(r.x, r.y, R * 0.44, R * 0.4, 18);
    celFill(b, hc.base, shc, lx * 0.8, ly * 0.8, { w: W.hair, inner: () => { if (!sil) I.fill(I.arc(r.x, r.y, R * 0.28, R * 0.24, Math.PI * 1.1, Math.PI * 1.7, 6).concat(I.arc(r.x, r.y, R * 0.18, R * 0.14, Math.PI * 1.7, Math.PI * 1.1, 6)), hc.hi, { wob: 0.1, op: 0.85 }); } });
    if (hc.strand && !sil) ln(I.arc(r.x, r.y, R * 0.24, R * 0.2, Math.PI * 0.2, Math.PI * 1.0, 6), W.fine, { color: hc.strand });
  } else if (st === 'long' || st === 'bob') {
    // one designed silhouette continuing the hair mass: down the sides, a slight bell, ends curling in,
    // pointed clumps along the bottom; on the side the face turns toward it stops behind the jaw
    const bob = st === 'bob';
    const L = bob ? 1.0 : 2.0;
    const hv = 1.08 + (d.hairVol - 1) * 0.9, bot = 0.84 * hv + 0.04;
    const edge = (y) => {
      const r = Math.sqrt(Math.max(0, 1 - (y / bot) ** 2));
      let z0 = (-0.06 - 0.22 * sstep(-0.3, bot, y)) * d.deep, a = r * d.wide * hv, b = r * d.deep * hv;
      const fr = z0 + b, bk0 = z0 - b, bk = lerp(bk0, Math.max(bk0, -0.66 - (hv - 1)), sstep(0.1, 0.6, y)); z0 = (fr + bk) / 2; b = (fr - bk) / 2;
      const cx = z0 * S, h = Math.hypot(a * C, b * S); return [cx - h, cx + h];
    };
    const y0 = 0.15, [l0, r0] = edge(y0);
    const earX = (F(side, 0.1, -0.1).x - X) / R + side * 0.2;
    const lim = (x, y) => (y > 0.05 && C > -0.2 ? (side > 0 ? Math.min(x, earX) : Math.max(x, earX)) : x);
    const back = S * 0.22 * (bob ? 1 : 1.6);
    const left = [], right = [];
    for (let i = 0; i <= 14; i++) {
      const y = lerp(-0.85, y0, Math.pow(i / 14, 0.8)), [l, r] = edge(y);
      left.push([l, y]); right.push([r, y]);
    }
    const n = 8;
    for (let i = 1; i <= n; i++) {
      const t = i / n, y = lerp(y0, L, t);
      const flare = (bob ? 0.09 : 0.05) * Math.sin(Math.PI * Math.min(1, t * 0.8)) - (bob ? 0.14 : 0.04) * sstep(0.7, 1, t);
      left.push([l0 - flare - back * t, y]); right.push([r0 + flare - back * t, y]);
    }
    // bottom clumps from left to right
    const bl = left[left.length - 1], br = right[right.length - 1];
    const tips = bob ? 5 : 6, bottom = [];
    for (let i = 1; i < tips * 2; i++) {
      const t = i / (tips * 2), x = lerp(bl[0], br[0], t);
      const tip = i % 2 === 1;
      const lean = (0.5 - t) * 0.08; // tips lean toward the middle: ends curling in
      bottom.push([x + (tip ? lean : 0), L + (tip ? 0.06 : -0.1 - 0.04 * Math.sin(Math.PI * t))]);
    }
    const outline = left.concat(bottom, right.reverse()).map(([x, y]) => { const yy = y; return [X + lim(x, yy) * R, Y + yy * R]; });
    celFill(outline, hc.base, shc, lx, ly, {
      w: W.hair, inner: () => {
        if (sil) return;
        // clump lines running down into the tips
        for (let i = 1; i < tips * 2; i += 2) {
          const t = i / (tips * 2), x = lerp(bl[0], br[0], t) + (0.5 - t) * 0.08;
          if (i === 1 || i === tips * 2 - 1) continue;
          const xs = lerp(l0, r0, t) - back * 0.4;
          ln([[X + lim(xs, 0.3) * R, Y + R * (0.3 + (L - 0.3) * 0.35)], [X + lim(lerp(xs, x, 0.6), 0.7) * R, Y + R * (L - 0.25)], [X + lim(x, L) * R, Y + R * (L + 0.02)]], W.fine, { color: hc.strand || shadeC(d.hair, 0.45), taper: [0.6, 0.1] });
        }
      },
    });
  }
}

// superellipse (kept for callers)
function sq(c, s, k) {
  if (!k) return [c, s];
  const n = 2 + k * 2.2, e = 2 / n;
  return [Math.sign(c) * Math.pow(Math.abs(c), e), Math.sign(s) * Math.pow(Math.abs(s), e)];
}
function convexHull(points) {
  const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

// neck size for figure.js: half-width and half-depth in px at scale s (the head's own neck uses these)
function neckInfo(dz, s = 1) {
  const d = design(dz), M = model(d), R = d.R * s, nw = d.neckW || 1;
  return { hw: R * (M.kid ? 0.24 : 0.27) * nw, hd: R * (M.kid ? 0.27 : 0.32) * nw, R, kid: M.kid, chinY: M.cb * R };
}

module.exports = { design, head, proj, convexHull, model, sq, FACES, MOODS, fingerprint, neckInfo };
