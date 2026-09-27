// zp/hand.js — cartoonist's hands: a flat palm with a thenar mass, four separate jointed fingers
// and a thumb, each finger a chain of rounded phalanges drawn as layered "tubes" (ink under skin), so
// a finger that crosses another or the palm gets its own lighter outline while the outside of the
// hand keeps one heavier contour. One flat cel shadow on palm and fingers (light upper-left-front).
//
// hand(x, y, angDeg, s, pose, opts)
//   (x,y) wrist; ang = direction the hand points (deg, 0 = +x); s = palm length px / 10
//   (whole hand wrist→middle fingertip ≈ 19 s; figure scale u*0.030 → ≈ 0.57 head height).
//   pose: see POSES / ALIASES below.
//   opts: skin, flip (mirror: other hand, or seen from the other side), thumbFront (default true;
//         false = seen from the little-finger side: finger stack reversed, thumb behind),
//         object: fn(T, s, A) | 'pen' | 'brush' | 'bar' | 'card' | 'phone' | 'mug' | 'hand'
//         (drawn INSIDE the grip: palm and back fingers behind it, wrapping fingers and thumb in front;
//          T maps hand space → page, A = { c, ang, len, w, tip } anchor of the held thing, hand space),
//         objectColor, objectSkin (for 'hand'), child, old (or age 0..1), wrist (false = no wrist stub),
//         lw (interior line width override), shade (false = no cel), thick (finger width factor).
// Hand space: wrist at origin, fingers toward +u, thumb on the −v side, palm side = +v in the
// 3/4 "side" poses (fingers curl toward +v).
const C = require('./core');
const { I, INK, LW } = C;
const D = Math.PI / 180;

// ---------------------------------------------------------------- colour
function hex2rgb(c) { return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); }
function rgb2hex(r) { return '#' + r.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join(''); }
function localShade(c, k = 0.22) {
  if (!c || c[0] !== '#' || c.length !== 7) return c;
  const [r, g, b] = hex2rgb(c);
  return rgb2hex([r * (1 - k * 0.78), g * (1 - k * 1.0), b * (1 - k * 0.92)]);
}
// skin shadow: a muted, slightly rosy darkening (core shade() over-saturates light skin to orange)
const shadeOf = (c, k) => localShade(c, k);
const LIGHT = C.LIGHT || { lx: 7, ly: -6 };

// old API: a capsule "tube" with an ink edge (used by comics for arms/sleeves)
function tube(pts, w, color, lw = LW.detail) {
  const d = 'M' + pts.map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L');
  I.emit(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${I.n1(w + lw * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  I.emit(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${I.n1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

// ---------------------------------------------------------------- anatomy (hand units, palm = 10)
// index, middle, ring, little: phalanx lengths and outer widths
const FL = [[3.7, 2.4, 1.95], [4.1, 2.7, 2.05], [3.8, 2.5, 1.95], [3.0, 1.95, 1.65]];
const FW = [2.3, 2.38, 2.22, 1.95];
const TAPER = [1, 0.93, 0.86];
const THUMB_L = [3.0, 2.45], THUMB_W = 2.7;
// knuckle (finger base) points: flat view (back or palm to camera) and 3/4 side view
const K_FLAT = [[9.5, -3.05], [10.05, -1.0], [9.85, 1.05], [9.05, 2.95]];
const K_SIDE = [[9.7, -1.9], [10.05, -0.65], [9.8, 0.55], [9.2, 1.6]];
// closed hand seen from the back/thumb side: the knuckle row stands up at the front of the hand
const K_FIST = [[9.4, -2.7], [9.9, -0.95], [9.75, 0.8], [9.2, 2.45]];

// finger spec: absolute direction of the first phalanx, then bends at the two joints (+ = curl toward
// +v / the palm), per-phalanx length factors (foreshortening), z (-1 behind the palm, 1 in front)
const Fg = (a0, b1, b2, z = -1, k = [1, 1, 1]) => ({ a0, b1, b2, z, k });
// a finger folded into the palm: short stub forward, middle phalanx turned back, tip tucked away
const CURL = (a0 = 12, z = 1) => Fg(a0, 150, 50, z, [0.62, 0.78, 0.45]);

// ---------------------------------------------------------------- poses
// view: 'back' (back of the hand to camera: nails, knuckle ticks) | 'palm' (palm creases) | 'side' (3/4)
// pw: palm width factor; thumb: { m: MCP point, a: [dir1, dir2], k: length factors, z }
// order: finger draw order (first = furthest back); hold: object anchor {c, ang, len, w}; objZ
const POSES = {
  relaxed: {
    view: 'side', pw: 0.78, knuck: K_SIDE,
    f: [Fg(4, 26, 20), Fg(7, 28, 22), Fg(10, 31, 24), Fg(14, 34, 26)], order: [3, 2, 1, 0],
    thumb: { base: [1.8, -0.6], m: [5.2, -1.9], a: [14, 30], z: 1 },
    hold: { c: [12, 1.2], ang: 90, len: 10, w: 2.6 },
  },
  open: {
    view: 'palm', pw: 1,
    f: [Fg(-15, 3, 2), Fg(-4, 2, 1), Fg(6, 3, 2), Fg(17, 4, 3)], order: [3, 2, 1, 0],
    thumb: { base: [1.6, -1.2], m: [4.6, -4.2], a: [-52, -40], z: 1 },
    hold: { c: [6.5, 0.2], ang: 0, len: 6, w: 4 },
  },
  wave: {
    view: 'palm', pw: 1,
    f: [Fg(-9, 4, 2), Fg(-2, 3, 2), Fg(5, 4, 2), Fg(12, 5, 4)], order: [3, 2, 1, 0],
    thumb: { base: [1.6, -1.2], m: [4.6, -4.1], a: [-46, -30], z: 1 },
    hold: { c: [6.5, 0.2], ang: 0, len: 6, w: 4 },
  },
  point: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [Fg(-4, 4, 3, 1.5), CURL(14), CURL(18), CURL(22)], order: [3, 2, 1, 0],
    thumb: { base: [1.8, -0.4], m: [5.6, -1.4], a: [40, 78], k: [0.9, 0.75], z: 2 },
    hold: { c: [0, 0], ang: -3, len: 2, w: 1 },
  },
  fist: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [CURL(8), CURL(12), CURL(16), CURL(20)], order: [3, 2, 1, 0],
    thumb: { base: [1.8, -0.4], m: [5.6, -1.5], a: [36, 80], k: [0.92, 0.75], z: 2 },
    hold: { c: [10.6, 0], ang: 90, len: 10, w: 2.2 }, objZ: 0.5,
  },
  grip: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [Fg(16, 138, 40, 1, [0.8, 0.8, 0.5]), Fg(18, 138, 40, 1, [0.8, 0.8, 0.5]), Fg(21, 138, 40, 1, [0.8, 0.8, 0.5]), Fg(24, 138, 40, 1, [0.8, 0.8, 0.5])], order: [3, 2, 1, 0],
    thumb: { base: [1.8, 0], m: [5.6, -1.3], a: [28, 66], k: [0.95, 0.8], z: 2 },
    hold: { c: [10.9, 0], ang: 90, len: 14, w: 2.5 }, objZ: 0.5,
  },
  pinch: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [Fg(-18, 84, 70, 1.5), CURL(16, 1), CURL(20, 1), CURL(24, 1)], order: [3, 2, 1, 0],
    thumb: { base: [1.8, 0], m: [5.6, -1.3], a: [0, -12], k: [1.3, 1.1], z: 2 },
    hold: { c: [12.4, -1.3], ang: 60, len: 3, w: 1 }, objZ: 1.8,
  },
  pen: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    // writing grip: index lies along the pen, middle finger under it, ring/little curled; the pen runs back
    // over the web of the thumb and angles down to the tip just past the index fingertip
    f: [Fg(24, 8, 10, 1.5, [1, 0.95, 0.9]), Fg(44, 46, 30, 0.6, [0.9, 0.85, 0.8]), CURL(30, 0.4), CURL(36, 0.3)], order: [3, 2, 1, 0],
    thumb: { base: [1.8, 0], m: [5.6, -1.3], a: [20, 34], k: [1.1, 1.0], z: 2 },
    hold: { c: [12.6, 0.9], ang: 27, len: 21, w: 1.25, tip: 0.36 }, objZ: 1,
  },
  flat: {
    view: 'back', pw: 1,
    f: [Fg(-5, 2, 1), Fg(-1, 1, 1), Fg(3, 2, 1), Fg(8, 3, 2)], order: [3, 2, 1, 0],
    thumb: { m: [4.4, -4.3], a: [-24, -12], z: 1 },
    hold: { c: [6.5, 0.2], ang: 0, len: 6, w: 4 },
  },
  hold: {
    view: 'side', pw: 0.8, knuck: K_SIDE,
    f: [Fg(58, 58, 40, -1, [0.85, 0.75, 0.75]), Fg(64, 56, 38, -1, [0.85, 0.75, 0.75]), Fg(70, 54, 36, -1, [0.85, 0.75, 0.75]), Fg(76, 52, 34, -1, [0.8, 0.75, 0.75])], order: [3, 2, 1, 0],
    thumb: { base: [1.8, -0.5], m: [5.4, -1.8], a: [8, 4], k: [1.15, 1.05], z: 2 },
    hold: { c: [15.2, -0.6], ang: 8, len: 11, w: 6.6 }, objZ: 1,
  },
  cupped: {
    view: 'side', pw: 0.66, knuck: K_SIDE,
    f: [Fg(-10, -38, -34, 1, [1, 0.9, 0.85]), Fg(-6, -36, -32, 0.8, [1, 0.9, 0.85]), Fg(-2, -34, -30, 0.6, [1, 0.9, 0.85]), Fg(2, -32, -28, 0.4, [0.95, 0.9, 0.85])], order: [3, 2, 1, 0],
    thumb: { base: [1.8, -0.2], m: [5, -1.9], a: [-48, -62], k: [0.95, 0.9], z: 1.5 },
    hold: { c: [9, -3.5], ang: 0, len: 5, w: 3 }, objZ: 0.2,
  },
  fingertip: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [Fg(-16, 8, 6, 1.5), CURL(14), CURL(18), CURL(22)], order: [3, 2, 1, 0],
    thumb: { base: [1.8, -0.4], m: [5.6, -1.4], a: [40, 78], k: [0.9, 0.75], z: 2 },
    hold: { c: [0, 0], ang: -90, len: 3, w: 3 }, atTip: 1.4, objZ: 3,
  },
  clasp: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [Fg(20, 128, 40, 1, [0.9, 0.85, 0.5]), Fg(22, 128, 40, 1, [0.9, 0.85, 0.5]), Fg(25, 128, 40, 1, [0.9, 0.85, 0.5]), Fg(28, 128, 40, 1, [0.9, 0.85, 0.5])], order: [3, 2, 1, 0],
    thumb: { base: [1.8, 0], m: [5.6, -1.3], a: [24, 50], k: [1, 0.9], z: 2 },
    hold: { c: [10.6, 0.4], ang: 96, len: 9, w: 4.5 }, objZ: 0.5, object: 'hand',
  },
  rest: {
    view: 'back', pw: 1,
    f: [Fg(-6, 8, 10, -1, [1, 0.92, 0.8]), Fg(-1, 8, 10, -1, [1, 0.92, 0.8]), Fg(4, 9, 10, -1, [1, 0.92, 0.8]), Fg(10, 10, 12, -1, [1, 0.92, 0.8])], order: [3, 2, 1, 0],
    thumb: { m: [4.2, -4.2], a: [-8, 4], z: 1 },
    hold: { c: [6.5, 0.2], ang: 0, len: 6, w: 4 },
  },
  clutch: {
    view: 'side', pw: 0.82, knuck: K_FIST,
    f: [Fg(26, 92, 50, 1, [0.85, 0.85, 0.75]), Fg(30, 92, 50, 1, [0.85, 0.85, 0.75]), Fg(34, 92, 50, 1, [0.85, 0.85, 0.75]), Fg(38, 92, 50, 1, [0.85, 0.85, 0.75])], order: [3, 2, 1, 0],
    thumb: { base: [1.8, 0], m: [5.6, -1.3], a: [16, 44], k: [1, 0.9], z: 2 },
    hold: { c: [12.5, 1.5], ang: 90, len: 8, w: 3 }, objZ: 0.5,
  },
  reach: {
    view: 'back', pw: 0.92,
    f: [Fg(-12, 10, 8), Fg(-3, 12, 10), Fg(6, 14, 12), Fg(15, 16, 14)], order: [3, 2, 1, 0],
    thumb: { m: [4.5, -4.3], a: [-40, -24], z: 1 },
    hold: { c: [19, 0], ang: 0, len: 4, w: 4 },
  },
};
const ALIASES = {
  'pinch-pen': 'pen', brush: 'pen', write: 'pen', 'hold-flat': 'hold', holdflat: 'hold', phone: 'hold',
  'hand-in-hand': 'clasp', handinhand: 'clasp', resting: 'rest', clutching: 'clutch', reaching: 'reach',
  palm: 'open', stop: 'open', cup: 'cupped', tip: 'fingertip', relax: 'relaxed', hang: 'relaxed',
};
const poseOf = (name) => POSES[name] || POSES[ALIASES[name]] || POSES.relaxed;

// ---------------------------------------------------------------- built-in held objects
function drawObject(kind, T, s, A, o, L) {
  const col = o.objectColor;
  const dir = [Math.cos(A.ang * D), Math.sin(A.ang * D)];
  const at = (t, off = 0) => T([A.c[0] + dir[0] * t - dir[1] * off, A.c[1] + dir[1] * t + dir[0] * off]);
  const tubeObj = (a, b, w, c, lw) => {
    const d = `M${I.n1(a[0])} ${I.n1(a[1])}L${I.n1(b[0])} ${I.n1(b[1])}`;
    I.emit(`<path d="${d}" stroke="${INK}" stroke-width="${I.n1(w + lw * 2)}" stroke-linecap="round" fill="none"/>`);
    I.emit(`<path d="${d}" stroke="${c}" stroke-width="${I.n1(w)}" stroke-linecap="round" fill="none"/>`);
  };
  const ww = A.w * s;
  if (kind === 'pen' || kind === 'brush') {
    // tip end at +len*tip along the axis, handle end at the other
    const tipT = A.len * (A.tip ?? 0.3), backT = -A.len * (1 - (A.tip ?? 0.3));
    const pw = Math.max(1.8, 1.1 * s);
    tubeObj(at(backT), at(tipT - 1.6), pw, col || (kind === 'brush' ? '#b07a48' : '#3a6fb0'), L.i);
    if (kind === 'brush') {
      tubeObj(at(tipT - 2.4), at(tipT - 1.2), pw * 1.25, '#3a3533', L.i);
      C.shape([at(tipT - 1.3, 0.75), at(tipT + 0.2, 0.55), at(tipT + 1.6), at(tipT + 0.2, -0.55), at(tipT - 1.3, -0.75)], '#1e1b1d', { w: L.i, wob: 0 });
    } else {
      C.shape([at(tipT - 1.7, 0.55), at(tipT - 0.2, 0.25), at(tipT + 0.2), at(tipT - 0.2, -0.25), at(tipT - 1.7, -0.55)], '#e8d8b8', { w: L.i, wob: 0 });
    }
  } else if (kind === 'bar' || kind === 'stick') {
    tubeObj(at(-A.len / 2), at(A.len / 2), ww, col || (kind === 'stick' ? '#8a5a32' : '#9aa0a8'), L.c);
  } else if (kind === 'finger') {
    // an adult's finger lying in the grip: rounded tip with a nail at the +axis end
    const fw = A.w * s * 1.15, a0 = at(-A.len * 0.7), a1 = at(A.len * 0.5);
    const sk = o.objectSkin || '#f0c49d';
    tubeObj(a0, a1, fw, sk, L.c);
    const nx = a1[0] - dir[0] * s * 1.2, ny = a1[1] - dir[1] * s * 1.2;
    C.line([[nx - dir[1] * fw * 0.3, ny + dir[0] * fw * 0.3], [nx - dir[0] * fw * 0.35, ny - dir[1] * fw * 0.35], [nx + dir[1] * fw * 0.3, ny - dir[0] * fw * 0.3]], L.i * 0.8, { wob: 0, taper: [0.2, 0.2] });
  } else if (kind === 'mug') {
    // the handle ring sits in the grip; the mug body hangs off the thumb side
    tubeObj(at(-A.len * 0.3), at(A.len * 0.3), ww * 0.55, col || '#e05a5a', L.i);
  } else if (kind === 'card' || kind === 'phone' || kind === 'photo' || kind === 'sandwich') {
    const big = kind === 'sandwich' ? 1.15 : 1;
    const hl = A.len / 2 * big, hw = A.w / 2 * big;
    // a sandwich half: a triangle with a crust edge
    const q = kind === 'sandwich' ? [at(-hl, -hw), at(hl * 0.7, -hw * 1.05), at(hl, -hw * 0.6), at(hl, hw), at(-hl, hw)] : [at(-hl, -hw), at(hl, -hw), at(hl, hw), at(-hl, hw)];
    const c = col || (kind === 'phone' ? '#2a2d33' : kind === 'sandwich' ? '#e8c27a' : '#fbf6ea');
    C.shape(q, c, { w: L.c, wob: 0, lin: true });
    if (kind === 'phone') C.shape([at(-hl + 0.6, -hw + 0.6), at(hl - 0.6, -hw + 0.6), at(hl - 0.6, hw - 0.6), at(-hl + 0.6, hw - 0.6)], '#8fb8d8', { w: 0, wob: 0, lin: true });
    if (kind === 'sandwich') { C.line([at(-hl + 0.4, 0.3), at(hl - 0.3, 0.1)], L.i * 1.8, { color: '#7aa84a', wob: 0.2 }); C.line([at(-hl + 0.4, -hw + 0.6), at(-hl + 0.4, hw - 0.4)], L.i * 1.3, { color: '#b8803a', wob: 0.1 }); }
  } else if (kind === 'hand') {
    // a smaller hand (child's) lying inside the grip, fingers across the palm
    // wrist below the fist (palm side), hand pointing up through it, fingers hooked over the top
    const p0 = at(A.len * 0.72);
    const scr = T([A.c[0] - dir[0], A.c[1] - dir[1]]), o0 = T(A.c);
    const sa = Math.atan2(scr[1] - o0[1], scr[0] - o0[0]) / D;
    hand(p0[0], p0[1], sa, s * 0.62, o.objectPose || 'clutch', { skin: o.objectSkin || '#f4cfae', child: true, wrist: true, shade: o.shade, flip: !o.flip });
  }
}

// ---------------------------------------------------------------- the hand
function hand(x, y, ang, s, pose = 'relaxed', o = {}) {
  const P = poseOf(pose);
  const skin = o.skin || '#f6d2b4';
  const sh = shadeOf(skin, 0.22);
  const flip = o.flip ? -1 : 1;
  const back = o.thumbFront === false && P.view === 'side';
  const age = o.age ?? (o.old ? 0.85 : 0);
  const child = !!o.child;
  const ca = Math.cos(ang * D), sa = Math.sin(ang * D);
  const T = ([u, v]) => [x + (u * ca - v * flip * sa) * s, y + (u * sa + v * flip * ca) * s];
  const n1 = I.n1;
  // pen: interior lines lighter than the outside contour (ratio ≈ 1.6), mild growth with size
  const k = Math.max(0.8, Math.min(1.5, s / 2));
  const px = 19 * s; // hand length in px: level of detail
  const detail = px > 70 ? 2 : px > 46 ? 1 : 0;
  // small hands: a hairline between fingers so they don't turn into black stripes
  const small = Math.max(0, Math.min(1, (70 - px) / 36));
  // small hands keep a clear (≥ 1 px) line between fingers so grips and fists don't fuse into mittens
  const L = { c: o.contour ?? 2.55 * k, i: Math.max(1.0, (o.lw ?? 1.45 * k) * (1 - small) + 1.0 * small) };
  L.c = Math.max(L.c, L.i * 1.4);
  // proportions
  const fl = child ? 0.8 : 1, fwk = (child ? 1.2 : age > 0.5 ? 0.94 : 1) * (o.thick || 1) * (1 + 0.06 * small);
  const pwk = (P.pw ?? 1) * (child ? 1.06 : 1);
  const pl = child ? 0.92 : 1;
  const jit = () => I.R(0.07);

  // ---- geometry in hand space
  const knuck = (P.knuck || K_FLAT).map(([u, v]) => [u * pl, v * (P.knuck ? 1 : pwk)]);
  const fingers = P.f.map((f, i) => {
    const base = [knuck[i][0] - 1.0, knuck[i][1]];
    const dirs = [f.a0, f.a0 + f.b1, f.a0 + f.b1 + f.b2];
    const pts = [base];
    let [u, v] = base;
    dirs.forEach((a, j) => {
      const len = FL[i][j] * fl * (f.k[j] ?? 1) * (j === 0 ? 1.0 : 1);
      const extra = j === 0 ? 1.0 : 0; // the part hidden under the palm edge
      u += Math.cos(a * D) * (len + extra) + jit(); v += Math.sin(a * D) * (len + extra) + jit();
      pts.push([u, v]);
    });
    const w = FW[i] * fwk;
    return { kind: 'finger', i, pts, w: TAPER.map((t) => w * t), z: f.z, bends: [f.b1, f.b2], dirs, merge: f.z > 0 && f.b1 < 100 };
  });
  const th = P.thumb;
  const tm = [th.m[0] * pl, th.m[1] * (P.knuck ? 1 : pwk)];
  const tb = th.base ? [th.base[0] * pl, th.base[1]] : null;
  const tpts = tb ? [tb, tm] : [tm];
  {
    let [u, v] = tm;
    th.a.forEach((a, j) => { const len = THUMB_L[j] * fl * ((th.k || [])[j] ?? 1); u += Math.cos(a * D) * len + jit(); v += Math.sin(a * D) * len + jit(); tpts.push([u, v]); });
  }
  const tw = [THUMB_W * fwk, THUMB_W * fwk * 0.9];
  const thumb = { kind: 'thumb', pts: tpts, w: tb ? [THUMB_W * fwk * 1.3, ...tw] : tw, z: th.z ?? 1, bends: tb ? [0, th.a[1] - th.a[0]] : [th.a[1] - th.a[0]], dirs: th.a, thenar: !!tb };
  // palm outline: wrist, thenar bulge round the thumb's metacarpal, web, knuckle arc, little-finger edge
  const cmc = [1.0 * pl, -1.9 * pwk];
  const md = [tm[0] - cmc[0], tm[1] - cmc[1]], ml = Math.hypot(md[0], md[1]) || 1;
  const nrm = [md[1] / ml, -md[0] / ml]; // outward (thumb side) normal for a hand pointing +u
  const nn = nrm[1] > 0 ? [-nrm[0], -nrm[1]] : nrm;
  const lastK = knuck[3], firstK = knuck[0];
  const palm = [
    [0, -2.75 * pwk],
    [cmc[0] + nn[0] * 1.45, cmc[1] + nn[1] * 1.45],
    [(cmc[0] + tm[0]) / 2 + nn[0] * 1.5, (cmc[1] + tm[1]) / 2 + nn[1] * 1.5],
    [tm[0] + nn[0] * 1.15 + md[0] / ml * 0.5, tm[1] + nn[1] * 1.15 + md[1] / ml * 0.5],
    [tm[0] + md[0] / ml * 1.4, tm[1] + md[1] / ml * 1.4 + 0.4],
    [(tm[0] + firstK[0]) / 2 + 0.4, Math.min(tm[1] + 0.9, (tm[1] + firstK[1]) / 2 + 0.5)],
    [firstK[0] - 0.4, firstK[1] - FW[0] * 0.5 * fwk + 0.15],
    [knuck[1][0] + 0.2, knuck[1][1] - 0.2],
    [knuck[2][0] + 0.1, knuck[2][1] + 0.2],
    [lastK[0] - 0.1, lastK[1] + FW[3] * 0.5 * fwk - 0.1],
    [lastK[0] * 0.6, lastK[1] + FW[3] * 0.45 * fwk + 0.25 * pwk],
    [1.2, 2.9 * pwk],
    [0, 2.7 * pwk],
  ];
  // back view (little-finger side toward camera): reverse the stack, thumb goes behind
  let order = P.order.slice();
  if (back) {
    order = order.slice().reverse();
    fingers.forEach((f) => { f.z = f.z > 0 ? f.z : f.z; });
    thumb.z = -2;
  }
  const items = [];
  order.forEach((i, n) => items.push({ ...fingers[i], z: fingers[i].z + n * 0.001 }));
  items.push(thumb);
  items.push({ kind: 'palm', z: 0 });
  const objKind = o.object || P.object;
  if (objKind) items.push({ kind: 'object', z: P.objZ ?? 0.5 });
  if (objKind === 'hand') items.push({ kind: 'peek', z: 5 });
  items.sort((a, b) => a.z - b.z);

  // ---- screen geometry helpers
  const pathOf = (pts) => 'M' + pts.map(([px0, py0]) => `${n1(px0)} ${n1(py0)}`).join('L');
  const stroke = (d, w, c, cap = 'round') => I.emit(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${n1(w)}" stroke-linecap="${cap}" stroke-linejoin="round"/>`);
  const palmS = I.sample(palm.map(T), true, 2.5);
  const palmD = I.poly(palmS);
  const segsOf = (it) => it.pts.slice(0, -1).map((p, j) => ({ d: pathOf([T(p), T(it.pts[j + 1])]), w: it.w[j] * s }));
  const lightU = (() => { const l = Math.hypot(LIGHT.lx, LIGHT.ly); return [LIGHT.lx / l, LIGHT.ly / l]; })();
  const shadeOn = o.shade !== false;
  const fShade = shadeOn && detail > 0;

  // wrist stub (drawn under everything, as part of the silhouette)
  const wristD = pathOf([T([-1.6, 0]), T([1.2, 0])]);
  const wristW = 5.6 * pwk * s * (child ? 1.05 : 1);

  // ---- pass 1: the silhouette, brush-inked thick-thin: a thin outline plus a copy nudged toward the shadow
  // side (lower-left, opposite the light), so edges facing away from the light swell (≈ 2.2 : 1) like the bodies
  const SD = C.SHADOW_DIR || [-0.76, 0.65];
  const tt = (fn, e, k1 = 0.62, k2 = 0.78) => {
    fn(e * k1);
    I.emit(`<g transform="translate(${n1(SD[0] * e * k2)} ${n1(SD[1] * e * k2)})">`); fn(e * k1); I.emit('</g>');
  };
  tt((e) => {
    if (o.wrist !== false) stroke(wristD, wristW + 2 * e, INK, 'butt');
    I.emit(`<path d="${palmD}" fill="${INK}" stroke="${INK}" stroke-width="${n1(2 * e)}" stroke-linejoin="round"/>`);
    items.forEach((it) => {
      if (it.kind !== 'finger' && it.kind !== 'thumb') return;
      segsOf(it).forEach(({ d, w }) => stroke(d, w + 2 * Math.max(0.3, e - L.i * 0.6), INK));
    });
  }, L.c);
  if (o.wrist !== false) stroke(wristD, wristW, shadeOn ? sh : skin, 'butt');

  // ---- pass 2: parts in depth order, each with a light outline, cel shadow, then details
  const drawTube = (it) => {
    const segs = segsOf(it);
    // the thumb's metacarpal (thenar mass) has no outline of its own: it melts into the palm
    // a finger lying in front of the palm but growing out of it (index in point/pen/pinch): its
    // outline starts halfway along the first phalanx so the base melts into the hand
    segs.forEach(({ d, w }, j) => {
      if (it.thenar && j === 0) return;
      if (j === 0 && it.merge) {
        const a = T(it.pts[0]), b = T(it.pts[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        stroke(pathOf([m, b]), w, INK, 'butt');
        return;
      }
      stroke(d, w, INK);
      // interior outline thick-thin: nudge a second copy toward the shadow side
      I.emit(`<g transform="translate(${n1(SD[0] * L.i * 0.5)} ${n1(SD[1] * L.i * 0.5)})">`); stroke(d, w, INK); I.emit('</g>');
    });
    segs.forEach(({ d, w }) => stroke(d, Math.max(0.6, w - 2 * L.i), fShade ? sh : skin));
    if (fShade) {
      it.pts.slice(0, -1).forEach((p, j) => {
        if (it.thenar && j === 0) { stroke(segs[0].d, Math.max(0.6, segs[0].w - 2 * L.i), skin); return; }
        const f = Math.max(0.6, it.w[j] * s - 2 * L.i);
        const off = f * 0.15;
        const a = T(p), b = T(it.pts[j + 1]);
        stroke(`M${n1(a[0] + lightU[0] * off)} ${n1(a[1] + lightU[1] * off)}L${n1(b[0] + lightU[0] * off)} ${n1(b[1] + lightU[1] * off)}`, f * 0.7, skin);
      });
    }
    if (it.thenar && detail > 0) {
      // one crease where the thumb pad folds against the palm, fading back toward the wrist
      const [b0, m0] = it.pts;
      const du = m0[0] - b0[0], dv = m0[1] - b0[1], dl = Math.hypot(du, dv) || 1;
      let nu = -dv / dl, nv = du / dl;
      if (nv < 0) { nu = -nu; nv = -nv; }
      const r = it.w[0] * 0.5 - L.i / s;
      const at = (t, k) => T([b0[0] + du * t + nu * r * k, b0[1] + dv * t + nv * r * k]);
      C.line([at(1.25, 0.55), at(0.95, 0.85), at(0.5, 0.95)], L.i * 0.85, { taper: [0.15, 0.7], wob: 0 });
    }
    fingerDetails(it);
  };
  const fingerDetails = (it) => {
    if (detail < 1) return;
    const pts = it.pts.map(T);
    const lwD = L.i * 0.72;
    // joint creases on the inside of each real bend (+ knuckle ticks when old or large)
    for (let j = it.thenar ? 2 : 1; j < pts.length - 1; j++) {
      const bend = it.bends[j - 1] ?? 0;
      const r = it.w[j] * s * 0.5 - L.i;
      const a1 = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]);
      const a2 = Math.atan2(pts[j + 1][1] - pts[j][1], pts[j + 1][0] - pts[j][0]);
      const mid = (a1 + a2) / 2 + (Math.abs(a2 - a1) > Math.PI ? Math.PI : 0);
      const sgn = Math.sign(bend) * flip;
      const nx = -Math.sin(mid) * sgn, ny = Math.cos(mid) * sgn; // toward the inside of the bend
      if (Math.abs(bend) > 24) {
        C.line([[pts[j][0] + nx * r * 1.0, pts[j][1] + ny * r * 1.0], [pts[j][0] + nx * r * 0.2, pts[j][1] + ny * r * 0.2]], lwD, { taper: [0.1, 0.6], wob: 0 });
      } else if ((detail > 1 || age > 0.5) && (P.view !== 'palm')) {
        // straight joint seen from the back: one or two small wrinkle ticks across the finger
        const tx = Math.cos(mid), ty = Math.sin(mid);
        const nk = age > 0.5 ? 2 : 1;
        for (let q = 0; q < nk; q++) {
          const off = (q - (nk - 1) / 2) * r * 0.5;
          const cx = pts[j][0] + tx * off, cy = pts[j][1] + ty * off;
          C.line([[cx - ty * r * 0.45 + tx * r * 0.12, cy + tx * r * 0.45 + ty * r * 0.12], [cx, cy], [cx + ty * r * 0.45 + tx * r * 0.12, cy - tx * r * 0.45 + ty * r * 0.12]], lwD * 0.85, { taper: [0.3, 0.3], wob: 0, op: 0.85 });
        }
      }
    }
    // nail on the fingertip when the back of the finger faces us
    if (detail > 1 && it.kind === 'finger' && (P.view === 'back' || (P.view === 'side' && Math.abs(it.bends[0]) < 40))) {
      const n = pts.length, a = Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]);
      const r = it.w[2] * s * 0.5 - L.i;
      const cx = pts[n - 1][0] - Math.cos(a) * r * 0.25, cy = pts[n - 1][1] - Math.sin(a) * r * 0.25;
      const px0 = -Math.sin(a), py0 = Math.cos(a);
      C.line([[cx + px0 * r * 0.5 - Math.cos(a) * r * 0.9, cy + py0 * r * 0.5 - Math.sin(a) * r * 0.9], [cx - Math.cos(a) * r * 1.0, cy - Math.sin(a) * r * 1.0], [cx - px0 * r * 0.5 - Math.cos(a) * r * 0.9, cy - py0 * r * 0.5 - Math.sin(a) * r * 0.9]], lwD * 0.8, { taper: [0.3, 0.3], wob: 0, op: 0.7 });
    }
  };
  const drawPalm = () => {
    if (shadeOn) {
      const off = 1.3 * s;
      I.clip(palmD, () => {
        I.emit(`<path d="${palmD}" fill="${sh}"/>`);
        I.emit(`<path d="${I.poly(palmS.map(([a, b]) => [a + lightU[0] * off, b + lightU[1] * off]))}" fill="${skin}"/>`);
      });
    } else I.emit(`<path d="${palmD}" fill="${skin}"/>`);
    if (detail < 1) return;
    const lwD = L.i * 0.62;
    if (P.view === 'palm') {
      // heart line, head line, and the life line round the thenar
      C.line([T([8.2, 3.2]), T([7.4, 0.8]), T([7.8, -1.8])], lwD, { taper: [0.2, 0.5], wob: 0.1 });
      C.line([T([5.6, 3.1]), T([5.4, 0.2]), T([6.6, -2.6])], lwD, { taper: [0.3, 0.5], wob: 0.1, op: 0.8 });
      C.line([T([cmc[0] + 1.2, 0.8]), T([cmc[0] + 3.0, -1.0]), T([tm[0] + 1.2, tm[1] + 1.6])], lwD, { taper: [0.3, 0.3], wob: 0.1 });
    } else if (P.view === 'side' && P.f[1].b1 > 60) {
      // the knuckle ridge of a closed hand
      C.line([T([knuck[0][0] - 1.2, knuck[0][1] - 0.2]), T([knuck[1][0] - 1.0, knuck[1][1]]), T([knuck[2][0] - 1.1, knuck[2][1] + 0.1])], lwD, { taper: [0.3, 0.3], wob: 0, op: 0.7 });
    } else if (P.view === 'back' && (detail > 1 || age > 0.5)) {
      // tendons toward the knuckles (a hint)
      [[0, 1], [1, 2]].forEach(([a]) => C.line([T([4.2, knuck[a][1] * 0.6]), T([knuck[a][0] - 2.4, knuck[a][1] * 0.92])], lwD * 0.8, { taper: [0.5, 0.4], wob: 0, op: age > 0.5 ? 0.7 : 0.4 }));
    }
    if (age > 0.5 && detail > 0) {
      [[4.6, 0.4], [6.2, -1.6], [3.2, 1.6]].forEach(([u, v], q) => { const p = T([u, v]); I.fill(I.ell(p[0], p[1], 0.42 * s * (1 - q * 0.2), 0.3 * s * (1 - q * 0.2), 8), shadeOf(skin, 0.3), { wob: 0 }); });
    }
  };

  items.forEach((it) => {
    if (it.kind === 'palm') drawPalm();
    else if (it.kind === 'peek') {
      // the child's thumb hooked over the adult's index knuckle
      const csk = o.objectSkin || '#f4cfae';
      const a = T([9.2, -0.6]), b = T([10.4, -3.2]), c = T([12.2, -3.9]);
      const w = 2.3 * s * 0.8;
      stroke(pathOf([a, b, c]), w + 2 * L.i, INK); stroke(pathOf([a, b, c]), Math.max(0.6, w), csk);
      C.line([T([11.4, -3.3]), T([12.0, -3.5])], L.i * 0.7, { wob: 0, op: 0.6 });
    } else if (it.kind === 'object') {
      const ft = fingers[0].pts[fingers[0].pts.length - 1];
      const A = { ...P.hold, fingertip: ft };
      if (P.atTip) A.c = [ft[0] + 0.3, ft[1] - P.atTip];
      if (typeof objKind === 'function') objKind(T, s, A);
      else drawObject(objKind, T, s, A, o, L);
    } else drawTube(it);
  });
  return { T, anchor: P.hold, tip: fingers[0].pts[3] ? T(fingers[0].pts[3]) : null };
}

module.exports = { hand, tube, POSES, ALIASES };
