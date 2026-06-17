# Regression Notes - 2026-06-17

Session notes for the frontend work performed today.

## What was changed

- Restored the Waiter daily briefing route and content.
- Restored `/food-interests` to redirect to `/waiter`.
- Restored BottomNav label and icon for the Waiter tab.
- Fixed the restaurant onboarding page contrast so text is readable on the white page background.
- Restored the onboarding page structure after removing the experimental top-header/logo variants.
- Fixed the shared brand logo lockup so the wordmark no longer clips in the sticky header.
- Improved readability on `/restaurant/signup` by replacing washed-out text colors with dark page-safe colors.

## Files touched in this session

- `src/App.jsx`
- `src/components/BottomNav.jsx`
- `src/components/BrandLogo.jsx`
- `src/components/RestaurantOnboardingApproved.jsx`
- `src/components/StickyPageHeader.jsx`
- `src/pages/FoodInterestsPage.jsx`
- `src/pages/RestaurantSignupEntry.jsx`
- `src/lib/waiterApi.js`

## Verification

- `npm run build` passed after the restore and the readability fixes.
- Visual checks confirmed the onboarding page text was readable again.
- Visual checks confirmed the shared header logo rendered without clipping on a shared-header page.

## Notes

- The build still reports an existing duplicate-key warning in `src/pages/MenuItemDetailPage.jsx`. That warning was not part of this session's changes.
- No deployment was performed from this note file creation step.
