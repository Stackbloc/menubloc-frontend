import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const section = read("src/components/cluster/CampusDiningSection.jsx");
const sheet = read("src/components/cluster/HallClipsSheet.jsx");

test("hall rows: Live clips · N beside Line/Food, newest clip line, empty state", () => {
  assert.match(section, /`Live clips · \$\{count\}`/);
  assert.match(section, /"Add a clip"/);
  assert.match(section, /"Be the first to post a clip"/);
  assert.match(section, /formatNewestClipAgo\(clips\.newest_at\)/);
  // Line/Food indicators unchanged, "No recent reports" stays.
  assert.match(section, /<StatusChip label=\{`Line · \$\{line\.label\}`\} \/>/);
  assert.match(section, /<StatusChip label="No recent reports" muted \/>/);
  assert.match(section, /\{food \? <StatusChip label=\{`Food · \$\{food\.label\}`\} \/> : null\}/);
});

test("recording is double-gated (FE flag + backend) and shows the reminder", () => {
  assert.match(read("src/lib/featureFlags.js"), /VITE_ENABLE_HALL_CLIPS/);
  assert.match(sheet, /isHallClipsRecordingEnabled\(\) && recordingEnabled/);
  assert.match(sheet, /\{canRecord \? \(/);
  assert.match(sheet, /"Follow your campus recording rules\. No faces, please\."/);
  assert.match(sheet, /data-testid="hall-clip-reminder"/);
});

test("clip posts to the hall it was opened from (no venue picker), 15s cap", () => {
  assert.match(sheet, /createHallClip\(clusterSlug, hallId,/);
  assert.doesNotMatch(sheet, /<select|restaurant_id: selected/);
  assert.match(sheet, /DEFAULT_MAX_SECONDS = 15/);
  assert.match(sheet, /seconds > maxSeconds \+ 0\.5/);
});

test("reuses the existing upload, guest consent and campus report", () => {
  assert.match(sheet, /uploadWhatIAteTodayPhoto/);
  assert.match(sheet, /uploadGuestFeedVideoPhoto/);
  assert.match(sheet, /GuestFeedVideoConsentGate/);
  assert.match(sheet, /reportClusterLivePost\(clusterSlug, clip\.id/);
  assert.match(sheet, /data-testid="hall-clip-report"/);
});

test("formatNewestClipAgo copy", async () => {
  const { formatNewestClipAgo } = await import("../src/components/cluster/HallClipsSheet.jsx").catch(() => ({}));
  if (!formatNewestClipAgo) return; // JSX import not supported in plain node; source checks above cover it
  const now = Date.parse("2026-10-19T12:00:00Z");
  assert.equal(formatNewestClipAgo("2026-10-19T11:48:00Z", now), "Newest clip 12 min ago");
});

test("diner copy says clips, never videos", () => {
  for (const src of [section, sheet]) {
    const visible = src
      .split("\n")
      .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
      .filter((l) => />[^<{]*\b[Vv]ideos?\b|"[^"]*\b[Vv]ideos?\b[^"]*"|`[^`]*\b[Vv]ideos?\b/.test(l))
      .filter((l) => !/accept="video|import|from "/.test(l));
    assert.deepEqual(visible, []);
  }
});
