import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dinerSignup = fs.readFileSync("src/pages/consumer/DinerSignup.jsx", "utf8");
const consumerSignup = fs.readFileSync("src/pages/consumer/ConsumerSignup.jsx", "utf8");
const consumerLogin = fs.readFileSync("src/pages/consumer/ConsumerLogin.jsx", "utf8");
const consumerContext = fs.readFileSync("src/context/ConsumerContext.jsx", "utf8");

test("signup uses email and password with one-time phone verification", () => {
  assert.match(consumerSignup, /type="email"/);
  assert.match(consumerSignup, /<SmsAuthModal/);
  assert.match(consumerSignup, /requires_phone_verification/);
  assert.match(consumerSignup, /onSuccess=.*account\/welcome/);
  assert.doesNotMatch(consumerSignup, /Sign up with phone number/);

  assert.match(dinerSignup, /type="email"/);
  assert.match(dinerSignup, /<SmsAuthModal/);
  assert.match(dinerSignup, /verificationToken=\{phoneVerificationToken/);
  assert.match(consumerSignup, /verificationToken=\{phoneVerificationToken/);
  assert.match(dinerSignup, /requires_phone_verification/);
  assert.match(dinerSignup, /onSuccess=.*account\/welcome/);
  assert.doesNotMatch(dinerSignup, /Create account with phone number/);
});

test("login keeps phone verification only for unverified accounts", () => {
  assert.match(consumerLogin, /phone_verification_required/);
  assert.match(consumerLogin, /<SmsAuthModal/);
  assert.match(consumerLogin, /verificationToken=\{phoneVerificationToken/);
  assert.match(consumerLogin, /\blogin\(/);
  assert.doesNotMatch(consumerLogin, /localhost:3001/);
  assert.doesNotMatch(consumerLogin, /Sign in with phone number/);
});

test("email signup does not load an authenticated session before verification", () => {
  assert.match(consumerContext, /return signupConsumer\(signupData\)/);
  assert.doesNotMatch(
    consumerContext,
    /await signupConsumer\(signupData\);\s*const data = await loadMe\(\)/
  );
});
