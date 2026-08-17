# Dining Hall Experience-Only (No Menus) Guardrail

**Established:** 2026-08-15  
**Clarified:** 2026-08-17 — dining-hall menus are irrelevant; status reports do not need menu data  
**Product owner:** Andre Barber

## Hard rule

**Menuply does not analyze, ingest, track, sell, or publish dining-hall menus or menu items.**

Dining halls exist on Menuply so users can **tell each other what is going on** (status reports) and **comment** on that. Menu data is not required for that job.

Supersedes any earlier brief that asked for a dining-hall “Today’s Menu,” station→item signals, View Menu, CK menu tracking, OCR, or menu-item identity for `restaurant_type = dining_hall`.

## Product job

| In | Out |
|----|-----|
| What’s happening now (busy, wait, seating, sold-out, meal-period vibe, notes) | Menu / dish / station SKU analysis |
| Guest or diner status reports (same guest-open-reporting contract as other places) | View Menu, public menu routes, CK items for halls |
| Comments on the place / the reports | Nutrition, Similar, Compare, cart, OCR for halls |

## Allowed

- Place-level diner status on dining-hall profiles (wait, seating, sold-out, venue ops, busy, notes)  
- Guest contribution without an account (see guest open reporting contract)  
- Comments / discussion about the place and its live conditions  
- Campus Dining cluster listing halls + experience / status feeds  
- Waiter cluster report lines with **as-of** local clock for dining-hall **experience** signals (do not edit Waiter files unless the current turn names Waiter)

## Never without explicit Andre approval

- Menu capture, OCR, CK insert, or franchise-style menu seed for `restaurant_type = dining_hall`  
- Analyzing dining-hall menu items for search, Similar, Compare, nutrition, or commerce  
- “View Menu” / public menu / “Today’s Menu” as a dining-hall product surface  
- Using menu data as a prerequisite for dining-hall status reports  
- Selling or packaging dining-hall menus  
- Treating dining halls as claimable restaurant businesses

## Agent stop line

> This change would add dining-hall menu tracking, menu-item analysis, or a Today’s Menu / View Menu surface. I have not done that. Dining halls are status reports + comments only; menu data is not required. Explicit Andre authorization is required.

## Protected / related

- `dinerStatusService.js` (`busy`, `buildStatusReportLine`, `formatAsOfClock`)  
- `clusterReportFeedService.js` (`dining_hall_update`)  
- `PublicProfileShell.jsx`, `CampusDiningSection.jsx`, `DinerStatusComposer.jsx`, `WhatDinersAreSaying.jsx`  
- `test/diningHallEntityContract.test.js`  
- Migration `20260815_0256_diner_status_busy_expression.sql`  
- Guest reports: `docs/guardrails/2026-08-17_guest-open-reporting-contract.md`
