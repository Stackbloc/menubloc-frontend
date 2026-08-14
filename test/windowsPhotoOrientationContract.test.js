/**
 * Windows photo orientation — page-level portrait (default) / landscape for
 * Windows carousel + Photos strip; operator Billboards + owner Profile Manager editors.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeWindowsPhotoOrientation,
  windowsFrameAspectRatio,
  windowsPhotoStripTileSize,
} from "../src/lib/windowsPhotoOrientation.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(normalizeWindowsPhotoOrientation(undefined), "portrait");
assert.equal(normalizeWindowsPhotoOrientation("LANDSCAPE"), "landscape");
assert.equal(windowsFrameAspectRatio("portrait"), "3 / 4");
assert.equal(windowsFrameAspectRatio("landscape"), "16 / 9");

const portraitTile = windowsPhotoStripTileSize({
  orientation: "portrait",
  isMobile: true,
  embedded: true,
});
assert.ok(portraitTile.tileH > portraitTile.tileW, "portrait tiles taller than wide");

const landscapeTile = windowsPhotoStripTileSize({
  orientation: "landscape",
  isMobile: true,
  embedded: true,
});
assert.ok(landscapeTile.tileW > landscapeTile.tileH, "landscape tiles wider than tall");

const billboard = read("src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx");
assert.match(billboard, /windowsPhotoOrientation/);
assert.match(billboard, /aspectRatio:\s*frameAspect/);
assert.match(billboard, /data-windows-orientation/);
assert.doesNotMatch(billboard, /height:\s*isMobile\s*\?\s*160/);

const photos = read("src/components/restaurant/publicProfile/ProfilePhotoStrip.jsx");
assert.match(photos, /windowsPhotoOrientation/);
assert.match(photos, /windowsPhotoStripTileSize/);
assert.match(photos, /data-windows-orientation/);

const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
assert.match(shell, /resolvedWindowsOrientation/);
assert.match(shell, /windowsPhotoOrientation=\{resolvedWindowsOrientation\}/);

const opApi = read("src/lib/operatorApi.js");
assert.match(opApi, /getWindowsPhotoOrientation/);
assert.match(opApi, /updateWindowsPhotoOrientation/);
assert.match(opApi, /windows-photo-orientation/);

const billboardsPage = read("src/pages/operator/OperatorBillboardsPage.jsx");
assert.match(billboardsPage, /windows-photo-orientation-control/);
assert.match(billboardsPage, /updateWindowsPhotoOrientation/);
assert.match(billboardsPage, /Portrait/);
assert.match(billboardsPage, /Landscape/);

const owner = read("src/pages/owner/OwnerProfileManager.jsx");
assert.match(owner, /owner-windows-photo-orientation/);
assert.match(owner, /windows_photo_orientation/);

const editor = read("src/pages/operator/OperatorProfileEditor.jsx");
assert.match(editor, /Windows photo orientation/);

console.log("windowsPhotoOrientationContract: PASS");
