/**
 * Contract: hide Google/Apple consumer auth UI when not configured.
 * Never ship dead OAuth placeholders on login/signup.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shared = readFileSync(
  join(root, "src/components/consumer/ConsumerAuthShared.jsx"),
  "utf8"
);
const login = readFileSync(
  join(root, "src/pages/consumer/ConsumerLogin.jsx"),
  "utf8"
);
const signup = readFileSync(
  join(root, "src/pages/consumer/ConsumerSignup.jsx"),
  "utf8"
);

test("SocialAuthSection hides when Google and Apple are not configured", () => {
  assert.match(shared, /function SocialAuthSection/);
  assert.match(shared, /export function isGoogleAuthConfigured/);
  assert.match(shared, /export function isAppleAuthConfigured/);
  assert.match(shared, /VITE_GOOGLE_CLIENT_ID/);
  assert.match(shared, /VITE_APPLE_CLIENT_ID/);
  assert.match(shared, /VITE_APPLE_REDIRECT_URI/);
  assert.match(shared, /if \(!showGoogle && !showApple\) return null/);
  assert.match(shared, /showGoogle \? \(/);
  assert.match(shared, /showApple \? \(/);
});

test("GoogleSignInButton returns null when client id missing", () => {
  assert.match(shared, /export function GoogleSignInButton/);
  assert.match(shared, /if \(!clientId\) return null/);
  // Must not render disabled Google fallback when unconfigured
  assert.doesNotMatch(
    shared,
    /if \(!clientId\) \{\s*return \(\s*<GoogleButtonFallback[\s\S]*?disabled/
  );
});

test("AppleSignInButton returns null when client id or redirect missing", () => {
  assert.match(shared, /export function AppleSignInButton/);
  assert.match(shared, /if \(!clientId \|\| !redirectURI\) return null/);
});

test("Consumer login and signup only mount SocialAuthSection for Google/Apple", () => {
  assert.match(login, /SocialAuthSection/);
  assert.match(signup, /SocialAuthSection/);
  assert.doesNotMatch(login, /GoogleSignInButton/);
  assert.doesNotMatch(login, /AppleSignInButton/);
  assert.doesNotMatch(signup, /GoogleSignInButton/);
  assert.doesNotMatch(signup, /AppleSignInButton/);
});
