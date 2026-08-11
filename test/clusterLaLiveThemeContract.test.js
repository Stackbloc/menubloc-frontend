import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const themeSrc = readFileSync(join(root, "src/styles/clusterLaLiveTheme.css"), "utf8");

test("L.A. LIVE cluster theme is slug-scoped and imported on ClusterPage", () => {
  assert.match(pageSrc, /clusterLaLiveTheme\.css/);
  assert.match(pageSrc, /cluster-theme-la-live/);
  assert.match(pageSrc, /isLaLive/);
  assert.match(pageSrc, /data-testid="cluster-lalive-hero"/);
  assert.match(pageSrc, /L\.A\. LIVE powered by Menuply/);
});

test("L.A. LIVE theme uses night entertainment palette complementary to district energy", () => {
  assert.match(themeSrc, /\.cluster-theme-la-live/);
  assert.match(themeSrc, /--lalive-gold/);
  assert.match(themeSrc, /--lalive-carpet/);
  assert.match(themeSrc, /--lalive-night/);
  assert.match(themeSrc, /Syne/);
  assert.doesNotMatch(themeSrc, /lalive\.com\/.*\.(png|jpg|svg)/i);
});

test("L.A. LIVE theme forces readable card titles via class hooks (not hex attribute selectors)", () => {
  assert.match(themeSrc, /\.cluster-card-title/);
  assert.match(themeSrc, /\.cluster-card-muted/);
  assert.match(themeSrc, /React applies inline colors via CSSOM/);
  assert.doesNotMatch(themeSrc, /article \[style\*="color: #111827"\]/);
});

test("L.A. LIVE theme forces readable ClusterBackButton via class hook", () => {
  const backSrc = readFileSync(join(root, "src/components/cluster/ClusterBackButton.jsx"), "utf8");
  assert.match(backSrc, /className="cluster-back-button"/);
  assert.match(backSrc, /data-testid="cluster-back-button"/);
  assert.match(pageSrc, /ClusterBackButton/);
  assert.match(themeSrc, /\.cluster-back-button/);
  assert.match(themeSrc, /color: var\(--lalive-gold-soft\) !important/);
});

test("L.A. LIVE theme forces readable selected Food/Restaurants toggle", () => {
  assert.match(themeSrc, /\.cluster-view-toggle\[aria-pressed="true"\]/);
  assert.match(themeSrc, /selection looked inverted/);
});

test("Coachella theme remains independently wired", () => {
  assert.match(pageSrc, /clusterCoachellaTheme\.css/);
  assert.match(pageSrc, /cluster-theme-coachella-2027/);
});
