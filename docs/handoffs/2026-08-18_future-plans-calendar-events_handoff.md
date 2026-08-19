# Objective

Show future plans by month inside the existing calendar icon, with each event clickable. Keep the calendar icon beside Future plans.

# Current Status

**CPD COMPLETE.** FE tip `menubloc-frontend-4iy54g5qc-menuply.vercel.app` / `index-6H0iynJH.js` (`1e18d55`). BE health `06b8ff3f` (unchanged).

# Files Changed

- `src/pages/consumer/MyMenuplyPage.jsx`
- `src/pages/consumer/ConsumerConnectionPeerPage.jsx`
- `src/pages/consumer/myMenuply/DinerCalendarSheet.jsx`
- `src/pages/consumer/myMenuply/myMenuplyBits.jsx` (`FuturePlanRow`)
- `src/pages/consumer/myMenuply/dinerHubFormat.js`
- `test/myMenuplyFourQuestionsContract.test.js`
- `test/connectionPeerHubContract.test.js`
- `test/futurePlansCalendarEvents.test.js`

# Database Changes

None.

# Decisions Made

- Month view is the Future plans calendar sheet, not a separate By-month chip.
- Each plan in the visible month is a clickable event (`Restaurant [date]`).
- One event on a day: tapping the day opens that plan. Several events: stay on the sheet and tap the event.
- Empty day (owner): close calendar and open the schedule form.
- Calendar icon always next to Future plans.
- **Plans Scheduled** toggle removed; list rows are `Restaurant [date]`.

# Remaining Work

None.

# Risks / Known Issues

No clock-time column on sessions; meal/notes come from `place_label`.

# Verification Status

10/10 contract tests passed. Tip-gate PASS apex + www.

# Resume Instructions

Hard-refresh https://menuply.com/my-menuply → Future plans calendar icon → tap a restaurant event → detail box opens.

# Git Status

FE `1e18d55` on `origin/main`. LKG docs lock committed with CPD record.
