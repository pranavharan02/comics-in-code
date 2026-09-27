# Quote bank for original Zen Pencils-style comics

`quotes.json` holds **58 verified public-domain quotes, poems and passages** (1691–1921, plus
three older texts in pre-1929 translations: Chuang Tzu, Li Po and Kabir). Each entry comes with an
original story idea for a comic. The list is sorted by `comic_potential` (highest first), then by
whether Zen Pencils has already adapted the author (unadapted authors first).

The mix covers explorers, scientists, labourers and mill girls, cyclists, activists, poets and
artists. About 40% of the authors are women (23 of 58), and many are Black, Indigenous, Asian or Latin
American.

## Fields

| field | meaning |
|---|---|
| `id` | stable slug |
| `text` | exact wording as it appears at `verified_url`. Poems keep their line breaks (`\n`). `...` marks a cut. Non-English originals are stored in the original language |
| `popular_text` | the commonly circulated wording, if it differs (otherwise `null`) |
| `flags` | `popular_wording_differs`, `reported_speech` (someone else recorded the words), `dialect_transcription`, `translation` / `translation_needed`, `loose_translation`, `edition_variants`, `excerpt`, `sensitive_suicide_theme`, `violent_imagery`, `paraphrases_scripture` |
| `author`, `author_dates`, `work`, `year` | source details. `year` is the date of first publication, or of the speech or letter |
| `form` | `prose`, `poem`, or `poem excerpt` (every poem is 16 lines or fewer) |
| `original_language`, `translator`, `english_gloss` | `english_gloss` is our own literal translation where no public-domain English version was found (Sor Juana, Andersen), or the standard rendering (Pasteur, Coubertin). Write a fresh translation for the comic |
| `verified_url` | the page whose text the quote was checked against |
| `verification_level` | `primary` = a digitised early edition (Gutenberg, Wikisource, archive.org) or a transcription of the primary document. `secondary` = a Wikiquote entry that cites the primary source (5 entries: Newton, Faraday, Pasteur, Joe Hill, Anthony 1906) |
| `public_domain_reason` | why the text is safe to use |
| `themes`, `length_words`, `comic_potential` (1–5) | `comic_potential` scores how visual the quote is and whether it has an emotional turn |
| `story_seed` | one-sentence original comic idea: a character, a setting and a turn |
| `zp_adapted_author` | `{value, slugs}` taken from the Zen Pencils archive's slugs and page `<title>`s |
| `zp_adapted_quote` | `{value, note}`. None of the 58 quotes has been adapted. The notes cover near misses: a quote that appears only in a blurb or comment, or an author who appears only as a portrait |
| `used_in_this_project` | `true` for Hokusai, which is already this project's *Every Line Alive* comic |

## Method

1. **Choosing candidates.** I looked for sources published between 1600 and 1928 (letters,
   memoirs, speeches, essays, journals, poems), aiming for a spread of professions, cultures and
   genders. I skipped anything whose best-known version comes from a later, copyrighted
   translation.
2. **Verification.** I fetched each source (Project Gutenberg plain text, Wikisource, archive.org
   OCR, the Penn Digital Library, and transcriptions on BlackPast, the Sojourner Truth Project,
   the Constitution Center, marxists.org, Olympedia and American Yawp). A script then normalised
   quotes, dashes, whitespace and italics underscores and checked that every stored `text` (each
   part, where it has `...`) appears word for word in that source. **All 58 passed.**
3. **Zen Pencils check.** I matched each author's surname against the 223 comic slugs and page
   `<title>`s in the downloaded archive, ignoring hits in comments and sidebars. Results: Whitman
   (#45, #88), Dickinson (#99), Thoreau (#80), Tagore (#133), and Newton (#152, a poster titled
   with his "shoulders of giants" line). None of the chosen quotes has been adapted.
4. **Public domain.** Everything was published before 1929, or is an older letter or speech whose
   author died long ago. Hughes (died 1967) and Service (died 1958) are public domain **in the US
   only**, by publication date.

## Dropped or substituted

- **Checked and not verifiable:** Florence Nightingale, "Rather, ten times, die in the surf..."
  (not in Cook's 1913 *Life*, and no primary source found). Nansen, "The history of the human race
  is a continual struggle from the darkness toward the light..." (not in the text of *Farthest
  North*).
- **Popular wording is not public domain:** Andersen's "Just living is not enough..." comes from
  Hersholt's 1949 translation, so the 1861 Danish original is stored instead.
- **Too long:** Hughes, "Mother to Son" (20 lines).
- **Kept, with a flag, where the popular wording is wrong:** Edison's "10,000 ways" (really
  "several thousand things that won't work"). Kovalevskaya's "poet in soul" (she was quoting
  another mathematician). Sojourner Truth's "Ain't I a Woman?" (from the 1863 Gage version; the
  1851 report is stored). Stevenson's "travel hopefully". Joe Hill's "Don't mourn, organize".
- **Excluded as known misattributions.** These are based on published research such as Quote
  Investigator's and were not re-checked here:
  - Twain, "Twenty years from now..." (used in ZP #9)
  - Goethe, "boldness has genius" (actually W. H. Murray, 1951; ZP #61)
  - George Eliot, "never too late to be what you might have been"
  - Darwin, "not the strongest species" (a 1963 paraphrase)
  - Tubman, "I freed a thousand slaves..."
  - the Shackleton "Men wanted" advert
  - Hypatia, "Reserve your right to think" (invented by Elbert Hubbard)
  - Tecumseh, "Live your life that the fear of death..." (from the 2012 film *Act of Valor*)
  - Chief Seattle's environmental speech (written in 1971)
  - Ibn Battuta, "Traveling leaves you speechless..."
  - Douglass, "prayed with my legs"
  - Michelangelo, "Ancora imparo"
  - Galileo, "Eppur si muove"
- **Authentic but not re-verified here, so a different passage was used:** Muir, "The mountains
  are calling and I must go" (letter of 1873, printed in 1924).
