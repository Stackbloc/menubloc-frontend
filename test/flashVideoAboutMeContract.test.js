/**
 * Flash Video lives under Personal details (hobbies) on My Menuply About Me — not Feed.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Flash Video is under personal details and shows with human About Me content", () => {
  const block = read("src/pages/consumer/myMenuply/FlashVideosBlock.jsx");
  const editor = read("src/pages/consumer/myMenuply/DinerPersonalContextEditor.jsx");
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");

  assert.match(block, /FlashVideosEditorField/);
  assert.match(block, /FlashVideosDisplay/);
  assert.doesNotMatch(block, /createWhatIAteToday|FeedVideo|market_discoverable/);

  assert.match(editor, /FlashVideosEditorField/);
  assert.match(editor, /diner-hobbies-input/);
  const hobbiesJsx = editor.indexOf('data-testid="diner-hobbies-input"');
  const flashJsx = editor.indexOf("<FlashVideosEditorField");
  assert.ok(hobbiesJsx > 0 && flashJsx > hobbiesJsx);

  assert.match(hero, /FlashVideosDisplay/);
  assert.match(hero, /personalContextLines/);
  const linesJsx = hero.indexOf("personalContextLines.length");
  const displayJsx = hero.indexOf("<FlashVideosDisplay");
  assert.ok(linesJsx > 0 && displayJsx > linesJsx);

  assert.match(page, /uploadProfileMedia/);
  assert.match(page, /media_subtype:\s*"flash_video"/);
  assert.match(page, /getPublicFlashVideos/);
  assert.match(page, /onFlashVideoAdd/);
  assert.match(page, /flash_video/);
});
