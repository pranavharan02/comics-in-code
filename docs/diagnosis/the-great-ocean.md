# The Great Ocean: panel diagnosis and fixes

Files: `comics/ocean.js`, `comics/cast_ocean.js`. Before: `work/before/the-great-ocean.png` and `work/before/the-great-ocean/NN.png`.
After: `out/the-great-ocean.png` (1x), `out/the-great-ocean/NN.png` (2x panels). Comparisons:
`work/comics/the-great-ocean/before-after.png` and `ba-01.png` to `ba-08.png`. Scratch:
`work/comics/the-great-ocean/` (`go.sh` renders at 2x and crops every panel into `cur/`; `t/pose.js` renders
poses big for inspection).

## Diagnosis of the before page (panel by panel, with the real reference each was compared with)

**Title.** The spot circle was a flat dark hand lying on a star disc, with a shell stuck on it; the hand was
barely readable. Credits spacing was fine. Ref: title spots across `work/ref/sheets/finales.png`.

**1. Ballroom** (ref `panels/25-the-calling/34.png` crowd, `panels/08-malala/05.png`).
- Background: a flat gold wall with four identical cream pilasters and two lamp-shade chandeliers; no room, no
  perspective, no depth layers. Nothing said "award dinner".
- Crowd: three rows of cloned bumps in one brown hue; nobody clapping, no hands, no variety of people. ZP's
  crowd (`25-the-calling/34`) is a wall of different people with hands in the air.
- Ada: with the current rig she is ~5.6 heads tall and overlaps the banner; one arm up in a stiff salute. Too
  big for "tiny on stage".
- Colour: gold good (colour script), but monotone: no spot blacks, no accent.
- Lettering: caption fine. No sound.
- Story: reads as "woman on stage", not as a lifetime-achievement event.

**2. Close-up** (ref `panels/04-camus-winter/31.png`, `panels/22-teachers/16.png`).
- Face was the old convex egg (before) and, with the new head, a generic 3/4 with eyes sliding right but no
  story around it; neck and shoulders a flat green blob with no neckline.
- Acting: the "polite smile, eyes sliding to the door" beat was half there; nothing in frame showed what she is
  enduring (the award) or where she wants to go.
- Background: gold radial with a few bokeh blobs, fine.

**3. Slipping out** (ref `panels/06-just-keep-missing/10.png` walking out, `panels/04-camus-winter/07.png`).
- The chair was a red table with a flag; the trophy read as "on a table", not "left on a chair".
- Ada filled the door, her head hidden under the caption; shoes were tiny yellow blobs; the walk read as an
  ordinary stride, not a tiptoe or a glance back.
- The door leaf was a flat wedge; no curtain, no sea wind; the night outside was flat.

**4. Night beach** (ref `panels/16-rachel-carson/15.png`, `panels/14-goddard/02.png`).
- The hotel was a box on a black lump; the sea was a stamp pattern of identical "eyebrow" waves; the sand flat.
- Ada fine in scale; the torch a dot of light with no person.

**5. Crouched by Toby** (ref `panels/16-rachel-carson/19.png`, `panels/21-mother/08.png`).
- Ada's crouch was a green mass with a floating reaching arm; Toby's torch was stuck in his fist, no beam; the
  torch pool was faint; the figures were cropped at the bottom.
- Engine defect found in this pose: the dress leaves the near thigh bare between bodice and knee drape (see
  Engine requests).
- The busy glowing sea behind competed with the warm torch beat.

**6. Hands** (ref `panels/23-watterson/02.png`, `panels/05-stonecutter/10.png`).
- Two tube arms with small flat hands, a shell floating between them on a flat cream disc. No wrist/sleeve
  design, no sand texture, no contact between the hands and the shell; nothing tender.

**7. Looking up** (ref `panels/14-goddard/02.png`, `panels/16-rachel-carson/21.png`).
- Two kneeling back views overlapping each other, cropped; nothing to look up at; heads can't pitch back far
  enough to "look up".

**8. Splash** (ref `panels/16-rachel-carson/34.png`, `panels/05-stonecutter/17.png`, `sheets/finales.png`).
- Milky Way was a faint diagonal wash with a pencil-line dust lane; the sea the same stamp pattern as p4 at a
  bigger size; figures too big (not "tiny"), standing in the middle of the bottom edge.
- Composition had no focal hierarchy: caption centred on stars, band and sea both even in weight.

**Page.** Colour script right in intent but the night was muddy (QC brightness FAIL 0.46). Faces used the
fingerprint preset only.

## Fixes

- **Cast** (`cast_ocean.js`): explicit `face: 'ada'` / `face: 'toby'`; dead round-1 keys removed (CAST-UPDATES).
- **Title**: new spot. Her old hand (with emerald sleeve and gold cuff) holds a scallop up to a small milky way
  over a glowing sea. Credits spacing kept with `&#160;`.
- **1**: a designed one-point hall seen from the back of the room: coffered back wall, side walls with arched
  night windows between gilt pilasters, red valance drape, sconces and moulded panels, a blue banner with her name
  plate, two chandeliers, a spotlight, a stage with apron and lectern + microphone. Round dinner tables with
  cloths, candles, flowers and glasses; seated guests (crowd palette switched to evening wear for this panel);
  three mid guests and four big foreground guests from behind (bearded man in a tux, a woman in wine, a grey-haired
  man in navy, a woman in teal) rigged with `F.fig`, clapping over their heads with emanata; six more pairs of
  hands going up behind heads across the room; three CLAP sound effects. Ada is small (s 0.36), in the light,
  holding the trophy at her chest.
- **2**: close-up at 3/4 turned toward the audience while the eyes slide right toward a strip of the balcony
  door; neutral lids + smile mouth (a fixed, polite smile), a sweat bead, two glance lines. Scoop-neck gown with
  a gold bead necklace. The trophy she holds sits gleaming in the lower-left corner, gripped in her old hand, and
  ignored.
- **3**: a gilt chair in 3/4 with a red cushion holds the trophy (sparkle + glow). French doors onto a moonlit
  balustrade and glowing sea; one leaf swung open; a curtain on a gold rod lifting in the wind. Ada (smaller,
  whole figure under the caption) tiptoes out with `sneakBarefoot`, glancing back over her shoulder with a smirk,
  a pair of gold court shoes hanging from her fingers by the heels.
- **4**: headland with a craggy outline, strata lines and boulders; a grand hotel (mansard roof, dormers, tower
  with a flag, lit windows, bright ballroom arches, the open balcony she left by) and palms; a zig-zag stair with a
  rail down to the sand. Sea rewritten (`glowSea`): broken swell lines between rows, crests of varied length and
  lean, trough shadows, glow only on some crests, moon glitter. Surf lace, sand ripples, wet-sand glitter. Her
  footprints from the stair; she walks barefoot with her shoes; far right a tiny crouched Toby in a warm pool.
- **5**: `F.POSES.crouchSand` for both, facing each other in a strong warm torch pool (radial ellipse + a screen
  uplight on faces and hands). Ada shows a smooth white pebble in her hands; Toby shows a shell on his palm and
  points his red torch at the sand (beam). A red bucket with shells. The dress lap is covered by a local
  `dressFig()` workaround. The sea glow is turned down so the warm circle leads.
- **6**: top-down close-up on the sand inside the torch circle (warm centre, blue corners, grain, ripples,
  pebbles, a second shell). Her old hand (emerald sleeve with gold trim, gold bangle) lies open palm up
  (`wave` pose, fingers together, old-age detail) with the scallop in it; his small hand comes in from the upper
  right in a pyjama sleeve with a white cuff and touches the shell with one finger. Soft cast shadows of both
  hands. Built with `zp/hand.js` at close-up scale.
- **7**: wider floating panel. Both from behind at a smaller scale, side by side with a gap; Ada kneels
  (dress-lap fix), Toby kneels and points up; the switched-off torch on the sand; the Milky Way appears for the
  first time over the glowing surf.
- **8**: rebuilt as a designed splash. New `milkyWay()`: wide cool halo, bright band, warm core bulge rising out
  of the sea left of centre, ~220 star clouds, 3200 band stars, a blotchy dust rift, arcing to the top right.
  Horizon airglow, a light column and glitter on the sea under the core, 12 rows of swells with sparse glowing
  crests, a long glowing breaker across the panel (dark face, luminous lip, tumbling foam, spray), glowing surf
  lace on wet sand. Two tiny silhouettes (s 0.2) at the waterline, Toby pointing up, with reflections and
  footprints. The quote sits top-left in the empty sky with the attribution under it.
- **Page**: night panels are drawn through a `saturate(0.8)` grade (`nightGrade`), and night blues were moved to
  saturated mid-value colours, which takes brightness from FAIL to OK without changing the colour script.

## Engine requests

Logged in `work/engine-requests.md`:
- `[ocean]` figure.js: in `crouch`/`crouchSand`/`kneel` with a long dress, the near thigh was drawn bare. FIXED by
  the maintainer; the local `dressFig()` workaround is removed.

Not logged (minor, worked around): head pitch is clamped to 14 deg, so a figure seen from behind cannot tip the
head back to look up; p7/p8 use Toby pointing instead.

## Story changes

- p2 adds the trophy in her hand in the corner of the close-up (the script's hand repetition: trophy, shoes,
  pebble, shell). It strengthens the "polite smile, eyes elsewhere" beat.
- p5: she shows him a pebble and he shows her a shell (the caption is about the pebble). The beat stays the
  same.
- p6: his fingertip touches the shell in her palm. The script said "a shell between them", and this keeps it
  between them while making the gesture read.
- p7/p8: Toby points up (the script only says both look up). He is the one who shows her the sky.

## Audit fixes (blind audit `work/audit/ocean-report.md`, mean 4.6; re-rendered on the new engine)

Engine changes picked up: thick-thin brush inking, the dress now covers the thigh in low poses (`dressFig()`
workaround and its engine request are gone), hands with separated fingers, face round 4, hand-lettering in page.js.

- **Title**: the gap between GREAT and OCEAN is closed and the roundel moved in. The roundel sky is now its own
  picture (a crescent moon, stars and the shell held up to it) and no longer reuses the Milky Way.
- **P1**:
  - The camera is closer: the hall is drawn at 1.35x about the stage and Ada is at s 0.44 inside it, so her face,
    glasses and trophy read in the spotlight. The name plate that sat behind her head is gone.
  - The front audience row is 8 real `F.fig` figures, each a different person: a bearded man in a tux, a bald
    man with glasses, a bun updo, long hair, a bob, grey hair, varied skins, sizes and turns (yaw 125-235, so
    two show profiles talking or laughing).
  - Six of them clap over their heads with hands on arms (IK); the floating hand pairs are removed.
  - The back crowd is a hazed `SC.crowd`.
  - CLAP effects vary in size, angle and colour, with burst ticks.
- **P2**:
  - The head draws its own neck (`neck: 1.6`) into a scooped chest shape, so the rectangle under the jaw is gone.
  - The sweat drop and glance lines are removed. The expression is a polite smile with soft lids (`lid 0.12`)
    and eyes lifted toward the door strip, which now shows the moon over the sea: longing, not nerves.
  - The trophy is gripped by a visible hand.
- **P3**:
  - Restaged: the far arm reaches for the door (a gesture toward the night) and the near hand hangs with the gold
    shoes hooked by their heels. The default open "mitt" hand is gone.
  - The curtain is a gathered panel on a rod, flaring out, with a zig-zag hem and folds that open toward it.
  - Floorboards recede to a vanishing point at the door, at eye level, consistent with the balcony.
- **P4**: the cliff stair is drawn as treads and risers with a railed banister.
- **P5**:
  - Toby's eyes are open (`smile`) and his blush is gone: same construction family, no ^^ chibi read.
  - He cradles the shell in both hands.
  - The torch lies in the sand and its beam runs along the sand into the pool, not at the viewer.
- **P6**: new local close-up hands (`palmUp`, `pointBack`):
  - Her old hand lies palm up, with a light palm and finger pads (`#c9926f`) and the darker back showing as a rim
    round every edge.
  - Tapered, fanned fingers with joint creases, a thenar mound, palm lines and wrist wrinkles.
  - His small hand shows its back: curled fingers with knuckle bumps and peeking nails, a thumb with a nail, and
    the index finger touching the shell.
  - Both hands cast soft shadows. Arms are child/adult length.
- **P7**:
  - Now a full-width row (the orphaned narrow panel is gone).
  - Both crouch from behind (`crouchSand`, no stick leg). Her arm rests round his shoulders and he points at a
    shooting star.
  - The sky is stars only (the Milky Way is saved for the splash). The bucket and the switched-off torch sit on
    the sand.
- **Sea (all panels)**:
  - `glowSea` rewritten: every crest has its own depth, length, lean and kind (hump, double, breaking hook, flat
    swell with foam), with no rows.
  - Hand texture comes from horizontal dashes.
- **Milky Way**:
  - Rewritten as flat designed shapes: nested lumpy bands in value steps with thin inked edges, a warm core,
    pale star-cloud islands, and a ragged inked rift. No Gaussian smear.
  - It appears only in P8.
- **P8**:
  - The figures are lit and coloured (tinted, not black silhouettes) at s 0.3, with a glow behind them from the
    surf. Toby points and her hand is on his shoulder.
  - The quote is in a caption box with the attribution, consistent with the page's lettering.
- **Page**:
  - Night palette lifted (mid values), so brightness is now PASS.
  - Panel borders are 2.2 px (the ZP range is 2-3). Together with the lighter scenery lines, median ink moved
    from 2.47 to 2.28 (PASS).

### QC after the audit fixes
```
== out/the-great-ocean.png  (8 panels, 2845 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.50   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       20.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                    12.00   0.00/0.00/2.00/3.00/18.00          OK
median ink stroke width                    2.28   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.37   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.59   0.15/0.23/0.34/0.45/0.63           OK
colour brightness (median)                 0.64   0.53/0.63/0.72/0.81/0.89           PASS
number of dominant hues                    4.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               1.90   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.08   0.01/0.09/0.16/0.22/0.30           OK
```
No FAIL. Brightness and median ink are PASS.

### Still weak after the audit fixes
- P1 back heads are simple from behind at this size, and the far crowd is still `SC.crowd`.
- P5 Toby's kid eyes are larger and rounder than Ada's (the preset's `override` fixes eye size). Panel P5's
  torch beam is subtle at ground level.
- P6 fingers are still tube-built; the thumb reads a little long.
- P8's Milky Way shapes are clean vector bands; ZP would add brush texture.

## QC (first pass, 1x, `python qc/score.py out/the-great-ocean.png`)

```
== out/the-great-ocean.png  (8 panels, 2843 px tall)
metric                                    value   ZP 10/25/50/75/90                  verdict
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       19.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                    10.00   0.00/0.00/2.00/3.00/18.00          OK
median ink stroke width                    2.45   1.70/1.90/2.10/2.34/2.60           OK
heavy (90th pct) ink stroke width          3.57   2.66/2.92/3.15/3.55/4.14           OK
colour saturation (median)                 0.60   0.15/0.23/0.34/0.45/0.63           OK
colour brightness (median)                 0.58   0.53/0.63/0.72/0.81/0.89           OK
number of dominant hues                    4.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               2.14   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.09   0.01/0.09/0.16/0.22/0.30           OK
```
No FAIL. Brightness went from FAIL (0.46) to OK (0.58).

## Remaining weaknesses (honest)

- **Figures** are still the engine rig. Ada's crouch in p5 is a solid green mass with little knee or foot
  information. The back views in p7 have plain ginger/white head backs, and the heads cannot tilt back to look up.
  The tiptoe in p3 is hidden by the floor-length dress.
- **p1 crowd**: the seated back rows (`SC.crowd`) are tidy capsule backs, and the clapping foreground figures
  are stiff diamonds of arms with flat hands. It reads as a real event at page size but not up close; ZP's crowds
  have more gesture and faces.
- **p3**: the gilt chair reads a little like a wooden ladder-back chair, and the curtain is a simple lens shape.
- **p6**: Ada's hand is a good cartoon hand but still the engine's 2-D model: her fingers are straight and the
  palm has little form. It is at hand-sheet level, not at ZP's `stonecutter/10` level of tender drawing.
- **p8**: the Milky Way's dust rift is soft blurred blobs, a painterly effect ZP would draw as flat shapes. The
  breaker's foam patches are simple ellipses. Brightness is OK, not PASS.
- Median ink width (2.45) is at the heavy end of ZP's range, which comes from the dense scenery lines.
