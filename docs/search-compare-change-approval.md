# Search/Compare Change Approval

## Date: 2026-06-10

## Change: Fix cardVerdict ReferenceError crash in SearchResultCard

### What changed
- Added `resolveCardVerdict` to the import from `../lib/cardVerdict.js`
- Added `const cardVerdict = resolveCardVerdict(row);` declaration in `ItemRow`

### Why
`cardVerdict` was referenced on line 1457 (`<CardVerdictBox label={cardVerdict} />`) but was
never declared. This caused a `ReferenceError: cardVerdict is not defined` on every
SearchResultCard render, crashing the entire search page to a black screen for all queries.

### Impact on Similar/Compare
None. This change only adds a missing variable declaration. It does not modify:
- `handleCompare`
- `DetailPanel`
- `onSwap`/`onViewBase` wiring
- `fetchSimilarItems` or `fetchCompareItems`
- `isSimilarRowCompareEligible`
- Any eligibility logic or UI layout for Similar/Compare

### Approval
This is a crash fix. The change is the smallest safe fix for a production outage.

---

## Change: Visual restoration — color token replacement

## Files modified
- `src/components/SearchResultCard.jsx`
- `src/pages/MenuItemDetailPage.jsx`

## What changed
Hardcoded dark-theme hex values replaced with canonical `--gb-color-*` CSS tokens
from the approved light/warm design system. No logic, behavior, layout, or function
signatures were modified.

## What was preserved
- `handleCompare` → `setSimilar` blocks (recovery/june-11 behavior restored)
- `isSimilarRowCompareEligible` gate
- `skipEligibilityCheck: true`
- `CardVerdictBox` dead code (untouched)
- All `getItemId` / `mid` / Similar/Compare flow unchanged

## Excluded from this change
- FoodInterestButton import/render
- markCompareIneligible → setCompareData behavioral swap
- deduplicateFranchiseItems

## Approval basis
Explicit user instruction: "restore only the previously approved visual treatment."
Recovery/june-11 functional behavior preserved throughout.

---

## Date: 2026-07-06

## Change: Align Compare buttons in Show Similar rows

### Files modified
- `src/components/SearchResultCard.jsx` (`DetailPanel` similar item rows)

### What changed
Similar rows use a 3-column CSS grid (`minmax(0,1fr) auto 4.25rem`) so Compare buttons align vertically regardless of whether a price is present. Price occupies a fixed-width right column; rows without price reserve the column with a transparent placeholder.

### Impact on Similar/Compare
Layout-only in similar list rows. `handleCompare`, eligibility gate, and Compare modal behavior unchanged.

### Approval basis
Explicit user instruction: keep UI clean so Compare buttons are all aligned.

---

## Date: 2026-07-06 (b)

## Change: Truncate similar item and restaurant names

### Files modified
- `src/components/SearchResultCard.jsx` (`DetailPanel` similar list)

### What changed
Similar rows abbreviate long item names (28 chars) and restaurant headers (36 chars) with ellipsis fallback via CSS. Full names remain in `title` tooltips. Fixed Compare column width preserves alignment on narrow viewports.

### Impact on Similar/Compare
Display-only in similar list. Compare handler and eligibility unchanged.

### Approval basis
Explicit user instruction: UI must always stay clean, even if similar item names are abbreviated.

---

## Date: 2026-09-15

## Change: Search-result video strip from payload `videos[]`

### Files modified
- `src/components/SearchResultCard.jsx` (restaurant card + dish `ItemRow` mount)
- `src/components/search/SearchResultVideoCard.jsx` (new)

### What changed
Mount `SearchResultVideoStrip` when the backend already attached `row.videos` / `item.videos`. Overlay player in-place. Does not fetch restaurant-wide profile videos.

### Impact on Similar/Compare
None. `handleCompare`, `DetailPanel`, eligibility, and Compare modal wiring are unchanged. The strip is additive presentation below existing card content.

### Approval basis
Andre current-turn: deploy held 2026-09-13 search-video work.

## Change: Deal icon + deal price on search dish cards (2026-11-04)

### Files modified
- `src/components/SearchResultCard.jsx` (dish price slot)

### What changed
When a dish has a live deal (`active_deal`, sent by backend search), the price slot shows the deal
icon and the deal price, with the card's regular price struck through under it. No deal: unchanged.

### Impact on Similar/Compare
None. `handleCompare`, `DetailPanel`, eligibility and Compare modal wiring are unchanged.

### Approval basis
Andre 2026-11-04: "Yes, I approve the search changes to show the deal icon and deal price."

## Change: Remove Similar Items + Compare from the web (2026-11-04)

### Files modified
- `src/components/SearchResultCard.jsx` — "Similar Items" chip, its panel and the Compare modal removed; dead compare state removed.
- `src/pages/MenuItemDetailPage.jsx`, `src/pages/MenuItemInfoPage.jsx` — "Explore Similar Dishes" section (with Compare) removed.

### What changed
Search cards keep the Nutrition chip only. Dish pages no longer show similar dishes or Compare.

### Impact on Similar/Compare
Removed from the website on purpose. Backend `/menu-items/:id/similar` and compare endpoints are unchanged and still served.

### Approval basis
Andre 2026-11-04: "remove from web but keep on backend." (The new design / app has no Similar or Compare.)
