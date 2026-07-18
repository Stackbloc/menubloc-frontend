/**
 * Contract: AdminConsoleShell must not horizontally overflow the viewport
 * (owner + operator “slides off the monitor” regression).
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(
  path.resolve(__dirname, "../src/components/adminConsole/adminConsoleShell.css"),
  "utf8"
);

describe("admin console viewport containment", () => {
  it("uses a 2-column grid with minmax(0,1fr) main track", () => {
    expect(css).toMatch(/display:\s*grid/);
    expect(css).toMatch(/grid-template-columns:\s*var\(--admin-sidebar-w[^)]*\)\s+minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/overflow-x:\s*clip/);
    expect(css).toMatch(/max-width:\s*100%/);
  });

  it("does not use fixed sidebar + 100vw column sizing on desktop", () => {
    // Desktop sidebar should be sticky inside the grid, not fixed with margin-left compensation
    expect(css).toMatch(/\.admin-console__sidebar\s*\{[^}]*position:\s*sticky/s);
    expect(css).not.toMatch(/margin-left:\s*var\(--admin-sidebar-w/);
    expect(css).not.toMatch(/max-width:\s*100vw/);
    expect(css).not.toMatch(/width:\s*calc\(100% - var\(--admin-sidebar-w/);
  });

  it("keeps mobile sidebar as an overlay drawer", () => {
    expect(css).toMatch(/@media \(max-width: 767px\)/);
    expect(css).toMatch(/transform:\s*translateX\(-100%\)/);
  });
});
