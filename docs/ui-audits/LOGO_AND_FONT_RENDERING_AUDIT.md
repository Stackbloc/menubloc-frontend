# Logo and Font Rendering Audit

**Date:** 2026-06-18  
**Scope:** Logo rendering + text legibility across all major Menuply screens  
**Phase 1:** Audit only — no code changes  
**Phase 2:** Fix Severity A and B issues

---

## Severity Key

| Level | Meaning |
|---|---|
| **A** | Functional defect — content invisible, unreadable, or broken |
| **B** | Visual defect — visible but degraded (wrong asset, inconsistent rendering) |
| **C** | Polish — minor aesthetic issue, no legibility impact |

---

## Screen-by-Screen Audit

---

### Screen 1: `/` — Homepage (GrubbidDiscovery)

**Component:** `src/pages/GrubbidDiscovery.jsx:1273`  
**Logo used:** `BrandLogo height={36} radius={8} matchPageBackground={false}`

**Logo status:** Correct  
- Header background: `var(--gb-color-page)` = `#ffffff` (white)
- `pageColor` defaults to `"var(--gb-color-page)"` → `isDarkPageColor()` = false → wordmark color = `#0B0F0C` (dark)
- Dark wordmark text on white header = legible ✓
- X-mark image clips left ~18% of `menuplyofficialsmalllogo.png` at 36px height → 35×36px icon visible ✓

**Font status:** Legible  
- Hamburger/deals/account links use explicit dark/accent colors ✓
- `color: "var(--gb-color-ink-muted)"` = `#9CA3AF` — used on icon controls only, not body text ✓

**Issues:** None  
**Severity:** —

---

### Screen 2: `/search?q=burger&city=Los+Angeles&state=CA` — Search Results (GrubbidSearchResults)

**Component:** `src/pages/GrubbidSearchResults.jsx:1976`  
**Logo used:** `BrandLogo height={48} radius={14}`

**Logo status:** Correct  
- Sticky header background: `var(--gb-color-page)` = `#ffffff`
- No explicit `pageColor` prop → defaults → wordmark color = `#0B0F0C` (dark on white) ✓
- Image clips left 18% at 48px height → 47×48px icon ✓

**Font status:** Legible  
- Query display text: `color: "#0B0F0C"` on white ✓
- Location pill: `color: "#22C55E"` with green background ✓
- Result cards use `var(--gb-color-surface-strong)` = `#121A14` dark cards with light text ✓

**Issues:** None  
**Severity:** —

---

### Screen 3: `/waiter` — Waiter / Food Intelligence (FoodInterestsPage)

**Component:** `src/pages/FoodInterestsPage.jsx`  
**Logo used:** None — no Menuply logo on this page

**Logo status:** N/A — no logo rendered

**Font status:** Legible  
- Page: `background: var(--gb-color-page)` (white), `color: var(--gb-color-ink)` (light — but all content is in explicit-colored sections)
- Header card: `background: linear-gradient(135deg, rgba(20,31,22,0.98), rgba(13,19,16,0.94))` (dark) with `color: "#F9FAFB"` / `#86EFAC` ✓
- Section panels: `background: rgba(17,24,20,0.88)` (dark) — text inside uses explicit light colors ✓
- Briefing cards: dark backgrounds, explicit text colors ✓
- Empty/loading states: `color: "#9CA3AF"` or `"#6B7280"` — explicit ✓

**Issues:** None  
**Severity:** —

---

### Screen 4: `/account/following` — Consumer Following (ConsumerFollowing)

**Component:** `src/pages/consumer/ConsumerFollowing.jsx:118`  
**Logo used:** Via `StickyPageHeader` (shared header — `BrandLogo height={48} radius={14}`)

**Logo status:** Correct — via StickyPageHeader ✓

**Font status — DEFECT:**  
`StickyPageHeader` is called without `barBackground`:
```jsx
<StickyPageHeader title={t("consumer.following.title", "Following")} />
```

In `StickyPageHeader.jsx:133`:
```jsx
<span style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
  {title}
</span>
```

The header background defaults to `headerBg = barBackground ?? "var(--gb-color-page)"` = `#ffffff` (white).  
`color: "#FFFFFF"` on `background: #ffffff` = **1:1 contrast — completely invisible.**

The "Following" page title rendered in the sticky header is invisible on every device.

**Issues:**
| # | File | Line | Issue | Severity |
|---|---|---|---|---|
| FONT-1 | `src/components/StickyPageHeader.jsx` | 133 | Title `color: "#FFFFFF"` invisible on white header background | **A** |

---

### Screen 5: `/checkout` — Checkout (CheckoutPage)

**Component:** `src/pages/CheckoutPage.jsx:449`  
**Logo used:** Via `StickyPageHeader`

**Logo status:** Correct — via StickyPageHeader ✓

**Font status — DEFECT:**  
Same issue as Screen 4. Called without `barBackground`:
```jsx
<StickyPageHeader title={t("checkout.title", "Checkout")} />
```
Title `color: "#FFFFFF"` on white header background = invisible.

Page content body is inside `#121A14` / `#1A2419` dark cards — text contrast there is fine.

**Issues:** FONT-1 (same root cause)  
**Severity:** A

---

### Screen 6: `/restaurant/signup` — Restaurant Signup Entry (RestaurantSignupEntry)

**Component:** `src/pages/RestaurantSignupEntry.jsx`  
**Logo used:** `BrandLockup logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#0B0F0C" }}`

**Logo status:** Correct  
- `pageColor: "#0B0F0C"` (dark) → `isDarkPageColor` = true → wordmark `#FFFFFF` (white) ✓
- `matchPageBackground` defaults to `true` → logo span background = `#0B0F0C` (dark) ✓
- Dark logo box with white wordmark = legible ✓

**Font status — DEFECT:**  
Page background (`styles.page`): `background: var(--gb-color-page)` = `#ffffff` (white)  
Hero section (`styles.hero` and `heroContent`): **no background** — transparent, shows white page

Hero texts use near-white colors:
```jsx
// h1 - "Choose your plan"
<h1 style={{ color: "#F8F4EA" }}>

// Subtitle
<div style={{ color: "rgba(248,244,234,0.72)" }}>

// styles.foodTruckPrompt
foodTruckPrompt: { color: "rgba(248,244,234,0.8)" }
```

Contrast check:
- `#F8F4EA` on `#ffffff` ≈ 1.09:1 — near-invisible
- `rgba(248,244,234,0.72)` on `#ffffff` ≈ 1.03:1 — essentially invisible
- `rgba(248,244,234,0.8)` on `#ffffff` ≈ 1.04:1 — essentially invisible

Founders notice (`styles.foundersNotice.color: "rgba(248,244,234,0.88)"`): also near-white on white = low contrast.

Plan cards below are fine (non-featured card: `color: "#101828"` dark on white ✓).

**Issues:**
| # | File | Line | Issue | Severity |
|---|---|---|---|---|
| FONT-2 | `src/pages/RestaurantSignupEntry.jsx` | 352–358 | `h1` `color: "#F8F4EA"` ~1.09:1 contrast on white page | **A** |
| FONT-3 | `src/pages/RestaurantSignupEntry.jsx` | 361–372 | subtitle `color: "rgba(248,244,234,0.72)"` near-invisible on white | **A** |
| FONT-4 | `src/pages/RestaurantSignupEntry.jsx` | styles object `foodTruckPrompt` | `color: "rgba(248,244,234,0.8)"` near-invisible | **B** |
| FONT-5 | `src/pages/RestaurantSignupEntry.jsx` | styles object `foundersNotice` | `color: "rgba(248,244,234,0.88)"` low contrast | **B** |

---

### Screen 7: `/restaurant/onboarding` — Restaurant Onboarding (RestaurantOnboardingApproved)

**Component:** `src/components/RestaurantOnboardingApproved.jsx:350`  
**Logo used:** Raw `<img src="/menuplyofficialsmalllogo.png" style={{ height: "36px", width: "auto" }} />`

**Logo status:** Requires visual verification  
- Page background: `#141a14` (dark) ✓ designed for dark
- Image: 1501×280px RGBA PNG, displayed at 36px height ≈ 193px wide (full image)
- This renders the complete logo asset (not just the X-mark crop that `BrandLogo` applies)
- If the logo graphic elements are light-colored (designed for dark backgrounds), this is fine
- If logo elements are dark-colored (designed for light backgrounds), they would be barely visible on `#141a14`
- **Action: visual check required** — asset appears to be designed for dark backgrounds based on "official small logo" naming

**Font status:** Legible  
- All text uses `#f0ede6`, `#c9c4bb`, `#ded9d0` on `#141a14` background — dark page, light text ✓

**Issues:** C — logo display uses raw `<img>` (full width) instead of `BrandLogo` component (X-mark crop); functional but inconsistent usage pattern  
**Severity:** C (not implementing)

---

### Screen 8: `/browse-menus` — Browse Menus (BrowseMenus)

**Component:** `src/pages/BrowseMenus.jsx:552`  
**Logo used:** Via `StickyPageHeader`

**Logo status:** Correct — via StickyPageHeader ✓

**Font status — DEFECT:**  
Same root cause as FONT-1. Called without `barBackground`:
```jsx
<StickyPageHeader
  title={locationLabel
    ? t("browse.nearTitle", `Browsing Near ${locationLabel}`)
    : t("browse.title")}
/>
```
Title `color: "#FFFFFF"` on white header = invisible. "Browsing Near Los Angeles" is never visible.

Main content (sidebar card, restaurant cards) uses explicit dark text on dark `.gb-card` surfaces ✓.

**Issues:** FONT-1 (same root cause)  
**Severity:** A

---

### Screen 9: Restaurant Profile Page (RestaurantPublicPage)

**Component:** `src/pages/RestaurantPublicPage.jsx:887–902`  
**Logo used:** Restaurant's own uploaded logo (user-provided URL)

**Logo status — VISUAL DEFECT:**  
```jsx
<img
  src={logoUrl}
  alt={`${name} logo`}
  style={{
    width: 64,
    height: 64,
    borderRadius: 10,
    objectFit: "cover",   // ← clips the logo
    ...
  }}
/>
```

`objectFit: "cover"` fills the 64×64 container by scaling up and cropping.  
For non-square logos (most restaurant logos are wide/rectangular), the logo is cropped to a center square, potentially hiding the restaurant name text within the logo.

Contrast: `MenuItemDetailPage.jsx:1521` uses `objectFit: "contain"` for the same type of asset — correct behavior for logos.

**Font status:** Legible — restaurant name, address, and description use appropriate colors for their card backgrounds.

**Issues:**
| # | File | Line | Issue | Severity |
|---|---|---|---|---|
| LOGO-1 | `src/pages/RestaurantPublicPage.jsx` | 895 | `objectFit: "cover"` clips restaurant logos; should be `contain` like MenuItemDetailPage | **B** |

---

### Screen 10: Menu Item Detail Page (MenuItemDetailPage)

**Component:** `src/pages/MenuItemDetailPage.jsx`  
**Logo used (Menuply):** Via `StickyPageHeader:275`. Logo: correct via StickyPageHeader.  
**Logo used (restaurant):** `src/pages/MenuItemDetailPage.jsx:1518` — `objectFit: "contain"` ✓

**Logo status — Menuply:** Correct ✓  
**Logo status — restaurant:** Correct, `objectFit: "contain"` ✓

**Font status — DEFECT:**  
Same root cause as FONT-1. `PageShell` at line 275:
```jsx
<StickyPageHeader title={stickyTitle} />
```
No `barBackground` → title `color: "#FFFFFF"` on white header = invisible. Item name shown in sticky header is invisible.

Other content (Nutrition, Insights, Similar tabs) uses explicit colors appropriate to their dark card surfaces ✓.

**Issues:** FONT-1 (same root cause)  
**Severity:** A

---

### Screen 11: `/build-info` — Build Info (BuildInfoPage)

**Component:** `src/pages/BuildInfoPage.jsx`  
**Logo used:** None

**Logo status:** N/A — no logo

**Font status:** Legible  
- All text uses explicit dark colors: `#111827`, `#374151`, `#6b7280` on white background ✓
- Monospace table values: `color: "#111827"` ✓
- Error state: `color: "#dc2626"` on `#fef2f2` background ✓

**Issues:** None  
**Severity:** —

---

## Issue Summary

| ID | File | Line | Screen | Description | Severity | Fix |
|---|---|---|---|---|---|---|
| FONT-1 | `StickyPageHeader.jsx` | 133 | /browse-menus, /checkout, /account/following, menu-item-detail | Title `color: "#FFFFFF"` invisible on white header | **A** | Use dark color when `barBackground` absent |
| FONT-2 | `RestaurantSignupEntry.jsx` | 352 | /restaurant/signup | h1 `color: "#F8F4EA"` ~1.09:1 contrast on white | **A** | `#0B0F0C` |
| FONT-3 | `RestaurantSignupEntry.jsx` | 362 | /restaurant/signup | Subtitle `rgba(248,244,234,0.72)` invisible | **A** | `#374151` |
| FONT-4 | `RestaurantSignupEntry.jsx` | styles | /restaurant/signup | `foodTruckPrompt` `rgba(248,244,234,0.8)` near-invisible | **B** | `#374151` |
| FONT-5 | `RestaurantSignupEntry.jsx` | styles | /restaurant/signup | `foundersNotice` `rgba(248,244,234,0.88)` low contrast | **B** | `#101828` |
| LOGO-1 | `RestaurantPublicPage.jsx` | 895 | /restaurants/:id | Restaurant logo `objectFit: "cover"` clips non-square logos | **B** | `objectFit: "contain"` |

---

## Screens Cleared (No Issues)

| Screen | Logo | Font |
|---|---|---|
| `/` | ✓ | ✓ |
| `/search` | ✓ | ✓ |
| `/waiter` | N/A | ✓ |
| `/restaurant/onboarding` | Needs visual check (C) | ✓ |
| `/build-info` | N/A | ✓ |

---

## Phase 2 — Fix Plan

Only Severity A and B issues are implemented.

| Step | Target | Change |
|---|---|---|
| 1 | `StickyPageHeader.jsx:133` | `color: barBackground ? "#FFFFFF" : "#0B0F0C"` |
| 2 | `RestaurantSignupEntry.jsx` h1 | `color: "#0B0F0C"` |
| 3 | `RestaurantSignupEntry.jsx` subtitle | `color: "#374151"` |
| 4 | `RestaurantSignupEntry.jsx` `styles.foodTruckPrompt` | `color: "#374151"` |
| 5 | `RestaurantSignupEntry.jsx` `styles.foundersNotice` | `color: "#101828"` |
| 6 | `RestaurantPublicPage.jsx:895` | `objectFit: "contain"` |
