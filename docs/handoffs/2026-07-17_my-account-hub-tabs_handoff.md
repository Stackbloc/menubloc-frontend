# Objective

Restructure My Account into Profile Editor / Menu / Settings / Password, with Menu → Edit menu content opening the Menu Worksheet.

# Current Status

**LOCAL COMPLETE** — not CPD’d.

# Files Changed

- `menubloc-frontend/src/pages/operator/OperatorMyAccount.jsx` — tabbed hub + menu subpanels + settings fields
- `menubloc-frontend/src/pages/operator/OperatorMenuWorksheetPage.jsx` — back link to My Account · Menu
- `menubloc-frontend/test/operatorMyAccountHubContract.test.js`

# Database Changes

None.

# Decisions Made

- URL state: `?tab=profile|menu|settings|password` and `?menuPanel=view|edit`
- Menu content editor = Menu Worksheet (yesterday’s tool), not Menu Lab design panel
- Settings shows account type, opened date, next billing, change account type, cancel
- Removed non-functional Menu Lab quiet link from My Account header
- QR stays under Settings as secondary utility

# Remaining Work

- CPD when approved
- Human verify tabs + worksheet open/return

# Risks / Known Issues

- Worksheet still requires migration `0187` tables (present on connected DB; confirm production)
- Empty menus: View/Edit show guidance to upload first

# Verification Status

- `node --test test/operatorMyAccountHubContract.test.js` → pass
- `node --test test/operatorPublicProfileContract.test.js` → pass
- `node --test test/restaurantStatusBannersContract.test.js` → pass

# Resume Instructions

1. Open `/operator/my-account`
2. Tabs: Profile, Menu (View / Edit content → worksheet), Settings, Password
3. CPD when ready

# Git Status

Uncommitted FE changes.
