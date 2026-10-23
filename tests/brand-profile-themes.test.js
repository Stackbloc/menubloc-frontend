import test from "node:test";
import assert from "node:assert/strict";

import {
  BRAND_PROFILE_THEMES,
  findBrandProfileTheme,
  normalizeBrandName,
  resolveBrandProfileTheme,
} from "../src/lib/brandProfileThemes.js";
import { profileStyleToCssVars } from "../src/lib/restaurantProfileStyles.js";

test("national brand names resolve to their theme", () => {
  assert.equal(findBrandProfileTheme("IHOP")?.name, "IHOP");
  assert.equal(findBrandProfileTheme("Starbucks")?.name, "Starbucks");
  assert.equal(findBrandProfileTheme("McDonald's")?.name, "McDonald's");
  assert.equal(findBrandProfileTheme("McDonald’s")?.name, "McDonald's");
  assert.equal(findBrandProfileTheme("Chick-fil-A")?.name, "Chick-fil-A");
  assert.equal(findBrandProfileTheme("Carl's Jr.")?.name, "Carl's Jr.");
  assert.equal(findBrandProfileTheme("In-N-Out Burger")?.name, "In-N-Out Burger");
  assert.equal(findBrandProfileTheme("Dunkin' Donuts")?.name, "Dunkin'");
  assert.equal(findBrandProfileTheme("Starbucks - Glendale #12")?.name, "Starbucks");
  assert.equal(findBrandProfileTheme("Waffle House")?.name, "Waffle House");
  assert.equal(findBrandProfileTheme("Waffle House #1203")?.name, "Waffle House");
  assert.equal(findBrandProfileTheme("Cracker Barrel")?.name, "Cracker Barrel");
  assert.equal(
    findBrandProfileTheme("Cracker Barrel Old Country Store")?.name,
    "Cracker Barrel"
  );
});

// Every active chain in Common Knowledge (public /franchises, 2026-10-23).
const COMMON_KNOWLEDGE_CHAINS = [
  "Applebee's", "Arby's", "Auntie Anne's", "Bacari Adams", "Baja Fresh", "Baskin-Robbins",
  "Blaze Pizza", "Bob Evans", "Bojangles", "Boston Pizza", "Buffalo Wild Wings", "Burger King",
  "Captain D's", "Carl's Jr.", "Carrabba's Italian Grill", "CAVA", "Checkers & Rally's",
  "Chick-fil-A", "Chicken Salad Chick", "Chili's Grill & Bar", "Chipotle", "Church's Chicken",
  "Cinnabon", "Cousins Subs", "Cracker Barrel", "Crumbl", "Culver's", "Dairy Queen",
  "Dave's Hot Chicken", "Del Taco", "Denny's", "Domino's", "Dunkin'", "Dutch Bros Coffee",
  "Egg Tuck", "El Pollo Loco", "Fazoli's", "Firehouse Subs", "Five Guys",
  "Freddy's Frozen Custard & Steakburgers", "Golden Corral", "Hardee's", "Hooters",
  "Hungry Howie's", "IHOP", "In-N-Out Burger", "Jack in the Box", "Jamba", "Jersey Mike's Subs",
  "Jet's Pizza", "Jimmy John's", "KFC", "Krispy Kreme", "Krystal", "Lazy Dog", "Little Caesars",
  "Long John Silver's", "LongHorn Steakhouse", "Marco's Pizza", "McAlister's Deli", "McDonald's",
  "MOD Pizza", "Moe's Southwest Grill", "Olive Garden", "Ono Hawaiian BBQ", "Outback Steakhouse",
  "Panda Express", "Panera Bread", "Papa John's", "Papa Murphy's", "Paris Baguette", "Perkins",
  "Pizza Hut", "Pizza Ranch", "Popeyes Louisiana Kitchen", "Portillo's", "Qdoba Mexican Eats",
  "Raising Cane's", "Red Lobster", "Round Table Pizza", "Ruby Tuesday", "Sbarro", "Schlotzsky's",
  "Scooter's Coffee", "Shake Shack", "Slim Chickens", "Smashburger", "Smoothie King",
  "Sonic Drive-In", "Starbucks", "Steak 'n Shake", "Subway", "Sweetgreen", "Taco Bell",
  "Taco John's", "Texas Roadhouse", "TGI Fridays", "The Blue Plate", "The Cheesecake Factory",
  "Tim Hortons", "Tropical Smoothie Cafe", "Waffle House", "Wendy's", "Whataburger",
  "White Castle", "Wingstop", "Yogurtland", "Yoshinoya", "Zaxby's",
];

test("every Common Knowledge chain has a brand theme", () => {
  const missing = COMMON_KNOWLEDGE_CHAINS.filter((name) => !findBrandProfileTheme(name));
  assert.deepEqual(missing, []);
});

test("independents with brand-like names are not themed", () => {
  assert.equal(findBrandProfileTheme("Starbucks Deli & Grill"), null);
  assert.equal(findBrandProfileTheme("Subway Tacos"), null);
  assert.equal(findBrandProfileTheme("Cafe Dulce"), null);
  assert.equal(findBrandProfileTheme(""), null);
  assert.equal(normalizeBrandName("Chick-fil-A"), "chickfila");
});

test("owner manual style wins over brand theme; brand_profile name is used", () => {
  assert.equal(resolveBrandProfileTheme({ name: "IHOP", profile_style_key: "coastal" }), null);
  assert.equal(
    resolveBrandProfileTheme({ name: "Store 600", brand_profile: { name: "IHOP" } })?.name,
    "IHOP"
  );
});

test("brand themes set explicit hero stops and readable button text", () => {
  for (const theme of Object.values(BRAND_PROFILE_THEMES)) {
    const vars = profileStyleToCssVars(theme);
    assert.equal(vars["--profile-hero-from"], theme.hero[0]);
    assert.equal(vars["--profile-hero-via"], theme.hero[1]);
    assert.equal(vars["--profile-hero-to"], theme.hero[2]);
    assert.match(theme.pageBackground, /^#[0-9a-f]{6}$/i);
    assert.equal(theme.buttonText, "#ffffff");
  }
});
