# Summary

Locked consumer share URLs to absolute `https://menuply.com/...` (reject `share.google`) with Copy Link contracts + Cursor guardrail. Public menu headers for food trucks now prefer live `current_pickup_location` address lines with no “Current Location” label.

# Problem Statement

1. Sharing a menu intermittently produced `share.google` links instead of Menuply URLs (recurring; prior fixes 2026-08-03 / 2026-08-12).
2. Food truck public menus showed home-base address only, not the live pickup location.

# Root Cause

1. `shareUtils.getPublicOrigin()` could use `window.location.origin` / env host; OS native share wraps non-canonical payloads as `share.google`.
2. `PublicMenuPage` / `CatalogMenuRenderer` built address from `address_line1` only and ignored `current_pickup_location` on the menu API payload.

# Evidence Collected

- Prior CPD: `docs/deployments/2026-08-03_share-copy-link-modal-cpd.md`, invite ShareModal restore 2026-08-12
- BE menu payload already includes `current_pickup_location` from delivery availability
- `npm run test:share-contract` — 8 pass
- `node --test test/publicMenuFoodTruckAddress.test.js` — 3 pass

# Files Examined

- `shareUtils.js`, `ShareButton.jsx`, `ShareModal.jsx`, `canonicalUrlCore.js`
- `PublicMenuPage.jsx`, `CatalogMenuRenderer.jsx`, `displayAddress.js`
- `FoodTruckPage.jsx` share path

# Database Queries Executed

None.

# Changes Made

- Share builders → `CANONICAL_ORIGIN` / `absoluteCanonicalUrl` + `normalizeConsumerShareUrl`
- ShareModal Copy Link / device share / preview use normalized URL
- FoodTruckPage: stop `window.location.href` share; copy normalized canonical profile URL
- `resolvePublicMenuAddressDisplay` for food-truck menu address
- `test:share-contract`, share + menu address contracts
- Guardrail: `docs/guardrails/2026-08-14_consumer-share-menuply-url-contract.md` + `.cursor/rules/consumer-share-menuply-url-guardrail.mdc`

# Commits

Not committed (unless Andre requests).

# Deployment Status

Not deployed. FE-only; CPD only from `menubloc-frontend-main` @ clean `main` when requested.

# Verification Results

- `npm run test:share-contract` PASS
- `test/publicMenuFoodTruckAddress.test.js` PASS

# Remaining Risks

- Device share can still Google-wrap if the user chooses “Share via device…”; Copy Link remains the supported path and always copies menuply.com.
- Menu address only updates when API returns `current_pickup_location` (operator must have set pickup).

# Follow-Up Work

- Human: Share → Copy Link on a public menu; confirm paste is `https://menuply.com/.../menu`
- Human: food truck menu with live pickup shows that street (no “Current Location:” label)
- Optional CPD when Andre asks

# Final Verdict

**CODE COMPLETE — not committed / not deployed.** Share origin locked + food truck menu shows current pickup address without the profile label.
