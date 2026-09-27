# Wobbling Will: diagnosis and fixes (comic phase)

Files: `comics/wobbling.js`, renders in `work/comics/wobbling-will/` (`go.sh` renders 2x, a preview and the
panels), before/after in `work/comics/wobbling-will/before-after.png` and `ba-01.png` … `ba-11.png`, final
`out/wobbling-will.svg`, `out/wobbling-will.png`, `out/wobbling-will/NN.png`.

References opened side by side (comparison only): `work/ref/strips/04-camus-winter.jpg` (the girl riding up the
hill, the "invincible summer" bicycle finale, the four-panel repeated bedroom grid, the colour change to orange),
`work/ref/panels/04-camus-winter/37.png` (older woman on a lakeside path, bench, flat water: the park register),
`work/ref/panels/05-stonecutter/02.png` (extreme close-up on the eyes), `work/ref/panels/04-camus-winter/16.png`
and `27.png` (flat landscape staging), `work/ref/panels/10-curie-happy-place/03.png`.

## Diagnosis of the before page (`work/before/wobbling-will.png`, rendered with the current engine too)

Global: the comic drew its own toy bicycle (`bike()`/`wheel()`/`rider()` in the comic) with rider contact points
tuned for the old rig; with the round-3 figure the rider floats over the saddle, knees through the frame, hands
short of the bars. The park was one generic strip of lollipop ellipses, a flat river band and a stick bridge, the
same in every morning panel with no foreground, no depth and no designed focal point. The colour script existed
only as a tint; Peg's mustard did not read as the one warm thing in a cold world. Peg acted with generic moods.

1. **Shed (title panel).** Shed was three flat rectangles; the doorway a flat black box with two sticks. Peg's
   hands met a toy bike; the price tag was a tiny unreadable box. With the new rig her head was cropped by the
   frame. No sense of "wheeling it out"; the bike stood beside the shed, not coming out of it. Ref: camus 17
   (girl with bike under the tree) has the bike as a real object held at the grip.
2. **Push off.** Toy bike and floating rider; worried face at 20 px; "WOBBLE" was a font set straight with a rot,
   not wobbly lettering; the wobble marks were loose chevrons. Background: the generic park strip.
3. **CRASH.** A big green blob with two stick legs and a hole ellipse, a bike wheel on the grass. Readable as a
   joke but not drawn: no hedge design, legs as capsules, skirt a flat patch.
4–6. **Three mornings.** The same framing, good idea, but the framing was weak (no foreground, no depth, bench and
   river strip), and the three changes were inconsistent: a sprawled rig in a puddle, a riding panel with kids,
   a riding panel with a square plaster. Not one repeated action, so the repetition didn't bite. Ref: camus'
   four identical bedroom panels change one thing each.
7. **Notebook.** Good beat; the hand was a small blob pinching nothing; the tally and notes fine.
8. **Dusk bench.** Rig sitting upright with hands on knees, reads "resting", not dejected. Bike squashed toy.
   Background: flat gradient and a grey ground, no park.
9. **Eyes on the wheel.** Face at s=3, eyes small inside the head, wheel a set of thin circles; not "huge".
   Ref: stonecutter 02 fills the panel with the eyes.
10. **The turn.** The same park strip in orange, rider small in the middle, a dotted eye-line to a stick bridge;
    the head-lift is invisible at that size.
11. **Splash.** Toy bike with rider on top, kids as small stiff figures, a clip-art duck; path a flat band.
    Ref: camus finale: the bike on a diagonal path, rider big, arms out, one colour field.

## Fixes (per panel)

Global:
- The local toy bike, wheel and rider are gone. Every bicycle is `zp/bike.js` through `F.POSES.bike.wheel`,
  `F.POSES.bike.ride` (`wobble` / `fly`) and `F.POSES.bike.crash`, or `BK.bike` for the title, the crash and the
  bike lying in the grass.
- Peg uses the face preset (`face: 'peg'`), the round-2 key clean-up (`eyeW 0.22, eyeH 0.26, jaw 0.95`, no
  `nose`/`noseLen`) and `top.type: 'cardigan'`. Kids use `face: 'boy'` / `'girl'`.
- Colour script made explicit as palettes: COLD (blue-grey, grey-green, pale path) for every morning, DUSK
  (violet) for the bench, grey for the close-up, WARM (orange, gold, olive) from the turn on. The mustard
  cardigan is the only warm colour until the turn, when the whole world takes her colour.
- The park is one designed set (`park()`): hazy far bank with a treeline, the river, the footbridge far right,
  middle-ground trees, a hedge and bench on the near bank, a curved path, a foreground oak cut by the left frame
  (spot-black canopy pocket), and the duck on the river as the running witness.
- New local helpers: `wobbleWord` (per-letter bobbing SFX), `arcs` (wobble / motion marks), `scooter` and
  `scooterKid`, `duckFly`, `priceTag`, `plaster`, `kneeBandage`, `boxHedge` (a clipped hedge with a top face,
  front face, leaf scallops and a hole), `bikeFlat`, `track`.

1. Shed: stained-board shed with a felt roof, the door swung open toward us, a straight-edged black doorway with
   a shelf of tins, a hose coil, rake and spade, a cobweb and the pale patch where the bike stood. Peg (s 0.86,
   head fully in frame) walks the bike out with `bike.wheel`, determined smile, eyes on the road; a readable
   `£15` tag swings from the bars. Board fence, a neighbour's roof, flower bed, robin on the fence, watering can,
   mug steaming on the gatepost.
2. Push off: `bike.ride({wobble})` tilted −7°, worried face with a wobbly mouth, sweat drop, wobble arcs round
   the front wheel and the head, a wavering tyre track behind her, WOBBLE WOBBLE lettered letter by letter.
3. CRASH: rebuilt as a box hedge along the path. Her legs (legs-only figure, upside down) kick out of a dark hole
   in the hedge top, skirt bunched at the rim, broken twigs and leaves bursting out; the bike nose-down in the
   hedge with its back wheel spinning; her red glasses flying off; CRASH! big in the sky.
4–6. Same park framing, same camera, Peg in the same `bike.crash` fall in the same spot each morning; one change
   each: DAY 4 a puddle with a splash from both ends and SPLOSH!; DAY 11 two kids on scooters, one pointing and
   laughing, Peg embarrassed (worried face, flush hatching, sweat) and HA HA!; DAY 19 plaster on the forehead,
   both knees bandaged, a set, determined face with anger ticks.
7. Notebook: table-top close-up, spiral-holed lined page, FALLS with 23 tallies (four gates and three strokes),
   notes reflowed to three short lines so the hand no longer covers them; Peg's hand (`hand(..., 'pen')`, s 5.2)
   pinching the pencil on the 23rd mark, coming out of a mustard sleeve with a ribbed cuff.
8. Dusk: violet sky with a crescent moon and first stars, the park in silhouette (oak, poplars, footbridge,
   unlit lamppost), Peg hunched forward with her chin on her fists, eyes down on the bike lying in the grass.
9. Close-up: Peg's head at s 7.2, cropped by the frame so her glasses and eyes fill the left third, pupils locked
   down-right on the front wheel; the wheel huge with ghost copies to both sides, wobble arcs and focus lines,
   sweat drop.
10. The turn: warm orange sky with sun rays, the footbridge dark against the sunrise, the river gold, a path from
    the foreground to the bridge; Peg big in the foreground on the bike, chin up, calm smile, looking ahead.
11. Splash: the river path in a long diagonal, the bike tilted −14° to sit on it, Peg flying (`fly`: feet off the
    pedals, skirt streaming, laughing), speed lines behind her, the two kids on their scooters cheering with
    both arms up, the duck airborne with water dripping, the bridge and sunrise ahead, poppies in the corner.
    Attribution caption lettered straight on the sky, as in the camus finale.

## Engine requests

None filed. Things I worked around locally:
- `F.POSES.bike.crash` always puts the rider in the same `fallen` pose; I reused it deliberately for the
  repeated framing.
- The upside-down crash uses `parts: ['legN', 'legF']` plus a clip, because a rotated figure's skirt still
  hangs toward its feet.

## Story changes

- Panels 4–6 now show the same fall three times (a repeated action) instead of a fall, a ride and a ride with a
  plaster. Reason: the repetition device ("three identical park panels, three different falls") only works if
  the action repeats and one thing changes.
- The crash adds Peg's glasses flying off (a shoe flying off would contradict both shoes still on her feet).

## QC (1x, `python qc/score.py out/wobbling-will.png`)

```
== out/wobbling-will.png  (11 panels, 2828 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       19.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.00   0.00/0.00/2.00/3.00/18.00          PASS
median ink stroke width                    2.36   1.70/1.90/2.10/2.34/2.60           OK
heavy (90th pct) ink stroke width          3.02   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.25   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.77   0.53/0.63/0.72/0.81/0.89           PASS
number of dominant hues                    4.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               3.17   0.00/0.75/1.41/2.42/3.84           OK
share of the page that is black ink        0.11   0.01/0.09/0.16/0.22/0.30           PASS
```
No FAIL.

## Remaining weaknesses (honest)

- **Characters at small size.** In the three mornings and the dusk panel Peg's face is ~30 px; expressions
  (embarrassment, determination) read mostly through props (flush, sweat, ticks, plasters), not the face.
  ZP would push the acting further (bigger heads, exaggerated brows).
- **Riding skirt.** The engine's streaming skirt in the splash and the push-off is a dark slab over the thighs;
  it reads as a skirt only at a glance.
- **Crash legs** are thin engine legs; the hedge front face is a large, fairly flat green area.
- **Kids** are stiff at their size; the laughing boy's belly-laugh pose does not read.
- **Backgrounds** are designed now (layers, foreground oak, bridge as the destination) but still use repeated
  scene.js elements; ZP's parks have more specific, drawn detail (paths with edges and puddles, varied trees).
- **The turn panel** shows only the handlebar and basket of the bike; the head-lift reads through the calm face
  and the eyeline to the bridge rather than through a before/after head angle inside one panel.
- **Line**: median stroke 2.36 px is slightly heavier than ZP's middle 50% (OK, not PASS).
- Overall I would put it at about 6–7/10 against real ZP strips: layout, colour and storytelling are close;
  characters, hands and finish are below the 8/10 bar.

## Audit 3 fixes (blind audit, `work/audit/wobbling-report.md`, strip "C", mean 3.9)

Comic-level items, all addressed in `comics/wobbling.js`:

- **Title.** The spot bicycle is moved up and away from the canvas edge. The wavy underline and the typeset
  credit line are replaced by a ZP-style title block: outlined block letters, the author reversed out of a
  black brush banner, and credits in hand lettering.
- **Captions and lettering.** A new local `hcap()` replaces every `PG.caption`. It sets all-caps Patrick Hand
  (`Journal`), gives each line its own slight tilt, and makes words in `*stars*` bigger and heavier
  (FINALLY, WOBBLING WILL, WOBBLING WHEEL, FRANCES E. WILLARD). The boxes are hand-inked with irregular
  corners on off-white. The DAY captions use the same boxes.
- **Bridge ends in mid-air.** A new local `footbridge()` replaces `SC.bridge` everywhere. It is drawn in
  perspective from the near bank to the far bank, with stone abutments on both banks, the arch opening in
  shadow on the water, and a post-and-rail railing. Its position and angle change per panel: far right in the
  morning park, far left in panel 2, none in panel 3, then the dusk, turn and finale versions.
- **Stamped backgrounds.** Panel 2 has a new framing: lamppost at left, bridge far left, a round tree cut by
  the right frame, no oak and no bench. Panel 3 drops the bridge and gets its own oak and a path strip in
  front of the hedge. The trio keeps the set on purpose, but each day has its own light and season.
- **Panels 4–6: visible change each day, fresh poses, and Day 19 shows an event.**
  - DAY 4: grey drizzle (rain streaks, darker sky). She lands sitting in the puddle, splash, SPLOSH!
  - DAY 11: autumn wind (ochre trees, blowing leaves). She is flat on her back with the bike upside down on
    her legs, wheels spinning; the two kids arrive and point, HA HA!
  - DAY 19: hard frost (pale sky, frosted grass, frost ticks). The front wheel hits a stone, the bike's back
    end kicks up, and she flies over the handlebars. The plaster and both knee bandages from earlier days
    are on. The duck takes off in alarm. WHUMP!
- **Panel 3.** Both legs now come from a near-frontal figure with matching proportions and splayed knees. The
  hedge front face is shorter and has leaf-clump value patches instead of the stamped tick texture, and a
  path runs in front of it with a wobbly tyre track leading into the crash.
- **Panel 9 staging.** Split into two panels in one space and moment:
  - 9a: an extreme close-up strip on her eyes and glasses, pupils dropped.
  - 9b: a close side view of her on the bike (`bike.ride`, `wobble`) with her hands on the bars, the fork,
    ghost wheels showing the front wheel swinging, a dotted eye-line from her glasses to the wheel, and the
    caption.
- **The turnaround is shown.** Panel 10 is split:
  - 10a: the head-lift itself. Her face turns up, surprised; there is a sun glint in her glasses; the
    background changes from cold grey-blue on the left to sunrise orange on the right. This is where the
    colour script turns.
  - 10b: the whole bike on the path, head up toward the bridge. Behind her the tyre track wobbles, then goes
    straight from where she looked up. It carries the caption RATHER THAN A WOBBLING WHEEL.
- **Panel 10 basket with no bike.** The whole bike is now shown in 10b.
- **Panel 11.**
  - Feet are on the pedals: the `fly` pose is gone and the crank is set, so she is pedalling.
  - The attribution is hand-lettered bottom-right, read last.
  - The kids have different actions: the boy stands on his scooter with his arms up; the girl scoots after
    her with a fist raised.
  - A warm glow is added behind Peg for backlight.
  - The flowers moved bottom-left, clear of the caption.
- **Panel 1.** Both hands now hold the bars. The shed interior has a planked back wall, a lit floor wedge
  from the doorway and lighter props. The bike's rear wheel overlaps the doorway, so she is visibly coming
  out of the shed.
- **Panel 8.** Hand-lettered caption with FINALLY emphasised, and the new footbridge in the background.

Engine-level items (not duplicated locally, per the coordinator; reported by the audit and assigned to the
engine maintainer and face lead): thick-thin inking, the riding-skirt slab (still visible in panels 2, 9b,
10b and 11 at the last render), bench sitting (panel 8 now sits on the bench), handlebar legibility, the pen
grip in panel 7, jaw shadow, the nose under glasses, and small-size expressions. zp/ files changed between
03:33 and 03:46; the final render (after 03:51) includes those changes.

The page grew from 11 to 13 panels (9 → 9a + 9b, 10 → 10a + 10b). `ba-09.png` and `ba-10.png` show one
before panel against two after panels.

### QC after audit 3 (1x)
```
page side margin (px)                     47.00   PASS
gutter between side-by-side panels        15.00   PASS
gutter between rows                       19.00   PASS
panel border thickness                     3.00   PASS
median ink stroke width                    2.43   OK
heavy (90th pct) ink stroke width          3.14   PASS
colour saturation (median)                 0.20   OK
colour brightness (median)                 0.78   PASS
number of dominant hues                    4.00   PASS
texture/grain in flat colour               3.24   OK
share of the page that is black ink        0.11   PASS
```
No FAIL.

### Still weak after audit 3 (honest)
- The riding skirt is still a dark slab, pending the engine fix. Re-render when it lands: `sh work/comics/wobbling-will/go.sh`,
  then the 1x render and QC.
- Figures at trio size (DAY panels) are small; the DAY 11 tangle reads as a pile-up more than as a clear
  drawing of legs through the frame.
- The eye strip (9a) relies on the engine face; the glasses bridge still reads as a red tab until the face
  lead's fix lands.
- The wobble ghost wheels in 9b are subtle.
- The basket in the engine bike still floats a little ahead of the bars.

## After the engine fixes landed (re-render)

- Re-rendered with the new engine: the riding skirt now drapes over the saddle, feet are on the pedals,
  handlebars read, the pen grip in panel 7 is fixed, bodies and hands have thick-thin brush lines, and the
  face round 4 is in.
- Panel 8 uses the engine's `benchDejected({ chin: true })` (chin sunk in her hands, elbows on her knees, sitting on the
  bench) with the new `dejected` mood, replacing my local chin-on-fists override.
- The DAY 11 face uses the new `embarrassed` mood.
- DAY 11 pile-up: Peg is larger and her head and torso are clear on the left. The upside-down bike (without
  its basket) sits over her shins only. The kids are smaller and further back on the path.
- 9b wobble ghosts are stronger (45–50% opacity, wider swing).
- The basket no longer floats: the local `struts()` adds two stays from the basket to the front axle and a
  bracket to the head tube on every ridden or wheeled bike (via local `ride()` / `wheelB()` wrappers).
- QC median ink: per-panel medians were already 1.6–2.3 px. The page median was pushed up by panel borders
  (13 panels) and the heavy title outlines. Panels now use a 2.3 px border (local `panel()` wrapper), and the
  title outline is 2.6/2.8 instead of 3.2/3.4. Median ink is 2.07, PASS.

QC (1x): margins, gutters, border 2.00, median ink 2.07, heavy ink 3.00, brightness 0.77, hues 4 and black
share 0.11 all PASS; saturation 0.20 and grain 3.23 are OK. No FAIL. One 1x render reported grain 0.00; it
did not reproduce on re-render.

## Audit 2 fixes (second blind audit, `work/audit/wobbling2-report.md`, strip "D", mean 6.1)

- **P9 eye strip (9a):** now a frontal head (yaw 0), cropped to the eyes. Both ears and both head edges show,
  and the temple arms are short stubs going back to the ears. The wobble arcs that didn't read are removed.
- **P3 CRASH:** her rump, with the skirt pulled tight over it, now sits up out of the hedge hole with a centre
  seam. Both legs grow from it (the figure's hip is placed on the rump), and the hem flops down round the
  rim.
- **P5 DAY 11:** the bike lies on its side on the path (foreshortened). She is on her back with both legs
  across the frame and one shin through the front wheel (the tyre is redrawn over her shin). Her face is
  clear and embarrassed. The kids are smaller and further back, clear of the wheel; HA HA! sits just
  above them.
- **P6 DAY 19:** staged at the moment of impact. The front wheel hits a stone and the bike's back end kicks
  up. She stays on it, pitched forward over the bars, hands gripping them, seated, with the plaster and knee
  bandages on. The duck has moved to the upper left, away from the wheel.
- **P7 pencil:** the engine pen grip at an angle where the fingers wrap over the pencil (flipped hand, −110°),
  with the tip on the 23rd tally.
- **Consistency:** a local `tint()` keeps her glasses their own red under every scene tint (the brown frames
  in panels 1 and 2 came from the cold tint). Glasses, bun and cardigan checked side by side across all
  panels.
- **Bike angles:** the title bike is drawn in 3/4 (foreshortened and skewed). DAY 11 has the bike flat on
  its side, DAY 19 kicked up, and panels 2, 9b, 10b and 11 are side views at different tilts. All riders'
  feet are on the pedals (engine fix).
- **Sunbursts:** a local `sunRays()` replaces `PG.rays` in 10a, 10b and 11. Rays have irregular widths,
  lengths and angles, wobbly edges and a different seed per panel.
- **P8:** the lamppost moved away from her head (no tangent), and the moon's glow rings are removed.
- **P11:** the attribution is in a hand-lettered caption box bottom-right, read last.
- Re-rendered after the engine's page.js lettering and glow changes (04:35).

QC (1x): median ink 2.03 and heavy ink 3.01 PASS; brightness, hues, black share, margins, gutters and borders
PASS; saturation 0.20 and grain 2.47 OK. No FAIL.

### Remaining weaknesses (honest, after audit 2)
- The bike is still one side-elevation model; only the title bike is truly foreshortened. A real 3/4 or
  rear riding view needs a 3-D bike in the engine.
- DAY 19 now reads as a jolt forward rather than as flying over the bars.
- Figures in the trio panels are small; hands at that size are still simple.
- The P3 rump is a drawn local shape, not the engine body, so it is simpler than the rest of her.
- The page still reads as clean digital drawing next to Zen Pencils' brush and wash texture.
- The SFX all share one display font; varying them is left to the engine's lettering work.
