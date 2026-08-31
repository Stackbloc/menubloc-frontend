/**
 * My Month in Food — About Me icon link + model shaping + routes.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMonthInFoodModel, shiftYm } from "../src/pages/consumer/monthInFood/buildMonthInFoodModel.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("About Me uses Month in Food icon with hover title", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  assert.match(hero, /monthInFoodHref/);
  assert.match(hero, /data-testid="month-in-food-link"/);
  assert.match(hero, /title="My Month in Food"/);
  assert.match(hero, /aria-label="My Month in Food"/);
  assert.match(hero, /monthInFoodIconLink/);
  assert.doesNotMatch(hero, />\s*My Month in Food\s*</);
});

test("self and peer hubs wire Month in Food hrefs", () => {
  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(mine, /monthInFoodHref=\{MY_MENUPLY_MONTH_IN_FOOD_PATH\}/);
  assert.match(peer, /\/account\/connections\/\$\{encodeURIComponent\(String\(peerId\)\)\}\/month-in-food/);
});

test("App routes Month in Food self and peer pages", () => {
  const app = read("src/App.jsx");
  assert.match(app, /MonthInFoodPage/);
  assert.match(app, /path="\/my-menuply\/month-in-food"/);
  assert.match(app, /path="\/account\/connections\/:peerId\/month-in-food"/);
});

test("consumerApi exposes month-in-food helpers", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /export const getMonthInFood/);
  assert.match(api, /export const getPeerMonthInFood/);
  assert.match(api, /\/api\/consumer\/month-in-food/);
  assert.match(api, /\/api\/consumer\/connections\/.*month-in-food/);
});

test("footer Copy Link keeps placement; shareUtils + ShareModal for menuply.com URL", () => {
  const footer = read("src/pages/consumer/monthInFood/MonthInFoodFooter.jsx");
  assert.match(footer, /buildConsumerPathShareData/);
  assert.match(footer, /ShareModal/);
  assert.match(footer, /Copy Link/);
  assert.match(footer, /data-testid="month-in-food-footer-share"/);
  assert.doesNotMatch(footer, /buildMenuplyPathShareData/);
  assert.doesNotMatch(footer, /diningCrewInviteShare/);
});

test("share icon stays next to Month in Food title only (not sticky header)", () => {
  const page = read("src/pages/consumer/monthInFood/MonthInFoodPage.jsx");
  const sections = read("src/pages/consumer/monthInFood/MonthInFoodSections.jsx");
  assert.match(page, /buildConsumerPathShareData/);
  assert.match(page, /from "\.\.\/\.\.\/\.\.\/components\/share\/shareUtils\.js"/);
  assert.match(page, /<StickyPageHeader title="My Month in Food" \/>/);
  assert.doesNotMatch(page, /titleAccessory=\{shareAccessory\}/);
  assert.doesNotMatch(page, /data-testid="month-in-food-share"/);
  assert.doesNotMatch(page, /buildMenuplyPathShareData/);
  assert.doesNotMatch(page, /diningCrewInviteShare/);
  assert.match(sections, /shareData/);
  assert.match(sections, /data-testid="month-in-food-title-share"/);
  assert.match(sections, /ShareButton/);
});

test("My Menuply surfaces Account settings without drawer-only path", () => {
  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  const header = read("src/components/StickyPageHeader.jsx");
  assert.match(mine, /data-testid="my-menuply-account-settings"/);
  assert.match(mine, /to="\/account"/);
  assert.match(mine, /feed-profile-settings-row/);
  assert.doesNotMatch(mine, /stickyTitleAndFeed|my-menuply-sticky-head/);
  assert.doesNotMatch(mine, /SeeWhosEatingSurface/);
  assert.match(header, /titleAccessory/);
  assert.match(header, /sticky-header-account-settings/);
  assert.match(header, /MY_MENUPLY_PROFILE_PATH/);
});

test("shiftYm walks calendar months", () => {
  assert.equal(shiftYm("2025-05", -1), "2025-04");
  assert.equal(shiftYm("2025-01", -1), "2024-12");
  assert.equal(shiftYm("2025-12", 1), "2026-01");
});

test("buildMonthInFoodModel empty month hides cuisine and mood", () => {
  const model = buildMonthInFoodModel({
    ym: "2025-05",
    month_label: "May 2025",
    diary_visible: true,
    is_self: true,
    diary: [],
    wants: [],
    plans: [],
    events: [],
    profile_media: [],
    likes_in_month: 0,
    food_activity_count: 0,
    new_restaurants_count: 0,
  });
  assert.equal(model.totalMeals, 0);
  assert.equal(model.mood, null);
  assert.deepEqual(model.cuisineSlices, []);
  assert.equal(model.showEmptyHint, true);
  assert.ok(model.stats.some((s) => s.id === "meals" && s.value === 0));
  assert.ok(model.stats.some((s) => s.id === "dishes" && s.value === 0));
  assert.ok(!model.stats.some((s) => s.id === "home"));
});

test("buildMonthInFoodModel hides cuisine chart with single cuisine", () => {
  const model = buildMonthInFoodModel({
    ym: "2025-05",
    month_label: "May 2025",
    diary_visible: true,
    is_self: true,
    diary: [
      {
        id: 1,
        food_name: "Ramen",
        restaurant_id: 10,
        restaurant_name: "Daikoku",
        restaurant_city: "LA",
        cuisine: "Japanese",
        photo_url: "https://example.com/a.jpg",
      },
      {
        id: 2,
        food_name: "Udon",
        restaurant_id: 10,
        restaurant_name: "Daikoku",
        cuisine: "Japanese",
      },
      {
        id: 3,
        food_name: "Iced Latte",
        restaurant_id: 11,
        restaurant_name: "Cafe",
        cuisine: "Japanese",
      },
    ],
    wants: [],
    plans: [],
    events: [],
    profile_media: [],
    likes_in_month: 2,
    food_activity_count: 1,
    new_restaurants_count: 1,
  });
  assert.equal(model.totalMeals, 3);
  assert.equal(model.cuisineSlices.length, 0);
  assert.ok(model.mood);
  assert.equal(model.mood.drinkOfChoice, "Iced Latte");
  assert.ok(model.stats.some((s) => s.id === "favorites" && s.value === 2));
  assert.ok(model.highlights.length >= 1);
});

test("hidden diary yields no meal stats for peer", () => {
  const model = buildMonthInFoodModel({
    ym: "2025-05",
    month_label: "May 2025",
    diary_visible: false,
    is_self: false,
    diary: [{ id: 1, food_name: "Secret", cuisine: "Mexican" }],
    wants: [{ id: 9, food_name: "Tacos" }],
    plans: [],
    events: [],
    profile_media: [],
    likes_in_month: 5,
    food_activity_count: 5,
  });
  assert.equal(model.diaryVisible, false);
  assert.equal(model.totalMeals, 0);
  assert.deepEqual(model.stats, []);
  assert.equal(model.wants.length, 1);
});
