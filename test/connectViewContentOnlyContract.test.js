/**
 * Connect view / peer surfaces: content about the profile holder only.
 * Never Menuply product how-to, compose coaching, or "add something" instructions.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Connect view is content-only — no how-to instructions", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const shellPage = read("src/pages/consumer/feed/FeedShellPage.jsx");
  const home = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");

  assert.match(page, /Connect view: content about this diner only/);
  assert.match(page, /previewAsConnect/);
  assert.match(shellPage, /useSearchParams/);
  assert.match(shellPage, /buildProfileViewSearchParams/);
  assert.match(shellPage, /readConnectViewFromWindow/);
  assert.match(shellPage, /Outlet context=\{profileViewOutlet\}/);
  assert.match(shellPage, /setPreviewAsConnect/);
  assert.doesNotMatch(shellPage, /navigate\(\{ pathname: "\/feed\/profile"/);
  assert.match(page, /useOutletContext/);
  assert.match(page, /profileView\.previewAsConnect/);
  assert.match(page, /profileView\.toggleProfileView/);
  assert.match(page, /readOnly=\{previewAsConnect\}/);
  assert.match(page, /editMode=\{!previewAsConnect\}/);
  assert.match(page, /needs_primary_location && !previewAsConnect/);
  assert.match(page, /HomeAtHomeSection[\s\S]*readOnly=\{previewAsConnect\}/);
  assert.match(page, /MyMenuplyPresentationRails[\s\S]*readOnly=\{previewAsConnect\}/);
  assert.match(page, /previewAsConnect[\s\S]*No crews to show/);
  assert.match(page, /previewAsConnect[\s\S]*Nothing yet/);

  assert.match(home, /Connect \/ peer \(readOnly\): content only/);
  assert.match(home, /Add photos of your home cooked meals/);
  assert.doesNotMatch(home, /Cooking videos I make/);
  assert.doesNotMatch(home, /Cooking videos you make/);
  assert.doesNotMatch(home, /Photos stay on your profile/);
  assert.doesNotMatch(home, /Cooking videos can also appear on Feed/);

  assert.match(hub, /isConnectPreview/);
  assert.match(hub, /isConnectPreview && typeof onJoinMeFromCraving === "function"/);
  assert.match(hub, /isConnectPreview=\{isConnectPreview\}/);
  assert.match(hub, /canEdit \?[\s\S]*ActivityStatusLineCompose/);
  assert.match(hub, /No cravings shared yet/);
  assert.match(hub, /Nothing shared for this day/);
  assert.match(hub, /Join Me — peer hub only/);

  assert.match(rails, /Restaurants I Follow/);
  assert.match(rails, /wantSuggestions\.length > 0 && hubFocus !== "dishes" && !readOnly/);
  assert.match(rails, /showFoodStoryCta && !readOnly/);

  const viewToggle = read("src/components/consumer/feed/ProfileViewModeToggle.jsx");
  assert.match(viewToggle, /profile-view-mode-toggle/);
  assert.match(viewToggle, /Edit View/);
  assert.match(viewToggle, /Connect View/);
  assert.match(viewToggle, /profile-view-mode-label/);
  assert.match(read("src/pages/consumer/feed/FeedShellPage.jsx"), /profileViewToggle/);
  assert.match(read("src/pages/consumer/feed/FeedShellPage.jsx"), /toggleProfileView/);
  assert.match(read("src/components/consumer/feed/FeedMobileHeader.jsx"), /ProfileViewModeToggle/);
  assert.match(page, /isDesktopFeed \?[\s\S]*ProfileViewModeToggle/);
  assert.match(page, /toggleProfileViewMode/);
});
