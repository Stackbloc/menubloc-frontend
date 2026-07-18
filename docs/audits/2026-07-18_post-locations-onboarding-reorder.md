# Summary

Reordered post-Locations onboarding to upload → Menu Worksheet → default menu → profile edit → celebration soft pause. Merchant, delivery, and menu design are deferred Finish-setup tracks (design last). Early plan payment unchanged.

# Problem Statement

Operators were sent to menu design immediately after Locations, before menu content existed. Menu Worksheet (spreadsheet) was not in the onboarding spine. Profile celebration and a non-overwhelming pause were missing.

# Root Cause

Checkpoint order and `resolvePostLocationsPath` / locations complete routed to `/restaurant/design-select`. Worksheet publish did not advance onboarding. Login resume treated all stages as blocking.

# Evidence Collected

- Prior audit of post-locations flow (design-select first; worksheet nav operator-only).
- Product direction: content before cosmetics; one next step after profile; design last.

# Files Examined / Changed

- FE/BE checkpoint services; locations complete; PdfUploadPage; OperatorMenuWorksheetPage; OperatorProfileEditor; RestaurantOnboardingProfileComplete; OperatorDashboard; App route; architecture + contract tests.

# Database Queries Executed

None.

# Changes Made

- Core stages: …locations → menu_upload → menu_worksheet → default_menu_ready → public_profile_edit → profile_complete_gate
- Deferred: merchant_onboarding → delivery_onboarding → menu_design (last)
- Locations → menu-upload-choice; upload → worksheet; Update Menuply → profile; publish → celebration gate
- Gate CTAs: Continue payments vs Continue later; dashboard Finish setup cards
- Core-complete resume → dashboard (deferred never force-redirect)

# Commits

Not committed in this session.

# Deployment Status

Local only.

# Verification Results

- Contract/unit tests run in this session (see task completion).

# Remaining Risks

- Public menu URL uses `/restaurants/{id}/menu` fallback; canonical city/state paths preferred when available later.
- Legacy `has_published_menu` operators treated as core-complete with soft heuristics.

# Follow-Up Work

1. Commit + CPD FE/BE
2. Manual E2E: locations → upload → worksheet → profile → gate → later → Finish setup → design last
3. Optional: mark merchant/delivery complete from those pages’ success paths

# Final Verdict

**Post-locations reorder implemented locally per plan; await commit/deploy.**
