# Sparkl Warehousing & Logistics: static site

Plain HTML, CSS and JS (no build step). Built to Sparkl Brand Guidelines v2.0.

## Deploy: GitHub + Cloudflare Pages
1. Create a GitHub repo and push this folder's contents to the repo root.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command: *(leave empty)* · Build output directory: `/` (or leave blank) → Save and Deploy.
4. Pages project → Custom domains → add `sparkllogistics.in` (and `www`).

## Files
- `index.html`, `404.html`
- `assets/css/styles.css`: the original theme, remapped to the brand palette, plus a **Brand layer** at the bottom (tokens, logo rules, buttons, contrast fixes)
- `assets/js/main.js`: all interactions (tracking, pincode, drawer, dark mode)
- `assets/img/`: logo (onyx and ivory), favicon
- `_headers`: security headers and CSP for Cloudflare Pages
- `robots.txt`, `sitemap.xml`, `site.webmanifest`

## Things to check after going live
- **Tracking API:** `https://track.sparkllogistics.in` must allow requests from `https://sparkllogistics.in` (CORS). The CSP in `_headers` already allows that host.
- **Social preview image:** add a 1200×630 PNG at `assets/img/og-image.png` and an `og:image` meta tag in `index.html`.
- **Partner names in the marquee** (Flipkart, Amazon, DHL, etc.): confirm you have permission to show them.
