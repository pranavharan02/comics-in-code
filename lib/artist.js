// artist.js — the painter, drawn properly: side view kneeling at a low desk, back view,
// profile head, hands with fingers. Everything is parameterised by age (6..110).
// Local coords: origin on the floor under the hips, facing +x, y up is negative.
const I = require('./ink');
const { R, emit, ink, fill, shape, cel, hatch, ell, arc, grp, INK } = I;
const { P, mix, lerp, clamp, hairColor } = require('./hoku');
const F = require('./face');
const Hd = require('./hands');

const SKIN = '#f3cda8', SKIN_SH = '#dea582', BLUSH = '#ee9a86';
const LIGHT = { lx: 6, ly: -5 }; // light from the window, upper right

function robeColors(age) {
  if (age < 14) return { base: '#3d6fa8', sh: '#2c5486', obi: '#d9533a', obiSh: '#a93a26', collar: '#f6efe0' };
  if (age < 60) return { base: '#4a5873', sh: '#36415a', obi: '#b98a3e', obiSh: '#8e6528', collar: '#efe7d6' };
  return { base: '#2f4f7c', sh: '#223b60', obi: '#9a4a3a', obiSh: '#72342a', collar: '#f6efe0' };
}

// ------------------------------------------------------------------ kneeling, side view
// o.age, o.mood, o.hand: 'write' | 'raised' | 'up' | 'lap'; o.deskX: front of the desk
function kneeler(o = {}) {
  const age = o.age ?? 30, child = age < 14, old = clamp((age - 60) / 50);
  const col = robeColors(age);
  const s = child ? 0.7 : 1;               // body scale
  const hunch = old * 16 + (o.lean || 0);   // degrees the torso tips forward
  grp(`scale(${s})`, () => {
    // --- lower body: folded legs under the kimono
    // tabi soles peeping out behind
    cel([[-62, -2], [-58, -18], [-44, -20], [-40, -4]], '#f4f1ea', '#d8d2c4', { w: 2.2, lx: 2, ly: -2 });
    cel([[-50, -1], [-48, -14], [-36, -15], [-32, -2]], '#f4f1ea', '#d8d2c4', { w: 2.2, lx: 2, ly: -2 });
    const legs = [[-48, -6], [-50, -36], [-36, -58], [0, -64], [50, -60], [96, -48], [116, -30], [118, -8], [110, 0], [-40, 0]];
    cel(legs, col.base, col.sh, { w: 3.2, lx: 10, ly: -10 });
    ink([[-30, -44], [20, -48], [70, -40], [104, -26]], 1.5, { color: col.sh });
    ink([[-8, -6], [60, -4], [104, -4]], 1.4, { color: col.sh });
    ink([[40, -20], [90, -16]], 1.2, { color: col.sh });
    // --- torso (tips forward around the hip)
    grp(`rotate(${hunch} 0 -56)`, () => {
      // obi knot behind (taiko for adults, big bow for the child)
      if (child) {
        cel([[-34, -100], [-70, -122], [-78, -96], [-60, -80], [-34, -84]], col.obi, col.obiSh, { w: 2.6, ...LIGHT });
        cel([[-34, -84], [-66, -70], [-72, -48], [-50, -52], [-34, -74]], col.obi, col.obiSh, { w: 2.6, ...LIGHT });
      } else {
        cel([[-36, -76], [-62, -80], [-66, -126], [-40, -130]], col.obi, col.obiSh, { w: 2.8, lin: true, ...LIGHT });
        ink([[-62, -112], [-40, -116]], 1.4, { color: col.obiSh, lin: true });
      }
      const torso = [[-38, -56], [-42, -100], [-38, -150], [-24, -184], [-6, -194], [14, -192], [28, -178], [36, -150], [34, -110], [32, -58]];
      cel(torso, col.base, col.sh, { w: 3.2, lx: 9, ly: -6 });
      // collar: white under-collar and the crossing front edge
      ink([[-6, -193], [8, -176], [22, -154], [26, -134]], 7, { color: col.collar, taper: [0, 0], minW: 1 });
      ink([[-6, -193], [8, -176], [22, -154], [26, -134]], 1.6, { taper: [0.1, 0.1] });
      ink([[-10, -190], [6, -168], [18, -146], [24, -104]], 1.8, { taper: [0.1, 0.2] });
      ink([[-30, -150], [-26, -120]], 1.3, { color: col.sh });
      // obi band
      cel([[-40, -74], [33, -70], [35, -104], [-41, -108]], col.obi, col.obiSh, { w: 2.8, lx: 3, ly: -3, lin: true });
      ink([[-40, -90], [34, -87]], 1.2, { color: col.obiSh, lin: true });
      fill([[-40, -96], [34, -93], [34, -90], [-40, -93]], child ? '#f1c44a' : '#e2c47a', { lin: true, wob: 0 });
      // head
      grp(`translate(${10 + (o.headDX || 0)} ${(child ? -246 : -236) + (o.headDY || 0)}) rotate(${-hunch * 0.4 + (o.headRot || 0)}) scale(${child ? 1.22 : 1})`, () => F.head({ age, mood: o.mood, look: o.look, glasses: o.glasses, neck: child ? 40 : 46 }));
      // near arm
      nearArm(o, col, hunch);
    });
  });
}

function nearArm(o, col, hunch) {
  const mode = o.hand || 'write';
  if (mode === 'up') {
    // brush flung up and forward, in front of the chest, clear of the face
    const hx = o.upAt ? o.upAt[0] : 124, hy = o.upAt ? o.upAt[1] : -262;
    const ex = 44, ey = -170;
    ink([[ex + 20, ey - 26], [hx - 8, hy + 10]], 12, { taper: [0, 0], minW: 1, wob: 0 });
    ink([[ex + 20, ey - 26], [hx - 8, hy + 10]], 8.4, { color: SKIN, taper: [0, 0], minW: 1, wob: 0 });
    cel([[-18, -178], [6, -190], [36, -196], [ex + 26, ey - 34], [ex + 30, ey - 20], [ex + 10, ey + 26], [ex - 10, ey + 54], [-6, ey + 58], [-16, -140]], col.base, col.sh, { w: 3.2, lx: 8, ly: -8 });
    ink([[0, -170], [ex, ey + 20]], 1.3, { color: col.sh });
    fill(I.ell(ex + 26, ey - 28, 4, 8, 8, -0.8), col.sh, { wob: 0.2 });
    grp(`translate(${hx - 8} ${hy + 10}) rotate(43)`, () => Hd.raisedHand({ scale: 1 }));
    [[hx - 30, hy - 30, -16], [hx + 6, hy - 44, 0], [hx + 34, hy - 26, 16]].forEach(([a, b, r]) => grp(`translate(${a} ${b}) rotate(${r})`, () => ink([[0, 0], [0, -14]], 2.6, { taper: [0.2, 0.6] })));
    return;
  }
  // world-space target for the BRUSH TIP, converted into the tipped torso frame
  const tgt = o.handAt || [112, -118];
  const a = (-hunch * Math.PI) / 180, px = tgt[0], py = tgt[1] + 56;
  const tx = px * Math.cos(a) - py * Math.sin(a), ty = px * Math.sin(a) + py * Math.cos(a) - 56;
  // the hand's own frame is tipped with the torso; undo that so the brush stays at a natural slant
  const rot = (o.handRot ?? -8) - hunch, ra = (rot * Math.PI) / 180;
  const off = [44 * Math.cos(ra) - 40 * Math.sin(ra), 44 * Math.sin(ra) + 40 * Math.cos(ra)];
  const hx = tx - off[0], hy = ty - off[1]; // wrist
  const ex = 30, ey = -118; // elbow
  const cx = lerp(ex, hx, 0.55), cy = lerp(ey, hy, 0.55);
  ink([[cx, cy], [hx + 2, hy]], 12.4, { taper: [0, 0], minW: 1, wob: 0 });
  ink([[cx, cy], [hx + 2, hy]], 8.8, { color: SKIN, taper: [0, 0], minW: 1, wob: 0 });
  const sleeve = [[-20, -176], [4, -188], [26, -150], [ex + 8, ey - 8], [cx + 4, cy - 9], [cx + 6, cy + 9], [cx - 10, cy + 24], [ex, ey + 40], [4, ey + 42], [-12, ey + 28], [-20, -130]];
  cel(sleeve, col.base, col.sh, { w: 3.2, lx: 8, ly: -8 });
  ink([[4, -170], [20, -134], [ex + 4, ey + 10]], 1.4, { color: col.sh });
  ink([[-6, ey + 24], [16, ey + 32], [ex - 2, ey + 34]], 1.3, { color: col.sh });
  fill(I.ell(cx + 5, cy, 3.6, 8.6, 8), col.sh, { wob: 0.2 });
  grp(`translate(${hx} ${hy}) rotate(${rot})`, () => Hd.gripHand({ scale: 1, old: o.age > 70 }));
}

// ------------------------------------------------------------------ back view (over the shoulder)
// origin on the floor under her, centre. Reaching toward +x (her right).
function backView(o = {}) {
  const age = o.age ?? 80, old = clamp((age - 60) / 50), col = robeColors(age);
  const hair = hairColor(age), hairSh = mix(hair, '#000000', 0.3);
  const sink = old * 18;
  // lower body + soles
  cel([[-86, 0], [-92, -28], [-74, -60], [74, -60], [92, -28], [86, 0]], col.base, col.sh, { w: 3.2, lx: 10, ly: -8 });
  cel([[-30, -2], [-26, -20], [-8, -22], [-6, -2]], '#f4f1ea', '#d8d2c4', { w: 2.2, lx: 2, ly: -2 });
  cel([[6, -2], [8, -22], [26, -20], [30, -2]], '#f4f1ea', '#d8d2c4', { w: 2.2, lx: 2, ly: -2 });
  grp(`translate(0 ${sink})`, () => {
    // torso
    const torso = [[-66, -56], [-72, -120], [-64, -168], [-38, -190], [38, -190], [62, -168], [70, -120], [66, -56]];
    cel(torso, col.base, col.sh, { w: 3.2, lx: 10, ly: -6 });
    ink([[0, -188], [0, -130]], 1.5, { color: col.sh });
    // near sleeve (right) reaching toward the desk
    cel([[46, -176], [80, -150], [104, -118], [112, -112], [102, -76], [80, -66], [60, -90]], col.base, col.sh, { w: 3, lx: 7, ly: -6 });
    ink([[70, -150], [84, -110]], 1.3, { color: col.sh });
    // left sleeve hanging
    cel([[-60, -168], [-84, -130], [-90, -84], [-76, -66], [-62, -84]], col.base, col.sh, { w: 3, lx: 7, ly: -6 });
    // obi + taiko knot
    cel([[-68, -74], [68, -74], [70, -112], [-70, -112]], col.obi, col.obiSh, { w: 2.8, lx: 3, ly: -3, lin: true });
    cel([[-38, -58], [38, -58], [40, -122], [-40, -122]], col.obi, col.obiSh, { w: 2.8, lx: 4, ly: -4, lin: true });
    ink([[-38, -104], [38, -104]], 1.4, { color: col.obiSh, lin: true });
    fill([[-40, -86], [40, -86], [40, -80], [-40, -80]], '#e2c47a', { lin: true, wob: 0 });
    ink([[-40, -86], [40, -86]], 1.2, { lin: true }); ink([[-40, -80], [40, -80]], 1.2, { lin: true });
    // collar at the nape + neck
    cel([[-16, -196], [16, -196], [14, -214], [-14, -214]], SKIN, SKIN_SH, { w: 2.4, lx: 4, ly: 0 });
    ink([[-34, -190], [-12, -206], [12, -206], [34, -190]], 7, { color: col.collar, taper: [0, 0], minW: 1 });
    ink([[-34, -190], [-12, -206], [12, -206], [34, -190]], 1.6, { taper: [0, 0] });
    // head from behind, tipped down toward the work
    grp(`translate(4 ${-252 + sink * 0.4})`, () => {
      ink([[-30, -52], [30, -84]], 6.4, { taper: [0, 0], minW: 1, wob: 0 });
      ink([[-30, -52], [30, -84]], 3.4, { color: P.wood, taper: [0, 0], minW: 1, wob: 0 });
      cel(I.ell(0, -58, 19, 15, 12), hair, hairSh, { w: 2.8, lx: 4, ly: -4 });
      cel(I.ell(46, 6, 7, 10, 10), SKIN, SKIN_SH, { w: 2.2 });
      cel(I.ell(-46, 6, 7, 10, 10), SKIN, SKIN_SH, { w: 2.2 });
      const hp = [[-46, 10], [-50, -18], [-36, -44], [0, -52], [36, -44], [50, -18], [46, 10], [30, 34], [0, 40], [-30, 34]];
      cel(hp, hair, hairSh, { w: 3.2, lx: 8, ly: -6 });
      const hi = age >= 55 ? '#ffffff' : mix(hair, '#6f8fb3', 0.75);
      I.clipPoly(hp, () => fill([[-34, -30], [-24, -40], [-18, -30], [-8, -42], [-2, -32], [8, -42], [14, -32], [24, -40], [30, -30], [24, -26], [14, -24], [8, -34], [-2, -24], [-8, -34], [-18, -22], [-24, -30], [-32, -22]], hi, { lin: true, wob: 0.3, op: age >= 55 ? 0.8 : 1 }));
      ink([[-24, -30], [-30, 0], [-20, 26]], 1.4, { color: hairSh });
      ink([[20, -34], [30, -4], [20, 24]], 1.4, { color: hairSh });
      ink([[0, -40], [2, 30]], 1.2, { color: hairSh, op: 0.6 });
      if (o.glasses) ink([[46, -2], [60, 4]], 1.8, { color: '#6b4a2e' });
    });
  });
}

module.exports = { SKIN, SKIN_SH, BLUSH, robeColors, kneeler, backView };
