# Upload Detail — One-Click Inline Restaurant Profile Create (CPD)

Date: 2026-07-21
Branch: `feature/mds-homepage-controls`
Commit: `80abe6d` — feat(menu-manager): one-click restaurant profile create on Upload Detail
Deployment: `menubloc-frontend-6vetdhc8r-menuply.vercel.app` (dpl_E7xhsmHhu7WmMPq8VTuAiR2tuNRc)
Alias: `menuply.com` → set via `npx vercel alias set menubloc-frontend-6vetdhc8r-menuply.vercel.app menuply.com`

## Purpose

On `/owner/menu-manager/uploads/:id` (Upload Detail), the green
"Create restaurant profile →" button previously only navigated to the
Create / Edit workspace with `?create=1&name&city&state` prefill — no
restaurant ID was created until the workspace form was submitted.

It is now an inline create panel that creates the restaurant (ID + draft
"Main Menu") directly from Upload Detail.

## Behavior

1. Button opens an inline panel prefilled with name/city/state from the capture.
2. Operator supplies the three backend-required fields: address, ZIP, cuisine
   (cuisine options from `GET /api/owner/menu-console/profile-schema`).
3. Submit calls `POST /api/owner/menu-console/restaurants` (existing route,
   unchanged) — creates `public.restaurants` row + draft primary menu.
4. 409 `duplicate_warning` → lists matches with a "Create anyway" confirm
   (same contract as the workspace).
5. Success panel shows the new Restaurant ID and an
   "Open in Create / Edit →" link (`?tab=workspace&restaurant=<id>`).

## Guardrails

- **Single Restaurant Resolution**: create-only. The finished capture session
  is never mutated; no `restaurant_id` is written back to the session. The
  yellow "no locked public restaurant id" banner remains. Operator attaches a
  NEW upload to the new restaurant.
- No backend changes. No Waiter / operator-login / protected menu-experience
  files touched.

## Files Changed

- `menubloc-frontend/src/pages/owner/OwnerMenuUploadDetail.jsx`
  - Added `CreateRestaurantProfileInline` component.
  - Replaced the prefill `<Link>` (create=1 query params) with the component.
  - Imports `createMenuConsoleRestaurant`, `getMenuConsoleProfileSchema`
    from `ownerApi.js`.

## Verification

- `npm run build` — exit 0, bundle `index-vgGt4jz7.js`.
- Alias hash check: `curl -s https://menuply.com/` → `src="/assets/index-vgGt4jz7.js"` (matches build).
- Bundle API base check: 60 × `menubloc-backend-production`, 6 × `localhost:3001` (≤ 6 allowed).
- Human production verification: pending (user to confirm on an unlocked
  upload, e.g. El Huero capture `bc191704-34f4-4400-b600-1cee1d27a405`).

## Next-Agent Instructions

- The old `?tab=workspace&create=1&name&city&state` prefill path in
  `OwnerMenuCreateWorkspace.jsx` still exists and still works; only the Upload
  Detail entry point stopped using it.
- If a future task wants create-and-attach (writing the new ID onto the
  finished session), that requires explicit approval under the Single
  Restaurant Resolution guardrail — do not add it silently.
