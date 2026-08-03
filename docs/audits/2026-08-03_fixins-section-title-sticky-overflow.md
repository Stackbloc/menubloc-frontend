# Summary

Fixins Soul Kitchen’s first section label (`LIL' BITS`) was present in the live API and in the DOM, but invisible on menuply.com because the Menu Appearance surface wrapper used `overflow: "hidden"` around Classic’s `position: sticky` restaurant header. That combination overlaps ~32px of following content and paints the first section title under the sticky hairline.

# Problem Statement

On the live Fixins menu (`modern_minimal` appearance, `menu_style` v1), Artichoke Dip and the rest of LIL' BITS appeared directly under the ordering-unavailable chip with no section header. Backend seeding of printed section names was correct.

# Root Cause

`PublicMenuPage` / `CatalogMenuRenderer` wrapped `PublicMenuMainContent` in:

```js
borderRadius: 12,
overflow: "hidden",
```

when Menu Appearance applies. Classic/Fine templates keep a sticky header (`zIndex: 50`) for name/address/status. Inside an `overflow: hidden` ancestor, sticky layout overlaps the next sibling so the first uppercase section title sits under the sticky bottom edge.

Verified with Playwright on production (title in DOM at y≈261 while sticky bottom ≈294) and with an isolated HTML A/B: overflow hidden + sticky → covered; overflow visible or non-sticky → visible.

# Evidence Collected

- Production API `/public/restaurants/984/menu`: `sections[0].title === "LIL' BITS"`, 5 items starting with Artichoke Dip.
- Live bundle `index-CGduqkJT.js` always renders section titles.
- Playwright: `HAS_LIL true`; leaf node color `rgb(20, 83, 45)`; geometrically covered by sticky.
- User screenshot pixel gap between amber chip and Artichoke Dip had no green title pixels (title under opaque sticky).

# Files Examined

- `menubloc-frontend-main/src/pages/PublicMenuPage.jsx`
- `menubloc-frontend-main/src/components/menuCatalog/CatalogMenuRenderer.jsx`
- `menubloc-frontend-main/src/components/menu-templates/ClassicMenuTemplate.jsx`
- `menubloc-frontend-main/src/lib/menuAppearances.js`
- Production menu JSON for restaurant 984

# Database Queries Executed

None (frontend layout bug).

# Changes Made

- Removed `overflow: "hidden"` from Menu Appearance surface wrappers on public menu + catalog renderer (keep border radius / surface tokens).
- Added `test/publicMenuSectionTitleVisibilityContract.test.js`.

# Commits

- FE `6137b04` — `fix(menu): stop Menu Appearance overflow from hiding section titles`

# Deployment Status

**CPD COMPLETE** — `menubloc-frontend-lqaskgcbb-menuply.vercel.app` / `index-DhdKors_.js` aliased to menuply.com + www; tip-gate PASS.

# Verification Results

- Contract tests: pass
- Playwright Fixins after CPD: sticky.bottom 233, LIL' BITS top 261, gap +28, covered false
- Tip-gate: RESULT=PASS

# Remaining Risks

- Appearance card children may paint slightly outside rounded corners without overflow clipping; acceptable trade for sticky correctness.
- Scrolling can still tuck later section titles under the sticky name bar (normal sticky behavior); first title at rest remains visible.

# Follow-Up Work

Optional: shorten sticky header or stick only the name row so mid-menu section titles stay visible longer while scrolling.

# Final Verdict

Data/seed was fine. Missing `LIL' BITS` was a Menu Appearance overflow × sticky-header layout bug. Fixed and verified on production.
