# UI Baseline — 2026-06-18
# Build: 1a12211 / Deployment: dpl_DUTTvo1sdPcgD44TDLnUK4UzbWAd
# Production: menuply.com

---

## PROTECTED BEHAVIORS

The following behaviors are verified, intentional, and must not be changed without explicit approval.

### Navigation
- BottomNav contains exactly four tabs: Home, Waiter, Following, Basket
- Following tab displays as the letter "F" — this is intentional, not a defect
- BottomNav is position:fixed, bottom:0, z-index:200 — always visible at viewport bottom
- BottomNav is page-owned (not App-shell-owned) — each consumer page imports it individually

### Layout
- Homepage (/) uses centered mobile-first column: maxWidth: 576, margin: "0 auto"
- Search (/search) uses the same maxWidth: 576 pattern
- This narrow desktop layout is intentional — not a defect
- Desktop shows large side margins — expected behavior

### Routes
- /waiter is the Waiter route — renders FoodInterestsPage
- /account/following is the Following route (BottomNav links here correctly)
- /checkout is the Basket route (BottomNav links here correctly)
- /following and /basket do not exist — wildcard redirects to home
- /build-info renders BuildInfoPage — internal diagnostic, not in public nav

### Build Identity
- /build-info.json is served as a static file from public/
- /build-info renders a UI page fetching that JSON
- generateBuildInfo.mjs runs before every Vite build
- Fields: app, gitSha, gitShortSha, branch, buildTime, buildSource, deploymentId, vercelUrl, nodeEnv, commitMessage

### Search
- Search logic must not be modified
- Recommendation logic must not be modified
- Backend routes must not be modified

### Waiter
- Waiter functionality must not be modified
- /waiter route must remain

---

## REGRESSION WARNINGS

Any future change touching the items below MUST:
1. Explicitly identify which protected behavior is affected
2. Get approval before implementation
3. Be tested against the behaviors listed above after implementation

### Triggers that require explicit review before change

| Area | Trigger |
|------|---------|
| Homepage layout | Any change to GrubbidDiscovery.jsx outer or inner container widths |
| Search layout | Any change to GrubbidSearchResults.jsx container widths |
| BottomNav | Any change to BottomNav.jsx tabs, destinations, or styling |
| Following icon | Any change to the "F" icon or Following tab label |
| Routing | Any change to App.jsx route table |
| Build identity | Any change to scripts/generateBuildInfo.mjs or public/build-info.json |
| Waiter | Any change to FoodInterestsPage.jsx or /waiter route |
| Signup flow | Any change to RestaurantSignupEntry.jsx or /restaurant/signup |
| Onboarding | Any change to RestaurantPhilosophy.jsx or RestaurantOnboardingApproved.jsx |

---

## KNOWN DEFECTS AT BASELINE (not regressions — pre-existing)

See full list: docs/ui-baseline/2026-06-18/DEFECT_AUDIT.md

Summary:
- A-001: CheckoutPage missing BottomNav clearance (bottom content obscured)
- A-002: ConsumerFollowing uses hardcoded 80px instead of --bottom-nav-h token
- A-003: Onboarding uses hardcoded 80px padding (vestigial)
- B-001: color-scheme:dark on :root conflicts with white --gb-color-page
- B-002: White page gaps between dark feed cards on homepage
- B-003: Invisible card borders on search results page (light background)
- B-004: Dark hardcoded border on white search header
- B-005: Featured plan card dark theme abrupt on white signup page
- B-006: Vestigial bottom padding on signup page
- B-007: Waiter page uses maxWidth:720 vs 576 on home/search

---

## SCREENSHOTS

Location: docs/ui-baseline/2026-06-18/
Status: Pending manual capture — see SCREENSHOTS_REQUIRED.md

---

## RECOVERY ANCHOR

Branch: safety/live-good-menuply-2026-06-18 → ec19ec9
Tag: live-good-menuply-2026-06-18 → ec19ec9
Recovery doc: docs/recovery/2026-06-18-live-good-state.md
