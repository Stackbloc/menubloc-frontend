/**
 * Contract: USC / UCLA cluster Place themes (slug-gated, Coachella/LA Live pattern).
 * UCLA must remain visually distinct from USC (not a recolor twin).
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const uscSrc = readFileSync(join(root, "src/styles/clusterUscTheme.css"), "utf8");
const uclaSrc = readFileSync(join(root, "src/styles/clusterUclaTheme.css"), "utf8");
const feedSrc = readFileSync(
  join(root, "src/components/cluster/ClusterPublicFeed.jsx"),
  "utf8"
);

test("USC theme is slug-scoped and imported on ClusterPage", () => {
  assert.match(pageSrc, /clusterUscTheme\.css/);
  assert.match(pageSrc, /cluster-theme-usc/);
  assert.match(pageSrc, /isUsc/);
  assert.match(pageSrc, /data-testid="cluster-usc-hero"/);
  assert.match(pageSrc, /USC powered by Menuply/);
  assert.match(pageSrc, /cluster-campus-hero/);
});

test("UCLA theme is slug-scoped and imported on ClusterPage", () => {
  assert.match(pageSrc, /clusterUclaTheme\.css/);
  assert.match(pageSrc, /cluster-theme-ucla/);
  assert.match(pageSrc, /isUcla/);
  assert.match(pageSrc, /data-testid="cluster-ucla-hero"/);
  assert.match(pageSrc, /UCLA powered by Menuply/);
  assert.match(pageSrc, /cluster-ucla-hero/);
  assert.match(pageSrc, /Westwood dining, in one Place/);
});

test("UCLA hero uses UCLA-only classes, not shared USC campus-hero mount", () => {
  const uclaBlock = pageSrc.match(/\{isUcla \? \([\s\S]*?\) : null\}/);
  assert.ok(uclaBlock, "expected isUcla hero block");
  assert.match(uclaBlock[0], /cluster-ucla-hero/);
  assert.match(uclaBlock[0], /cluster-ucla-powered/);
  assert.match(uclaBlock[0], /cluster-ucla-kicker/);
  assert.match(uclaBlock[0], /cluster-ucla-sub/);
  assert.doesNotMatch(uclaBlock[0], /cluster-campus-hero/);
});

test("USC theme uses cardinal/gold campus palette without scraped assets", () => {
  assert.match(uscSrc, /\.cluster-theme-usc/);
  assert.match(uscSrc, /--usc-cardinal/);
  assert.match(uscSrc, /--usc-gold/);
  assert.match(uscSrc, /Libre Baskerville/);
  assert.doesNotMatch(uscSrc, /usc\.edu\/.*\.(png|jpg|svg)/i);
});

test("UCLA theme uses Westwood courtyard system distinct from USC/Coachella fonts", () => {
  assert.match(uclaSrc, /\.cluster-theme-ucla/);
  assert.match(uclaSrc, /--ucla-blue/);
  assert.match(uclaSrc, /--ucla-gold/);
  assert.match(uclaSrc, /Sora/);
  assert.match(uclaSrc, /Figtree/);
  assert.match(uclaSrc, /\.cluster-ucla-hero/);
  assert.match(uclaSrc, /ucla-hero-shimmer/);
  assert.match(uclaSrc, /ucla-feed-heading-in/);
  assert.doesNotMatch(uclaSrc, /font-family:\s*["']?Libre Baskerville/);
  assert.doesNotMatch(uclaSrc, /font-family:\s*["']?Fraunces/);
  assert.doesNotMatch(uclaSrc, /font-family:\s*["']?Outfit/);
  assert.doesNotMatch(uclaSrc, /family=Fraunces|family=Outfit/);
  assert.doesNotMatch(uclaSrc, /\.cluster-campus-hero/);
  assert.doesNotMatch(uclaSrc, /ucla\.edu\/.*\.(png|jpg|svg)/i);
});

test("Cluster feed exposes class hooks for campus theme typography", () => {
  assert.match(feedSrc, /cluster-feed-heading/);
  assert.match(feedSrc, /cluster-feed-section-label/);
  assert.match(feedSrc, /cluster-feed-item-title/);
  assert.match(uscSrc, /\.cluster-feed-heading/);
  assert.match(uclaSrc, /\.cluster-feed-heading/);
});

test("Indio Festival Grounds and L.A. LIVE themes remain independently wired", () => {
  assert.match(pageSrc, /clusterIndioFestivalTheme\.css/);
  assert.match(pageSrc, /clusterLaLiveTheme\.css/);
  assert.match(pageSrc, /cluster-theme-indio-festival-grounds/);
  assert.match(pageSrc, /cluster-theme-la-live/);
});
