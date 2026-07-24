/**
 * My Account hub: Profile Editor | Menu | Settings | My QR Code | Delivery Portal | Password
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
  assert.match(src, /label: "My QR Code"/);
  assert.match(src, /label: "Delivery Portal"/);
  assert.match(src, /label: "Password"/);
  assert.match(src, /tab=profile\|menu\|settings\|qr\|delivery\|password/);
  assert.match(src, /OperatorRestaurantProfileForm/);
  assert.match(src, /OperatorDeliveryPortalPanel/);
  assert.match(src, /data-testid="my-account-panel-qr"/);
  assert.match(src, /data-testid="my-account-panel-delivery"/);
  assert.match(src, /PrimaryQrCard/);
  assert.doesNotMatch(src, /Menu Lab →/);
  assert.doesNotMatch(src, /SectionCard title="Primary QR"/);
  // Tabs must drive local panel state + navigate (not URL-only setSearchParams)
  assert.match(src, /function selectTab\(/);
  assert.match(src, /function myAccountHref\(/);
  assert.match(src, /onSelect=\{selectTab\}/);
  assert.match(src, /data-testid="my-account-tabs"/);
  assert.match(src, /navigate\(myAccountHref/);
}

function testMenuSubPanels() {
  const src = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(src, /View menu/);
  assert.match(src, /Edit menu content/);
  assert.match(src, /menuPanel=view\|edit/);
  assert.match(src, /Open Menu Worksheet/);
  assert.match(src, /\/menus\/\$\{menuId\}\/worksheet/);
  assert.match(src, /View public menu/);
  assert.match(src, /selectMenuPanel/);
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

function testMarketplaceNav() {
  const layout = read("src/pages/operator/OperatorLayout.jsx");
  assert.match(layout, /operator\.nav\.marketplace/);
  assert.match(layout, /\/operator\/marketplace/);
  assert.match(layout, /Marketplace/);
}

function testPrimaryQrSharePrint() {
  const src = read("src/components/qr/PrimaryQrCard.jsx");
  assert.match(src, /data-testid="primary-qr-share"/);
  assert.match(src, /data-testid="primary-qr-print"/);
  assert.match(src, /navigator\.share/);
  assert.match(src, /window\.print/);
  assert.match(src, /\/operator\/marketplace/);
}

function testDeliveryPortalRewire() {
  const panel = read("src/pages/operator/OperatorDeliveryPortalPanel.jsx");
  const page = read("src/pages/operator/OperatorDeliveryPage.jsx");
  assert.match(panel, /uber_direct/);
  assert.match(panel, /doordash_drive/);
  assert.match(panel, /data-testid="delivery-portal-panel"/);
  assert.match(panel, /getDeliverySettings/);
  assert.match(panel, /https:\/\/direct\.uber\.com/);
  assert.match(panel, /https:\/\/developer\.doordash\.com\//);
  assert.match(panel, /Link Delivery Account/);
  assert.match(panel, /delivery-link-account-/);
  assert.match(panel, /activeProviders\.length > 0/);
  assert.match(page, /OperatorDeliveryPortalPanel/);
  assert.match(page, /\/operator\/my-account\?tab=delivery/);
  assert.doesNotMatch(page, /function ProviderCard/);
}

function testWorksheetReturnsToMyAccount() {
  const src = read("src/pages/operator/OperatorMenuWorksheetPage.jsx");
  assert.match(src, /\/operator\/my-account\?tab=menu&menuPanel=edit/);
  assert.match(src, /← My Account · Menu/);
}

testMyAccountTabs();
testMenuSubPanels();
testSettingsAccountFields();
testMarketplaceNav();
testPrimaryQrSharePrint();
testDeliveryPortalRewire();
testWorksheetReturnsToMyAccount();
console.log("operatorMyAccountHubContract: ok");
