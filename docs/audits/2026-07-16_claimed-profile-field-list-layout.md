# Claimed Profile Field-List Layout (Claim-Screen SEO Body)

**Date:** 2026-07-16  
**Scope:** Frontend UI only — `RestaurantPublicPage.jsx`

---

# Summary

Claimed public restaurant profiles now render the same labeled `FieldRow` body as the unclaimed claim screen (Restaurant Name, Address, City/Region/Postal, Website, Cuisine, Category, Story/About, Featured Dish, Landmarks, Brand Presentation), without the Claim This Profile CTA. Status banners (Now Hiring, scheduled Happy Hour / Live Music) remain. Canonical `/restaurants/:state/:city/:slug` routing is unchanged so SEO URL + labeled body content stay on the claimed profile surface.

# Problem Statement

Claimed profiles used a compact card (city + cuisine chips) that dropped the structured field labels present on the claim screen. Empty Pro profiles (e.g. Test2) looked sparse and lost claim-screen SEO body structure.

# Root Cause

Two divergent layouts in `RestaurantPublicPage.jsx`: unclaimed FieldRow list vs claimed compact hero meta.

# Evidence Collected

- User screenshots: Test2 claimed vs Dunkin unclaimed claim screen.
- Product direction: claimed = claim screen without claim button; keep Now Hiring / status strip; keep SEO field/URL value.

# Files Examined

- `menubloc-frontend/src/pages/RestaurantPublicPage.jsx`
- `menubloc-frontend/test/operatorPublicProfileContract.test.js`
- Status banner/events contract tests

# Database Queries Executed

None.

# Changes Made

- Extracted shared `ProfileFieldList`.
- Claimed path: hero (name, status light, Pro/Verified, Follow/Share) → `RestaurantStatusBannerStrip` → FieldRows (empty → `—`) → Billboard / Deals / View Menu.
- Unclaimed claim sidebar (`id="claim-profile"`) unchanged.
- Contract test asserts FieldRow SEO labels + banners + no claimed Claim CTA + canonical route params.

# Commits

Not committed in this session (unless requested separately).

# Deployment Status

Local frontend only — not deployed.

# Verification Results

- `node test/operatorPublicProfileContract.test.js` — ok
- `node test/restaurantStatusBannersContract.test.js` — ok
- `node test/restaurantStatusEventsContract.test.js` — ok

# Remaining Risks

- Brand Presentation shows raw `logo_url` text when set; may want image later.
- Production middleware meta tags unchanged (already URL-based).

# Follow-Up Work

- Deploy frontend when approved.
- Optional: richer Brand Presentation (logo image) without dropping FieldRow label.

# Final Verdict

Claimed profile matches claim-screen field SEO body without Claim CTA; status banners preserved; routes unchanged.
