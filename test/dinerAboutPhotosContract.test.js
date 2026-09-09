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
  const gallery = read("src/pages/consumer/myMenuply/ProfileMediaGallery.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(page, /DinerIdentityHero/);
  assert.match(page, /EatingHubSection/);
  assert.match(page, /uploadDinerAvatar/);
  assert.match(page, /listConsumerProfileMedia/);
  assert.match(page, /uploadConsumerProfileMedia/);
  assert.match(page, /is_highlight/);
  assert.match(page, /setConsumerProfileMediaHighlight/);
  assert.match(page, /profileHighlightPhotos/);
  assert.match(
    read("src/pages/consumer/myMenuply/ProfileGalleryComposeSheet.jsx"),
    /profile-gallery-add-to-highlights/
  );
  assert.match(
    read("src/pages/consumer/myMenuply/ProfileGalleryComposeSheet.jsx"),
    /Add to Top Highlights/
  );
  assert.match(page, /diner_about/);
  assert.ok(page.indexOf("<DinerIdentityHero") < page.indexOf("<MyMenuplyPresentationRails"));
  assert.ok(page.indexOf("<MyMenuplyPresentationRails") < page.indexOf("<EatingHubSection"));
  assert.match(section, /data-testid="eating"/);
  assert.match(hero, /Change profile photo/);
  assert.match(hero, /ProfileMediaGallery/);
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
    read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx"),
    /top-highlights/
  );
  assert.match(
    read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx"),
    /height: 148/
  );
  assert.doesNotMatch(
    read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx"),
    /height: 252/
  );
  assert.match(gallery, /about-me-profile-media/);
  assert.match(gallery, /profile-media-delete/);
  assert.match(gallery, /useLongPressReveal|mediaLongPressReveal/);
  assert.doesNotMatch(gallery, /prefersHoverReveal|mediaHoverReveal/);
  assert.doesNotMatch(gallery, /Add photo or video/);
  assert.doesNotMatch(gallery, /MenuplyMediaPicker/);
  assert.doesNotMatch(gallery, /profile-media-add/);
  const cameraLib = read("src/lib/consumerCameraCapture.js");
  assert.match(cameraLib, /getUserMedia/);
  const vercel = read("vercel.json");
  assert.match(vercel, /camera=\(self\)/);
  assert.doesNotMatch(vercel, /camera=\(\)/);
  assert.match(gallery, /not your eating diary/i);
  assert.match(page, /EatingHubSection/);
  assert.match(compose, /MenuplyMediaPicker/);
  assert.doesNotMatch(hero, /Share My Menuply/);
  assert.doesNotMatch(hero, /Add a dining photo/);
  assert.doesNotMatch(gallery, /Add a dining photo/);
  assert.doesNotMatch(hero, /vegetarian|gluten_free|allergen/i);
  assert.doesNotMatch(hero, /questionnaire|favorite cuisine/i);
  assert.match(hero, /diner-personal-context/);
  assert.match(hero, /onSaveProfileSettings/);
  assert.match(hero, /DinerPersonalContextEditor/);
  assert.match(page, /onSaveProfileSettings/);
});

test("Connection peer hub shows read-only profile media gallery", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  assert.match(peer, /listPeerProfileMedia/);
  assert.match(peer, /profileMedia=\{peerProfileMedia\}/);
});

test("Diner About is not restaurant, dining-hall, or venue about", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(hero, /Diner profile/);
  assert.doesNotMatch(hero, /restaurant about|venue about|dining hall about/i);
  assert.doesNotMatch(page, /restaurant_about/);
});
