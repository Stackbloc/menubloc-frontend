# Summary

Aligned the bottom-nav X with the other icons, changed its hover/aria to `Post`, and replaced footer **Owner tools** with the July **Creators** link (`/creative-pros`).

# Problem Statement

The X sat off the icon row because it had no label slot (other tabs have icon + text). Hover was `post.` (with a period). Footer For Businesses showed Owner tools instead of the July Creators entry.

# Root Cause

Post was an icon-only `<button>` without the shared 28×28 icon wrap and label-height spacer. Owner tools was a duplicate onboarding link added during later footer regrouping.

# Evidence Collected

- July 9 canonical footer: Creators → `/creative-pros` (`docs/audits/2026-07-09_public-footer-navigation-canonical.md`, `d333af2`).
- `CreativeProsPage` still routed at `/creative-pros` in `App.jsx`.
- `discovery.footer.creators` still in `labels.js`.

# Files Examined

- `src/components/BottomNav.jsx`
- `src/components/MenuplyXMark.jsx`
- `src/components/SiteFooter.jsx`
- `test/siteFooterNavigationContract.test.js`
- `test/dinerPrimaryNavContract.test.js`

# Database Queries Executed

None.

# Changes Made

- BottomNav: shared 28×28 icon wrap; hidden `Post` spacer for label-row height; `title`/`aria-label` `Post`; nav `alignItems: flex-start`.
- SiteFooter: Owner tools → Creators `/creative-pros`. Whole footer still mounted.

# Commits

Not committed unless Andre asks.

# Deployment Status

Not deployed. Prior nav CPD alias may already be live; this polish is local until the next `cpd`.

# Verification Results

- `dinerPrimaryNavContract` + `siteFooterNavigationContract` — 6 pass

# Remaining Risks

- Hidden spacer keeps X unlabeled; hover is desktop `title="Post"`.
- Six-tab bar still tight on small phones.

# Follow-Up Work

CPD when Andre asks.

# Final Verdict

Local UI polish complete.
