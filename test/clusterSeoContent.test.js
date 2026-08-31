import test from "node:test";
import assert from "node:assert/strict";
import {
  PUBLIC_CLUSTER_SEO_SLUGS,
  CLUSTER_SEO_CONTENT,
  getClusterSeoContent,
  resolveClusterIntro,
  resolveClusterSearchPlaceholder,
  resolveClusterDocumentMeta,
  resolveClusterCardDescription,
  resolveClusterDisplayName,
  assertPublicClusterSeoCoverage,
} from "../src/lib/clusterSeoContent.js";
import { CLUSTER_ARRIVAL_TAGLINE } from "../src/lib/clusterUrl.js";
import {
  buildClusterShareTitle,
  buildClusterShareDescription,
} from "../src/lib/clusterLegalCopy.js";

test("assertPublicClusterSeoCoverage passes for all public Cluster slugs", () => {
  const result = assertPublicClusterSeoCoverage();
  assert.equal(result.ok, true, result.errors?.join("; "));
});

test("each public Cluster has unique non-empty intro and metaDescription", () => {
  const intros = new Set();
  const metas = new Set();
  for (const slug of PUBLIC_CLUSTER_SEO_SLUGS) {
    const entry = CLUSTER_SEO_CONTENT[slug];
    assert.ok(entry, `missing entry for ${slug}`);
    assert.ok(entry.intro.trim().length > 40, `${slug} intro too short`);
    assert.ok(entry.metaDescription.trim().length > 40, `${slug} meta too short`);
    assert.ok(!intros.has(entry.intro), `duplicate intro for ${slug}`);
    assert.ok(!metas.has(entry.metaDescription), `duplicate meta for ${slug}`);
    intros.add(entry.intro);
    metas.add(entry.metaDescription);
    assert.notEqual(entry.intro, CLUSTER_ARRIVAL_TAGLINE);
    assert.ok(!entry.intro.includes(CLUSTER_ARRIVAL_TAGLINE));
  }
});

test("resolveClusterIntro prefers SEO config over API short_description", () => {
  const seo = getClusterSeoContent("la-live");
  const intro = resolveClusterIntro({
    slug: "la-live",
    short_description: "Generic short description that should not win.",
  });
  assert.equal(intro, seo.intro);
});

test("resolveClusterIntro falls back to API text when SEO missing", () => {
  const intro = resolveClusterIntro({
    slug: "not-a-public-cluster-yet",
    short_description: "API short description only.",
  });
  assert.equal(intro, "API short description only.");
});

test("configured Clusters never resolve to generic arrival tagline", () => {
  for (const slug of PUBLIC_CLUSTER_SEO_SLUGS) {
    const intro = resolveClusterIntro({ slug, short_description: CLUSTER_ARRIVAL_TAGLINE });
    assert.notEqual(intro, CLUSTER_ARRIVAL_TAGLINE);
    assert.ok(intro.includes("available") || intro.includes("Explore") || intro.includes("Discover") || intro.includes("Browse") || intro.includes("Find"));
  }
});

test("resolveClusterDocumentMeta and search placeholders are slug-specific", () => {
  const laLive = resolveClusterDocumentMeta({ slug: "la-live" });
  const lax = resolveClusterDocumentMeta({ slug: "lax" });
  assert.match(laLive.title, /L\.A\. Live/);
  assert.match(lax.title, /LAX/);
  assert.notEqual(laLive.description, lax.description);
  assert.equal(resolveClusterSearchPlaceholder({ slug: "la-live" }), "Search L.A. Live menus");
  assert.equal(
    resolveClusterSearchPlaceholder({ slug: "american-airlines-center" }),
    "Search food at American Airlines Center",
  );
  assert.equal(resolveClusterSearchPlaceholder({ slug: "lax" }), "Search Dining Options at LAX");
  assert.equal(resolveClusterSearchPlaceholder({ slug: "ucla" }), "Search Dining Options near UCLA");
  assert.equal(resolveClusterSearchPlaceholder({ slug: "usc" }), "Search Dining Options near USC");
  assert.equal(
    resolveClusterSearchPlaceholder({ slug: "atl-airport" }),
    "Search Dining Options at Hartsfield",
  );
  assert.equal(
    resolveClusterSearchPlaceholder({ slug: "att-stadium" }),
    "Search Dining Options at AT&T Stadium",
  );
  assert.equal(resolveClusterSearchPlaceholder({ slug: "unknown" }), "Search food here");
});

test("share title and description prefer SEO module for configured Clusters", () => {
  const cluster = {
    slug: "la-live",
    name: "L.A. Live",
    share_title: "API share title should lose",
    share_description: "API share description should lose",
  };
  assert.equal(buildClusterShareTitle(cluster), CLUSTER_SEO_CONTENT["la-live"].seoTitle);
  assert.equal(buildClusterShareDescription(cluster), CLUSTER_SEO_CONTENT["la-live"].metaDescription);
});

test("card description prefers SEO cardDescription", () => {
  const card = resolveClusterCardDescription({
    slug: "usc",
    short_description: "Old short description",
  });
  assert.equal(card, CLUSTER_SEO_CONTENT.usc.cardDescription);
});

test("resolveClusterDisplayName and SEO lookup honor legacy slug aliases", () => {
  const legacy = {
    slug: "coachella-2027",
    name: "Coachella 2027",
    area_name: "Coachella Valley Music and Arts Festival",
  };
  assert.equal(resolveClusterDisplayName(legacy), "Indio Festival Grounds");
  assert.equal(getClusterSeoContent("coachella-2027")?.displayName, "Indio Festival Grounds");
  assert.equal(
    resolveClusterCardDescription(legacy),
    CLUSTER_SEO_CONTENT["indio-festival-grounds"].cardDescription,
  );
});

test("assertPublicClusterSeoCoverage fails when a required slug is missing", () => {
  const result = assertPublicClusterSeoCoverage(["la-live", "missing-cluster-slug"]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("missing-cluster-slug")));
});
