/**
 * Invite friends link code (?r=code, mig 0415, Andre 2026-11-10). node --test test/inviteCodeLinkContract.test.js
 * The code only lets Owner analytics credit a sign-up to the sharer: no connection, request or notification.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("withInviteCode adds ?r=code and ignores bad codes", async () => {
  const { withInviteCode, isInviteCode } = await import("../src/lib/inviteCodeLink.js");
  assert.equal(withInviteCode("https://menuply.com/diner/signup?next=%2Ffeed", "k7f3q9ab2c"), "https://menuply.com/diner/signup?next=%2Ffeed&r=k7f3q9ab2c");
  assert.equal(withInviteCode("https://menuply.com/diner/signup", "BAD CODE"), "https://menuply.com/diner/signup");
  assert.equal(withInviteCode("https://menuply.com/diner/signup", null), "https://menuply.com/diner/signup");
  assert.equal(isInviteCode("short"), false);
});

test("Invite friends note carries the coded link inside; without a code it's the plain link", async () => {
  const { buildMenuplyFriendInviteShareData } = await import("../src/lib/menuplyAccountInvite.js");
  const coded = buildMenuplyFriendInviteShareData("k7f3q9ab2c");
  assert.match(coded.url, /\/diner\/signup\?next=%2Ffeed&r=k7f3q9ab2c$/);
  assert.ok(coded.text.includes(coded.url));
  const plain = buildMenuplyFriendInviteShareData();
  assert.ok(!plain.url.includes("r="));
  assert.equal(plain.text.replace(plain.url, ""), coded.text.replace(coded.url, "")); // same note, only the link differs
});

test("code is captured on load and credited once after sign-in; both share sites use the diner's code", () => {
  assert.match(read("src/main.jsx"), /captureInviteCodeFromUrl\(\)/);
  assert.match(read("src/context/ConsumerContext.jsx"), /creditPendingInviteCode\(\)/);
  const pending = read("src/lib/pendingInviteCode.js");
  assert.match(pending, /menuply\.pendingInviteCode\.v1/);
  assert.match(pending, /clearPendingInviteCode\(\)/);
  for (const p of ["src/pages/consumer/SocialOnboardingPage.jsx", "src/pages/consumer/myMenuply/AppProfileCards.jsx"]) {
    assert.match(read(p), /buildMenuplyFriendInviteShareData\(myInviteCode\)/, p);
  }
});
