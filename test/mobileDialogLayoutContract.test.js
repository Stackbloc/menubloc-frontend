/**
 * Diner mobile dialogs sit above Feed primary nav (z-index 1300)
 * with a sticky action row and visualViewport max-height.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("mobile dialog layout sits above Feed nav and uses visualViewport height", () => {
  const layout = read("src/pages/consumer/myMenuply/mobileDialogLayout.js");
  assert.match(layout, /MOBILE_DIALOG_Z_INDEX = 1400/);
  assert.match(layout, /visualViewport/);
  assert.match(layout, /mobileDialogStickyFooter/);
  assert.match(layout, /92dvh|100dvh/);
});

test("What I'm Eating / Catch Me / events / plans use the shared mobile dialog layout", () => {
  const compose = read("src/pages/consumer/myMenuply/ActivityStatusLineCompose.jsx");
  const eatingSheet = read("src/pages/consumer/myMenuply/EatingComposeSheet.jsx");
  const events = read("src/pages/consumer/myMenuply/EventComposeSheet.jsx");
  const catchMe = read("src/pages/consumer/myMenuply/CatchMePanel.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(compose, /createPortal/);
  assert.match(compose, /mobileDialogStickyFooter/);
  assert.match(eatingSheet, /useMobileDialogMaxHeight/);
  assert.match(events, /useMobileDialogMaxHeight/);
  assert.match(catchMe, /zIndex: 1400/);
  assert.match(hub, /mobileDialogBackdrop/);
});
