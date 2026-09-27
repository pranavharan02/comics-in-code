# Up-Hill: panel diagnosis and fixes (comics phase)

Files: `comics/uphill.js`, `comics/cast_uphill.js`. Before: `work/before/up-hill.png` and `work/before/up-hill/NN.png`
(a fresh render of the old code is in `work/comics/up-hill/before/`). After: `out/up-hill.png` (1x),
`out/up-hill/NN.png` (2x panels). Pairs: `work/comics/up-hill/before-after.png`, `work/comics/up-hill/ba-NN.png`.
Split with `--title-height 230` (the first panel starts at y 250; 150 would cut the title's door spot art off
the title strip but it is not detected as a panel either way).

Panel numbers follow the split files: 01 hill/dawn, 02 walking, 03 hand insert (script 2b), 04 hill/afternoon,
05 wall, 06 hill/dusk, 07 Isla close, 08 Grandad points, 09 night road, 10 piggy-back, 11 door, 12 bed.

## Diagnosis of the before page (what was wrong, per panel)

**01 hill, dawn** (ref: `03-asimov/32`, `13-karnazes/14`).
Background: a flat dome with even stripe texture, a sine-wave road of constant width (no perspective), lollipop
trees of one size. No foreground, no depth layers, no framing. Figures: `tiny()` two-shape stand-ins, 15 px.
Colour fine. Lettering: tails 150 px long over empty grass. Story: reads as a diagram. ZP's Fuji panel has a
designed mass, a framing branch in front, value steps into the distance and one focal point.

**02 walking, noon** (ref: `23-watterson/19`, `03-asimov/28`).
Grandad's head cropped by the top border; legs are straight tubes twice his torso; Isla a stiff capsule, the
clasp a lump. Background: a strip of identical rounded "wall" blocks, empty sky, flat lane. Balloons cover
his body. The noon colour is right but the panel has no destination: nothing says "uphill".

**03 hands insert** (ref: `23-watterson/02`, `01-lil-vincent/01`).
Crude: a red tube and a beige polygon with three lines for fingers; no knuckles, no finger separation,
reads as a mitten on a stick.

**04 hill, afternoon** — same defects as 01 (identical code); the two dots mid-hill are unreadable.

**05 wall** (ref: `16-rachel-carson/21`, `17-stephen-king-desk/16`).
Wall made of identical rounded blocks with a row of teeth on top; figures sit stiffly, Isla's legs and Grandad's
torso are capsules; the sandwich hand-off floats between two fists; "long shadows" are two grey quads.
Expressions neutral.

**06 hill, dusk** — as 01; the lit window is a dot, which is right for the colour script.

**07 Isla close-up** (ref: `08-malala/27`, `04-camus-winter/06`).
Generic front-facing sticker face centred in the panel, huge round eyes staring at the reader, trees are
blue circles. No acting: she is not looking at the dark, nothing in the body reacts.

**08 Grandad points** (ref: `16-rachel-carson/19`).
Kneel reads, but the pointing arm crosses Isla's face and the balloon tail ends in her head; his face frowns.

**09 night procession** (ref: `02-gift-of-life/43`, `14-goddard/01`, `03-asimov/23`).
Six identical walkers in the same pose at the same spacing (clones), road a thin ribbon, no depth;
Grandad's head cut off by the top border behind a balloon; the two balloons' tails cross.

**10 piggy-back** (ref: `03-asimov/27`).
Broken: Grandad's head off-panel, Isla invisible except a boot and an arm; steps are flat slabs; balloon tails
run the length of the panel.

**11 door** (ref: `03-asimov/07`).
Isla is a floating head, Grandad a big back overlapping the hosts, hosts in hourglass dresses; wall a grid of
equal rectangles; the door does not read as a threshold (no reveal, no step, no spill of light).

**12 bed, splash** (ref: `04-camus-winter/07`).
Isla lies on top of a flat quilt; Grandad sits upright with his cap on in a pink blob chair; the last caption
overlaps his head and the z's; a big dark empty wall.

Page-level: brightness median 0.51 (FAIL, below the ZP 10th percentile), balloons often cover faces, figures
never overlap a prop, and no panel has a designed foreground.

## Fixes (what changed, per panel)

- **Cast**: `face: 'isla'` / `face: 'grandad'` presets (CAST-UPDATES.md), stale eye/jaw/nose keys removed,
  Isla `shoeType: 'boots'`, Grandad's jumper darkened to `#3f6e4a` (figure/ground contrast on green hills).
- **01 / 04 / 06, the hill (one design, repeated)**: new `hillPanel()`. A designed hill silhouette (`HILLP`) with
  far country in two hazy value steps and a treeline; fields as bands between contour hedgerows with cross-hedges
  and a few crop-toned fields; a flat cel shadow flank with contour hatching on the side away from the light;
  hedgerow oaks sized by distance; sheep at dawn. The road is a ribbon that narrows with height (64 px at the
  foot, 4 px at the crest) and switches back three times to the inn. Foreground: dry-stone wall, gatepost and an
  open five-bar gate, a fingerpost reading INN pointing up the road, grass verge, and a big oak framing the right
  edge. The inn is a proper cottage (gable in shadow, chimney, windows, door; smoke at dawn; a lit window at dusk).
  The walkers are the real rig (`F.duo.handInHand`, seen from behind) scaled with the road width; below
  s 0.12 a cleaner two-colour silhouette. Only the time of day changes: dawn mint/cream, afternoon amber,
  dusk violet. Balloons in 01 moved into the sky over the figures with shorter tails.
- **02 walking**: `F.duo.handInHand` with the stick, s 0.62 so nothing is cropped; Grandad smiles down, Isla
  looks up, mouth open (asking). Background: far treeline, the same hill with the inn small on the right (where
  they are going), an oak, a rough dry-stone wall behind the lane, a lane with a rut line, a flowered verge.
- **03 insert**: rebuilt as "her fist round his finger": engine `hand('point')` for his old hand (knit cuff,
  age spots), engine `hand('grip', {object})` for her small fist with his index finger drawn as the gripped
  object at the right depth (her fingers wrap in front), nail on his fingertip, a soft sunburst ground.
- **05 wall**: `SC.stoneWall` (packed dry-stone, coping), `F.POSES.sitWall` for both: Isla holds her sandwich
  in her lap and looks up at him, worried; Grandad, eyes smiling, holds out his half. Stick leaning on the wall,
  low sun left, wall shadow and long shadow band to the right, oak and treeline behind.
- **07 close-up**: off-centre head turned 52° toward the dark wood, eyes sliding left, worried brows, wobbling
  mouth; one hand clutching her collar; collar drawn over the neck; black oak and pine masses crowd in from the
  left against a violet-to-coral sky. Balloon tail shortened so it no longer enters the eye.
- **08 points**: `F.POSES.crouchPoint`; the arm now points past everything at the lit inn (two windows and the
  door lit, glow); Isla stands apart looking up, surprised; his stick in the grass; eyes-closed smile.
- **09 night road**: wide perspective road (150 px at our feet, a thread at the crest); seven different
  wayfarers (granny, bearded man with staff, a woman leading a girl who carries her own lantern, bald old man,
  capped man, two far ones), each a silhouette with a lantern and a warm pool of light on the road, spaced
  unevenly and shrinking with distance; the nearest has stopped and turned back, lantern raised. Isla and
  Grandad hand in hand from behind at the bottom left, bracken banks framing both corners, moon over the crest.
  Balloons left-to-right, tails no longer cross.
- **10 piggy-back**: `F.duo.piggyBack` at s 0.72 climbing stone steps (feet IK'd onto the treads); Isla asleep
  on his back, z's clear of the balloon; the inn's brick gable with a wall lantern and the door's glow from the
  right. Balloons in reading order, no longer covering heads.
- **11 door**: threshold staging (as in `03-asimov/07`): packed stone front (`SC.stoneWall` as a wall face),
  deep stone reveal, lintel and step, the door leaf swung in, warm room and hearth behind, light spilling out over
  the step and onto the two of them. Hosts varied (granny with glasses reaching out to Grandad, bearded man
  waving, a laughing girl, an old man with a hand on his heart and a wave), all smiling. Isla and Grandad hand in
  hand from behind in the foreground. Dress figures drawn mirrored to dodge the engine's negative-yaw skirt bug.
- **12 splash**: custom bed (headboard, rail, mattress, pillow), Isla asleep on the pillow under a patchwork
  quilt that mounds over her body with a fold shadow; candle on a bedside table with a light pool on the floor;
  window with curtains, stars and moon; a small framed picture of the green hill; striped wallpaper; rag rug and
  her wellies; Grandad asleep in the armchair, cap off and on his knee, hands folded on his belly, stick against
  the chair. The last caption is set large, centred at the bottom, with the attribution under it; the question
  caption stays top left.

## Engine requests
Appended to `work/engine-requests.md` under "[up-hill] comics phase": negative-yaw skirts/dresses (bow-tie
cloth), the flat white hair band on hatted back views, the moustache reading as teeth, and a proper
finger-grip close-up hand. All four are worked around locally in `uphill.js` (`figM`, `GDB` + `gdFringe`,
`mouth: 'flat'` + `mood: 'joy'`, the custom p2b grip).

## Story changes
- Panel 11 (door): Isla is set down and walks up the step hand in hand with Grandad instead of still riding on
  his back. The piggy-back from behind could not be drawn cleanly, and holding hands at the threshold repeats
  the page's hand-in-hand device from panels 1-3 and 9, so the ending of the walk reads as arriving together.
- Panel 5 (wall): Grandad holds out his half of the sandwich while Isla holds hers, so the "sharing" is a
  gesture of reassurance that lands on his answer.
- Hill panels: a fingerpost reading INN at the foot of the road (a small world detail; it names the goal the
  poem asks about from the first panel).

## Remaining weaknesses (honest)
- Figures are still the engine rig: Grandad's back view is a cap on a long thin neck, and his moustache hides
  every smile (his warmth reads only through closed-eye "joy"). In 10 his effort face looks like a grimace.
- The hill's hedgerows are still fairly regular contour bands; a ZP hill would be simpler and bolder (fewer,
  larger shapes, a stronger light/shadow split). The inn at the crest is small at 1x.
- Night silhouettes in 09 show faint interior lines; at 1x the wayfarers read as walkers with lanterns but the
  differences between them (bun, staff, child) are subtle.
- 10: the piggy-back is readable but the pose is the library pose on a stair; Grandad's legs are long and
  straight and the step contact is approximate.
- 11: Isla's balloon tail is long (her head is low in the frame); hosts' hands are small; the mirrored figures
  have their cel light on the wrong side.
- 12: the armchair is a flat stylised shape; the cap on the knee is a simple wedge.
- Brightness is now OK (0.58) but still below the ZP median, by design of the dusk and night panels.

## QC (1x, `python qc/score.py out/up-hill.png`)
```
== out/up-hill.png  (13 panels, 3698 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       20.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.00   0.00/0.00/2.00/3.00/18.00          PASS
median ink stroke width                    2.31   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.37   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.37   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.58   0.53/0.63/0.72/0.81/0.89           OK
number of dominant hues                    5.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               2.37   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.10   0.01/0.09/0.16/0.22/0.30           PASS
```
Before: brightness 0.51 FAIL, panel border 17.25 OK. After: no FAIL (brightness lifted into range without
changing the dawn → noon → afternoon → dusk → night order: lighter dusk hill and road, a less black night sky,
lantern pools, and a candle-lit bedroom instead of a dark violet one).

## Audit 3 fixes (blind audit, work/audit/uphill-report.md: mean 4.4)

Engine changes picked up (zp/ mtimes 03:33-03:46): skirts at negative yaw are fixed, so the mirrored-figure
workaround (`figM`) is gone; the face lead's new back-of-head (fringe under the cap) replaces the local
`gdFringe`/bald-back workaround (`GDX = C.grandad`; the old code stays behind `GDB` for reference). Brush inking
and small-size expressions come from core.js/head.js automatically on re-render.

- **Repeated hill (01/04/06).** Same framing (the ZP repetition device), but the change is now legible: the
  walkers are drawn bigger (min s 0.15, rig not stand-ins) and visibly higher each time (foot of the road, the
  middle switchback, the crest); the sun moves (low left at dawn, high right in the afternoon, set at dusk with a
  warm afterglow and first stars); the shadow flank flips from the right flank to the left and then covers the
  whole hill at dusk with a warm rim on the crest; the hedgerow trees cast shadows that swing with the sun; the
  sheep (now with legs) graze elsewhere each time and huddle by the hedge at dusk; birds; chimney smoke at dawn;
  the inn's windows go from dark to lit with a glow round the walkers. The lone gate is now hung on a gatepost
  against the wall. Clouds were being drawn 1 px wide (wrong size unit) and left stray black dots: fixed.
- **01 tails.** The question points at Isla, the answer at Grandad (separate mouth anchors, `mouthOf()`).
- **02.** Isla walks a little apart so the joined hands read against the wall; Grandad's balloon moved to the
  side his face points to, tail at his mouth; the stray dot (a 1 px cloud) is gone.
- **03 hand close-up.** Rebuilt: his hand hangs open and relaxed (back of the hand, fingers down, thumb free),
  her small fist wraps round his index and middle fingers, which pass through her grip and show their tips
  below; knit cuff with ribbing and a turned edge; her sleeve with a cuff band and a fold.
- **05 wall.** The wall has a flat top slab they sit on (thighs now come forward over its front edge); the stick
  leans with its foot on the grass and its crook hooked over the wall top; Isla's legs are separated; tails aim
  at the speakers' faces (Grandad's short, from the side he faces).
- **07.** Collar made smaller, head bigger in the frame, a larger, articulated hand pulling the collar.
- **08.** Grandad keeps his stick, planted in his far hand while he crouches and points; Isla stands with her
  hands clasped at her chest instead of hanging mittens.
- **09 procession.** Wayfarers are real, differently dressed figures pushed into the night by tint (not flat
  silhouettes); every lantern is drawn inside the grip of a hand (hand-object hook), the girl carries her own;
  the nearest (the granny) has turned back toward Isla and raises her lantern; light pools sit under each
  lantern and scale with distance; kind closed-eye faces.
- **10 steps.** Isla is awake and sleepy (half-lidded, murmuring) instead of asleep, no z's, solid balloon; the
  stairs lead to the inn's door (lit round the edges and through its glass, lantern beside it); Grandad's stick
  hooks over his forearm while his hands hold her knees; his balloon moved below, tail to his mouth.
- **11 door.** It now reads as the inn: an INN sign on an iron bracket, the wayfarers' lanterns hung on pegs
  inside, and the hosts are the same people (same faces and clothes) as the procession, one holding up his
  lantern; the stray raised hand is gone (old man's arm lowered); Isla stands apart so their joined hands
  show; solid balloons (no whisper convention).
- **12 splash.** The quilt is a patchwork grid bent over the mound of her body and then hanging straight over
  the mattress edge, with a shadowed drop and fold; the detached hand and the two stray strokes are removed;
  the cap on his knee is a proper flat cap (crown, band, peak); the near armrest is drawn behind his legs; the
  last line sits in a cream caption box with the attribution inside it, readable over the rug.
- **Title.** The stock door icon is replaced by a roundel of the journey (the hill at dusk, the road, the lit
  inn).
- **Grandad consistency.** Same design everywhere (face preset, moustache from the head engine); stick present
  in every walking panel (02, 01/04/06, 09 hooked on his arm, 10 planted, 11 against the chair), never dropped.

Not fixed (engine or out of comic scope): limb construction (tube legs), line quality beyond what core.js now
supplies, and the red bevelled title word (engine sfx lettering).

QC after audit 3:
```
== out/up-hill.png  (12 panels, 3698 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       20.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.50   0.00/0.00/2.00/3.00/18.00          OK
median ink stroke width                    2.31   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.35   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.37   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.58   0.53/0.63/0.72/0.81/0.89           OK
number of dominant hues                    5.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               2.35   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.10   0.01/0.09/0.16/0.22/0.30           PASS
```

## Round 4 (engine fixes landed: brush hands, low-pose skirts, face round 4, fingerGrip)
- Re-rendered and inspected every panel. The engine's new brush hands, gripping fingers and face round 4
  (fringe under the cap, a mouth corner visible under the moustache, spot blacks in the hair) come through
  without changes to uphill.js. No local workarounds remain: `figM` is an alias for `F.fig`, and `GDX` uses the real
  Grandad design. p2b keeps its own grip (two fingers through the fist). `F.POSES.fingerGrip` is one finger and a
  pointing hand, which the audit asked us to avoid.
- Tube limbs are hidden or overlapped where staging allows: in 02, tall verge grass crosses their shins; in 09,
  the foreground pair sit lower, so the frame crops their legs; in 11, the pair are bigger and lower, so the frame cuts them at the thigh.
  (A parapet in front of the steps in 10 was tried and removed: it hid the steps.)
- Long tails: in 11, Isla's balloon was moved down beside Grandad's head, so her tail is about half as long.
- Wayfarers at 1x: they are about 20% bigger and less darkened by the night tint, so the coat, staff, dress with child
  and bald old man each read by colour and silhouette.
- Grandad's pale neck strip from behind is in head.js; logged in work/engine-requests.md (round 4 entry).

QC after round 4 (no FAIL; border back to 3.00 PASS):
```
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       19.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.00   0.00/0.00/2.00/3.00/18.00          PASS
median ink stroke width                    2.30   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.33   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.37   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.58   0.53/0.63/0.72/0.81/0.89           OK
number of dominant hues                    5.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               2.36   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.10   0.01/0.09/0.16/0.22/0.30           PASS
```

## Audit 2 fixes (second blind audit, work/audit/uphill2-report.md: 5.4)
- **P10 piggy-back:** rebuilt as a closer 3/4 shot cropped at the thighs. `F.duo.piggyBack` is set to yaw 30, a forward
  lean of 24 and s 1.3, so the torso reads: her arms round his neck, his hands under her knees, heads and hips facing
  the same way (right, toward the door). The top steps and the lit door fill the right side. The impossible
  cane-over-forearm is gone: he needs both hands for her, so there is no stick in this one panel.
- **P1:** at dawn the pair now face us in 3/4 (yaw 55): Grandad looks down at Isla, smiling; Isla looks up with an
  open mouth. Their faces read at page size. The later hill panels keep the back views, drawn a little bigger
  (minimum s 0.19).
- **P3:** his hand is now the engine's 'relaxed' hand (side view, softly curled fingers, thumb joined to the palm)
  instead of the flat back of the hand. Her fist wraps round his index and middle fingers, whose tips curl out below.
  `F.POSES.fingerGrip` was tried and compared: it still gives one straight plank finger on a pointing fist, so it was not used.
- **Balloons:** a new `near()` helper sets each balloon about 30-40 px from its speaker's mouth, with a curved
  tail. The balloons in 2 and 5 no longer cover Grandad's cap. In 7 the balloon sits top-left and the tail runs
  down the side of the face to the mouth. In 9 (night road) the question is placed first. In 10 (steps) Grandad's
  balloon sits below the pair.
- **P11:** the hosts are spread across the doorway (girl, granny, bearded man with the lantern, old man), so each
  silhouette separates. The floating hand-on-shoulder is gone (old man's arms down), no balloon covers a head, and
  Isla's tail ends beside her head, not in it.
- **P9:** each lantern has its own glow radius, warmth and strength, with a matching light pool on the road. Walk
  phases are all different. The bearded man looks back over his shoulder, the woman looks at the child, and the
  child looks up.

### Remaining weaknesses (honest)
- Isla's tail in P11 is still long (about 150 px at 1x). Her head is low in the frame and her question has to be read first.
- The three hill panels are the same camera by design (the repetition device); the auditor would still prefer a camera move.
- There is no stick in the P10 piggy-back.
- Tube limbs, uniform balloon ellipses, the typeset lettering font and the title logo are engine or house style.
- P8's crouch is still a little stiff, and Isla's fists are identical.
- The P12 captions mix a floating italic line and a boxed line (kept: the question in her voice, the answer as the quote).

- **Ink width (page.js pass 4 pushed the median to 2.40):** the panel borders are down to 2.2 px (the QC border reading
  stays 3.00 PASS), the hedgerow strokes are thinner (1.5 + 2.4t), and in the bedroom the contours are lighter and
  the floor is lifted above the "dark" threshold. Median ink is now 2.08 PASS.

QC after audit 2 (no FAIL):
```
== out/up-hill.png  (12 panels, 3698 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       19.50   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.00   0.00/0.00/2.00/3.00/18.00          PASS
median ink stroke width                    2.08   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.20   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.37   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.60   0.53/0.63/0.72/0.81/0.89           OK
number of dominant hues                    5.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               1.72   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.10   0.01/0.09/0.16/0.22/0.30           PASS
```
