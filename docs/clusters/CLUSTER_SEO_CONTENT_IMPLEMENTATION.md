# Cluster SEO Content Implementation

**Date:** 2026-07-13  
**Branch:** `stabilize/frontend-safe-baseline` (active Cluster frontend)  
**Scope:** Visible Cluster intro copy, directory card blurbs, contextual search placeholders, and document/OG/canonical metadata for public Cluster pages.  
**Out of scope:** Homepage, Waiter, DB schema, production data updates, search logic, membership, radius, MKS, routing structure.

---

## Authoritative content source

| Layer | Role |
|-------|------|
| **`menubloc-frontend/src/lib/clusterSeoContent.js`** | **Authoritative SEO overlay** for unique intro, card blurb, `seoTitle`, `metaDescription`, and `searchPlaceholder` keyed by Cluster slug |
| API / `public.clusters` | Identity + directory listing (`name`, `city`, `state`, `type`, coverage flags, optional `short_description`) |
| `clusterLegalCopy` (API + client) | Legal disclaimer, page H1 (`page_heading`), legacy share fields as **fallback** when SEO map has no slug |
| `middleware.js` `buildClusterMeta` | Crawler HTML injection prefers `clusterSeoContent` then API `share_*` |

No database migration and no production data UPDATE were used for this implementation.

---

## Supported fields (`ClusterSeoEntry`)

| Field | Purpose |
|-------|---------|
| `slug` | Match key |
| `displayName` | Editorial name |
| `city` / `state` | Location facts for editors/tests |
| `clusterType` | airport / university / stadium / entertainment_complex / … |
| `intro` | Visible ~60–120 word detail-page intro |
| `cardDescription` | Short directory card text (line-clamped) |
| `seoTitle` | Document + OG title |
| `metaDescription` | Meta + OG description |
| `searchPlaceholder` | Food search input placeholder (search **scope unchanged**) |

---

## Fallback behavior

1. **Intro:** SEO `intro` → API `short_description` → `description` → omit  
2. **Card blurb:** SEO `cardDescription` → API `short_description` → omit  
3. **Document title/description:** SEO → API `share_title` / `share_description` → generic area fallback  
4. **Search placeholder:** SEO → `"Search food here"`  
5. **Dev warning:** `resolveClusterIntro` logs a `console.warn` when a Cluster loads without SEO config (Vite `import.meta.env.DEV`)  
6. **Generic arrival tagline** is **not** rendered on Cluster pages

---

## Editing procedure — add a new public Cluster

1. Add a slug entry to `CLUSTER_SEO_CONTENT` and `PUBLIC_CLUSTER_SEO_SLUGS` in `clusterSeoContent.js`.  
2. Write unique `intro`, `cardDescription`, `seoTitle`, `metaDescription`, `searchPlaceholder` (qualified language; no completeness/official claims).  
3. Run `node --test test/clusterSeoContent.test.js`.  
4. Smoke the detail URL and `/clusters` card.  
5. Deploy a frontend branch that contains Cluster pages (`stabilize/frontend-safe-baseline` or successor) — bare `main` may lack Cluster UI.

---

## Metadata rules

- Unique title and meta description per public Cluster  
- Canonical URL remains the Cluster path (`/clusters/{state}/{city}/{slug}`)  
- Open Graph title/description follow the same SEO fields via `applyDocumentSocialMetadata` / middleware  
- Growing-Cluster JSON-LD stays `CollectionPage` + `isPartOf` WebSite — **do not** type Menuply as Stadium/Airport/University  
- Directory `/clusters` sets title, meta description, and canonical `/clusters`

---

## Factual-claim guardrails

Use qualified language (“available”, “participating”, “associated with”).  
Do **not** claim: every restaurant included, official affiliation, complete pricing, or full venue coverage unless proven.

---

## Public Cluster coverage (SEO configured)

| Slug | Path |
|------|------|
| `la-live` | `/clusters/california/los-angeles/la-live` |
| `lax` | `/clusters/california/los-angeles/lax` |
| `atl-airport` | `/clusters/georgia/atlanta/atl-airport` |
| `american-airlines-center` | `/clusters/texas/dallas/american-airlines-center` |
| `att-stadium` | `/clusters/texas/arlington/att-stadium` |
| `ucla` | `/clusters/california/los-angeles/ucla` |
| `usc` | `/clusters/california/los-angeles/usc` |

---

## Tests added

- `menubloc-frontend/test/clusterSeoContent.test.js` — coverage, uniqueness, resolvers, share preference  
- Updated `test/clusterShare.test.js` — SEO title/description take priority  
- Updated `tests/playwright/cluster-arrival-immersion.spec.js` — unique intro present; generic tagline absent  
- `tests/playwright/cluster-seo-copy-screenshots.spec.js` — route/meta/screenshot verification for directory + detail pages  
- Screenshots: `menubloc-frontend/verification-output/cluster-seo-copy/` 

---

## Exact files changed

| File | Change |
|------|--------|
| `menubloc-frontend/src/lib/clusterSeoContent.js` | **New** content model |
| `menubloc-frontend/src/pages/ClusterPage.jsx` | Unique intro; contextual search placeholder; SEO JSON-LD description |
| `menubloc-frontend/src/lib/clusterUrl.js` | Deprecate arrival tagline as consumer copy |
| `menubloc-frontend/src/lib/clusterLegalCopy.js` | Prefer SEO for share title/description |
| `menubloc-frontend/middleware.js` | Prefer SEO in crawler meta |
| `menubloc-frontend/src/pages/ClustersDirectoryPage.jsx` | Softened intro + directory head tags |
| `menubloc-frontend/src/components/cluster/ClusterDirectoryCard.jsx` | Card blurbs from SEO map |
| `menubloc-frontend/test/clusterSeoContent.test.js` | **New** |
| `menubloc-frontend/test/clusterShare.test.js` | Expect SEO titles |
| `menubloc-frontend/tests/playwright/cluster-arrival-immersion.spec.js` | Assert unique intro |
| `docs/clusters/CLUSTER_SEO_CONTENT_IMPLEMENTATION.md` | This file |
| `docs/clusters/CLUSTER_ARCHITECTURE_BASELINE.md` | Copy rules + SEO status |
| `docs/audits/README.md` | Index pointer |

---

## Confirmation

No homepage, database schema, production data, Waiter, search logic, route structure, membership, radius, or MKS changes.
