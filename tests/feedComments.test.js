// Feed comments on menuply.com (backend mig 0423): helper rules + wiring contracts.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  commentCountLabel,
  commentsTitle,
  commentTimeAgo,
  feedItemCommentsOn,
  newCommentClientKey,
} from "../src/lib/feedComments.js";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("time labels", () => {
  const now = Date.parse("2026-11-12T20:00:00Z");
  assert.equal(commentTimeAgo("2026-11-12T19:59:30Z", now), "now");
  assert.equal(commentTimeAgo("2026-11-12T19:55:00Z", now), "5m");
  assert.equal(commentTimeAgo("2026-11-12T17:00:00Z", now), "3h");
  assert.equal(commentTimeAgo("2026-11-10T20:00:00Z", now), "2d");
  assert.equal(commentTimeAgo("2026-10-29T20:00:00Z", now), "2w");
  assert.equal(commentTimeAgo("nope", now), "");
});

test("counts and titles", () => {
  assert.equal(commentCountLabel(0), "Comment");
  assert.equal(commentCountLabel(7), "7");
  assert.equal(commentCountLabel(1234), "1.2K");
  assert.equal(commentCountLabel(15400), "15K");
  assert.equal(commentsTitle(1), "1 comment");
  assert.equal(commentsTitle(0), "0 comments");
});

test("comments show only when the Feed item carries a count (flag on for this viewer)", () => {
  assert.equal(feedItemCommentsOn({ comment_count: 0 }), true);
  assert.equal(feedItemCommentsOn({}), false);
  assert.equal(feedItemCommentsOn(null), false);
});

test("client keys fit the backend rule (8-64 safe chars) and differ", () => {
  const a = newCommentClientKey();
  assert.match(a, /^[A-Za-z0-9_-]{8,64}$/);
  assert.notEqual(a, newCommentClientKey());
});

test("API helpers match the backend route contract names and paths", () => {
  const api = read("src/lib/consumerApi.js");
  for (const name of ["listFeedComments", "listFeedCommentReplies", "createFeedComment", "deleteFeedComment"]) {
    assert.match(api, new RegExp(`export const ${name} =`));
  }
  assert.match(api, /\/api\/consumer\/feed-posts\/\$\{encodeURIComponent/);
  assert.match(api, /\/api\/consumer\/feed-comments\/\$\{encodeURIComponent\(String\(commentId\)\)\}\/replies/);
});

test("Feed wiring: rail button gated on a count, playback held, keys don't move the Feed while typing", () => {
  const rail = read("src/components/consumer/feed/FeedVideoActionRail.jsx");
  assert.match(rail, /typeof commentCount === "number"/);
  assert.match(rail, /testId="feed-rail-comments"/);
  const feed = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(feed, /holdPlayback = userPaused \|\| inviteOpen \|\| railShareOpen \|\| commentsOpen/);
  assert.match(feed, /if \(commentsOpenRef\.current\) return;/);
  assert.match(feed, /t\.tagName === "TEXTAREA"/);
});

test("comment text renders as plain text (no HTML injection paths)", () => {
  const sheet = read("src/components/consumer/feed/FeedCommentsSheet.jsx");
  assert.doesNotMatch(sheet, /dangerouslySetInnerHTML|innerHTML/);
  assert.match(sheet, /kind="feed_comment"/);
  assert.match(sheet, /noun="comment"/);
});

test("Invite to eat from a comment: Connects only, the Feed opens one invite dialog after the sheet closes", () => {
  const sheet = read("src/components/consumer/feed/FeedCommentsSheet.jsx");
  assert.match(sheet, /onInvite && !c\.mine && c\.author\?\.connect/);
  assert.match(sheet, /onClose\?\.\(\); onInvite\(/);
  const feed = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(feed, /sendInAppTo=\{commentInvite\.to\}/);
  assert.match(feed, /\|\| Boolean\(commentInvite\)/, "the clip holds while the invite dialog is open");
});

test("the sheet logs one comments_open per opening", () => {
  const sheet = read("src/components/consumer/feed/FeedCommentsSheet.jsx");
  assert.match(sheet, /if \(loggedOpenRef\.current !== postId\)/);
  assert.match(sheet, /trackCommentsOpen\(postId, \{ restaurantId: res\.restaurant\?\.id \?\? null, from: focusCommentId \? "link" : "rail" \}\)/);
});
