# Authoritative Home Page Design (HomeNext)

**Status:** AUTHORITATIVE — product-owner approved  
**Established:** 2026-06-28  
**Priority:** P0 protected surface (see Home Page Protection Protocol)  
**Git label:** tag `authoritative-home-page-design-2026-06-28` on the commit that records this designation

---

## Authority statement

The **Menuply production home page** is **`HomeNext`**, rendered at **`/`** by default through `HomeRoot`.

This design is **intentionally approved** and is the **single authoritative home page** for Menuply. It is in a **stabilization period**. Agents must not modify, redesign, refactor, restyle, or “improve” it unless the product owner explicitly requests home page work.

Legacy discovery home remains available only as an **explicit rollback path**, not as the default product surface.

---

## Production routing

| URL | Component | When |
|-----|-----------|------|
| `/` | `HomeNext` via `HomeRoot` | **Default (authoritative)** |
| `/` | `LegacyDiscoveryHome` | Rollback: `VITE_USE_LEGACY_HOME=1` or `VITE_ENABLE_NEW_HOMEPAGE=0` |
| `/home-legacy` | `LegacyDiscoveryHome` | Manual legacy preview |
| `/home-next` | `HomeNext` | Direct route (same authoritative design as `/`) |

**CRM host** and **EasyMenu** routes in `App.jsx` may override `/` for those deployments only — consumer Menuply home authority is `HomeNext`.

---

## Authoritative file manifest

Changes to these files require **explicit product-owner approval** for home page work:

| Path | Role |
|------|------|
| `src/pages/HomeNext.jsx` | Authoritative home page shell |
| `src/pages/HomeRoot.jsx` | Live `/` selector |
| `src/components/homeNext/*` | Home page UI sections |
| `src/lib/homeNextEntryPoints.js` | Food chip config + styling |
| `src/lib/homeNextMealChip.js` | Time-aware meal chip |
| `src/lib/homeNextSections.js` | Menu section curation |
| `src/lib/homeNextNavigation.js` | Home search/chip URL builders |
| `src/hooks/useHomeBrowseFeed.js` | Location + browse feed for home |
| `test/homeNextSections.test.cjs` | Section behavior tests |
| `test/homeNextMealChip.test.cjs` | Meal chip tests |
| `test/homeRoutingFlags.test.cjs` | Legacy rollback flag tests |

**Not authoritative home (do not conflate):** `GrubbidDiscovery.jsx`, `LegacyDiscoveryHome.jsx` — legacy/rollback only.

---

## Approved design elements (frozen unless explicitly changed)

- Sticky header with logo reset (preserves location preference)
- Search bar with camera affordance
- “I have an idea” food chips (two independently scrollable rows)
- Time-aware meal chip (first position, distinct styling)
- Health Goals expandable section
- Location selector (green pill, recent locations)
- Curated menu sections (Popular, Nearby, Discover, More) with 2×2 menu card grid
- Popular vs compact menu pane heights by section
- Expanded category view (same cards, max 8, Back control)
- Bottom navigation (Waiter footer link unchanged by home work)

---

## Rollback (emergency only)

```bash
# Vercel production env — either flag restores legacy home at /
VITE_USE_LEGACY_HOME=1
# or
VITE_ENABLE_NEW_HOMEPAGE=0
```

Redeploy + verify `menuply.com` alias. Rollback does **not** revoke this document — it temporarily swaps the live component.

---

## Related guardrails

- **Home Page Protection Protocol (HPP):** `docs/guardrails/2026-06-28_home-page-protection-protocol-guardrail.md`
- **Handoff (implementation history):** workspace `docs/handoffs/2026-06-28_home-page-redesign_handoff.md`

---

## Release certification (required on every frontend PR)

Every frontend change must declare home page impact:

- ☐ **No home page impact** — I certify this work made **no** changes to the authoritative home page.
- ☐ **Home page modified with explicit product-owner approval** — list every change.

If a task does not mention the home page, assume: **the home page is off limits.**
