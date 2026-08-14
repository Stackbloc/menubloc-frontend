# Summary

Menu/dish/restaurant/cluster consumer share URLs are locked to absolute `https://menuply.com/...`. Copy Link remains primary; `share.google` and non-Menuply hosts are rejected before clipboard or device share.

# Problem Statement

Sharing a menu intermittently produced Google-wrapped `share.google` links instead of Menuply URLs.

# Root Cause

`shareUtils.getPublicOrigin()` could resolve from `window.location.origin` / env hosts. OS/`navigator.share` sheets (esp. Android Chrome) wrap non-canonical payloads as `share.google`.

# Evidence Collected

- Prior restores: 2026-08-03 Copy Link modal CPD (`f2a6884` / `docs/deployments/2026-08-03_share-copy-link-modal-cpd.md`); 2026-08-12 invite ShareModal restore (`6c6b5b8`)
- Phase 1B.2 (2026-06-22) canonical share paths
- `npm run test:share-contract` — 8 pass (2026-08-14)

# Files Examined

- `menubloc-frontend-main/src/components/share/shareUtils.js`
- `ShareButton.jsx`, `ShareModal.jsx`
- `src/lib/canonicalUrlCore.js` (`CANONICAL_ORIGIN`)
- `FoodTruckPage.jsx` (removed `window.location.href` share)

# Database Queries Executed

None.

# Changes Made

- Share builders use `CANONICAL_ORIGIN` / `absoluteCanonicalUrl` + `normalizeConsumerShareUrl`
- ShareModal Copy Link / preview / native share use normalized menuply.com URL
- FoodTruckPage share uses canonical profile URL (not `window.location.href`)
- Contracts: `test/shareCanonicalUrlContract.test.js` + `test/shareCopyLinkModalContract.test.js`
- npm script: `test:share-contract`
- Guardrail: `docs/guardrails/2026-08-14_consumer-share-menuply-url-contract.md`

# Commits

- FE `b4d3738` — Lock menu share to menuply.com and show food-truck pickup on menus

# Deployment Status

Shipped on FE `main` @ `b4d3738` (subsequent tips may supersede). Verify live tip with Share → Copy Link → paste `https://menuply.com/...`.

# Verification Results

```
npm run test:share-contract
# 8 pass
```

# Remaining Risks

- User-chosen “Share via device…” may still be wrapped by the OS; Copy Link is the supported path and always copies menuply.com.

# Follow-Up Work

- Human hard-refresh menu → Share → confirm URL preview is menuply.com

# Final Verdict

**IMPLEMENTED** — share origin locked; contracts + audit + guardrail in place. See also `2026-08-14_menu-share-google-url-and-food-truck-menu-address.md` for the related food-truck menu address work in the same commit.
