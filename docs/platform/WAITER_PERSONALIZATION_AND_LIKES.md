# Waiter Personalization and Likes

Status: implemented foundation, June 19, 2026.

## Product contract

Waiter is Menuply's single recommendation surface. It is a food concierge driven by the person, local time, selected meal period, location, current inventory, active deals, behavioral Likes, and MKS intelligence. It must not present category inventory counts as recommendations.

The previous Interested system, Food Interests collection and management workflow, Food Spotlight cards, and Top Picks pages/cards/links have been removed. Users are not asked to maintain positive food-interest lists.

## Daily Waiter Briefing

The existing Waiter header remains the entry point. The Daily Waiter Briefing directly below it provides:

- A date generated from the user's local browser date.
- A morning, afternoon, or evening greeting using account first name when available.
- A single-select Breakfast, Brunch, Lunch, Dinner, and Late Night selector.
- Automatic defaults: Breakfast 5:00-10:29; weekend Brunch or weekday Lunch 10:30-13:59; Lunch 14:00-16:59; Dinner 17:00-21:59; Late Night 22:00-4:59.
- In-page recommendation refresh when the meal period changes.
- Real G Coin wallet balance for signed-in users. Expiration copy is rendered only when a real expiration source exists; the current ledger has no expiration model, so no mock expiration is shown.

## Recommendation priority

Recommendation decisions follow this hierarchy:

1. Local time
2. Selected meal period
3. User location
4. Active deals
5. New menu items
6. New restaurants
7. Trending dishes from recent item-detail visits
8. Active dish Likes
9. MKS-derived preference signals

The API returns named dishes, restaurants, and deals with a reason label. It does not return generic counts such as "143 Chicken in Los Angeles."

## Dish Likes

The menu-item detail page is the only Like capture surface. Search cards, restaurant menu cards, similar-item cards, and compare cards do not contain Like controls.

The control uses `👍 Like` and `👍 Liked`. Like creates or reactivates a signal; Liked deactivates it. Signed-out interaction displays: `Sign in to like dishes and improve Waiter recommendations.`

`consumer_menu_item_likes` stores user, menu item, restaurant, timestamps, active status, food form, cuisine/category, protein/main ingredient, city, state, and an MKS signal snapshot. The service derives available semantic fields from the assigned dish template and restaurant metadata at Like time. This preserves the original evidence even as MKS evolves.

Waiter reads active Like signals as a high-quality behavioral input. Repeated related Likes can therefore reinforce food form, canonical family, cuisine, and protein affinity without requiring manual interest management. Likes influence ranking after time, meal, location, live deals, new inventory, and observed trends; they do not silently filter inventory.

## Current limitation

The current G Coin wallet stores balance and ledger activity but no per-grant expiration timestamp. Expiring amount and days remaining must remain absent until a real expiration model is added.
