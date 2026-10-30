/**
 * Canonical Feed shell destinations — primary tabs + More menu sections.
 * Mobile bottom nav and desktop left rail read from the same config.
 */

import { MENU_BROWSER_PATH } from "./searchShopMode.js";

export const FEED_DESKTOP_MIN_WIDTH = 900;
export const FEED_DESKTOP_RAIL_WIDTH = 240;

export const FEED_SHELL_LOGIN_NEXT = "/feed";
export const FEED_SHELL_SIGNUP_PATH = `/diner/signup?next=${encodeURIComponent(FEED_SHELL_LOGIN_NEXT)}`;
export const FEED_SHELL_LOGIN_PATH = `/account/login?next=${encodeURIComponent(FEED_SHELL_LOGIN_NEXT)}`;

/** Guest Profile tab — return to profile after auth (feed is browsable without sign-in). */
export const FEED_SHELL_PROFILE_NEXT = "/feed/profile";
export const FEED_SHELL_PROFILE_SIGNUP_PATH = `/diner/signup?next=${encodeURIComponent(FEED_SHELL_PROFILE_NEXT)}`;
export const FEED_SHELL_PROFILE_LOGIN_PATH = `/account/login?next=${encodeURIComponent(FEED_SHELL_PROFILE_NEXT)}`;

export const FEED_HOME_TAB = {
  to: "/feed",
  end: true,
  label: "Home",
  /** Mobile bottom bar: the app's icon over the label (AppIcon name). */
  icon: "home",
  testId: "feed-nav-home",
  alsoActiveOn: ["/"],
};

/**
 * Same tabs as the app (Andre 2026-10-24/29, the app wins): Home · Post (X) · Deals · Search · Profile.
 * Every tab has an icon and a label. The basket is the cart button beside ☰ (FeedMobileHeader), shown
 * whenever it has items; the desktop rail keeps its own Basket button.
 */
export const FEED_LEFT_TABS = [FEED_HOME_TAB];

export const FEED_RIGHT_TABS = [
  { to: "/feed/deals", end: false, label: "Deals", icon: "deals", testId: "feed-nav-deals" },
  { to: "/feed/search", end: true, label: "Search", icon: "search", testId: "feed-nav-shop", resetSearch: true },
  { to: "/feed/profile", end: false, label: "Profile", icon: "profile", testId: "feed-nav-profile" },
];

/** Desktop rail only: opens the order cart (the mobile bar has no Basket tab). */
export const FEED_RAIL_BASKET_TAB = { to: "/checkout", end: false, label: "Basket", testId: "feed-nav-basket", openCart: true };

/** Drop authOnly tabs for signed-out visitors (and mobileOnly tabs on the desktop rail). */
export function visibleFeedTabs(tabs, { isAuthenticated = false, desktop = false } = {}) {
  return (Array.isArray(tabs) ? tabs : []).filter(
    (tab) => (isAuthenticated || !tab.authOnly) && !(desktop && tab.mobileOnly)
  );
}

/** All primary tabs in display order (desktop rail). */
export const FEED_PRIMARY_TABS = [...FEED_LEFT_TABS, ...FEED_RIGHT_TABS];

/** Desktop rail: Home first, then Deals, Search, Basket, Profile. */
export const FEED_RAIL_TABS_AFTER_HOME = [...FEED_LEFT_TABS.slice(1), ...FEED_RIGHT_TABS.slice(0, 2), FEED_RAIL_BASKET_TAB, ...FEED_RIGHT_TABS.slice(2)];

/** Menu capture return — Yellow Browse owns bookmarked/recent menus. */
export const FEED_MENU_CAPTURE_PATH = `/menu-capture?next=${encodeURIComponent(MENU_BROWSER_PATH)}`;
export const FEED_MENU_CAPTURE_HINT = "Upload restaurant menus to Menuply";

export const FEED_GUEST_PROFILE_CARDS = [
  {
    to: FEED_SHELL_PROFILE_SIGNUP_PATH,
    title: "Join Menuply",
    blurb: "Create a free account to connect, post clips, and plan with friends.",
    testId: "feed-guest-join-card",
    primary: true,
  },
  {
    to: "/clusters",
    title: "Explore Clusters",
    blurb: "Stadiums, campuses, venues, and food places near you.",
    testId: "feed-guest-clusters-card",
  },
];

export const FEED_MORE_SECTIONS = [
  {
    id: "join",
    title: "Join Menuply",
    guestOnly: true,
    groups: [
      {
        title: "For Diners",
        links: [
          { to: FEED_SHELL_SIGNUP_PATH, label: "Create account", testId: "feed-more-signup" },
        ],
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    authOnly: true,
    links: [
      { to: "/account", label: "Account & settings", testId: "feed-more-account" },
      // Search other diners by name, phone, or email and connect (was only reachable from the X sheet).
      { to: "/account/find-diners", label: "Connect Search", testId: "feed-more-connect-search" },
      { to: "/clusters", label: "Clusters", testId: "feed-more-clusters" },
      { to: FEED_MENU_CAPTURE_PATH, label: "Add a menu", testId: "feed-more-add-menu" },
    ],
  },
  {
    id: "business",
    title: "For businesses",
    links: [
      { to: "/restaurant/onboarding", label: "Restaurants", testId: "feed-more-restaurants" },
      { to: "/join", label: "Venues", testId: "feed-more-venues" },
      { to: "/distributors", label: "Food Distributors", testId: "feed-more-distributors" },
      { to: "/creative-pros", label: "Creators", testId: "feed-more-creators" },
    ],
  },
  {
    id: "menuply",
    title: "Menuply",
    links: [
      { to: "/about", label: "About Menuply", testId: "feed-more-about" },
      { to: "/contact", label: "Contact", testId: "feed-more-contact" },
      { to: "/terms", label: "Terms of Use", testId: "feed-more-terms" },
      { to: "/privacy", label: "Privacy Policy", testId: "feed-more-privacy" },
    ],
  },
];

export function resolveFeedMoreSections({ isAuthenticated = false } = {}) {
  return FEED_MORE_SECTIONS.filter((section) => {
    if (section.guestOnly && isAuthenticated) return false;
    if (section.authOnly && !isAuthenticated) return false;
    return true;
  });
}
