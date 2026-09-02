# CK Selection Default for Restaurant + Menu Item Metadata

**Date:** 2026-09-02  
**Status:** Active platform design rule

## Principle

When a UI collects **restaurant** or **menu item** metadata that exists in Common Knowledge, users must **pick from CK search results** — not type names or IDs by hand.

Search inputs are for **finding** CK rows. After selection, display is **read-only** with Change/Clear. Persist only `restaurant_id` and `menu_item_id` from picked CK rows.

Free text remains appropriate for **user-authored** fields (captions, comments, titles when not auto-filled from a picked dish).

## Required pattern

- **API:** `searchReportPlaces` (`/public/food-activity/places`) with `type: "restaurant"` / `"menu_item"`
- **Normalization:** `asRestaurantPlace` / `asDishPlace` from `foodActivityApi.js`
- **Component:** `src/components/ck/CkRestaurantMenuPicker.jsx` (or `EatingPlaceFields` on consumer surfaces)

## Never without explicit approval

- Free-text inputs that persist restaurant names or menu item names as if they were CK-linked
- Menu-console `searchMenuConsoleRestaurants` / `searchMenuConsoleItems` for CK metadata (public `menu_items` namespace mismatch)
- Saving `restaurant_id` / `menu_item_id` without a picker selection from CK search

## Protected

- `src/components/ck/CkRestaurantMenuPicker.jsx`
- `src/pages/owner/OwnerVideoCuration.jsx`
- `test/ownerVideoCatalogCkPickerContract.test.js`

## Agent stop line

> This change would let operators or diners manually enter restaurant/menu data that exists in CK instead of selecting CK rows. I have not done that. CK pickers are required for CK-backed metadata.
