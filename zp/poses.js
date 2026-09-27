// zp/poses.js — the named pose library behind figure.js (F.POSES, F.duo).
//
// Single figures:  F.fig(ch, F.POSES.<name>(ch, { x, y, s, yaw, ...overrides }))
//   every entry returns a complete pose object; anything in the options overrides the preset.
// Two figures:     F.duo.<name>(a, b, { x, y, s, yaw, ... })  draws both (with the right overlaps)
//   and returns { a: rigA, b: rigB }.
// Props (walls, beds, bikes, desks) are the caller's: poses take their contact points
// (seat height, desk top, handlebars, pedals) as options.
module.exports = ({ fig, rig, POSE }) => {
  const I0 = require('../lib/ink');
  const U = (ch, s = 1) => 2.25 * (ch.head.R || 30) * s;
  const D = Math.PI / 180;
  const pick = (o, ...keys) => { const q = { ...o }; keys.forEach((k) => delete q[k]); return q; };
  const hd = (o, h) => ({ ...h, ...(o.head || {}) });

  // ---- objects held in a hand: fn(T, s, A) in hand space
  const shoesPair = (col = '#6a3a2a') => (T, s, A) => {
    const { I } = require('./core');
    const C = require('./core');
    const c = A.c;
    [[0, 0], [2.2, 2.6]].forEach(([du, dv], i) => {
      const q = [[-6, 0.2], [-5.4, -2.4], [-2.6, -2.8], [-1.4, -5.6], [0.6, -6], [1.6, -3], [5.6, -1.6], [6.4, 0.6], [5.4, 1.4]].map(([u, v]) => T([c[0] + u + du, c[1] + v * 0.7 + dv + 2]));
      C.cel(q, i ? col : C.mix(col, '#000000', 0.12), { w: 1.8 * Math.max(0.8, s / 2.4), k: 0.4 });
      void I;
    });
  };
  const flourBag = (col = '#f4efe4') => (T, s, A) => {
    const C = require('./core');
    const c = A.c;
    const q = [[-2, -4], [9, -6], [17, -3.5], [18, 5], [9, 7.5], [-1, 5]].map(([u, v]) => T([c[0] + u, c[1] + v]));
    C.cel(q, col, { w: 2.2 * Math.max(0.8, s / 2.4), k: 0.6 });
    const lab = [[5, -2.5], [12, -3.2], [12.6, 3], [5.4, 3.6]].map(([u, v]) => T([c[0] + u, c[1] + v]));
    C.shape(lab, '#e05a5a', { w: 0, wob: 0.1 });
  };
  const loafHalf = (col = '#c9803a') => (T, s, A) => {
    const C = require('./core');
    const c = A.c;
    const q = [[-3, -3.5], [4, -5], [11, -4], [13, 0], [11, 4.4], [3, 5], [-3, 3.5], [-4.2, 0]].map(([u, v]) => T([c[0] + u, c[1] + v]));
    C.cel(q, col, { w: 2.1 * Math.max(0.8, s / 2.4), k: 0.5 });
    C.line([T([c[0] - 3.6, c[1] - 2.5]), T([c[0] - 2.4, c[1]]), T([c[0] - 3.4, c[1] + 2.6])], 1.2, { color: '#f4e1b8' });
  };

  const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const mugObj = (col = '#e05a5a') => (T, s, A) => {
    const C = require('./core');
    const c = T(A.c), w = 7.5 * s, h = 8.5 * s;
    C.cel([[c[0] - w / 2, c[1] - h * 0.55], [c[0] + w / 2, c[1] - h * 0.55], [c[0] + w * 0.46, c[1] + h * 0.45], [c[0] - w * 0.46, c[1] + h * 0.45]], col, { w: Math.max(1.4, s * 0.55), k: 0.5 });
    C.shape(require('../lib/ink').ell(c[0], c[1] - h * 0.55, w / 2, h * 0.12, 12), '#5a3a2a', { w: Math.max(1.1, s * 0.4), wob: 0 });
    C.line([[c[0] - w * 0.1, c[1] - h * 0.8], [c[0] + w * 0.05, c[1] - h * 1.1], [c[0] - w * 0.08, c[1] - h * 1.35]], Math.max(0.9, s * 0.3), { color: '#ffffff', op: 0.8 });
  };
  const P = {
    // ---- standing
    stand: (ch, o = {}) => ({ ...POSE.stand(), ...o }),
    // weight on one leg, near hand in the pocket / on the hip
    // hand on the hip, elbow out (akimbo); o.both: both hands
    standHip: (ch, o = {}) => ({ ...POSE.stand(), weight: 'N', armF: [-5, 38, 40, -58], handF: 'fist', handAngF: (o.yaw ?? 30) >= 0 ? 110 : 70, ...(o.both ? { armN: [-5, 35, 30, -50], handN: 'fist', handAngN: (o.yaw ?? 30) >= 0 ? 60 : 120 } : {}), curve: 6, side: 4, ...pick(o, 'both') }),
    // arms folded across the chest
    armsCrossed: (ch, o = {}) => {
      const yaw = o.yaw ?? 30, s = o.s || 1, u = U(ch, s);
      const r = rig(ch, { ...POSE.stand(), x: o.x, y: o.y, s, yaw, weight: 'F' });
      const c = r.spineAt(0.66);
      return { ...POSE.stand(), yaw, weight: 'F', curve: -2, lean: -3, reachN: [c[0] + r.dir * u * 0.46, c[1] - u * 0.04], reachF: [c[0] - r.dir * u * 0.02, c[1] + u * 0.06], bendN: 1, bendF: -1, handN: 'fist', handF: 'clutch', handAngN: r.dir > 0 ? -30 : 210, armOver: true, ...o, head: hd(o, { mood: 'sly' }) };
    },
    // holding a mug in both hands at the chest (o.mug colour)
    mugTwoHands: (ch, o = {}) => {
      const yaw = o.yaw ?? 40, s = o.s || 1, u = U(ch, s);
      const r = rig(ch, { ...POSE.stand(), x: o.x, y: o.y, s, yaw });
      const c = add2(r.spineAt(0.72), [r.dir * u * 0.55, 0]);
      return { ...POSE.stand(), yaw, reachN: [c[0] - r.dir * u * 0.08, c[1] + u * 0.12], reachF: [c[0] + r.dir * u * 0.16, c[1] + u * 0.1], bendN: 1, bendF: 1, handN: 'clutch', handF: 'clutch', holdN: mugObj(o.mug), handAngN: r.dir > 0 ? 20 : 160, handAngF: r.dir > 0 ? 160 : 20, armOver: false, ...pick(o, 'mug'), head: hd(o, { mood: 'smile', pitch: -4 }) };
    },
    // looking up at something, seen from behind (yaw ≈ 150–170)
    lookUpBack: (ch, o = {}) => ({ ...POSE.stand(), yaw: 160, curve: -6, lean: -3, armN: [4, 14, 10], armF: [-4, 26, 12], ...o, head: hd(o, { yaw: (o.yaw ?? 160) + 8, pitch: 14 }) }),
    // surprised, hands up a little
    startled: (ch, o = {}) => ({ ...POSE.stand(), yaw: 30, curve: -8, lean: -6, armN: [40, 70, 20], armF: [30, 80, 22], handN: 'open', handF: 'open', ...o, head: hd(o, { mood: 'shock', mouth: 'o' }) }),

    // ---- walking
    walk: (ch, o = {}) => ({ ...POSE.walk(o.phase ?? 0.05), yaw: 60, ...pick(o, 'phase') }),
    // old man with a stick in the near hand; shorter stride, head up (not thrust)
    walkStick: (ch, o = {}) => {
      const w = POSE.walk(o.phase ?? 0.1);
      const yaw = o.yaw ?? 58, s = o.s || 1, u = U(ch, s);
      const base = { ...w, legN: [w.legN[0] * 0.7, w.legN[1]], legF: [w.legF[0] * 0.7, w.legF[1]], armF: [10, 30, 8], lean: 4, curve: 6, yaw };
      const r = rig(ch, { ...base, x: o.x, y: o.y, s });
      return { ...base, reachN: [r.hip[0] + r.dir * u * 0.42, r.hip[1] + u * 0.05], bendN: 1, handN: 'grip', stick: { far: false, lean: 10 }, ...pick(o, 'phase'), head: hd(o, { pitch: 6 }) };
    },
    // tiptoe out of a room, barefoot, shoes held at the chest
    sneakBarefoot: (ch, o = {}) => {
      const yaw = o.yaw ?? 62, s = o.s || 1, u = U(ch, s);
      const r = rig(ch, { x: o.x, y: o.y, s, yaw, legN: [30, 70], legF: [-18, 20], lean: 14, curve: 12, contra: 0 });
      return { legN: [30, 70], legF: [-18, 20], lean: 14, curve: 12, contra: 0, yaw, barefoot: true, shrug: 0.05,
        reachN: [r.neck[0] + r.dir * u * 0.34, r.neck[1] + u * 0.42], bendN: 1, handN: 'grip', holdN: shoesPair(ch.shoes === ch.head.skin ? '#d4aa3c' : ch.shoes), handAngN: r.dir > 0 ? -150 : -30,
        armF: [-34, 40, 34], handF: 'open', ...o, head: hd(o, { yaw: yaw - 20, look: [-0.4, 0], mood: 'worried', mouth: 'flat' }) };
    },
    // pushing a bicycle: both hands on the bars (o.bars = [x, y])
    // walking beside a bike (o.bike from bike()): far hand on the near grip, near hand on the saddle
    wheelBike: (ch, o = {}) => {
      const b = o.bike || {}, d = b.dir ?? 1, s = o.s || 1, u = U(ch, s);
      const w = POSE.walk(o.phase ?? 0.1);
      const grip = b.grip || o.bars;
      const x = o.x ?? (grip ? grip[0] - d * u * 1.05 : 0);
      return { ...w, x, yaw: 55 * d, lean: 8, reachF: grip, bendF: 1, handF: 'grip', ...(b.saddle ? { reachN: [b.saddle[0] + d * u * 0.05, b.saddle[1] - u * 0.02], bendN: 1, handN: 'flat' } : {}), ...pick(o, 'phase', 'bars', 'bike', 'x'), head: hd(o, { yaw: 50 * d, pitch: 2, mood: 'smile' }) };
    },

    // ---- sitting (o.y = seat top)
    sit: (ch, o = {}) => ({ ...POSE.sit(), yaw: 55, ...o }),
    // seated, hands clasped in the lap
    lapClasp: (ch, o = {}) => {
      const yaw = o.yaw ?? 40, s = o.s || 1, u = U(ch, s);
      const base = { ...POSE.sit(), yaw, legN: [2, 6, 3], legF: [0, 10, 2], lean: 2, curve: 10 };
      const r = rig(ch, { ...base, x: o.x, y: o.y, s });
      const m = add2(lerp(r.legN[0], r.legN[1], 0.55), [0, -u * 0.14]);
      return { ...base, reachN: m, reachF: add2(m, [r.dir * u * 0.04, u * 0.02]), bendN: 1, bendF: 1, handN: 'rest', handF: 'clutch', handAngN: r.dir > 0 ? 170 : 10, armOver: true, ...o, head: hd(o, { mood: 'smile' }) };
    },
    // on a high wall, legs dangling, eating (hand to mouth) or offering (o.offer) half a sandwich
    sitWall: (ch, o = {}) => {
      const yaw = o.yaw ?? 55, s = o.s || 1, u = U(ch, s);
      const base = { sit: 0, legN: [-2, 4, 6], legF: [0, 14, 4], lean: 2, curve: 12, yaw };
      const r = rig(ch, { ...base, x: o.x, y: o.y, s });
      const tgt = o.offer ? [r.shN[0] + r.dir * u * 0.95, r.shN[1] + u * 0.35] : [r.headC[0] + r.dir * u * 0.3, r.headC[1] + u * 0.48];
      return { ...base, reachN: tgt, bendN: o.offer ? 1 : -1, handN: 'hold', holdN: 'sandwich', handAngN: o.offer ? (r.dir > 0 ? -10 : 190) : (r.dir > 0 ? -60 : 240), reachF: 'thighF', handF: 'flat', ...pick(o, 'offer'), head: hd(o, { pitch: -2, mood: o.offer ? 'smile' : 'neutral' }) };
    },
    // asleep in an armchair: slid down, head dropped to one side, hands on the belly
    armchairAsleep: (ch, o = {}) => ({ sit: 0, yaw: -14, legN: [10, 26, 12], legF: [6, 34, 8], lean: -10, curve: 34, neckTilt: 18, reachN: 'thighN', reachF: 'hipF', bendF: -1, handN: 'relaxed', handF: 'flat', ...o, head: hd(o, { yaw: (o.yaw ?? -14) - 18, pitch: -16, blink: true, mood: 'shut', mouth: 'o' }) }),
    // slumped asleep on the desk, head on the folded arms (o.desk = desk-top y)
    deskAsleep: (ch, o = {}) => {
      const yaw = o.yaw ?? 60, s = o.s || 1, u = U(ch, s);
      const base = { sit: 0, yaw, lean: 40, curve: 26, neckTilt: 34, legN: [2, 10], legF: [0, 18] };
      const desk = o.desk ?? o.y - u * 1.1;
      let r = rig(ch, { ...base, x: o.x, y: o.y, s });
      for (let lo = -10, hi = 90, i = 0; i < 18; i++) { base.lean = (lo + hi) / 2; r = rig(ch, { ...base, x: o.x, y: o.y, s }); if (r.headC[1] < desk - r.R * 0.55) lo = base.lean; else hi = base.lean; }
      const dy = desk - 2;
      const a = [r.headC[0] + r.dir * u * 0.55, dy - u * 0.05], b = [r.headC[0] - r.dir * u * 0.05, dy - u * 0.04];
      return { ...base, reachN: a, reachF: b, bendN: 1, bendF: 1, handN: 'flat', handF: 'flat', armOver: true, ...pick(o, 'desk'), head: hd(o, { yaw: yaw + 25, pitch: -14, blink: true, mood: 'shut', mouth: 'o' }) };
    },
    // jolting awake in a chair: arched back, arms flung up
    jolt: (ch, o = {}) => ({ sit: 0, yaw: 20, lean: -12, curve: -12, legN: [26, 20, 14], legF: [14, 40, 10], armN: [150, -24, 30], armF: [140, -16, 28], handN: 'open', handF: 'open', ...o, head: hd(o, { pitch: 6, mood: 'shock', mouth: 'o' }) }),
    // dejected on a bench: elbows on knees, head hung
    benchDejected: (ch, o = {}) => {
      const yaw = o.yaw ?? 30, s = o.s || 1, u = U(ch, s);
      const base = { sit: 0, yaw, lean: 20, curve: 24, legN: [6, 20, 10], legF: [2, 26, 6] };
      const r = rig(ch, { ...base, x: o.x, y: o.y, s });
      // a hunch this deep collapses the torso into a wedge in 3/4-front views: cap the spine bend and let
      // the head drop instead, so the neck and shoulders still read
      const want = (o.lean ?? 20) + (o.curve ?? 24);
      const lean = Math.min(o.lean ?? 20, 24), curve = Math.min(o.curve ?? 24, 22);
      const extra = Math.max(0, want - lean - curve);
      const q = { ...base, reachN: [r.legN[1][0] - r.dir * u * 0.1, r.legN[1][1] - u * 0.18], reachF: [r.legF[1][0] - r.dir * u * 0.02, r.legF[1][1] - u * 0.2], bendN: -1, bendF: -1, handN: 'relaxed', handF: 'relaxed', ...pick(o, 'chin'), lean, curve, neckTilt: Math.max(o.neckTilt ?? 0, 6 + extra * 0.3), head: hd(o, { pitch: -16, look: [0.2, 0.8], mood: 'sad' }) };
      if (o.chin) {
        // chin sunk in both hands, elbows on the knees: wrists just under the jaw, fingers up along the cheeks
        const r2 = rig(ch, { ...q, x: o.x, y: o.y, s, head: undefined });
        // chin resting on the two fists (knuckles up), forearms rising from the knees
        const jaw = [r2.headC[0] + r2.dir * r2.R * 0.3, r2.headC[1] + r2.R * (r2.HM.cb + 0.95)];
        Object.assign(q, { legacyArms: false, reachN: [jaw[0] - r2.dir * r2.R * 0.2, jaw[1]], reachF: [jaw[0] + r2.dir * r2.R * 0.25, jaw[1] + r2.R * 0.05], bendN: -1, bendF: 1, handN: 'fist', handF: 'fist', handAngN: -95, handAngF: -85, head: hd(o, { pitch: -4, look: [0.3, 0.5], mood: 'sad' }) });
      }
      return q;
    },
    // riding a bicycle: o.bike = { seat, bars, pedalN, pedalF }; o.wobble / o.fly
    // riding: o.bike = contact points from bike(); o.wobble (stiff arms, knees out) | o.fly (feet off, skirt streaming)
    rideBike: (ch, o = {}) => {
      const b = o.bike || {};
      const bars = b.grip || b.bars, barsF = b.gripF || (bars && [bars[0] - 4, bars[1] + 2]);
      const d = b.dir ?? 1;
      const base = { sit: 0, x: b.seat && b.seat[0], y: b.seat && b.seat[1], yaw: 66 * d, lean: 16, curve: 8, footN: b.pedalN, footF: b.pedalF, reachN: bars, reachF: barsF, bendN: 1, bendF: 1, handN: 'grip', handF: 'grip', ride: { flutter: 0.35 }, head: { yaw: 60 * d, look: [0.8, 0], mood: 'smile' } };
      if (o.wobble) Object.assign(base, { lean: 4, curve: -6, shrug: 0.08, bendN: 0.15, bendF: 0.15, kneeShiftN: [0.1 * d, 0.14], kneeShiftF: [-0.04 * d, 0.06], ride: { flutter: 0.1 }, head: { yaw: 45 * d, look: [0.4, 0.5], mood: 'worried', mouth: 'wobble' } });
      if (o.fly) Object.assign(base, { lean: 22, curve: 8, ride: { flutter: 0.8 }, head: { yaw: 64 * d, pitch: 8, mood: 'joy' } });
      return { ...base, ...pick(o, 'bike', 'wobble', 'fly'), head: hd(o, base.head) };
    },

    // ---- low poses
    kneel: (ch, o = {}) => ({ ...POSE.kneel(), yaw: 55, ...o }),
    // crouched on the heels, forearms on the knees, looking at something on the ground
    crouch: (ch, o = {}) => ({ ...POSE.crouch(), yaw: 55, ...o, head: hd(o, { pitch: -10, look: [0.4, 0.6] }) }),
    crouchPoint: (ch, o = {}) => ({ ...POSE.crouch(), yaw: 55, lean: 10, curve: 4, armN: [128, 4, 6], handN: 'point', handAngN: (o.yaw ?? 55) > 0 ? -50 : 230, reachN: null, reachF: 'kneeF', bendF: -1, ...o, head: hd(o, { pitch: 12, look: [0.5, -0.9], mood: 'smile' }) }),
    crouchSand: (ch, o = {}) => ({ ...POSE.crouch(), yaw: 50, legN: [124, 160, 4], legF: [116, 154, 3], reachN: 'kneeN', bendN: 1, reachF: 'kneeF', bendF: 1, handN: 'relaxed', ...o, head: hd(o, { pitch: -12, look: [0.3, 0.8], mood: 'smile' }) }),
    // fallen on the ground, propped on the hands behind
    fallen: (ch, o = {}) => {
      const yaw = o.yaw ?? 25, s = o.s || 1, u = U(ch, s);
      const base = { sit: 0, yaw, lean: -30, curve: -2, legN: [-4, 84, 14], legF: [34, 30, 10] };
      const r = rig(ch, { ...base, x: o.x, y: o.y, s });
      return { ...base, reachN: [r.hip[0] - r.dir * u * 0.6, (o.y ?? r.ground) - u * 0.02], reachF: [r.hip[0] - r.dir * u * 0.35, (o.y ?? r.ground) - u * 0.04], bendN: 1, bendF: 1, handN: 'flat', handF: 'flat', ...o, head: hd(o, { pitch: 2, mood: 'shock', mouth: 'o' }) };
    },
    // lying on the back in bed (o.y = mattress top); asleep
    lyingBed: (ch, o = {}) => {
      const s = o.s || 1, u = U(ch, s);
      const r = rig(ch, { x: 0, y: 0, s, yaw: 20 });
      const Ht = -(r.headC[1] - r.R * 1.2);
      const fx = o.x + Ht, fy = o.y + u * 0.02;
      return { yaw: 20, rot: -88, rotC: [fx, fy], x: fx, y: fy, armN: [14, 36, 10], armF: [-4, 20, 8], legN: [4, 6], legF: [0, 2], contra: 0, shadow: false, ...pick(o, 'x', 'y'), head: hd(o, { yaw: 30, blink: true, mood: 'shut' }) };
    },

    // ---- arms
    // at a window, holding up one finger ("wait…")
    windowFinger: (ch, o = {}) => ({ ...POSE.stand(), yaw: 40, armN: [30, 118, 40], handN: 'point', handAngN: -100, armF: [-6, 30, 10], ...o, head: hd(o, { mood: 'focus', look: [0.6, 0] }) }),
    // leaning on a door frame (o.frame = x of the frame edge)
    doorway: (ch, o = {}) => {
      const yaw = o.yaw ?? -30, s = o.s || 1, u = U(ch, s);
      const base = { ...POSE.stand(), yaw, side: 6, lean: -2, legN: [8, 14, -14, 8], legF: [0, 0], weight: 'F', armN: [6, 20, 8] };
      const r = rig(ch, { ...base, x: o.x, y: o.y, s });
      const fx = o.frame ?? r.shF[0] - r.dir * u * 0.45;
      return { ...base, reachF: [fx, r.shF[1] - u * 0.35], bendF: -1, handF: 'flat', handAngF: -90, ...pick(o, 'frame'), head: hd(o, { mood: 'tired' }) };
    },
    // holding a phone up to take a photo
    phonePhoto: (ch, o = {}) => {
      const yaw = o.yaw ?? 45, s = o.s || 1, u = U(ch, s);
      const r = rig(ch, { ...POSE.stand(), x: o.x, y: o.y, s, yaw });
      const t = [r.headC[0] + r.dir * u * 0.75, r.headC[1] + u * 0.1];
      return { ...POSE.stand(), yaw, reachN: t, reachF: [t[0] - r.dir * u * 0.05, t[1] + u * 0.1], bendN: 1, bendF: 1, handN: 'hold', holdN: 'phone', handF: 'grip', handAngN: r.dir > 0 ? -80 : 260, ...o, head: hd(o, { look: [0.8, 0], mood: 'focus' }) };
    },
    // tipping a flour bag into a bowl
    flourTip: (ch, o = {}) => {
      const yaw = o.yaw ?? 50, s = o.s || 1, u = U(ch, s);
      const r = rig(ch, { ...POSE.stand(), x: o.x, y: o.y, s, yaw });
      const t = [r.shN[0] + r.dir * u * 0.8, r.shN[1] - u * 0.02];
      return { ...POSE.stand(), yaw, lean: 8, reachN: t, reachF: [t[0] + r.dir * u * 0.25, t[1] + u * 0.2], bendN: 1, bendF: 1, handN: 'grip', handF: 'clutch', holdN: flourBag(), handAngN: r.dir > 0 ? 30 : 150, ...o, head: hd(o, { pitch: -6, look: [0.6, 0.6], mood: 'joy' }) };
    },
    point: (ch, o = {}) => ({ ...POSE.point(), yaw: 50, ...o }),
    reach: (ch, o = {}) => ({ ...POSE.reach(o.target), yaw: 50, handN: 'reach', ...pick(o, 'target') }),
  };

  // ---------------------------------------------------------------- two-figure poses
  const duo = {
    // adult and child walking hand in hand (child on the near side, holding the adult's near hand)
    handInHand: (A, C, o = {}) => {
      const yaw = o.yaw ?? 58, s = o.s || 1, dir = Math.sign(yaw) || 1;
      const ua = U(A, s), uc = U(C, s);
      const wa = POSE.walk(o.phaseA ?? 0.12), wc = POSE.walk(o.phaseC ?? 0.62);
      const ax = o.x, cx = o.x - dir * ua * 0.95;
      const aPose = { ...wa, x: ax, y: o.y, s, yaw, armN: undefined, ...(o.a || {}), head: { yaw: yaw - 20, pitch: -8, look: [-0.5, 0.5], mood: 'smile', ...((o.a || {}).head || {}) } };
      if (o.stickA) { aPose.stick = { far: true, lean: 8 }; aPose.armF = undefined; }
      const ra0 = rig(A, aPose);
      const cr0 = rig(C, { ...wc, x: cx, y: o.y + ua * 0.05, s, yaw });
      // the two hands meet between the bodies, at the child's raised-hand height
      const meet = [(ra0.shN[0] + cr0.shF[0]) / 2 + dir * ua * 0.05, cr0.shF[1] - uc * 0.12];
      aPose.reachN = meet; aPose.bendN = -1; aPose.handN = 'clasp'; aPose.objectSkin = C.head.skin;
      const ra = rig(A, aPose);
      // the child's wrist ends inside the adult's fist
      const wr = ra.armN[2], ang = Math.atan2(wr[1] - ra.armN[1][1], wr[0] - ra.armN[1][0]);
      const hs = ua * 0.031 * (A.handScale || 1);
      const flip = dir > 0 ? 1 : -1;
      const hsP = (uu, vv) => [wr[0] + (uu * Math.cos(ang) - vv * flip * Math.sin(ang)) * hs, wr[1] + (uu * Math.sin(ang) + vv * flip * Math.cos(ang)) * hs];
      const cw = hsP(9.9, 6.9);
      const cPose = { ...wc, x: cx, y: o.y + ua * 0.05, s, yaw, reachF: cw, bendF: 1, handF: 'none', ...(o.c || {}), head: { yaw: yaw - 30, pitch: 10, look: [0.4, -0.8], mood: 'neutral', ...((o.c || {}).head || {}) } };
      fig(A, { ...aPose, parts: ['shadow', 'armF', 'legF', 'legN', 'torso', 'head'] });
      fig(C, { ...cPose, parts: ['armF'] });
      fig(A, { ...aPose, parts: ['armN'] });
      const rc = fig(C, { ...cPose, parts: ['shadow', 'legF', 'legN', 'torso', 'head', 'armN'] });
      return { a: ra, b: rc };
    },
    // adult carrying a child piggy-back
    piggyBack: (A, C, o = {}) => {
      const yaw = o.yaw ?? 55, s = o.s || 1, dir = Math.sign(yaw) || 1;
      const ua = U(A, s), uc = U(C, s);
      const gp = { ...POSE.walk(o.phase ?? 0.1), x: o.x, y: o.y, s, yaw, lean: 20, curve: 12, stoop: 0.2, ...(o.a || {}) };
      const g = rig(A, gp);
      // the child sits on the small of the back, knees round the waist, arms round the neck
      const seat = [g.spineAt(0.5)[0] - dir * ua * 0.4, g.spineAt(0.5)[1] + uc * 0.05];
      const ip = { x: seat[0], y: seat[1], sit: 0, s, yaw, lean: 12, curve: 6, legN: [-18, 24, 50], legF: [-12, 20, 44],
        reachN: [g.neck[0] + dir * ua * 0.12, g.neck[1] + ua * 0.3], reachF: [g.neck[0] + dir * ua * 0.05, g.neck[1] + ua * 0.2], bendN: -1, bendF: -1, handN: 'clutch', handF: 'clutch',
        headDX: -dir * uc * 0.3 / s, headDY: -uc * 0.08 / s, ...(o.c || {}), head: { yaw: yaw - 25, pitch: 4, mood: 'joy', ...((o.c || {}).head || {}) } };
      const ir = rig(C, ip);
      fig(C, { ...ip, parts: ['armF', 'legF', 'torso', 'head'] });
      const ga = fig(A, { ...gp, reachN: [ir.legN[1][0] - dir * uc * 0.04, ir.legN[1][1] + uc * 0.1], reachF: [ir.legF[1][0] - dir * uc * 0.1, ir.legF[1][1] + uc * 0.08], bendN: 1, bendF: 1, handN: 'grip', handF: 'grip',
        armOver: false, ...(o.a || {}), head: { yaw: yaw - 10, pitch: 4, mood: 'smile', ...((o.a || {}).head || {}) } });
      fig(C, { ...ip, parts: ['legN', 'armN'] });
      return { a: ga, b: ir };
    },
    // a hug: two figures facing each other, arms round each other's backs, heads side by side
    hug: (A, Bc, o = {}) => {
      const s = o.s || 1, ua = U(A, s), ub = U(Bc, s);
      const xa = o.x - ua * 0.42, xb = o.x + ub * 0.3;
      const ra0 = rig(A, { ...POSE.stand(), x: xa, y: o.y, s, yaw: 70 });
      const rb0 = rig(Bc, { ...POSE.stand(), x: xb, y: o.y, s, yaw: -70 });
      const pa = { ...POSE.stand(), x: xa, y: o.y, s, yaw: 70, lean: 8, curve: 6, reachN: [rb0.spineAt(0.7)[0] + ub * 0.28, rb0.spineAt(0.7)[1]], reachF: [rb0.spineAt(0.55)[0] + ub * 0.2, rb0.spineAt(0.55)[1]], bendN: -1, bendF: -1, handN: 'flat', handF: 'flat', ...(o.a || {}), head: { yaw: 60, pitch: -4, mood: 'shut', ...((o.a || {}).head || {}) } };
      const pb = { ...POSE.stand(), x: xb, y: o.y, s, yaw: -70, lean: 8, curve: 6, reachN: [ra0.spineAt(0.62)[0] - ua * 0.3, ra0.spineAt(0.62)[1]], reachF: [ra0.spineAt(0.5)[0] - ua * 0.22, ra0.spineAt(0.5)[1]], bendN: 1, bendF: 1, handN: 'flat', handF: 'flat', ...(o.b || {}), head: { yaw: -60, pitch: -4, mood: 'joy', ...((o.b || {}).head || {}) } };
      // A's far arm goes behind B; B is drawn over A's body; A's near arm wraps over B's back
      fig(A, { ...pa, parts: ['armF'] });
      fig(A, { ...pa, parts: ['shadow', 'legF', 'legN', 'torso', 'head'] });
      const rb = fig(Bc, { ...pb, parts: ['shadow', 'armF', 'legF', 'legN', 'torso', 'head', 'armN'] });
      const ra = fig(A, { ...pa, parts: ['armN'] });
      return { a: ra, b: rb };
    },
    // two figures facing each other tearing a loaf apart (o.gap = distance between them)
    tearBread: (A, Bc, o = {}) => {
      const s = o.s || 1, ua = U(A, s), ub = U(Bc, s);
      const gap = o.gap ?? ua * 2.3;
      const xa = o.x - gap / 2, xb = o.x + gap / 2;
      const ra0 = rig(A, { ...POSE.stand(), x: xa, y: o.y, s, yaw: 55 });
      const rb0 = rig(Bc, { ...POSE.stand(), x: xb, y: o.y, s, yaw: -55 });
      const hy = Math.max(ra0.shN[1] + ua * 0.55, rb0.shN[1] + ub * 0.45);
      const mid = o.x;
      const pa = { ...POSE.stand(), x: xa, y: o.y, s, yaw: 55, lean: -6, curve: -4, weight: 'F', reachN: [mid - ua * 0.12, hy], reachF: [mid - ua * 0.2, hy + ua * 0.08], bendN: 1, bendF: 1, handN: 'grip', handF: 'grip', holdN: loafHalf(), handAngN: -20, ...(o.a || {}), head: { yaw: 50, mood: 'joy', ...((o.a || {}).head || {}) } };
      const pb = { ...POSE.stand(), x: xb, y: o.y, s, yaw: -55, lean: -6, curve: -4, weight: 'F', reachN: [mid + ub * 0.12, hy], reachF: [mid + ub * 0.2, hy + ub * 0.08], bendN: 1, bendF: 1, handN: 'grip', handF: 'grip', holdN: loafHalf(), handAngN: 200, ...(o.b || {}), head: { yaw: -50, mood: 'joy', ...((o.b || {}).head || {}) } };
      const ra = fig(A, pa), rb = fig(Bc, pb);
      return { a: ra, b: rb };
    },
    // adult and child crouched side by side looking at the sand
    crouchBeside: (A, C, o = {}) => {
      const s = o.s || 1, ua = U(A, s), dir = Math.sign(o.yaw ?? 50) || 1;
      const rc0 = { x: o.x + dir * ua * 1.45, y: o.y, s, yaw: o.yaw ?? 50, ...(o.c || {}), head: { mood: 'joy', pitch: -12, ...((o.c || {}).head || {}) } };
      const ra = fig(A, P.crouchSand(A, { x: o.x, y: o.y, s, yaw: o.yaw ?? 50, ...(o.a || {}) }));
      const rc = fig(C, P.crouchSand(C, rc0));
      return { a: ra, b: rc };
    },
  };
  // ---- bicycle scenes (draw the bike and the rider in the right overlap order)
  const BK = require('./bike');
  P.bike = {
    draw: BK.bike,
    // riding: o = { x, y (ground under the bottom bracket), s, dir, color, basket, crank, wobble, fly, tilt, pose: {...} }
    ride: (ch, o = {}) => {
      const s = o.s || 1, bo = { dir: o.dir ?? 1, color: o.color, basket: o.basket, crank: o.crank ?? (o.fly ? 90 : 25), tilt: o.tilt ?? (o.wobble ? -5 : 0), blur: o.fly };
      // contact points first (draw into a discarded buffer), then: far limbs, bike, near crank, rest of rider
      const tmp = I0.take();
      const b = BK.bike(o.x, o.y, s, bo); I0.take();
      I0.emit(tmp);
      const pose = { ...P.rideBike(ch, { bike: b, wobble: o.wobble, fly: o.fly }), s, ...(o.pose || {}) };
      fig(ch, { ...pose, parts: ['legF', 'armF'] });
      BK.bike(o.x, o.y, s, { ...bo, part: 'back' });
      BK.bike(o.x, o.y, s, { ...bo, part: 'front' });
      const r = fig(ch, { ...pose, parts: ['torso', 'legN', 'head', 'armN'] });
      return { bike: b, rig: r };
    },
    // walking the bike: o = { x (bottom bracket), y, s, dir, color, basket }
    wheel: (ch, o = {}) => {
      const s = o.s || 1, bo = { dir: o.dir ?? 1, color: o.color, basket: o.basket, crank: 60 };
      const b = BK.bike(o.x, o.y, s, bo);
      const r = fig(ch, { ...P.wheelBike(ch, { bike: b, y: o.y + U(ch, s) * 0.06, s }), s, ...(o.pose || {}) });
      return { bike: b, rig: r };
    },
    // fallen off: bike on its side behind, rider on the ground in front
    crash: (ch, o = {}) => {
      const s = o.s || 1, d = o.dir ?? 1, u = U(ch, s);
      // the bike lies on its side: seen from the side it foreshortens to a flat ellipse on the ground
      const bx = o.x - d * u * 0.5, by = o.y - u * 0.05;
      I0.emit(`<g transform="translate(${I0.n1(bx)} ${I0.n1(by)}) rotate(${-4 * d}) scale(1 0.34) translate(${I0.n1(-bx)} ${I0.n1(-by)})">`);
      const b = BK.bike(bx, by, s, { dir: -d, color: o.color, basket: o.basket, crank: 140, spin: 0.4 });
      I0.emit('</g>');
      const r = fig(ch, { ...P.fallen(ch, { x: o.x + d * u * 0.35, y: o.y, s, yaw: 30 * d }), ...(o.pose || {}) });
      return { bike: b, rig: r };
    },
  };
  // close-up: a child's fist gripping an adult's index finger (the adult hand points along ang)
  //   P.fingerGrip(x, y, s, { ang, adultSkin, childSkin, age, contour, lw }) → { tip }
  P.fingerGrip = (x, y, s = 6, o = {}) => {
    const { hand: HAND } = require('./hand');
    const ang = o.ang ?? -20, D0 = Math.PI / 180;
    const aSk = o.adultSkin || '#f0c49d', cSk = o.childSkin || '#f4cfae';
    const h = HAND(x, y, ang, s, 'point', { skin: aSk, age: o.age, contour: o.contour, lw: o.lw, s: o.pen || 2 });
    // index runs from the knuckle ≈ (9.4,-2.7) forward; grip it around its middle phalanx
    const fp = h.T([15.5, -2.4]);
    const cs = s * 0.72, ca = ang - 90;               // the grip's hole axis lies along the finger
    const cr = [Math.cos(ca * D0), Math.sin(ca * D0)];
    const wr = [fp[0] - (10.9 * cr[0] - 0 * cr[1]) * cs, fp[1] - (10.9 * cr[1] + 0 * cr[0]) * cs];
    HAND(wr[0], wr[1], ca, cs, 'grip', { skin: cSk, child: true, object: 'finger', objectSkin: aSk, contour: o.contour, lw: o.lw, s: o.pen || 2 });
    return { tip: h.tip, grip: fp };
  };
  P.duo = duo;
  void D;
  return P;
};
