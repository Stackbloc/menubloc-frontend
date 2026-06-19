# Visual Defect Audit — 2026-06-18
# Build: 1a12211 / dpl_DUTTvo1sdPcgD44TDLnUK4UzbWAd
# Method: Code inspection (no browser rendering)

---

## SEVERITY A — Functional UI Defects (content inaccessible or controls broken)

---

### A-001
ID: A-001
Severity: A
Route: /checkout
Component: CheckoutPage
File: src/pages/CheckoutPage.jsx
Lines: 448, 611, 1472
Description: CheckoutPage has two outer containers (lines 448 and 611) with minHeight: "100vh" but no paddingBottom. BottomNav renders at line 1472 with position:fixed. The bottom content of the checkout form (submit button, order summary) is obscured by the fixed BottomNav bar. Users cannot see or tap the final checkout action.
Screenshot: desktop-basket.png / mobile-basket.png (pending manual capture)

---

### A-002
ID: A-002
Severity: A
Route: /account/following
Component: ConsumerFollowing
File: src/pages/consumer/ConsumerFollowing.jsx
Line: 269
Description: Bottom clearance uses hardcoded "calc(80px + env(safe-area-inset-bottom, 0px))" instead of the dynamic token calc(var(--bottom-nav-h, 72px) + 8px). On devices where BottomNav renders taller than 80px (e.g. large safe-area devices), content may still be obscured. Low risk but inconsistent with the token pattern.
Screenshot: mobile-following.png (pending manual capture)

---

### A-003
ID: A-003
Severity: A
Route: /restaurant/onboarding
Component: RestaurantOnboardingApproved
File: src/components/RestaurantOnboardingApproved.jsx
Line: 50
Description: Injected <style> tag sets padding-bottom: 80px hardcoded on .restaurant-onboarding-page .page. This page has no BottomNav but SiteFooter is suppressed (hidePublicChrome=true). Hardcoded 80px is vestigial and does not use the CSS token. Minor risk only.
Screenshot: desktop-onboarding.png (pending manual capture)

---

## SEVERITY B — Visual Quality Defects (visible but functional)

---

### B-001
ID: B-001
Severity: B
Route: / (homepage) and /search
Component: GrubbidDiscovery, GrubbidSearchResults
File: src/index.css
Line: 38-43
Description: color-scheme: dark is set on :root but --gb-color-page is #ffffff (white). This causes a mismatch: the browser renders dark native UI chrome (scrollbars, input autofill backgrounds, select dropdowns) while the page background is white. Native inputs and selects may show dark backgrounds inside a white page.
Screenshot: desktop-home.png (pending manual capture)

---

### B-002
ID: B-002
Severity: B
Route: / (homepage)
Component: GrubbidDiscovery / DiscoveryCard
File: src/pages/GrubbidDiscovery.jsx, src/components/discovery/DiscoveryCard.jsx
Lines: GrubbidDiscovery 1188 (.disc-feed-grid gap: 10px); DiscoveryCard line 180 background: var(--gb-color-surface-strong) = #121A14
Description: Feed cards use dark background (#121A14) on a white page (#ffffff). The 10px gap between cards exposes raw white page background between dark cards, creating a jarring light stripe between dark elements. Visually inconsistent — cards appear to float on a mismatched background.
Screenshot: desktop-home.png / mobile-home.png (pending manual capture)

---

### B-003
ID: B-003
Severity: B
Route: /search
Component: SearchResultCard
File: src/components/SearchResultCard.jsx
Line: 82
Description: Card wrapper uses border: "1px solid rgba(255,255,255,0.03)" — designed for dark backgrounds. On the white search page (--gb-color-page: #ffffff), this border is invisible. Cards have no visual separation from each other or from the page background. Results appear as an undifferentiated list.
Screenshot: desktop-search.png / mobile-search.png (pending manual capture)

---

### B-004
ID: B-004
Severity: B
Route: /search
Component: GrubbidSearchResults
File: src/pages/GrubbidSearchResults.jsx
Line: 1966
Description: Sticky search header uses borderBottom: "1px solid #1F2937" (dark color hardcoded) on a white page background. A dark line separates the header from the page content. Inconsistent with the page's light theme — the header border should match the page's light border vocabulary.
Screenshot: desktop-search.png (pending manual capture)

---

### B-005
ID: B-005
Severity: B
Route: /restaurant/signup
Component: RestaurantSignupEntry
File: src/pages/RestaurantSignupEntry.jsx
Lines: 114-118
Description: Plan cards use a mixed dark/light theme. Non-featured cards: background #ffffff, color #101828 (light theme). Featured card: gradient from #0f1720 to #1f4e3d to #eef6f1, color #ffffff. The page wrapper uses var(--gb-color-page) = white. The featured dark card is visually isolated on a white page — no containing surface to frame the dark card. The contrast between white page and dark featured card is abrupt.
Screenshot: desktop-signup.png / mobile-signup.png (pending manual capture)

---

### B-006
ID: B-006
Severity: B
Route: /restaurant/signup
Component: RestaurantSignupEntry
File: src/pages/RestaurantSignupEntry.jsx
Line: 58
Description: Page has padding-bottom: 72px hardcoded but no BottomNav and SiteFooter renders at the bottom. No clearance is needed for BottomNav here, but the bottom padding is inconsistent — SiteFooter already handles its own spacing via calc(var(--bottom-nav-h, 72px) + 8px). Cosmetic only.
Screenshot: desktop-signup.png (pending manual capture)

---

### B-007
ID: B-007
Severity: B
Route: /waiter
Component: FoodInterestsPage
File: src/pages/FoodInterestsPage.jsx
Line: 156
Description: Waiter page uses maxWidth: 720 while homepage and search use maxWidth: 576. Switching between home/search and waiter produces a noticeable width jump in the centered content column. Minor layout inconsistency between primary routes.
Screenshot: desktop-waiter.png (pending manual capture)

---

## SEVERITY C — Enhancement Ideas (not defects)

---

### C-001
ID: C-001
Severity: C
Route: / (homepage)
Description: Homepage could use a consistent dark background behind the feed (matching card color #121A14) so white gaps between dark cards disappear. Would require changing --gb-color-page or the feed container background. Low priority, requires deliberate decision.

### C-002
ID: C-002
Severity: C
Route: /search
Description: Search result card borders could be changed to rgba(0,0,0,0.08) to work on light backgrounds, giving cards visible definition without a full dark-theme switch.

### C-003
ID: C-003
Severity: C
Route: /build-info
Description: BuildInfoPage has no header, back link, or BottomNav. Fine for an internal diagnostic page. Could add a simple "← Back" link for convenience.

---

## Summary

| Severity | Count |
|----------|-------|
| A (functional) | 3 |
| B (visual quality) | 7 |
| C (enhancement) | 3 |

## Highest Priority for Next Patch

A-001: CheckoutPage has no BottomNav clearance — bottom of checkout form is inaccessible.
B-002: White gaps between dark cards on homepage — most visually jarring issue.
B-003: Invisible card borders on search results — cards have no definition.
