# Summary

I'm Eating At now prefills **restaurant name** and **dish** (not address-only / empty dish) from `?restaurant_id=` / `?menu_item_id=`. The X sheet title is **Post about**. What I'm Eating on My Menuply is the single compose surface: calendar date, optional photo, then optional restaurant/dish/join tags. My Eating Plans is no longer a separate section.

# Problem Statement

Andre selected a restaurant and dish but I'm Eating At showed an address under Restaurant and a blank dish field. He also asked for Facebook-like posting (text/photo/date first; tag after), a larger X icon, “Post about”, and merging My Eating Plans into What I'm Eating. Clarification: **dish**, not “dhis”.

# Root Cause

Standalone `/account/im-eating` did not read restaurant/dish from the URL. Composer displayed `restaurant.restaurant_name` / `menuItem.item_name` only. Incoming rows often used `name` / `label` / `id`. Opening Post from a dish page never passed `menu_item_id`. Plans were a second required-restaurant form.

# Evidence Collected

- `GET /menu-items/:id` returns `item.name` and `item.restaurant.name`, not always `item_name` / `restaurant_name`.
- Composer search results do include `restaurant_name` and `item_name`; empty dish was mainly missing hydrate from the current dish page.
- BottomNav X was `size={22}` in a 28×28 wrap (smaller / sitting high vs Waiter 28).

# Files Examined

- `ImEatingComposer.jsx`, `ImEatingAtPanel.jsx`, `ImEatingPage.jsx`, `foodActivityApi.js`
- `MenuplyActionSheet.jsx`, `BottomNav.jsx`, `MyMenuplyPage.jsx`
- `whatWeDoingService.js` `updateSessionDetails`, `PATCH /what-we-doing/:tokenOrId`

# Database Queries Executed

None.

# Changes Made

- `resolveEatingPrefill` + composer labels (`restaurantLabel` / `dishLabel`).
- Action sheet: **Post about**; I'm Eating At path includes current dish or restaurant; What I'm Eating → `/my-menuply`.
- BottomNav X `size={28}` aligned with other icons.
- My Menuply: compose first; future date → plan session; today/past → What I Ate Today; `PostAfterActions` for tags.
- BE PATCH already present; contract asserts `updateSessionDetails`.

# Commits

FE `8a1a961`. BE `4695ba64`.

# Deployment Status

**CPD COMPLETE (wrapped).** Feature is live inside later diner-accounts tip `5vl6kfuh6` / `index-BZBfCuwA.js` (FE `12945f5`, ancestor `8a1a961`). BE health `942e7c10` (ancestor `4695ba64`). Do not re-alias `psmauf4vh`.

# Verification Results

Contract tests run on FE (`myMenuplyFourQuestions`, `dinerPrimaryNav`, `imEatingFoodActivity`) and BE (`whatWeDoingContract`).

# Remaining Risks

- Future plans still have no `menu_item_id` column; dish tag is stored in `place_label` as `Restaurant · Dish`.
- `listWhatIAteToday(planDate)` is one day at a time.

# Follow-Up Work

`cpd` when Andre asks. Do not mix unrelated dirty Site Activity files.

# Final Verdict

Dish prefill + Post about + merged What I'm Eating is live on menuply.com. LKG is the diner-accounts tip that contains this work. Alias war stopped.
