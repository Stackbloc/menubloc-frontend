# Summary

My Menuply and Connection diner hubs are no longer a gray/white/black “plain Jane” page. Color is cream + green. Food photos are casual snapshots (a hotdog is enough) with dish, restaurant, comment, View dish, Add details, and Join Me / Invite — not Instagram Stories heroes. The month calendar is a header chip, not a giant grid sitting on the feed.

# Problem Statement

Andre: the diner page was too plain. Photos should not copy Instagram drama; a hotdog snapshot is valid food. Calendar was stealing space that photos and actions need.

# Root Cause

Hub styles were near-monochrome. Photo cards were either tiny stamps or (briefly) full-bleed 340px heroes. The month grid was inline on What I'm Eating.

# Evidence Collected

- Live Connection page (`/account/connections/:id`) was still the stub until this local work; production tip remains Post X (`index-He0r-RTw.js`).
- Andre rejected Instagram-style drama and asked for everyday food photos.

# Files Examined

- `MyMenuplyPage.jsx`, `ConsumerConnectionPeerPage.jsx`
- `myMenuplyBits.jsx` (`PhotoGrid`), `myMenuplyStyles.js`, `DinerCalendarSheet.jsx`, `QuickCompose.jsx`, `DinerIdentityHero.jsx`

# Database Queries Executed

None.

# Changes Made

- Page wash: cream/peach gradient; green titles, pills, compose, calendar chip, avatar ring.
- Photo cards: 168px tall snapshots + cream caption with restaurant and actions. Empty slot uses a hotdog glyph.
- Calendar: `DinerCalendarTrigger` in the What I'm Eating header; month grid in a sheet (`eating-plans-calendar` still after PhotoGrid in source order). Dedicated What I Ate Today page calendar unchanged.
- Same layout on owner and Connection (read-only peer).

# Commits

None (not requested).

# Deployment Status

Local only on `menubloc-frontend-main`. No CPD. Production still Post X tip.

# Verification Results

Contract tests PASS: `connectionPeerHubContract`, `myMenuplyFourQuestionsContract`, `whatIAteTodayContract`, `dinerAboutPhotosContract` (10 tests).

# Remaining Risks

- Production still shows the old Connection stub and gray hub until FE CPD.
- Peer photo/About need BE deploy for live avatars.
- Peer wants/crews/events still empty shells.

# Follow-Up Work

CPD when Andre asks. Do not enlarge photos toward Stories. Do not restore restaurant Like.

# Final Verdict

Casual colorful diner hub locally: hotdog-sized photos with food info; calendar off the feed until tapped.
