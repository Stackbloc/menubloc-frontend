#!/usr/bin/env node
/**
 * Regression guard: discovery diet/category chip rows must not use a desktop
 * horizontal scroller (inline overflowX:auto on the chip track). Desktop must
 * wrap via .gb-discovery-chip-scroller in index.css; mobile scroll lives in CSS
 * under @media (max-width: 768px).
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

if (/overflowX:\s*["']auto["']/.test(rowSlice) || /overflowX:\s*['"]auto['"]/.test(rowSlice)) {
  console.error(
    "guard-discovery-chip-scroll: Do not set overflowX:auto inline on DiscoveryChipRow — desktop becomes trackpad-scrollable. Use index.css .gb-discovery-chip-scroller (wrap desktop / scroll mobile)."
  );
  process.exit(1);
}

if (!css.includes(".gb-discovery-chip-scroller") || !css.includes("flex-wrap: wrap")) {
  console.error(
    "guard-discovery-chip-scroll: index.css must define .gb-discovery-chip-scroller with flex-wrap: wrap for desktop."
  );
  process.exit(1);
}

if (!css.includes("@media (max-width: 768px)") || !css.includes("overflow-x: auto")) {
  console.error(
    "guard-discovery-chip-scroll: index.css must include a max-width 768px block with horizontal scroll for .gb-discovery-chip-scroller."
  );
  process.exit(1);
}

console.log("verify:discovery-chips — chip row desktop scroll guard passed.");
