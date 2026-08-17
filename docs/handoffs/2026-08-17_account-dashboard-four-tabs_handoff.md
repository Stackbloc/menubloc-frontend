# Objective

Refactor consumer `/account` into a four-tab Menuply account dashboard (Profile, Social & Crew, Wallet & Activity, Security & Account) without replacing working systems.

# Current Status

**LOCAL COMPLETE — not committed, not deployed.**

Implementation lives in `menubloc-frontend-main`. `/account` still mounts `ConsumerProfile`, which now orchestrates tabs.

# Files Changed

- `menubloc-frontend-main/src/pages/consumer/ConsumerProfile.jsx` — tab orchestrator, immediate preference saves
- `menubloc-frontend-main/src/pages/consumer/accountDashboard/*` — tabs, chips, styles, options
- `menubloc-frontend-main/src/pages/consumer/DinerQrPage.jsx` — `?share=1` opens existing ShareModal
- Contract tests updated to read tab files; added `test/accountDashboardContract.test.js` (including dead-button/route mapping)
- `docs/audits/2026-08-17_account-dashboard-four-tabs.md`

# Database Changes

None.

# Decisions Made

- Reorganize, don’t rebuild: same consumer APIs (`updatePreferences`, Dining Crew, Mx Coins, `changePassword`, etc.)
- Progressive disclosure: summary + Edit; chips save on tap; password form hidden until Change Password
- Dining Crew is the primary Social concept; restaurant Following is a quiet existing link; no followers/friends systems
- Mx Coins shown only as existing wallet fields; empty state when unused
- No account deletion UI (not supported)
- Home zip shown/edited via existing `PUT /api/consumer/profile` `home_zip` (welcome flow already saves zip)
- Cuisine chips not added (welcome collects them but does not persist)
- Tab state via `?tab=` (`profile` default / omit)
- Light diner styling (match Dining Crew / Diner QR pages), not the old dark card stack

# Remaining Work

- Commit when requested
- Human verify all four tabs
- CPD / Vercel alias only if Andre asks to ship

# Risks / Known Issues

- Chip save races on rapid taps
- Sticky tabs should be checked on narrow phones
- Social tab unmounts when leaving (refetch next time)

# Verification Status

Contract tests listed in the audit: **PASS**. Share-contract: **PASS**. Menu-experience: **not run** (protected menu files unchanged). Production account APIs: **exist (401 without session)**. Logged-in browser: **not run**.

# Resume Instructions

1. Open `menubloc-frontend-main`, log in as a diner, visit `/account`
2. Confirm four tabs, chip immediate save, Dining Crew empty/invite, collapsed password
3. If shipping: commit from this tree, then FE deploy path `menubloc-frontend-main` @ clean `main` (or named exception)

# Git Status

Uncommitted local changes in `menubloc-frontend-main` (and docs in workspace root). Production FE/BE not touched.
