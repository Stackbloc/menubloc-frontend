import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSearchShopModeSearch,
  resolveSearchShopMode,
} from "../src/lib/searchShopMode.js";

test("Search & Shop always defaults to Search", () => {
  assert.equal(resolveSearchShopMode(new URLSearchParams("")), "search");
  assert.equal(resolveSearchShopMode(new URLSearchParams("view=bogus")), "search");
});

test("URL ?view=menu-browser opens Menu Browser", () => {
  assert.equal(resolveSearchShopMode(new URLSearchParams("view=menu-browser")), "menu-browser");
  assert.equal(resolveSearchShopMode(new URLSearchParams("view=search")), "search");
});

test("switching keeps query and filters", () => {
  const next = buildSearchShopModeSearch(new URLSearchParams("q=pizza&vegan=1&city=Los+Angeles"), "menu-browser");
  assert.equal(next.get("q"), "pizza");
  assert.equal(next.get("vegan"), "1");
  assert.equal(next.get("city"), "Los Angeles");
  assert.equal(next.get("view"), "menu-browser");
});

test("/browse-menus redirects into Search & Shop Menu Browser mode with params kept", async () => {
  const { buildMenuBrowserRedirectPath } = await import("../src/lib/searchShopMode.js");
  assert.equal(buildMenuBrowserRedirectPath(""), "/feed/search?view=menu-browser");
  const out = new URL(
    buildMenuBrowserRedirectPath("?cluster=indio-festival-grounds&section=nearby&i=2&mode=drinks"),
    "https://menuply.com"
  );
  assert.equal(out.pathname, "/feed/search");
  assert.equal(out.searchParams.get("view"), "menu-browser");
  assert.equal(out.searchParams.get("cluster"), "indio-festival-grounds");
  assert.equal(out.searchParams.get("section"), "nearby");
  assert.equal(out.searchParams.get("i"), "2");
  assert.equal(out.searchParams.get("mode"), "drinks");
});

test("menuBrowserPath is the canonical Menu Browser link (no /browse-menus)", async () => {
  const { MENU_BROWSER_PATH, menuBrowserPath } = await import("../src/lib/searchShopMode.js");
  assert.equal(MENU_BROWSER_PATH, "/feed/search?view=menu-browser");
  assert.equal(menuBrowserPath("city=Los+Angeles&state=CA"), "/feed/search?view=menu-browser&city=Los+Angeles&state=CA");
  assert.equal(menuBrowserPath(), "/feed/search?view=menu-browser");
});
