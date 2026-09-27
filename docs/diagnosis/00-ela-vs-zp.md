# ELA vs zp: why Every Line Alive looks better

Scope: `lib/` (artist.js, face.js, hands.js, ink.js) + `archive/every-line-alive.js` against `zp/` (core, head,
figure, hand, page, scene) + `comics/*.js`. No file outside `work/` was changed.

## Evidence (all in `work/study/`)

| file | what |
|---|---|
| `compare.png` (1x, as shipped: ELA with `#rough` + 0.16 multiply grain, zp with 0.07 grain) | ELA artist vs Grandad, Isla, Ada, Chen, Peg, Maya, and zp Ada kneeling. Row 1: 3/4 heads at 170 px. Row 2: full figures at 70 px head. Row 3: hand + pen at the size each engine draws it for a 170 px head, then the zp hand enlarged to ELA's length. |
| `compare-raw.png` (2x, no filters) | same, geometry only |
| `zoom_heads_a.png`, `zoom_heads_b.png`, `zoom_figs.png`, `zoom_hands.png` | 2x crops of the sheet |
| `ela_artist6.png`, `ela_artist73.png`, `ela_face50.png` | ELA panels |
| `zp_uphill_p2fig.png`, `zp_isla_face.png`, `zp_will_face.png`, `zp_bfly_wake.png` | zp panels (from `work/before/`) |
| `compare.js` | the sheet generator (`node work/study/compare.js`, then `node lib/render.js work/study/compare.svg work/study/compare.png 1`) |

Headline measurements (head height = hair top to chin):

| | ELA | zp | ratio |
|---|---|---|---|
| hand length (wrist to fingertip) / head height | ~0.58 (gripHand ≈ 60 units, head 102) | ~0.26 (22 hand units × `u*0.0135`) | zp hands are **2.2x too small** |
| figure/ground lightness gap ΔL* (main garment vs panel bg) | 52–56 (robe `#4a5873` L37 / `#2f4f7c` L33 on walls L89) | 12–35 (Peg `#e0a23a` L71 on sky L82: 11.5; Grandad `#4f7a55` L47 on hill L74: 27; Isla `#d8453b` on grass: 23) | zp figures don't separate |
| shadow step (base → shade ΔL*) | 10–12 on every form (skin `#f3cda8`→`#dea582`: 12.5; robe →`#36415a`: 9.6) | 0 (flat everywhere, except `far` limbs at 15–25% darker) | no form |
| line width modulation (`vary`) | 0.2 + 0.07 secondary | 0.05–0.06 | 3.5x less |
| hand wobble (`wob`) | 0.35–0.8 px + 2.6 px displacement filter | 0.1–0.15 px, no filter | ~10x less |
| contour : interior feature weight (face) | 3.0 : 1.2–2.2 (≈1.9x) | 2.8 : 2.3–4.5 (≤1.0x; lids and brows heavier than the contour) | hierarchy inverted |
| grain | 0.16, `mix-blend-mode:multiply` | 0.07, normal blend | ~2.3x weaker |

---

## 1. Proportions

**ELA.** Head 102 units (`lib/face.js:290-292` face polygon y −40..43, hair to −59). Kneeler torso hip→shoulder
138 units = 1.35 heads (`lib/artist.js:46`), kneeling height ≈ 2.9 heads (≈ 4 heads standing). Mass is in
clothing: torso 78 units deep (0.76 head, `artist.js:46`), lap/legs mass 166 × 64 units (`artist.js:31`), sleeve
40–50 units at the elbow (`artist.js:92`). Bare forearm 12.4 units ink / 8.8 skin = 0.12 head (`artist.js:90-91`),
but only the wrist-end shows. Hand ≈ 0.58 head (`lib/hands.js:59-77`: palm −2..34, fingers +13/10/8).

**zp.** `rig()` (`zp/figure.js:155-166`): `unit = 2.25R`, but the drawn head is ≈ 2.6R tall (hair bulge
`head.js:99` + chin `head.js:72`), so an `H: 3.8` adult is ~3.3 drawn heads. Limb radii (`figure.js:251-253`):
`limbR = u*0.062`, `legR = u*0.07`, `pantsR = u*0.095` → sleeve ≈ 0.17 head wide, trouser leg ≈ 0.16 head wide
(measured 11 px on a 70 px head, `zoom_figs.png`). Hand `hs = u*0.0135` (`figure.js:286`) → 0.26 head.
Torso (`figure.js:300-301`) is a 5-point-per-side slab, front half-width 0.44u.

**Visible consequence.** Head-to-height is comparable; what reads as "rig" is that everything below the neck is
thin and even: pipe legs, pipe arms, tiny clawed hands, and a big head floating on a pencil neck (Grandad in
`zp_uphill_p2fig.png`, all of `compare.png` row 2). ELA's bulk sits in clothing silhouettes that hide joints.

**Recommend.**
- `figure.js:251-253`: `limbR` 0.062 → **0.085**, `legR` 0.07 → **0.09**, `pantsR` 0.095 → **0.125**; child
  0.045/0.05 → **0.07/0.08**. Radii along the limb taper: upper arm `[1.35, 1.15]`, forearm `[1.1, 0.8]`,
  thigh `[1.25, 1.0]`, shin `[1.0, 0.75]` instead of the near-constant pairs at `figure.js:263-275`.
- `figure.js:286`: `hs = u*0.0135` → **`u*0.030`** (child 0.0115 → **0.026**). Target hand length ≈ 0.55–0.65
  head height.
- `figure.js:312` neck radius `u*0.085` → **`u*0.12`**, and shorten `hOff` (`figure.js:176`) by 0.1R so the jaw
  overlaps the neck top (ELA neck is 25–28 units wide under a 102 head: `face.js:287`).
- Torso depth at `PROF` (`figure.js:301`) 0.27 → **0.36** at the chest, 0.22 → **0.28** at the seat.

## 2. Head construction

**ELA** (`lib/face.js`). One hand-authored 20-point concave silhouette (`face.js:290-293`) that contains the
profile: brow at [35,−18], a notch [33,−10], nose tip poking out to **x=44** at eye-level+10, lip bumps
[37,16]/[34,19]/[36,22], a rounded chin [26,40]/[12,43], jaw running back up to [−24,18]. Skull mass is
carried by the hair shape, which extends to x=−47 and down to y=26 behind the ear (`face.js:352`), i.e. ~0.45 of the
head width sits behind the face. Ear at [−22,2], 7.5×11, far back at the end of the jaw (`face.js:367`) with a
1.4 inner curl. Eyes: two tall ovals 8.2×11 and 6.6×10.5, centres 16 units apart, **both inside the face**, dot
pupil 2.7 (`face.js:296-303`). Nose = silhouette + one 1.5 nostril tick (`face.js:325`). Mouth short, off-centre,
2.0 wide with a 1.2 corner tick (`face.js:338-339`). Blush = three 1.3 hatch strokes (`face.js:342`). Hair = one
dark cel mass + a zig-zag highlight band in `mix(hair,'#6f8fb3',0.75)` (`face.js:354-357`).

**zp** (`zp/head.js`). Silhouette = **convex hull** of a skull circle + 11 jaw points (`head.js:68-75`). A convex
hull cannot have a brow notch, nose, lips or a cheek-to-chin S-curve, so every head is an egg with a straight-sided
V jaw (Grandad with `jaw 1.3` becomes a wedge, `zoom_heads_a.png`). The nose is a separate filled patch laid on
top (`head.js:219-237`), so at yaw 40 it reads as a hook drawn *inside* the face, not a silhouette feature. Eyes are
projected at longitude ±26°×1.25 (`head.js:160`) and the near eye sits on/over the contour (visible in every zp head
in `compare.png`). Eye height `eyeH` 0.24–0.38R → up to 0.30 of head height (Isla) vs ELA 0.22. Ear at lon −99°
(`head.js:114`), 0.19R×0.27R. Hair = sphere region above a hairline (`head.js:95-111`), so there is no hair mass
behind/below the skull; `hairLine` strands (`head.js:382-391`) are 6 thin lines converging on one point, which
reads as a spider-web scribble (Isla, Peg, Maya in `compare.png`, `zp_isla_face.png`).

**Visible consequence.** zp faces are generic eggs with googly eyes stuck on the edge; no profile, no skull behind
the face, hair is a cap plus scribbles. ELA's head reads as a real 3/4 head with a nose and chin.

**Recommend.**
- Replace the convex hull with a **profile-driven silhouette**: build the front contour from a per-design profile
  table like ELA's (`face.js:292`: brow, notch, nose tip, upper lip, lower lip, chin, jaw corner) and blend it in
  by `|sin(yaw)|`; keep the sphere only for feature placement. Minimum: after the hull, splice in nose tip
  (+0.14R forward at y≈+0.2R), a 0.04R notch above and a 0.05R lip bump, and round the chin with 3 points instead of
  the V (`head.js:72` chinPoint default 0.25 → 0).
- Eyes: clamp the near eye so its outer edge stays ≥ 0.08R inside the front contour; reduce eye longitude
  26 → **18**; default `eyeH` 0.36 → **0.28**, `eyeW` 0.26 → **0.22**; far eye 0.8× width.
- Ear lon −99 → **−105**, size 0.19×0.27R → **0.25×0.36R**, with ELA's C + inner curl (1.4 px).
- Hair: add a back mass polygon (ELA `face.js:352` normalised: extends 0.45 head-width behind the ear and down to
  jaw level), drawn behind the skull; replace `hairLine` strands with ELA's highlight band (`face.js:355`, fill, no
  lines). Delete the converging-strand code or cap it at 2 short strokes.
- Brows: `LW.line + 2.2*browThick` = 4.5 px (`head.js:214`) → **2.6–3.0** px (ELA `face.js:318`).

## 3. Line weight

**ELA.** `ink()` defaults (`lib/ink.js:56-90`): taper **[0.18, 0.22]**, `minW` 0.14, width modulation
`1 + 0.2·sin(s/21) + 0.07·sin(s/6.5)`, wobble **0.7** (face 0.35, `cel` 0.8). Every panel's art runs through
`feDisplacementMap scale=2.6, baseFrequency 0.045` (`archive/every-line-alive.js:31, 247`), so even straight edges
waver ±1.3 px. Weights: contours 3.2 (`artist.js:32,47`), face contour 3.0 (`face.js:273`), eyes 2.2, mouth 2.0,
nose 1.5, fold lines 1.2–1.5 **in the garment's shadow colour** (`artist.js:33-35, 94-95`), panel border 3.6 with
wob 0.5 (`every-line-alive.js:35`). Line scales with the drawing (heads are drawn under `scale(1.7)` in close-ups,
`every-line-alive.js:363`, giving a 5.1 px contour on a big face).

**zp.** `LW = {fine 1.4, detail 1.9, line 2.3, contour 2.8, heavy 3.4}` absolute (`zp/core.js:3-8`).
`line()` taper **[0.08, 0.1]**, `vary` 0.06, `wob` 0.15, `minW` 0.35 (`core.js:11-13`); `shape()` contour
`vary` 0.05 (`core.js:21`). The head contour is drawn with **taper [0,0]** (`head.js:127`). Upper lid = 3.2
(`head.js:176`), heavier than the 2.8 contour. Panel border is an exact SVG `rect` stroke 2.6 (`page.js:40-41`),
balloons 1.9 exact strokes (`page.js:109-110`). No displacement filter.

**Visible consequence.** zp line is a vector-perfect even stroke: tidy, clip-art. In close-ups the absolute
width makes the contour hair-thin relative to the face (Isla close-up: 2.8 px on a ~250 px face = 1.1%; ELA
panel 06: 5.1 px on ~140 px = 3.6%). Interior marks as heavy as the contour flatten the face.

**Recommend.**
- `core.js:11-16`: taper [0.08,0.1] → **[0.2, 0.25]**, `vary` 0.06 → **0.18**, `wob` 0.15 → **0.45**,
  `minW` 0.35 → **0.2**; contours `vary` 0.05 → **0.15**; `head.js:127` taper [0,0] → closed ink with vary 0.15.
- Port ELA's `#rough` filter into `page.js:svgDoc` and wrap `art()` in `panel()` (`page.js:36`) with it
  (scale **2.2–2.6**, baseFrequency 0.045). Keep captions/balloons outside it, as ELA does.
- Scale line with figure size: `w = LW.x * clamp(s, 0.8, 2.0)` for head/hand/figure strokes (not backgrounds).
- Feature hierarchy: eye outline 2.3 → **2.0**, upper lid 3.2 → **2.4**, nose line `LW.contour` → **1.6**, mouth
  2.3 → **2.0**, ear inner 1.4 ok, blush ok. Contour stays ≥ 1.4x any interior mark.
- Fold/crease lines in the garment shadow colour (`mix(color,'#000',0.25)`) at 1.2–1.5, not black `LW.fine`
  (`figure.js:279, 284`).
- Panel border: replace the SVG rect with `I.ink(... closed, lin, w: 3.4, wob: 0.5, vary: 0.12)`.

## 4. Detail and simplification

**ELA.** Few interior lines but each is placed: 3 kimono fold strokes on the lap (`artist.js:33-35`), 2 on the
sleeve (`artist.js:94-95`), a sleeve-mouth shadow ellipse (`artist.js:96`), collar band 7 px white under a 1.6 line
(`artist.js:49-50`), obi with a gold stripe (`artist.js:54-56`), knuckle creases and nails on hands
(`hands.js:30-39`). Props are dense and specific: pinned doodles, inkstone, brush pot, cat, goldfish bowl,
scattered sheets, tatami in perspective (`every-line-alive.js:278-298`).

**zp.** Torso, sleeves and trousers carry 0–2 interior marks (elbow crease + cuff, `figure.js:279-284`; belt
optional). Hands: 3 knuckle ticks and 1 palm crease, all black (`hand.js:121-126`). Backgrounds are generic:
lollipop trees, scallop clouds, a flat horizon (`uphill.js` `lollipop`, `scallopCloud`; `scene.js`).

**Visible consequence.** zp figures read as empty colour shapes; environments read as placeholders.

**Recommend.** Per garment, 2–3 fold strokes at the joints in shadow colour (1.3 px): knee back, elbow inside,
waist gather, shoulder-to-chest drape. A collar/hem band. For scenes, a per-panel prop list (3–6 specific objects
overlapping the figure) instead of repeated procedural fillers.

## 5. Colour

**ELA.** Every form is `cel()` (`lib/ink.js:178-190`): shadow fill, then base shifted toward the light
(lx, ly ≈ **6..10, −3..−10**), clipped, leaving a shadow crescent on the far side. Used for face (lx 6, ly −3),
neck (lx 0, ly 12: whole top in shadow = under-jaw shadow), hair, robe, obi, eyes (ly 2), props, furniture. Shadow
ΔL* ≈ 10–12. Palette per panel: one dark saturated figure colour against light warm grounds (ΔL* 44–56), plus one
accent (vermilion obi / hanko). Backgrounds get linear/radial gradients and a light pool on the floor
(`every-line-alive.js:282, 313, 360, 382`). Grain 0.16 multiply.

**zp.** Flat fills everywhere; `head.js:5` explicitly says "flat colour, no shading". Only `far` limbs are
darkened 15–25% (`figure.js:258, 254`). Garments are mid-value and often the same hue family as the ground
(ΔL* 12–35). Scene tint pulls figures toward ambient (`figure.js:362-368`), further lowering contrast at dusk and
night. Grain 0.07 normal blend (`page.js:37`).

**Visible consequence.** zp reads flat and pale; figures sink into backgrounds (Peg on the sky, Grandad on the
hill, Isla's red coat against green of the same value).

**Recommend.**
- Port `cel()` into `zp/core.js` as `shape(..., {shade, lx, ly})` and use it in `limb()`, torso, head hull, hair,
  neck, nose, props. Light default **lx 7, ly −6** (ELA `artist.js:11`), shade = `mix(base,'#000',0.22)` or a
  hand-picked warmer shade; skin shade `#dea582`-style (ΔL* ≈ 12).
- Neck: full shadow under the jaw (ELA `face.js:287`, ly 12).
- Enforce figure/ground ΔL* ≥ 35 in each colour script: darken main garment (e.g. Grandad `#4f7a55` →
  `#2f4f3a`, Peg `#e0a23a` on a sky → put her in a deeper top or lighten/desaturate the sky).
- `tinted()`: cap the tint at 0.25 and tint shadows more than lights.
- Grain: `page.js:37` 0.07 → **0.14–0.16** with `mix-blend-mode:multiply` (ELA `every-line-alive.js:32`).

## 6. Figure construction

**ELA.** Bespoke silhouettes per pose: one torso polygon with an S back and chest (`artist.js:46`), lap mass as a
single shape (`artist.js:31`), sleeves as big cloth shapes built around the elbow and wrist
(`artist.js:73, 92`), forearm as an outlined tube that disappears into the sleeve with a dark sleeve-mouth
(`artist.js:90-96`). Whole torso tips with `hunch` for age; head counter-rotates `-hunch*0.4` (`artist.js:25, 58`).
Overlaps are deliberate: arm in front of torso, hand in front of desk, obi knot behind.

**zp.** Capsules for every limb (`core.js:26-51`), uniform radius with round caps; torso interpolated between two
5-point outlines (`figure.js:300-308`); trousers = fill joining torso to legs with lines only on the outer sides
(`figure.js:326-331`). Poses are joint angles/IK; no squash, no contrapposto, spine is a straight line
(`figure.js:174`, `up` vector).

**Visible consequence.** "Tidy cartoon rig": straight tubes hinged at joints, a slab torso, no line of action
(Grandad, Chen, Peg in `compare.png`; Chen waking in `zp_bfly_wake.png`).

**Recommend.**
- Spine as a 3-point curve (pelvis, waist, chest) with a `curve` pose parameter (−15..+15°) and a separate chest
  and pelvis tilt; derive torso contour from it with ≥ 8 points/side (chest bulge, waist pinch 0.85, seat).
- Limbs: draw sleeve/trouser as one tapered cloth shape from shoulder/hip to cuff, wider than the limb by 20–30%
  and bending with a fold at the joint, instead of two capsules meeting at a round cap (`figure.js:273-275`).
  Forearm/hand enters the sleeve with a shadow ellipse (ELA `artist.js:96`).
- Line of action: add `gesture` (deg) that bends spine + neck + head in one arc; default ±6° rather than 0.

## 7. Hands

**ELA** (`lib/hands.js`). Fingers are `tube()`s: dark stroke w + 2×1.9, skin w on top, width **8.4** units
(0.08 head), lengths 12/10/8 per phalanx (`hands.js:13-21, 59-77`). Palm is a `cel` with shadow. Draw order sells
the grip: tucked ring/little fingers → palm → brush → index along the brush → thumb pinching on top, each later
finger outlined over the earlier ones. Nails (1.1 px, op 0.6) and knuckle creases (1.0, op 0.55). Hand ≈ 0.58
head.

**zp** (`zp/hand.js`). Same tube idea, but one merged silhouette with **no outlines between fingers**
(`hand.js:105-119`) except the thumb; finger width `2.85*s` in unit space, and `s` from `figure.js:286` makes the
whole hand 0.26 head. Pose tables curl fingers to 120–175° so at in-comic size the hand collapses into a blob or a
claw (`zoom_hands.png`, Grandad's hands in `zp_uphill_p2fig.png`). No object is ever placed in the grip (no
`holdN` use in `comics/*.js`). No shading.

**Visible consequence.** zp hands are small lumps; grips don't read; they undercut every gesture panel.

**Recommend.** Scale first (`hs` → `u*0.030`). Then port ELA's layered construction: keep per-finger outlines
for fingers that cross the palm or each other (draw order: back fingers, palm, held object, front fingers,
thumb), finger width **0.08 head**, phalanx lengths 12/10/8 relative to a 36-unit palm, palm cel shadow, nail on
front-facing fingertips. Ship `gripHand`/`openHand`/`restHand`/`raisedHand` equivalents as zp poses with an object
slot, and use them in the comics for every held prop.

## 8. Staging and composition

**ELA.** One repeated set (round window, desk, mountain) seen at 5 distances; every figure panel has a floor plane
in perspective with a vanishing point (`every-line-alive.js:53-74`), a light pool, props in front of and behind
the figure, and the figure at 54–73% of panel height (A: ~216/400, C: ~248/340, D: ~236/360). Close-ups are real
close-ups built with the same model (`F.head` at scale 1.7, the eye panel, the pausing hand). Value: dark figure,
light room, one hot accent.

**zp.** Page geometry is on target, but many panels are wide shots with 15–25 px `tiny()` stand-ins
(`uphill.js` `tiny()`), empty fields of flat colour, backgrounds with no floor perspective (`scene.js:room` draws a
floor line and optional boards), and figures that do not overlap anything. Close-ups scale the head up but keep the
2.8 px line (section 3), so they look like a different, thinner style.

**Recommend.** At least one overlap (prop/furniture in front of the figure) per figure panel; floor planes with a
vanishing point (port ELA `room()` logic into `scene.room`, board lines 1.2 → 2–3 px in a darker floor tone);
figure height ≥ 50% of panel height except for deliberate "tiny figure" beats; keep tiny figures ≥ 40 px and drawn
by `fig()`, not `tiny()`.

---

## Top 10 engine changes, by visual impact

1. **Cel shading on every form** (port `lib/ink.js:178-190` `cel()` into `zp/core.js` `shape`/`limb`, head hull,
   hair, neck; light lx 7 / ly −6, shade ≈ base −22% / ΔL* 10–12). Biggest single gap: zp has zero form shadow.
2. **Hand scale ×2.2** (`zp/figure.js:286` `u*0.0135` → `u*0.030`, child `0.0115` → `0.026`) plus ELA layered
   finger outlines and palm shadow (`zp/hand.js:105-119` → `lib/hands.js:59-77` construction).
3. **Line character**: `zp/core.js` taper [0.2,0.25], vary 0.18, wob 0.45, minW 0.2; closed contours vary 0.15;
   add the `#rough` displacement filter (scale 2.4, freq 0.045) to panel art in `zp/page.js:36`.
4. **Head silhouette with a profile** instead of a convex hull (`zp/head.js:68-75`): nose tip, brow notch, lip
   bumps, rounded chin in the contour; chinPoint default 0.
5. **Eyes inside the face**: eye longitude 26 → 18, `eyeH` 0.36 → 0.28, `eyeW` 0.26 → 0.22, clamp near eye ≥ 0.08R
   inside the contour; upper lid 3.2 → 2.4, brows 4.5 → 2.8.
6. **Figure/ground value contrast ≥ 35 ΔL\*** in every colour script (darker garments, e.g. `#2f4f3a` for Grandad),
   cap `tinted()` at 0.25.
7. **Limb and neck bulk**: `limbR` 0.085, `legR` 0.09, `pantsR` 0.125, neck `u*0.12`, tapered radii per segment;
   sleeves and trousers as one cloth shape per limb, not capsule pairs.
8. **Hair mass behind the skull** + highlight band instead of converging strands (`zp/head.js:95-111, 382-391`
   → `lib/face.js:352-358`).
9. **Line scales with the drawing** for characters (`LW × clamp(s,0.8,2)`), and interior/contour hierarchy
   ≥ 1.4x (nose 1.6, mouth 2.0, eye 2.0 under a 2.8+ contour).
10. **Grain and border**: grain 0.07 → 0.15 with multiply (`zp/page.js:37`); inked wobbly panel border 3.4 instead
    of an SVG rect (`page.js:40-41`); garment fold lines in shadow colour, 2–3 per garment.
