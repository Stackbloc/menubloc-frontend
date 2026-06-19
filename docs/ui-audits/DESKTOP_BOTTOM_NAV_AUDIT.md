# Desktop Bottom Nav Audit

**Date:** 2026-06-19  
**Status:** Audit complete — no code changes  
**Scope:** Why BottomNav (Home / Waiter / Following / Basket) is not visible on desktop at `https://menuply.com/`

---

## 1. Render Path

```
App() [App.jsx:680]
  └── AppShell [App.jsx:487]
        └── <Routes> [App.jsx:505]
              └── <Route path="/" element={<GrubbidDiscovery />}> [App.jsx:506]
                    └── GrubbidDiscovery() [GrubbidDiscovery.jsx:1181]
                          └── <BottomNav /> [GrubbidDiscovery.jsx:1714]
                                └── <nav style={{ position: "fixed", ... }}> [BottomNav.jsx:35]
```

---

## 2. Every Parent Component

### App() — `src/App.jsx:680`
```jsx
return (
  <ConsumerProvider>
    <FoodInterestsProvider>
      <OwnerProvider>
        <CrmProvider>
          <OperatorProvider>
            <CartProvider>
              <LanguageProvider>
                <OrderCartProvider>
                  <BrowserRouter>
                    <AppShell easyMenu={easyMenu} crmHost={crmHost} />
                  </BrowserRouter>
                </OrderCartProvider>
              </LanguageProvider>
            </CartProvider>
          </OperatorProvider>
        </CrmProvider>
      </OwnerProvider>
    </FoodInterestsProvider>
  </ConsumerProvider>
);
```
All ancestors are React context providers. **None render a DOM element.** No `overflow`, `transform`, `filter`, or `z-index` at this level.

---

### AppShell() — `src/App.jsx:487`
```jsx
function AppShell({ easyMenu, crmHost }) {
  const location = useLocation();
  const joinLandingRoute = isJoinLandingPath(location.pathname);         // line 489
  const joinSignupRoute = location.pathname === "/restaurant/signup/free-profile";  // line 490
  const restaurantOnboardingRoute = location.pathname === "/restaurant/onboarding"; // line 491
  const operatorTabletRoute = location.pathname === "/operator/tablet";             // line 492
  const hidePublicChrome = crmHost || joinLandingRoute || joinSignupRoute           // line 493
    || restaurantOnboardingRoute || operatorTabletRoute;

  return (
    <>
      <ScrollToTop />
      <CanonicalUpdater />
      <AnalyticsTracker />
      {hidePublicChrome ? null : <CartDrawer />}         // line 500
      {hidePublicChrome ? null : <OrderCartDrawer />}    // line 501
      {hidePublicChrome ? null : <BasketResumePrompt />} // line 502
      {hidePublicChrome ? null : <FoodInterestAuthPrompt />} // line 503

      <Routes>
        <Route path="/" element={<GrubbidDiscovery />} /> // line 506 (non-crmHost, non-easyMenu path)
        ...
      </Routes>

      {hidePublicChrome ? null : <SiteFooter />}  // line 675
    </>
  );
}
```

**Findings:**
- AppShell renders a **fragment** (`<>`) — no DOM container, no `overflow`, no `z-index`.
- `hidePublicChrome` is `false` on `/` (not a CRM host, join landing, free-profile, onboarding, or tablet route).
- `SiteFooter` IS rendered on `/`. It is in **normal document flow** — not fixed, no `z-index`.
- **BottomNav is NOT in AppShell.** AppShell does not manage BottomNav globally.
- No desktop/mobile conditional in AppShell.

---

### GrubbidDiscovery() outer wrapper — `src/pages/GrubbidDiscovery.jsx:1182`
```jsx
return (
  <div style={{
    position: "relative",     // line 1182 — creates stacking context only if z-index is set (it is not)
    minHeight: "100vh",
    background: "var(--gb-color-page)",
    color: "var(--gb-color-ink)"
  }}>
```

**Findings:**
- `position: relative` alone does **NOT** create a containing block for `position: fixed` children.
- No `transform`, `filter`, `perspective`, `will-change`, or `contain` on this element — none of these are present.
- No `overflow: hidden` at this level.
- `z-index` is **not set** — no stacking context created.

---

### GrubbidDiscovery() inner content wrapper — `src/pages/GrubbidDiscovery.jsx:1246`
```jsx
<div style={{
  maxWidth: 576,
  margin: "0 auto",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  paddingBottom: "calc(var(--bottom-nav-h, 72px) + 8px)"
}}>
```

**Findings:**
- Content column is constrained to 576px and centered. This is the **mobile-first layout container**.
- On viewports > 576px, this column is 576px wide with equal whitespace on each side.
- No `overflow: hidden`, no `position`, no `z-index`.
- **BottomNav is NOT a child of this div.** BottomNav is a sibling rendered after this div closes at line 1713.

---

### Sticky header — `src/pages/GrubbidDiscovery.jsx:1249`
```jsx
<div style={{
  position: "sticky",
  top: 0,
  zIndex: 100,
  ...
}}>
```

**Finding:** `zIndex: 100` — below BottomNav's `zIndex: 200`. No conflict.

---

## 3. Every Conditional Render

### In `GrubbidDiscovery.jsx` — BottomNav is unconditional

```jsx
// line 1714
<BottomNav />
```

There is **no conditional** wrapping `<BottomNav />` in `GrubbidDiscovery.jsx`. It is always mounted regardless of:
- Viewport width
- Window size
- Mobile/desktop user agent
- Any state variable

---

### `useIsMobile` — exists in `GrubbidSearchResults.jsx` only

**File:** `src/pages/GrubbidSearchResults.jsx:46–65`
```js
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;  // line 49
  });

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);  // line 56
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}
```

**Breakpoint:** `<= 768px`. Returns `true` on viewports ≤ 768px (phone/narrow tablet), `false` on ≥ 769px (desktop).

**How it is used in `GrubbidSearchResults.jsx`:**

| Line | Usage | Gates BottomNav? |
|---|---|---|
| 1301 | `const isMobile = useIsMobile()` | No — used for layout styling only |
| 1268–1279 | `FilterToggle` padding: `isMobile ? "8px 13px" : "5px 13px"` | No |
| 2214 | `marginTop: isMobile ? 32 : 44` | No |
| 2215 | `paddingTop: isMobile ? 16 : 20` | No |
| 2220 | `fontSize: isMobile ? 13 : 14` | No |
| **2238** | `<BottomNav />` — rendered **after** all isMobile usage, **unconditionally** | **Not gated** |

`useIsMobile` does **not exist** in `GrubbidDiscovery.jsx`. The hook is not imported or called on the homepage.

---

## 4. Every Viewport Check

### Full search across the codebase:

| Check | File | Line | Gates BottomNav? |
|---|---|---|---|
| `useIsMobile(768)` | `GrubbidSearchResults.jsx` | 46 | No — styling only |
| `window.innerWidth <= breakpoint` | `GrubbidSearchResults.jsx` | 49, 56 | No |
| `/Mobi|Android|iPhone/i.test(navigator.userAgent)` | `App.jsx` | 456 | No — analytics `device_type` label only |

**None of the viewport checks in the codebase gate `<BottomNav />`.**

---

## 5. Every Media Query

### `src/index.css`

| Line | Query | Targets | Hides BottomNav? |
|---|---|---|---|
| 407 | `@media (max-width: 900px)` | `.gb-shell`, `.gb-page-split`, `.gb-page-sidebar`, `.gb-page-nav`, `.gb-page-title`, `.gb-page-description`, `.gb-section-title` | **No** |
| 471 | `@media (max-width: 768px)` | `.gb-chip-rail` scrollbar visibility (`display: none` on `::-webkit-scrollbar`) | **No** |

**There is no CSS media query that hides, suppresses, or repositions BottomNav at any viewport width.**

### `src/pages/GrubbidDiscovery.jsx` — inline `<style>` block (lines 1183–1227)

```css
@media (min-width: 760px) {   /* line 1204 */
  .disc-oom-actions {
    flex-direction: row;
    max-width: 360px;
  }
}
```

Only `.disc-oom-actions` — the out-of-market action buttons. No BottomNav rule.

---

## 6. Every Route/Layout Wrapper

| Level | Component | Wraps BottomNav? | Conditional? |
|---|---|---|---|
| Route | `<Route path="/" element={<GrubbidDiscovery />}>` | No — route selects page component | No |
| AppShell | `<>...</>` fragment | No DOM container | No |
| Global | `SiteFooter` | Not a wrapper — sibling in document flow | Hidden on `/operator/*`, `/checkout` |

---

## 7. BottomNav's own style — `src/components/BottomNav.jsx:38–46`

```jsx
<nav
  ref={navRef}
  style={{
    position: "fixed",        // always fixed to viewport
    bottom: 0,                // always at viewport bottom
    left: 0,                  // always starts at left edge
    right: 0,                 // always extends to right edge
    zIndex: 200,              // above sticky header (100), above all document flow
    background: "#fff",
    borderTop: "1px solid #e4e7ec",
    display: "flex",
    justifyContent: "space-around",
    padding: "6px 0 env(safe-area-inset-bottom, 8px)",
    boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    overflow: "visible",
  }}
>
```

**No `display: none`. No `visibility: hidden`. No `opacity: 0`. No `transform`. No breakpoint logic.**

---

## 8. SiteFooter and BottomNav relationship

**`src/components/SiteFooter.jsx:32`**
```jsx
padding: "18px 20px calc(var(--bottom-nav-h, 72px) + 8px)",
```

SiteFooter explicitly reserves bottom padding equal to BottomNav height. This confirms BottomNav was architecturally intended to coexist with SiteFooter on the same page, with BottomNav floating on top.

SiteFooter is in **normal document flow** (no position, no z-index). BottomNav at `zIndex: 200` renders above it visually.

---

## 9. Answer: A, B, C, or D?

> A. Mounted but hidden  
> B. Not mounted  
> C. Rendered off-screen  
> D. Replaced by another layout

**None of A, B, C, or D applies.**

Based on complete code inspection:

- **B is false.** BottomNav is unconditionally mounted in `GrubbidDiscovery.jsx:1714`. No conditional suppresses it on desktop.
- **A is false.** There is no CSS rule (`display: none`, `visibility: hidden`, `opacity: 0`) hiding it at any viewport width. The only `display: none` in `index.css` is at `max-width: 768px` on `.gb-chip-rail::-webkit-scrollbar` — unrelated.
- **C is false.** `position: fixed, bottom: 0, left: 0, right: 0` places the element at the viewport bottom edge on all viewports. It cannot be off-screen.
- **D is false.** No desktop navigation component replaces BottomNav. AppShell has no global nav component.

---

## 10. Root Cause

**BottomNav is mounted and rendered on desktop. There is no code mechanism that hides, suppresses, or replaces it on viewport widths > 576px or > 768px.**

The observable behavior on desktop is:

1. **Content column:** `GrubbidDiscovery.jsx:1246` constrains all page content to `maxWidth: 576px`, centered with `margin: 0 auto`. On a 1280px+ monitor, 576px of content sits in the center of a wide white page.

2. **BottomNav width:** `position: fixed, left: 0, right: 0` spans the **full viewport width** — not the 576px content width. On a 1280px monitor, BottomNav is 1280px wide. Tabs (Home/Waiter/F/Basket) are distributed with `justifyContent: "space-around"` across the full 1280px.

3. **Visual merge risk:** BottomNav `background: "#fff"` matches page `background: #ffffff`. The only visual separator is `borderTop: "1px solid #e4e7ec"` (light gray, 1px). On high-DPI displays or at certain zoom levels, this border may be insufficiently prominent to register as a navigation bar to the user.

4. **Design mismatch:** The app is mobile-first (576px column). BottomNav is a mobile navigation pattern. On desktop, it renders as a full-width mobile nav bar on a narrow-column desktop page. There is no desktop-specific navigation adaptation anywhere in the codebase.

**Summary:** The code mounts BottomNav on desktop. The user may not perceive it because (a) the 1px white-on-white border provides minimal visual separation from the page, and (b) a mobile tab bar spread across a 1280px+ monitor is visually unexpected and may not register as navigation.

There is no bug. There is no code to change to "fix" this — the behavior is a consequence of using the same mobile-first BottomNav component unconditionally on all viewports with no desktop layout adaptation.
