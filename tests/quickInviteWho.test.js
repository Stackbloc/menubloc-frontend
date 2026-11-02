import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { connectPeersFromResponse, matchConnectPeers } from "../src/lib/quickInviteWho.js";

// Quick Invite asks who first (Andre 2026-10-29): typing checks Connects; in Menuply or by text.
const body = {
  ok: true,
  accepted: [
    { id: 2, peer: { id: 32, display_name: "Jordan Park" } },
    { id: 1, peer: { id: 31, display_name: "Maya Lee" } },
    { id: 3, peer: { id: 33, first_name: "Sam", last_name: "Martin" } },
    { id: 4, peer: {} },
  ],
};

test("accepted Connects become { id, name }, sorted, bad rows dropped", () => {
  assert.deepEqual(connectPeersFromResponse(body), [
    { id: 32, name: "Jordan Park" },
    { id: 31, name: "Maya Lee" },
    { id: 33, name: "Sam Martin" },
  ]);
  assert.deepEqual(connectPeersFromResponse(null), []);
});

test("typing matches any name word start", () => {
  const peers = connectPeersFromResponse(body);
  assert.deepEqual(matchConnectPeers(peers, "ma").map((p) => p.id), [31, 33]);
  assert.deepEqual(matchConnectPeers(peers, "  "), []);
  assert.deepEqual(matchConnectPeers(peers, "zz"), []);
});

test("start page asks who before the place; modal sends in Menuply for Connects", () => {
  const page = fs.readFileSync(new URL("../src/pages/consumer/InviteToEatStartPage.jsx", import.meta.url), "utf8");
  assert.match(page, /<QuickInviteWhoStep value=\{to\}/);
  assert.match(page, /\{needsWho \? null : \(/);
  assert.match(page, /autoOpenShareOnReady=\{quickInvite && to\?\.via !== "app"\}/);
  const modal = fs.readFileSync(new URL("../src/components/InviteToEatModal.jsx", import.meta.url), "utf8");
  assert.match(modal, /sendEatInvitationInApp\(token, \[sendInAppTo\.userId\]\)/);
  const api = fs.readFileSync(new URL("../src/lib/consumerApi.js", import.meta.url), "utf8");
  assert.match(api, /\/api\/consumer\/eat-invitations\/\$\{encodeURIComponent\(String\(token\)\)\}\/send/);
});
