# Objective

Expand owner diner backend reports: daily/interval diner sign-ins and capability stats (posts by category, events, invites, QR connects, videos, avg connects), plus clickable diner email/list opening a read-only My Menuply dialog.

# Current Status

Implemented locally in authorized trees. **Not committed. Not deployed.**

# Files Changed

Backend (`menubloc-backend-main`):

- `src/services/ownerDinerCapabilityStatsService.js` (new)
- `src/services/ownerDinerDetailService.js` (new)
- `src/routes/ownerDashboard.js` — `GET /diners/stats`, `GET /diners/:id`
- `test/ownerDinerCapabilityStatsService.test.js` (new)

Frontend (`menubloc-frontend-main`):

- `src/pages/owner/OwnerDiners.jsx` — metrics + interval + row click
- `src/pages/owner/OwnerDinerHubDialog.jsx` (new)
- `src/lib/ownerApi.js` — stats + detail helpers
- `src/pages/owner/intelligence/intelligenceShared.jsx` — `onRowClick`
- `test/ownerDinerAccountsContract.test.js`

Docs (workspace root):

- `docs/audits/2026-08-24_owner-diner-capability-reports.md`
- `docs/handoffs/2026-08-24_owner-diner-capability-reports_handoff.md`

# Database Changes

None. Read-only queries.

# Decisions Made

- Surface = existing `/owner/diners` (not new intelligence page)
- Dialog = owner API projection; **no** login-as-diner / impersonation
- Intervals = Growth-compatible windows plus year: Today, Yesterday, Week (`7d`), Month (`30d`), Year (`365d`)
- Registered diners only; guest_key rows excluded
- Staff exclude ids `2,3,4,29` frozen
- QR: report connects + personal codes created; **do not invent scan counts**

# Remaining Work

- Commit when Andre asks
- CPD when Andre says `cpd` (FE `menubloc-frontend-main` + BE `menubloc-backend-main`)
- After deploy: verify https://menuply.com/owner/diners

# Risks / Known Issues

- No personal diner QR scan telemetry yet
- Market/name still sparse on some roster rows

# Verification Status

- BE capability + accounts tests: pass
- FE owner diner contract: pass

# Resume Instructions

1. Confirm files above still exist
2. Re-run BE/FE tests if trees are dirty
3. Do not deploy unless Andre says `cpd`

# Git Status

Uncommitted local work on `menubloc-frontend-main` and `menubloc-backend-main`.
