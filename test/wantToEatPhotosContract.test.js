/**
 * What I Want to Eat — photos + menu-item add path on My Menuply.
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
  assert.match(page, /want-to-eat-item/);
  assert.match(page, /want-to-eat-just-posted/);
  assert.match(page, /wantListError/);
  assert.match(page, /Tap to link a menu item/);
});

test("My Menuply want compose accepts optional photo upload", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /uploadWantToEatPhoto/);
  assert.match(page, /compose-want[\s\S]*acceptPhoto/);
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
  assert.match(peer, /listPeerWantToEat/);
  assert.match(peer, /peerWants/);
  assert.doesNotMatch(peer, /Nothing yet\.[\s\S]*want-to-eat[\s\S]*Nothing yet\./);
});
