# Search/Compare UI Change Approval

## Change type
Visual restoration — color token replacement only.

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
