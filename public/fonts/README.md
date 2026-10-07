# Local font assets

Golos Text, Rubik and JetBrains Mono, under the accompanying SIL Open Font
Licenses. These WOFF2 files were copied byte-for-byte from the site's successful
Next.js / Google Fonts build on 2026-10-06. No glyphs or font metrics were changed.

`styles/fonts.css` preserves the generated unicode ranges, font weights,
font-display: swap and metric-adjusted Arial fallbacks. The original content
hash filenames are retained for immutable caching. All subsets are included,
so switching to local hosting does not remove character coverage.

The root layout preloads only the Golos Text and Rubik Cyrillic files. Latin,
extended scripts and JetBrains Mono remain available through the stylesheet.
Neither a production build nor a page request needs Google Fonts connectivity.

Upstream licenses:

- https://github.com/google/fonts/blob/main/ofl/golostext/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/rubik/OFL.txt
- https://github.com/google/fonts/blob/main/ofl/jetbrainsmono/OFL.txt
