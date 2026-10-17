# CPD — Vercel usage fixes + canonical restaurant links

**Date:** 2026-10-16  
**Status:** **CPD COMPLETE** (FE tip-gate PASS apex + www)  
**Scope:** FE only (+ Vercel Firewall rule)

## Ship

| Field | Value |
|-------|--------|
| Feature commits | `220d39e5` — `fix(vercel-usage): stop SEO middleware self-fetch and per-hit inventory pulls` · `9f708680` — `fix(links): canonical restaurant URLs on menu and search pages` |
| **Live tip** | `menubloc-frontend-pf5sblpul-menuply.vercel.app` / `index-DmqlyvxJ.js` |
| Tip-gate apex/www | **RESULT=PASS** (re-checked after the docs push) |
| FE path | `menubloc-frontend-main` @ clean `main` (fast-forward from `fix/vercel-usage-shapbot-middleware`) |
| BE | unchanged this CPD (lock noted `2e8aa3c4`) |

## Why

Sep 16 – Oct 16 Vercel Hobby usage hit 1,003,889 / 1,000,000 CDN requests. 293,569 of 293,575 function
invocations were `middleware.js`. Both spiked Oct 9–14, driven by the headless crawler `ShapBot/0.1.0`
(~76–89% of backend traffic in every sampled window). Full write-up:
`docs/operations/2026-10-16_shapbot-block-rule.md`.

## What shipped

- **Vercel Firewall (dashboard, published 2026-10-16):** custom rule `Block ShapBot crawler`, which denies
  requests whose User Agent contains `ShapBot`. Cloudflare rule **not** applied.
- **robots.txt:** `User-agent: ShapBot` / `Disallow: /`.
- **Middleware:** `dist/index.html` is embedded at build (`scripts/embedSeoShell.mjs` →
  `src/lib/seo/seoShell.generated.js`), so SEO pages no longer fetch `/` from themselves. That fetch cost one
  extra CDN request per invocation. Legacy `/restaurants/:slug` only loads the 2.3 MB sitemap
  inventory for city-shaped slugs, cached 10 min per instance.
- **Canonical links:** search cards (header + full-menu), public menu page, catalog renderers, MenuHeader,
  GrubbidMenuView and the menu-item pages link to `/restaurants/{state}/{city}/{slug}` when location is
  known. The old id/slug fallback is kept when it is missing. `/search?q=burger` went from 81 legacy links
  to 0.

## Deploy note

`cpd-fe.sh` alias step failed with `A certificate is being generated for menuply.com (400)`.
`vercel --prod` had already aliased every menuply host. The CPD was finished with
`INTENDED_DEPLOY=… cpd-fe.sh --lock-only` → **RESULT=PASS**.

## Verification (live)

- ShapBot UA → **403** on menuply.com, www, grubbid.com. Normal UA and Googlebot → 200/308.
- Production build log: `[embedSeoShell] embedded 8029 bytes`.
- SEO pages (profile, menu, city `/restaurants/houston-mo`, cluster) → 200, `X-SEO-Middleware: injected`.
- Legacy `/restaurants/<slug>`, `/restaurants/<id>/menu`, `/public/restaurants/<id>/menu` → 301 to canonical.
- `/search?q=burger` on the live bundle: 24 header + 57 menu links canonical, 0 legacy. Menu page profile
  link canonical.
- Tests: new middleware/link tests pass. Pre-existing failures on `main` are unchanged.

## Known

- Injected SEO HTML is sent with `Cache-Control: max-age=3600`, so returning browsers may keep the previous
  shell (old bundle) for up to an hour.
- The SEO title double-escapes apostrophes (`McDonald&amp;#39;s`). This predates the CPD.
