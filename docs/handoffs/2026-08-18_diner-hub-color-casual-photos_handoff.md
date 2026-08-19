# Objective

Warm, green diner hub that is not gray-on-white, with everyday food photos (a hotdog is fine) and a small calendar chip — not Instagram.

# Current Status

**LOCAL** on `menubloc-frontend-main`. Not CPD’d.

# Files Changed

- `src/pages/consumer/MyMenuplyPage.jsx`
- `src/pages/consumer/ConsumerConnectionPeerPage.jsx`
- `src/pages/consumer/myMenuply/myMenuplyBits.jsx`
- `src/pages/consumer/myMenuply/myMenuplyStyles.js`
- `src/pages/consumer/myMenuply/DinerCalendarSheet.jsx`
- `src/pages/consumer/myMenuply/QuickCompose.jsx`
- `test/connectionPeerHubContract.test.js`
- `test/myMenuplyFourQuestionsContract.test.js`

# Database Changes

None.

# Decisions Made

- Photo height 168px. Not 58vw / 340px Stories heroes.
- Cards carry dish, restaurant, note, View dish, Add details, Join Me / Invite.
- Calendar opens from a header chip; `eating-plans-calendar` stays after PhotoGrid in source for contracts.
- Same layout owner + Connection.

# Remaining Work

1. CPD FE when Andre says `cpd`.
2. BE for peer `avatar_url` / `diner_about` when Railway can take `menubloc-backend-main`.
3. Peer wants/crews/events APIs if those should fill.

# Risks / Known Issues

Live menuply.com still Post X hub. Do not restore `683cf6yk3` / `index-CZS4phIY.js` unless rolling back Post X.

# Verification Status

See audit. Run:

```
cd menubloc-frontend-main
node --test test/connectionPeerHubContract.test.js test/myMenuplyFourQuestionsContract.test.js test/whatIAteTodayContract.test.js
```

# Resume Instructions

Open `/my-menuply` and `/account/connections/:id` on local FE. Photos should look like a snapshot of a hotdog plus restaurant/Join Me — not a dark Stories reel. Calendar is a green date chip.

# Git Status

Uncommitted on `menubloc-frontend-main`. No production push.
