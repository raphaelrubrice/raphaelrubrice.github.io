# Raphaël Rubrice — personal site

Hand-built static site. No framework, no build step, no backend. Loads instantly,
hosts free, fully under your control.

```
index.html      all the content + copy
styles.css      the design system (colors, type, layout)
main.js         the living cell embedding + scroll reveals + mobile nav
assets/
  favicon.svg   the green cell-cluster icon
  og.png        1200×630 social share card
```

## Before you publish, two edits
1. **LinkedIn URL** in `index.html`, find the line marked `<!-- TODO -->` and
   replace the href with your real LinkedIn URL.
2. **Email** the address is written in word format on purpose (so bots can't
   scrape it). To change it, search `index.html` for `raphael [dot] rubrice` and
   edit the words. Swap to whichever address you want to keep long-term.

To change any text, edit `index.html` directly — it's plain HTML, the copy reads
top to bottom.

## Deploy free on GitHub Pages
1. Create a repo named **`raphaelrubrice.github.io`** (exact name matters — it makes
   the site live at the root domain).
2. Upload these four files + the `assets/` folder to the repo (drag-and-drop in the
   GitHub web UI is fine: "Add file → Upload files").
3. Repo **Settings → Pages → Build and deployment**: Source = "Deploy from a branch",
   Branch = `main`, folder = `/ (root)`. Save.
4. Wait ~1 minute. Your site is live at **https://raphaelrubrice.github.io**.

The meta tags and OG image already point at that URL. If you later add a custom
domain (e.g. `rubrice.dev` ~€10/yr), update the `og:image`, `og:url`, and
`canonical` URLs in `index.html` to the new domain.

## Alternatives
- **Cloudflare Pages** — unlimited bandwidth; connect the repo or drag the folder.
- **Netlify** — drag the folder onto app.netlify.com/drop to go live in seconds.

All three give free automatic HTTPS.
