/**
 * Public profile ↔ editor parity contract.
 *
 * Every public homepage field must have:
 *  1. an editor question (operator and/or owner)
 *  2. a persist path that writes the live public API field
 *  3. a public shell consumer of that field
 *
 * If the public profile design changes, update editors + this contract together.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testPublicShellConsumesHomepageFields() {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  const about = read("src/components/restaurant/publicProfile/ProfileAboutFounded.jsx");
  const fav = read("src/components/restaurant/publicProfile/ProfileFavoriteMenuItems.jsx");
  const updates = read("src/components/restaurant/publicProfile/ProfileUpdates.jsx");
  const deals = read("src/components/restaurant/publicProfile/ProfileDealsSection.jsx");
  const photos = read("src/components/restaurant/publicProfile/ProfilePhotoStrip.jsx");
  const page = read("src/pages/RestaurantPublicPage.jsx");

  assert.match(hero, /instagram/);
  assert.match(hero, /website/);
  assert.match(hero, /phone/);
  assert.match(hero, /operatingHours|formatHoursRows/);
  assert.match(about, /founded/);
  assert.match(about, /about|shortDescription|About/);
  assert.match(about, /ProfilePhotoStrip/);
  assert.match(shell, /showPhotos=\{false\}/);
  assert.match(fav, /favoriteMenuItems|Favorite Menu Items/);
  assert.match(updates, /profile_updates|profileUpdates|Updates/);
  assert.match(deals, /dealItems|Deals/);
  assert.match(photos, /billboard|banner|logo/);
  assert.match(page, /favorite_menu_items/);
  assert.match(page, /profile_updates/);
  assert.match(page, /profile=\{data\}/);
}

function testOperatorEditorAsksHomepageQuestions() {
  const editor = read("src/pages/operator/OperatorProfileEditor.jsx");
  const api = read("src/lib/operatorApi.js");

  assert.match(editor, /data-testid="operator-profile-instagram"/);
  assert.match(editor, /instagram:\s*form\.instagram/);
  assert.match(editor, /founded_year/);
  assert.match(editor, /about_us/);
  assert.match(editor, /data-testid="operator-profile-favorite-items"/);
  assert.match(editor, /data-testid="operator-profile-updates"/);
  assert.match(editor, /data-testid="operator-profile-billboards-link"/);
  assert.match(editor, /data-testid="operator-profile-deals-link"/);
  assert.match(editor, /updateFavoriteMenuItems/);
  assert.match(editor, /createProfileUpdate/);
  assert.match(editor, /deleteProfileUpdate/);
  assert.match(editor, /favorite_menu_items/);
  assert.match(api, /\/favorite-menu-items/);
  assert.match(api, /\/profile-updates/);
}

function testOwnerEditorAsksHomepageQuestions() {
  const owner = read("src/pages/owner/OwnerProfileManager.jsx");
  const api = read("src/lib/ownerApi.js");

  assert.match(owner, /data-testid="owner-profile-manager-instagram"/);
  assert.match(owner, /instagram: form\.instagram/);
  assert.match(owner, /about_us: form\.about_us/);
  assert.match(owner, /founded_year/);
  assert.match(owner, /owner-profile-manager-favorite-items/);
  assert.match(owner, /owner-profile-manager-updates|Profile Updates/);
  assert.match(owner, /updateOwnerRestaurantFavoriteMenuItems/);
  assert.match(owner, /createOwnerRestaurantProfileUpdate/);
  assert.match(owner, /updateMenuConsoleRestaurant/);
  assert.match(api, /favorite-menu-items/);
  assert.match(api, /profile-updates/);
  assert.match(api, /updateMenuConsoleRestaurant/);
}

function testPersistPathsReachPublicFields() {
  const editor = read("src/pages/operator/OperatorProfileEditor.jsx");
  const owner = read("src/pages/owner/OwnerProfileManager.jsx");

  assert.match(editor, /updateProfile\(rid, payload\)/);
  assert.match(editor, /publishProfile/);
  assert.match(editor, /mismatches\.push\("instagram"\)/);
  assert.match(editor, /mismatches\.push\("founded_year"\)/);
  assert.match(editor, /mismatches\.push\("favorite_menu_items"\)/);
  assert.match(owner, /instagram: form\.instagram/);
  assert.match(owner, /updateOwnerRestaurantFavoriteMenuItems\(selected\.id, ids\)/);
  assert.match(owner, /createOwnerRestaurantProfileUpdate\(selected\.id/);
}

testPublicShellConsumesHomepageFields();
testOperatorEditorAsksHomepageQuestions();
testOwnerEditorAsksHomepageQuestions();
testPersistPathsReachPublicFields();

console.log("publicProfileEditorParityContract: ok");
