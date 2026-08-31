import test from "node:test";
import assert from "node:assert/strict";
import {
  CLUSTER_SLUG_ALIASES,
  INDIO_FESTIVAL_GROUNDS_CLUSTER_PATH,
  INDIO_FESTIVAL_GROUNDS_SLUG,
  LEGACY_COACHELLA_CLUSTER_PATH,
  LEGACY_COACHELLA_CLUSTER_SLUG,
  isLegacyClusterSlug,
  resolveClusterSlug,
} from "../src/lib/clusterSlugAliases.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(path.join(__dirname, "../src/App.jsx"), "utf8");
const vercelJson = readFileSync(path.join(__dirname, "../vercel.json"), "utf8");

test("legacy coachella slug resolves to indio-festival-grounds", () => {
  assert.equal(resolveClusterSlug(LEGACY_COACHELLA_CLUSTER_SLUG), INDIO_FESTIVAL_GROUNDS_SLUG);
  assert.equal(isLegacyClusterSlug(LEGACY_COACHELLA_CLUSTER_SLUG), true);
  assert.equal(CLUSTER_SLUG_ALIASES[LEGACY_COACHELLA_CLUSTER_SLUG], INDIO_FESTIVAL_GROUNDS_SLUG);
});

test("App and vercel wire permanent redirect from legacy cluster path", () => {
  assert.match(appSrc, /LEGACY_COACHELLA_CLUSTER_PATH/);
  assert.match(appSrc, /INDIO_FESTIVAL_GROUNDS_CLUSTER_PATH/);
  assert.match(vercelJson, /coachella-2027/);
  assert.match(vercelJson, /indio-festival-grounds/);
});
