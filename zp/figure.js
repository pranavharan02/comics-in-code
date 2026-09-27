// zp/figure.js — a posable full-body figure drawn as designed cartoon forms. The skeleton is solved in
// 3-D body space (lateral, up, forward), turned by the yaw and projected (with a slight top-down ground
// tilt), so front, 3/4, profile, 3/4-back and back views stay consistent. Forms are drawn in 2-D on top:
// a curved spine (line of action), a torso with chest/belly/seat volume, cloth sleeves and trouser legs
// with folds, shaped shoes, hanging cloth (skirts, dresses, coat tails) that drapes over laps and knees,
// cel shading on every form, contrapposto and a cast shadow.
//
// fig(char, pose)
//   char: { head: <head design>, H: height in head units (child ≈ 2.6–2.9, adult ≈ 3.5–3.8), skin,
//           top: {color, sleeve: 'long'|'short'|'none', collar: color|null, type: 'shirt'|'jumper'|'coat'|'cardigan', belt},
//           bottom: {type: 'pants'|'skirt'|'dress'|'shorts', color, socks}, shoes: color, build: 0.8..1.3,
//           shoeType: 'shoe'|'boots'|'heels', stoop: 0..1 (default from head.age), bodyK: body length factor,
//           shade: 'flat'|'tone'|'black' (cel mode for clothes) }
//   pose: { x, y (ground point under the hips), s (scale: head radius px / 30),
//           yaw (-180..180, body turn; head uses head.yaw ?? yaw; |yaw| > 90 = seen from behind),
//           lean (deg, + forward), curve (deg, spine bend = line of action; + hunches, − arches; default 3),
//           twist (deg, shoulders turned against the hips), side (deg, sideways lean of the spine),
//           stoop (0..1 override), contra (0..1 contrapposto amount, default 1), weight: 'N'|'F',
//           squash (−0.3..0.3: + squashes, − stretches, about the ground point), rot (deg, whole figure,
//           about (x, y) or rotC: [x, y] — lying down, falling),
//           armN/armF: [shoulderDeg, elbowDeg, abductionDeg] near/far arm (0 = hanging, + = forward/up),
//           legN/legF: [hipDeg, kneeDeg, abductionDeg] (0 = straight down, + = forward; knees bend backward),
//           sit: seat height in px above y (the seat of the trousers rests there) | null, plant, kneel,
//           reachN/reachF: IK target for the wrist (point or 'kneeN'|'kneeF'|'thighN'|'thighF'|'hipN'|'hipF'),
//           bendN/bendF (elbow side, ±1), footN/footF: IK target for the ankle, kneeN/kneeF (knee side),
//           handN/handF: hand pose name, handAngN/handAngF: hand direction override (deg),
//           holdN/holdF: 'stick'|'pen'|'bar'|'mug'|'card'|'phone'|'photo'|'sandwich'|'hand'|fn,
//           head: {yaw, pitch, look, mood, mouth, blink}, barefoot,
//           shadow: false | 'strokes' (default: flat cast shadow under standing figures),
//           behind(r), front(r), armOver, hideF, noLegs, parts: [...], stick: {far, lean, color},
//           sil, tint: [colour, t] }
// POSE.* return partial poses; POSES.* is the named pose library (see work/engine/figure2/NOTES.md).
const { I, INK, LW, line, closedLine, cel, shade, mix, clamp } = require('./core');
const HEAD = require('./head');
const { hand } = require('./hand');
const D = Math.PI / 180;
// smooth, confident curves: positional jitter is capped (variation lives in the brush width instead)
const WOB = (pts, a) => I.wobble(pts, Math.min(a, 0.1));

// proportions: ZP adults are long-legged and slim (≈ 5.6 head units), kids ≈ 3.8.
const PROP = { mode: 'zp', adult: 1, child: 1 };
// ground tilt: points nearer the viewer sit a little lower on the page (camera slightly above)
const PZ = 0.14;

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const len = (v) => Math.hypot(v[0], v[1]);
const norm = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
// 3-D helpers: [lat (character's left), up, fwd]
const v3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
// limb direction from flexion (0 = straight down, 90 = forward, 180 = up) and abduction (outward, deg)
const limbDir = (flex, abd, out) => { const f = flex * D, a = abd * D; return [out * Math.sin(a), -Math.cos(f) * Math.cos(a), Math.sin(f) * Math.cos(a)]; };

const headModelCache = new WeakMap();
function headModel(h) {
  if (!headModelCache.has(h)) headModelCache.set(h, HEAD.model(HEAD.design(h)));
  return headModelCache.get(h);
}

function rig(ch, p) {
  const s = p.s || 1, R = (ch.head.R || 30) * s;
  const Hh = ch.H || 3.6;
  const unit = 2.25 * R;   // one head height (skull top to chin)
  const child = Hh < 3.3;
  const K = p.bodyK ?? ch.bodyK ?? 1;
  const HM = headModel(ch.head);
  let torsoL, legL, neckL;
  if ((p.prop || ch.prop || PROP.mode) === 'classic') {
    const Ht = Hh * unit;
    neckL = unit * (child ? 0.05 : 0.11);
    const legL0 = Ht * (child ? 0.37 : 0.44) * (ch.legs || 1);
    torsoL = (Ht - unit - legL0 - neckL) * K; legL = legL0 * K;
  } else {
    const hk = Hh / (child ? 2.7 : 3.7), pk = PROP[child ? 'child' : 'adult'];
    torsoL = unit * (child ? 1.02 : 1.5) * hk * K * pk;
    legL = unit * (child ? 1.6 : 2.72) * hk * K * (ch.legs || 1) * pk;
    neckL = R * (child ? 0.2 : 0.34) * (ch.neck || 1);
  }
  const thigh = legL * 0.5, shin = legL * 0.5;
  const totH = unit + neckL + torsoL + legL; // drawn height
  const armU = totH * (child ? 0.16 : 0.168) * (ch.arms || 1), armFl = totH * (child ? 0.135 : 0.15) * (ch.arms || 1);
  const B = ch.build || 1;
  const shW = unit * (child ? 0.31 : 0.39) * B;
  const hipW = unit * (child ? 0.15 : 0.17) * B;
  const yaw = p.yaw ?? 0, dir = Math.sign(yaw) || 1, turn = Math.abs(Math.sin(yaw * D));
  const cY = Math.cos(yaw * D), sY = Math.sin(yaw * D);
  const nl = yaw >= 0 ? -1 : 1; // lateral side of the near limbs (character's right when facing right)
  const age = (ch.head && ch.head.age) || 0;
  const stoop = p.stoop ?? ch.stoop ?? clamp((age - 0.6) * 2.5, 0, 0.6);
  const sitting = p.sit != null;
  const lean = (p.lean || 0) + stoop * 4;
  const curve = (p.curve ?? 3) + stoop * 26;
  const cex = 1 + stoop * 1.2; // stooped backs bend in the upper back

  // ---- legs (angles) and contrapposto
  let lN = p.legN ? p.legN.slice() : null, lF = p.legF ? p.legF.slice() : null;
  let wSide = 0;
  const c0 = p.contra ?? 1;
  if (!sitting && !p.footN && !p.footF && c0 > 0) {
    const a = lN || [0, 0], b = lF || [0, 0];
    const straight = Math.abs(a[0]) < 12 && Math.abs(b[0]) < 12 && Math.abs(a[1]) < 16 && Math.abs(b[1]) < 16;
    if (straight) wSide = p.weight === 'F' ? -1 : p.weight === 'N' ? 1 : (lN && lF ? (Math.abs(a[1]) <= Math.abs(b[1]) ? 1 : -1) : -1);
  }
  const relaxed = wSide !== 0 && !p.legN && !p.legF;
  const cK = wSide ? c0 : 0;
  const supLat = wSide > 0 ? nl : -nl; // lateral side of the supporting leg
  // pelvis: shifted over the supporting foot, hip on that side higher; shoulders tilt the other way
  const pelShift = supLat * hipW * 1.1 * cK;
  const roll = unit * 0.055 * cK;
  const sideA = (p.side || 0) - supLat * 7 * cK; // spine leans back toward the centre

  // ---- spine (line of action) in body space, pelvis at the origin
  const NS = 12, spine = [];
  {
    let pt = [pelShift, 0, 0];
    for (let i = 0; i <= NS; i++) {
      spine.push(pt);
      const t = (i + 0.5) / NS;
      const a = (lean + curve * Math.pow(t, cex)) * D;
      const b = (sideA * (1 - 2.1 * t)) * D;
      const st = torsoL / NS;
      pt = [pt[0] + Math.sin(b) * st, pt[1] + Math.cos(a) * Math.cos(b) * st, pt[2] + Math.sin(a) * Math.cos(b) * st];
    }
  }
  const spine3 = (t) => {
    if (t <= 0) { const d0 = v3(spine[1], spine[0], -1); return v3(spine[0], d0, t * NS); }
    const f = Math.min(t, 1) * NS, i = Math.min(NS - 1, Math.floor(f)), k = f - i;
    const q = v3(spine[i], v3(spine[i + 1], spine[i], -1), k);
    return t > 1 ? v3(q, v3(spine[NS], spine[NS - 1], -1), (t - 1) * NS) : q;
  };
  // twist: shoulders turn against the hips (walking), positive = left shoulder forward
  const tw = (p.twist || 0) * D;
  const shLat = [Math.cos(tw), 0, Math.sin(tw)];
  const shC3 = spine3(0.92);
  const shrug = (p.shrug || 0) * unit;
  const shN3 = v3(v3(shC3, shLat, shW * nl), [0, (nl === supLat ? -roll * 0.8 : roll * 0.8) + shrug, -unit * 0.03]);
  const shF3 = v3(v3(shC3, shLat, -shW * nl), [0, (-nl === supLat ? -roll * 0.8 : roll * 0.8) + shrug, -unit * 0.03]);
  const hipN3 = [pelShift + nl * hipW, nl === supLat ? roll : -roll, 0];
  const hipF3 = [pelShift - nl * hipW, -nl === supLat ? roll : -roll, 0];

  // ---- arms (3-D chains; IK targets are solved later in screen space)
  const armChain = (sh, a, out, def) => {
    const f1 = a[0], f2 = a[0] + a[1];
    const ab = a[2] ?? def;
    const e = v3(sh, limbDir(f1, ab, out), armU);
    const w = v3(e, limbDir(f2, a[3] ?? ab * 0.6, out), armFl);
    return [sh, e, w];
  };
  const aN = p.armN || [6, 14], aF = p.armF || [-5, 12];
  // legacyArms: the old 2-D rig rooted the near arm on the chest side. When a 3/4 figure raises or reaches
  // its near arm forward (the case the comics were staged for), root it there again so it doesn't cross
  // the face and chest ('auto', default); true = always, false = never (true 3-D).
  const la = p.legacyArms ?? 'auto';
  let swapN = false;
  if (la === true) swapN = true;
  else if (la === 'auto' && turn > 0.25 && turn < 0.97 && cY > 0) {
    const hipY = sitting ? p.y - p.sit : p.y - legL;
    if (p.reachN && typeof p.reachN !== 'string') swapN = (p.reachN[0] - p.x) * dir > -unit * 0.05 && p.reachN[1] < hipY - torsoL * 0.35;
    else if (p.armN && !p.reachN) swapN = aN[0] > 60;
  }
  const shNr = swapN ? v3(shF3, [0, 0, unit * 0.04]) : shN3;
  let armN3 = armChain(shNr, aN, swapN ? -nl : nl, 7), armF3 = armChain(shF3, aF, -nl, 5);

  // ---- legs
  const legChain = (h, l, out, isSup, isFree) => {
    let flex, shinA, ab, ab2 = null;
    if (sitting) { flex = 90 + (l ? l[0] : 0); shinA = l ? l[1] : 6; ab = l && l[2] != null ? l[2] : 5; }
    else {
      flex = l ? l[0] : 0; shinA = flex - Math.abs(l ? l[1] : 0); ab = l && l[2] != null ? l[2] : 2;
      if (isSup) { ab = -Math.asin(clamp((Math.abs(pelShift) + hipW * 0.25) / legL, 0, 0.5)) / D; flex = 2; shinA = 1; }
      if (isFree) { flex = 10; shinA = -12; ab = 3; ab2 = 11; }
    }
    const k = v3(h, limbDir(flex, ab, out), thigh);
    const a = v3(k, limbDir(shinA, ab2 ?? (l && l[3] != null ? l[3] : ab), out), shin);
    return [h, k, a];
  };
  let legN3 = legChain(hipN3, lN, nl, relaxed && nl === supLat, relaxed && nl !== supLat);
  let legF3 = legChain(hipF3, lF, -nl, relaxed && -nl === supLat, relaxed && -nl !== supLat);

  // ---- neck and head
  const top3 = spine3(1.0);
  const tanTop = v3(spine3(1.0), spine3(0.92), -1);
  const tl = Math.hypot(...tanTop) || 1;
  const nA = Math.atan2(tanTop[2], tanTop[1]) + (stoop * 16 + (p.neckTilt || 0) - (p.lean || 0) * 0.35) * D;
  const neckTop3 = v3(top3, [tanTop[0] / tl * 0.5, Math.cos(nA), Math.sin(nA)], neckL);

  // ---- projection
  const x0 = p.x, baseY = sitting ? p.y - p.sit - unit * (child ? 0.1 : 0.13) : p.y - legL;
  const depth = (v) => -v[0] * sY + v[2] * cY;
  const proj = (v) => [x0 + v[0] * cY + v[2] * sY, baseY - v[1] + depth(v) * PZ];
  const P = (arr) => arr.map(proj);
  let hip = proj([pelShift, 0, 0]), neck = proj(top3);
  const shN = proj(shNr), shF = proj(shF3), hipN = proj(hipN3), hipF = proj(hipF3);
  let armN = P(armN3), armF_ = P(armF3), legN = P(legN3), legF = P(legF3);
  const neckTop = proj(neckTop3);
  const hy = (p.head && p.head.yaw != null ? p.head.yaw : yaw) * D;
  const headC = [neckTop[0] + 0.2 * Math.sin(hy) * R + (p.headDX || 0) * s, neckTop[1] - (HM.cb - 0.12) * R + (p.headDY || 0) * s];
  const spinePts = spine.map(proj);
  const spineAt = (t) => proj(spine3(t));
  const tanAt = (t) => norm(sub(spineAt(Math.min(1, t) + 0.04), spineAt(Math.min(1, t) - 0.04)));

  // ---- IK (screen space)
  const ik = (S, T, a, b, bend = 1) => {
    let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
    const maxd = (a + b) * 0.999; if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
    const base = Math.atan2(dy, dx), k = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d || 1), -1, 1));
    const ang = base + k * bend * dir;
    const E = [S[0] + Math.cos(ang) * a, S[1] + Math.sin(ang) * a];
    return [S, E, [S[0] + dx, S[1] + dy]];
  };
  // projected arm lengths (keep 3-D foreshortening of the chosen pose; IK uses full lengths)
  if (p.reachN && typeof p.reachN !== 'string') armN = ik(shN, p.reachN, armU, armFl, p.bendN ?? 1);
  if (p.reachF && typeof p.reachF !== 'string') armF_ = ik(shF, p.reachF, armU, armFl, p.bendF ?? 1);

  const all = () => [hip, neck, neckTop, headC, shN, shF, hipN, hipF, ...armN, ...armF_, ...legN, ...legF, ...spinePts];
  const moveAll = (dy) => { new Set(all()).forEach((q) => { q[1] += dy; }); };
  const kr = unit * 0.07;
  if (sitting) {
    if (p.plant) moveAll(p.y - Math.max(legN[2][1], legF[2][1], p.kneel ? Math.max(legF[1][1], legN[1][1]) + kr : -1e9));
  } else if (p.kneel) {
    // kneeling: the knee of the leg folded back rests on the ground, the other foot is planted
    const downF = legF[2][1] - legF[1][1] < legN[2][1] - legN[1][1];
    const dl = downF ? legF : legN;
    moveAll(p.y - (dl[1][1] + kr));
    const ul = downF ? legN : legF, uh = ul[0];
    const tgt = [ul[1][0] + dir * unit * 0.04, p.y];
    const nl2 = ik2(uh, tgt, thigh, shin, -1, dir);
    if (downF) legN = nl2; else legF = nl2;
    // the folded shin lies along the ground behind the knee
    const bk = dl[1];
    const sh2 = [bk[0] - dir * Math.max(shin * 0.82, Math.abs(dl[2][0] - bk[0])), p.y - unit * 0.03];
    if (downF) legF = [legF[0], legF[1], sh2]; else legN = [legN[0], legN[1], sh2];
  } else moveAll(p.y - Math.max(legN[2][1], legF[2][1], legN[1][1] + kr, legF[1][1] + kr));
  // spineAt / tanAt read the moved spinePts from here on
  const spineAtM = (t) => {
    if (t <= 0) { const d0 = sub(spinePts[1], spinePts[0]); return add(spinePts[0], d0, t * NS); }
    const f = Math.min(t, 1) * NS, i = Math.min(NS - 1, Math.floor(f)), k = f - i;
    const q = lerp2(spinePts[i], spinePts[i + 1], k);
    return t > 1 ? add(q, sub(spinePts[NS], spinePts[NS - 1]), (t - 1) * NS) : q;
  };
  const tanAtM = (t) => norm(sub(spineAtM(Math.min(1, t) + 0.04), spineAtM(Math.max(-0.2, Math.min(1, t) - 0.04))));
  void spineAt; void tanAt;
  if (p.footN) legN = ik2(hipN, p.footN, thigh, shin, p.kneeN ?? -1, dir);
  if (p.footF) legF = ik2(hipF, p.footF, thigh, shin, p.kneeF ?? -1, dir);
  if (p.kneeShiftN) { legN[1] = add(legN[1], p.kneeShiftN, unit); }
  if (p.kneeShiftF) { legF[1] = add(legF[1], p.kneeShiftF, unit); }
  const named = (k) => ({
    kneeN: add(legN[1], [dir * unit * 0.02, -unit * 0.12]), kneeF: add(legF[1], [dir * unit * 0.02, -unit * 0.12]),
    thighN: add(lerp2(legN[0], legN[1], 0.62), [0, -unit * 0.13]), thighF: add(lerp2(legF[0], legF[1], 0.62), [0, -unit * 0.13]),
    hipN: add(hipN, [-dir * unit * 0.05, -unit * 0.06]), hipF: add(hipF, [dir * unit * 0.05, -unit * 0.06]),
  }[k]);
  if (typeof p.reachN === 'string' && named(p.reachN)) armN = ik(shN, named(p.reachN), armU, armFl, p.bendN ?? 1);
  if (typeof p.reachF === 'string' && named(p.reachF)) armF_ = ik(shF, named(p.reachF), armU, armFl, p.bendF ?? 1);
  const up = tanAtM(0.05), chestUp = tanAtM(0.97);
  // depth of the feet (toe-out etc.) for the shoes
  const footYaw = (isN, isFree) => yaw + (isN ? -nl : nl) * 0 + (isFree ? 18 : 8) * (isN ? nl : -nl) * -1;
  return {
    s, R, unit, dir, turn, yaw, cY, sY, nl, back: cY < -0.12, up, chestUp, hip, neck, neckTop, headC, shN, shF, hipN, hipF,
    armN, armF: armF_, legN, legF, child, thigh, shin, armU, armFore: armFl, torsoL, spineAt: spineAtM, tanAt: tanAtM,
    stoop, wSide, relaxed, supN: wSide > 0, sitting, ground: p.y, HM, footYaw, headYaw: hy / D,
    depthN: depth(shN3), depthF: depth(shF3),
  };
}

function ik2(S, T, a, b, bend, dir) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
  const maxd = (a + b) * 0.999; if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const base = Math.atan2(dy, dx), k = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d || 1), -1, 1));
  const ang = base + k * bend * dir;
  return [S, [S[0] + Math.cos(ang) * a, S[1] + Math.sin(ang) * a], [S[0] + dx, S[1] + dy]];
}

// ---- cloth tube: a sleeve / trouser leg / bare limb along a smoothed centreline -------------------
// Fills (with cel) the whole tube, inks both sides and the hem, and leaves the root un-inked on the
// inner side so it grows out of the body without a seam. Returns geometry for folds.
function tube(pts, radii, color, o = {}) {
  // drop zero-length segments (foreshortened limbs)
  const P0 = [pts[0]], R0 = [radii[0]];
  for (let i = 1; i < pts.length; i++) {
    if (len(sub(pts[i], P0[P0.length - 1])) < 0.6) { R0[R0.length - 1] = Math.max(R0[R0.length - 1], radii[i]); continue; }
    P0.push(pts[i]); R0.push(radii[i]);
  }
  if (P0.length < 2) { P0.push(add(P0[0], [0, 0.8])); R0.push(R0[0]); }
  pts = P0; radii = R0;
  const c = I.sample(pts, false, 3);
  const cc = [0]; for (let i = 1; i < pts.length; i++) cc.push(cc[i - 1] + len(sub(pts[i], pts[i - 1])));
  const sc = [0]; for (let i = 1; i < c.length; i++) sc.push(sc[i - 1] + len(sub(c[i], c[i - 1])));
  const k = (cc[cc.length - 1] || 1) / (sc[sc.length - 1] || 1);
  const rAt = (x) => {
    for (let i = 0; i < cc.length - 1; i++) if (x <= cc[i + 1] || i === cc.length - 2) {
      let t = clamp((x - cc[i]) / ((cc[i + 1] - cc[i]) || 1), 0, 1); t = t * t * (3 - 2 * t);
      return radii[i] + (radii[i + 1] - radii[i]) * t;
    }
    return radii[radii.length - 1];
  };
  const L = [], Rr = [], T = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const t = norm(sub(b, a)); T.push(t);
    const r = rAt(sc[i] * k);
    L.push([c[i][0] - t[1] * r, c[i][1] + t[0] * r]);
    Rr.push([c[i][0] + t[1] * r, c[i][1] - t[0] * r]);
  }
  const unloop = (S) => { const out = [S[0]]; for (let i = 1; i < S.length; i++) { const d = sub(S[i], out[out.length - 1]); if (d[0] * T[i][0] + d[1] * T[i][1] > -0.01) out.push(S[i]); } return out; };
  const Lc = unloop(L), Rc = unloop(Rr);
  const n = c.length, rE = rAt(sc[n - 1] * k), r0 = rAt(0);
  const tE = T[n - 1], t0 = T[0];
  const hr = o.hemRound ?? 0.3;
  const hem = []; for (let j = 1; j < 6; j++) { const a = Math.PI / 2 - (j / 6) * Math.PI; hem.push(add(c[n - 1], [tE[0] * Math.cos(a) * rE * hr - tE[1] * Math.sin(a) * rE, tE[1] * Math.cos(a) * rE * hr + tE[0] * Math.sin(a) * rE])); }
  const root = []; for (let j = 1; j < 6; j++) { const a = -Math.PI / 2 - (j / 6) * Math.PI; root.push(add(c[0], [t0[0] * Math.cos(a) * r0 - t0[1] * Math.sin(a) * r0, t0[1] * Math.cos(a) * r0 + t0[0] * Math.sin(a) * r0])); }
  const poly = Lc.concat(hem, Rc.slice().reverse(), root);
  const P = WOB(poly, o.wob ?? 0.25);
  const nL = Lc.length, nH = hem.length, nR = Rc.length;
  const pL = P.slice(0, nL), pH = P.slice(nL, nL + nH), pR = P.slice(nL + nH, nL + nH + nR).reverse(), pRoot = P.slice(nL + nH + nR);
  if (color) cel(P, color, { w: 0, wob: 0, shade: o.shade, mode: o.mode, k: o.k ?? (2 * Math.max(r0, rE) * 0.34) / 9.2, lx: o.lx, ly: o.ly, inner: o.inner });
  const W = o.w ?? LW.line;
  if (W > 0) {
    let outerIsL = true;
    if (o.body) outerIsL = len(sub(pL[0], o.body)) > len(sub(pR[0], o.body));
    const mid = c[Math.floor(c.length / 2)];
    if (o.rootInk !== false) {
      const half = Math.ceil(pRoot.length / 2);
      if (outerIsL) line(pRoot.slice(half - 1).concat(pL, [pH[0]]), W, { taper: [0.12, 0.02], wob: 0, body: mid });
      else line(pRoot.slice(0, half + 1).reverse().concat(pR, [pH[pH.length - 1]]), W, { taper: [0.12, 0.02], wob: 0, body: mid });
    } else line(outerIsL ? pL.concat([pH[0]]) : pR.concat([pH[pH.length - 1]]), W, { taper: [0.3, 0.02], tuck: [true, false], wob: 0, body: mid });
    // the inner side tucks into the body at its root: it thins to a point there
    line(outerIsL ? pR.concat([pH[pH.length - 1]]) : pL.concat([pH[0]]), W * (o.innerK ?? 0.92), { taper: [0.4, 0.02], tuck: [true, false], wob: 0, body: mid });
    if (o.hemW !== 0) line([pL[pL.length - 1]].concat(pH, [pR[pR.length - 1]]), o.hemW ?? W * 0.85, { taper: [0.05, 0.05], wob: 0, body: mid });
  }
  return { c, L: pL, R: pR, hem: pH, rAt: (i) => rAt(sc[i] * k), T, P };
}

// fold lines at a joint (inside of the bend) in the garment's shadow colour
function jointFolds(A, J, B, r, color, w, n = 2) {
  const v1 = norm(sub(J, A)), v2 = norm(sub(B, J));
  const cr = v1[0] * v2[1] - v1[1] * v2[0];
  const bend = Math.asin(clamp(cr, -1, 1));
  if (Math.abs(bend) < 0.12) return;
  const inner = cr >= 0 ? [-v1[1], v1[0]] : [v1[1], -v1[0]];
  const ax = norm(add(v1, v2));
  const strength = clamp(Math.abs(bend) / 0.9, 0.35, 1);
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * r * 0.75;
    const s0 = add(add(J, inner, r * 0.95), ax, off);
    const s1 = add(add(J, inner, r * (0.9 - 1.1 * strength)), ax, off + r * 0.35 * (i % 2 ? -1 : 1));
    line([s0, lerp2(s0, s1, 0.5), s1], w, { color, taper: [0.1, 0.6], wob: 0.2 });
  }
}

// ---- ink fold vocabulary (ZP draws cloth folds as thin black lines of varied length)
function fold(pts, w, o = {}) { line(pts, w, { taper: o.taper || [0.45, 0.35], wob: o.wob ?? 0.25, color: o.color, op: o.op }); }
// bunching in the crook of a bend: a short zig-zag, plus tension folds fanning out of it
function bunch(A, J, B, r, w, o = {}) {
  const v1 = norm(sub(J, A)), v2 = norm(sub(B, J));
  const cr = v1[0] * v2[1] - v1[1] * v2[0];
  const st = clamp(Math.abs(Math.asin(clamp(cr, -1, 1))) / 0.9, 0, 1);
  const inner = cr >= 0 ? [-v1[1], v1[0]] : [v1[1], -v1[0]];
  const outer = [-inner[0], -inner[1]];
  const ax = norm(add(v1, v2));
  if (st > 0.3) {
    const c = add(J, inner, r * 0.62);
    fold([add(c, ax, -r * 0.6), add(add(c, outer, r * 0.3), ax, -r * 0.2), add(add(c, inner, r * 0.05), ax, r * 0.1), add(add(c, outer, r * 0.36), ax, r * 0.48)], w, { taper: [0.3, 0.45] });
  }
  const n = o.n ?? 2;
  for (let i = 0; i < n; i++) {
    const s0 = add(add(J, inner, r * (0.55 - i * 0.2)), ax, (i ? 0.35 : -0.3) * r);
    const d2 = norm(add(outer, ax, i ? 0.9 : -0.9));
    const L = r * (i ? 0.7 : 1.15) * (0.3 + st);
    if (st < 0.12 && i) continue;
    fold([s0, add(add(s0, d2, L * 0.5), inner, r * 0.06), add(s0, d2, L)], w * 0.9, { taper: [0.15, 0.75] });
  }
}
// a long drop fold along a straight part of a tube (on the side away from the light)
function drop(A, B, r, side, w, t0 = 0.15, t1 = 0.6) {
  const v = norm(sub(B, A)), n = [-v[1] * side, v[0] * side];
  fold([add(lerp2(A, B, t0), n, r * 0.45), add(lerp2(A, B, (t0 + t1) / 2), n, r * 0.62), add(lerp2(A, B, t1), n, r * 0.5)], w, { taper: [0.5, 0.5] });
}
// CIE L* of a colour (spot blacks for dark cloth)
function lstar(c) {
  if (!c || c[0] !== '#' || c.length !== 7) return 50;
  const v = [1, 3, 5].map((i) => { const x = parseInt(c.slice(i, i + 2), 16) / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  const Y = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
}

// a walking stick from a grip point to the ground, with a crook handle
function stickFn(ground, dir, u, sc, color) {
  return (T, s, A) => {
    const c = T(A.c);
    const g = [ground[0], ground[1]];
    const top = add(c, norm(sub(c, g)), u * 0.06);
    const hook = [top, add(top, [dir * u * 0.1, -u * 0.07]), add(top, [dir * u * 0.2, -u * 0.02]), add(top, [dir * u * 0.22, u * 0.07])];
    line([g, top], 5.4 * sc, { taper: [0, 0], minW: 1, wob: 0.2 });
    line([g, top], 2.9 * sc, { color: color || '#8a5a33', taper: [0, 0], minW: 1, wob: 0 });
    line(hook, 5.4 * sc, { taper: [0, 0.1], minW: 1, wob: 0 });
    line(hook, 2.9 * sc, { color: color || '#8a5a33', taper: [0, 0.1], minW: 1, wob: 0 });
  };
}

function fig(ch0, p0) {
  let p = p0;
  const ch = p.sil ? silhouette(ch0, p.sil) : p.tint ? tinted(ch0, p.tint[0], p.tint[1]) : ch0;
  // legacy stick option → a gripping hand holding a stick that reaches the ground
  if (p.stick) {
    const far = !!p.stick.far;
    const r0 = rig(ch, p);
    const k = far ? 'F' : 'N';
    const sh = far ? r0.shF : r0.shN;
    const q = { ...p };
    if (!p['reach' + k] && !p['arm' + k]) q['reach' + k] = [sh[0] + r0.dir * r0.unit * 0.42, r0.hip[1] - r0.unit * 0.02];
    q['hand' + k] = p['hand' + k] || 'grip';
    q['_stick' + k] = { lean: p.stick.lean ?? 6, color: p.stick.color };
    q.stick = null;
    p = q;
  }
  if (p.rot) { const c = p.rotC || [p.x, p.y]; I.emit(`<g transform="rotate(${I.n1(p.rot)} ${I.n1(c[0])} ${I.n1(c[1])})">`); }
  if (p.squash) { const sq = p.squash; I.emit(`<g transform="translate(${I.n1(p.x)} ${I.n1(p.y)}) scale(${1 + sq * 0.55} ${1 - sq}) translate(${I.n1(-p.x)} ${I.n1(-p.y)})">`); }
  const r = rig(ch, p);
  const s = r.s, dir = r.dir, u = r.unit, T = r.turn;
  const sc = clamp(s, 0.8, 2);
  const skin = ch.head.skin || '#f6d2b4';
  const top = ch.top || { color: '#5a7fb5', sleeve: 'long' };
  const bot = ch.bottom || { type: 'pants', color: '#2d3140' };
  const barefoot = p.barefoot || (ch.shoes && ch.shoes === skin);
  const shoe = ch.shoes || '#1a1618';
  const tc = ch._tint;
  const flat = !!p.sil;
  const SH = (col, k = 0.22) => (!col || flat ? col : tc ? mix(shade(col, k), tc[0], tc[1] * 0.6) : shade(col, k));
  const mode = flat ? 'flat' : (p.shade || ch.shade);
  // pen: sub-linear with size, matched to head.js (contour ≈ 2.4 + 0.012 R); interior lines ≈ 0.6 of it
  const CW = Math.min(3.6, 2.4 + 0.012 * r.R);
  const W = { contour: CW, line: CW * 0.9, hem: CW * 0.66, fold: CW * 0.56, fine: CW * 0.45 };
  // spot blacks: dark cloth gets solid black shadows (ZP), unless a cel mode is forced
  const modeOf = (c) => (mode ? mode : !flat && lstar(c) < 32 ? 'black' : undefined);
  const B = (ch.build || 1);
  const back = r.back;
  const limbR = u * (r.child ? 0.082 : 0.078) * B * (ch.limbs || 1);
  const legR = u * (r.child ? 0.09 : 0.11) * B * (ch.limbs || 1);
  const pantsR = u * (r.child ? 0.125 : 0.14) * B * (bot.type === 'shorts' ? 1.1 : 1);
  const topType = top.type || (bot.type === 'dress' ? 'dress' : top.collar && top.color !== bot.color ? 'shirt' : 'jumper');
  const topCol = top.color;
  const boots = !barefoot && (ch.shoeType ? ch.shoeType === 'boots' : (r.child && (() => { const c = shoe.replace('#', ''); const v = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); return Math.max(...v) - Math.min(...v) > 90; })()));
  const farC = (c) => (flat ? c : mix(c, SH(c), 0.3));
  const has = (k) => !p.parts || p.parts.includes(k);
  const muteStack = [];
  const mute = (k) => { if (!has(k)) muteStack.push(I.take()); };
  const unmute = (k) => { if (!has(k)) { I.take(); I.emit(muteStack.pop()); } };
  const part = (k, fn, onOff) => { if (onOff === true) return unmute(k); if (onOff === false) return mute(k); mute(k); fn(); unmute(k); };
  const bodyMid = r.spineAt(0.5);
  let hangLap = false;

  // ---- cast shadow (flat shape on the ground)
  if (!p.noLegs && (!p.parts || p.parts.includes('shadow')) && p.shadow !== false && !p.sil && (!r.sitting || p.plant)) {
    const feet = [r.legN[2][0], r.legF[2][0]];
    const x0 = Math.min(...feet) - u * 0.25, x1 = Math.max(...feet) + u * 0.32;
    const cx = (x0 + x1) / 2 + u * 0.1, rx = (x1 - x0) / 2 + u * 0.12;
    if (p.shadow === 'strokes') {
      line([[x0 - u * 0.1, p.y + 1], [cx + rx * 0.3, p.y + 1.5]], 3.4 * sc, { taper: [0.25, 0.25] });
      line([[cx + rx * 0.45, p.y + 1], [x1 + u * 0.15, p.y + 1]], 3.2 * sc, { taper: [0.25, 0.25] });
    } else I.fill(I.ell(cx, p.y + u * 0.012, rx, u * 0.065, 22), tc ? mix('#1a1420', tc[0], 0.2) : '#1a1420', { wob: 0.4, op: 0.26 });
  }

  // ---- seated: a contact shadow on the seat under the hips (the figure sits ON it)
  if (r.sitting && !p.plant && p.seatShadow !== false && !p.sil && !p.noLegs && (!p.parts || p.parts.includes('torso'))) {
    const sy = r.hip[1] + u * (r.child ? 0.1 : 0.13) + u * 0.01;
    I.fill(I.ell(r.hip[0] - dir * u * 0.08, sy, u * (0.42 + 0.12 * (1 - T)), u * 0.05, 18), tc ? mix('#1a1420', tc[0], 0.2) : '#1a1420', { wob: 0.1, op: 0.3 });
  }
  // ---- shoes / bare feet
  const drawShoe = (leg, far, isN) => {
    const [, k, a] = leg;
    const bare = barefoot;
    const col0 = bare ? skin : shoe;
    const col = far ? farC(col0) : col0;
    // the foot's own turn: toes out a little
    const fy = (r.yaw + (isN ? -1 : 1) * r.nl * -12) * D;
    const fx = Math.sin(fy); // horizontal extent of the foot on the page
    const fore = Math.max(0.36, Math.abs(fx));
    const fdir = Math.abs(fx) < 0.2 ? dir : Math.sign(fx);
    const L = u * (r.child ? 1.45 : 1.72) * (bare ? 0.8 : 1) * fore;
    const lift = r.sitting && !p.plant ? 0 : clamp(p.y - a[1], 0, u * 0.6);
    const shinA = Math.atan2((a[0] - k[0]) * dir, a[1] - k[1]);
    let pitch = 0;
    if (r.sitting && !p.plant) pitch = clamp(-shinA * 0.6 + 0.12, -0.3, 0.9);
    else if (lift > u * 0.02) pitch = Math.asin(clamp(lift / (L * 0.24 + u * 0.05), 0, 0.97));
    else if (!r.sitting && shinA > 0.12) pitch = -clamp((shinA - 0.1) * 0.9, 0, 0.32); // heel strike: toe up
    if (!r.sitting && shinA < -0.9) pitch = Math.max(pitch, -shinA - 0.9 + 0.2);
    if (p.sit != null && p.plant && shinA < -0.9) pitch = Math.max(pitch, 1.1);
    if (back) pitch = -pitch * 0.4;
    const h = r.child ? 1.05 : 1;
    const base = bare
      ? [[-0.07, -0.12], [-0.1, -0.06], [-0.1, 0.01], [-0.03, 0.028], [0.14, 0.028], [0.21, 0.014], [0.23, -0.018], [0.19, -0.05], [0.1, -0.075], [0.03, -0.1], [0.0, -0.14]]
      : [[-0.09, -0.13 * h], [-0.115, -0.07], [-0.11, 0.015], [-0.02, 0.03], [0.15, 0.03], [0.215, 0.014], [0.235, -0.03], [0.2, -0.078], [0.12, -0.1], [0.04, -0.12 * h], [0.0, -0.15 * h]];
    const pts = base.map(([x, y]) => { const q = rot([x * L * fdir, y * u], pitch * fdir); return [a[0] + q[0], a[1] + q[1]]; });
    cel(pts, col, { w: W.line, shade: SH(col, bare ? 0.2 : 0.3), mode: modeOf(col0), k: 0.5 * sc, wob: 0.2 });
    if (!bare) {
      line([pts[2], pts[3], pts[4], pts[5]], W.line * 1.3, { taper: [0.15, 0.3], wob: 0 });
      if (!r.child && !boots && fore > 0.5) {
        // laces / instep and a toe-cap line
        line([lerp2(pts[9], pts[8], 0.15), lerp2(pts[8], pts[7], 0.35)], W.fold, { color: SH(col, 0.5), taper: [0.3, 0.3] });
        line([lerp2(pts[7], pts[6], 0.1), lerp2(pts[4], pts[5], 0.4)], W.fold, { color: mix(col, '#ffffff', 0.25), taper: [0.3, 0.3], op: 0.8 });
      }
    } else if (fore > 0.45) {
      // toes: two little ticks at the front
      [0.18, 0.2].forEach((x, i) => { const q = rot([x * L * fdir, (-0.02 - i * 0.025) * u], pitch * fdir); line([add(a, q), add(add(a, q), [fdir * u * 0.03, u * 0.01])], W.fine, { taper: [0.3, 0.3], color: SH(skin, 0.5) }); });
    }
    return pts;
  };

  // ---- legs
  const drawLeg = (leg, far, o = {}) => {
    const [h, k, a] = leg;
    const pants = bot.type === 'pants';
    drawShoe(leg, far, !far);
    const shinV = norm(sub(a, k));
    const ank = add(a, shinV, -u * 0.1);
    const body = add(bodyMid, [0, u * 0.3]);
    if (pants) {
      const col = far ? farC(bot.color) : bot.color;
      // trouser leg: thigh swells a touch, knee narrows, the hem sits on the shoe
      const knee = lerp2(h, k, 1);
      const deco = () => {
        if (flat) return;
        // knee bunching and tension folds, the break above the shoe, a thigh crease, a slanted pocket
        bunch(h, k, ank, pantsR, W.fold, { n: 2 });
        const hb = add(ank, shinV, -pantsR * 0.75), nx = [-shinV[1], shinV[0]];
        fold([add(hb, nx, -pantsR * 0.7), add(add(hb, nx, -pantsR * 0.15), shinV, pantsR * 0.3), add(add(hb, nx, pantsR * 0.2), shinV, -pantsR * 0.05), add(add(hb, nx, pantsR * 0.55), shinV, pantsR * 0.25)], W.fold, { taper: [0.3, 0.3] });
        const tl = len(sub(k, h));
        if (tl > u * 0.5) { const tv = norm(sub(k, h)), nn = [-tv[1] * dir, tv[0] * dir]; fold([add(lerp2(h, k, 0.3), nn, pantsR * 0.3), add(lerp2(h, k, 0.62), nn, pantsR * 0.42)], W.fold * 0.85); }
        if (len(sub(ank, k)) > u * 0.6) drop(k, ank, pantsR, -dir, W.fold * 0.8, 0.3, 0.62);
        if (!r.back && T > 0.2) fold([add(h, [dir * pantsR * 0.9, -pantsR * 0.2]), add(h, [dir * pantsR * 0.45, pantsR * 0.55])], W.fold * 0.9, { taper: [0.1, 0.4] });
      };
      tube([h, lerp2(h, knee, 0.5), knee, ank], [pantsR * 1.14, pantsR * 1.02, pantsR * 0.9, pantsR * 0.84], col, { w: W.line, shade: SH(col), mode: modeOf(bot.color), body, rootInk: o.rootInk, hemW: W.line * 0.9, inner: deco });
    } else {
      const col0 = bot.socks || skin, col = far ? farC(col0) : col0;
      const calf = lerp2(k, ank, 0.32);
      if (hangLap && (bot.type === 'dress' || bot.type === 'skirt')) {
        // a long skirt/dress in a low pose: the cloth runs from the hip over the thigh to the knee; bare leg only below
        tube([k, calf, ank], [legR * 0.82, legR * 0.88, legR * 0.58], col, { w: W.line, shade: SH(col), mode: modeOf(col0), body, rootInk: false });
        const gc = far ? farC(bot.color) : bot.color;
        tube([h, lerp2(h, k, 0.55), add(k, norm(sub(k, h)), pantsR * 0.35)], [pantsR * 1.3, pantsR * 1.25, pantsR * 1.15], gc, { w: W.line, shade: SH(gc), mode: modeOf(gc), body, rootInk: o.rootInk, hemW: W.hem, hemRound: 0.9, inner: () => { if (!flat) drop(h, k, pantsR * 1.2, dir, W.fold * 0.85, 0.25, 0.75); } });
      } else tube([h, k, calf, ank], [legR * 1.25, legR * 0.8, legR * 0.88, legR * 0.58], col, { w: W.line, shade: SH(col), mode: modeOf(col0), body, rootInk: o.rootInk, inner: () => { if (!flat && bot.socks) bunch(h, k, ank, legR, W.fine, { n: 1 }); } });
      if (bot.type === 'shorts') {
        const sh = lerp2(h, k, 0.55);
        const scol = far ? farC(bot.color) : bot.color;
        tube([h, sh], [pantsR * 1.2, pantsR * 1.15], scol, { w: W.line, shade: SH(scol), mode, body, rootInk: o.rootInk });
      }
    }
    if (boots) {
      const col = far ? farC(shoe) : shoe;
      const top0 = lerp2(a, k, 0.5);
      const g = tube([add(a, shinV, -u * 0.05), top0], [pantsR * 1.02, pantsR * 1.12], col, { w: W.line, shade: SH(col, 0.28), mode, hemW: W.line, rootInk: true });
      if (!flat) line([lerp2(g.c[0], g.c[g.c.length - 1], 0.2), lerp2(g.c[0], g.c[g.c.length - 1], 0.8)].map((q) => add(q, [-shinV[1], shinV[0]], -pantsR * 0.45 * dir)), W.hem * 1.4, { color: mix(col, '#ffffff', 0.55), taper: [0.3, 0.3] });
    }
  };

  // ---- arms
  const drawArm = (c, far, hp, hold, angO, stick) => {
    const [sh, el, wr] = c;
    const sleeve = top.sleeve || 'long';
    const col = far ? farC(topCol) : topCol;
    const sk = far ? farC(skin) : skin;
    const fv = norm(sub(wr, el)), flen = len(sub(wr, el));
    const body = r.spineAt(0.6);
    let ang = Math.atan2(fv[1], fv[0]) / D;
    if (stick) { ang = dir > 0 ? 0 : 180; ang += dir * 12; }
    if (angO != null) ang = angO;
    if (sleeve === 'long') {
      const cuff = add(el, fv, flen * 0.84);
      tube([add(el, fv, flen * 0.6), wr], [limbR * 0.66, limbR * 0.58], sk, { w: W.line * 0.9, shade: SH(sk), hemW: 0, rootInk: false });
      // the sleeve: a rounded shoulder cap, fuller upper arm, cuff
      const knit = topType === 'jumper' || topType === 'cardigan';
      const deco = () => {
        if (flat) return;
        // elbow bunching, a drop fold from the shoulder, the cuff edge (+ ribbing for knits, a button for shirts)
        bunch(sh, el, cuff, limbR * 1.28, W.fold, { n: 2 });
        const uv = norm(sub(el, sh));
        if (len(sub(el, sh)) > u * 0.3) drop(sh, el, limbR * 1.3, dir * (far ? -1 : 1), W.fold * 0.85, 0.2, 0.62);
        const nx = [-fv[1], fv[0]], cb = add(cuff, fv, -limbR * (knit ? 0.8 : 0.5));
        fold([add(cb, nx, limbR * 1.2), add(cb, nx, -limbR * 1.2)], W.fold, { taper: [0.1, 0.1] });
        if (knit) for (let q = -2; q <= 2; q++) fold([add(add(cb, nx, q * limbR * 0.36), fv, limbR * 0.12), add(add(cb, nx, q * limbR * 0.36), fv, limbR * 0.62)], W.fine * 0.8, { taper: [0.2, 0.2], wob: 0 });
        if (topType === 'shirt') I.fill(I.ell(...add(add(cuff, fv, -limbR * 0.25), nx, limbR * 0.5), limbR * 0.13, limbR * 0.13, 6), SH(col, 0.45), { wob: 0 });
        void uv;
      };
      tube([sh, lerp2(sh, el, 0.5), el, cuff], [limbR * 1.5, limbR * 1.34, limbR * 1.2, limbR * 1.1], col, { w: W.line, shade: SH(col), mode: modeOf(topCol), body, hemW: W.hem, inner: deco });
    } else {
      tube([sh, el, add(el, fv, flen * 0.45), wr], [limbR * 1.0, limbR * 0.8, limbR * 0.78, limbR * 0.58], sk, { w: W.line, shade: SH(sk), body });
      if (sleeve === 'short') tube([sh, lerp2(sh, el, 0.5)], [limbR * 1.5, limbR * 1.36], col, { w: W.line, shade: SH(col), mode, body, hemW: W.hem });
    }
    const hs = u * (r.child ? 0.027 : 0.031) * (ch.handScale || 1);
    const obj = stick ? stickFn([wr[0] + dir * (stick.lean ?? 6) * s, p.y], dir, u, sc, stick.color) : hold === 'stick' ? stickFn([wr[0] + dir * 6 * s, p.y], dir, u, sc) : hold;
    let flip = (dir > 0) !== !far;
    // front-ish views: a hanging hand curls in toward the thigh, not out to the side
    const sa = Math.sin(ang * D);
    if (T < 0.75 && sa > 0.55 && !stick && (!hp || hp === 'relaxed')) {
      const vx = -Math.cos(ang * D) * 0 - sa; // screen x of the hand's +v axis when not flipped
      flip = vx * (bodyMid[0] - wr[0]) < 0;
    }
    if (hp === 'none') return;
    hand(wr[0], wr[1], ang, hs, hp || 'relaxed', { contour: W.line, lw: W.fold, skin: sk, flip, object: obj, objectSkin: p.objectSkin, thumbFront: back ? far : !far, s: sc, child: r.child, age: ch.head.age, sil: flat });
  };

  // ---- torso geometry: rows [t (fraction of torso length), frontHalfW, profFront, profBack] in u
  const child = r.child;
  const bd = B * (child ? 0.9 : 1);
  const bust = ch.bust ?? 0;
  const rows = child
    ? [[0, 0.3, 0.24, -0.3], [0.28, 0.31, 0.36, -0.24], [0.55, 0.32, 0.33, -0.24], [0.8, 0.34, 0.28, -0.26], [0.92, 0.36, 0.2, -0.24], [0.975, 0.28, 0.12, -0.18], [1.0, 0.15, 0.09, -0.12]]
    : [[0, 0.35, 0.26, -0.33], [0.24, 0.31, 0.26, -0.25], [0.5, 0.33, 0.33 + bust * 0.4, -0.28], [0.7, 0.41, 0.4 + bust, -0.33], [0.89, 0.48, 0.3, -0.34], [0.965, 0.42, 0.17, -0.25], [1.0, 0.17, 0.1, -0.13]];
  const hang = topType === 'coat' ? 'coat' : bot.type === 'dress' ? 'dress' : bot.type === 'skirt' ? 'skirt' : null;
  const frame = (t) => { const c = r.spineAt(t), tg = r.tanAt(t); return { c, f: [-tg[1] * dir, tg[0] * dir] }; };
  const Pt = (t, a) => { const { c, f } = frame(t); return add(c, f, a * u * bd); };
  const cT = Math.sqrt(Math.max(0, 1 - T * T));
  const ext = (fw, d) => Math.sign(d || 1) * Math.sqrt((fw * cT) ** 2 + (d * T) ** 2);
  const side = (sgn) => rows.map(([t, fw, pf, pb]) => Pt(t, sgn > 0 ? ext(fw, Math.max(pf, fw * 0.3)) : -Math.abs(ext(fw, pb))));
  const nearS = side(1), farS = side(-1);
  const crotchD = u * (child ? 0.2 : 0.24);
  const crotch = (sgn) => { const fw = 0.22, pf = 0.14, pb = -0.26; const a = sgn > 0 ? ext(fw, pf) : -Math.abs(ext(fw, pb)); const f = [-r.up[1] * dir, r.up[0] * dir]; return add(add(r.hip, r.up, -crotchD), f, a * u * bd); };

  // hanging garment (standing: straight down with flare; seated / kneeling: over the lap)
  let hangPoly = null, hangFolds = [], hangHem = null, hangArcs = [];
  hangLap = false;
  if (hang) {
    const hemL = { coat: child ? 0.62 : 0.78, skirt: 1.0, dress: child ? 1.0 : 1.7 }[hang] * r.thigh;
    const fl = { coat: 0.1, skirt: 0.17, dress: 0.2 }[hang] * u;
    const thighUp = (leg) => Math.abs(Math.atan2((leg[1][0] - leg[0][0]) * dir, leg[1][1] - leg[0][1])) > 0.9;
    const lap = r.sitting || thighUp(r.legN) || thighUp(r.legF);
    hangLap = lap;
    if (!lap) {
      const nB = nearS[0], fB = farS[0];
      const xs = [r.legN[1][0], r.legF[1][0], r.legN[2][0], r.legF[2][0]];
      const spread = (Math.max(...xs) - Math.min(...xs)) * 0.35;
      const front = dir > 0 ? Math.max(nB[0], fB[0]) : Math.min(nB[0], fB[0]), rear = dir > 0 ? Math.min(nB[0], fB[0]) : Math.max(nB[0], fB[0]);
      const yH = Math.min(Math.max(nB[1], fB[1]) + hemL, r.ground - u * 0.06);
      let nH = [front + dir * (fl + spread * 0.5), yH], fH = [rear - dir * (fl + spread * 0.5), yH - u * 0.02];
      const top0 = [fB, nB].sort((a, b) => a[0] - b[0]);
      const wL = top0[0], wR = top0[1];
      if (fH[0] > nH[0]) { const t = fH; fH = nH; nH = t; } // hem runs left → right like the waist
      // hem: a gentle wave with 2 scallops (the cloth swings)
      const hemPts = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; const q = lerp2(fH, nH, t); hemPts.push([q[0], q[1] + Math.sin(t * Math.PI * 2 + 0.5) * u * 0.018 + Math.sin(t * Math.PI) * u * 0.03]); }
      hangPoly = [wL, lerp2(wL, fH, 0.55), ...hemPts, lerp2(wR, nH, 0.55), wR].map((q, i, arr) => (dir > 0 ? q : q));
      hangHem = hemPts;
      hangFolds = [[lerp2(wL, wR, 0.3), hemPts[2]], [lerp2(wL, wR, 0.62), hemPts[4]], [lerp2(wL, wR, 0.82), lerp2(hemPts[5], hemPts[6], 0.4)]];
    } else {
      const f = [dir, 0], fx = (q) => q[0] * dir;
      const kFront = fx(r.legN[1]) >= fx(r.legF[1]) ? r.legN[1] : r.legF[1];
      const kBack = kFront === r.legN[1] ? r.legF[1] : r.legN[1];
      const aFront = kFront === r.legN[1] ? r.legN[2] : r.legF[2];
      const hFront = kFront === r.legN[1] ? r.legN[0] : r.legF[0];
      const floor = p.plant || !r.sitting ? r.ground : 1e9;
      const drop = hang === 'dress' ? r.shin * 0.92 : hang === 'skirt' ? u * 0.4 : u * 0.12;
      const hemFY = Math.min(kFront[1] + drop, floor - u * (r.sitting ? 0.02 : 0.07));
      const hemBY = Math.min(Math.max(kBack[1], r.hip[1]) + drop * 0.9, floor - u * 0.02);
      const tv = norm(sub(kFront, hFront));
      const lapTop = (t) => add(lerp2(hFront, kFront, t), [tv[1] * dir, -tv[0] * dir].map((v) => v * -1), pantsR * 1.15);
      const kneeCap = add(add(kFront, f, pantsR * 1.1), [0, -pantsR * 0.6]);
      const hemF = [kFront[0] + dir * (pantsR * 1.25 + (hemFY - kFront[1]) * 0.12), hemFY];
      const backX = r.hip[0] - dir * u * 0.34;
      const hemB = [Math.min(fx(kBack) - pantsR, fx(r.hip) - u * 0.36) * dir, hemBY];
      const hemPts = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; const q = lerp2(hemF, hemB, t); hemPts.push([q[0], q[1] + Math.sin(t * Math.PI * 3) * u * 0.015 + Math.sin(t * Math.PI) * u * 0.02]); }
      hangPoly = [add(farS[0], [0, -u * 0.04]), add(nearS[0], [0, -u * 0.04]), lapTop(0.35), lapTop(0.7), kneeCap, lerp2(kneeCap, hemF, 0.5), ...hemPts, [backX, r.hip[1] + u * 0.14]];
      hangHem = hemPts;
      const kc = add(kFront, [0, pantsR * 0.2]);
      hangFolds = [[kc, lerp2(hemPts[1], hemPts[2], 0.5)], [add(kc, f, -pantsR * 0.5), hemPts[3]], [lerp2(r.hip, kFront, 0.45), add(kFront, [0, -pantsR * 1.2])]];
      // the far knee shows through the cloth (a bump line) and folds hang from both knees to the hem
      const kb = kBack;
      if (Math.abs(fx(kb) - fx(kFront)) < u * 0.9) {
        hangArcs.push([add(kb, [-dir * pantsR * 1.1, -pantsR * 0.1]), add(kb, [-dir * pantsR * 0.3, -pantsR * 1.05]), add(kb, [dir * pantsR * 0.8, -pantsR * 0.75])]);
        hangFolds.push([add(kb, [-dir * pantsR * 0.6, pantsR * 0.4]), lerp2(hemPts[4], hemPts[5], 0.5)]);
      }
      if (p.ride) {
        // on a bike: the cloth lies over the thighs, drops in a V between the knees and flutters back off the seat
        const fl = p.ride.flutter ?? 0.4;
        const kN0 = r.legN[1], kF0 = r.legF[1];
        const hemF2 = add(kneeCap, [dir * pantsR * 0.2, u * (hang === 'skirt' ? 0.16 : 0.3)]);
        const vee = add(lerp2(kN0, kF0, 0.5), [-dir * u * 0.08, u * (hang === 'skirt' ? 0.34 : 0.55)]);
        const under = add(r.hip, [-dir * u * 0.02, u * 0.24]);
        // the loose back of the skirt streams off the saddle: a wavy lower edge, a narrower wavy upper edge
        const flc = Math.min(1, fl), Lf = 0.16 + 0.34 * flc, lift = 0.04 + 0.2 * flc;
        const base = (t) => add(r.hip, [-dir * u * (0.12 + Lf * t), u * (0.24 - lift * t)]);
        const low = [], upp = [];
        for (let i = 1; i <= 6; i++) { const t = i / 6; low.push(add(base(t), [0, u * (i % 2 ? 0.05 : -0.025) * (0.4 + flc)])); }
        for (let i = 6; i >= 1; i--) { const t = i / 6; upp.push(add(base(t * 0.9), [dir * u * 0.02, -u * ((0.1 + 0.05 * flc) * (1 - 0.6 * t)) + u * (i % 2 ? -0.025 : 0.015) * flc])); }
        hangPoly = [add(farS[0], [0, -u * 0.04]), add(nearS[0], [0, -u * 0.04]), lapTop(0.35), lapTop(0.7), kneeCap, hemF2, lerp2(hemF2, vee, 0.5), vee, under, ...low, ...upp, add(r.hip, [-dir * u * 0.3, -u * 0.06])];
        hangFolds = [[lapTop(0.3), kneeCap], [add(kneeCap, [-dir * pantsR, pantsR]), vee], [add(under, [0, -u * 0.04]), low[3]], [add(r.hip, [-dir * u * 0.2, u * 0.08]), low[5]], [add(r.hip, [-dir * u * 0.25, 0]), upp[1]]];
        hangArcs = [];
      }
      void aFront;
    }
  }

  // --- draw order: shadow, far arm, far leg, near leg, [hanging garment], neck, torso, details, near arm, head
  const stickN = p._stickN, stickF = p._stickF;
  const farHidden = p.hideF ?? (T > 0.9 && !p.reachF && Math.abs((p.armF || [-5, 12])[0]) < 25 && !p.holdF && !stickF);
  // hands brought up to the face (chin in hands, hand to mouth) are in front of it: draw those arms after the head
  const nearFace = (w) => len(sub(w, r.headC)) < r.R * 1.7 && w[1] > r.headC[1] - r.R * 0.2;
  const faceN = p.armOver ?? nearFace(r.armN[2]);
  const faceF = p.faceF ?? nearFace(r.armF[2]);
  if (!farHidden && !faceF) part('armF', () => drawArm(r.armF, true, p.handF, p.holdF, p.handAngF, stickF));
  if (p.behind) p.behind(r);
  const thighUpN = Math.abs(Math.atan2((r.legN[1][0] - r.legN[0][0]) * dir, r.legN[1][1] - r.legN[0][1])) > 1.0;
  const nearAfter = (r.sitting || thighUpN) && !hang;
  if (!p.noLegs) { part('legF', () => drawLeg(r.legF, true)); if (!nearAfter) part('legN', () => drawLeg(r.legN, false)); }
  mute('torso');
  // neck: from inside the collar up under the jaw, lined up with the neck stub head.js draws
  const hyS = Math.sin(r.headYaw * D), hyC = Math.cos(r.headYaw * D);
  const NI = HEAD.neckInfo ? HEAD.neckInfo(ch.head, s) : { hw: r.R * (child ? 0.24 : 0.27), hd: r.R * (child ? 0.27 : 0.32) };
  const nHalf = Math.hypot(NI.hw * hyC, NI.hd * hyS);
  const nt = [r.headC[0] - 0.2 * hyS * r.R, r.headC[1] + (r.HM.cb - 0.05) * r.R];
  const nb = add(r.spineAt(0.95), r.chestUp, -u * 0.04);
  tube([nb, nt], [nHalf * 1.22, nHalf], skin, { w: W.line, shade: SH(skin), hemW: 0, lx: 0, ly: Math.max(4, len(sub(nt, nb)) * 0.5), k: 1 });
  const garmentCol = hang === 'coat' ? topCol : bot.color;
  if (hangPoly && !p.noLegs) {
    const g = cel(hangPoly, garmentCol, { w: W.contour, shade: SH(garmentCol), mode: modeOf(garmentCol), k: 1.3 * sc, wob: 0.3 });
    void g;
    if (!flat) hangArcs.forEach((pts) => fold(pts, W.fold, { taper: [0.3, 0.3] }));
    if (!flat) hangFolds.forEach(([a, b], i) => fold([lerp2(a, b, 0.12 + 0.1 * (i % 2)), lerp2(a, b, 0.6 + 0.05 * i), b], W.fold * (i % 2 ? 0.85 : 1), { taper: [0.7, 0.05] }));
  }
  if (nearAfter && !p.noLegs) { part('torso', () => {}, true); part('legN', () => drawLeg(r.legN, false, { rootInk: false })); part('torso', () => {}, false); }

  // torso polygon
  const torso = (hang || bot.type === 'dress') ? nearS.concat(farS.slice().reverse()) : [crotch(1)].concat(nearS, farS.slice().reverse(), [crotch(-1)]);
  const tcol = topType === 'dress' || bot.type === 'dress' ? (top.color || bot.color) : topCol;
  const wobT = WOB(torso, 0.25);
  const hemT = { shirt: 0.14, jumper: -0.04, cardigan: -0.02, coat: -9, dress: 0.36 }[topType] ?? 0.1;
  const knitTop = topType === 'jumper' || topType === 'cardigan';
  cel(wobT, tcol, {
    w: 0, wob: 0, shade: SH(tcol), mode: modeOf(tcol), k: 2.1 * sc,
    inner: () => {
      if (hemT > -1 && topType !== 'coat') {
        const bc = bot.color;
        const a = Pt(hemT, 1.4), b = Pt(hemT, -1.4), sag = add(lerp2(a, b, 0.5), r.up, -u * 0.03);
        const lowPoly = [a, sag, b, add(b, r.up, -u * 2), add(a, r.up, -u * 2)];
        if (topType !== 'dress') cel(lowPoly, bc, { w: 0, wob: 0, shade: SH(bc), mode: modeOf(bc), k: 1.2 * sc });
        const hemLine = [Pt(hemT, -0.75), lerp2(Pt(hemT, -0.75), Pt(hemT, 0.75), 0.5), Pt(hemT, 0.75)].map((q, i) => (i === 1 ? add(q, r.up, -u * 0.025) : q));
        line(hemLine, topType === 'shirt' && top.belt !== false ? W.hem * 1.4 : W.hem, { taper: [0.05, 0.05], color: topType === 'dress' ? SH(tcol, 0.4) : INK });
        if (!flat) {
          if (knitTop) {
            // ribbed hem band: a second line and rib ticks
            fold([Pt(hemT + 0.09, -0.62), Pt(hemT + 0.1, 0), Pt(hemT + 0.09, 0.62)], W.fold, { taper: [0.1, 0.1] });
            for (let q = -0.5; q <= 0.52; q += 0.125) fold([Pt(hemT + 0.085, q), Pt(hemT + 0.01, q + 0.01)], W.fine * 0.75, { taper: [0.2, 0.2], wob: 0 });
          }
          if (topType === 'shirt') {
            // tuck folds bunching into the waistband (varied lengths), belt buckle
            [[-0.3, 0.13], [-0.1, 0.2], [0.12, 0.1], [0.3, 0.17]].forEach(([a0, l]) => fold([Pt(hemT + 0.02, a0), Pt(hemT + l, a0 + 0.04)], W.fold, { taper: [0.1, 0.6] }));
            if (!back && top.belt !== false && T < 0.8) I.fill(I.rectPts(...add(Pt(hemT, 0.04 + 0.15 * T), [-u * 0.035, -u * 0.03]), u * 0.07, u * 0.055), SH(bc, 0.5), { wob: 0 });
          }
          // trousers: fly / seat seam, waistband
          if (bot.type === 'pants' && T < 0.85) fold([Pt(hemT - 0.03, back ? -0.02 : 0.05), Pt(-0.12, back ? -0.03 : 0.08)], W.fold, { taper: [0.1, 0.4] });
        }
      }
      if (topType === 'cardigan' && !flat && !back) {
        const px = 0.02 + 0.22 * T;
        line([Pt(0.97, px - 0.02), Pt(0.6, px + 0.02), Pt(hemT + 0.02, px + 0.03)], W.hem, { taper: [0.1, 0.1] });
        [0.78, 0.55, 0.3].forEach((t) => I.fill(I.ell(...Pt(t, px + 0.07), u * 0.024, u * 0.024, 8), SH(tcol, 0.6), { wob: 0 }));
        // patch pocket
        fold([Pt(0.3, px + 0.16), Pt(0.3, px + 0.34), Pt(0.1, px + 0.34)], W.fold, { taper: [0.05, 0.3] });
      }
      if (topType === 'coat' && !flat && !back) {
        const px = -0.02 + 0.2 * T;
        line([Pt(0.9, px), Pt(0.4, px + 0.02), Pt(-0.1, px + 0.03)], W.hem, { taper: [0.1, 0.1] });
        [0.72, 0.45, 0.18].forEach((t) => I.fill(I.ell(...Pt(t, px + 0.07), u * 0.028, u * 0.028, 8), SH(tcol, 0.55), { wob: 0 }));
        fold([Pt(0.3, px + 0.2), Pt(0.28, px + 0.36)], W.fold, { taper: [0.1, 0.1] });
      }
      if (topType === 'shirt' && !flat && !back) {
        // placket with buttons, a breast pocket on the near side
        const px = 0.02 + 0.18 * T;
        fold([Pt(0.94, px), Pt(0.55, px + 0.01), Pt(hemT + 0.03, px + 0.01)], W.fold, { taper: [0.05, 0.2] });
        [0.8, 0.6, 0.4].forEach((t) => I.fill(I.ell(...Pt(t, px + 0.045), u * 0.016, u * 0.016, 6), SH(tcol, 0.45), { wob: 0 }));
        if (T < 0.85) fold([Pt(0.8, px - 0.34 + 0.25 * T), Pt(0.62, px - 0.34 + 0.25 * T), Pt(0.62, px - 0.14 + 0.2 * T)], W.fine, { taper: [0.05, 0.2] });
      }
      if (!flat) {
        if (back) {
          // seen from behind: shoulder blades, the spine's crease, a fold across the small of the back
          [-1, 1].forEach((sg) => fold([Pt(0.86, sg * 0.3 * cT - 0.06 * T), Pt(0.74, sg * 0.22 * cT - 0.08 * T), Pt(0.64, sg * 0.12 * cT - 0.1 * T)], W.fold, { taper: [0.3, 0.5] }));
          fold([Pt(0.92, -0.05 * T), Pt(0.55, -0.08 * T)], W.fold * 0.85, { taper: [0.4, 0.6] });
          fold([Pt(0.3, -0.3 * cT), Pt(0.26, 0.05), Pt(0.32, 0.28 * cT)], W.fold * 0.8, { taper: [0.5, 0.5] });
          if (topType === 'coat') fold([Pt(0.25, -0.14 * T), Pt(-0.2, -0.16 * T)], W.fold, { taper: [0.2, 0.2] });
        } else {
          // tension folds from the armpit across the chest (varied length), drop folds from the shoulder,
          // a waist crease where the body bends
          fold([Pt(0.84, 0.32 - 0.1 * T), Pt(0.7, 0.14), Pt(0.6, 0.03)], W.fold, { taper: [0.2, 0.6] });
          fold([Pt(0.8, 0.36 - 0.1 * T), Pt(0.72, 0.28)], W.fold * 0.9, { taper: [0.2, 0.6] });
          fold([Pt(0.9, -0.28 * cT - 0.1 * T), Pt(0.7, -0.24 * cT - 0.12 * T), Pt(0.5, -0.26 * cT - 0.12 * T)], W.fold * 0.85, { taper: [0.4, 0.6] });
          if (T > 0.3) fold([Pt(0.44, 0.42 * T), Pt(0.36, 0.22 * T), Pt(0.32, 0.12 * T)], W.fold, { taper: [0.3, 0.5] });
          if (Math.abs(r.stoop) > 0.2 || T > 0.5) fold([Pt(0.3, 0.3 * T + 0.1), Pt(0.27, 0.12)], W.fold * 0.85, { taper: [0.3, 0.5] });
          if (child) fold([Pt(0.38, 0.25), Pt(0.3, 0.05)], W.fold, { taper: [0.3, 0.5] });
        }
      }
    },
  });
  const nS = wobT.length;
  if (hang || bot.type === 'dress') closedLine(wobT, W.contour, { wob: 0 });
  else {
    line(wobT.slice(nS - 1).concat(wobT.slice(0, nS - 1)).slice(0, nS), W.contour, { taper: [0.06, 0.06], wob: 0 });
    const thighA = (leg) => Math.abs(Math.atan2((leg[1][0] - leg[0][0]) * dir, leg[1][1] - leg[0][1]));
    if (T > 0.35 && (r.sitting || Math.max(thighA(r.legN), thighA(r.legF)) > 0.6)) {
      const bk = wobT[nS - 1], fr = wobT[0], mid = lerp2(bk, fr, 0.45);
      line([bk, add(mid, [0, u * 0.05]), lerp2(bk, fr, 0.8)], W.line, { taper: [0.05, 0.5], wob: 0 });
    }
  }

  const nk = r.neck;
  if (back) {
    // back of the collar / neckline
    if (top.collar) cel([add(nk, [-u * 0.15, u * 0.02]), add(nk, [0, -u * 0.05]), add(nk, [u * 0.15, u * 0.02]), add(nk, [u * 0.12, u * 0.06]), add(nk, [-u * 0.12, u * 0.06])], top.collar, { w: W.hem, shade: SH(top.collar, 0.18), k: 0.4 });
    else if (!flat) line([add(nk, [-u * 0.13, u * 0.01]), add(nk, [0, -u * 0.02]), add(nk, [u * 0.13, u * 0.01])], W.hem, { taper: [0.15, 0.15] });
  } else if (top.collar) {
    const c = top.collar, cw = u * 0.15;
    const f = [dir * T * u * 0.05, 0];
    cel([add([nk[0] - cw, nk[1] - u * 0.01], f), add([nk[0] + dir * u * 0.02, nk[1] + u * 0.13], f), add([nk[0] - cw * 0.1, nk[1] + u * 0.02], f)], c, { w: W.hem, shade: SH(c, 0.18), k: 0.4 });
    cel([add([nk[0] + cw, nk[1] - u * 0.01], f), add([nk[0] + dir * u * 0.02, nk[1] + u * 0.13], f), add([nk[0] + cw * 0.1, nk[1] + u * 0.02], f)], c, { w: W.hem, shade: SH(c, 0.18), k: 0.4 });
  } else if (!flat && (topType === 'jumper' || topType === 'cardigan')) {
    line([add(nk, [-u * 0.13, -u * 0.01]), add(nk, [dir * u * 0.03 * T, u * 0.07]), add(nk, [u * 0.13, -u * 0.01])], W.hem, { taper: [0.15, 0.15] });
  }
  // details see r.back; garments with a back side (apron bows) can draw it, front-only ones return early
  if (top.details && (!back || top.backDetails !== false)) top.details(r);
  if (back && top.backDetails) top.backDetails(r);
  unmute('torso');
  mute('armN');
  if (!faceN) drawArm(r.armN, false, p.handN, p.holdN, p.handAngN, stickN);
  unmute('armN');
  const hp = p.head || {};
  mute('head');
  HEAD.head(ch.head, { x: r.headC[0], y: r.headC[1], s, yaw: hp.yaw ?? r.yaw, pitch: hp.pitch ?? (r.stoop > 0.3 ? -r.stoop * 4 : undefined), look: hp.look, mood: hp.mood, mouth: hp.mouth, blink: hp.blink, neck: 0.01 });
  unmute('head');
  mute('armN');
  if (faceF && !farHidden) part('armF', () => drawArm(r.armF, true, p.handF, p.holdF, p.handAngF, stickF));
  if (faceN) drawArm(r.armN, false, p.handN, p.holdN, p.handAngN, stickN);
  unmute('armN');
  if (p.front) p.front(r);
  if (p.squash) I.emit('</g>');
  if (p.rot) I.emit('</g>');
  return r;
}

// ---- pose presets: spread into a pose, then override: fig(ch, { ...POSE.walk(0.2), x, y, s, yaw })
const POSE = {
  stand: (o = {}) => ({ armN: [4, 12, 5], armF: [-10, 40, 6, 0], curve: 4, ...o }),
  // phase 0..1 through a stride; 0 = near leg forward
  walk: (ph = 0, o = {}) => {
    const a = Math.cos(ph * Math.PI * 2), sw = Math.sin(ph * Math.PI * 2);
    const kN = sw < 0 ? 8 + 40 * (1 - Math.abs(a)) : 5, kF = sw > 0 ? 8 + 40 * (1 - Math.abs(a)) : 5;
    return { legN: [22 * a, kN + (a < 0 ? 16 * -a : 0)], legF: [-22 * a, kF + (a > 0 ? 16 * a : 0)], armN: [-24 * a, 18 + 16 * Math.max(0, -a), 8], armF: [24 * a, 18 + 16 * Math.max(0, a), 6], twist: -8 * a, lean: 6, curve: 4, contra: 0, ...o };
  },
  sit: (o = {}) => ({ sit: 0, legN: [2, 8, 7], legF: [0, 16, 4], reachN: 'thighN', reachF: 'thighF', lean: -4, curve: 14, ...o }),
  kneel: (o = {}) => ({ kneel: true, legN: [80, 80], legF: [-8, 96], lean: 4, curve: 8, reachN: 'kneeN', bendN: -1, armF: [14, 36], handN: 'relaxed', contra: 0, ...o }),
  crouch: (o = {}) => ({ legN: [120, 158, 14], legF: [110, 150, 10], lean: 14, curve: 12, reachN: 'kneeN', bendN: -1, armF: [26, 50], contra: 0, ...o }),
  point: (o = {}) => ({ armN: [95, -8], handN: 'point', lean: 4, curve: -2, ...o }),
  reach: (target, o = {}) => ({ reachN: target, bendN: 1, lean: 8, curve: 6, ...o }),
};

// the scene's light: pull every colour of a character toward an ambient colour (capped at 0.25 so
// figures keep their contrast against the ground); shadows are tinted a little more than lights
function tinted(ch, c, t0) {
  const t = Math.min(0.25, t0);
  const m = (x) => (x && x[0] === '#' && x.length === 7 ? mix(x, c, t) : x);
  const h = { ...ch.head };
  ['skin', 'hair', 'hairLine', 'hairStreak', 'tie', 'moustache', 'beard', 'browCol', 'glasses'].forEach((k) => { if (h[k]) h[k] = m(h[k]); });
  if (h.hat) h.hat = { ...h.hat, color: m(h.hat.color) };
  const bare = ch.shoes && ch.head && ch.shoes === ch.head.skin;
  return { ...ch, _tint: [c, t], head: h, top: ch.top && { ...ch.top, color: m(ch.top.color), collar: m(ch.top.collar) }, bottom: ch.bottom && { ...ch.bottom, color: m(ch.bottom.color), socks: m(ch.bottom.socks) }, shoes: bare ? h.skin : m(ch.shoes) };
}
function silhouette(ch, c) {
  const h = { ...ch.head, skin: c, hair: c, hairLine: null, hairStreak: null, tie: c, moustache: ch.head.moustache ? c : null, beard: ch.head.beard ? c : null, browCol: c, glasses: null, blush: 0, silhouette: true };
  return { ...ch, head: h, top: { ...ch.top, color: c, collar: ch.top && ch.top.collar ? c : null, details: null }, bottom: { ...ch.bottom, color: c, socks: c }, shoes: c };
}
// where a speech-balloon tail should point: just outside the head, above the mouth side
function mouth(r, up = 0.9) { return [r.headC[0] + r.dir * r.R * 0.5 * Math.abs(Math.sin((r.yaw * Math.PI) / 180)), r.headC[1] - r.R * up * 1.3]; }

const POSES = require('./poses')({ fig, rig, POSE });
module.exports = { rig, fig, mix, silhouette, tinted, mouth, POSE, POSES, PROP, duo: POSES.duo };
