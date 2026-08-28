import test from "node:test";
import assert from "node:assert/strict";
import {
  rewriteSearchPathForFeedShell,
  isFeedShellSearchResultsView,
} from "../src/lib/feedShellNavigation.js";

test("rewriteSearchPathForFeedShell keeps query params", () => {
  assert.equal(
    rewriteSearchPathForFeedShell("/search?q=tacos&city=Los+Angeles&state=CA"),
    "/feed/search?q=tacos&city=Los+Angeles&state=CA"
  );
  assert.equal(rewriteSearchPathForFeedShell("/browse-menus"), "/browse-menus");
});

test("isFeedShellSearchResultsView detects active search", () => {
  assert.equal(isFeedShellSearchResultsView(new URLSearchParams("")), false);
  assert.equal(isFeedShellSearchResultsView(new URLSearchParams("q=pizza")), true);
  assert.equal(isFeedShellSearchResultsView(new URLSearchParams("vegan=1&city=LA")), true);
});
