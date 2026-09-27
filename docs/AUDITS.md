# Audit log

Each comic went through (1) my own panel-by-panel review after every render, (2) the automated style
check (`qc/score.py`, results in [QC.md](QC.md)), and (3) independent art-director audits that compared
every panel with real Zen Pencils strips at the same scale. Audits 1 and 2 came before the rework;
the blind audits at the end of this file came after it.

## Audit 1 (Up-Hill first draft)
Scores out of 10 vs Zen Pencils: characters 2, hands 2, backgrounds 3, colour 4, composition 3,
lettering 3, layout 5, storytelling 4, finish 3. Main problems: balloons pointing at empty grass,
faces on the backs of heads, a broken piggy-back, a silhouette-blob turn panel, answers read before
questions, no cast shadows, grey glows. All were fixed before audit 2.

## Audit 2 (all five)
| | characters | hands | backgrounds | colour | composition | lettering | layout | story | finish |
|---|---|---|---|---|---|---|---|---|---|
| Up-Hill | 3 | 3 | 4 | 5 | 4 | 4 | 6 | 5 | 4 |
| The Great Ocean | 3 | 4 | 4 | 6 | 5 | 6 | 5 | 5 | 4 |
| The Butterfly | 3 | 3 | 5 | 6 | 4 | 6 | 5 | 5 | 5 |
| Several Thousand Things | 3 | 3 | 4 | 5 | 4 | 4 | 5 | 5 | 4 |
| Wobbling Will | 4 | 3 | 4 | 6 | 5 | 6 | 6 | 6 | 5 |

Fixed after audit 2:
- **Engine:** far arms hidden behind a turned body no longer leave floating hand stubs; back views show
  hair down to the neck, not a face; silhouettes lose their interior lines; the far lens of a pair of
  glasses is hidden in profile; balloon tails always reach the speaker; per-panel speaker anchors.
- **Up-Hill:** every tail aimed at its speaker; walking stick restored; Grandad hands over his half of
  the sandwich; the pointing arm comes from the shoulder; the inn sits on a hill that meets the ground;
  the two heads in the doorway no longer overlap; the hosts reach out.
- **The Great Ocean:** sea drawn in perspective with foam and a glitter path; a curved, feathered Milky
  Way with a dust lane; bigger, lit figures with reflections; real back views; Ada faces the door on her
  way out, shoes dangling; a warm torch pool; Toby delighted; the hotel has a building.
- **The Butterfly:** the clock reads 3:07 on a wall pillar; he slumps with a hand on the mouse; in panel 3
  he is asleep on his arms, and the butterfly rises off his shoulder; a proper telephone and a chair
  tipping back; a rooftop garden with a parapet and water tank; the window really opens.
- **Several Thousand Things:** the fridge fills from 5 to 12 to 21 to 47 photos; labels no longer overlap;
  Dad has a moustache, not a smear; the camera points at the loaf; flour comes out of a bag she's tipping;
  the finale puts the full fridge behind them and the characters at the centre.
- **Wobbling Will:** a real footbridge she can look at, with the eye-line aimed at it; tight title
  lettering; the crash shows legs out of a hole in the hedge and the bike's back end; the bike lies flat on
  the grass by the bench; speed lines only behind her; a big duck taking off.

## Before the rework: still short of Zen Pencils
- Figures are still built from capsules and read as tidy cartoon rigs; Gavin Aung Than's figures have
  gesture, squash and weight that a joint rig does not produce.
- Line weight varies little; there is no feathering or brush taper inside forms.
- Backgrounds are procedural (repeated trees, flowers, waves) rather than designed.
- Up-Hill and The Great Ocean are darker than 90% of Zen Pencils strips, by design of their colour scripts.

---

## The rework (September 2026)

The five comics were diagnosed panel by panel against real Zen Pencils panels of similar shots, the engine was
rebuilt, and every panel was redrawn. The full numbered diagnoses, with the fixes, story changes and remaining
weaknesses for every panel, are in [`docs/diagnosis/`](diagnosis/). Every Line Alive was not touched.

### Why Every Line Alive looked better
A side-by-side study ([`diagnosis/00-ela-vs-zp.md`](diagnosis/00-ela-vs-zp.md)) found the gap was construction, not
proportion: zp had no form shading at all, hands 2.2x too small with merged fingers, vector-perfect lines with a
fixed pen width (so close-ups looked hair-thin), heads built as convex hulls (no nose, brow or chin in the
silhouette), features heavier than the face outline, and figures that sank into their backgrounds (12–35 ΔL*
against ELA's 44–56).

### Engine changes
- **Line:** thick-thin brush strokes. Width follows the light (heavier on shadow sides and undersides, about 2.2:1),
  lines taper into overlaps, jitter is gone, and the pen grows sub-linearly with the drawing's scale.
- **Shading:** one flat cel shadow per form, with a spot-black mode for dark cloth and hair and a halftone mode.
- **Heads:** designed silhouettes and a face preset per character (face shape, jaw, nose, brows, eye style, lids,
  ears, neck), interior-line noses in 3/4, flatter kid layouts, hair as masses with highlights, 17 moods that are
  exaggerated at small sizes, glasses with a nose under them, and necks that join organically.
- **Figures:** a 3-D rig with a line of action, contrapposto, stoop for the elderly, cloth shapes with a fold
  vocabulary, real back views, seated weight and cast shadows; a pose library (`zp/poses.js`) with two-figure
  poses; a real bicycle (`zp/bike.js`).
- **Hands:** 2.2x bigger, jointed fingers, a thumb pad, grips that wrap the object, 20 poses, child and old hands.
- **Backgrounds:** seeded variation so no two trees, stones, clouds or crowd members match; depth layers.
- **Lettering and finish:** hand-lettered glyphs, irregular brush balloons with curved tails, inked caption
  boxes, bouncing SFX, flat ring glows, and a paper texture instead of uniform digital grain.

### Blind audits
Each comic was audited three times by a fresh reviewer who got four unlabelled strips (ours plus three real Zen
Pencils strips, different ones each round, credits masked) and was not told which was which or what had changed.

| mean score out of 10 | first pass | after audit fixes | final | real strips in the same audits |
|---|---|---|---|---|
| Up-Hill | 4.4 | 5.4 | 5.3 | 7.4–8.8 |
| The Great Ocean | 4.6 | – | 5.2 | 6.9–8.5 |
| The Butterfly | 4.6 | 5.4 | 5.3 | 7.8–8.9 |
| Several Thousand Things | 4.8 | 5.9 | 5.3 | 7.8–8.7 |
| Wobbling Will | 3.9 | 6.1 | 5.6 | 8.0–8.7 |

Final audit, by category:

| | characters | hands | backgrounds | colour | composition | lettering | layout | story | finish |
|---|---|---|---|---|---|---|---|---|---|
| Up-Hill | 5 | 3 | 6 | 6 | 6 | 5 | 6 | 6 | 5 |
| The Great Ocean | 4 | 3 | 6 | 6 | 5 | 6 | 7 | 5 | 5 |
| The Butterfly | 4 | 4 | 6 | 6 | 5 | 6 | 6 | 6 | 5 |
| Several Thousand Things | 5 | 4 | 6 | 6 | 5 | 5 | 6 | 6 | 5 |
| Wobbling Will | 5 | 4 | 5 | 7 | 6 | 5 | 6 | 7 | 5 |

For comparison, audit 2 (before the rework, not blind) scored the five 3–6, with characters and hands at 3–4.
Scores moved by about ±0.5 between reviewers, so the first-pass-to-final change (+0.5 to +1.7) is the signal.
Every auditor, every round, still identified our strip as the one not drawn by a professional.

### Story changes made during the rework
- **Up-Hill:** in the doorway panel Isla walks in hand in hand instead of riding on Grandad's back.
- **The Great Ocean:** Ada holds the trophy in the close-up; she shows Toby a pebble and he shows her a shell;
  Toby points up in the last two panels.
- **The Butterfly:** the waking caption is split over two panels, the jolt and then him lying in the tipped
  chair (words unchanged).
- **Several Thousand Things:** Dad takes photo #6 off the fridge and reads its note aloud, so the turn happens
  on the page.
- **Wobbling Will:** the three mornings repeat the same fall in different weather; the turn is split into the
  head-lift and the ride to the bridge.

### The 8/10 bar was not reached, and why
No category reached 8. The best are colour, layout and story (6–7), where the planning is sound. The bar was
not reached because of what the auditors named every time:
1. **Hands (3–4).** Hands are assembled from a parametric model. At 30–60 px on the page they still read as
   mittens or sausage fingers, and a grip on an object at an unusual angle (a loaf torn in two, a pencil, a
   child's fist round a finger) has no pose that is anatomically right, so each one is hand-tuned and often wrong.
2. **Figure construction (characters 4–5).** Poses are joint angles on a rig. The rig produces plausible
   standing and walking figures, but anything that needs judgement (a piggy-back, a fall into a hedge, lying
   in a tipped chair, a crouch in a long dress) comes out as tubes meeting at the wrong places. A cartoonist
   draws the gesture first and the anatomy follows; the engine does it the other way round.
3. **The line (finish 5).** The brush is now thick-thin, but the variation follows one rule (the light
   direction), so reviewers still read it as one even vector weight. Real brush ink varies with speed and
   pressure along each stroke and between strokes, and its edges are never perfectly smooth.
4. **Everything procedural shows its rule.** Stepped glows, repeated tiles and handprints, one bicycle model
   seen from one side, even texture over the whole page: each is a small tell, and together they are what the
   reviewers point to as "generated".
Closing the gap would take a different approach to figures (drawing from gesture curves and per-pose silhouettes
rather than from a joint rig) and a stroke model with per-stroke pressure. That is a larger project than a
panel-by-panel pass.
