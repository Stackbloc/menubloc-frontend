# Site-Wide Legibility and Logo Audit

**Date:** 2026-06-18  
**Auditor:** Claude Code  
**Production URL:** https://menuply.com  
**Screenshot method:** Playwright (Chromium, 390×844 viewport, 2x DPR) against live production  
**Screenshot directory:** `docs/ui-audits/screenshots/`

---

## Severity Key

| Level | Meaning |
|---|---|
| **A** | Functional defect — text is invisible, unreadable, or logo is broken/clipped |
| **B** | Visual defect — text is legible with effort but fails WCAG AA contrast; logo renders with quality loss |
| **C** | Polish — minor aesthetic issue, no legibility impact |

---

## Root Cause

The app's CSS variables were set up for a **dark-background design**:

```css
--gb-color-ink:        #F9FAFB  /* near-white */
--gb-color-ink-strong: #FFFFFF  /* white */
--gb-color-ink-soft:   #D1D5DB  /* light gray, contrast ~1.6:1 on white */
--gb-color-ink-muted:  #9CA3AF  /* medium gray, contrast ~2.6:1 on white */
--gb-color-page:       #ffffff  /* white */
```

Pages with `background: var(--gb-color-page)` (white) that use `var(--gb-color-ink*)` for text produce white/near-white text on a white background. CSS classes `.gb-page-title`, `.gb-page-description`, `.gb-section-title` all use these tokens and are invisible on white pages.

---

## Confirmed Defects by Screen

---

### Screen: `/terms` — Terms of Use

**Screenshot:** `screenshots/crop/terms-hero.png`, `screenshots/crop/terms-body.png`

| ID | Element | File | Line | Current Value | Correct Value | Contrast | Sev |
|---|---|---|---|---|---|---|---|
| T-1 | Page title "Terms of Use" | `LegalDocumentPage.jsx` (via CSS) | — | `.gb-page-title { color: var(--gb-color-ink-strong) }` = `#FFFFFF` on white | `#0B0F0C` | 1:1 → invisible | **A** |
| T-2 | Page description | `LegalDocumentPage.jsx` (via CSS) | — | `.gb-page-description { color: var(--gb-color-ink-soft) }` = `#D1D5DB` on white | `#374151` | 1.6:1 → very low | **A** |
| T-3 | Section headings (h2) | `LegalDocumentPage.jsx` | 12 | `color: "var(--gb-color-ink-strong)"` = `#FFFFFF` | `#0B0F0C` | 1:1 → invisible | **A** |
| T-4 | Body paragraphs | `LegalDocumentPage.jsx` | 19 | `color: "var(--gb-color-ink-soft)"` = `#D1D5DB` | `#374151` | 1.6:1 → very low | **A** |
| T-5 | Eyebrow label "TERMS OF USE" | `index.css` | — | `.gb-page-eyebrow { color: var(--gb-color-ink-muted) }` = `#9CA3AF` | `#6B7280` | 2.6:1 → low | **B** |

**Evidence:** `terms-hero.png` — blank space where "Terms of Use" title should appear between breadcrumb and eyebrow. Body text renders as very faint gray. Section headings invisible.

---

### Screen: `/privacy` — Privacy Policy

**Screenshot:** `screenshots/crop/privacy-hero.png`

| ID | Element | File | Line | Current Value | Correct Value | Sev |
|---|---|---|---|---|---|---|
| P-1 | Page title "Privacy Policy" | `LegalDocumentPage.jsx` (via CSS) | — | `.gb-page-title { color: var(--gb-color-ink-strong) }` = `#FFFFFF` | `#0B0F0C` | **A** |
| P-2 | Page description | same | — | `.gb-page-description { color: var(--gb-color-ink-soft) }` = `#D1D5DB` | `#374151` | **A** |
| P-3 | Section headings | `LegalDocumentPage.jsx` | 12 | `color: "var(--gb-color-ink-strong)"` | `#0B0F0C` | **A** |
| P-4 | Body paragraphs | `LegalDocumentPage.jsx` | 19 | `color: "var(--gb-color-ink-soft)"` | `#374151` | **A** |

**Evidence:** Same root cause as Terms. Identical component (`LegalDocumentPage`).

---

### Screen: `/about` — About Menuply

**Screenshot:** `screenshots/crop/about-hero.png`, `screenshots/crop/about-body.png`

| ID | Element | File | Line | Current Value | Correct Value | Sev |
|---|---|---|---|---|---|---|
| A-1 | Page title "About Menuply" | `AboutMenuply.jsx` via `.gb-page-title` | — | `color: var(--gb-color-ink-strong)` = `#FFFFFF` | `#0B0F0C` | **A** |
| A-2 | Hero description | via `.gb-page-description` | — | `color: var(--gb-color-ink-soft)` = `#D1D5DB` | `#374151` | **A** |
| A-3 | Body paragraphs | `AboutMenuply.jsx` | 11 | `paragraphStyle.color: "var(--gb-color-ink-soft)"` = `#D1D5DB` | `#374151` | **A** |
| A-4 | Statement paragraphs (bold) | `AboutMenuply.jsx` | 19 | `statementStyle.color: "var(--gb-color-ink-strong)"` = `#FFFFFF` | `#0B0F0C` | **A** |
| A-5 | Intro paragraph inline | `AboutMenuply.jsx` | 48 | `color: "var(--gb-color-ink-strong)"` = `#FFFFFF` | `#0B0F0C` | **A** |
| A-6 | Blockquote inline | `AboutMenuply.jsx` | 64 | `color: "var(--gb-color-ink-strong)"` = `#FFFFFF` | `#0B0F0C` | **A** |

**Evidence:** `about-hero.png` — blank space where "About Menuply" heading should be. `about-body.png` — body text visible as very faint light gray; blockquote area is blank (invisible white text on white background).

---

### Screen: `/contact` — Contact

**Screenshot:** `screenshots/crop/contact-hero.png`

| ID | Element | File | Line | Current Value | Correct Value | Sev |
|---|---|---|---|---|---|---|
| C-1 | Page title "Contact" | `Contact.jsx` via `.gb-page-title` | — | `color: var(--gb-color-ink-strong)` = `#FFFFFF` | `#0B0F0C` | **A** |
| C-2 | Hero description | via `.gb-page-description` | — | `color: var(--gb-color-ink-soft)` = `#D1D5DB` | `#374151` | **A** |
| C-3 | Intro paragraph | `Contact.jsx` | 21 | `introStyle.color: "var(--gb-color-ink-soft)"` = `#D1D5DB` | `#374151` | **A** |
| C-4 | Contact row labels | `Contact.jsx` | 34 | `labelStyle.color: "var(--gb-color-ink)"` = `#F9FAFB` | `#0B0F0C` | **A** |

**Evidence:** `contact-hero.png` — no visible "Contact" page title between breadcrumb and hero description. Description text appears as very faint gray. "MENU SUBMISSIONS" label is near-invisible.

---

### Screen: `/restaurant/signup` — Restaurant Signup Entry

**Screenshot:** `screenshots/crop/signup-entry-top.png`

| ID | Element | File | Line | Current Value | Correct Value | Sev |
|---|---|---|---|---|---|---|
| SE-1 | "Choose your plan" heading | `RestaurantSignupEntry.jsx` | ~356 | `color: "#F8F4EA"` on white (~1.09:1) | `#0B0F0C` | **A** |
| SE-2 | Subtitle "Select the plan..." | `RestaurantSignupEntry.jsx` | ~365 | `color: "rgba(248,244,234,0.72)"` on white | `#374151` | **A** |
| SE-3 | Founders notice text | `RestaurantSignupEntry.jsx` | styles.foundersNotice | `color: "rgba(248,244,234,0.88)"` on white | `#101828` | **A** |
| SE-4 | Food Truck prompt | `RestaurantSignupEntry.jsx` | styles.foodTruckPrompt | `color: "rgba(248,244,234,0.8)"` on white | `#374151` | **B** |

**Evidence:** `signup-entry-top.png` — "Choose your plan" heading barely visible (cream on white). Subtitle is nearly invisible. Founders notice text barely readable on pale yellow box.

*Note: SE-1 through SE-4 were fixed in local commit `b5c846e` but not yet deployed to production.*

---

### Screen: `/restaurant/signup/account` — Restaurant Signup Account

**Screenshot:** `screenshots/crop/signup-account-top.png`

| ID | Element | File | Line | Current Value | Correct Value | Sev |
|---|---|---|---|---|---|---|
| SA-1 | "Create your restaurant account" heading | `RestaurantSignup.jsx` | 45 | Inherits `styles.page.color: "var(--gb-color-ink)"` = `#F9FAFB` on white | `#0B0F0C` | **A** |
| SA-2 | Subtitle "Enter your restaurant details..." | `RestaurantSignup.jsx` | 46 | `pageSubtitle.color: "rgba(248,244,234,0.82)"` on white | `#374151` | **A** |
| SA-3 | Sub-brand label "FOR RESTAURANTS" | `RestaurantSignup.jsx` | 44 | `subbrand.color: "rgba(248,244,234,0.62)"` on white | `#6B7280` | **B** |

**Evidence:** `signup-account-top.png` — "Create your restaurant account" heading visible only as very faint cream outline. Subtitle nearly invisible.

---

### Screen: StickyPageHeader title (browse, checkout, top-picks, menu-item-detail)

**Affected pages:** `/browse-menus`, `/checkout`, `/top-picks`, `/menu-items/:id`, and any page with `<StickyPageHeader title={...} />` but no `barBackground` prop.

| ID | Element | File | Line | Current Value | Correct Value | Sev |
|---|---|---|---|---|---|---|
| SPH-1 | Header title text | `StickyPageHeader.jsx` | 133 | `color: "#FFFFFF"` on `headerBg = "var(--gb-color-page)"` = white | `color: barBackground ? "#FFFFFF" : "#0B0F0C"` | **A** |

**Evidence:** `toppicks-top.png` — header bar shows no visible page title despite TopPicksPage passing `title` prop. Confirmed by code: title `color: "#FFFFFF"` is hardcoded, header background defaults to white.

*Note: SPH-1 was fixed in local commit `b5c846e` but not yet deployed.*

---

### Screen: `/` — Homepage (footer)

**Screenshot:** `screenshots/crop/homepage-footer.png`

| ID | Element | File | Line | Current Value | Correct Value | Contrast | Sev |
|---|---|---|---|---|---|---|---|
| HF-1 | Footer nav links | `SiteFooter.jsx` | 54–69 | `color: "var(--gb-color-ink-muted)"` = `#9CA3AF` on white | `#6B7280` | 2.6:1 → WCAG AA fail | **B** |

**Evidence:** `homepage-footer.png` — "Restaurant Sign Up / Restaurant Sign In / Terms of Use" links are visible but notably low contrast against white background.

---

### Screen: `/` — Homepage

**Screenshot:** `screenshots/before/01-homepage.png`

**No defects found.** Text content renders on dark card or with explicit dark colors. Logo renders correctly.

---

### Screen: `/search` — Search Results

**Screenshot:** `screenshots/before/02-search.png`

**No defects found.** All result cards use explicit light text on dark surface backgrounds.

---

### Screen: `/waiter` — Waiter / Food Intelligence

**Screenshot:** `screenshots/crop/waiter-top.png`

**No defects found.** All content renders inside dark-background cards with explicit light text colors.

---

### Screen: `/account/following` → redirects to `/account/login`

**Screenshot:** `screenshots/before/04-following.png`

**No defects found on login page.** Login card has explicit dark background with light text. Legible.

**Note:** When authenticated, `/account/following` passes `title` prop to StickyPageHeader without `barBackground` — this would trigger SPH-1. Covered under SPH-1 fix.

---

### Screen: `/checkout` — Checkout

**Screenshot:** `screenshots/before/05-checkout.png`

**No visible text defects on white background for the empty-basket state.** Content is inside a dark card. SPH-1 applies (header title invisible) but basket is empty so no other defects visible.

---

### Screen: `/browse-menus` — Browse Menus

**Screenshot:** `screenshots/crop/browse-top.png`

**No body text defects.** All filter options and restaurant cards are inside dark `.gb-card` surfaces with explicit light text. SPH-1 applies (browse title in header invisible).

---

### Screen: `/deals` — Deals

**Screenshot:** `screenshots/crop/deals-top.png`

**No defects found.** All deal content renders inside dark cards with white text. "6 deals" count label uses `var(--gb-color-ink-muted)` = `#9CA3AF` which is borderline but on a white background. Severity C — not implementing.

---

### Screen: `/top-picks` — Top Picks

**Screenshot:** `screenshots/crop/toppicks-top.png`

**No body text defects.** All category cards are dark with explicit light text. SPH-1 applies (page title invisible in header).

---

### Screen: `/restaurants/609` — Restaurant Profile (Yard House)

**Screenshot:** `screenshots/crop/restaurant-profile-top.png`

**No defects found.** The unclaimed profile page uses a dark card layout with explicit light text. Logo: no restaurant logo present for this unclaimed profile.

*Note: Restaurant logo `objectFit: "cover"` defect from prior audit (LOGO-1) was fixed in commit `b5c846e` — applies to claimed profiles with uploaded logos.*

---

### Screen: `/menu-items/13849` — Menu Item Detail

**Screenshot:** `screenshots/crop/menuitem-top.png`

Page was still loading at screenshot time ("Loading item..."). SPH-1 applies to sticky header title. No body text defects observed on loaded content (dark cards).

---

## Summary of All Defects

| ID | Screen | File | Element | Current | Correct | Sev | Status |
|---|---|---|---|---|---|---|---|
| T-1 | /terms | `index.css` `.gb-page-title` | Page title | `#FFFFFF` | `#0B0F0C` | **A** | Fixed in local CSS |
| T-2 | /terms | `index.css` `.gb-page-description` | Description | `#D1D5DB` | `#374151` | **A** | Fixed in local CSS |
| T-3 | /terms | `LegalDocumentPage.jsx:12` | Section h2 | `var(--gb-color-ink-strong)` | `#0B0F0C` | **A** | Fixed locally |
| T-4 | /terms | `LegalDocumentPage.jsx:19` | Body paragraphs | `var(--gb-color-ink-soft)` | `#374151` | **A** | Fixed locally |
| T-5 | /terms | `index.css` `.gb-page-eyebrow` | Eyebrow | `#9CA3AF` | `#6B7280` | **B** | Fixed in local CSS |
| P-1..4 | /privacy | same as T-1..4 | Same root | same | same | **A** | Fixed locally |
| A-1 | /about | `index.css` `.gb-page-title` | Page title | `#FFFFFF` | `#0B0F0C` | **A** | Fixed in local CSS |
| A-2 | /about | `index.css` `.gb-page-description` | Description | `#D1D5DB` | `#374151` | **A** | Fixed in local CSS |
| A-3 | /about | `AboutMenuply.jsx:11` | Body text | `var(--gb-color-ink-soft)` | `#374151` | **A** | **TODO** |
| A-4 | /about | `AboutMenuply.jsx:19` | Statement text | `var(--gb-color-ink-strong)` | `#0B0F0C` | **A** | **TODO** |
| A-5 | /about | `AboutMenuply.jsx:48` | Inline intro | `var(--gb-color-ink-strong)` | `#0B0F0C` | **A** | **TODO** |
| A-6 | /about | `AboutMenuply.jsx:64` | Blockquote | `var(--gb-color-ink-strong)` | `#0B0F0C` | **A** | **TODO** |
| C-1 | /contact | `index.css` `.gb-page-title` | Page title | `#FFFFFF` | `#0B0F0C` | **A** | Fixed in local CSS |
| C-2 | /contact | `index.css` `.gb-page-description` | Description | `#D1D5DB` | `#374151` | **A** | Fixed in local CSS |
| C-3 | /contact | `Contact.jsx:21` | Intro paragraph | `var(--gb-color-ink-soft)` | `#374151` | **A** | **TODO** |
| C-4 | /contact | `Contact.jsx:34` | Row labels | `var(--gb-color-ink)` | `#0B0F0C` | **A** | **TODO** |
| SE-1 | /restaurant/signup | `RestaurantSignupEntry.jsx:~356` | "Choose your plan" h1 | `#F8F4EA` | `#0B0F0C` | **A** | Fixed in b5c846e |
| SE-2 | /restaurant/signup | `RestaurantSignupEntry.jsx:~365` | Subtitle | `rgba(248,244,234,0.72)` | `#374151` | **A** | Fixed in b5c846e |
| SE-3 | /restaurant/signup | `RestaurantSignupEntry.jsx` styles | Founders notice | `rgba(248,244,234,0.88)` | `#101828` | **A** | Fixed in b5c846e |
| SE-4 | /restaurant/signup | `RestaurantSignupEntry.jsx` styles | Food truck prompt | `rgba(248,244,234,0.8)` | `#374151` | **B** | Fixed in b5c846e |
| SA-1 | /restaurant/signup/account | `RestaurantSignup.jsx:45` | Page heading (inherited) | `var(--gb-color-ink)` | Fix page root | `#0B0F0C` | **A** | **TODO** |
| SA-2 | /restaurant/signup/account | `RestaurantSignup.jsx:46` | Subtitle | `rgba(248,244,234,0.82)` | `#374151` | **A** | **TODO** |
| SA-3 | /restaurant/signup/account | `RestaurantSignup.jsx:44` | Sub-brand label | `rgba(248,244,234,0.62)` | `#6B7280` | **B** | **TODO** |
| SPH-1 | browse, checkout, top-picks, menu-item-detail | `StickyPageHeader.jsx:133` | Header title | `#FFFFFF` | `barBackground ? "#FFFFFF" : "#0B0F0C"` | **A** | Fixed in b5c846e |
| HF-1 | / (footer) | `SiteFooter.jsx:54–69` | Footer links | `#9CA3AF` (2.6:1) | `#6B7280` (4.6:1) | **B** | **TODO** |
| LOGO-1 | /restaurants/:id | `RestaurantPublicPage.jsx:895` | Restaurant logo | `objectFit: "cover"` | `objectFit: "contain"` | — | **B** | Fixed in b5c846e |

---

## Phase 2 — Implementation Plan

### Files with changes already applied locally (committed in `b5c846e`)
- `src/components/StickyPageHeader.jsx` — SPH-1
- `src/pages/RestaurantSignupEntry.jsx` — SE-1..4
- `src/pages/RestaurantPublicPage.jsx` — LOGO-1

### Files with changes applied to local working tree (not committed)
- `src/index.css` — T-1, T-2, T-5, A-1, A-2, C-1, C-2, CSS class fixes
- `src/components/legal/LegalDocumentPage.jsx` — T-3, T-4, P-3, P-4

### Files requiring additional changes (Phase 2 TODO)
- `src/pages/AboutMenuply.jsx` — A-3, A-4, A-5, A-6
- `src/pages/Contact.jsx` — C-3, C-4
- `src/components/SiteFooter.jsx` — HF-1
- `src/pages/RestaurantSignup.jsx` — SA-1, SA-2, SA-3

### Not implementing
- Deals page count label (Severity C)
- Pages with all-dark-card content (no white-background text defects confirmed)
- No global token replacements beyond specific confirmed defects above

---

## Screens Confirmed Clear (No Defects)

| Screen | Logo | Text |
|---|---|---|
| `/` homepage | ✓ | ✓ |
| `/search` | ✓ | ✓ |
| `/waiter` | ✓ | ✓ |
| `/account/login` | ✓ | ✓ |
| `/checkout` (empty basket) | ✓ | ✓ (except SPH-1) |
| `/browse-menus` | ✓ | ✓ (except SPH-1) |
| `/deals` | ✓ | ✓ |
| `/top-picks` | ✓ | ✓ (except SPH-1) |
| `/restaurants/609` | N/A (unclaimed) | ✓ |
