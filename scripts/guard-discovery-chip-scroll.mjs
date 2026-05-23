#!/usr/bin/env node
/**
 * Regression guard: discovery chip rows use .gb-discovery-chip-scroller in index.css
 * (flex-wrap: nowrap + overflow-x: auto) — two rows, each horizontally scrollable.
 * Do not set overflowX:auto inline on DiscoveryChipRow (use CSS class only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const discoveryPath = path.join(root, "src/pages/GrubbidDiscovery.jsx");
const cssPath = path.join(root, "src/index.css");

const discovery = fs.readFileSync(discoveryPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

const rowStart = discovery.indexOf("function DiscoveryChipRow");
if (rowStart === -1) {
  console.error("guard-discovery-chip-scroll: DiscoveryChipRow not found.");
  process.exit(1);
}

const rowEnd = discovery.indexOf("\nfunction ", rowStart + 1);
const rowSlice = rowEnd === -1 ? discovery.slice(rowStart) : discovery.slice(rowStart, rowEnd);

if (!rowSlice.includes("gb-discovery-chip-scroller")) {
  console.error(
    "guard-discovery-chip-scroll: DiscoveryChipRow must use className=\"gb-discovery-chip-scroller\" on the chip track."
  );
  process.exit(1);
}

if (/overflowX:\s*["']auto["']/.test(rowSlice)) {
  console.error(
    "guard-discovery-chip-scroll: Do not set overflowX:auto inline on DiscoveryChipRow — use index.css .gb-discovery-chip-scroller only."
  );
  process.exit(1);
}

if (/overflowX:\s*["']hidden["']/.test(rowSlice)) {
  console.error(
    "guard-discovery-chip-scroll: Do not set overflowX:hidden on any element inside DiscoveryChipRow — it clips the chip scroller and breaks desktop scrolling."
  );
  process.exit(1);
}

if (!css.includes(".gb-discovery-chip-scroller") || !css.includes("flex-wrap: nowrap")) {
  console.error(
    "guard-discovery-chip-scroll: index.css must define .gb-discovery-chip-scroller with flex-wrap: nowrap (single line per row)."
  );
  process.exit(1);
}

if (!css.includes(".gb-discovery-chip-scroller") || !css.includes("overflow-x: auto")) {
  console.error(
    "guard-discovery-chip-scroll: index.css must define .gb-discovery-chip-scroller with overflow-x: auto."
  );
  process.exit(1);
}

if (!css.includes("@media (max-width: 768px)") || !css.includes("touch-action: pan-x")) {
  console.error(
    "guard-discovery-chip-scroll: index.css must include a max-width 768px block with touch-action: pan-x for .gb-discovery-chip-scroller."
  );
  process.exit(1);
}

console.log("verify:discovery-chips — chip row desktop scroll guard passed.");
