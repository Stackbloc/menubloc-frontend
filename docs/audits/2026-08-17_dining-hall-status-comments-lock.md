# Dining-hall status + comments lock (2026-08-17)

## Summary

Andre clarified that dining-hall menus are irrelevant. Menuply does not analyze menus or menu items for dining halls. Status reports and comments are the product. Menu data is not required for those reports.

## Problem Statement

A later dining-hall/venue profile brief asked for a prominent “Today’s Menu.” That would have contradicted the 2026-08-15 experience-only (no menus) guardrail.

## Root Cause

The 2026-08-17 profile brief treated halls like restaurants with a daily menu surface. Product intent is live conditions, not SKU/menu analysis.

## Evidence Collected

- Production already hides View Menu on dining halls (`PublicProfileShell` `menuHref={isDiningHall ? null : menuHref}`).
- Diner-status feed already supports hall/venue operational reports; guest open reporting already allows contribution without an account.
- No dining-hall CK/OCR/menu-item identity work was started after the “stop” on the profile brief.

## Files Examined

- `docs/guardrails/2026-08-15_dining-hall-experience-only-no-menus.md`
- `PublicProfileShell.jsx` / dining-hall entity contract (prior; not edited this CPD)
- Guest open reporting contract (unchanged)

## Database Queries Executed

None.

## Changes Made

- Clarified the 2026-08-15 guardrail: status + comments in; menus/items out.
- Added always-on cursor rule `.cursor/rules/dining-hall-experience-only-no-menus-guardrail.mdc`.
- Indexed the guardrail. No Waiter, home, or profile runtime edits.

## Commits

- FE `a1ccafe` — docs: lock dining halls to status reports and comments, not menus.
- BE `1e546d61` — same.

## Deployment Status

**CPD COMPLETE.** FE tip `menubloc-frontend-9ijik4t7p-menuply.vercel.app` / `index-HPBXNwnC.js` (`a1ccafe`). BE health MATCH `1e546d61`.

## Verification Results

- Tip-gate PASS apex + www (`index-HPBXNwnC.js`)
- Railway `/health` `commit_hash` `1e546d6171b8400bd8a4a05657c9b51ffa6ea6a0`
- Path-gate PASS on `menubloc-backend-main` @ `main`

## Remaining Risks

Same JS as guest open reporting; restoring `37tsmprgc` does not change the live bundle, only the Vercel deployment id.

## Follow-Up Work

Dining-hall profile hierarchy (Today/Now, drop claim-admin copy) is **not** in this CPD. Implement only if Andre names it without asking for menus.

## Final Verdict

Dining halls stay status reports + comments. Menu analysis is out of scope.
