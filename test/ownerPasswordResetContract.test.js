/**
 * Owner login must expose password recovery (same operators table as operator auth).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const login = read("src/pages/owner/OwnerLogin.jsx");
assert.match(login, /to="\/owner\/recover"/, "OwnerLogin must link Forgot password to /owner/recover");
assert.match(login, /Forgot password\?/, "OwnerLogin must show Forgot password?");

const recovery = read("src/pages/owner/OwnerRecovery.jsx");
assert.match(recovery, /audience:\s*["']owner["']/, "OwnerRecovery must request audience=owner");
assert.match(recovery, /requestOperatorRecovery/, "OwnerRecovery must call operator forgot API");
assert.match(recovery, /to="\/owner\/login"/, "OwnerRecovery must link back to owner login");

const reset = read("src/pages/owner/OwnerResetPassword.jsx");
assert.match(reset, /resetOperatorPassword/, "OwnerResetPassword must reuse operator reset API");
assert.match(reset, /navigate\("\/owner\/login"/, "After reset, redirect to owner login");

const app = read("src/App.jsx");
assert.match(app, /path="\/owner\/recover"/, "App must route /owner/recover");
assert.match(app, /path="\/owner\/reset-password"/, "App must route /owner/reset-password");

const api = read("src/lib/operatorApi.js");
assert.match(api, /options\.audience/, "requestOperatorRecovery must accept audience option");

console.log("ownerPasswordResetContract: ok");
