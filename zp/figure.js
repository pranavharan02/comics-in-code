// zp/figure.js — a posable full-body figure. Pose = joint angles; the rig turns them into points,
// then draws limbs as capsules, a torso, clothes, shoes, hands and the zp/head at constant ink.
//
// fig(char, pose)
//   char: { head: <head design>, H: height in heads (child ≈ 4.2, adult ≈ 6.2), skin,
//           top: {color, sleeve: 'long'|'short'|'none', collar: color|null, type: 'shirt'|'jumper'|'coat'},
//           bottom: {type: 'pants'|'skirt'|'dress'|'shorts', color}, shoes: color, build: 0.8..1.3 }
//   pose: { x, y (ground point under the hips), s (scale: head radius px / 30),
//           yaw (-90..90, body turn; head uses headYaw ?? yaw), lean (deg, + forward),
//           armN/armF: [shoulderDeg, elbowDeg] near/far arm (0 = hanging, + = forward/up),
//           legN/legF: [hipDeg, kneeDeg] (0 = straight down, + = forward),
//           sit: seat height in px (hips at y - sit) | null,
//           handN/handF: pose name, head: {yaw, pitch, look, mood, mouth}, holdN/holdF: fn(T,s) }
const { I, INK, LW, line, shape, limb } = require('./core');
const HEAD = require('./head');
const { hand } = require('./hand');
const D = Math.PI / 180;

function mix(c1, c2, t) {
  const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = h(c1), b = h(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function rig(ch, p) {
  const s = p.s || 1, R = (ch.head.R || 30) * s;
  const Hh = ch.H || 3.6; // total height in head-heights (ZP: adults ≈ 3.4–4, children ≈ 3)
  const unit = 2.25 * R;   // one head height (skull top to chin)
  const child = Hh < 3.3;
  const Ht = Hh * unit;
  const legL = Ht * (child ? 0.37 : 0.44) * (ch.legs || 1), thigh = legL * 0.5, shin = legL * 0.5;
  const neckL = unit * (child ? 0.04 : 0.08);
  const torsoL = Ht - unit - legL - neckL;
  const armU = Ht * (child ? 0.15 : 0.16), armF = Ht * (child ? 0.14 : 0.15);
  const shW = unit * (child ? 0.34 : 0.4) * (ch.build || 1);
  const hipW = unit * (child ? 0.22 : 0.26) * (ch.build || 1);
  const yaw = p.yaw ?? 0, dir = Math.sign(yaw) || 1, turn = Math.abs(Math.sin(yaw * D));
  const lean = (p.lean || 0) * dir;
  // hips
  const sitting = p.sit != null;
  const hipY = sitting ? p.y - p.sit : p.y - legL * Math.cos(((p.legN || [0, 0])[0]) * D * 0) ;
  const hip = [p.x, sitting ? p.y - p.sit : hipY];
  // torso direction (up, tilted by lean)
  const up = [Math.sin(lean * D), -Math.cos(lean * D)];
  const neck = [hip[0] + up[0] * torsoL, hip[1] + up[1] * torsoL];
  const hOff = neckL + R * 1.22;
  const hFwd = (p.yaw ?? 0) === 0 ? 0 : Math.sign(p.yaw) * Math.abs(Math.sin((p.yaw) * D)) * R * 0.28;
  const headC = [neck[0] + up[0] * hOff + hFwd + (p.headDX || 0) * s, neck[1] + up[1] * hOff + (p.headDY || 0) * s];
  // shoulders: width foreshortens with turn; near side is +dir
  const sw = shW * (1 - 0.8 * turn);
  const perp = [-up[1], up[0]]; // points to screen-right when upright
  const shC = [hip[0] + up[0] * torsoL * 0.93, hip[1] + up[1] * torsoL * 0.93];
  const shN = [shC[0] + perp[0] * sw * dir * (turn > 0.2 ? 0.55 : 1), shC[1] + perp[1] * sw * dir * (turn > 0.2 ? 0.55 : 1)];
  const shF = [shC[0] - perp[0] * sw * dir * (turn > 0.2 ? 0.45 : 1), shC[1] - perp[1] * sw * dir * (turn > 0.2 ? 0.45 : 1)];
  const hw = hipW * (1 - 0.45 * turn);
  const hipN = [hip[0] + perp[0] * hw * dir * 0.8, hip[1] + perp[1] * hw * dir * 0.8];
  const hipF = [hip[0] - perp[0] * hw * dir * 0.8, hip[1] - perp[1] * hw * dir * 0.8];
  // limbs: angles measured from straight down, + rotates toward the facing direction
  const chain = (root, a1, l1, a2, l2) => {
    const A1 = a1 * D * dir, A2 = (a1 + a2) * D * dir;
    const j = [root[0] + Math.sin(A1) * l1, root[1] + Math.cos(A1) * l1];
    const e = [j[0] + Math.sin(A2) * l2, j[1] + Math.cos(A2) * l2];
    return [root, j, e];
  };
  const aN = p.armN || [8, 12], aF = p.armF || [-6, 10];
  const lN = p.legN || [0, 0], lF = p.legF || [0, 0];
  // two-bone IK toward a target point; the elbow bends down/back (bend = +1) or up (-1)
  const ik = (S, T, a, b, bend = 1) => {
    let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
    const maxd = (a + b) * 0.999; if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
    const base = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
    const ang = base + k * bend * dir;
    const E = [S[0] + Math.cos(ang) * a, S[1] + Math.sin(ang) * a];
    return [S, E, [S[0] + dx, S[1] + dy]];
  };
  const armN = p.reachN ? ik(shN, p.reachN, armU, armF, p.bendN ?? 1) : chain(shN, aN[0], armU, aN[1], armF);
  const armF_ = p.reachF ? ik(shF, p.reachF, armU, armF, p.bendF ?? 1) : chain(shF, aF[0], armU, aF[1], armF);
  let legN, legF;
  if (sitting) {
    // thighs forward, shins down to the floor
    const fsh = 0.3 + 0.7 * turn; // thighs pointing at the viewer foreshorten
    const kneeN = [hipN[0] + dir * thigh * fsh * Math.cos((lN[0] || 0) * D), hipN[1] - thigh * Math.sin((lN[0] || 0) * D) + thigh * (1 - fsh) * 0.25];
    const kneeF = [hipF[0] + dir * thigh * fsh * Math.cos((lF[0] || 0) * D), hipF[1] - thigh * Math.sin((lF[0] || 0) * D) + thigh * (1 - fsh) * 0.25];
    legN = [hipN, kneeN, [kneeN[0] + dir * Math.sin((lN[1] || 0) * D) * shin, kneeN[1] + Math.cos((lN[1] || 0) * D) * shin]];
    legF = [hipF, kneeF, [kneeF[0] + dir * Math.sin((lF[1] || 0) * D) * shin, kneeF[1] + Math.cos((lF[1] || 0) * D) * shin]];
    if (p.plant) {
      const low = Math.max(legN[2][1], legF[2][1], p.kneel ? legF[1][1] : -1e9);
      const dy = p.y - low;
      [hip, neck, headC, shC, shN, shF, hipN, hipF].forEach((q) => { q[1] += dy; });
      [armN, armF_, legN, legF].forEach((c) => c.forEach((q) => { q[1] += dy; }));
    }
  } else {
    legN = chain(hipN, lN[0], thigh, lN[1], shin);
    legF = chain(hipF, lF[0], thigh, lF[1], shin);
    // stand on the ground: shift the whole body so the lower foot touches y
    const low = Math.max(legN[2][1], legF[2][1]);
    const dy = p.y - low;
    [hip, neck, headC, shC, shN, shF, hipN, hipF].forEach((q) => { q[1] += dy; });
    [armN, armF_, legN, legF].forEach((c) => c.forEach((q) => { q[1] += dy; }));
  }
  if (p.footN) legN = ik2(hipN, p.footN, thigh, shin, p.kneeN ?? -1, dir);
  if (p.footF) legF = ik2(hipF, p.footF, thigh, shin, p.kneeF ?? -1, dir);
  return { s, R, unit, dir, turn, yaw, up, hip, neck, headC, shN, shF, hipN, hipF, armN, armF: armF_, legN, legF, child, thigh, shin, armU, armFore: armF };
}

function ik2(S, T, a, b, bend, dir) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
  const maxd = (a + b) * 0.999; if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const base = Math.atan2(dy, dx), k = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const ang = base + k * bend * dir;
  return [S, [S[0] + Math.cos(ang) * a, S[1] + Math.sin(ang) * a], [S[0] + dx, S[1] + dy]];
}
function fig(ch0, p) {
  const ch = p.sil ? silhouette(ch0, p.sil) : p.tint ? tinted(ch0, p.tint[0], p.tint[1]) : ch0;
  const r = rig(ch, p);
  const s = r.s, dir = r.dir, u = r.unit;
  const skin = ch.head.skin || '#f6d2b4';
  const top = ch.top || { color: '#5a7fb5', sleeve: 'long' };
  const bot = ch.bottom || { type: 'pants', color: '#2d3140' };
  const shoe = ch.shoes || '#1a1618';
  const limbR = u * (r.child ? 0.045 : 0.062) * (ch.build || 1) * (ch.limbs || 1);
  const legR = u * (r.child ? 0.05 : 0.07) * (ch.build || 1) * (ch.limbs || 1);
  const pantsR = bot.type === 'pants' ? u * 0.095 * (ch.build || 1) : legR;
  const topSh = mix(top.color, '#000000', 0.25);

  const drawLeg = (c, far) => {
    const [h, k, a] = c;
    const col = bot.type === 'pants' ? (far ? mix(bot.color, '#000000', 0.15) : bot.color) : (bot.socks || skin);
    // shoe
    const toe = [a[0] + dir * u * (r.child ? 0.2 : 0.26), a[1] + u * 0.02];
    const sw = r.child ? 0.07 : 0.09;
    shape([[a[0] - dir * u * sw, a[1] - u * 0.1], [a[0] + dir * u * sw, a[1] - u * 0.12], [toe[0], a[1] - u * 0.04], [toe[0] + dir * u * 0.02, a[1] + u * 0.03], [a[0] - dir * u * sw * 1.1, a[1] + u * 0.03]], far ? mix(shoe, '#000000', 0.2) : shoe, { w: LW.line });
    if (bot.type === 'pants') limb([h, k, [a[0], a[1] - u * 0.1]], [pantsR * 1.1, pantsR, pantsR * 0.95], col, { w: LW.line });
    else limb([h, k, [a[0], a[1] - u * 0.1]], [legR, legR * 0.85, legR * 0.7], col, { w: LW.line });
  };
  const drawArm = (c, far, hp, hold) => {
    const [sh, el, wr] = c;
    const sleeve = top.sleeve || 'long';
    const col = far ? topSh : top.color;
    const fore = [el, wr];
    const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]) / D;
    // forearm (skin) then sleeve over it
    if (sleeve !== 'long') limb([el, wr], [limbR * 0.85, limbR * 0.75], skin, { w: LW.line });
    else limb([el, wr], [limbR * 1.2, limbR * 1.12], col, { w: LW.line });
    limb([sh, el], sleeve === 'none' ? [limbR, limbR * 0.9] : [limbR * 1.3, limbR * 1.2], sleeve === 'none' ? skin : col, { w: LW.line });
    if (sleeve === 'long') {
      // fold creases on the inside of the elbow
      const bend = Math.abs(Math.atan2(wr[1] - el[1], wr[0] - el[0]) - Math.atan2(el[1] - sh[1], el[0] - sh[0]));
      if (bend > 0.35) { const k = limbR * 0.9; line([[el[0] - k * 0.6, el[1] - k * 0.2], [el[0] + k * 0.1, el[1] + k * 0.4]], LW.fine); line([[el[0] - k * 0.2, el[1] - k * 0.7], [el[0] + k * 0.4, el[1] - k * 0.2]], LW.fine); }
    }
    if (sleeve === 'long') {
      // cuff
      const cx = wr[0] - Math.cos(ang * D) * limbR * 0.6, cy = wr[1] - Math.sin(ang * D) * limbR * 0.6;
      line([[cx - Math.sin(ang * D) * limbR * 1.1, cy + Math.cos(ang * D) * limbR * 1.1], [cx + Math.sin(ang * D) * limbR * 1.1, cy - Math.cos(ang * D) * limbR * 1.1]], LW.fine);
    }
    const hs = u * (r.child ? 0.0115 : 0.0135) * (ch.handScale || 1);
    // which way the thumb sits: flip for the far hand / facing direction
    hand(wr[0], wr[1], ang, hs, hp || 'relaxed', { skin, flip: (dir > 0) !== !far, object: hold, thumbFront: !far });
    void fore;
  };

  // --- draw order: far arm, far leg, back hair (inside head), torso, near leg, near arm, head
  // the far arm, hanging, is hidden behind a turned body: draw nothing rather than a stub
  const farHidden = p.hideF ?? (r.turn > 0.45 && !p.reachF && Math.abs((p.armF || [-6, 10])[0]) < 30 && !p.holdF);
  if (!farHidden) drawArm(r.armF, true, p.handF, p.holdF);
  if (p.behind) p.behind(r);
  if (!p.noLegs) { drawLeg(r.legF, true); drawLeg(r.legN, false); }
  // torso: outline interpolated between a front view and a profile (chest forward, seat back)
  const T = r.turn, bd = (ch.build || 1) * (r.child ? 0.82 : 1);
  const FRONT = { near: [[0.13, 1.0], [0.44, 0.93], [0.45, 0.8], [0.36, 0.45], [0.33, 0.05]], far: [[0.13, 1.0], [0.44, 0.93], [0.45, 0.8], [0.36, 0.45], [0.33, 0.05]] };
  const PROF = { near: [[0.1, 1.0], [0.2, 0.9], [0.27, 0.72], [0.23, 0.42], [0.22, 0.05]], far: [[0.12, 1.0], [0.26, 0.86], [0.24, 0.62], [0.18, 0.4], [0.24, 0.05]] };
  const tl = Math.hypot(r.neck[0] - r.hip[0], r.neck[1] - r.hip[1]);
  const fwdv = [-r.up[1] * dir, r.up[0] * dir];
  const TP = (side, [a, h]) => [r.hip[0] + r.up[0] * h * tl + fwdv[0] * a * side * u * bd, r.hip[1] + r.up[1] * h * tl + fwdv[1] * a * side * u * bd];
  const lerpP = (A, B) => A.map((q, i) => [q[0] + (B[i][0] - q[0]) * T, q[1] + (B[i][1] - q[1]) * T]);
  const nearSide = lerpP(FRONT.near, PROF.near).map((q) => TP(1, q));
  const farSide = lerpP(FRONT.far, PROF.far).map((q) => TP(-1, q));
  const bodyPoly = nearSide.concat(farSide.slice().reverse());
  const down = [-r.up[0], -r.up[1]];
  const hipN2 = nearSide[nearSide.length - 1], hipF2 = farSide[farSide.length - 1];
  // neck
  limb([[r.neck[0], r.neck[1] + u * 0.06], [r.headC[0] - dir * r.R * 0.25 * T, r.headC[1] + r.R * 0.7]], [u * (r.child ? 0.07 : 0.085), u * (r.child ? 0.07 : 0.085)], skin, { w: LW.line });
  if (bot.type === 'dress' || top.type === 'coat') {
    const hem = u * (bot.type === 'dress' ? (r.child ? 0.55 : 0.95) : (r.child ? 0.5 : 0.9));
    const fl = u * (bot.type === 'dress' ? 0.2 : 0.12);
    const gd = [0, 1], sideX = Math.sign(fwdv[0] || dir);
    const bN = [hipN2[0] + gd[0] * hem + sideX * fl, hipN2[1] + gd[1] * hem];
    const bF = [hipF2[0] - sideX * fl, hipF2[1] + gd[1] * hem];
    shape(nearSide.concat([bN, [(bN[0] + bF[0]) / 2 + down[0] * u * 0.03, (bN[1] + bF[1]) / 2 + down[1] * u * 0.03], bF], farSide.slice().reverse()), bot.type === 'dress' ? bot.color : top.color, { w: LW.contour });
  } else {
    if (bot.type === 'skirt') {
      const hem = u * (r.child ? 0.45 : 0.75);
      shape([hipF2, hipN2, [hipN2[0] + down[0] * hem + fwdv[0] * u * 0.14, hipN2[1] + down[1] * hem + fwdv[1] * u * 0.14], [hipF2[0] + down[0] * hem - fwdv[0] * u * 0.12, hipF2[1] + down[1] * hem - fwdv[1] * u * 0.12]], bot.color, { w: LW.contour });
    } else if (bot.type === 'pants' || bot.type === 'shorts') {
      // trouser seat: fill joins the torso to the legs; ink only on the outer sides
      const pN = [hipN2[0] + down[0] * u * 0.28, hipN2[1] + down[1] * u * 0.28], pF = [hipF2[0] + down[0] * u * 0.28, hipF2[1] + down[1] * u * 0.28];
      const lN = r.legN[1], lF = r.legF[1];
      const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      I.fill([hipF2, hipN2, pN, mid(r.legN[0], lN, 0.35), mid(r.legF[0], lF, 0.35), pF], bot.color, { wob: 0 });
      line([hipN2, pN], LW.contour, { taper: [0, 0.3] });
      line([hipF2, pF], LW.contour, { taper: [0, 0.3] });
    }
    shape(bodyPoly, top.color, { w: LW.contour });
    if (top.belt) line([hipF2, hipN2], LW.line);
  }
  const nk = r.neck;
  // collar
  if (top.collar) {
    const c = top.collar;
    const cw = u * 0.16;
    shape([[nk[0] - cw, nk[1] - u * 0.02], [nk[0] + dir * u * 0.02, nk[1] + u * 0.12], [nk[0] - cw * 0.2, nk[1] + u * 0.02]], c, { w: LW.detail });
    shape([[nk[0] + cw, nk[1] - u * 0.02], [nk[0] + dir * u * 0.02, nk[1] + u * 0.12], [nk[0] + cw * 0.2, nk[1] + u * 0.02]], c, { w: LW.detail });
  }
  if (top.details) top.details(r);
  if (p.stick) {
    const wr = p.stick.far ? r.armF[2] : r.armN[2];
    const gx = wr[0] + dir * (p.stick.lean || 6), gy = p.y;
    line([[wr[0], wr[1] - u * 0.08], [gx, gy]], 5.6, { taper: [0, 0], minW: 1 });
    line([[wr[0], wr[1] - u * 0.08], [gx, gy]], 3, { color: p.stick.color || '#8a5a33', taper: [0, 0], minW: 1 });
    line([[wr[0] - dir * u * 0.02, wr[1] - u * 0.08], [wr[0] - dir * u * 0.12, wr[1] - u * 0.14], [wr[0] - dir * u * 0.18, wr[1] - u * 0.06]], 5.6, { taper: [0, 0], minW: 1 });
    line([[wr[0] - dir * u * 0.02, wr[1] - u * 0.08], [wr[0] - dir * u * 0.12, wr[1] - u * 0.14], [wr[0] - dir * u * 0.18, wr[1] - u * 0.06]], 3, { color: p.stick.color || '#8a5a33', taper: [0, 0], minW: 1 });
  }
  if (!p.armOver) drawArm(r.armN, false, p.handN, p.holdN);
  const hp = p.head || {};
  HEAD.head(ch.head, { x: r.headC[0], y: r.headC[1], s, yaw: hp.yaw ?? r.yaw, pitch: hp.pitch, look: hp.look, mood: hp.mood, mouth: hp.mouth, blink: hp.blink });
  if (p.armOver) drawArm(r.armN, false, p.handN, p.holdN);
  if (p.front) p.front(r);
  return r;
}

// the scene's light: pull every colour of a character toward an ambient colour
function tinted(ch, c, t) {
  const m = (x) => (x && x[0] === '#' && x.length === 7 ? mix(x, c, t) : x);
  const h = { ...ch.head };
  ['skin', 'hair', 'hairLine', 'hairStreak', 'tie', 'moustache', 'beard', 'browCol', 'glasses'].forEach((k) => { if (h[k]) h[k] = m(h[k]); });
  if (h.hat) h.hat = { ...h.hat, color: m(h.hat.color) };
  return { ...ch, head: h, top: ch.top && { ...ch.top, color: m(ch.top.color), collar: m(ch.top.collar) }, bottom: ch.bottom && { ...ch.bottom, color: m(ch.bottom.color), socks: m(ch.bottom.socks) }, shoes: m(ch.shoes) };
}
function silhouette(ch, c) {
  const h = { ...ch.head, skin: c, hair: c, hairLine: null, hairStreak: null, tie: c, moustache: ch.head.moustache ? c : null, beard: ch.head.beard ? c : null, browCol: c, glasses: null, blush: 0, silhouette: true };
  return { ...ch, head: h, top: { ...ch.top, color: c, collar: ch.top && ch.top.collar ? c : null }, bottom: { ...ch.bottom, color: c, socks: c }, shoes: c };
}
// where a speech-balloon tail should point: just outside the head, above the mouth side
function mouth(r, up = 0.9) { return [r.headC[0] + r.dir * r.R * 0.5 * Math.abs(Math.sin((r.yaw * Math.PI) / 180)), r.headC[1] - r.R * up * 1.3]; }
module.exports = { rig, fig, mix, silhouette, tinted, mouth };
