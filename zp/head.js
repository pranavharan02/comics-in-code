// zp/head.js — a head model that projects features on a sphere, so ONE character design can be
// drawn at any turn: yaw 0 = facing the viewer, ±90 = full profile (+ faces right).
// Built from what ZP heads do (measured on crops): big round skull; the face is the skull plus a
// small jaw/chin; in 3/4 and profile the near eye sits right at the front contour and may bulge
// past it; small dot pupils; the ear is at the side of the skull at nose/mouth height; flat colour,
// no shading; one contour weight; lashes and brows are solid black shapes.
const { I, INK, LW, line, shape } = require('./core');
const D = Math.PI / 180;

// ---- character designs ------------------------------------------------------------------------
// every field has a default so a design only lists what makes that character distinctive
const BASE = {
  skin: '#f6d2b4', hair: '#1f1a1c', hairLine: null, hairStreak: null,
  R: 30,            // skull radius (px) at scale 1
  jaw: 0.95,        // chin depth below centre (x R)
  jawW: 0.62,       // jaw width at the corners (x R)
  chinPoint: 0.25,  // 0 round chin .. 1 pointed
  eyeW: 0.26, eyeH: 0.36, eyeY: 0.05, eyeSep: 26, // eye half-width / half-height (x R), eye latitude, longitude
  pupil: 0.075,
  lashes: 0, brow: 1, browCol: null, browThick: 1,
  nose: 'button',   // button | long | hook | small
  noseLen: 0.12, napeLevel: 0.55, sideburn: 0.22, square: 0, deep: 1,
  tall: 1.12, wide: 1.0, hairVol: 1.0, hairTop: 'round',
  earY: 0.2,        // ear latitude (x R, down is +)
  mouthY: 0.58,
  hairStyle: 'short', // short | ponytail | bun | long | flattop | bald | bob | pigtails
  hairline: 0.55,   // how low the fringe comes at the front (latitude, x R, + is lower)
  age: 0,           // 0..1 : wrinkles, bags
  glasses: null,
  blush: 0,
  beard: null, moustache: null,
  accessory: null,  // 'flower' | 'bow'
};
function design(d) { return { ...BASE, ...d }; }

// ---- sphere projection ------------------------------------------------------------------------
// lon: degrees around the head (0 = centre of the face), lat: degrees up (+) / down (-)
function proj(lon, lat, r, yaw, R) {
  const a = (lon + yaw) * D, b = lat * D;
  return { x: Math.sin(a) * Math.cos(b) * R * r, y: -Math.sin(b) * R * r, z: Math.cos(a) * Math.cos(b) };
}

// ---- head -------------------------------------------------------------------------------------
// o: { x, y, s (scale), yaw, pitch (deg, + looks up), look [dx,dy] (-1..1), mood, blink, mouth }
function head(dz, o = {}) {
  const d = design(dz);
  const s = o.s || 1, R = d.R * s, yaw = o.yaw ?? 0, X = o.x || 0, Y = o.y || 0;
  const side = Math.sign(yaw) || 1, ay = Math.abs(yaw);
  const pitch = Math.max(-15, Math.min(12, o.pitch || 0));
  const P = (lon, lat, r = 1) => { const p = proj(lon, lat + pitch * 0.35, r, yaw, R); return { x: X + p.x, y: Y + p.y + pitch * -0.1 * R / 30, z: p.z }; };
  const mood = o.mood || 'neutral';
  const skin = d.skin, hairC = d.hair;
  const cy = Math.cos(yaw * D), sy = Math.sin(yaw * D), cp = Math.cos(pitch * D), sp = Math.sin(pitch * D);
  const F = (x, y, z) => {
    // pitch (nod) about x, then yaw about y
    x *= d.wide; z *= d.deep;
    const y1 = y * cp - z * sp, z1 = y * sp + z * cp;
    const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
    return { x: X + x2 * R, y: Y + (y1 < 0 ? y1 * d.tall : y1) * R, z: z2 };
  };
  o.F = F; void hairC;
  const lw = LW.contour;

  // ---- back hair (behind everything): ponytail, pigtails, bun, long hair
  hairExtras(d, F, R, X, Y, yaw, side);

  // ---- silhouette: skull circle + jaw + chin (convex hull of samples)
  const RX = R * Math.hypot(d.wide * Math.cos(yaw * D), d.deep * Math.sin(yaw * D));
  const pts = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; const [cx, sn] = sq(Math.cos(a), Math.sin(a), d.square); pts.push([X + cx * RX, Y + sn * R * (sn < 0 ? d.tall : 1)]); }
  const jw = d.jawW, jd = d.jaw;
  const face3 = [[0, 0.95 + jd * 0.3, 0.66 + d.chinPoint * 0.15], [0, 0.78, 0.86], [jw * 0.45, 0.9 + jd * 0.25, 0.42], [-jw * 0.45, 0.9 + jd * 0.25, 0.42],
    [jw, 0.72 + jd * 0.15, 0.05], [-jw, 0.72 + jd * 0.15, 0.05], [0.84, 0.42, 0.38], [-0.84, 0.42, 0.38], [0, 0.55, 0.9], [0.5, 0.6, 0.72], [-0.5, 0.6, 0.72]];
  const jawPts = face3.map(([x, y, z]) => { const q = F(x, y, z); return [q.x, q.y]; });
  const hull = convexHull(pts.concat(jawPts));
  const bald = d.hairStyle === 'bald';
  // skin first; hair = everything above the hairline (all the way round) plus a volume bulge
  I.fill(hull, skin, { wob: 0 });
  let skinRegion = null;
  if (!bald) {
    const hl = visibleHairline(d, F);
    if (ay > 105 && d.hairline > -0.6) {
      const ny = F(0, Math.max(0.85, d.napeLevel), -1).y;
      skinRegion = [[X - R * 5, ny], [X + R * 5, ny], [X + R * 5, Y + R * 5], [X - R * 5, Y + R * 5]];
    } else if (hl.length > 1) {
      // close the region round the BOTTOM: push each end of the run straight out from the head centre
      const out = ([x, y]) => { const dx = x - X, dy = y - Y, l = Math.hypot(dx, dy) || 1; return [X + (dx / l) * R * 3, Y + (dy / l) * R * 3]; };
      const A = hl[0], B = hl[hl.length - 1];
      const Ao = out(A), Bo = out(B);
      const deep = Y + R * 4;
      const far = (P0) => [P0[0] + Math.sign(P0[0] - X || 1) * R * 4, P0[1]];
      const Bf = far(Bo), Af = far(Ao);
      skinRegion = hl.map(([x, y]) => [x, y]).concat([Bo, Bf, [Bf[0], deep], [Af[0], deep], Af, Ao]);
    }
    const hb = [];
    const bx = X - sy * R * 0.06, by = Y - R * 0.04;
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * Math.PI * 2; const [cx, sn] = sq(Math.cos(a), Math.sin(a), d.square);
      let yy = by + sn * R * 1.06 * (sn < 0 ? d.tall : 1);
      if (d.hairTop === 'flat') yy = Math.max(yy, Y - R * d.tall * 1.1);
      hb.push([bx + cx * RX * 1.06 * d.hairVol, yy - (sn < 0 ? R * (d.hairVol - 1) * 1.2 : 0)]);
    }
    // hair = (bulge ∪ hull) minus the skin region under the hairline
    const cid = 'hc' + Math.floor(Math.random() * 1e9);
    const big = `M${X - R * 5} ${Y - R * 5}H${X + R * 5}V${Y + R * 5}H${X - R * 5}Z`;
    const sk = skinRegion ? 'M' + skinRegion.map(([x, y]) => `${I.n1(x)} ${I.n1(y)}`).join('L') + 'Z' : '';
    I.emit(`<clipPath id="${cid}"><path clip-rule="evenodd" d="${big} ${sk}"/></clipPath><g clip-path="url(#${cid})">`);
    if (d.hairline > -0.6) shape(hb, d.hair, { w: lw });
    I.fill(hull, d.hair, { wob: 0 });
    hairTop(d, F, R, X, Y, side, yaw);
    I.emit('</g>');
  }
  // ear
  const ep = F(-side * 0.99, d.earY + 0.1, -0.1);
  if (ay > 12 && ep.z > -0.6) {
    const vis = Math.max(0.4, Math.abs(Math.sin((yaw) * D)));
    const ew = R * 0.19 * vis, eh = R * 0.27;
    const ex = ep.x, ey = ep.y;
    shape(I.ell(ex, ey, ew, eh, 12), skin, { w: LW.line });
    line([[ex + side * ew * 0.3, ey - eh * 0.45], [ex - side * ew * 0.35, ey - eh * 0.1], [ex - side * ew * 0.05, ey + eh * 0.35]], LW.fine);
  } else if (ay <= 12) [-1, 1].forEach((sd) => {
    const q = F(sd * 0.99, d.earY + 0.1, -0.1);
    shape(I.ell(q.x + sd * R * 0.03, q.y, R * 0.12, R * 0.25, 10), skin, { w: LW.line });
  });
  // hair edge along the visible hairline
  if (!bald && !d.silhouette && ay <= 105) hairEdge(d, F, R, side, yaw, hull);
  line(hull.concat([hull[0]]), lw, { taper: [0, 0], wob: 0.1 });

  if (d.silhouette || Math.abs(yaw) > 118) { if (d.hat) drawHat(d, F, R, X, Y, yaw, side); return; }
  // ---- nose
  drawNose(d, P, R, yaw, side, skin, null, F);

  // ---- eyes
  drawEyes(d, P, R, yaw, side, o, mood);

  // ---- mouth
  drawMouth(d, P, R, yaw, side, o, mood);

  // ---- age lines, blush
  if (d.age > 0.3) {
    const c = P(side * 0 + 38 * side * (ay > 20 ? 1 : 0) - (ay > 20 ? 0 : 30), -16);
    const m1 = P(-22, -28), m2 = P(22, -28);
    [m1, m2].forEach((m, i) => { if (m.z > 0.35) line([[m.x, m.y - R * 0.12], [m.x + (i ? 1 : -1) * R * 0.05, m.y + R * 0.08]], LW.fine); });
    void c;
  }
  if (d.blush) [-1, 1].forEach((sd) => {
    const q = F(sd * 0.55, 0.42, 0.78);
    if (q.z > 0.3) for (let k = 0; k < 3; k++) line([[q.x - R * 0.12 + k * R * 0.1, q.y + R * 0.07], [q.x - R * 0.07 + k * R * 0.1, q.y - R * 0.05]], LW.fine, { color: '#cf6f5f' });
  });
  if (d.beard || d.moustache) facialHair(d, P, R, yaw, side);

  if (d.glasses) { d._F = F; drawGlasses(d, P, R, yaw, side); }
  if (d.hat) drawHat(d, F, R, X, Y, yaw, side);
  if (d.accessory === 'flower') flower(P(side * -30, 62, 1.02), R);
}

// ---- features ----------------------------------------------------------------------------------
function drawEyes(d, P, R, yaw, side, o, mood) {
  const lk = o.look || [0, 0];
  const Fp = o.F; const ex3 = Math.sin(d.eyeSep * D) * 1.25;
  const eyes = [-1, 1].map((sd) => ({ lon: sd, p: Fp(sd * ex3, d.eyeY, 0.9) }));
  // near eye first in draw order? draw far one first
  eyes.sort((a, b) => a.p.z - b.p.z);
  eyes.forEach(({ lon, p }) => {
    if (p.z < 0.08) return;
    const fore = Math.max(0.78, Math.min(1, p.z + 0.25));
    const w = R * d.eyeW * fore, h = R * d.eyeH;
    const x = p.x, y = p.y;
    if (o.blink || mood === 'shut' || mood === 'joy') {
      const up = mood === 'joy';
      line(up ? [[x - w, y + h * 0.2], [x, y - h * 0.35], [x + w, y + h * 0.2]] : [[x - w, y], [x, y + h * 0.3], [x + w, y]], LW.contour);
      return;
    }
    shape(I.ell(x, y, w, h, 18), '#ffffff', { w: LW.line });
    // heavier upper lid line, as ZP inks it
    line(I.arc(x, y, w * 1.02, h * 1.02, Math.PI * 1.08, Math.PI * 1.92, 8), LW.contour + 0.4, { taper: [0.25, 0.1] });
    // pupil: sits toward the look direction; in profile it hugs the front
    const px = x + (lk[0] + Math.sin(yaw * D) * 0.35) * w * 0.55, py = y + lk[1] * h * 0.5;
    const pr = R * d.pupil * (mood === 'shock' ? 0.7 : 1);
    I.fill(I.ell(px, py, pr, pr * 1.15, 10), INK, { wob: 0 });
    // lids for mood
    const lid = { tired: 0.45, sad: 0.35, focus: 0.5, angry: 0.3, sly: 0.5 }[mood] || (d.age > 0.5 ? 0.25 : 0);
    if (lid) {
      const ly = y - h + h * 2 * lid;
      const tilt = mood === 'sad' ? (lon * (yaw >= 0 ? 1 : 1) > 0 ? -1 : 1) * h * 0.25 : mood === 'angry' ? (lon > 0 ? 1 : -1) * h * 0.25 : 0;
      I.clipPoly(I.ell(x, y, w, h, 18), () => I.fill([[x - w - 2, y - h - 2], [x + w + 2, y - h - 2], [x + w + 2, ly + tilt], [x - w - 2, ly - tilt]], d.skin, { lin: true, wob: 0 }));
      line([[x - w * 0.95, ly - tilt], [x + w * 0.95, ly + tilt]], LW.contour, { taper: [0.1, 0.1] });
    }
    // lashes: little black flicks on the outer upper edge
    if (d.lashes) {
      const out = lon > 0 ? 1 : -1;
      for (let k = 0; k < d.lashes; k++) {
        const a = (-90 + out * (40 + k * 22)) * D;
        const bx = x + Math.cos(a) * w, by = y + Math.sin(a) * h;
        line([[bx, by], [bx + out * R * 0.09, by - R * 0.06]], LW.line, { taper: [0.05, 0.8] });
      }
    }
    // bags / age
    if (d.age > 0.4) line([[x - w * 0.7, y + h * 1.15], [x, y + h * 1.3], [x + w * 0.7, y + h * 1.15]], LW.fine);
  });
  // brows
  if (d.brow) {
    eyes.forEach(({ lon, p }) => {
      if (p.z < 0.08) return;
      const fore = Math.max(0.45, Math.min(1, p.z + 0.15));
      const w = R * d.eyeW * fore * 1.15, h = R * d.eyeH;
      const x = p.x, y = p.y - h - R * 0.1;
      const inner = lon > 0 ? -1 : 1; // inner end of this brow points toward the nose
      const tilt = { angry: 0.2, sad: -0.18, worried: -0.18, focus: 0.14, shock: -0.02 }[mood] || 0;
      const lift = mood === 'shock' ? -R * 0.12 : 0;
      const col = d.browCol || (d.age > 0.6 ? '#d8d2c8' : INK);
      const a = [x + inner * w, y + lift + tilt * R], b = [x - inner * w, y + lift - tilt * R * 0.4];
      const m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - R * 0.05];
      I.ink([a, m, b], LW.line + 2.2 * d.browThick, { color: col, taper: [0.15, 0.35], wob: 0.1, vary: 0.05 });
    });
  }
}

function drawNose(d, P, R, yaw, side, skin, _u, Fn) {
  const tip = Fn(0, 0.34, 1.0 + d.noseLen), base = Fn(0, 0.46, 0.94), top = Fn(0, 0.12, 0.97);
  const ay = Math.abs(yaw);
  if (ay < 25) {
    // facing: a small hook shape
    line([[tip.x - side * R * 0.02, tip.y - R * 0.08], [tip.x + R * 0.06 * side, tip.y + R * 0.05], [tip.x - R * 0.06 * side, tip.y + R * 0.08]], LW.line, { taper: [0.3, 0.2] });
    return;
  }
  // turned: the nose pokes out as a filled shape with an outline, sealed onto the face
  const k = d.nose === 'long' ? 1.5 : d.nose === 'hook' ? 1.35 : d.nose === 'small' ? 0.7 : 1;
  const nx = tip.x + side * R * 0.05 * (k - 1) * 2, ny = tip.y + (d.nose === 'hook' ? R * 0.06 : 0);
  const pts = d.nose === 'button'
    ? [[top.x, top.y + R * 0.1], [nx + side * R * 0.02, ny - R * 0.05], [nx + side * R * 0.05, ny + R * 0.03], [nx - side * R * 0.02, ny + R * 0.11], [base.x, base.y]]
    : [[top.x, top.y], [nx, ny - R * 0.04], [nx + side * R * 0.01, ny + R * 0.07], [nx - side * R * 0.06, ny + R * 0.12], [base.x - side * R * 0.02, base.y]];
  I.fill(pts.concat([[base.x - side * R * 0.2, base.y], [top.x - side * R * 0.2, top.y]]), skin, { wob: 0 });
  line(pts.slice(0, 4), LW.contour, { taper: [0.25, 0.25] });
  // nostril
  line([[nx - side * R * 0.12, ny + R * 0.06], [nx - side * R * 0.05, ny + R * 0.1]], LW.fine);
}

function drawMouth(d, P, R, yaw, side, o, mood) {
  const c = o.F(0, d.mouthY + 0.12, 0.9);
  const w = R * 0.2 * (0.6 + 0.4 * Math.cos(yaw * D * 0.8));
  const x = c.x, y = c.y;
  const kind = o.mouth || { joy: 'grin', shock: 'o', sad: 'frown', angry: 'grit', worried: 'wobble', focus: 'flat', tired: 'flat', neutral: 'flat', smile: 'smile' }[mood] || 'flat';
  if (kind === 'flat') line([[x - w, y], [x + w, y + R * 0.02]], LW.line);
  else if (kind === 'smile') line([[x - w, y - R * 0.05], [x, y + R * 0.06], [x + w, y - R * 0.06]], LW.line);
  else if (kind === 'frown') line([[x - w, y + R * 0.06], [x, y - R * 0.03], [x + w, y + R * 0.06]], LW.line);
  else if (kind === 'wobble') line([[x - w, y + R * 0.03], [x - w * 0.4, y - R * 0.02], [x + w * 0.2, y + R * 0.03], [x + w, y - R * 0.01]], LW.line);
  else if (kind === 'o') shape(I.ell(x, y + R * 0.04, R * 0.08, R * 0.11, 10), '#5a1f28', { w: LW.line });
  else if (kind === 'grin' || kind === 'open') {
    const pts = [[x - w * 1.3, y - R * 0.08], [x + w * 1.3, y - R * 0.1], [x + w * 0.9, y + R * 0.14], [x, y + R * 0.22], [x - w * 0.9, y + R * 0.14]];
    shape(pts, '#5a1f28', { w: LW.line });
    I.clipPoly(pts, () => { I.fill([[x - w * 1.4, y - R * 0.12], [x + w * 1.4, y - R * 0.14], [x + w * 1.4, y - R * 0.02], [x - w * 1.4, y]], '#ffffff', { lin: true, wob: 0 }); I.fill(I.ell(x, y + R * 0.2, w * 0.7, R * 0.08, 10), '#e0707c', { wob: 0 }); });
  } else if (kind === 'grit') {
    const pts = [[x - w * 1.2, y - R * 0.05], [x + w * 1.2, y - R * 0.07], [x + w * 1.1, y + R * 0.08], [x - w * 1.1, y + R * 0.1]];
    shape(pts, '#ffffff', { w: LW.line, lin: true });
    line([[x - w * 1.1, y + R * 0.015], [x + w * 1.1, y]], LW.fine);
  }
}

function drawGlasses(d, P, R, yaw, side) {
  const g = d.glasses;
  const ex3 = Math.sin(d.eyeSep * D) * 1.25; const eyes = [-1, 1].map((sd) => d._F(sd * ex3, d.eyeY, 0.98));
  eyes.forEach((p) => {
    if (p.z < 0.05 || (Math.abs(yaw) > 40 && p.z < 0.75)) return;
    const fore = Math.max(0.45, Math.min(1, p.z + 0.15));
    I.ink(I.ell(p.x, p.y, R * 0.36 * fore, R * 0.34, 18), LW.line, { closed: true, color: g, wob: 0.05 });
  });
  const vis = eyes.filter((p) => p.z >= 0.05 && !(Math.abs(yaw) > 40 && p.z < 0.75));
  if (vis.length === 2) {
    const [a, b] = vis[0].x < vis[1].x ? vis : [vis[1], vis[0]];
    const fa = Math.max(0.45, Math.min(1, a.z + 0.15)), fb = Math.max(0.45, Math.min(1, b.z + 0.15));
    line([[a.x + R * 0.36 * fa, a.y], [b.x - R * 0.36 * fb, b.y]], LW.line, { color: g, taper: [0, 0] });
  }
  const arm = P(-Math.sign(yaw || 1) * 88, -d.eyeY * 57 + 4, 1.0);
  const near = vis.sort((a, b) => b.z - a.z)[0];
  if (near && Math.abs(yaw) > 20) line([[near.x - Math.sign(yaw) * R * 0.3, near.y], [arm.x, arm.y]], LW.line, { color: g, taper: [0, 0] });
}

function facialHair(d, P, R, yaw, side) {
  if (d.moustache) {
    const c = P(0, -d.mouthY * 57 + 6, 1.03), w = R * 0.26 * (0.6 + 0.4 * Math.cos(yaw * D));
    shape([[c.x - w, c.y + R * 0.05], [c.x, c.y - R * 0.06], [c.x + w, c.y + R * 0.05], [c.x, c.y + R * 0.02]], d.moustache, { w: LW.line });
  }
  if (d.beard) {
    const pts = [];
    for (let lon = -95; lon <= 95; lon += 10) { const q = P(lon, -30 - (1 - Math.abs(lon) / 95) * 30, 1.06); if (q.z > -0.3) pts.push([q.x, q.y]); }
    const inner = [];
    for (let lon = 80; lon >= -80; lon -= 20) { const q = P(lon, -40 + (Math.abs(lon) < 30 ? 6 : 0), 1.0); if (q.z > -0.3) inner.push([q.x, q.y]); }
    shape(pts.concat(inner), d.beard, { w: LW.line });
  }
}

function flower(p, R) {
  const r = R * 0.16;
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; shape(I.ell(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, r * 0.75, r * 0.75, 10), '#e8667a', { w: LW.detail }); }
  shape(I.ell(p.x, p.y, r * 0.45, r * 0.45, 8), '#b9384f', { w: LW.detail });
}

// ---- face mask + hair edge (3D) ---------------------------------------------------------------
const HL = (d, t) => {
  // hairline height (y in R, negative is up) at angle t around the head:
  // 0 = middle of the forehead, ±0.85 = sideburn just in front of the ear, ±2 = back of the neck.
  // ZP: forehead high, temples round, hair comes down in front of the ear, the whole back is hair.
  const f = d.hairline;
  const fore = -0.8 + f * 0.6, temple = -0.62 + f * 0.35, burn = d.sideburn, nape = d.napeLevel;
  const a = Math.abs(t);
  const ease = (u) => u * u * (3 - 2 * u);
  if (a < 0.5) return fore + (temple - fore) * ease(a / 0.5);
  if (a < 0.9) return temple + (burn - temple) * ease((a - 0.5) / 0.4);
  if (a < 1.25) return burn + (nape * 0.8 - burn) * ease((a - 0.9) / 0.35);
  return nape * 0.8 + (nape - nape * 0.8) * ((a - 1.25) / 0.75);
};
function hairPt(d, F, t, r = 1.02) {
  const ang = t * 90 * D, y = HL(d, t);
  const rr = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, y * y)));
  return F(Math.sin(ang) * rr * r, y, Math.cos(ang) * rr * r);
}
function visibleHairline(d, F) {
  // the longest contiguous visible run of the (closed) hairline loop, ordered along the loop
  const N = 96, pts = [];
  for (let i = 0; i < N; i++) {
    const t = -2 + (i / N) * 4; const q = hairPt(d, F, t);
    // a receding hairline runs off the top of the skull: send those points far up so the crown stays skin
    const off = HL(d, t) < -0.97;
    const top = F(0, -1, 0);
    pts.push([q.x, off ? top.y - d.R * 10 : q.y, t, off ? true : q.z > 0.0]);
  }
  let best = null;
  for (let st = 0; st < N; st++) {
    if (!pts[st][3] || pts[(st - 1 + N) % N][3]) continue; // run starts here
    let k = 0; while (k < N && pts[(st + k) % N][3]) k++;
    if (!best || k > best[1]) best = [st, k];
  }
  if (!best) return pts.every((p) => p[3]) ? pts.map((p) => p.slice(0, 3)) : [];
  const out = [];
  for (let k = 0; k < best[1]; k++) out.push(pts[(best[0] + k) % N].slice(0, 3));
  return out;
}
function onSphere(x, y) { const z2 = 1 - x * x - y * y; return Math.sqrt(Math.max(0.02, z2)); }
function faceMask(d, F, R, X, Y, jw, jd) {
  const pts = [];
  // hairline from the left ear over the forehead to the right ear
  for (let i = 0; i <= 24; i++) {
    const t = -1 + (i / 24) * 2, ang = t * 88 * D;
    const y = HL(d, t);
    const r = Math.sqrt(Math.max(0.05, 1 - y * y));
    const q = F(Math.sin(ang) * r * 1.02, y, Math.cos(ang) * r * 1.02);
    pts.push(q);
  }
  // down the right side, round the jaw and chin, up the left side
  const low = [[0.97, 0.3, 0.05], [jw * 1.02, 0.74 + jd * 0.15, 0.02], [jw * 0.46, 0.92 + jd * 0.25, 0.44], [0, 0.97 + jd * 0.3, 0.68], [-jw * 0.46, 0.92 + jd * 0.25, 0.44], [-jw * 1.02, 0.74 + jd * 0.15, 0.02], [-0.97, 0.3, 0.05]];
  low.forEach(([x, y, z]) => pts.push(F(x, y, z)));
  const vis = pts.filter((q) => q.z > -0.03).map((q) => [q.x, q.y]);
  const front = face3Pts(d, F, jw, jd);
  return convexHull(vis.concat(front));
}
function face3Pts(d, F, jw, jd) {
  return [[0, 0.95 + jd * 0.3, 0.66 + d.chinPoint * 0.15], [0, 0.78, 0.86], [0, 0.55, 0.9], [0, 0.3, 0.95], [0.5, 0.6, 0.72], [-0.5, 0.6, 0.72], [0.84, 0.42, 0.38], [-0.84, 0.42, 0.38]].map(([x, y, z]) => F(x, y, z)).filter((q) => q.z > -0.05).map((q) => [q.x, q.y]);
}
function hairEdge(d, F, R, side, yaw, hull) {
  const hl = visibleHairline(d, F);
  // only draw the parts of the hairline that lie on the head (a receding hairline can run above it)
  const inside = (x, y) => { let c = false; for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) { const [xi, yi] = hull[i], [xj, yj] = hull[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  let seg = [];
  hl.forEach(([x, y]) => { if (inside(x, y)) seg.push([x, y]); else { if (seg.length > 1) line(seg, LW.line, { taper: [0.05, 0.05] }); seg = []; } });
  if (seg.length > 1) line(seg, LW.line, { taper: [0.05, 0.05] });
  if (d.fringe) {
    // pointed tufts hanging over the forehead
    for (let k = 0; k < d.fringe; k++) {
      const t = -0.55 + (k / Math.max(1, d.fringe - 1)) * 1.1, ang = t * 80 * D;
      const y = HL(d, t);
      const r = Math.sqrt(Math.max(0.05, 1 - y * y));
      const a = F(Math.sin(ang - 0.12) * r, y - 0.02, Math.cos(ang - 0.12) * r), b = F(Math.sin(ang + 0.12) * r, y - 0.02, Math.cos(ang + 0.12) * r);
      const tip = F(Math.sin(ang + 0.2) * r, y + 0.2, Math.cos(ang + 0.2) * r * 1.02);
      if (a.z > 0.1 && b.z > 0.1) shape([[a.x, a.y], [tip.x, tip.y], [b.x, b.y]], d.hair, { w: LW.line });
    }
  }
}
function hairTop(d, F, R, X, Y, side, yaw) {
  if (d.hairStyle === 'bald') return;
  const sy = Math.sin(yaw * D);
  if (d.hairLine) {
    const tie = F(0, d.hairStyle === 'ponytail' ? 0.1 : -0.3, -1.0);
    for (let k = 0; k < 6; k++) {
      const t = -0.7 + k * 0.28;
      const a = hairPt(d, F, t, 1.0);
      const m = F(Math.sin(t * 1.3) * 0.75, -0.95, -0.25);
      const pts = [[a.x, a.y], [m.x, m.y], [(m.x + tie.x) / 2, (m.y + tie.y) / 2 - R * 0.1], [tie.x, tie.y]];
      if (a.z > -0.1 || m.z > 0) line(pts, LW.detail, { color: d.hairLine, taper: [0.25, 0.5] });
    }
  }
  if (d.hairStreak) {
    // zig-zag highlight band across the crown (ZP black-hair look), in 3D so it turns with the head
    const band = [];
    for (let k = 0; k <= 12; k++) { const u = -1 + k / 6; const q = F(u * 0.8, -0.72 + (k % 2 ? -0.07 : 0.07), 0.1); band.push([q.x, q.y]); }
    for (let k = 12; k >= 0; k--) { const u = -1 + k / 6; const q = F(u * 0.8, -0.56 + (k % 2 ? -0.07 : 0.07), 0.25); band.push([q.x, q.y]); }
    I.fill(band, d.hairStreak, { lin: true, wob: 0 });
  }
  if (d.hairStyle === 'flattop') {
    // a cowlick tuft at the crown, sticking up and back
    const t1 = F(0, -0.92, -0.45); t1.y = Math.min(t1.y, Y - R * d.tall * 1.02);
    shape([[t1.x - side * R * 0.18, t1.y + R * 0.12], [t1.x - side * R * 0.3, t1.y - R * 0.18], [t1.x - side * R * 0.05, t1.y - R * 0.04], [t1.x + side * R * 0.05, t1.y - R * 0.22], [t1.x + side * R * 0.12, t1.y + R * 0.1]], d.hair, { w: LW.line });
  }
}

function drawHat(d, F, R, X, Y, yaw, side) {
  const h = d.hat, c = h.color || '#7b6a58';
  if (h.type === 'cap') {
    // flat cap: a low crown, flat on top and sloping down to a short peak over the brow
    const pts = [];
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
      const band = F(cx * 1.04, -0.42, cz * 1.04);
      const top = F(cx * 0.88, -1.0 - 0.1 * Math.max(0, -cz) , cz * 0.92 + 0.12);
      pts.push([band.x, band.y], [top.x, top.y]);
    }
    const crown = convexHull(pts);
    const peakC = F(0, -0.46, 1.18);
    const brim = [F(-0.66, -0.44, 0.86), F(-0.42, -0.4, 1.3), F(0, -0.38, 1.4), F(0.42, -0.4, 1.3), F(0.66, -0.44, 0.86)];
    const brimVisibleBehind = peakC.z < -0.25;
    if (brimVisibleBehind) shape(brim.map((q) => [q.x, q.y]), F_mix(c, '#000000', 0.25), { w: LW.contour });
    shape(crown, c, { w: LW.contour });
    if (!brimVisibleBehind) shape(brim.map((q) => [q.x, q.y]), F_mix(c, '#000000', 0.18), { w: LW.contour });
    // a seam over the crown
    const seam = [F(0, -0.5, 0.95), F(0, -0.98, 0.35), F(0, -1.05, -0.3), F(0, -0.8, -0.85)].filter((q) => q.z > -0.1);
    if (seam.length > 1) line(seam.map((q) => [q.x, q.y]), LW.fine);
  }
}
function F_mix(c1, c2, t) {
  const hx = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = hx(c1), b = hx(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function hairExtras(d, F, R, X, Y, yaw, side) {
  const st = d.hairStyle, c = d.hair, tie = d.tie || '#d94a4a';
  const tail = (root, dirx, len, wid) => {
    // a tapered lock hanging from root, swinging toward dirx
    const [x, y] = [root.x, root.y];
    const pts = [[x - wid * 0.5, y - wid * 0.2], [x + dirx * wid * 0.9, y + len * 0.25], [x + dirx * wid * 1.0, y + len * 0.7], [x + dirx * wid * 0.45, y + len], [x + dirx * wid * 0.1, y + len * 0.6], [x + wid * 0.5 * -dirx * 0.2, y + len * 0.2]];
    shape(pts, c, { w: LW.contour });
    if (d.hairLine) line([[x + dirx * wid * 0.2, y + len * 0.1], [x + dirx * wid * 0.6, y + len * 0.7]], LW.fine, { color: d.hairLine });
    shape(I.ell(x, y, wid * 0.32, wid * 0.4, 10), tie, { w: LW.detail });
  };
  if (st === 'ponytail') {
    const r = F(0, 0.1, -1.02);
    const dx = r.x - X; const dirx = Math.abs(dx) > R * 0.2 ? Math.sign(dx) : -side;
    tail(r, dirx, R * 1.1, R * 0.55);
  } else if (st === 'pigtails') {
    [-1, 1].forEach((sd) => { const r = F(sd * 0.92, 0.3, -0.3); if (r.z < 0.6) tail(r, Math.sign(r.x - X) || sd, R * 0.95, R * 0.45); });
  } else if (st === 'bun') {
    const r = F(0, -0.62, -0.82);
    shape(I.ell(r.x, r.y, R * 0.42, R * 0.38, 16), c, { w: LW.contour });
    if (d.hairLine) line([[r.x - R * 0.2, r.y - R * 0.1], [r.x + R * 0.15, r.y + R * 0.12]], LW.fine, { color: d.hairLine });
    if (d.pin) { line([[r.x - R * 0.7, r.y + R * 0.3], [r.x + R * 0.7, r.y - R * 0.35]], 5.4, { taper: [0, 0], minW: 1 }); line([[r.x - R * 0.7, r.y + R * 0.3], [r.x + R * 0.7, r.y - R * 0.35]], 2.6, { color: d.pin, taper: [0, 0], minW: 1 }); }
  } else if (st === 'long' || st === 'bob') {
    const L = st === 'long' ? 2.3 : 1.25;
    const l = F(-1.0, 0, -0.1), r = F(1.0, 0, -0.1);
    const x0 = Math.min(l.x, r.x) - R * 0.12, x1 = Math.max(l.x, r.x) + R * 0.12;
    shape([[x0, Y - R * 0.2], [x0 - R * 0.08, Y + R * L * 0.7], [x0 + R * 0.1, Y + R * L], [(x0 + x1) / 2, Y + R * (L + 0.05)], [x1 - R * 0.1, Y + R * L], [x1 + R * 0.08, Y + R * L * 0.7], [x1, Y - R * 0.2]], c, { w: LW.contour });
  }
}

// superellipse: square 0 = circle, 1 = rounded box
function sq(c, s, k) {
  if (!k) return [c, s];
  const n = 2 + k * 2.2, e = 2 / n;
  return [Math.sign(c) * Math.pow(Math.abs(c), e), Math.sign(s) * Math.pow(Math.abs(s), e)];
}
// ---- utils --------------------------------------------------------------------------------------
function convexHull(points) {
  const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

module.exports = { design, head, proj, convexHull };
