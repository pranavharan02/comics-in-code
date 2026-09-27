// zp/bike.js — a proper bicycle drawn in the zp ink style: diamond (or step-through) frame, fork, swept-back
// handlebars with rubber grips, sprung saddle, chain ring + cranks + pedals + chain, spoked wheels with
// thick tyres, optional front basket and mudguards. Seen from the side (dir ±1), tilted about the ground.
//
// bike(x, y, s, o) → contact points for a rider: { seat, grip, gripF, pedalN, pedalF, bb, front, rear, Rw, dir }
//   (x, y) = ground point under the bottom bracket; s = figure scale (wheel radius ≈ 0.19 of an adult's height)
//   o: { dir (1 faces right), color, step (step-through frame, default true), basket, guards (default true),
//        crank (deg, 0 = near pedal forward), tilt (deg, rotate about the ground point), spin (spoke phase),
//        part: 'all' | 'back' (everything but the near crank) | 'front' (near crank + pedal only),
//        blur (motion lines behind the wheels) }
const { I, INK, line, cel, shape, mix, shade } = require('./core');
const D = Math.PI / 180;

function bike(x, y, s = 1, o = {}) {
  const dir = o.dir ?? 1, Rw = 60 * s * (o.size || 1);
  const col = o.color || '#3f8f86', colSh = shade(col, 0.3);
  const tilt = o.tilt || 0;
  const pw = Math.min(3.4, 2.2 + 0.4 * s);          // contour pen
  // frame geometry in wheel-radius units, facing +x, y up (converted below)
  const G = {
    rear: [-1.58, 1], front: [1.62, 1], bb: [0, 0.82],
    seatTop: [-0.36, 1.98], saddle: [-0.42, 2.22], headTop: [1.22, 2.05], headBot: [1.32, 1.7],
    grip: [0.86, 2.34], stemTop: [1.18, 2.3],
  };
  const P = ([gx, gy]) => [x + gx * Rw * dir, y - gy * Rw];
  const rotP = (q) => { if (!tilt) return q; const a = tilt * D * dir, dx = q[0] - x, dy = q[1] - y; return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const Q = (g) => rotP(P(g));
  const crank = (o.crank ?? 20) * D;
  const cl = 0.36;
  const pedal = (k) => { const a = crank + k * Math.PI; return [G.bb[0] + Math.cos(a) * cl, G.bb[1] - Math.sin(a) * cl]; };
  const part = o.part || 'all';
  const tubeL = (a, b, w, c = col) => { line([a, b], w + pw * 2, { taper: [0, 0], minW: 1, wob: 0.15 }); line([a, b], w, { color: c, taper: [0, 0], minW: 1, wob: 0 }); };
  if (tilt) I.emit(`<g transform="rotate(${I.n1(tilt * dir)} ${I.n1(x)} ${I.n1(y)})">`);
  const tw = Rw * 0.085;                                                  // tube width
  const wheel = ([cx, cy]) => {
    const [X, Y] = P([cx, cy]);
    const rT = Rw, tyre = Rw * 0.1;
    // tyre: thick dark ring with a lighter tread highlight, rim, spokes, hub
    I.emit(`<circle cx="${I.n1(X)}" cy="${I.n1(Y)}" r="${I.n1(rT - tyre / 2)}" fill="none" stroke="${INK}" stroke-width="${I.n1(tyre + pw)}"/>`);
    I.emit(`<circle cx="${I.n1(X)}" cy="${I.n1(Y)}" r="${I.n1(rT - tyre / 2)}" fill="none" stroke="#2c282b" stroke-width="${I.n1(tyre - pw * 0.4)}"/>`);
    I.ink(I.ell(X - Rw * 0.02, Y - Rw * 0.02, rT - tyre * 0.35, rT - tyre * 0.35, 40).slice(26, 36), pw * 0.45, { color: '#6a6468', wob: 0 });
    I.ink(I.ell(X, Y, rT - tyre * 1.15, rT - tyre * 1.15, 40), pw * 0.7, { closed: true, wob: 0, color: '#8e959a' });
    I.ink(I.ell(X, Y, rT - tyre * 1.15, rT - tyre * 1.15, 40), pw * 0.35, { closed: true, wob: 0 });
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2 + (o.spin || 0), a2 = a + (k % 2 ? 0.35 : -0.35);
      line([[X + Math.cos(a) * Rw * 0.05, Y + Math.sin(a) * Rw * 0.05], [X + Math.cos(a2) * (rT - tyre * 1.2), Y + Math.sin(a2) * (rT - tyre * 1.2)]], Math.max(0.6, pw * 0.22), { taper: [0, 0], wob: 0, color: '#3a3638' });
    }
    shape(I.ell(X, Y, Rw * 0.07, Rw * 0.07, 10), '#b9bec2', { w: pw * 0.6, wob: 0 });
    if (o.blur) [0.3, 0.55, 0.8].forEach((t, i) => line([[X - dir * Rw * (1.15 + i * 0.1), Y - Rw * (0.6 - t)], [X - dir * Rw * (1.6 + i * 0.25), Y - Rw * (0.6 - t)]], pw * 0.6, { taper: [0.3, 0.3] }));
  };
  const drawCrank = (k, near) => {
    const pd = P(pedal(k)), bbP = P(G.bb);
    tubeL(bbP, pd, tw * 0.6, near ? '#9aa1a6' : '#6f767b');
    const a = crank + k * Math.PI;
    void a;
    shape([[pd[0] - Rw * 0.13, pd[1] - Rw * 0.035], [pd[0] + Rw * 0.13, pd[1] - Rw * 0.035], [pd[0] + Rw * 0.13, pd[1] + Rw * 0.035], [pd[0] - Rw * 0.13, pd[1] + Rw * 0.035]], near ? '#5a5458' : '#3a3436', { w: pw * 0.7, lin: true, wob: 0 });
  };
  if (part !== 'front') {
    // far crank behind everything
    drawCrank(1, false);
    wheel(G.rear); wheel(G.front);
    // mudguards
    if (o.guards !== false) {
      [G.rear, G.front].forEach((c, i) => { const [X, Y] = P(c); const a0 = i ? -170 : -130, a1 = i ? -60 : -10; const pts = []; for (let a = a0; a <= a1; a += 10) pts.push([X + Math.cos(a * D) * Rw * 1.08 * dir, Y + Math.sin(a * D) * Rw * 1.08]); line(pts, tw * 0.55 + pw * 2, { taper: [0.05, 0.05], wob: 0 }); line(pts, tw * 0.55, { color: mix(col, '#ffffff', 0.25), taper: [0, 0], wob: 0 }); });
    }
    // chain: ring at the bottom bracket, cog at the rear hub
    const bbP = P(G.bb), rr = P(G.rear);
    line([[bbP[0], bbP[1] - Rw * 0.2], [rr[0], rr[1] - Rw * 0.09]], pw * 0.9, { color: '#4a4448', taper: [0, 0], wob: 0 });
    line([[bbP[0], bbP[1] + Rw * 0.2], [rr[0], rr[1] + Rw * 0.09]], pw * 0.9, { color: '#4a4448', taper: [0, 0], wob: 0 });
    // frame: chain stays, seat stays, seat tube, down tube (+ top tube unless step-through), fork
    tubeL(P(G.bb), P(G.rear), tw * 0.8);
    tubeL(P(G.seatTop), P(G.rear), tw * 0.7);
    tubeL(P(G.bb), P(G.seatTop), tw);
    if (o.step !== false) {
      const c1 = P([0.55, 1.05]);
      const pts = I.sample([P(G.bb), c1, P(G.headBot)], false, 6);
      line(pts, tw * 1.1 + pw * 2, { taper: [0, 0], wob: 0 }); line(pts, tw * 1.1, { color: col, taper: [0, 0], wob: 0 });
    } else {
      tubeL(P(G.bb), P(G.headBot), tw * 1.1);
      tubeL(P(G.seatTop), P(G.headTop), tw * 0.95);
    }
    tubeL(P(G.headBot), P(G.front), tw * 0.75, colSh);
    tubeL(P(G.headTop), P(G.headBot), tw * 1.25);
    // highlight along the tubes (light upper-left)
    line([lerp(P(G.bb), P(G.seatTop), 0.15), lerp(P(G.bb), P(G.seatTop), 0.85)].map((q) => [q[0] - dir * tw * 0.2, q[1]]), Math.max(0.8, tw * 0.25), { color: mix(col, '#ffffff', 0.45), taper: [0.3, 0.3], wob: 0 });
    // chain ring
    const ring = P(G.bb);
    shape(I.ell(ring[0], ring[1], Rw * 0.22, Rw * 0.22, 18), '#b9bec2', { w: pw * 0.8, wob: 0 });
    I.ink(I.ell(ring[0], ring[1], Rw * 0.14, Rw * 0.14, 14), pw * 0.4, { closed: true, wob: 0 });
    // seat post + saddle (sprung)
    tubeL(P(G.seatTop), P([G.saddle[0] + 0.03, G.saddle[1] - 0.06]), tw * 0.5, '#9aa1a6');
    const sd = P(G.saddle);
    cel([[sd[0] - dir * Rw * 0.28, sd[1] - Rw * 0.02], [sd[0] - dir * Rw * 0.1, sd[1] - Rw * 0.1], [sd[0] + dir * Rw * 0.26, sd[1] - Rw * 0.05], [sd[0] + dir * Rw * 0.28, sd[1] + Rw * 0.01], [sd[0] - dir * Rw * 0.24, sd[1] + Rw * 0.07]], '#5a3a2a', { w: pw, k: 0.5 });
    [-0.14, -0.04].forEach((dx) => line([[sd[0] + dir * Rw * dx, sd[1] + Rw * 0.07], [sd[0] + dir * Rw * (dx + 0.02), sd[1] + Rw * 0.14], [sd[0] + dir * Rw * (dx - 0.02), sd[1] + Rw * 0.18]], pw * 0.5, { taper: [0, 0], wob: 0 }));
    // stem + swept-back bars + grip
    // stem, swept-back bar (dark, thick enough to read at panel size) and long rubber grips
    const bw = Math.max(tw * 0.8, 2.6 * s);
    tubeL(P(G.headTop), P(G.stemTop), bw, '#6f777d');
    const bar = I.sample([P(G.stemTop), P([1.1, 2.42]), P([0.98, 2.38]), P([G.grip[0] - 0.06, G.grip[1]])], false, 5);
    line(bar, bw + pw * 2, { taper: [0, 0], wob: 0 }); line(bar, bw, { color: '#8e969c', taper: [0, 0], wob: 0 });
    line(bar.slice(0, -1).map((q) => [q[0], q[1] - bw * 0.2]), Math.max(0.8, bw * 0.3), { color: '#d9dee1', taper: [0.3, 0.3], wob: 0 });
    const g0 = P([G.grip[0] - 0.08, G.grip[1] + 0.005]), g1 = P([G.grip[0] + 0.24, G.grip[1] + 0.03]);
    line([g0, g1], bw * 1.45 + pw * 2, { taper: [0, 0], wob: 0 });
    line([g0, g1], bw * 1.45, { color: '#2c282b', taper: [0, 0], wob: 0 });
    // bell
    const bl = P([1.12, 2.44]); shape(I.ell(bl[0], bl[1], Rw * 0.05, Rw * 0.04, 8), '#d4d8da', { w: pw * 0.6, wob: 0 });
    // basket on the front
    if (o.basket) {
      const b0 = P([1.3, 2.2]), bw = Rw * 0.62, bh = Rw * 0.42;
      const bx = dir > 0 ? b0[0] : b0[0] - bw;
      cel([[bx, b0[1] - bh], [bx + bw, b0[1] - bh], [bx + bw * 0.93, b0[1]], [bx + bw * 0.07, b0[1]]], '#d9b36a', { w: pw, k: 0.6, lin: true });
      for (let k = 1; k < 5; k++) line([[bx + bw * (k / 5), b0[1] - bh], [bx + bw * (0.05 + 0.9 * k / 5), b0[1]]], pw * 0.35, { color: '#8a6a3a', taper: [0, 0], wob: 0 });
      for (let k = 1; k < 3; k++) line([[bx + bw * 0.02, b0[1] - bh + (bh * k) / 3], [bx + bw * 0.98, b0[1] - bh + (bh * k) / 3]], pw * 0.35, { color: '#8a6a3a', taper: [0, 0], wob: 0 });
      if (o.basket !== true && typeof o.basket === 'function') o.basket([bx + bw / 2, b0[1] - bh]);
    }
  }
  if (part !== 'back') drawCrank(0, true);
  if (tilt) I.emit('</g>');
  return {
    Rw, dir, seat: Q([G.saddle[0] - 0.02, G.saddle[1] + 0.08]), grip: Q([G.grip[0] + 0.06, G.grip[1] + 0.02]), gripF: Q([G.grip[0] + 0.12, G.grip[1] + 0.05]),
    pedalN: Q(pedal(0)), pedalF: Q(pedal(1)), bb: Q(G.bb), front: Q(G.front), rear: Q(G.rear), headTop: Q(G.headTop), saddle: Q(G.saddle),
  };
}
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
module.exports = { bike };
