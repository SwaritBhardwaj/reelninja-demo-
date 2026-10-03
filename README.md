# ReelNinja

Landing page for **ReelNinja** — production infrastructure for content companies.

> 10× the videos. No new hires.

**Live:** <https://reelninja.numerous-breadfruit.workers.dev>

The page sells a production *system*, not a clip service. An agency hands over
how it edits once, that becomes a Style System, and from then on output stops
being capped by how many editors can be hired. The AI is the reason the numbers
work, not the pitch.

---

## Structure

```
src/index.html          The page as a template, with <!-- @MARKER --> slots
assets/css/tokens.css   Design tokens. Every colour and size comes from here
assets/css/page.css     The page. Nothing here invents a value
assets/js/math.js       The capacity calculator
assets/js/app.js        Reveals, reading-progress, ticker pause
assets/js/book.js       Booking calendar (loads on /book/ only)
assets/logos/           Platform marks, inlined as currentColor SVG at build time
assets/fonts/           Self-hosted Geist / Newsreader / Departure Mono
assets/icons/           Favicons, app icons, maskable icons
book/index.html         The booking page
scripts/reelninja_build.py
site/                   Generated output — this is what deploys
```

## Build

```bash
python scripts/reelninja_build.py --base https://your-domain.com
```

The build does two things the page cannot do for itself:

1. **Injects generated markup.** The twenty platform marks are inline SVG
   (they carry `fill="currentColor"`, so an `<img>` would render them black on
   black), and the format ticker is generated from one list. Hand-writing those
   guarantees they drift.

2. **Derives structured data from the rendered page.** The `FAQPage` schema is
   parsed out of the actual `<details>` blocks and the `Offer` out of the actual
   price table, so the JSON-LD cannot disagree with the visible copy. A
   hand-maintained duplicate is the classic way to publish two versions of your
   own prices.

It also versions every CSS and JS reference with a content hash
(`page.css?v=2751aeffea`), which is what lets those files be cached
immutably without a deploy going unnoticed.

## Deploy

```bash
npx wrangler deploy
```

`wrangler.toml` serves `./site` as static assets — there is no Worker script,
which is the point. It deploys to the Influenzo Cloudflare account pinned in
`wrangler.toml`; authenticate with `npx wrangler login` or a
`CLOUDFLARE_API_TOKEN` that has Workers edit rights.

## Design notes

- **Black and white only.** There is no accent colour. The signal is inversion:
  ink-on-paper and paper-on-ink alternate by band. Video thumbnails are the only
  colour on the page.
- **The landing page makes zero third-party requests.** Fonts are self-hosted,
  every mark is inline SVG, and there is no analytics. The only external origin
  anywhere is the scheduling iframe, and it loads on `/book/` only.
- **Animations fail open.** With scripting off the page is complete and static:
  reveals are inert and the progress line is zero-width. The hero's default
  state is the finished one: eight rendered clips on a marked episode. The
  entrance only plays that state in, once, and never loops.
- **Reduced motion shortens motion, it does not remove it.** The tickers run at
  half speed and the reveals drop their translate but keep their fade. Zeroing
  the durations turned the page into a frozen document with raw scrollbars on
  it, which reads as broken rather than as considerate.
- **The tickers have a real pause control.** Hover is not a mechanism on touch
  and focus is not one mid-scroll.

## Known gaps

Stated plainly, because a public page should not overstate itself:

- **There is no client reel.** Partners publish under their own names, so the
  Formats section is a spec sheet plus the free three-clip sample, and the page
  says why.
- **"10× the videos" is a positioning claim, not a measured result.** One case
  study with before-and-after numbers would make it evidence.
- **The USD ladder ($45 → $25, set 2026-10-03) is not yet checked against a
  logged cost per video. The setup fee is a
  range, quoted per client. The ladder lives in two places that must agree: the
  table in `src/index.html` and `LADDER` in `assets/js/math.js`.

## Credits

Fonts are SIL Open Font License 1.1 — see `assets/fonts/LICENSES.md`.
Platform marks are from [Simple Icons](https://simpleicons.org) (CC0); the marks
themselves remain trademarks of their owners and are used here only to name the
platforms a client's output has to live on.
