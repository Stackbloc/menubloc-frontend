# My Month in Food — Redesign Spec (for implementation)

Reference build (visual/interaction source of truth): https://claude.ai/artifact/QcD6A8XcDxoYEcG7DnHh98
Route: `menuply.com/my-menuply/month-in-food` (unchanged)

## What's changing and why
- Removed the full-bleed hero photo (granite countertop) — it wasn't tied to any content and broke out of the viewport on narrower screens.
- Stats field had 7 items (odd/unbalanced). Cut to 6 by moving **Restaurant $ spend** into the Food Mood card.
- Replaced the sidebar layout (donut chart + Cravings + Plans competing for attention next to the main feed) with a single-column vertical scroll. Cravings and Plans & Events now sit as a two-up module further down the page instead of a persistent sidebar.
- New visual language: editorial/food-magazine feel instead of generic SaaS dashboard cards.

## Design tokens

**Color** (define as CSS custom properties; include dark-mode pairs)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--cream` | `#F7F2E7` | `#171410` | page background |
| `--paper` | `#FFFDF8` | `#1E1B16` | cards, photo borders |
| `--forest` | `#16302A` | `#0F2620` | Food Mood card, footer, primary dark surface |
| `--moss` | `#4B6F55` | `#7FA085` | secondary green accents, "See all" links |
| `--amber` | `#DE9E33` | `#E7AC4C` | primary accent (mood headline, stat highlight) |
| `--clay` | `#B6472F` | `#D9694C` | sparing use — event dates only |
| `--ink` | `#231F19` | `#F1EBDD` | body text |
| `--ink-soft` | `#5B5548` | `#B9AF9A` | secondary/meta text |
| `--hairline` | `#DDD3BE` | `#3A352A` | dividers, card borders |

**Type**
- Display/headlines/big numbers: **Fraunces** (serif, variable weight). Italic weight used specifically for the mood word ("*Adventurous*").
- Body/UI/labels: **Public Sans**.
- No all-caps labels; sentence case throughout.

**Layout**
- Single column, max-width 600px, centered. No sidebar.
- Section vertical rhythm: ~56px between major sections.

## Section-by-section

### 1. Masthead
- Month selector (prev/next arrows + "September 2026" label) — same behavior as current.
- Headline: "My month in *food*." (Fraunces, ~48–56px, italic on "food").
- Tagline (editable copy field) + byline ("Recapped by **[display name]**").

### 2. Hero photo collage
- Pulls the user's 2 most recent/best "Moments to Remember" photos (not a fixed unrelated stock/banner image). If fewer than 2 moment photos exist this month, fall back to a text-only hero (no placeholder image).
- Two photos in an offset/rotated collage (small rotation ±3–4deg, white/paper border, soft shadow) — max height ~300px combined, contained within the column (no viewport overflow at any breakpoint).
- Overlaid "meals logged" count badge (dark green chip, bottom-right of collage) — pulls from the existing `mealsLogged` total.

### 3. By the numbers
- 6 stats, 3×2 grid, hairline dividers: **Dishes, Restaurants, @home meals, Photos & videos, Moments shared, Total meals.**
- **Restaurant $ spend removed from this grid** — moved to Food Mood card (see below).
- If any future stat needs to be added, keep the total count even (add/remove in pairs, or reflow to a 2×N grid) rather than shipping an odd count.

### 4. Restaurants I visited
- Horizontal scroll, same data source as current (`restaurantsVisited` list).
- Card = colored monogram avatar (first letter of name, cycle through a small palette) + name + city/state. No dependency on restaurant logo assets — avoids empty gray placeholder boxes when no photo exists.
- "See all" link top-right → existing restaurants list view.

### 5. @home meals
- Same list/data as current (`homeMeals`), same fields (title, meal type, date).
- Meal type shown lowercase (not capitalized), date shown as "Sept 16" format.
- "Log meal" link top-right, same action as current.

### 6. Food mood this month
- Dark green card. Large italic mood word (e.g. "Adventurous") in amber.
- 2×2 fact grid: **Most logged, Drink of choice, Go-to spot, Restaurant spend** (this last one is the relocated `$` stat — full-width row, separated by a hairline, since it's numeric/financial rather than a taste preference like the other three).

### 7. Moments to remember
- 2-column photo grid (not a single giant banner). Each photo gets a small caption: restaurant name + date, pulled from the photo's associated meal log entry.

### 8. Cravings + Plans & events (two-up)
- Two cards side by side (stacks to 1 column under ~420px).
- **Cravings card:** "Take Me Out" toggle state shown as a subtext line; up to 2 suggested spots (name + city).
- **Plans & events card:** upcoming eating plans/events, each as date (Fraunces, clay-red) + title + status ("Join Me is open").

### 9. Footer / share
- Menuply wordmark (italic Fraunces, amber), tagline, "Made with ♥ on Menuply."
- QR code + "Copy link" button — same functionality as current (generates/copies the shareable recap URL).

### Bottom app nav
- Unchanged functionally (Home / Waiter / Menu Browser / close / Basket). Restyle only: swap icon/text colors to the new palette, active tab in amber.

## Responsive / accessibility notes
- Test down to 360px width — nothing (photos, stat grid, two-up cards) should cause horizontal scroll on the page itself.
- Maintain visible keyboard focus states on month-selector arrows, links, and the copy-link button.
- Respect `prefers-reduced-motion` — no scroll-triggered animation is used in the reference build, so nothing to strip, but avoid adding any later.
- Support light/dark via `prefers-color-scheme` using the token table above.

## Open questions for design/product before build
- Confirm fallback behavior when a user has 0–1 "moments" photos this month (hero and Section 7 both depend on that data).
- Confirm whether "Restaurant spend" should link out to a spend-detail view, or stay static text.
