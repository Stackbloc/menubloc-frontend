/**
 * Flash Video lives on About Me as display (+ owner delete) only.
 * Record/upload is bottom-nav X / Feed — not a second camera on profile settings.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Flash Video displays on About Me; upload not in profile settings editor", () => {
  const block = read("src/pages/consumer/myMenuply/FlashVideosBlock.jsx");
  const editor = read("src/pages/consumer/myMenuply/DinerPersonalContextEditor.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");

  assert.match(block, /FlashVideosDisplay/);
  assert.doesNotMatch(block, /createWhatIAteToday|FeedVideo|market_discoverable/);

  assert.doesNotMatch(editor, /FlashVideosEditorField/);
  assert.match(editor, /diner-hobbies-input/);

  assert.match(hero, /FlashVideosDisplay/);
  assert.match(hero, /personalContextLines/);
  const linesJsx = hero.indexOf("personalContextLines.length");
  const displayJsx = hero.indexOf("<FlashVideosDisplay");
  assert.ok(linesJsx > 0 && displayJsx > linesJsx);

  assert.match(page, /getPublicFlashVideos/);
  assert.match(page, /onFlashVideoRemove/);
  assert.doesNotMatch(page, /onFlashVideoAdd=\{/);
});
