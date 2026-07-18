/**
 * Contract: search StatusMessage warning tone must stay readable on white page chrome.
 * Guards yellow-on-yellow (#FCD34D on pale amber) regression.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.resolve(__dirname, "../src/index.css"), "utf8");

describe("search status warning contrast", () => {
  it("uses dark amber ink on soft amber background", () => {
    expect(css).toMatch(/--gb-color-warning-bg:\s*#FFFBEB/i);
    expect(css).toMatch(/--gb-color-warning-border:\s*#F59E0B/i);
    expect(css).toMatch(/--gb-color-warning-text:\s*#92400E/i);
    expect(css).not.toMatch(/--gb-color-warning-text:\s*#FCD34D/i);
  });

  it("styles warning status messages with the warning tokens", () => {
    expect(css).toMatch(/\.gb-status-message--warning/);
    expect(css).toMatch(/var\(--gb-color-warning-text\)/);
  });
});
