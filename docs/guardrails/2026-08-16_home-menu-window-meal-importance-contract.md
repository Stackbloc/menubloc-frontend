# Home Menu Window Meal Importance Contract

**Established:** 2026-08-16  
**Type:** Hard product + engineering guardrail (home presentation)  
**Cursor rule:** `.cursor/rules/home-menu-window-meal-importance-guardrail.mdc` (`alwaysApply`)  
**Related:** [Home Page Protection Protocol](./2026-06-28_home-page-protection-protocol-guardrail.md) (FE home layout); BE `homePreviewService.js` (`buildPreviewMenuItems`)  
**Status:** **CONTRACT LOCKED** — behavioral implementation of roles 1–4 selection is a separate Andre-authorized follow-up. Existing add-on/modifier/name denylists alone are **not** sufficient.

---

## Hard rule

**Home-screen restaurant menu windows must display only the restaurant’s most important meal options** — items that represent meaningful food choices for a meal or the restaurant’s primary food offering.

Windows answer:

> **“What does this restaurant serve?”**

They must **not** answer:

> **“What individual SKUs can I buy from this restaurant?”**

Classify by **food role / meal importance**. Do **not** determine prominence solely by price or by the menu section where the item appears.

### Classification priority

| Rank | Role | Home window |
|------|------|-------------|
| 1 | Main meal / entrée | **Include** |
| 2 | Signature or specialty item | **Include** |
| 3 | Combo / meal | **Include** |
| 4 | Meaningful dessert | **Include** |
| 5 | Side / add-on | **Exclude** |
| 6 | Beverage / miscellaneous | **Exclude** |

Home windows pull **only from ranks 1–4**.

### Include

- Main dishes / entrées
- Signature or specialty dishes
- Burgers, sandwiches, tacos, burritos, pizza, pasta, bowls, plates, etc.
- Meal combinations / combos
- Major breakfast items
- Meaningful desserts when applicable

### Do NOT show

- Side dishes
- Condiments, sauces, or dressings
- Add-ons and toppings
- Individual beverages
- 2-liter drinks or other large packaged beverages
- Bottled/canned drinks
- Utensils or miscellaneous items
- Modifier-only items
- Minor supplemental items that are not meaningful meal choices

---

## Presentation only (not deletion)

This is a **home-screen presentation rule**, not a deletion or data-filtering rule for the restaurant’s full menu.

- Keep all legitimate menu items in the underlying restaurant menu / CK / publish paths
- The complete menu remains accessible when the diner opens the restaurant/menu
- Do **not** change menu ingestion or the menu-item data model unless required to reuse classification fields
- Prefer existing attributes (`item_type`, modifier/add-on eligibility, beverage/side classifiers, category tags) before inventing parallel models

---

## Applies to (consistency)

Every HomeNext restaurant menu window/card that surfaces `preview_menu_items` / `preview_items`, including:

- Popular (featured) and other home sections
- `DiscoveryCard` and `FeaturedDiscoveryCard` panes
- Any future home card that reuses the same preview chip fields

**Authority for selection:** backend home preview shaping (`buildPreviewMenuItems` / successors). Frontend panes should **consume** shaped previews — not invent a second SKU dump.

---

## Not sufficient alone

These are **not** acceptable as the sole prominence rule:

- Highest price / any price rank
- Menu section title or section order
- Alphabetical first-N from SQL overfetch
- Existing bare-condiment / modifier denylists **without** meal-role ranks 1–4

Current `homePreviewService` add-on exclusions remain useful as a subset of rank 5–6 rejection; they do **not** satisfy this contract by themselves.

---

## Never implement without explicit current-turn approval

- Weaken home windows to show sides, beverages, condiments, utensils, or modifier SKUs again
- Treat home preview chips as a full-menu SKU sample
- Delete or hide legitimate items from the full public menu under the guise of this contract
- Remove or weaken `test/homeMenuWindowMealImportanceContract.test.js` without replacing equivalent locks
- Change CanonicalMenuItemRow / ingestion solely for home chips without field-admission + approval

---

## Agent stop line

> This change would weaken home menu windows to show non-meal SKUs (sides, beverages, add-ons, utensils) or would filter the full restaurant menu as if this were a deletion rule. I have not done that. Home windows must show meal-importance ranks 1–4 only; the full menu stays intact.

---

## Before editing protected files

Output:

> **Per Home Menu Window Meal Importance Contract: the proposed change will modify [names] and may alter which items appear in home restaurant menu windows (or incorrectly filter the full menu). Explicit approval required.**

Then stop until approved (except when Andre’s current turn explicitly requests implementing or adjusting this contract).

### Protected / primary touchpoints

**Backend (selection authority)**

- `menubloc-backend-main/src/services/home/homePreviewService.js` — `buildPreviewMenuItems`, exclusion helpers
- `menubloc-backend-main/test/homeMenuWindowMealImportanceContract.test.js`
- `menubloc-backend-main/test/homePreviewCards.test.js` (add-on regressions — keep; do not replace this contract)

**Frontend (display consumers — prefer no second filter)**

- `menubloc-frontend-main/src/components/discovery/DiscoveryCard.jsx`
- `menubloc-frontend-main/src/components/discovery/FeaturedDiscoveryCard.jsx`
- `menubloc-frontend-main/src/components/homeNext/HomeNextMenuCardRow.jsx`

---

## Relation to Home Page Protection Protocol (HPP)

- **This contract** defines *what* home menu windows may show (meal importance).
- **HPP** still governs home *layout* / FE home component changes — explicit product-owner approval required for HomeNext layout edits.
- Preview **selection** work is primarily backend. Once Andre requests implementation of ranks 1–4, that BE work is authorized by **this** contract; incidental FE home layout changes still need HPP approval.

---

## Verification (when selection is implemented)

1. Contract tests in `homeMenuWindowMealImportanceContract.test.js` pass
2. Existing `homePreviewCards.test.js` add-on cases still pass
3. Home panes show entrées/signatures/combos/meaningful desserts — not fries-only / soda / sauce chips as the restaurant story
4. Opening the restaurant menu still lists sides, drinks, and other legitimate items
5. `menu_item_count` / `menu_ready` on home cards remain full-menu signals (presentation filter must not zero the restaurant’s published item count)

---

## Mandatory certification (when protected preview-selection files change)

End the task response with:

> ☐ HOME MENU WINDOW CERTIFICATION: Meal-importance ranks 1–4 [unchanged | implemented | user-approved change]; full menu intact [yes | n/a]; contract tests [pass | fail — pending implementation | not run — reason].

---

## Implementation follow-up (not part of contract packaging)

When Andre authorizes implementation: extend `buildPreviewMenuItems` (or a dedicated classifier it calls) so chips are selected from ranks 1–4; reuse existing classifiers; turn contract tests green; verify HomeNext; CPD only if requested.
