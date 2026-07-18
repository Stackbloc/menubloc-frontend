/**
 * My Account hub: Profile Editor | Menu | Settings | Password
 * Menu includes View + Edit menu content (worksheet) subdirectory.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function testMyAccountTabs() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(src, /Profile Editor/);
  assert.match(src, /label: "Menu"/);
  assert.match(src, /label: "Settings"/);
  assert.match(src, /label: "Password"/);
  assert.match(src, /tab=profile\|menu\|settings\|password/);
  assert.match(src, /OperatorRestaurantProfileForm/);
  assert.doesNotMatch(src, /Menu Lab →/);
}

function testMenuSubPanels() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(src, /View menu/);
  assert.match(src, /Edit menu content/);
  assert.match(src, /menuPanel=view\|edit/);
  assert.match(src, /Open Menu Worksheet/);
  assert.match(src, /\/menus\/\$\{menuId\}\/worksheet/);
  assert.match(src, /View public menu/);
}

function testSettingsAccountFields() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(src, /Account type/);
  assert.match(src, /Account opened/);
  assert.match(src, /Next billing date/);
  assert.match(src, /Change account type/);
  assert.match(src, /Cancel/);
  assert.match(src, /cancelPlatformSubscription/);
}

function testWorksheetReturnsToMyAccount() {
  const src = read("src/pages/operator/OperatorMenuWorksheetPage.jsx");
  assert.match(src, /\/operator\/my-account\?tab=menu&menuPanel=edit/);
  assert.match(src, /← My Account · Menu/);
}

testMyAccountTabs();
testMenuSubPanels();
testSettingsAccountFields();
testWorksheetReturnsToMyAccount();
console.log("operatorMyAccountHubContract: ok");
