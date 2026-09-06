/**
 * Canonical Feed shell destinations — primary tabs + More menu sections.
 * Mobile bottom nav and desktop left rail read from the same config.
 */

export const FEED_DESKTOP_MIN_WIDTH = 900;
export const FEED_DESKTOP_RAIL_WIDTH = 240;

export const FEED_SHELL_LOGIN_NEXT = "/feed";
export const FEED_SHELL_SIGNUP_PATH = `/diner/signup?next=${encodeURIComponent(FEED_SHELL_LOGIN_NEXT)}`;
export const FEED_SHELL_LOGIN_PATH = `/account/login?next=${encodeURIComponent(FEED_SHELL_LOGIN_NEXT)}`;

export const FEED_HOME_TAB = {
  to: "/feed",
  end: true,
  label: "Home",
  testId: "feed-nav-home",
  alsoActiveOn: ["/"],
};

export const FEED_LEFT_TABS = [
  FEED_HOME_TAB,
  { to: "/feed/connects", end: false, label: "Connects", testId: "feed-nav-connects" },
  {
    to: "/browse-menus",
    end: false,
    label: "Menu Browser",
    testId: "feed-nav-menus",
  },
];

export const FEED_RIGHT_TABS = [
  { to: "/feed/deals", end: false, label: "Deals", testId: "feed-nav-deals" },
  { to: "/feed/search", end: true, label: "Search & Shop", testId: "feed-nav-shop", resetSearch: true },
  { to: "/feed/profile", end: false, label: "Profile", testId: "feed-nav-profile" },
];

/** All primary tabs in display order (desktop rail). */
export const FEED_PRIMARY_TABS = [...FEED_LEFT_TABS, ...FEED_RIGHT_TABS];

/** Desktop rail: Home first, then Share, then remaining tabs. */
export const FEED_RAIL_TABS_AFTER_HOME = [...FEED_LEFT_TABS.slice(1), ...FEED_RIGHT_TABS];

/** Menu capture return — Yellow Browse owns bookmarked/recent menus. */
export const FEED_MENU_CAPTURE_PATH = `/menu-capture?next=${encodeURIComponent("/browse-menus")}`;
export const FEED_MENU_CAPTURE_HINT = "Upload restaurant menus to Menuply";

export const FEED_GUEST_PROFILE_CARDS = [
  {
    to: FEED_SHELL_SIGNUP_PATH,
    title: "Join Menuply",
    blurb: "Create a free account to connect, post videos, and plan with friends.",
    testId: "feed-guest-join-card",
    primary: true,
  },
  {
    to: "/clusters",
    title: "Explore Clusters",
    blurb: "Stadiums, campuses, venues, and food places near you.",
    testId: "feed-guest-clusters-card",
  },
  {
    to: "/waiter",
    title: "Try Waiter",
    blurb: "Get meal ideas for breakfast, lunch, dinner, and late night.",
    testId: "feed-guest-waiter-card",
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
      { to: "/feed/profile", label: "My Menuply", testId: "feed-more-my-menuply" },
      { to: "/account/dining-crews", label: "Dining Crews", testId: "feed-more-dining-crews" },
      { to: "/account/what-we-doing", label: "Eating Plans", testId: "feed-more-eating-plans" },
      { to: "/activity", label: "Activity", testId: "feed-more-activity" },
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
