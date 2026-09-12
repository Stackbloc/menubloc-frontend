/**
 * Diner profile About + photos on My Menuply.
 * Person identity, not restaurant/venue/dining-hall about, not a questionnaire.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("My Menuply identity hero is prominent with photo upload and short bio", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const highlights = read("src/pages/consumer/myMenuply/MyHighlightsGrid.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(page, /DinerIdentityHero/);
  assert.match(page, /EatingHubSection/);
  assert.match(page, /uploadDinerAvatar/);
  assert.match(page, /listConsumerProfileMedia/);
  assert.match(page, /uploadConsumerProfileMedia/);
  assert.match(page, /is_highlight/);
  assert.match(page, /setConsumerProfileMediaHighlight/);
  assert.match(page, /profileHighlightMedia/);
  assert.match(page, /onSavePendingHighlights|my-highlights-save/);
  assert.match(
    read("src/pages/consumer/myMenuply/ProfileGalleryComposeSheet.jsx"),
    /profile-gallery-confirm-upload/
  );
  assert.match(
    read("src/pages/consumer/myMenuply/ProfileGalleryComposeSheet.jsx"),
    /not saved yet/i
  );
  assert.match(page, /diner_about/);
  assert.ok(page.indexOf("<DinerIdentityHero") < page.indexOf("<MyMenuplyPresentationRails"));
  assert.ok(page.indexOf("<MyMenuplyPresentationRails") < page.indexOf("<EatingHubSection"));
  assert.match(section, /data-testid="eating"/);
  assert.match(hero, /Change profile photo/);
  assert.doesNotMatch(hero, /ProfileMediaGallery/);
  assert.doesNotMatch(hero, /Profile gallery/);
  assert.match(hero, /AvatarComposeSheet/);
  assert.match(read("src/pages/consumer/myMenuply/AvatarComposeSheet.jsx"), /MenuplyMediaPicker/);
  assert.match(read("src/pages/consumer/myMenuply/AvatarComposeSheet.jsx"), /facingMode="user"/);
  assert.match(hero, /diner-about-input/);
  assert.match(hero, /maxLength=\{ABOUT_MAX\}/);
  assert.match(hero, /LA food explorer/);
  assert.doesNotMatch(hero, /No about yet/);
  assert.ok(
    hero.lastIndexOf('data-testid="diner-about-input"') <
      hero.lastIndexOf("<DinerPersonalContextEditor"),
    "Edit profile details is last in About Me block"
  );
  assert.match(
    read("src/pages/consumer/myMenuply/MyHighlightsGrid.jsx"),
    /top-highlights/
  );
  assert.match(
    read("src/pages/consumer/myMenuply/MyHighlightsGrid.jsx"),
    /aspectRatio:\s*"1 \/ 1"/
  );
  assert.match(
    read("src/pages/consumer/myMenuply/MyHighlightsGrid.jsx"),
    /repeat\(3,/
  );
  assert.match(highlights, /Photos and short videos about you, your food, or whatever you want to share/);
  assert.match(highlights, /my-highlights-save/);
  assert.match(highlights, /my-highlight-pending/);
  assert.match(highlights, /useLongPressReveal|mediaLongPressReveal/);
  assert.doesNotMatch(highlights, /prefersHoverReveal|mediaHoverReveal/);
  assert.doesNotMatch(highlights, /Add photo or video/);
  const cameraLib = read("src/lib/consumerCameraCapture.js");
  assert.match(cameraLib, /getUserMedia/);
  const vercel = read("vercel.json");
  assert.match(vercel, /camera=\(self\)/);
  assert.doesNotMatch(vercel, /camera=\(\)/);
  assert.match(page, /EatingHubSection/);
  assert.match(compose, /MenuplyMediaPicker/);
  assert.doesNotMatch(hero, /Share My Menuply/);
  assert.doesNotMatch(hero, /Add a dining photo/);
  assert.doesNotMatch(hero, /vegetarian|gluten_free|allergen/i);
  assert.doesNotMatch(hero, /questionnaire|favorite cuisine/i);
  assert.match(hero, /diner-personal-context/);
  assert.match(hero, /onSaveProfileSettings/);
  assert.match(hero, /DinerPersonalContextEditor/);
  assert.match(page, /onSaveProfileSettings/);
});

test("Connection peer hub shows read-only My Highlights", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(peer, /listPeerProfileMedia/);
  assert.match(peer, /MyHighlightsGrid/);
  assert.match(peer, /buildTopHighlights/);
  assert.doesNotMatch(peer, /ProfileMediaGallery/);
});

test("Diner About is not restaurant, dining-hall, or venue about", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hero, /PROFILE_SECTION_HEADERS\.about|About me/);
  assert.match(hero, /data-testid="about-me"/);
  assert.doesNotMatch(hero, /restaurant about|venue about|dining hall about/i);
  assert.doesNotMatch(page, /restaurant_about/);
});
