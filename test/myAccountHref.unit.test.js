import assert from "node:assert/strict";

// Pure copy of href builder (keeps test free of React mount)
const TABS = ["profile", "menu", "settings", "qr", "delivery", "password"];
const MENU_PANELS = ["view", "edit"];
function normalizeTab(raw) {
  const id = String(raw || "").toLowerCase();
  return TABS.includes(id) ? id : "profile";
}
function normalizeMenuPanel(raw) {
  const id = String(raw || "").toLowerCase();
  return MENU_PANELS.includes(id) ? id : "view";
}
function myAccountHref(tabId, menuPanelId = "view") {
  const tab = normalizeTab(tabId);
  if (tab === "menu") {
    return `/operator/my-account?tab=menu&menuPanel=${encodeURIComponent(normalizeMenuPanel(menuPanelId))}`;
  }
  return `/operator/my-account?tab=${encodeURIComponent(tab)}`;
}

assert.equal(myAccountHref("menu"), "/operator/my-account?tab=menu&menuPanel=view");
assert.equal(myAccountHref("settings"), "/operator/my-account?tab=settings");
assert.equal(myAccountHref("qr"), "/operator/my-account?tab=qr");
assert.equal(myAccountHref("delivery"), "/operator/my-account?tab=delivery");
assert.equal(myAccountHref("password"), "/operator/my-account?tab=password");
assert.equal(myAccountHref("menu", "edit"), "/operator/my-account?tab=menu&menuPanel=edit");
assert.equal(myAccountHref("nope"), "/operator/my-account?tab=profile");
console.log("myAccountHref.unit: ok");
