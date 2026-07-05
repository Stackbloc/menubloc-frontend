# Frontend API Base URL Guardrail

**Status:** ACTIVE — mandatory for all frontend API wiring and Vercel production deploys  
**Established:** 2026-07-05  
**Audit:** [../audits/2026-07-05_frontend-api-base-url-same-origin-regression.md](../audits/2026-07-05_frontend-api-base-url-same-origin-regression.md)  
**Related:** [../audits/2026-06-20_vite-api-base-url-missing.md](../audits/2026-06-20_vite-api-base-url-missing.md)

## Hard rule

**All consumer API requests MUST resolve to the Railway backend at build time — never to `menuply.com` and never to same-origin relative paths like `/menus/browse` or `/search`.**

`menuply.com` is a **static SPA host**. `vercel.json` catch-all rewrites API-looking paths to `index.html`. Same-origin fetches return HTML, not JSON.

## Single source of truth (target state)

| Module | Role |
|--------|------|
| `menubloc-frontend/src/lib/api.js` | `API_BASE` + `apiGet` / `apiPost` / endpoint helpers |
| `menubloc-frontend/src/lib/ownerApi.js` | Owner console (same Railway fallback pattern) |

Authoritative production fallback (already in `api.js`):

```js
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");
```

## Prohibited patterns

### 1. Empty-string production fallback (CRITICAL — causes menuply.com HTML responses)

```js
// FORBIDDEN
const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");
```

**Known violators (as of 2026-07-05):** `CatalogMenuRenderer.jsx`, `CatalogDrinksMenuRenderer.jsx`, `PublicMenuPage.jsx`, `TasteIndexBadge.jsx`, `menuVerificationApi.js`, `RestaurantQrUpsell.jsx`, `SubscriptionSelect.jsx`

### 2. Inline API base in pages (HIGH — bypasses Railway fallback)

```js
// FORBIDDEN in new code; migrate existing
const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
fetch(`${API}/menus/browse?...`);
```

Missing `VITE_API_BASE_URL` at build → `localhost:3001` baked in → mixed content / `Failed to fetch`.

### 3. Direct `fetch` to discovery/search/browse endpoints outside `api.js` (MEDIUM)

Prefer `getBrowseMenus`, `apiGet('/search?...')`, or new thin wrappers in `api.js`.

**Known bypass (as of 2026-07-05):** `GrubbidDiscovery.jsx`, `GrubbidSearchResults.jsx`

### 4. Bare relative API paths (CRITICAL)

```js
// FORBIDDEN
fetch("/menus/browse?...");
fetch("/public/search?...");
fetch("/search?...");
```

## Vercel production contract

| Requirement | Value |
|-------------|--------|
| `VITE_API_BASE_URL` (Production) | `https://menubloc-backend-production.up.railway.app` |
| Post-deploy alias | `npx vercel alias set <deployment-url> menuply.com` |
| Bundle verification | Railway refs >> localhost; **zero** `menuply.com/menus/browse` |

`vercel.json` intentionally does **not** proxy `/menus/browse` or `/public/search` to Railway. Do not rely on same-origin API paths.

## Endpoint naming

| Consumer | Correct path | Notes |
|----------|--------------|-------|
| Search page (`GrubbidSearchResults`) | `/search` | Not `/public/search` |
| `api.js` helper `searchPublicMenu` | `/public/search` | Exported but unused by pages today |
| Yellow Browser list | `/menus/browse` via `getBrowseMenus` | Safe when using `api.js` |
| GrubbidDiscovery feed | `/menus/browse` | Direct fetch — requires env or migration |

Backend mounts both `/search` and `/public/search` to the same router.

## Automated enforcement

| Check | Location | What it catches |
|-------|----------|-----------------|
| `api-base-url-guardrail.test.js` | `menubloc-frontend/tests/` | Empty-string prod fallback in `src/` |
| PHMS P1-SRV-02 | `serverChecks.js` | `localhost:3001` dominates bundle |
| **Recommended P1-SRV-03** | PHMS (not yet implemented) | `menuply.com/menus/browse` or `menuply.com/public/search` in bundle |

Run before frontend release:

```bash
cd menubloc-frontend && npm test
```

## Before editing API wiring or adding new `fetch` calls

Output:

> **Per Frontend API Base URL guardrail: the proposed change will modify [names] and may introduce same-origin API paths or bypass `api.js` Railway fallback. Explicit approval required if adding inline `API` constants or direct fetch to `/menus/browse`, `/search`, or `/public/search`.**

## Release certification

Every frontend production deploy:

- [ ] `VITE_API_BASE_URL` set in Vercel Production
- [ ] `vercel --prod` + `vercel alias set … menuply.com`
- [ ] Bundle scan: Railway >> localhost; no `menuply.com/.../browse`
- [ ] `npm test` passes (`api-base-url-guardrail.test.js`)
- [ ] DevTools: Search and Yellow Browser XHR host is `menubloc-backend-production.up.railway.app`
