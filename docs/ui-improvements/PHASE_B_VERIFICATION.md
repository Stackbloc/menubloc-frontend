# Visual Restoration Phase B — Verification Report

**Date:** 2026-06-18  
**Status:** Verification only — no code changes  
**Purpose:** Classify VR-01, VR-03, VR-04, VR-07, VR-08, VR-09, VR-10 before any implementation decisions are made.

---

## Classification key

| Label | Meaning |
|---|---|
| **Defect** | Observable divergence from intended behavior or design system — unambiguously wrong |
| **Enhancement** | Functional, but could be better. No objective "wrong." |
| **Subjective** | Aesthetic preference with no clear right answer; high risk of over-engineering |

---

## VR-01 — `color-scheme: dark` conflicts with white page background

### Evidence

**File:** `src/index.css` line 39  
```css
:root {
  color-scheme: dark;         /* line 39 — tells browser: render native controls dark */
  --gb-color-page: #ffffff;   /* line 43 — actual page background is white */
}
```

The page renders with a white background. `color-scheme: dark` instructs the browser to render native controls (scrollbars, form inputs, select dropdowns, date pickers) in dark mode styling. Result: dark scrollbar thumb on a white page — a native OS chrome inconsistency visible on macOS Safari and Windows Chrome with OS dark mode disabled.

**Route affected:** All pages (`:root` is global)  
**Component:** None — CSS-only, browser rendering hint

### Classification

**Defect** — The design token system uses `--gb-color-page: #ffffff` (light background). `color-scheme: dark` contradicts this intent. It's not a subjective preference; it's a wrong signal sent to the browser.

The correct value for a light-background page is `color-scheme: light` or `color-scheme: light dark` (if both modes are supported).

### Risk level

**Low** — Single property change in `:root`. No component logic affected.

### User impact

**Minor** — Affects native browser chrome (scrollbar appearance) and OS-level form control styling. Content and layout are unaffected. Users with light OS themes who notice the dark scrollbar on a white page may experience it as a visual glitch.

---

## VR-03 — Discovery feed card gaps too tight for shadow bleed

### Evidence

**File:** `src/index.css` line 1188  
```css
.disc-feed-grid { display: flex; flex-direction: column; gap: 10px; }
```

**File:** `src/pages/GrubbidDiscovery.jsx` — DiscoveryCard inline style  
```js
boxShadow: "0 8px 28px rgba(0,0,0,0.35)"
```

The shadow has a vertical spread of `28px` with a `10px` gap between cards. At 10px gap, the bottom shadow of one card overlaps the top edge of the next card. On a white page background the shadow is dark (0.35 opacity black), making the overlap visible as a bleed artifact between cards — cards appear to merge rather than float independently.

**Route affected:** `/` (discovery / home page feed, when restaurants are loaded)  
**Component:** `GrubbidDiscovery.jsx`, `.disc-feed-grid` in `index.css`

### Classification

**Enhancement** — The current gap is functional. Cards are visually separated. The shadow bleed is an aesthetic concern, not a broken feature. A gap of `16–20px` would allow the shadow to dissipate before reaching the next card.

### Risk level

**Low** — One `gap` value change in a CSS class. No logic affected.

### User impact

**Minor** — Affects perceived quality of the discovery feed. Dense feed feels cheaper than a feed with breathing room. Most users will not consciously notice; the change reads as "polish" rather than "fix."

---

## VR-04 — Search loading state uses dark-mode pill on light page

### Evidence

**File:** `src/pages/GrubbidSearchResults.jsx` line 2033  
```jsx
{loading && <StatusMessage tone="muted">{t("common.loading")}</StatusMessage>}
```

**File:** `src/index.css` lines 334–360  
```css
.gb-status-message {
  background: var(--gb-color-surface-strong);   /* #121A14 — near-black */
  color: var(--gb-color-ink-soft);              /* #D1D5DB — light gray */
  border: 1px solid var(--gb-color-border);     /* #1F2937 — dark border */
}

.gb-status-message--muted {
  background: var(--gb-color-surface-muted);   /* rgba(12, 17, 13, 0.96) — near-black */
}
```

The search results page has a white background (`--gb-color-page: #ffffff`). The loading state renders as a near-black pill with light text — a dark-mode badge on a light-mode page. The pill is readable (light text on dark = ~11:1 contrast), but it looks jarring and inconsistent with the surrounding page. It also does not include a spinner, animation, or any motion cue — just a static black pill that reads "Loading."

**Route affected:** `/search?q=...` — visible between query submit and results render  
**Component:** `GrubbidSearchResults.jsx` → `StatusMessage` (from `GrubbidPrimitives.jsx`)

### Classification

**Enhancement** — The loading state is functional and readable. The classification as defect depends on whether design intent was "dark badge on white page" or not. Given the page uses `--gb-color-page: #ffffff` and all other text elements use dark-on-white, this is likely an inconsistency from reusing a dark-mode component without a light-mode variant.

### Risk level

**Low** — Affects only the loading state display. Could be fixed with a targeted color override or by adding a new `tone="loading"` variant to `StatusMessage`.

### User impact

**Moderate** — Loading is the first thing users see after submitting a search. A dark pill on white feels like an error state. Users experiencing search delays spend more time looking at this indicator.

---

## VR-07 — Three different card radii with no intentional hierarchy

### Evidence

**File:** `src/components/discovery/DiscoveryCard.jsx` line 178  
```js
borderRadius: 12    // inline — discovery feed cards
```

**File:** `src/components/discovery/FeaturedDiscoveryCard.jsx` line 151  
```js
borderRadius: 16    // inline — featured/hero cards
```

**File:** `src/index.css` lines 68–69  
```css
--gb-radius-card: 24px;         /* SearchResultCard, StatusMessage shell */
--gb-radius-card-tight: 16px;   /* StatusMessage inner, gb-card */
```

**File:** `src/components/SearchResultCard.jsx` — `cardStyle`  
```js
borderRadius: "var(--gb-radius-card)"   // → 24px
```

Three distinct radii in use: 12px (DiscoveryCard inline), 16px (FeaturedDiscoveryCard inline), 24px (SearchResultCard via token). The two discovery cards use hardcoded inline values that bypass the design token system. There is no documented design intent for why 12px/16px/24px are different; they appear to have been set independently at authoring time.

**Routes affected:** `/` (12px and 16px on discovery feed), `/search` (24px on result cards)  
**Components:** `DiscoveryCard.jsx`, `FeaturedDiscoveryCard.jsx`, `SearchResultCard.jsx`

### Classification

**Defect** — The design token `--gb-radius-card: 24px` establishes the intended card radius. The two inline values (12px, 16px) were hardcoded before the token existed or as an oversight. This is a design system inconsistency.

However, implementing a fix carries medium risk: changing DiscoveryCard radius from 12 → 24 is a visible change on the primary landing page.

### Risk level

**Medium** — Three files to touch. The change is visually significant on the homepage (cards would appear noticeably more rounded). Requires baseline screenshot update after implementation.

### User impact

**Minor** — Users do not notice the numeric difference between 12px and 24px radii consciously. The inconsistency reads as "doesn't feel like one app" at a gestalt level. Not functional.

---

## VR-08 — Signup flow uses two competing green palettes

### Evidence

**File:** `src/pages/RestaurantSignup.jsx` — 5 occurrences  
```js
color: "#3DD934"     // lines 57, 136, 161, 172
accentColor: "#3DD934"  // line 186
```

**File:** `src/pages/RestaurantFreeProfileSignup.jsx` — 3 occurrences  
```js
background: "#22C55E"   // line 412
color: "#22C55E"        // line 451
accentColor: "#22C55E"  // line 519
```

**File:** `src/pages/RestaurantSignupEntry.jsx`  
```js
// Uses #1F4E3D (dark forest green) and #6EE7B7 (mint)
color: "#6EE7B7"    // lines 87, 234, 249
background: "#1F4E3D"  // line 254 (button)
```

**Design token:** `src/index.css` line 55  
```css
--gb-color-accent: #22C55E;   /* canonical brand accent */
```

`#3DD934` is a bright lime green (hue ~110°, high saturation). `#22C55E` is the canonical Tailwind green-500 brand accent. They appear similar at a glance but are visually distinct. `#3DD934` appears nowhere else in the app outside `RestaurantSignup.jsx`. The entry page (`RestaurantSignupEntry.jsx`) uses a third green family (`#6EE7B7` mint, `#1F4E3D` forest). 

Three different green families across three signup pages in one flow: lime (`#3DD934`), brand green (`#22C55E`), and forest/mint (`#1F4E3D` / `#6EE7B7`).

**Routes affected:** `/restaurant/signup` (entry), `/restaurant/signup/account` (form), plus free profile variant  
**Components:** `RestaurantSignup.jsx`, `RestaurantFreeProfileSignup.jsx`, `RestaurantSignupEntry.jsx`

### Classification

**Defect** — `#3DD934` is not in the design token system and is not used anywhere outside `RestaurantSignup.jsx`. Its presence is almost certainly an authoring accident — the developer typed a lime green instead of the canonical `#22C55E`. The RestaurantSignupEntry dark/forest palette is intentional (it's a premium branding moment); the lime vs. brand-green split in the account form is not.

### Risk level

**Low** — Color changes only. `RestaurantSignup.jsx` is an isolated form page; changing `#3DD934` → `#22C55E` carries no logic risk.

### User impact

**Minor** — Users completing the signup flow see the color shift from the entry page to the form. Functional experience is unaffected. Brand trust is slightly eroded by the lime-green inconsistency appearing during account creation.

---

## VR-09 — Plan comparison table is dense and may overwhelm on mobile

### Evidence

**File:** `src/components/PlanComparisonTable.jsx`

Table structure:
- 6 category header rows
- 14 feature rows (full list below)
- 3-column layout: Feature label (55% width) + Verified column (110px) + Founder's column (120px)

Feature row labels — longest examples:
```
"Premiere hosted restaurant profile page, including logo, about us, featured dish"
"Unlimited menus, unlimited menu items, with scheduled/timed menu display options"
"Restaurant profile that diner may follow and receive restaurant offers and updates"
```

On mobile (360–393px viewport), the two fixed-width columns (110px + 120px = 230px) leave ~130–163px for the label column, where 13px text with 5–8 word labels wraps to 3–4 lines per row.

The table renders below the plan selection cards on `/restaurant/signup`. Users must scroll past it to reach the bottom of the page.

**Route affected:** `/restaurant/signup`  
**Component:** `PlanComparisonTable.jsx`, imported by `RestaurantSignupEntry.jsx`

### Classification

**Subjective preference** — The table is complete, accurate, and accessible. All feature comparisons are present and checkmarks are legible. The density is inherent to presenting 14 features across 2 plans. Whether a condensed or collapsed design is better depends on conversion strategy — a longer, detailed table may actually improve conversion for Founder's by making the value proposition explicit.

### Risk level

**Medium** — Any restructuring of the table risks losing feature rows or breaking the mobile layout. A collapse/expand design would require significant new component logic.

### User impact

**Negligible** — Users who want to compare plans will scroll through the table. Users who are already decided select a plan from the cards above the table. No functional content is missing or broken.

---

## VR-10 — NutritionPreviewStrip non-primary chips have invisible container boundary

### Evidence

**File:** `src/components/SearchResultCard.jsx` lines 966–993  
**Function:** `NutritionPreviewStrip`

```js
// Primary chip (intent-matched — green, visible)
background: "rgba(34,197,94,0.10)"   // green tint
border: "1px solid rgba(34,197,94,0.28)"
color: "#22C55E"

// Non-primary chip (standard nutrition data — near-invisible container)
background: "rgba(255,255,255,0.06)"   // 6% white on #121A14 card
border: "1px solid rgba(255,255,255,0.08)"   // 8% white border
color: "#D1D5DB"   // light gray text — readable
```

**Card background:** `#121A14` (from `cardStyle` in `SearchResultCard.jsx`)

The text color `#D1D5DB` has ~11:1 contrast against the card background — the TEXT is readable. However, the chip container (`rgba(255,255,255,0.06)` background + `rgba(255,255,255,0.08)` border) is nearly indistinguishable from the card surface. The chip shape as a visual unit — the rounded pill that groups the label as a distinct badge — disappears.

Result: nutrition data like "320 cal" and "22g protein" renders as floating text rather than organized labeled chips. The primary (green) intent chip stands out clearly; the secondary chips do not.

**Routes affected:** `/search?q=...` — any search with nutrition data returned  
**Component:** `NutritionPreviewStrip` inside `SearchResultCard.jsx`

### Classification

**Defect** — The chip as a UI component has two purposes: label the value AND visually group it as a discrete unit. The non-primary chip fulfills the first purpose (text is readable) but fails the second (the container is invisible). The primary chip demonstrates the intended visual design: a background tint + border that makes the chip recognizable as a badge. Non-primary chips should match this pattern with a neutral tint, not `rgba(255,255,255,0.06)`.

The intent-vs-neutral visual hierarchy is correct — primary should be more prominent. But non-primary chips should still have a visible container, just a less prominent one.

### Risk level

**Low** — Color changes only inside `NutritionPreviewStrip`. No logic affected. No effect on chip labels, ordering, or the primary chip green styling.

### User impact

**Moderate** — Nutrition data is core intelligence for dietary decision-making. "320 cal" and "22g protein" are the values users scan when comparing items. When those values appear as floating unorganized text instead of structured chips, the information reads as less authoritative. This is particularly significant for users with dietary goals who rely on the preview data before clicking through.

---

## Summary table

| Item | Issue | Classification | Risk | User impact | Recommended action |
|---|---|---|---|---|---|
| VR-01 | `color-scheme: dark` on white page | **Defect** | Low | Minor | Fix: change to `light` |
| VR-03 | Discovery card gap clips shadow | Enhancement | Low | Minor | Consider: increase gap to 16px |
| VR-04 | Loading state: dark pill on white page | Enhancement | Low | Moderate | Consider: use neutral/light loading style |
| VR-07 | Three card radii (12/16/24px) | **Defect** | Medium | Minor | Fix: standardize DiscoveryCard to 24px token |
| VR-08 | Signup uses `#3DD934` not `#22C55E` | **Defect** | Low | Minor | Fix: replace 5 `#3DD934` instances |
| VR-09 | Plan table is dense on mobile | Subjective | Medium | Negligible | Defer or leave as-is |
| VR-10 | Nutrition chip container invisible | **Defect** | Low | Moderate | Fix: use subtle neutral tint |

**Confirmed defects (objective):** VR-01, VR-07, VR-08, VR-10  
**Enhancements (subjective benefit):** VR-03, VR-04  
**Subjective / defer:** VR-09
