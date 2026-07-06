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
