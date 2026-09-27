# The Butterfly — panel diagnosis, fixes and QC

Comic: `comics/butterfly.js` (page `the-butterfly`). Before: `work/before/the-butterfly.png` + `work/before/the-butterfly/NN.png`.
After: `out/the-butterfly.png` (1x), `out/the-butterfly/NN.png` (2x panels). Side by side:
`work/comics/the-butterfly/before-after.png` and `ba-01.png` … `ba-09.png`.
Scratch tools: `work/comics/the-butterfly/go.sh` (build, 1x + 2x render, panel crops to `p/`, per-panel ink report),
`inkmap.py` (the QC ink-width measure per panel, with a heat map of heavy/thin tiles), `ba.py` (before/after sheets).

## Diagnosis of the before page (per panel, with the reference compared)

Common to every panel: Chen was the round-1 head (zig-zag hair streak, no `face: 'chen'` preset), sleeves were
capsule `tube()`s with round ends, hands were small, and every caption was a white box whatever the art behind it.
The butterfly was one hard-coded shape drawn inside a `scale()` group, so its 1.8 px outline grew to 6 px at
`s = 3.4`.

1. **Office at 3:07 (wide).** Ref: `13-karnazes/04` (night office, one worker, deep teal, spot blacks, objects in
   perspective) and `03-asimov/02`. Before: a flat elevation — a wall of five identical window boxes, two rows of
   identical desks and monitors pasted flat with no floor plane or vanishing point, no ceiling, no light source;
   it read as a strip of clip-art, not a room. Chen sat full-face at the far right, the same size as the desks,
   with no pool of light around him. The clock floated on the window mullion. Colour was a uniform grey-teal with
   no value plan, and the night skylines were near-black with window holes (the QC ink culprit, see below).
   Caption: white box over the art, where ZP puts night captions straight on the dark colour.
2. **Head sinking onto arms (close).** Ref: `13-karnazes/08` (slumped worker), `01-lil-vincent/02`. Before: a
   disembodied head resting on two white sausages; no shoulders, no neck, no hands, no desk objects apart from a
   keyboard; the face was a 3/4 with a round-1 jaw spike. The tie (the story's repetition device) was absent.
3. **Butterfly lifts off his back.** Ref: `14-goddard/01` (figure from behind, night), `11-anne-frank/05`
   (something rising away from a figure). Before: the rig's back view put a face-coloured half-head at desk level
   and a shirt blob; the slump did not read, and the butterfly hovered far away in a corner with a few dots — the
   idea that it came *from* him was not clear without the words. Caption box covered the upper third.
4. **Night city.** Ref: `10-curie-happy-place/21`, `14-goddard/01`. Before: a generic skyline strip, tiny
   butterfly, nothing tying it to the office; near-black buildings with window holes (heavy "ink").
5. **Dream rooftop meadow.** Ref: `04-camus-winter/19`/`27` (saturated flat colour fields, designed shapes),
   `03-asimov/32`. Before: ~90 identical six-petal flower stickers scattered in rows over a green hump, four
   cloned butterflies, a brown box for the water tank; no path, no depth layers, no foreground framing.
6. **Butterfly on a flower (close).** Ref: `04-camus-winter/27` (rays in two flat colours), `01-lil-vincent/10`.
   Before: the flower was eight pink ovals hidden behind a giant flat butterfly with 6 px outlines; no leaves,
   no sense of scale or light.
7. **BRRRING.** Ref: `01-lil-vincent/08` (big diagonal action, speed marks), `19-roaring-sea` style SFX. Before:
   Chen stiff, arms up but body vertical, one small phone on the far right, the desk missing (he sat in the
   middle of an empty floor), papers pasted flat; no squash/stretch, no chair motion, no light change.
8. **Fingertips glitter.** Ref: `12-invictus-mandela/38` (close-up pause), hand sheet `work/engine/hand/sheet-close.png`.
   Before: a flat round-1 palm with a capsule sleeve and uniform dots scattered over the whole hand rather than on
   the fingertips.
9. **Splash at the window.** Ref: `11-anne-frank/08` (figures at a window sill), `05-stonecutter/17`,
   `01-lil-vincent/10`. Before: Chen stood behind the sill with his legs visible through the wall, the arm a
   straight tube, the butterfly facing the reader instead of him (no "regard each other"), a teal frame fighting
   the dawn palette, caption box on the frame edge.

## QC ink widths: the cause in the scenery

Before: median 2.50 / heavy 3.58 (out of the 1.9–2.34 / 2.92–3.55 target). `study/measure.py` counts every pixel
with mean RGB < 80 as ink and removes only masses that survive a 5 px erosion. The before page's scenery was full of
**dark fills in thin strips**: near-black skylines (`#0e1628`, `#16213a`, `#0d1428`) broken into 4–10 px slivers
by lit windows, dark monitor bezels and screens (`#2a3238`, `#3a4a50`), chair bases and 4 px chair bars — each
sliver measured as a 5–10 px "stroke". The engine note (figure2/NOTES.md) confirmed that muting all figures did not
change the numbers. Two more causes surfaced while rebuilding: the multiply grain pushed mid-teal fills (mean
80–90) under the threshold in speckles, and a butterfly drawn in a `scale()` group scaled its outline.

Fix: the office is redrawn in perspective with a value plan — darks are either large solids (sky, spot-black
foreground desk, monitor backs) or mid values kept above the threshold; skylines seen through the office glass
and over the city use mid-blue buildings; thin dark strips between frames and panel borders were removed (P3
window moved in from the edge); the butterfly now transforms its points and draws its pen in page pixels
(1.0–1.9 px); custom sleeve/body contours are 2.2–2.4 px with 1.3–1.6 px folds; panel grain is 0.065.

## Fixes (per panel)

1. **Office.** A true one-point camera (`camera()`, `box3()`, `chair3()` in the comic): ceiling grid and switched-off
   light panels converging on the vanishing point, floor-to-ceiling glass along the left and back walls with the
   night city *below* the horizon (we are high up), rows of desks with partitions and monitor backs receding in
   depth, chairs left askew, a right wall with pillars, whiteboard, exit sign and the 3:07 clock on a pillar
   (`SC.clock`). One pool of cold light: Chen's lit screen, a two-step flat light pool on the floor and a glow in
   the air; everything else grey-teal. Chen from behind, hunched at the only lit screen. Foreground framing: a
   spot-black desk corner with a potted plant. Caption plain white on the ceiling.
2. **Slump (close, front 3/4).** Hand-built pose (the rig's `deskAsleep` puts the hands on the head): shoulders as a
   shaded mass with a yoke seam, a round deltoid where the near sleeve joins, the far arm bent out to the left with
   its forearm under his head, the near forearm across the desk with a relaxed hand hanging off the end, elbow
   crease zig-zags. Head `face: 'chen'`, eyes shut, mouth open, cheek tilted onto the forearm, collar tips under the
   jaw. The loosened tie flops out across the desk — the dots planted for the repetition. Sticky notes, cold mug,
   keyboard in the foreground, night window strip beyond the partition, screen light from the right, z's.
3. **Lift-off (side view).** Profile slump built as one C-curved back (a tapered cloth tube along a spine curve),
   the near arm folded on the desk with the head lying on it, the tie hanging in the gap in front of his chest,
   legs under the desk, chair. The butterfly (tie colours) rises from a shimmer of blue and yellow scale dust on his
   back along a looping wake toward the open night window — the idea reads without the caption. Caption plain
   on the dark wall.
4. **Night city.** His office tower in the foreground with a single lit window (a hunched silhouette in it), a
   dotted wake looping out of it over the rooftops to the butterfly crossing a full moon; three value layers of city,
   a boulevard of street lights receding to a vanishing point, stars.
5. **Dream garden.** Designed composition: turquoise sky in flat bands, big sun, the city dissolving into pink haze,
   a lawn with a stepping-stone path winding back to a bougainvillea pergola, a painted water tank on stilts
   (still a city rooftop), flowering shrubs (`SC.bush`) along the far edge, mounded flower beds as lens-shaped
   colour masses with a crown of blooms, near hibiscus and daisies, a monstera and banana leaves framing the
   corners, a terracotta parapet. The blue butterfly follows a dotted looping path; four others in other colours.
6. **Flower close-up.** Two-colour sun rays (turquoise/yellow), a big hibiscus with five overlapping petals, veins,
   dark throat and a pollen-tipped stamen, leaves, soft out-of-focus blooms; the butterfly lands on the petal,
   wings open in 3/4 with veins and the tie's dots. Caption top-left on the sky.
7. **BRRRING.** Pale dawn gold. Rays radiate from the phone; the handset leaps off the cradle with its curly cord and
   rattle marks; BRRRING! in big letters. Chen is stretched (squash −0.1) and rotated back, arms flung up, legs kicking,
   eyes popping, sweat drop and emanata; his tie flies sideways (`tie({fly})`); the chair shoots back off its wheels
   with speed lines; papers burst off the desk; the mug tips and spills; he is behind the desk now (desk in the
   foreground). Caption at the bottom-left on the desk front, clear of the action.
8. **Fingertips.** A floating pause panel: the engine's 'open' hand at hand-sheet size (palm lines, cel shadow),
   shirt cuff, blue and yellow scale dust clustered on the four fingertip pads and the thumb, a few scales drifting
   up in the dawn light, four-point glints, blind-stripe shadows behind.
9. **Splash.** A deep window frame with shaded reveals, the right casement swung open with glass glints; dawn sky in
   warm flat bands, rays, the low sun, two layers of rose and peach city. Chen waist-up behind the sill (legs no
   longer show through the wall), leaning on one hand on the sill, the other raised with the index finger up
   ('fingertip' pose); the butterfly perches on his fingertip seen side-on, head turned to him; he looks up at it
   with a small smile. The quote sits in a box centred on the wall under the sill.

Cast: `chen.head.face = 'chen'` with the obsolete eye/nose keys removed; the tie is now drawn along a direction so it
can fly (`tie(r, {fly})`).

## Engine requests

None filed. Worked around locally: `F.POSES.deskAsleep` puts both hands on the head and keeps the back straight, so
the slump panels are hand-built from `sleeve()` cloth tubes plus `HD.head()`. Worth noting for the engine
maintainer (not filed as blocking): (a) at yaw ≈ −30 with mouth 'o' the in-face nose line can overshoot the face
contour; (b) the page grain (multiply, 0.09) darkens mid-value fills (mean RGB 80–90) under the QC ink threshold
in speckles, which inflates measured ink widths on dark pages.

## Story changes

None. All beats of docs/SCRIPTS.md kept; quotes word for word. Small staging choices: panel 1 shows Chen from behind
(his face is saved for panel 2); panel 4 adds the lit office window as the start of the flight; panel 8 floats on
white as a pause.

## Remaining weaknesses (honest)

- **Line character.** Still cleaner and more uniform than Gavin Aung Than's brush: no feathering, hatching or white
  rim lights (compare `05-stonecutter/17`, `10-curie-happy-place/21`). Backgrounds are flat-coloured, not textured.
- **P1** Chen is small and seen from behind; at page scale he reads as "one person at the only lit screen" but his
  pose details (arms) are mushy. The dark foreground desk is a big plain shape.
- **P2** The shoulder mass and sleeves are smooth, even tubes; ZP cloth would have more irregular drape. Still the
  weakest figure panel.
- **P3** Profile body is readable but simplified (no hand under the cheek, the legs are generic tubes).
- **P5** The garden is designed but the beds are graphic blobs; ZP would draw individual leaves and blossoms at the
  front with more texture. The pergola bougainvillea is a string of beads.
- **P7** The shock face comes from the engine preset (small pupils in white eyes) and is less elastic than ZP's
  acting; the squash/stretch is a global scale, not a drawn stretch of the body.
- **P8** Fingers are straight tubes (the 'open' pose); a slight curl and fingerprint detail would sell the close-up.
- **P9** The raised arm is the rig's legacy chest-side arm; the butterfly's side view is the top-view shape rotated,
  so the far wing pair reads a little like a second butterfly at small size.
- Honest bar: this is well above the before page on every category, but I would not claim a straight 8/10 against
  real Zen Pencils on characters and finish; backgrounds, colour, layout and story are closest.

## QC (1x, `python qc/score.py out/the-butterfly.png`)

```
== out/the-butterfly.png  (9 panels, 3091 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       19.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.00   0.00/0.00/2.00/3.00/18.00          PASS
median ink stroke width                    2.29   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.18   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.39   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.71   0.53/0.63/0.72/0.81/0.89           PASS
number of dominant hues                    4.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               2.08   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.10   0.01/0.09/0.16/0.22/0.30           PASS
```
Before: median 2.50 (OK), heavy 3.58 (OK), grain 2.73 (OK). After: every metric PASS.

## Audit fixes (blind audit, work/audit/butterfly-report.md: mean 4.6)

Re-rendered first on the new engine (brush inking in core.js, thick-thin heads, brush hands, paper texture in page.js).
The page now has **10 panels**: the old P7 is split into P7 (the jolt) and P8 (lying there). Old P8 is now P9, and
old P9 is now P10.

- **P2 (slump).** Rebuilt at the rig's real proportions: head R 53 px, upper arm about 110 px, forearm about 100 px,
  sleeve radius 15 px. Before, the sleeve radius was 25–34 px, which made the "balloon". There are two separate
  arms, each one shoulder→elbow→forearm with a readable elbow crease. The forearms cross under his head, and his
  cheek rests on the back of his hand. The hunched shoulder mass sits behind the head. The z's are brushed strokes,
  not a font glyph.
- **P3 (side slump).** The torso, pelvis and both legs come from the rig (`F.fig` with parts legs/torso, lean 40,
  curve 22), and his seat is on the chair seat, with the chair back behind him and the gas lift under him. The near
  arm is built from the rig's own armU/armFore: upper arm down to the elbow on the desk edge, forearm along the
  desk, hand resting. The head is drawn last, lying on the forearm. The butterfly's dust starts at his far shoulder.
- **P7 (jolt).** Two distinct arms (near arm straight up, far arm thrown out sideways, `legacyArms: false`). The
  chair is under and behind him, tipping back. The phone is moved toward the centre so the ray burst covers Chen
  too. The tie bends. The papers are now 5 `paper()` sheets, each a different size, bow, dog-ear or crease, and
  they overlap.
- **Caption/image contradiction.** Split into P7 "SUDDENLY, I AWAKED," (the jolt) and P8 "AND THERE I LAY, MYSELF
  AGAIN." (sprawled back in the tipped chair, limp, staring at the ceiling, the receiver dangling off the desk on
  its cord, papers settled on the floor). The quote words are unchanged; only the break between captions moved.
- **P9 (fingertips).** Now shares a row with P8, so the grid no longer breaks for it. It uses the brush `reach`
  hand (back of the hand, knuckle creases, nails, a thumb set properly), and the dust sits on the measured
  fingertips.
- **P10 (window).** Both arm targets are computed from the rig, so arm lengths are correct. The raised forearm has
  a bent elbow and holds the fingertip in front of his face. The impossible far arm is hidden. The expression is
  now wonder (mood 'surprise', smile, eyes up at the butterfly). The tie knot sits on the centre line (tie offset
  fixed for all panels). The open casement has an edge strip and hinges.
- **Chen's face.** The `chen` preset is used in every panel, with 3/4 yaw at |30–50°| (profile only in P3).
  Side-by-side check: `work/comics/the-butterfly/faces.png`.
- **P1.** The foreground desk now has a lit top plane with a keyboard and papers. Chen is a clear man in a shirt,
  seen in 3/4 from behind (ear showing). Chairs are varied: colour, back height, width, some with armrests. The
  concentric pool is replaced by a single light spill from his screen. The glow is smaller.
- **P4.** The lit window shows his slumped silhouette (head on desk, hunched back). The dots in the flight path
  shrink with distance. Landmarks (a dome, a stepped tower with a mast, a gable) break up the repeated skyline
  blocks, and there is more tone variation.
- **P5 / P6.** The palette is pulled toward tropical teal-greens and warm corals (no acid green or purple). The
  far shrubs are hazed. In P6 the butterfly is smaller than the hibiscus, and the generic bokeh blobs are replaced
  by out-of-focus leaves and a second bloom.
- **Lettering.** One caption style throughout: the page's inked, slightly irregular white boxes at the default size
  (P1 and P3 no longer float unboxed). Spelling follows quotes.json: "TZŬ" in the caption, the credit, the
  attribution and the footer.

**QC after the audit fixes (1x):** margin 47, side gutter 16, row gutter 19, border 3.00, median ink **2.33**,
heavy **3.15**, saturation 0.40, brightness 0.71, hues 4, grain 1.37, black share 0.10. All PASS.

**Still weak after the audit fixes.**
- The title and BRRRING still use the display font.
- Garments are smooth tubes, not cloth.
- The P8 sprawl is the engine's seated rig tilted, so it is stiff.
- P10's raised arm roots at the chest (the engine's 3/4 shoulder).
- Hand-built props in P7/P8 (the paper curls) read slightly rubbery.

## Audit 2 fixes (work/audit/butterfly2-report.md: mean 5.4)

- **P2 (slump).** Rebuilt at rig limb sizes (sleeve radius 15 px at head R 53).
  - Near arm: a round shoulder, the upper arm down to the elbow planted on the desk, and the forearm back under
    his cheek.
  - Far arm: cropped at the left edge, with the hand lying open on the desk.
  - The upper back with its yoke seam rises behind the head.
  - The tie slips out from under the forearm and hangs over the desk edge, no longer out of the chin.
  - The screen glow is smaller.
- **P3.** The rigid arm out of the chest is gone.
  - Near arm: hangs limp from the shoulder at the top of the back, past the desk edge (elbow fold, relaxed hand).
  - Far forearm: lies on the desk under his cheek.
  - The dotted "magic" arc is removed; only the dust shimmer at the shoulder remains.
- **P1.** Chen now faces his monitor (yaw 172) and sits on the chair seat, with the chair back drawn over him.
  - Light is drawn as single irregular flat shapes, not concentric rings: a new local `glowFlat()` replaces every
    `PG.glow` in the comic.
  - The screen spill on the floor is one quadrilateral.
- **P4 / P10 cities.** A new local `city()` replaces `SC.skyline`.
  - Each building gets its own roof: setbacks, dome, spire, mast, tank, slant, gable or sawtooth.
  - Each building gets its own window scheme: clustered scatter, ribbon bands, vertical strips, a few lit floors,
    or dark.
  - The P4 lit window is enlarged and shows him slumped (head on arms, hunched back, monitor back).
  - P10's inner window frame is removed (no panel-in-panel), and the caption sits on the wall below the sill.
- **P5.** Focal point: the blue butterfly sits framed inside the pergola arch against a pale halo of sky, and the
  stepping-stone path and the arch lead to it. The water tank is desaturated. The three other butterflies are small
  and pushed to the edges.
- **P8 ("there I lay").** The chair is toppled onto its back on the floor with a contact shadow. Chen lies back in
  it, legs in the air, staring at the ceiling.
  - Phone continuity: the same red phone base sits on the desk, and the handset dangles from it on the curly cord.
  - The fallen papers are four flat sheets on the floor plane, each with its own size, skew and dog-ear, plus one
    still falling.
- **P9 (fingertips).** Uses the engine's close-up 'open' hand: thumb from the thenar mass, fingers of varied length,
  palm lines. It is anchored by a wrist, a shirt cuff with a button, and the sleeve. The dust sits on the measured
  fingertips.
- **P10 (splash).** The head is at yaw 40, a clear 3/4 view with both eyes inside the face (the audit's "profile with
  two eyes" was yaw 50). The hand is the engine 'fingertip' pose at 1.35x (index extended), with the butterfly
  perched on the tip.
- **Face consistency.** Every panel uses the chen preset with `bags: 0.35` (lighter), at the same 3/4 yaw band
  except P3 (profile). Side-by-side check: `work/comics/the-butterfly/faces.png`.

No engine request filed. At yaw 40 head.js draws a correct 3/4. The two-eyes look at yaw 50–60 is the far eye
clamped inside the contour (by design in the face notes), so I avoided that yaw rather than report a bug.

**QC after audit 2 (1x):** median ink 2.34 and heavy 3.20, both PASS. Saturation 0.40, brightness 0.73, grain
1.37 and black share 0.10 also PASS. Median ink is at the top of the PASS band.

**Remaining weaknesses (honest).**
- **Clothing:** garments are still smooth cel tubes, not drawn cloth.
- **P2:** the back mass still reads a little soft, like a pillow.
- **P3:** the hanging arm is simple.
- **P8:** the toppled pose is the seated rig rotated, so the legs are stiff.
- **P10:**
  - The fingertip hand is still small and fist-like around the extended index.
  - The raised arm is a single tube with a bent elbow.
- **Title and SFX:** they still use the display font.
- **Dust:** the shimmer and dust are procedural dot clusters.
- **Figures:** the drawing quality of the figures is still well below a professional hand.
