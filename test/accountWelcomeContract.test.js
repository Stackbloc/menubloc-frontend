/**
 * Contract: diner welcome onboarding — signup-matched hierarchy, Zip Code, ready confirm.
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
  it("matches Diner Signup title hierarchy under the logo", () => {
    expect(src).toMatch(/PAGE_TITLE/);
    expect(src).toMatch(/fontSize:\s*28/);
    expect(src).toMatch(/fontWeight:\s*800/);
    expect(src).toMatch(/marginTop:\s*16/);
    expect(src).toMatch(/height=\{48\}/);
    expect(src).toMatch(/Welcome to Menuply/);
    expect(src).not.toMatch(/textTransform:\s*"uppercase"/);
  });

  it("uses signup-matched body copy size", () => {
    expect(src).toMatch(/BODY_COPY/);
    expect(src).toMatch(/fontSize:\s*15/);
    expect(src).toMatch(/LEAD_LINE/);
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
