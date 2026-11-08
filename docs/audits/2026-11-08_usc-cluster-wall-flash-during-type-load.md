# Summary
USC cluster page, Food by type: tapping a food type briefly showed the Wall (phone strip) while that type's dishes loaded. The strip is now held back until the type's first results are on screen.

# Problem Statement
On a type tap the box grid is replaced by a short loading placeholder ("Loading <type>…" or skeleton rows). The phone Wall strip (`ClusterWallBand`) renders right below Food by type, so it rose into the viewport until results arrived — users saw the Wall without scrolling to it.

# Root Cause
`ClusterWallBand` is in `postContent` of `ClusterMenuExplorerTab` and rendered regardless of the open type's loading state.

# Evidence Collected
Headless Chromium at 390×844 with mocked API (results delayed 2.5 s), sampled every 250 ms after tapping a type:
- Before (06bc518): `loading=1 band=1` for the whole load.
- After: `loading=1 band=0` during load; band returns in the same sample the dishes appear. Checked for both the legacy category list and the chips `FoodByTypeDishList` path.

# Files Examined
`src/pages/ClusterPage.jsx`, `src/components/cluster/ClusterFoodByTypeParts.jsx`, `src/components/clusterWall/ClusterWall.jsx`, `src/hooks/useClusterWall.js`, `src/hooks/useFoodTypeChips.js`, `src/lib/clusterApi.js`.

# Database Queries Executed
None (frontend-only).

# Changes Made
- `ClusterPage.jsx`: `ClusterTypeResultsPendingContext` + `ClusterWallBandAfterTypeResults` (renders `ClusterWallBand` only when no type's first page is pending); `typeResultsPending` computed in `ClusterMenuExplorerTab` and provided around `postContent`.
- `ClusterFoodByTypeParts.jsx`: optional `onPendingChange` prop on `FoodByTypeDishList` (true while the first page is loading with no items; false on unmount).
Unchanged: Wall data/fetch timing, desktop side column, landing boxes, search, restaurants section, chip refreshes (results already showing stay showing, band stays).

# Commits
See branch `ccr-0df8a75d-dh31lv` (menubloc-frontend).

# Deployment Status
Not deployed. Feature branch only; needs merge to `main` for Vercel production.

# Verification Results
`vite build` PASS. `clusterFoodByTypeContract` 17/17, `clusterViewToggleContract` 6/6, `tests/clusterWall*` 6/6 PASS. `npm test`: 9 failures, identical before and after this change (pre-existing). Browser check with mocked API as above. Live production check not possible from the agent sandbox (menuply.com / Railway blocked).

# Remaining Risks
Low. If a type load errors, the band returns (status leaves "loading"). The band unmount/remount does not refetch Wall data (state lives in the provider).

# Follow-Up Work
Andre to verify on menuply.com USC page after merge/deploy.

# Final Verdict
Fixed on branch; pending merge + production verification.
