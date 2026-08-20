/**
 * Diner signup referral attribution contract.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildDinerSignupAttribution,
  captureExternalReferrer,
} from "../src/lib/dinerSignupAttribution.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("dinerSignupAttribution", () => {
  it("maps diner signup page to diner_signup_page", () => {
    const payload = buildDinerSignupAttribution({ signupPage: "diner" });
    assert.equal(payload.signup_source, "diner_signup_page");
  });

  it("maps QR connect signup to diner_qr_connect", () => {
    const payload = buildDinerSignupAttribution({ fromQrConnect: true });
    assert.equal(payload.signup_source, "diner_qr_connect");
  });

  it("signup pages pass attribution into signup()", () => {
    const diner = read("src/pages/consumer/DinerSignup.jsx");
    const account = read("src/pages/consumer/ConsumerSignup.jsx");
    assert.match(diner, /buildDinerSignupAttribution/);
    assert.match(account, /buildDinerSignupAttribution/);
  });
});

describe("captureExternalReferrer", () => {
  it("returns null without document.referrer", () => {
    const prev = global.document;
    global.document = { referrer: "" };
    try {
      assert.equal(captureExternalReferrer(), null);
    } finally {
      global.document = prev;
    }
  });
});
