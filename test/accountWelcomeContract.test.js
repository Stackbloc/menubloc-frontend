/**
 * Contract: diner welcome onboarding — spacing, Zip Code label, post-continue confirmation.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(
  path.resolve(__dirname, "../src/pages/consumer/AccountWelcome.jsx"),
  "utf8"
);

describe("AccountWelcome contract", () => {
  it("keeps eyebrow close to the logo", () => {
    expect(src).toMatch(/Your Diner Account/);
    expect(src).toMatch(/marginBottom:\s*18/);
    expect(src).not.toMatch(/marginBottom:\s*40/);
  });

  it("uses consistent body copy size for both intro paragraphs", () => {
    expect(src).toMatch(/fontSize:\s*16/);
    expect(src).toMatch(/BODY_COPY/);
    expect(src).not.toMatch(/fontSize:\s*15,\s*color:\s*"#6B7280"/);
  });

  it("labels the field Zip Code", () => {
    expect(src).toMatch(/Zip Code/);
    expect(src).toMatch(/Enter your Zip Code/);
    expect(src).not.toMatch(/ZIP code/);
    expect(src).not.toMatch(/Zip code/);
  });

  it("shows a ready transition before navigating home", () => {
    expect(src).toMatch(/showReady/);
    expect(src).toMatch(/Your account is all set up/);
    expect(src).toMatch(/additional preferences using the Waiter/);
    expect(src).toMatch(/taking you to the home screen/);
    expect(src).toMatch(/HOME_REDIRECT_MS/);
    expect(src).toMatch(/setShowReady\(true\)/);
  });
});
