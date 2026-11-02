import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Android App Links (Andre approved 2026-10-25, menuply-mobile docs/09): menuply.com/invite/* opens the
// Menuply app. Android verifies this file; it must stay valid JSON with the app's package + cert SHA-256.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("assetlinks.json delegates menuply.com links to com.menuply.app", () => {
  const raw = fs.readFileSync(path.join(root, "public/.well-known/assetlinks.json"), "utf8");
  const [entry] = JSON.parse(raw);
  assert.deepEqual(entry.relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(entry.target.namespace, "android_app");
  assert.equal(entry.target.package_name, "com.menuply.app");
  assert.ok(entry.target.sha256_cert_fingerprints.every((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f)));
});
