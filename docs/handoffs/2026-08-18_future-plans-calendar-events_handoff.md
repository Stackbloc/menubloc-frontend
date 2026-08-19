# Objective

Show future plans by month inside the existing calendar icon, with each event clickable. Keep the calendar icon beside Future plans.

# Current Status

Implemented in `menubloc-frontend-main`. CPD in progress.

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

- CPD (this turn).

# Risks / Known Issues

No clock-time column on sessions; meal/notes come from `place_label`.

# Verification Status

10/10 related contract tests passed.

# Resume Instructions

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
node --test test/myMenuplyFourQuestionsContract.test.js test/connectionPeerHubContract.test.js test/futurePlansCalendarEvents.test.js test/whatIAteTodayContract.test.js
```

# Git Status

FE worktree `menubloc-frontend-main`. Uncommitted unless Andre asked to commit.
