/**
 * Contract: USC / UCLA cluster Place themes (slug-gated, Coachella/LA Live pattern).
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
});

test("UCLA theme is slug-scoped and imported on ClusterPage", () => {
  assert.match(pageSrc, /clusterUclaTheme\.css/);
  assert.match(pageSrc, /cluster-theme-ucla/);
  assert.match(pageSrc, /isUcla/);
  assert.match(pageSrc, /data-testid="cluster-ucla-hero"/);
  assert.match(pageSrc, /UCLA powered by Menuply/);
});

test("USC theme uses cardinal/gold campus palette without scraped assets", () => {
  assert.match(uscSrc, /\.cluster-theme-usc/);
  assert.match(uscSrc, /--usc-cardinal/);
  assert.match(uscSrc, /--usc-gold/);
  assert.match(uscSrc, /Libre Baskerville/);
  assert.doesNotMatch(uscSrc, /usc\.edu\/.*\.(png|jpg|svg)/i);
});

test("UCLA theme uses blue/gold campus palette without scraped assets", () => {
  assert.match(uclaSrc, /\.cluster-theme-ucla/);
  assert.match(uclaSrc, /--ucla-blue/);
  assert.match(uclaSrc, /--ucla-gold/);
  assert.match(uclaSrc, /Fraunces/);
  assert.doesNotMatch(uclaSrc, /ucla\.edu\/.*\.(png|jpg|svg)/i);
});

test("Cluster feed exposes class hooks for campus theme typography", () => {
  assert.match(feedSrc, /cluster-feed-heading/);
  assert.match(feedSrc, /cluster-feed-section-label/);
  assert.match(feedSrc, /cluster-feed-item-title/);
  assert.match(uscSrc, /\.cluster-feed-heading/);
  assert.match(uclaSrc, /\.cluster-feed-heading/);
});

test("Coachella and L.A. LIVE themes remain independently wired", () => {
  assert.match(pageSrc, /clusterCoachellaTheme\.css/);
  assert.match(pageSrc, /clusterLaLiveTheme\.css/);
  assert.match(pageSrc, /cluster-theme-coachella-2027/);
  assert.match(pageSrc, /cluster-theme-la-live/);
});
