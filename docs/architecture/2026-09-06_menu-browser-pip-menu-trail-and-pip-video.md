# Menu Browser PiP — discussed-menu trail + Full Feed + PiP video advance

**Date:** 2026-09-06  
**Status:** Implemented (FE)  
**Supersedes behavior note in:** [2026-09-06_menu-browser-pip-frozen-browse-context.md](./2026-09-06_menu-browser-pip-frozen-browse-context.md)

## Product

While Menu Browser is open:

1. **Menu trail** — unique restaurants from the clip where Browse opened through the currently playing Feed index. Horizontal swipe / Prev·Next menu walks that trail toward the current discussion.
2. **PiP video advance** — Prev/Next video buttons + vertical swipe on the mini-player advance Feed independently; menu does not auto-follow.
3. **Full Feed** — header **Full Feed**, PiP **Full Feed** button, or tap PiP exits Browse and restores the full reel.
4. **Browse this menu** — explicit jump of the trail cursor to the currently playing restaurant (still required; Feed advance alone does not change the open menu).

## Files

- `src/lib/feedMenuBrowserTrail.js`
- `src/components/consumer/feed/FeedMenuBrowserPipOverlay.jsx`
- `src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx`
- `src/components/consumer/feed/DealVideoSwipe.jsx`
- `test/feedMenuBrowserPipContract.test.js`
