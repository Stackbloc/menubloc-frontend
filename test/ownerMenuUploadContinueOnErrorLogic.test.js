/**
 * Continue-on-error batch algorithm (mirrors OwnerMenuCreateWorkspace.handleUpload).
 * Proves a mid-batch failure does not abort remaining files.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

async function runOwnerMenuUploadBatch(files, submitFile) {
  const succeeded = [];
  const failed = [];
  let attempted = 0;
  for (const file of files) {
    attempted += 1;
    try {
      await submitFile(file);
      succeeded.push(file.name);
    } catch (err) {
      failed.push({ name: file.name, reason: err?.message || "failed" });
    }
  }
  return { attempted, succeeded, failed };
}

describe("owner menu upload continue-on-error logic E2E", () => {
  it("continues after a middle-file failure and keeps failed names", async () => {
    const files = [{ name: "a.jpg" }, { name: "b.jpg" }, { name: "c.jpg" }];
    const calls = [];
    const result = await runOwnerMenuUploadBatch(files, async (file) => {
      calls.push(file.name);
      if (file.name === "b.jpg") throw new Error("connection dropped");
      return { inserted_items: 2 };
    });
    assert.deepEqual(calls, ["a.jpg", "b.jpg", "c.jpg"]);
    assert.equal(result.attempted, 3);
    assert.deepEqual(result.succeeded, ["a.jpg", "c.jpg"]);
    assert.equal(result.failed.length, 1);
    assert.equal(result.failed[0].name, "b.jpg");
    assert.match(result.failed[0].reason, /connection dropped/);
  });
});
