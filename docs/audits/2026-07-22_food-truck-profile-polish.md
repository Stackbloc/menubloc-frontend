# Summary

Polished food truck public profile: Current Location under the name with maps pin, inline Upcoming, full menu only, always-visible Save contact + Like; fixed schedule page white-on-white contrast.

# Problem Statement

Post-editorial CPD feedback: duplicate menu (preview + full), address shown twice, Food Truck chip noise, text “Get directions” / schedule deep-link, Save contact only on QR, and `/schedule` unreadable (dark theme ink on light `--bg`).

# Root Cause

- Layout still mirrored restaurant editorial (preview + address) plus Where & when panel.
- Save contact gated on `?ref=qr`.
- Schedule page defaulted `grubbid_theme` to dark while `pageBg` used light CSS `--bg`.

# Changes Made

- `FoodTruckPublicEditorial.jsx` — Current Location + MapPin; cuisine text only; Upcoming inline; no Where & when / menu preview / Food Truck chip / Category Food Truck detail.
- `FoodTruckPage.jsx` — `SaveContactButton` always in identity actions; dropped preview/scheduleHref/QR-only banner.
- `FoodTruckSchedulePage.jsx` — forced light editorial colors; empty state; no theme toggle.
- Contracts + Playwright updated.

# Final Verdict

Local verified: contracts 6/6, Playwright desktop 3/3. Ready for CPD after approval.
