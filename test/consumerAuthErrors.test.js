import test from "node:test";
import assert from "node:assert/strict";
import {
  CONSUMER_AUTH_ERRORS,
  resolveConsumerConnectErrorMessage,
  resolveConsumerLoginErrorMessage,
} from "../src/lib/consumerAuthErrors.js";

test("resolveConsumerLoginErrorMessage maps invalid credentials", () => {
  assert.equal(
    resolveConsumerLoginErrorMessage({
      payload: { code: "invalid_credentials", error: "nope" },
    }),
    CONSUMER_AUTH_ERRORS.invalidCredentials,
  );
  assert.equal(
    resolveConsumerLoginErrorMessage(new Error("Invalid email or password")),
    CONSUMER_AUTH_ERRORS.invalidCredentials,
  );
});

test("resolveConsumerLoginErrorMessage maps post-auth session loss", () => {
  const err = new Error("Authentication required");
  err.status = 401;
  assert.equal(
    resolveConsumerLoginErrorMessage(err),
    CONSUMER_AUTH_ERRORS.sessionNotSaved,
  );
});

test("resolveConsumerConnectErrorMessage maps connect auth failure", () => {
  const err = new Error("Authentication required");
  err.status = 401;
  assert.match(
    resolveConsumerConnectErrorMessage(err, "AndreB"),
    /Sign in again/i,
  );
});
