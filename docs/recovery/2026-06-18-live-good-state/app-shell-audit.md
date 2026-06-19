# App Shell Audit — 2026-06-18 Live Good State

## Source files examined

src/App.jsx
src/components/BottomNav.jsx
src/components/SiteFooter.jsx
src/index.css

---

## SiteFooter

File:       src/components/SiteFooter.jsx
Mounted in: src/App.jsx line 673
Condition:  {hidePublicChrome ? null : <SiteFooter />}

hidePublicChrome is defined at App.jsx line 492:
  const hidePublicChrome = crmHost || joinLandingRoute || joinSignupRoute || restaurantOnboardingRoute || operatorTabletRoute;

SiteFooter renders the desktop footer links:
  Restaurant Sign Up, Restaurant Sign In, Terms of Use, Privacy Policy, About Menuply, Contact Us

SiteFooter is GLOBAL — rendered in App.jsx, not per-page.
SiteFooter is rendered on all public consumer routes where hidePublicChrome is false.
SiteFooter is suppressed on: CRM host, join landing routes, signup routes, onboarding routes, operator tablet routes.

---

## BottomNav

File:       src/components/BottomNav.jsx
Mounted in: PER-PAGE — NOT in App.jsx

BottomNav is NOT present in App.jsx at all.
Each page that wants BottomNav imports and renders it independently.

BottomNav CSS:
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 200
  No media query. No desktop-hide condition. Renders on all screen sizes.

CSS variable: --bottom-nav-h set via ResizeObserver in BottomNav.jsx
CSS class: .gb-bottom-nav-clearance (adds bottom padding equal to nav height)

---

## Pages WITH BottomNav

src/pages/GrubbidDiscovery.jsx            line 1714   (homepage /)
src/pages/GrubbidSearchResults.jsx        line 2238   (/search)
src/pages/BrowseMenus.jsx                 line 851    (/browse-menus)
src/pages/FoodInterestsPage.jsx           line 254    (/waiter, /food-interests)
src/pages/CheckoutPage.jsx                line 1472   (/checkout)
src/pages/PublicMenuPage.jsx              line 1713   (/restaurants/:id/menu etc)
src/pages/MenuItemDetailPage.jsx          line 284    (/menu-items/:id)
src/pages/MenuItemInfoPage.jsx            line 254    (/menu-item-info/:id)
src/pages/RestaurantPublicPage.jsx        line 1387   (/restaurants/:slugOrId)
src/pages/DealsPage.jsx                   line 511    (/deals)
src/pages/DealDetailPage.jsx              line 432    (/deals/:dealId)
src/pages/TopPicksPage.jsx                line 125    (/top-picks)
src/pages/Top5HealthiestPage.jsx          line 330    (/top5/healthiest)
src/pages/FoodTruckPage.jsx               line 1349   (/foodtrucks/:id)
src/pages/FoodTrucksPage.jsx              line 245    (/foodtrucks)
src/pages/FoodTruckSchedulePage.jsx       lines 206, 236, 430
src/pages/RestaurantBillboard.jsx         line 293    (/restaurants/:id/billboard)
src/pages/OrderConfirmationPage.jsx       line 223    (/orders/:id/confirmation)
src/pages/BuyMeThisPage.jsx               line 274    (/bmt/:token)
src/pages/AboutMenuply.jsx                line 95     (/about)
src/pages/Contact.jsx                     line 282    (/contact)
src/pages/consumer/ConsumerFollowing.jsx  lines 124, 259  (/account/following)
src/pages/consumer/ConsumerLogin.jsx      line 225    (/account/login)
src/pages/consumer/ConsumerProfile.jsx    lines 272, 287, 487  (/account)
src/pages/consumer/AccountWelcome.jsx     line 263    (/account/welcome)
src/components/legal/LegalDocumentPage.jsx line 111

---

## Pages WITHOUT BottomNav

Consumer/auth:
  src/pages/consumer/ConsumerSignup.jsx
  src/pages/consumer/ConsumerForgotPassword.jsx
  src/pages/consumer/ConsumerResetPassword.jsx
  src/pages/consumer/AppleAuthCallback.jsx

Restaurant signup/onboarding:
  src/pages/RestaurantSignup.jsx
  src/pages/RestaurantSignupEntry.jsx
  src/pages/RestaurantFreeProfileSignup.jsx
  src/pages/RestaurantFoundersSignup.jsx
  src/pages/RestaurantPhilosophy.jsx        (/restaurant/onboarding)
  src/pages/FoodTruckSignup.jsx
  src/pages/JoinPage.jsx
  src/pages/JoinDinersPage.jsx

Operator (all):
  src/pages/operator/OperatorDashboard.jsx
  src/pages/operator/OperatorLogin.jsx
  src/pages/operator/OperatorSignup.jsx
  src/pages/operator/OperatorMenuEditor.jsx
  src/pages/operator/OperatorMenuCameraUpload.jsx
  src/pages/operator/OperatorMenuStudio.jsx
  src/pages/operator/OperatorProfileEditor.jsx
  src/pages/operator/OperatorBrandSettings.jsx
  src/pages/operator/OperatorDisplaySettings.jsx
  src/pages/operator/OperatorDealsEditor.jsx
  src/pages/operator/OperatorHoursEditor.jsx
  src/pages/operator/OperatorSubscription.jsx
  src/pages/operator/OperatorMyAccount.jsx
  src/pages/operator/OperatorQrKitOrder.jsx
  src/pages/operator/OperatorQrStickers.jsx
  src/pages/operator/OperatorTabletPage.jsx
  src/pages/operator/OperatorClaimSearch.jsx
  src/pages/operator/OperatorAdobeStudio.jsx
  src/pages/operator/OperatorCartNegotiationSettings.jsx
  src/pages/operator/OperatorDeliveryPage.jsx
  src/pages/operator/OperatorEmailVerification.jsx
  src/pages/operator/OperatorRecovery.jsx
  src/pages/operator/OperatorResetPassword.jsx
  src/pages/operator/RestaurantHelpCenter.jsx
  src/pages/operator/RestaurantOrdersPage.jsx
  src/pages/operator/RestaurantOrderDetailPage.jsx
  src/pages/MenuDesignLabPage.jsx
  src/pages/MenuDesignSelectPage.jsx

Owner (all):
  src/pages/owner/ (all files)

CRM (all):
  src/pages/crm/ (all files)

Other:
  src/pages/ComparePage.jsx
  src/pages/DemoPage.jsx
  src/pages/EasyMenuLanding.jsx
  src/pages/MenuCapturePage.jsx
  src/pages/MenuPage.jsx
  src/pages/MenuThemesPage.jsx
  src/pages/MenuUploadChoicePage.jsx
  src/pages/MenuVerificationPage.jsx
  src/pages/PdfUploadPage.jsx
  src/pages/PrivacyPolicy.jsx
  src/pages/PublicMenuDisplayPage.jsx
  src/pages/QrCodesPage.jsx
  src/pages/RestaurantProfile.jsx
  src/pages/SpreadsheetUploadPage.jsx
  src/pages/SubscriptionSelect.jsx
  src/pages/Terms.jsx
  src/pages/ProfileSearchPage.jsx
  src/pages/MarketAggregatorPage.jsx
  src/pages/MarketMenuItemPage.jsx

---

## Architecture Note

BottomNav is page-owned, not App-shell-owned.
This means adding BottomNav to a new page requires an explicit import and render in that page file.
There is no central switch to show/hide BottomNav across all pages.
SiteFooter is App-shell-owned and appears globally on consumer-facing routes.

DO NOT REFACTOR. Document only.
