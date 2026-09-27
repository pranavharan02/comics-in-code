# Study notes: 221 Zen Pencils strips

Before drawing, I downloaded the whole zenpencils.com archive: 223 archive entries, 221 with images,
272 image files, about 260 MB (average strip 980 × 5,700 px). I turned them into 28 contact sheets of
8 strips each and read every sheet in publication order. I then looked at full-size crops of
*Lil' Vincent*, *The Gift of Life*, *Asimov*, *Camus: Invincible Summer* and *The Stonecutter*.
The images stay out of the repo because they're Gavin Aung Than's copyright. These are only my notes.

## What the style actually is (beyond "cartoon + quote")
1. **A colour script, not a colour palette.** Most strips use 2–4 flat hues plus black and skin
   (Camus: teal / pink / black, then orange arrives with the light; Invictus: grey-green + pink;
   Shel Silverstein: all orange). The hue changes *when the feeling changes*. Marie Curie and
   Anne Frank are grey worlds with one saturated accent: the thing the character loves.
2. **Repetition is the engine.** The same composition repeated with one change: the sword in the
   stone (Stonecutter), the elevator doors (Karnazes), the tombstone fading (Goddard), the bird on
   the cliff (Logue), the painter at the easel (Just Keep Missing). Time and effort are shown by
   what *doesn't* move.
3. **White space is pacing.** Tall strips drop the grid and float small panels, or a lone figure,
   on white. Silence before the climax.
4. **Small figures, big panels.** Wide panels with a tiny character and a lot of flat colour, then
   a sudden extreme close-up on the eyes (Malala, McKenna, Stonecutter, Tyson's galaxy eye).
5. **Captions.** All-caps hand lettering. Usually straight on the panel colour with no box; boxed only
   when the art behind is busy. Emphasis in italics. The last caption ends "– AUTHOR".
6. **The climax is typographic or a splash.** One huge hand-lettered word ("O LIGHT!", "PRESS ON!",
   "COME TO THE EDGE!") or a full-width splash that holds the last words of the quote.
7. **Metaphor made literal.** Inner demons, trolls and blank canvases with teeth; later strips turn
   the abstract part of the quote into a creature or an object.
8. **Craft details.** Black borders about 3 px (earlier strips often borderless flat rectangles);
   dashed strokes for cast shadows under feet; sweat drops and emotion ticks; tilted, coloured frames
   for effort panels; subtle paper grain on flat colour; a title block with mixed lettering (script +
   outlined block + black brush banner); footnote citing the source bottom-left and signature and
   site bottom-right.
9. **The arc.** Muted or oppressive → a close-up decision beat → a change of colour → a bright
   release, with the quote landing on the final panel.

## What this meant for my first attempt
*The Voice Within* (my first try, before this study) used Van Gogh's "you cannot paint" line with a
snarling doubt-monster and a *Starry Night* finale. It turns out Zen Pencils already made almost
exactly that strip: **#198 "Lil' Vincent: The Blank Canvas"** (2016). It has a canvas with teeth,
"YOU CAN'T DO A THING", a passionate painting frenzy and a *Starry Night* ending. My version was
unintentionally derivative, so I kept it as a record and made a second, original strip.

## The second attempt: *Every Line Alive*
- **Words:** Katsushika Hokusai, afterword to *One Hundred Views of Mount Fuji* (1834), condensed in my
  own words. Zen Pencils never adapted Hokusai (checked all 223 pages).
- **Repetition:** the same round window, desk and mountain, from age 6 to 110.
- **Colour script:** cream + indigo childhood → grey middle years → dawn tones after seventy →
  vermilion and Prussian blue when every line comes alive.
- **Code as subject:** the drawing on her desk is generated with a `skill` parameter, so it really
  gets better with age. At 110 the lines leave the paper.

## Faces and hands, worked out from full-size crops
(*Just Keep Missing*, *Dream*: the girl at the easel, her mum, the signing panel, the boy drawing.)
- **Heads are 3/4, not profile.** Even when the body is side-on the face turns toward us. The nose
  pokes past the far contour, and both eyes show.
- **Big round skull, face a smaller bean at the front.** The jaw runs in one long diagonal from a
  soft chin back up to the ear.
- **The ear sits far back**, at the end of the jaw, level with the eyes and nose, and on top of the
  hair edge. It's a simple C with one inner curl.
- **Eyes:** two tall white ovals, nearly touching; small black dot pupils; no coloured iris.
  Grown women get one lash flick at the outer corner. Lids drop for tiredness, age and concentration.
- **Nose** is a tiny hook in the silhouette plus a nostril tick. **Mouth** is short and off-centre.
  **Blush** is 2–3 hatch lines, not a pink circle. A kid concentrating sticks their tongue out.
- **Hair** is a dark mass with zig-zag highlight streaks in a lighter blue-grey (white on grey hair).
- **Hands** have separate, jointed, rounded fingers on a flat palm and are drawn fairly big. A pen or
  brush is pinched between thumb and index finger at a slant, with the other fingers curled under,
  never held in a fist.

These now live in `lib/face.js` and `lib/hands.js`.
