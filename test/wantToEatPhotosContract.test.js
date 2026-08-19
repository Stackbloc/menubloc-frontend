/**
 * What I Want to Eat — photos + menu-item add path on My Menuply (Eating hub).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("My Menuply want list shows posts and menu-item link path", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(section, /WantToEatList/);
  assert.match(section, /eating-want-panel/);
  assert.match(bits, /want-to-eat-item/);
  assert.match(section, /want-to-eat-just-posted/);
  assert.match(page, /wantListError/);
  assert.match(bits, /Tap to link a menu item/);
});

test("My Menuply want compose accepts optional photo upload", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(page, /uploadWantToEatPhoto/);
  assert.match(compose, /eating-compose-\$\{chip\.id\}/);
  assert.match(compose, /ConsumerCameraPickButton/);
  assert.match(page, /photo_url/);
});

test("Menu item detail routes to save choice instead of inline want button", () => {
  const add = read("src/components/consumer/WantToEatAddButton.jsx");
  const detail = read("src/pages/MenuItemDetailPage.jsx");
  const choice = read("src/pages/consumer/MenuItemSaveChoicePage.jsx");
  assert.match(add, /createWantToEat/);
  assert.match(add, /menu_item_id/);
  assert.match(choice, /What I want to eat/);
  assert.match(detail, /showSaveToMyMenuply/);
  assert.doesNotMatch(detail, /WantToEatAddButton/);
});

test("Connection peer hub shows peer want list when connected", () => {
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(peer, /listPeerWantToEat/);
  assert.match(peer, /peerWants/);
  assert.match(section, /eating-want-panel/);
  assert.doesNotMatch(section, /Nothing yet\.[\s\S]*Nothing yet\./);
});
