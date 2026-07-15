# Summary

`/operator/claim` “Create a new listing” now routes to `/restaurant/signup` (manual plan + restaurant details), not `/restaurant/onboarding` (philosophy). Claim arrivals first choose single vs franchise/multi vs food truck.

# Problem Statement

Create a new listing from [operator claim](https://menuply.com/operator/claim) sent operators to restaurant philosophy/onboarding, not the manual restaurant information entry flow.

# Root Cause

`OperatorClaimSearch.jsx` used `createListingHref = "/restaurant/onboarding"`.

# Changes Made

- Claim → `/restaurant/signup` with `state: { from: "operator_claim", create_listing: true }`
- Signup entry shows listing-type chooser (single / franchise-multi / food truck), then plans → account details
- Account navigation preserves claim state for attach-to-existing-operator messaging

# Deployment Status

Local until commit/push/deploy requested.

# Final Verdict

Create listing exits claim into the restaurant signup/details path instead of philosophy onboarding.
