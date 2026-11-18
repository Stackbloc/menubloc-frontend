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

/** The Clusters tab opens the USC cluster page (Andre 2026-11-18). */
export const FEED_CLUSTERS_TAB_PATH = "/clusters/california/los-angeles/usc";

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
 * Same tabs as the app (Andre 2026-10-24/29, the app wins): Home · Post (X) · Deals · Clusters · Profile
 * (Clusters took Search's slot 2026-11-18; /feed/search still works from links).
 * Every tab has an icon and a label. The basket is the cart button beside ☰ (FeedMobileHeader), shown
 * whenever it has items; the desktop rail keeps its own Basket button.
 */
export const FEED_LEFT_TABS = [FEED_HOME_TAB];

export const FEED_RIGHT_TABS = [
  { to: "/feed/deals", end: false, label: "Deals", icon: "deals", testId: "feed-nav-deals" },
  // Clusters (Andre 2026-11-18, as the app): Search's slot is the USC cluster, four-squares icon.
  { to: FEED_CLUSTERS_TAB_PATH, end: false, label: "Clusters", icon: "cluster", testId: "feed-nav-clusters" },
  { to: "/feed/profile", end: false, label: "Profile", icon: "profile", testId: "feed-nav-profile" },
];

/**
 * Today (Andre 2026-11-13: "the website should have a today page when user is signed in, same as
 * app"). As the app's tab bar with flag today_home on (menuply-mobile app/(tabs)/_layout.tsx):
 * Today · Feed · Post · Search · Profile. Today takes the Deals tab's place, so the Feed shows the
 * "Clips | Deals" switch at the top (deals stay one tap away, Andre 2026-11-11).
 */
export const FEED_TODAY_TAB = { to: "/feed/today", end: true, label: "Today", icon: "fork", testId: "feed-nav-today", authOnly: true };
export const FEED_FEED_TAB = { ...FEED_HOME_TAB, label: "Feed", alsoActiveOn: ["/", "/feed/deals"] };

/** The tabs for this viewer: Today's layout only when signed in and the flag is on. */
export function resolveFeedTabs({ isAuthenticated = false, todayHome = false } = {}) {
  if (!isAuthenticated || !todayHome) {
    return { left: FEED_LEFT_TABS, right: FEED_RIGHT_TABS, home: FEED_HOME_TAB, railAfterHome: FEED_RAIL_TABS_AFTER_HOME };
  }
  const right = FEED_RIGHT_TABS.filter((tab) => tab.to !== "/feed/deals");
  return {
    left: [FEED_TODAY_TAB, FEED_FEED_TAB],
    right,
    home: FEED_FEED_TAB,
    railBeforeHome: [FEED_TODAY_TAB],
    railAfterHome: [right[0], FEED_RAIL_BASKET_TAB, ...right.slice(1)],
  };
}

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

/** Desktop rail: Home first, then Deals, Clusters, Basket, Profile. */
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

/**
 * ☰ order, same as the app (Andre 2026-11-18, the usual app arrangement): the Profile card and Events
 * are pinned on top (FEED_MORE_PINNED) so they stand out, then the accordions Connects · Account &
 * Settings (Sign out last) · Help · Menuply, then Terms · Privacy as a small footer line.
 * The app's Filters, Campus View and Location rows have no web page yet, so they are left out here.
 */
export const FEED_MORE_PINNED = {
  profile: { to: FEED_SHELL_PROFILE_NEXT, guestTo: FEED_SHELL_PROFILE_LOGIN_PATH, testId: "feed-more-profile" },
  events: { to: "/events", label: "Events", note: "Create your own event or discover nearby pending events.", icon: "calendar", testId: "feed-more-events" },
};

export const FEED_MORE_SECTIONS = [
  {
    id: "connects",
    title: "Connects",
    authOnly: true,
    links: [
      { to: "/account/find-diners", label: "Find Connects", testId: "feed-more-find-connects" },
      { to: "/account/diner-qr", label: "Share My Profile", testId: "feed-more-share-profile" },
      { to: "/account/diner-qr/edit", label: "Edit My QR", testId: "feed-more-edit-qr" },
    ],
  },
  {
    id: "account",
    title: "Account & Settings",
    authOnly: true,
    // Sign out is drawn as the last row of this section (FeedMorePanel).
    signOut: true,
    links: [
      { to: "/account/notifications", label: "Notifications", testId: "feed-more-notifications" },
      { to: "/checkout", label: "Basket", testId: "feed-more-basket" },
      { to: FEED_MENU_CAPTURE_PATH, label: "Add a menu", testId: "feed-more-add-menu" },
      { to: "/account", label: "All settings", testId: "feed-more-account" },
    ],
  },
  {
    id: "help",
    title: "Help",
    links: [
      // withFrom: the page they were on goes along (Andre 2026-11-07).
      { to: "/feedback", label: "Feedback", note: "Report a problem or share an idea", testId: "feed-more-feedback", withFrom: true },
      { to: "/contact", label: "Contact Us", testId: "feed-more-contact" },
    ],
  },
  {
    id: "menuply",
    title: "Menuply",
    links: [
      { to: "/about", label: "About Menuply", testId: "feed-more-about" },
      { to: FEED_SHELL_SIGNUP_PATH, label: "Diner Sign Up", testId: "feed-more-signup", guestOnly: true },
      { to: "/clusters", label: "Clusters", testId: "feed-more-clusters" },
      { to: "/restaurant/onboarding", label: "Restaurants", testId: "feed-more-restaurants" },
      { to: "/join", label: "Venues", testId: "feed-more-venues" },
      { to: "/creative-pros", label: "Creators", testId: "feed-more-creators" },
      { to: "/advertise?cluster=usc", label: "Advertise", note: "Available soon", testId: "feed-more-advertise" },
      { to: "/distributors", label: "Food Distributors", testId: "feed-more-distributors" },
    ],
  },
];

/** Small footer line under the sections. */
export const FEED_MORE_LEGAL = [
  { to: "/terms", label: "Terms of Use", testId: "feed-more-terms" },
  { to: "/privacy", label: "Privacy Policy", testId: "feed-more-privacy" },
];

export function resolveFeedMoreSections({ isAuthenticated = false } = {}) {
  return FEED_MORE_SECTIONS.filter((section) => !(section.authOnly && !isAuthenticated)).map((section) => ({
    ...section,
    links: section.links.filter((link) => !(link.guestOnly && isAuthenticated)),
  }));
}
