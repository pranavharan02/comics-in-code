# Several Thousand Things — comic-phase diagnosis and log

Files: `comics/thousand.js` (rewritten), `out/several-thousand-things.{svg,png}`, `out/several-thousand-things/NN.png`
(2x panels). Scratch, before/after and per-panel pairs: `work/comics/several-thousand-things/`
(`before-after.png`, `ba-01.png` … `ba-11.png`, `go.sh` renders + splits, `patch*.py` are the edit history).

## Diagnosis of the before page (work/before/several-thousand-things.png)

Whole page: the kitchen was a flat yellow wall with a brick pattern, a brown floor band and one teal counter slab,
re-drawn slightly differently in every panel (window moves, counter changes height, the fridge changes size and
place). No wall cabinets, no oven, no perspective, no depth. Two dominant hues (yellow/orange + teal); QC "OK" on
hues, brightness 0.88. Figures were pre-pose-library rigs with hand-picked arm angles that now cross the body
under the 3-D rig. The notes under the photos were never drawn (`void note`).

Reference kitchens compared: `work/ref/panels/20-lp-jacks/01.png` (mother and girl baking: cabinets, bowl, FLOUR
bag, big figures overlapping the counter), `21-mother/01.png` (baking at a counter, props on the worktop),
`30-life-jacket/07.png` (a real range with oven door and hob, a figure with a gesture).

1. **Title + kitchen/card (P1).** Maya stood at the far left, face-on, holding a tiny FLOUR packet at chin
   height; the flour cloud floated over the window unrelated to any action. Card legible but a floating sign on
   the counter. Counter = one slab of six identical doors, no worktop objects in perspective. Ref 20-lp-jacks/01:
   figures act on props (bowl, bag) that overlap them; ours had nothing overlapping.
2. **Loaf #1 (P2).** "Camera" was a black box stuck to her face; the loaf was a beige mound (read as a pie or a
   stone, not a brick). CLONK unexplained. Arm angles crossed the body in the 3-D rig (current render).
3. **Fridge #1 (P3).** Maya's head popped in from the panel edge; she didn't pin anything. Fridge a white
   rectangle with two handle bars.
4. **#6 / #13 / #22 (P4–6).** Good repetition idea, but no character in the panels at all, loaves weak (the raw
   loaf = the brick loaf in white; the exploded loaf = a flame shape), grey smoke = a flat ellipse. Fridge photos
   packed in a grid that re-shuffled between panels (photo #n not in a stable place).
5. **Dad (P7).** Dad in a doorway that was a beige rectangle; with the new rig his arm hung stiffly, face a blank
   stare. Photos "spilling onto the wall" were a vertical column in the middle of the wall. Balloon fine.
6. **Grin (P8).** Big head on rays; flour blob on the glasses, not the nose; body a flat orange shape; tail at
   hair. Ref 20-lp-jacks/03 (batter on the girl's nose): the dab sits on the nose tip and the hand is in shot.
7. **Notes (P9).** Six polaroids and text lines floating on cream; no fridge, no sense of place; the notes
   were plain, in one size, red underline under each.
8. **Maya/Dad (P10, before panel 8).** Dad's pointing arm now crossed into the fridge; Maya standing apart;
   no expression change — the turn (Dad understanding) did not read.
9. **Splash (P11).** Heads cut by the counter, the loaf = two orange blobs; fridge squeezed to the side; no
   steam that read; LOAF #48 lettering competing with the heads.

## Fixes (what changed per panel)

Global
- **One designed kitchen**, built once in world units (`kitchenSet`) and filmed per panel with a camera
  (`camera({x, s, fy, eye})`): hall doorway, window over the sink, wall cabinets, a range with hood, hob, oven
  door and window, counters with drawer rows and a plinth (SC.counter/wallCabinets/block in one-point
  perspective toward the camera's eye), splashback tiles, checkered terracotta floor in perspective, the fridge,
  Nana's portrait (holding her loaf), a clock and a calendar whose crossed-off days advance.
- **The fridge** is the repeated prop: a retro powder-blue fridge (reads instantly against yellow, carries the
  white polaroids) with a fixed slot per photo (`photoSlot(n)`), so the door fills 0 → 1 → 5 → 12 → 21 → 47 and
  photo #6 is in the same place wherever it appears; the overflow climbs the wall left of and above the fridge.
- **Loaves** redrawn so each failure reads at thumbnail size: brick (pale slab, crack, dense dots), burnt
  (black dome, grey char, orange ember cracks, smoke), exploded (brown dome whose top burst and flopped over),
  raw (pale sagging puddle with a drip and a finger dent), flat, sunk, almost, and the good loaf (golden,
  scored with open ears, flour dusting). Polaroids show the loaf on a counter, the number and a scribbled note.
- **Maya**: face preset `maya`, curly hair, red glasses, navy jumper, an oversized red apron (drawn in the
  figure's detail hook: bib, neck strap, waist band, flared skirt below the knees, pocket with a wooden spoon,
  flour handprints); from behind, a waist bow (`apronBack`). Flour builds up on her hair and sleeves panel by
  panel (`dust(k)`), and on the cabinets as child handprints.
- **Dad**: face preset `dad`, moustache, pale blue shirt, loosened tie (knot pulled down, collar open V),
  briefcase.
- Proportions: Maya H 3.2 at 1.1 scale, Dad 1.0 (≈145 cm to 180 cm); counter scaled to her waist.
- Colour script: morning yellow → (flour-white builds) → evening amber (dusk window, hall light, pendant
  lamp) → golden oven glow for #48. Hues: yellow, teal, powder blue, terracotta/red.
- Grain 0.07 (tile lines already read as texture).

Per panel
1. P1 establishing: the whole kitchen in perspective; Maya on a step stool, side-on, leaning in with both
   arms, tipping a big FLOUR bag into a blue bowl; a flour cloud rises; salt and yeast jars, a red kettle;
   foreground framing: a gingham table corner with Nana's recipe card (lined, legible, butter thumbprint,
   heart) and a bowl of eggs. Fridge empty but for three magnets.
2. P2 Loaf #1: close camera at the counter; Maya in near-profile holding the phone up to the loaf (back of the
   phone with lens toward the loaf, "click!"), the brick loaf on a cutting board with dust puffs and impact
   ticks (so CLONK reads as it landing like a brick).
3. P3: from behind, Maya pins photo #1 on the empty fridge (apron bow visible), Nana's portrait watching.
4–6. P4–6: identical camera three times (ZP repetition): oven, counter, fridge. #6 burnt with a smoke column,
   Maya fanning with an oven mitt, COUGH; #13 exploded, dough on the tiles, the oven window and Maya, FWUMP!;
   #22 raw, Maya poking it, SPLUT. Fridge 5 → 12 → 21, more flour on her and the worktop each time.
7. P6 Dad: evening; Dad in the lit hall doorway, shoulders down, briefcase still in hand, tired face; the worktop
   cluttered with 47 attempts (stacked bowls, two flour bags, a loaf tin, spilled flour, handprints); Maya by
   the fridge on tiptoe pinning #47 to the last free patch of wall. Balloon left-to-right toward the fridge.
8. P7 grin: close-up on amber rays; flour on the nose tip, cheek and hair; laughing; her floury hand comes
   into shot pointing right, at the notes panel.
9. P8 notes: close on the (blue) fridge door: six photos (#1, #6, #13, #22, #31, #47) each with a masking-tape
   label written in the Journal hand: "#1 yeast was dead", "#6 oven too hot!", "#13 too much yeast", "#22 not
   baked long", "#31 knead 10 min", "#47 ALMOST!!" (underlined), and a sticky note of oven temperatures.
   Caption box below.
10. P9 the turn: Dad bends to the fridge, one hand on his knee, finger on #6's note, brows lifted in a soft
    "oh" (worried brows + smile); Maya beside him explaining, delighted.
11. P10 splash: golden oven glow; Maya and Dad either side tearing loaf #48 open — two scored golden halves
    with a torn white crumb, strands between them, steam; the full fridge and wall of 47 photos behind;
    "LOAF #48" caption box echoing LOAF #1/#6/#13/#22; "– THOMAS EDISON" bottom right.

## Story changes
- Before panel 8 (Maya small, Dad pointing) is now **the turn**: Dad bending to read a note, face softening.
  The script says the turn is "Dad reads the notes"; this makes that beat visible instead of implied.
- Panel 6: Maya is in shot pinning #47 when Dad arrives (continuity with P3 pinning #1, and it puts the
  47th failure on the same day he counts them).
- The fridge is powder blue instead of white: the photos read better on it and the page gains a fourth hue.
- The quote is unchanged, word for word, split across P6 (Dad), P7 (Maya) and P8 (caption) as in the script.

## Engine requests (appended to work/engine-requests.md)
- figure.js: `top.details` is skipped for back views, so garments with a back (apron bow, straps) have no hook;
  worked around with `front()` (`apronBack`).
- head.js: Dad's moustache hides smile mouths at 3/4; his smile has to be carried by the brows.

## Remaining weaknesses (honest)
- Figures still read as tidy rigs in places: Maya's arms in P1 are mostly hidden by the bag; the trio figures
  are small (≈ 40% of panel height) and cropped at the hip; Dad's standing poses are stiff compared with ZP.
- Hands at small sizes (P2 phone grip, P1) are lumps; the phone grip doesn't show clear fingers.
- The kid face preset turns slowly, so Maya often looks almost frontal even at yaw 60–80.
- The exploded loaf and raw loaf read in close-up and on the polaroids, but in P5/P6 at panel size they are
  small and partly covered by Maya's arm.
- Evening panels P6/P9 carry a lot of flat tile and wall; they read as a real kitchen but the middle of P6 is
  quiet (deliberate space for Dad's balloon).
- Flour on Maya's hair reads as white specks, closer to snow than powder.
- Brightness passes at 0.80 — the ZP 75th percentile is 0.81, so it is at the bright edge of typical.

## Audit fixes (blind audit, work/audit/thousand-report.md: mean 4.8)

Re-rendered on the new engine (brush inking, new hands/poses) first. Then, per audit item:

- **Perspective (#9).** `camera().Z(z)` gives every depth plane (wall cabinets z 34, counters/range z 60, fridge
  z 75, figures by their floor depth `c.at(x, z)`) the same scale-about-the-vanishing-point as the floor tiles,
  so floor, counters, fridge, figures and props share one vanishing point. Worktop props are placed with
  `S.top(x, z)`. The counter run shows its end side when the vp is past it.
- **Varied cameras (#8, #9).** P2 over-the-shoulder behind Maya (phone screen shows the brick); P3 3/4 back
  view from the fridge side; P4 close on Maya doubled over in the smoke; P5 low angle (eye line at the floor),
  she flinches arms-up as the loaf bursts; P6 3/4 from the fridge side, chin on her fists beside the raw puddle;
  P7 a wider evening shot; P9 a low close shot on Dad reading; P10 splash.
- **Distinct acting P4–6 (#8).** Coughing doubled over with the mitt waving / arms flung up, flinching /
  slumped, chin on fist, eye to eye with the puddle. SFX sit on the action (KOFF! KOFF! at her mouth, FWUMP!
  on a starburst behind the loaf, splut. dripping off the board).
- **Hands that hold (#1, #3, #7).** Phone held in both hands with thumbs in front and fingertips round the edges
  (screen visible); photo #1 pressed flat under her palm on the fridge; Dad holds #6 up in a 'hold' grip;
  finale: each figure clutches its half with both hands, fingers hooked over the crust (arms drawn after the
  loaf), with crust dents; loaf drawn as one loaf torn in two with ragged crumb faces and strands between.
- **Nothing floats (#3, #4).** Door photos drawn after the fridge with magnets; wall overflow photos are taped
  (masking tape) and drawn behind the fridge body. P3's photo is under her hand.
- **Dad (#4, #5).** P7: arms crossed, weight on one leg, standing close to Maya; balloon tail curves to him.
  P9: he has taken #6 off the fridge and reads its note aloud (new line "#6. OVEN TOO HOT…", quoted from the
  note, not the Edison quote) so the turn reads; Maya waits with clasped hands.
- **Copied stamps (#6, #9).** Every handprint is different (spread, partial, smear), flour marks are random
  smudges, every polaroid differs (background, framing, tilt, plate, glare, thumb in shot, magnet position).
- **P1 (#10).** Recipe card moved onto the worktop (propped at the back), smaller; flour puff is an inked cloud;
  Maya on a proper stool with a seat top.
- **P8 (#6).** Hand-drawn uneven sunburst; hand inside the frame pointing right at the notes panel;
  irregular flour smudges.
- **Lettering (#7, #12).** New local `letters()`: per-glyph size/rotation/baseline jitter, extruded shade in the
  fill colour instead of a black drop shadow; used for title, CLICK!, CLONK!, KOFF!, FWUMP!, splut. New local
  `balloon()`: lumpy brush-inked oval, curved tapering tail. The "WORDS BY" pill is gone; the attribution
  appears once, lettered under the splash (not over the art).
- **Finish (#13).** The engine brush gives thick-thin line. The engine's new paper texture rendered as heavy
  vertical streaks on this page's flat yellows, so this comic passes `paper: false` (plain grain 0.07).

Engine request added: the paper texture streaks on large flat fills.

Still weak after this pass: Dad's arms-crossed reads as "hands at chest" (engine limit, noted in figure NOTES);
small hands (~30 px) remain lumps; Maya's face still reads nearly frontal; flour in hair is specky.

## Audit 2 fixes (work/audit/thousand2-report.md: mean 5.9, was 4.8)

- Paper texture back on (coordinator removed `paper: false`; the engine fixed the streaks).
- **P10 Dad:** camera lowered so his whole head is in frame. The photo is in his chest-side hand, with one
  continuous arm from the shoulder (elbow down, forearm up), held at chin height. The balloon tail is aimed at
  his mouth (computed from the rig, `SPK`).
- **P11:** the radial spotlight is gone. Warm light is now flat shapes: a trapezoid spilling from the oven
  window onto the floor, and a lit patch on the wall. The hands are larger (handScale 1.35/1.45) and each is a
  different pose: Maya 'reach' (fingers spread over the crust) plus 'grip' (round the end); Dad 'flat' over the
  crust plus 'clutch' round the end. No mirror copies. The loaf is bigger, so the hands sit on the crust.
- **P7:** crossed arms replaced by one hand rubbing the back of his neck, briefcase in the other hand. The tie
  shows, consistent with P10/P11. The balloon is to his right with the tail to his mouth, and the text is
  "MAYA… THAT’S 47 FAILURES." with a true ellipsis, as in docs/SCRIPTS.md.
- **P2:** the board and loaf sit fully on the counter. One SFX (CLONK!) with impact lines on one side only;
  "click!" removed.
- **P4:** KOFF! KOFF! clamped inside the panel.
- **Cabinets:** a striped tea towel over the oven handle, the cabinet door by the sink ajar (dark sliver), a
  dent, scuff marks, and a scuffed plinth. Handprints and polaroids were already unique.

Remaining weaknesses (honest):
- Line weight still reads fairly even at wide scale. Faces reuse the same eye/smile construction across angles.
- Maya's body in back views is a long tube with little waist or knee structure (engine figure).
- Dad's neck rub in P7 reads, but his forearm crosses his face line.
- Hands under ~40 px (P2 phone, P3 palm) are still simple.
- The flour in her hair is specky.
- The recurring Nana portrait is clipped by the fridge edge in several panels.
- P9's caption sits close to the bottom border.
- Relative head sizes (kid Maya vs Dad) follow the engine's proportions; they are consistent across panels, but
  Maya's head is large by design.

## QC (1x, final)
```
page side margin (px)                     47.00   36.00/47.00/48.00/49.00/57.00      PASS
gutter between side-by-side panels        15.00   11.00/14.00/17.00/22.00/23.00      PASS
gutter between rows                       19.00   13.00/16.00/21.00/24.00/28.00      PASS
panel border thickness                     3.00   0.00/0.00/2.00/3.00/18.00          PASS
median ink stroke width                    2.18   1.70/1.90/2.10/2.34/2.60           PASS
heavy (90th pct) ink stroke width          3.21   2.66/2.92/3.15/3.55/4.14           PASS
colour saturation (median)                 0.39   0.15/0.23/0.34/0.45/0.63           PASS
colour brightness (median)                 0.81   0.53/0.63/0.72/0.81/0.89           PASS
number of dominant hues                    4.00   2.00/3.00/4.00/5.00/5.00           PASS
texture/grain in flat colour               1.63   0.00/0.75/1.41/2.42/3.84           PASS
share of the page that is black ink        0.13   0.01/0.09/0.16/0.22/0.30           PASS
```
