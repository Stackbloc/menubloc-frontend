# Menu Browser PiP — frozen Browse context + independent Feed mini-player

**Date:** 2026-09-06  
**Status:** Implemented (FE)  
**Surface:** Feed home reel + Feed Deals reel

## Product rule

When a diner opens **Menu Browser** from a Feed post:

1. Establish an **independent Browse context** tied to the **selected restaurant at open**.
2. Subsequent Feed navigation / autoplay **must not** change the restaurant menu being browsed.
3. The **persistent mini-player** may advance through Feed content independently (same `<video>` element, PiP chrome).
4. If the playing Feed item is a **different** restaurant, keep showing that clip in the mini-player while preserving the original menu.
5. Switching Browse to the newly playing restaurant requires an **explicit** “Browse this menu” action.

## Implementation

| Piece | Role |
|-------|------|
| `browseRestaurantRef` state | Frozen snapshot at open (`setBrowseRestaurantRef({ ...ref })`) |
| `restaurantRef` from current `item` | Playing Feed restaurant only |
| `FeedMenuBrowserPipOverlay` | Renders `CatalogMenuRenderer` for **browse** ref; switch bar when playing ≠ browse |
| PiP video | Parent reel restyles the same `<video>`; swipe/keys still advance `index` while Browse is open |
| Close / tap PiP | Clears `browseRestaurantRef` → full reel |

## Entry

- Icon: `BrowseMenusIcon` — tooltip/aria **Menu Browser**
- Does **not** `navigate()` away to `/restaurants/.../menu` for v1 open path

## Files

- `src/components/consumer/feed/FeedMenuBrowserPipOverlay.jsx`
- `src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx`
- `src/components/consumer/feed/DealVideoSwipe.jsx`
- `test/feedMenuBrowserPipContract.test.js`

## Out of scope (v1)

- National Yellow Browse swipe while PiP open
- Equal side-by-side layout
- Auto-switching Browse when Feed restaurant changes
