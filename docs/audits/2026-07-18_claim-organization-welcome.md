# Summary

After claiming a restaurant (e.g. Dunkin), `/restaurant/onboarding/organization` felt cold and looked like it re-asked restaurant name/city/state. Added a claim welcome gate plus clearer legal-entity copy. Claimed `restaurant_id` identity was already carried; the form collects **legal entity**, not listing identity.

# Problem Statement

User claimed Dunkin, confirmed email/password, landed on Business Organization with empty Legal entity name / Jurisdiction and no acknowledgment of the claim.

# Root Cause

1. Organization stage intentionally collects legal/operating entity (separate from CK listing name/city/state).
2. No welcome confirmation of the claimed listing.
3. Labels like “Jurisdiction” read as restaurant city/state.
4. `claim_source` / `address_line1` were not persisted into onboarding state for welcome location copy.

# Evidence Collected

- Screenshot: `menuply.com/restaurant/onboarding/organization` after Dunkin claim
- Onboarding state already holds `restaurant_id`, `restaurant_name`, `city`, `state` from signup persist
- Prior audit: legal name must not prefill from restaurant display name

# Files Examined / Changed

- `RestaurantOnboardingOrganization.jsx` — welcome gate + linked banner + clarified labels
- `RestaurantSignup.jsx` — persist `claim_source`, `address_line1`
- `restaurantOnboardingState.js` — normalize those fields
- `test/businessOrganizationOnboardingContract.test.js`

# Database Queries Executed

None.

# Changes Made

- Welcome card: “You have claimed the profile for [name] located at [address or city/state]. Let's get your restaurant set up on Menuply.” + Continue
- After Continue: legal-entity form with banner showing linked listing; jurisdiction labeled as legal formation state, not restaurant city

# Commits

Not committed yet (await CPD request).

# Deployment Status

Local only.

# Verification Results

- `node --test test/businessOrganizationOnboardingContract.test.js` — 12/12 pass

# Remaining Risks

- Mid-session users who signed up before `claim_source`/`address_line1` persist still get welcome from `restaurant_name` + city/state when present in session/operator restaurants.

# Follow-Up Work

- CPD when requested
- Optional: fetch address from public restaurant if only id is known

# Final Verdict

**LOCAL COMPLETE** — claim identity was already set; UX now acknowledges the claim and distinguishes legal entity from listing identity.
