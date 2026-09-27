// Character + motif sheet for "Every Line Alive": the artist at six ages, hands, cranes, wave.
const fs = require('fs');
const I = require('../lib/ink'); const A = require('../lib/artist'); const H = require('../lib/hoku');
const F = require('../lib/face'); const Hd = require('../lib/hands');
I.seed(5);
[[6, 'neutral'], [50, 'sad'], [73, 'focus'], [110, 'joy']].forEach(([age, mood], i) => I.grp(`translate(${80 + i * 230} 380)`, () =>
  A.kneeler({ age, mood, glasses: age >= 73 && mood !== 'joy', hand: mood === 'joy' ? 'up' : 'write', lean: mood === 'joy' ? -18 : 0, look: [1, 0.8] })));
I.grp('translate(40 470) scale(1.6)', () => Hd.gripHand({}));
I.grp('translate(200 610) scale(1.6)', () => Hd.openHand({}));
I.grp('translate(330 510) scale(1.25)', () => F.head({ age: 30, neck: 50 }));
I.grp('translate(470 510) scale(1.25)', () => F.head({ age: 90, glasses: true, mood: 'focus', neck: 50 }));
I.grp('translate(560 760) scale(0.6)', () => A.backView({ age: 90 }));
I.grp('translate(720 520) scale(0.8)', () => H.crane({ flap: 0.1 }));
I.grp('translate(740 620) scale(0.7)', () => H.crane({ flap: 0.85 }));
I.grp('translate(820 790) scale(0.7)', () => H.greatWave(0, 0, 150));
[0, 0.5, 0.95].forEach((s, i) => I.grp(`translate(${20 + i * 150} 660)`, () => { I.rect(0, 0, 140, 90, '#fbf6e8'); H.fuji(140, 90, s); }));
const body = I.take();
fs.mkdirSync(__dirname + '/../out/archive', { recursive: true });
fs.writeFileSync(__dirname + '/../out/archive/model-sheet-hokusai.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="800" viewBox="0 0 980 800">${require('../lib/fonts')()}<rect width="980" height="800" fill="#efe3c9"/>${body}</svg>`);
