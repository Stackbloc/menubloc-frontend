import { CANONICAL_ORIGIN } from "./canonicalUrlCore.js";

function page(path, title, description, changefreq = "monthly", priority = 0.5) {
  return {
    path,
    title,
    description,
    canonical: `${CANONICAL_ORIGIN}${path}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: `${CANONICAL_ORIGIN}/menuply-share-default.svg`,
    changefreq,
    priority,
  };
}

export const INDEXABLE_STATIC_PAGES = [
  page("/", "Menuply | Discover Local Menus, Deals & Nutrition", "Browse restaurant menus near you. Find dishes, deals, and nutrition insights on Menuply.", "daily", 1),
  page("/browse-menus", "Browse Restaurant Menus | Menuply", "Explore restaurant menus in your area on Menuply. Find the best local dishes near you.", "daily", 0.9),
  page("/deals", "Restaurant Deals | Menuply", "Browse current restaurant deals available through Menuply.", "daily", 0.7),
  page("/foodtrucks", "Food Truck Directory | Menuply", "Discover public food truck profiles and schedules on Menuply.", "weekly", 0.6),
  page("/about", "About Menuply | Food Intelligence Platform", "Learn how Menuply helps you explore restaurant menus, compare dishes, and make better food choices."),
  page("/contact", "Contact Menuply | Get in Touch", "Contact the Menuply team for support, restaurant partnerships, or general inquiries.", "monthly", 0.4),
  page("/pricing", "Restaurant Pricing | Menuply", "Review Menuply restaurant plans and pricing.", "monthly", 0.4),
  page("/terms", "Terms of Service | Menuply", "Read the Menuply Terms of Service governing use of the platform.", "monthly", 0.3),
  page("/privacy", "Privacy Policy | Menuply", "Read the Menuply Privacy Policy covering how your data is collected and used.", "monthly", 0.3),
  page("/restaurant/onboarding", "List Your Restaurant on Menuply | Get Found Online", "Join Menuply and get your restaurant menu in front of local customers searching for food."),
  page("/signup", "Restaurant Sign Up | Menuply", "Create your Menuply restaurant account and start managing your menu online.", "monthly", 0.4),
  page("/franchises", "Restaurant Franchises | Menuply", "Learn about franchise restaurant participation on Menuply."),
];

export const INDEXABLE_STATIC_META = Object.fromEntries(
  INDEXABLE_STATIC_PAGES.map((entry) => [entry.path, entry])
);
