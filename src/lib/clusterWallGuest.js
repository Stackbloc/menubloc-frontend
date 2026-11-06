import { apiPost } from "./api.js";

/**
 * GUEST PATH — write on the Wall without an account (Andre 2026-11-06, backend wallGuestPosting.js,
 * mig 0396). Kept in this one file so it can be removed later ("at the appropriate time, we can kill
 * the guest path"). When the backend switch is off it answers 401 and the composer sends people to
 * sign-up, as before.
 *
 * The guest key is a random id kept in this browser; it lets the guest delete their own posts from
 * here. Their post ids are remembered here too, so those show "Delete my post".
 */
const KEY = "menuply.wall.guestKey.v1";
const POSTS = "menuply.wall.guestPosts.v1";

function randomUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16)
  );
}

export function wallGuestKey() {
  try {
    let k = window.localStorage.getItem(KEY);
    if (!k || !/^[0-9a-f-]{36}$/i.test(k)) {
      k = randomUuid();
      window.localStorage.setItem(KEY, k);
    }
    return k;
  } catch {
    // Private mode: a key for this page only (delete works until the page closes).
    if (!wallGuestKey.memo) wallGuestKey.memo = randomUuid();
    return wallGuestKey.memo;
  }
}

function readPosts() {
  try {
    const list = JSON.parse(window.localStorage.getItem(POSTS) || "[]");
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writePosts(list) {
  try {
    window.localStorage.setItem(POSTS, JSON.stringify(list.slice(-200)));
  } catch {
    /* private mode */
  }
}

/** My guest posts (from this browser) → is_mine + guest, so the viewer offers Delete. */
export function markGuestOwn(blocks) {
  const mine = new Set(readPosts());
  if (!mine.size) return blocks;
  return blocks.map((b) => (mine.has(b.public_id) && !b.is_mine ? { ...b, is_mine: true, guest: true } : b));
}

export async function createGuestWallBlock(payload) {
  const out = await apiPost(`/api/cluster-wall/guest/blocks`, { ...payload, guest_key: wallGuestKey() });
  if (out?.block?.public_id) writePosts([...readPosts().filter((id) => id !== out.block.public_id), out.block.public_id]);
  return out;
}

export async function deleteGuestWallBlock(publicId) {
  const out = await apiPost(`/api/cluster-wall/guest/blocks/${encodeURIComponent(publicId)}/delete`, { guest_key: wallGuestKey() });
  writePosts(readPosts().filter((id) => id !== publicId));
  return out;
}
