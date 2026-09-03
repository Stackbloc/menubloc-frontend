# CPD — Feed / Deals Share & Invite

**Date:** 2026-09-03  
**Layer:** FE only  
**Result:** COMPLETE — tip-gate `RESULT=PASS` apex + www

## Tip

| Field | Value |
|-------|-------|
| FE commit | `a965ad2f` — feat(feed): Share & Invite on feed and deals videos |
| Deploy | `menubloc-frontend-nl1k5ce20-menuply.vercel.app` |
| Bundle | `index-DBw1SQDI.js` |
| Aliases | menuply.com, www, crm, venues |

## What shipped

- Opposite-side **Share & Invite** on Feed home and Feed Deals videos
- Opens existing Invite to Eat (date/time) → ShareModal
- Share text starts with **Let's try this out!** and includes video deep link (`/feed?clip=` or `/feed/deals?deal=`)
- Primary share URL remains the eat-invitation link

## BE

No Railway deploy. Live health at lock time recorded as `206f08a2` (unchanged for this CPD).

## Verify

1. `/feed` — video with restaurant → lower-right **Share & Invite**
2. `/feed/deals` — same control; shared `?deal=` opens that swipe
3. Complete invite → ShareModal text includes lead + invite URL + `Watch the video:`
