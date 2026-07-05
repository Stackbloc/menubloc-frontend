import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { formatCodeSentNotice, resolveSmsAuthErrorMessage, SMS_AUTH_MESSAGES } from "../src/lib/smsAuthMessages.js";

const smsModal = fs.readFileSync("src/components/auth/SmsAuthModal.jsx", "utf8");
const consumerContext = fs.readFileSync("src/context/ConsumerContext.jsx", "utf8");

test("SmsAuthModal uses canonical phone from send response for verify", () => {
  assert.match(smsModal, /setVerifiedPhone\(canonicalPhone\)/);
  assert.match(smsModal, /verifySmsCode\(verifiedPhone, code, verificationSid/);
  assert.match(smsModal, /verifiedPhone \|\| phoneInput/);
  assert.match(smsModal, /purpose = "signup"/);
  assert.doesNotMatch(smsModal, /No password needed/);
});

test("SmsAuthModal does not call onSuccess before backend verify resolves", () => {
  assert.match(smsModal, /await verifySmsCode\(verifiedPhone, code, verificationSid/);
  assert.doesNotMatch(smsModal, /onSuccess\?\.\(\);\s*await verifySmsCode/);
});

test("SmsAuthModal shows expiration from backend send response", () => {
  assert.match(smsModal, /formatCodeSentNotice/);
  assert.match(smsModal, /verification_ttl_minutes/);
  assert.match(smsModal, /expires_in_seconds/);
  assert.doesNotMatch(smsModal, /Code expires in 10 minutes/);
  assert.equal(
    formatCodeSentNotice({ verificationTtlMinutes: 10 }),
    "Code sent. It expires in 10 minutes."
  );
});

test("SmsAuthModal shows required user-facing messages", () => {
  assert.match(smsModal, /formatCodeSentNotice/);
  assert.match(smsModal, /resolveSmsAuthErrorMessage/);
  assert.equal(SMS_AUTH_MESSAGES.codeExpired, "Code expired. Request a new code.");
  assert.equal(SMS_AUTH_MESSAGES.invalidCode, "Invalid code.");
});

test("verifySmsCode applies backend verify payload before navigation", () => {
  assert.match(consumerContext, /const verified = await verifyConsumerSmsCode/);
  assert.match(consumerContext, /if \(verified\?\.consumer\) \{\s*applySession\(verified\)/);
});

test("resolveSmsAuthErrorMessage maps HTTP status when message missing", () => {
  assert.equal(resolveSmsAuthErrorMessage({ status: 404 }), SMS_AUTH_MESSAGES.codeExpired);
  assert.equal(resolveSmsAuthErrorMessage({ status: 429 }), SMS_AUTH_MESSAGES.tooManyAttempts);
  assert.equal(resolveSmsAuthErrorMessage({ status: 400 }), SMS_AUTH_MESSAGES.invalidCode);
});

test("resolveSmsAuthErrorMessage maps missing verification session clearly", () => {
  assert.equal(
    resolveSmsAuthErrorMessage({ payload: { code: "verification_session_required" } }),
    SMS_AUTH_MESSAGES.verificationSessionRequired
  );
});
