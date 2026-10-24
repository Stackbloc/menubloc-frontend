import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { needsEmailVerification } from "../src/lib/emailVerification.js";

// Diner email verification (2026-10-24, docs/audits/2026-10-24_email-verification.md):
// sign-in and both signup pages show "Check your email" on email_verification_required,
// and /account/verify-email confirms the emailed link.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("needsEmailVerification matches the backend 202 payload only", () => {
  assert.equal(needsEmailVerification({ code: "email_verification_required" }), true);
  assert.equal(needsEmailVerification({ requires_email_verification: true }), true);
  assert.equal(needsEmailVerification({ code: "phone_verification_required" }), false);
  assert.equal(needsEmailVerification({ ok: true, consumer: { id: 1 } }), false);
  assert.equal(needsEmailVerification(null), false);
});

test("/account/verify-email route renders ConsumerVerifyEmail", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/account\/verify-email"[^\n]*<ConsumerVerifyEmail \/>/);
});

test("login context refuses to hydrate a session on email_verification_required", () => {
  const ctx = read("src/context/ConsumerContext.jsx");
  const login = ctx.slice(ctx.indexOf("const login = useCallback"), ctx.indexOf("const loginWithGoogle"));
  assert.match(login, /email_verification_required/);
  assert.ok(login.indexOf("email_verification_required") < login.indexOf("hydrateSessionAfterAuth"));
});

for (const page of ["src/pages/consumer/ConsumerLogin.jsx", "src/pages/consumer/ConsumerSignup.jsx", "src/pages/consumer/DinerSignup.jsx"]) {
  test(`${page} shows CheckEmailNotice with the pending token`, () => {
    const src = read(page);
    assert.match(src, /needsEmailVerification\(/);
    assert.match(src, /<CheckEmailNotice[^>]*pendingToken=\{pendingEmail\.token\}/);
    assert.match(src, /email_verification_token/);
  });
}

test("API helpers hit the backend email verification routes", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /"\/api\/consumer-auth\/email\/verify\/request"/);
  assert.match(api, /`\/api\/consumer-auth\/email\/verify\?token=/);
  assert.match(api, /post\("\/api\/consumer-auth\/email\/verify", \{ token \}\)/);
});
