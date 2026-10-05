/**
 * Contract: Campus live Phase 2 posts — composer sheet, Everyone/Connects tabs,
 * venue filter, report + hide, guest posting, copy rules.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("posts section: buttons, tabs, filter, report/hide, empty copy", () => {
  const src = read("src/components/cluster/CampusLivePosts.jsx");
  assert.match(src, /campus-live-comment-button/);
  // Text-only: no Video button / video posts on campus clusters (USC rules, Andre 2026-10-05).
  assert.doesNotMatch(src, /campus-live-video-button|VideoStillPreview|video_url/);
  const composer = read("src/components/cluster/CampusLiveComposerSheet.jsx");
  assert.doesNotMatch(composer, /MenuplyMediaPicker|isVideo|video_url|Upload/);
  assert.equal(fs.existsSync(path.join(ROOT, "src/components/cluster/CampusLiveVideoStrip.jsx")), false);
  assert.match(src, /isAuthenticated && data\?\.connects_tab/, "Connects tab never for guests / zero Connects");
  assert.match(src, /Show \$\{moreCount\} more/);
  assert.match(src, /Show less/);
  assert.match(src, /INITIAL_VISIBLE = 3/);
  assert.match(src, /campus-live-show-all/);
  assert.match(src, /campus-post-report/);
  assert.match(src, /campus-post-hide/);
  assert.match(src, /Quiet so far today — check back when people post\./);
  assert.match(src, /ConnectPill/);
  assert.match(src, /"Guest"/);
  assert.doesNotMatch(src, />\s*(Feed|Activity|Social)\s*</i, "no Feed/Activity/social labels");
});

test("composer: 140 chars, counter in last 20, disabled when empty, guests allowed", () => {
  const src = read("src/components/cluster/CampusLiveComposerSheet.jsx");
  assert.match(src, /Posting to \{placeLabel\}/);
  assert.match(src, /COUNTER_WINDOW = 20/);
  assert.match(src, /remaining <= COUNTER_WINDOW/);
  assert.match(src, /text\.trim\(\)\.length > 0/);
  assert.match(src, /CampusLiveQuickStatusRows/, "reuses Phase 1 one-tap Line/Food rows");
  assert.match(src, /getOrCreateGuestReporterKey/);
  assert.doesNotMatch(src, /navigate\(|<Route/, "no new route");
});

test("shared Connect pill keeps search badge test id", () => {
  const card = read("src/components/search/SearchResultVideoCard.jsx");
  assert.match(card, /<ConnectPill data-testid="search-result-video-connect-badge" \/>/);
});

test("venue filter wired from glance tiles and On campus rows", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /campusVenueFilter/);
  assert.match(page, /onSelectVenue=/);
  const feed = read("src/components/cluster/ClusterPublicFeed.jsx");
  assert.match(feed, /<CampusLivePosts/);
  assert.match(feed, /onSelectVenue=\{selectVenue\}/);
  const dining = read("src/components/cluster/CampusDiningSection.jsx");
  assert.match(dining, /closest\("a, button"\)/, "name link + Update keep their own actions");
  assert.match(dining, /tap a name for what&apos;s going on there/);
});

test("USC header: hero line is the single H1; On campus collapsible (Andre 2026-10-05)", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /<h1 className="cluster-campus-kicker">Food around University Park<\/h1>/);
  assert.match(page, /\{!isUsc \? \(/, "generic heading + intro hidden for USC only");
  const dining = read("src/components/cluster/CampusDiningSection.jsx");
  assert.match(dining, /campus-dining-toggle/);
  assert.match(dining, /aria-expanded=\{expanded\}/);
  assert.match(dining, /useState\(false\)/, "collapsed by default");
});
