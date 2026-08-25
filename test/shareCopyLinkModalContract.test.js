import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const shareButton = fs.readFileSync(
  path.join(root, "src/components/share/ShareButton.jsx"),
  "utf8"
);
const shareModal = fs.readFileSync(
  path.join(root, "src/components/share/ShareModal.jsx"),
  "utf8"
);

test("ShareButton opens ShareModal instead of auto-invoking navigator.share", () => {
  assert.match(shareButton, /setIsModalOpen\(true\)/);
  assert.doesNotMatch(
    shareButton,
    /await navigator\.share\(/,
    "ShareButton must not call navigator.share on click (desktop OS sheet blocks Copy Link)"
  );
  assert.match(shareButton, /ShareModal/);
});

test("ShareModal exposes Copy Link as the primary share action", () => {
  assert.match(shareModal, /data-testid="share-copy-link"/);
  assert.match(shareModal, /Copy the link, then paste it into any app/);
  assert.match(shareModal, /data-testid="share-url-preview"/);
  assert.match(shareModal, /Share via device/);
  assert.match(shareModal, /--bottom-nav-h/);
  assert.match(shareModal, /maxHeight:/);
});

test("ShareModal null-safes buildShareLinks before early return", () => {
  assert.match(
    shareModal,
    /buildShareLinks\(shareData\s*\|\|\s*\{\}\)/,
    "ShareModal must not call buildShareLinks(null) while closed"
  );
});
