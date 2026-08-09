/**
 * Menu Manager: Clear dishes keeps shell for Update OCR from scratch;
 * sole/primary menu cannot use Delete menu.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = fs.readFileSync(
  path.join(ROOT, "src/pages/owner/OwnerMenuCreateWorkspace.jsx"),
  "utf8"
);
const api = fs.readFileSync(path.join(ROOT, "src/lib/ownerApi.js"), "utf8");

assert.match(api, /clearMenuConsoleMenuItems/);
assert.match(api, /clear-items/);
assert.match(workspace, /clearMenuConsoleMenuItems/);
assert.match(workspace, /handleClearMenuDishes/);
assert.match(workspace, /data-testid="owner-menu-clear-dishes"/);
assert.match(workspace, /Clear dishes/);
assert.match(workspace, /menusWithItems\.length > 1/);
assert.match(workspace, /Use Clear dishes/);

console.log("ownerMenuClearDishesContract: ok");
