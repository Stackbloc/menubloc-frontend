import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { chunk, connectCue, connectPeersFromResponse, groupName, matchConnectPeers, QUICK_INVITES, quickInviteFor, SEND_BATCH } from "../src/lib/quickInviteWho.js";

// Quick Invite asks who first (Andre 2026-10-29): typing checks Connects; in Menuply or by text.
const body = {
  ok: true,
  accepted: [
    { id: 2, peer: { id: 32, display_name: "Jordan Park" } },
    { id: 1, peer: { id: 31, display_name: "Maya Lee", avatar_url: "https://x/m.jpg", favorite_foods: [{ label: "Pancakes" }, { label: "Tacos" }, { label: "Ramen" }] } },
    { id: 3, peer: { id: 33, first_name: "Sam", last_name: "Martin" } },
    { id: 4, peer: {} },
  ],
};

test("accepted Connects become { id, name, avatarUrl, favoriteFoods }, sorted, bad rows dropped", () => {
  assert.deepEqual(connectPeersFromResponse(body), [
    { id: 32, name: "Jordan Park", avatarUrl: null, favoriteFoods: [] },
    { id: 31, name: "Maya Lee", avatarUrl: "https://x/m.jpg", favoriteFoods: ["Pancakes", "Tacos", "Ramen"] },
    { id: 33, name: "Sam Martin", avatarUrl: null, favoriteFoods: [] },
  ]);
  assert.deepEqual(connectPeersFromResponse(null), []);
});

test("typing matches any name word start", () => {
  const peers = connectPeersFromResponse(body);
  assert.deepEqual(matchConnectPeers(peers, "ma").map((p) => p.id), [31, 33]);
  assert.deepEqual(matchConnectPeers(peers, "  "), []);
  assert.deepEqual(matchConnectPeers(peers, "zz"), []);
});

test("checklist cue, group names and send batches (app quickInvitePick.ts)", () => {
  const [, maya] = connectPeersFromResponse(body);
  assert.equal(connectCue(maya), "Favs pancakes, tacos");
  assert.equal(connectCue({ favoriteFoods: [] }), "");
  const c = (n, i) => ({ userId: i, name: n });
  assert.equal(groupName({ connects: [c("Maya Lee", 1)], contacts: [] }), "Maya Lee");
  assert.equal(groupName({ connects: [c("Maya Lee", 1), c("Leo Park", 2)], contacts: [] }), "Maya and Leo");
  assert.equal(groupName({ connects: [c("Maya Lee", 1), c("Leo Park", 2)], contacts: [{ id: "t", name: "Rose" }, { id: "u", name: "Ann" }] }), "Maya, Leo and 2 others");
  assert.equal(groupName({ connects: [c("Maya Lee", 1), c("Leo Park", 2)], contacts: [], allConnects: true }), "all your Connects");
  assert.equal(groupName({ connects: [c("A", 1)], contacts: [{ id: "t", name: "Rose" }], allConnects: true }), "all your Connects and Rose");
  assert.equal(SEND_BATCH, 20);
  const ids = Array.from({ length: 45 }, (_, i) => i + 1);
  assert.deepEqual(chunk(ids).map((b) => b.length), [20, 20, 5]);
});

test("What for? = meals first, then coffee, drinks, Meet me here", () => {
  assert.deepEqual(QUICK_INVITES.map((q) => q.label), ["Breakfast", "Brunch", "Lunch", "Dinner", "Late night", "Coffee", "Drinks", "Meet me here"]);
  assert.equal(quickInviteFor("ldl").phrase, "Let's do lunch");
  assert.equal(quickInviteFor("nope"), null);
});

test("start page: two steps, What for? only without a seed, group send through the modal", () => {
  const page = fs.readFileSync(new URL("../src/pages/consumer/InviteToEatStartPage.jsx", import.meta.url), "utf8");
  assert.match(page, /<QuickInviteWhoStep/);
  assert.match(page, /const needsWhat = quickInvite && !needsWho && !invite;/);
  assert.match(page, /\{needsWho \|\| needsWhat \? null : \(/);
  assert.match(page, /quick-invite-who-change/);
  assert.match(page, /sendInAppGroup=\{to\?\.group\.connects\.length \? to\.group\.connects : null\}/);
  assert.match(page, /autoOpenShareOnReady=\{quickInvite && \(!to \|\| to\.group\.contacts\.length > 0\)\}/);
  assert.doesNotMatch(page, /Or post an Open Invite/);
  const step = fs.readFileSync(new URL("../src/pages/consumer/QuickInviteWhoStep.jsx", import.meta.url), "utf8");
  assert.match(step, /label="Open Invite" sub="All my Connects"/);
  assert.match(step, /Next \(\$\{count\}\) ›/);
  assert.match(step, /position: "fixed"/);
  const modal = fs.readFileSync(new URL("../src/components/InviteToEatModal.jsx", import.meta.url), "utf8");
  assert.match(modal, /for \(const ids of chunk\(inAppTargets\.map\(\(t\) => t\.userId\)\)\)/);
  assert.match(modal, /sendEatInvitationInApp\(token, ids\)/);
  const api = fs.readFileSync(new URL("../src/lib/consumerApi.js", import.meta.url), "utf8");
  assert.match(api, /\/api\/consumer\/eat-invitations\/\$\{encodeURIComponent\(String\(token\)\)\}\/send/);
});
