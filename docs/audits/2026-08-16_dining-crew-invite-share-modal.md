# Summary

Replaced prototype Dining Crew invite share (raw `<code>` URL + optional member id) with ShareModal: Copy Link primary plus SMS/Email/WhatsApp. Optional on social onboarding after Create Dining Crew; required nowhere. Invite URLs locked to `https://menuply.com/...`.

# Problem Statement

Manual copy of a long invite URL during/after onboarding was awkward; Dining Crews “Invite members” was prototype UX.

# Root Cause

Invite flow never adopted the production ShareModal pattern already used by Invite to Eat.

# Evidence Collected

- Plan: Dining Crew invite share (replace prototype)
- Invite to Eat ShareModal pattern in `InviteToEatModal.jsx`
- Consumer share menuply.com contract

# Files Examined / Changed

- `menubloc-frontend-main/src/lib/diningCrewInviteShare.js` (new)
- `menubloc-frontend-main/src/pages/consumer/DiningCrewsPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/SocialOnboardingPage.jsx`
- `test/diningCrewInviteShareContract.test.js` (new)
- `test/diningCrewsSocialEntityContract.test.js`
- `test/socialOnboardingContract.test.js`

# Database Queries Executed

None.

# Changes Made

1. Shared helper `buildDiningCrewInviteShareData` / `menuplyDiningCrewInviteUrl`
2. Dining Crew detail: **Share invite** → mint link → ShareModal; removed member-id + raw code dump
3. Onboarding: optional **Share invite** after create; Continue without sharing unchanged
4. Contract tests + share-contract pass (ShareModal/shareUtils not edited)

# Commits

None yet (local).

# Deployment Status

**LOCAL** — not CPD’d.

# Verification Results

- `node --test test/diningCrewInviteShareContract.test.js` (+ related) — pass
- `npm run test:share-contract` — 8 pass

# Remaining Risks

Human E2E: create crew → Share invite → Copy Link / SMS on mobile.

# Follow-Up Work

CPD when Andre authorizes.

# Final Verdict

**LOCAL COMPLETE** — prototype invite share replaced with ShareModal.
