# Menuply Visual Restoration Plan
**Date:** 2026-06-18  
**Scope:** Homepage, Search Results, Signup experience  
**Type:** Audit-only — no code changed in this document

---

## Evidence Sources

- Playwright baseline screenshots (`tests/baseline-screenshots/visual.spec.js-snapshots/`)
- Source audit: `GrubbidDiscovery.jsx`, `GrubbidSearchResults.jsx`, `SearchResultCard.jsx`, `DiscoveryCard.jsx`, `FeaturedDiscoveryCard.jsx`, `RestaurantSignupEntry.jsx`, `RestaurantSignup.jsx`, `RestaurantFoundersSignup.jsx`
- CSS token audit: `src/index.css` `:root` block

---

## Design System Snapshot

| Token | Value | Context |
|---|---|---|
| `color-scheme` | `dark` | ⚠️ Set on `:root` but page is white |
| `--gb-color-page` | `#ffffff` | Page background |
| `--gb-color-surface-strong` | `#121A14` | Card background |
| `--gb-color-ink` | `#F9FAFB` | Default text — near-white |
| `--gb-color-accent` | `#22C55E` | Brand green |
| `--gb-shadow-card` | `0 8px 28px rgba(0,0,0,0.35)` | Standard card shadow |
| `--gb-radius-card` | `24px` | SearchResultCard shell |
| Discovery card radius | `12px` (inline) | DiscoveryCard.jsx L178 |
| Featured card radius | `16px` (inline) | FeaturedDiscoveryCard.jsx L151 |

---

## TASK 3 — Homepage Verdict

**The current homepage feels: D. Flat + C. Generic**

| Criterion | Evidence |
|---|---|
| Not premium | Search bar is a dark pill dropped onto a white page with no visual transition or context — it reads as a UI artifact, not a designed object |
| Not modern | The category chip rows (emoji + label in dark pill) are functional but unadorned — no hover state polish, no visual depth |
| Generic | The CTA buttons ("Restaurants" / "Diners") are full-width green rectangles with no distinct brand personality beyond the color |
| Flat | The out-of-market state (no location set) is a white void: invisible marketing copy, two buttons, ~400px of dead white space, then the footer |
| Inconsistent | Discovery cards are dark (`#121A14`) with heavy shadows floating on a white page; the featured card uses a gradient overlay and blur — three distinct card visual identities in one feed |

**Specific homepage evidence:**
- Marketing copy `As the cost of dining continues to rise...` uses `color: var(--gb-color-ink)` = `#F9FAFB` on `#ffffff` background. WCAG contrast ratio: approximately 1.07:1. **Effectively invisible.**
- The `.disc-feed-grid` uses `gap: 10px` between cards that each cast `0 8px 28px rgba(0,0,0,0.35)` shadows — the shadows overlap at this gap, creating visual mud.
- Standard discovery cards use `borderRadius: 12`, featured cards use `borderRadius: 16`, and the card shell referenced in `SearchResultCard.jsx` uses `var(--gb-radius-card)` = `24px`. Three different radii in one page creates inconsistency without purpose.
- No skeleton state during feed load — the pulse animation exists (`.disc-feed-skeleton`) but only fires when items are loading. The first appearance of the page is empty white.

---

## TASK 4 — Search Results Verdict

**Top 5 improvements that would most improve search quality perception:**

1. **Skeleton loading state** — Currently "Loading..." appears inside a dark pill with no animation context. Users see a black box on a white page with static text. A skeleton shimmer for 2–3 card shapes would signal that content is coming and how it will be laid out.
2. **Item row separation** — Each `ItemRow` is separated by only `borderBottom: "1px solid var(--gb-color-border)"` (`#1F2937`). On a white page, `#1F2937` is a near-invisible dark line. Items run together with no visual breathing room.
3. **Match explanation readability** — The match explanation text uses `color: "#9CA3AF"` on `#ffffff` background. Contrast ratio: ~2.5:1. WCAG AA minimum for body text is 4.5:1. This text is the key differentiator explaining why a result was returned — it must be readable.
4. **Restaurant group header / item visual separation** — The restaurant group header card (dark `#121A14`) floats on the white page, followed by item rows with only border dividers. The visual "belongs to this restaurant" relationship between the dark header and white item rows is not communicated.
5. **Nutrition/Insight action button prominence** — The "Nutrition" and "Insights" tab selector buttons are small pill buttons (`padding: "4px 10px"`, `fontSize: 11`) with very low contrast backgrounds (`rgba(255,255,255,0.06)`). These are core intelligence features — they are currently invisible.

---

## Priority 1 — High-Value / Low-Risk

---

**ID:** VR-01  
**Route:** All pages  
**Component:** `:root` CSS  
**File:** `src/index.css`  
**Visual issue:** `color-scheme: dark` is declared on `:root` while the page background is white (`#ffffff`). This instructs the browser to render native UI elements (scrollbars, date pickers, select dropdowns) in dark mode while the page itself is white. Results in dark scrollbars on a white page, which looks like a bug.  
**Proposed improvement:** Change to `color-scheme: light` to match the actual white page background.  
**Risk level:** Low — this is a CSS hint to the browser, not a styling change. Removes the visual contradiction, does not alter any app-defined colors.

---

**ID:** VR-02  
**Route:** `/` (homepage, out-of-market / no-location state)  
**Component:** `showOutOfMarketPromo` div in `GrubbidDiscovery.jsx`  
**File:** `src/pages/GrubbidDiscovery.jsx` ~L1668  
**Visual issue:** The marketing copy `"As the cost of dining continues to rise..."` uses `color: var(--gb-color-ink)` = `#F9FAFB` (near-white) on a white `#ffffff` page background. Contrast ratio ≈ 1.07:1. The text is invisible.  
**Proposed improvement:** Add an explicit `color: "#374151"` or `color: "#1e293b"` to the `.disc-oom-copy` CSS rule and the inline `div` style in `showOutOfMarketPromo`, overriding the page-level ink token for this light-background context.  
**Risk level:** Low — isolated to a single empty-state block. Does not affect the feed or any logic.

---

**ID:** VR-03  
**Route:** `/` (homepage)  
**Component:** `.disc-feed-grid` / `DiscoveryCard`  
**File:** `src/pages/GrubbidDiscovery.jsx` L1188  
**Visual issue:** Feed cards use `gap: 10px` between items that each cast a `0 8px 28px rgba(0,0,0,0.35)` drop shadow. At 10px gap the shadows overlap, compressing visual separation and creating a muddy stacked appearance.  
**Proposed improvement:** Increase `.disc-feed-grid` gap from `10px` to `14px`. This costs one line in the injected `<style>` block.  
**Risk level:** Very low — pure spacing change. Does not affect layout structure, scrolling behavior, or any component logic.

---

**ID:** VR-04  
**Route:** `/search` (loading state)  
**Component:** Loading pill in `GrubbidSearchResults.jsx`  
**File:** `src/pages/GrubbidSearchResults.jsx`  
**Visual issue:** The loading state is a dark rounded rectangle with static text "Loading...". No animation. No indication of how many results or what shape they will be. On the white page, a black pill with static text reads as an error state, not a loading state.  
**Proposed improvement:** Replace the loading pill with 3 skeleton card shapes that pulse with the same animation already defined in GrubbidDiscovery (`.disc-feed-skeleton`). This accurately signals content is incoming and previews the result layout.  
**Risk level:** Low — replaces only the loading branch of the ternary. Does not touch result rendering.

---

**ID:** VR-05  
**Route:** `/search`  
**Component:** Match explanation text in `ItemRow`  
**File:** `src/components/SearchResultCard.jsx` ~L1370–1410  
**Visual issue:** Match explanation text uses `color: "#9CA3AF"` on `#ffffff` background. Contrast ratio ≈ 2.5:1 (WCAG AA fail for normal text). This is the key information explaining why a result was returned — the most important explanatory text on the page — and it fails basic readability standards.  
**Proposed improvement:** Darken to `color: "#6B7280"` minimum (contrast ≈ 4.6:1 on white, WCAG AA pass). The green highlighted term `#22C55E` also fails at 1.77:1 on white — consider `#15803d` for on-white use.  
**Risk level:** Low — color-only change to two lines. No layout impact.

---

**ID:** VR-06  
**Route:** `/search`  
**Component:** Item row separator  
**File:** `src/components/SearchResultCard.jsx` ~L1239–1241  
**Visual issue:** `ItemRow` uses only `borderBottom: "1px solid var(--gb-color-border)"` (`#1F2937`) as item separation. On a white page, `#1F2937` is a very dark line but has no margin — items stack with zero vertical breathing room between the border and the next item's content.  
**Proposed improvement:** Add `paddingTop: 14` and `paddingBottom: 14` to replace the current `paddingTop: 10 / paddingBottom: 10`, or add a subtle `marginTop: 4` to create visual air between the border and the next item's name. This does not change the border itself.  
**Risk level:** Low — padding-only change. No structural impact.

---

## Priority 2 — Moderate Visual Improvements

---

**ID:** VR-07  
**Route:** `/` (homepage)  
**Component:** `DiscoveryCard` / `SearchResultCard` card shell  
**File:** `src/components/discovery/DiscoveryCard.jsx` L178, `src/components/SearchResultCard.jsx` L1536  
**Visual issue:** Three different card border-radii are used across one page/flow: `12px` (DiscoveryCard), `16px` (FeaturedDiscoveryCard), `24px` (`--gb-radius-card` in SearchResultCard shell). This inconsistency erodes design coherence without serving any visual purpose.  
**Proposed improvement:** Standardize discovery card radius to `16px` (matching FeaturedDiscoveryCard which is the most visually polished). The SearchResultCard shell is on a different page so that can remain at 24px. This changes one value in `DiscoveryCard.jsx`.  
**Risk level:** Low — visual-only change to a single inline radius value.

---

**ID:** VR-08  
**Route:** Signup flow  
**Component:** All signup pages  
**File:** `RestaurantSignupEntry.jsx`, `RestaurantSignup.jsx`, `RestaurantFoundersSignup.jsx`  
**Visual issue:** Multiple inconsistent green shades used across signup steps with no apparent system:  
- `#6EE7B7` (teal-mint) — plan selector eyebrow badge  
- `#22C55E` — app accent  
- `#3DD934` (lime) — form section labels  
- `#1F4E3D` (dark forest) — feature table checkmarks  
- `rgba(110,231,183,0.12)` — eyebrow badge background  
These are not part of the token system and produce a visually incoherent progression through the signup steps.  
**Proposed improvement:** Align all signup accent greens to `#22C55E` (the app token) or its derivatives. The `#3DD934` lime in `RestaurantSignup.jsx` is the most jarring — it reads as a different brand.  
**Risk level:** Medium — touches three files; careful not to break any contrast that a specific color was achieving.

---

**ID:** VR-09  
**Route:** `/restaurant/signup` (plan selector)  
**Component:** Feature comparison table  
**File:** `src/pages/RestaurantSignupEntry.jsx`  
**Visual issue:** The feature comparison table is very dense — no visual grouping, no section headers, checkmarks run for 20+ rows without visual rhythm. First-time visitors are presented with a long table before they understand what Menuply is.  
**Proposed improvement:** Add category dividers (rows with section labels) within the existing table to create logical groupings (e.g., "Discovery & Presence", "Menu Management", "Perks & Deals"). This is pure content structure — no redesign.  
**Risk level:** Medium — editing the table content in JSX; risk is typos or missed rows, not visual regression.

---

**ID:** VR-10  
**Route:** `/search`  
**Component:** Nutrition / Insights tab buttons in `ItemRow`  
**File:** `src/components/SearchResultCard.jsx` ~L1419–1432  
**Visual issue:** The "Nutrition" and "Insights" action buttons are `fontSize: 11`, `padding: "4px 10px"`, `background: rgba(255,255,255,0.06)`. On a white page background, `rgba(255,255,255,0.06)` is transparent — the buttons are essentially invisible until hovered. These are the primary engagement actions for Menuply's core differentiator (nutrition intelligence).  
**Proposed improvement:** Use `background: rgba(18,26,20,0.07)` (very light dark tint, same hue as cards) for these buttons when on a white page, giving them a visible but subtle background. Optionally increase `fontSize` to `12px`.  
**Risk level:** Low-medium — changes button background value in one component; verify contrast on both white and dark card contexts.

---

## Priority 3 — Optional Enhancements

---

**ID:** VR-11  
**Route:** `/` (homepage)  
**Component:** Sticky header search bar  
**File:** `src/pages/GrubbidDiscovery.jsx` ~L1326–1338  
**Visual issue:** The search input uses `background: "var(--gb-color-surface-strong)"` = `#121A14` (near-black) on a white page. The color contrast between the header background (`#ffffff`) and the search bar (`#121A14`) is extreme. This creates visual tension rather than integration.  
**Proposed improvement:** Wrap the search bar in a very subtle container or add a soft inner glow — OR — change search bar background from `#121A14` to `#0f1a10` with a slightly warmer tint. As an alternative: add a subtle `background: rgba(18,26,20,0.06)` to the sticky header band itself to bridge the white page and dark search bar.  
**Risk level:** Medium — the search bar has strict design lock rules. Must not affect placeholder color, icon placement, or focus ring.

---

**ID:** VR-12  
**Route:** `/` (homepage, empty state)  
**Component:** Out-of-market promo section  
**File:** `src/pages/GrubbidDiscovery.jsx` ~L1667–1680  
**Visual issue:** The homepage with no location set is essentially blank: invisible text, two green buttons, 400px of white void. There is no visual engagement hook for new visitors who haven't set a location.  
**Proposed improvement:** Add a very simple background pattern or soft color gradient to the out-of-market area to give it visual presence. This should not require new assets — a CSS gradient using the existing brand color system would be sufficient.  
**Risk level:** Medium — touches the OOM promo block; must not affect behavior or copy visibility.

---

**ID:** VR-13  
**Route:** All (bottom nav)  
**Component:** `BottomNav`  
**File:** `src/components/BottomNav.jsx`  
**Visual issue:** The BottomNav uses emoji icons for Home and Waiter (🏠 and 😊), pixel icons for Basket (🛒), and a text letter "F" for Following. The icon register is visually inconsistent — three icon systems (emoji, pixel, letter) in one four-tab bar.  
**Note:** "F" for Following is intentional per user instruction and must NOT be changed. The inconsistency is documented as a known design decision, not a defect.  
**Proposed improvement:** N/A — acknowledged intentional design.  
**Risk level:** N/A — do not modify.

---

**ID:** VR-14  
**Route:** `/restaurant/signup`  
**Component:** Form fields in `RestaurantSignup.jsx`  
**File:** `src/pages/RestaurantSignup.jsx`  
**Visual issue:** Form input fields use `background: "#0B0F0C"` (near-black) on a white page background. This creates the same dark-on-white inversion as the homepage but in an input context, where users need to clearly read what they've typed. It also contradicts the light plan-selector page that precedes this step in the flow.  
**Proposed improvement:** If keeping the dark form aesthetic, wrap the form fields in a dark container (`#121A14`) to give them consistent context, rather than dark inputs floating on a white page. If moving to light inputs, use `background: #f8f8f6, border: 1px solid #d1d5db` to match the plan selector's light aesthetic.  
**Risk level:** Medium — form input styling; test that validation states, error borders, and placeholder text remain legible.

---

## Top 10 Visual Improvements (Prioritized)

| Rank | ID | Issue | File | Risk |
|---|---|---|---|---|
| 1 | VR-02 | Out-of-market copy invisible (white on white) | `GrubbidDiscovery.jsx` | Low |
| 2 | VR-01 | `color-scheme: dark` on white page (browser UI conflict) | `index.css` | Low |
| 3 | VR-05 | Match explanation text fails WCAG contrast on white | `SearchResultCard.jsx` | Low |
| 4 | VR-04 | Search loading state is a static dark pill — no skeleton | `GrubbidSearchResults.jsx` | Low |
| 5 | VR-03 | Discovery card gap (10px) too tight for 28px shadow radius | `GrubbidDiscovery.jsx` | Very low |
| 6 | VR-06 | Item row separator has no breathing room (padding = 10px) | `SearchResultCard.jsx` | Low |
| 7 | VR-10 | Nutrition/Insights buttons invisible on white (rgba transparent bg) | `SearchResultCard.jsx` | Low-med |
| 8 | VR-07 | Three conflicting border-radii across discovery feed | `DiscoveryCard.jsx` | Low |
| 9 | VR-08 | Signup uses 5 different green shades with no system | Multiple signup files | Medium |
| 10 | VR-09 | Feature comparison table has no visual grouping structure | `RestaurantSignupEntry.jsx` | Medium |

---

## Risk Assessment Summary

**Low / Very Low risk (safe to implement immediately):**  
VR-01, VR-02, VR-03, VR-04, VR-05, VR-06, VR-07

These are all single-property CSS or color changes to isolated components. None touch search logic, routing, BottomNav behavior, or the build/regression system.

**Medium risk (implement with care, one at a time):**  
VR-08, VR-09, VR-10, VR-11, VR-14

VR-08 touches three files. VR-09 modifies table content. VR-10 changes button backgrounds that must be verified in both white-page and dark-card contexts. VR-11 is near the design-locked search bar.

**Do not touch (per guardrails):**  
VR-13 (Following "F" is intentional). Any change to chip behavior, search logic, BottomNav routing, or filter behavior.

---

## Implementation Order (when approved)

1. VR-02 → VR-01 → VR-03 (homepage, three quick wins, no interaction change)
2. VR-05 → VR-06 → VR-07 (search results, reading legibility + card polish)
3. VR-04 (search loading skeleton — slightly more code)
4. VR-10 (nutrition/insights button visibility — verify both contexts)
5. VR-08 → VR-09 → VR-14 (signup consistency — slowest, most files)
