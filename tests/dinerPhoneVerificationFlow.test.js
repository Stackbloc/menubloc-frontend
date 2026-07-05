import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dinerSignup = fs.readFileSync("src/pages/consumer/DinerSignup.jsx", "utf8");
const consumerSignup = fs.readFileSync("src/pages/consumer/ConsumerSignup.jsx", "utf8");
const consumerContext = fs.readFileSync("src/context/ConsumerContext.jsx", "utf8");

test("diner signup requires the Twilio modal before navigation", () => {
  assert.match(dinerSignup, /<SmsAuthModal/);
  assert.match(dinerSignup, /setSmsOpen\(true\)/);
  assert.doesNotMatch(dinerSignup, /account\/welcome/);
  assert.match(consumerSignup, /<SmsAuthModal/);
  assert.doesNotMatch(consumerSignup, /account\/welcome/);
  assert.doesNotMatch(dinerSignup, /type="email"/);
  assert.doesNotMatch(consumerSignup, /type="email"/);
});

test("email signup does not load an authenticated session before verification", () => {
  assert.match(consumerContext, /return signupConsumer\(signupData\)/);
  assert.doesNotMatch(
    consumerContext,
    /await signupConsumer\(signupData\);\s*const data = await loadMe\(\)/
  );
});
