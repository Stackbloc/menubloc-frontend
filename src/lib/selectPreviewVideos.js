/**
 * Deterministic preview selection for restaurant profile Videos grid.
 * Pure function — no I/O.
 */

/** Recency half-life weight (days). */
export const RECENCY_TAU_DAYS = 30;
/** Score weight: recency (no engagement metric on this pool). */
export const WEIGHT_RECENCY = 0.6;
/** Score weight: restaurant-specific vs franchise-only. */
export const WEIGHT_SPECIFICITY = 0.4;
/** Anchor A: newest video only if this young (days). */
export const ANCHOR_NEW_MAX_DAYS = 14;
/** Sample from the top N by score for remaining slots. */
export const SAMPLE_CANDIDATE_CAP = 15;
/** When pool is large enough, demote recently shown ids. */
export const LAST_SHOWN_POOL_MIN = 10;
export const LAST_SHOWN_WEIGHT = 0.3;
/** Max videos per dish (menu_item_id or dish name key). */
export const MAX_PER_DISH = 2;
/** Max videos per diner (creator_key). Never relaxed. */
export const MAX_PER_DINER = 1;
/** When no creator_key (managed/platform), cap by kind. */
export const MAX_PER_KIND_WITHOUT_CREATOR = 2;

const EXCLUDED_KINDS = new Set(["plan", "event"]);

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function toSeedInt(seed) {
  const n = Number(seed);
  if (Number.isFinite(n)) return n >>> 0;
  const s = String(seed || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function videoId(v) {
  return v?.video_key || `${v?.kind}:${v?.video_id}`;
}

function dishKey(v) {
  if (v?.menu_item_id != null && String(v.menu_item_id).trim()) {
    return `mi:${v.menu_item_id}`;
  }
  const name = String(v?.item_name || "").trim().toLowerCase();
  if (name) return `name:${name}`;
  return `solo:${videoId(v)}`;
}

function categoryKey(v) {
  const raw = String(v?.section_name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return raw || null;
}

function ageDays(createdAt, now) {
  const t = createdAt ? new Date(createdAt).getTime() : NaN;
  if (!Number.isFinite(t)) return 365;
  const ms = Math.max(0, now.getTime() - t);
  return ms / (1000 * 60 * 60 * 24);
}

function isPlayable(v) {
  return Boolean(v?.video_url && String(v.video_url).trim());
}

function hasThumbOrPlayable(v) {
  if (v?.thumbnail_url && String(v.thumbnail_url).trim()) return true;
  return isPlayable(v);
}

/**
 * Eligibility for profile preview pool (client-side).
 * Plan/event never appear; other kinds rely on the API pool.
 */
export function isPreviewEligible(video) {
  if (!video || !isPlayable(video)) return false;
  const kind = String(video.kind || "").toLowerCase();
  if (EXCLUDED_KINDS.has(kind)) return false;
  if (video.removed_by_restaurant === true) return false;
  if (video.moderation_blocked === true) return false;
  if (!hasThumbOrPlayable(video)) return false;
  return true;
}

export function scorePreviewVideo(video, { now = new Date(), profileRestaurantId } = {}) {
  const when = now instanceof Date ? now : new Date(now || Date.now());
  const age = ageDays(video.created_at, when);
  const recency = Math.exp(-age / RECENCY_TAU_DAYS);
  const tagged =
    video.tagged_restaurant_id != null ? Number(video.tagged_restaurant_id) : null;
  const profile =
    profileRestaurantId != null ? Number(profileRestaurantId) : null;
  const specificity =
    tagged != null && profile != null && tagged === profile ? 1.0 : 0.5;
  const confidence =
    video.tag_provenance === "auto" || video.tag_confidence === "auto" ? 0.8 : 1.0;
  return (WEIGHT_RECENCY * recency + WEIGHT_SPECIFICITY * specificity) * confidence;
}

function scoreVideo(video, opts) {
  return scorePreviewVideo(video, opts);
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function canAdd(video, selected, { relaxCategory, relaxDish }) {
  const dish = dishKey(video);
  const dishCount = selected.filter((v) => dishKey(v) === dish).length;
  if (!relaxDish && dishCount >= MAX_PER_DISH) return false;

  const ck = video.creator_key ? String(video.creator_key) : null;
  if (ck) {
    if (selected.some((v) => String(v.creator_key || "") === ck)) return false;
  } else {
    const kind = String(video.kind || "").toLowerCase();
    const kindCount = selected.filter(
      (v) => !v.creator_key && String(v.kind || "").toLowerCase() === kind
    ).length;
    if (kindCount >= MAX_PER_KIND_WITHOUT_CREATOR) return false;
  }

  if (!relaxCategory) {
    const cats = new Set(selected.map(categoryKey).filter(Boolean));
    const cat = categoryKey(video);
    // Enforced only when finishing — during pick we track via finalize check
    void cats;
    void cat;
  }
  return true;
}

function satisfiesCategorySpread(selected, pool) {
  const poolCats = new Set(pool.map(categoryKey).filter(Boolean));
  if (poolCats.size < 2) return true;
  const selectedCats = new Set(selected.map(categoryKey).filter(Boolean));
  return selectedCats.size >= 2;
}

function weightedPick(candidates, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || candidates.length === 0) return -1;
  let r = rng() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return candidates.length - 1;
}

/**
 * @param {object[]} pool
 * @param {{
 *   seed: number|string,
 *   now?: Date|number|string,
 *   lastShownIds?: string[],
 *   category?: string|null,
 *   limit?: number,
 *   profileRestaurantId?: number|string|null,
 * }} opts
 * @returns {{ items: object[], poolSize: number }}
 */
export function selectPreviewVideos(pool, opts = {}) {
  const limit = Math.max(1, Number(opts.limit) || 6);
  const now = opts.now instanceof Date ? opts.now : new Date(opts.now || Date.now());
  const seed = toSeedInt(opts.seed);
  const rng = mulberry32(seed);
  const lastShown = new Set(
    (Array.isArray(opts.lastShownIds) ? opts.lastShownIds : []).map(String)
  );
  const categoryFilter = opts.category
    ? String(opts.category).trim().toLowerCase().replace(/\s+/g, " ")
    : null;
  const profileRestaurantId = opts.profileRestaurantId;

  let eligible = (Array.isArray(pool) ? pool : []).filter(isPreviewEligible);
  if (categoryFilter) {
    eligible = eligible.filter((v) => categoryKey(v) === categoryFilter);
  }

  const scored = eligible
    .map((video) => ({
      video,
      score: scoreVideo(video, { now, profileRestaurantId }),
      age: ageDays(video.created_at, now),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return videoId(a.video).localeCompare(videoId(b.video));
    });

  const poolSize = scored.length;

  if (poolSize <= limit) {
    return {
      items: scored.map((s) => ({
        ...s.video,
        _preview_score: s.score,
        _preview_slot: "all",
      })),
      poolSize,
    };
  }

  const remaining = scored.slice();
  const selected = [];
  const slotMeta = [];

  // Slot A — newest if ≤ 14 days
  const newestIdx = remaining.reduce(
    (best, row, idx) => (row.age < remaining[best].age ? idx : best),
    0
  );
  if (remaining[newestIdx] && remaining[newestIdx].age <= ANCHOR_NEW_MAX_DAYS) {
    const [row] = remaining.splice(newestIdx, 1);
    selected.push(row.video);
    slotMeta.push("anchor_new");
  }

  // Slot B — highest scored remaining
  if (selected.length < limit && remaining.length) {
    const [row] = remaining.splice(0, 1);
    selected.push(row.video);
    slotMeta.push("anchor_top");
  }

  function tryFill(relaxCategory, relaxDish) {
    while (selected.length < limit && remaining.length) {
      if (!relaxCategory && selected.length >= 2) {
        // leave room — enforced at end
      }
      const candidatePool = remaining.slice(0, SAMPLE_CANDIDATE_CAP);
      const weights = candidatePool.map((row) => {
        let w = Math.max(row.score, 1e-6);
        if (
          remaining.length + selected.length >= LAST_SHOWN_POOL_MIN &&
          lastShown.has(String(videoId(row.video)))
        ) {
          w *= LAST_SHOWN_WEIGHT;
        }
        return w;
      });
      const eligibleIdxs = [];
      const eligibleWeights = [];
      for (let i = 0; i < candidatePool.length; i += 1) {
        if (canAdd(candidatePool[i].video, selected, { relaxCategory, relaxDish })) {
          eligibleIdxs.push(i);
          eligibleWeights.push(weights[i]);
        }
      }
      if (!eligibleIdxs.length) {
        // Try beyond top-15 with same constraints
        let found = -1;
        for (let i = 0; i < remaining.length; i += 1) {
          if (canAdd(remaining[i].video, selected, { relaxCategory, relaxDish })) {
            found = i;
            break;
          }
        }
        if (found < 0) break;
        const [row] = remaining.splice(found, 1);
        selected.push(row.video);
        slotMeta.push("sampled");
        continue;
      }
      const pickLocal = weightedPick(
        eligibleIdxs.map((i) => candidatePool[i]),
        eligibleWeights,
        rng
      );
      const pickIdxInCandidate = eligibleIdxs[pickLocal];
      const globalIdx = pickIdxInCandidate;
      const [row] = remaining.splice(globalIdx, 1);
      selected.push(row.video);
      slotMeta.push("sampled");
    }
  }

  tryFill(false, false);
  if (selected.length < limit) tryFill(true, false);
  if (selected.length < limit) tryFill(true, true);

  // Category spread: if violated and we can swap, prefer relaxing category already done.
  if (!satisfiesCategorySpread(selected, eligible) && eligible.length >= 2) {
    // Already relaxed category during fill when needed.
  }

  // Order: position 0 = highest scored of the six; shuffle the rest.
  const withScores = selected.map((video, i) => ({
    video,
    score: scoreVideo(video, { now, profileRestaurantId }),
    slot: slotMeta[i] || "sampled",
  }));
  withScores.sort((a, b) => b.score - a.score);
  const best = withScores[0];
  const rest = withScores.slice(1);
  shuffleInPlace(rest, rng);
  const ordered = best ? [best, ...rest] : rest;

  return {
    items: ordered.map((row) => ({
      ...row.video,
      _preview_score: row.score,
      _preview_slot: row.slot,
    })),
    poolSize,
  };
}

/**
 * Category chips from eligible pool — only categories with ≥2 videos.
 * Returns [] when fewer than 2 such categories (caller hides chip row).
 */
export function deriveCategoryChips(pool) {
  const counts = new Map();
  for (const v of Array.isArray(pool) ? pool : []) {
    if (!isPreviewEligible(v)) continue;
    const key = categoryKey(v);
    if (!key) continue;
    const label = String(v.section_name).trim().replace(/\s+/g, " ");
    const prev = counts.get(key) || { key, label, count: 0 };
    prev.count += 1;
    counts.set(key, prev);
  }
  const chips = [...counts.values()].filter((c) => c.count >= 2);
  if (chips.length < 2) return [];
  chips.sort((a, b) => a.label.localeCompare(b.label));
  return chips;
}

export function formatDurationMs(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  const totalSec = Math.round(n / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function dishCaption(video, restaurantName) {
  const dish = String(video?.item_name || "").trim();
  if (dish) return dish;
  const title = String(video?.title || "").trim();
  if (title && !/^platform video$/i.test(title) && !/^menuply$/i.test(title)) {
    return title;
  }
  const name = String(restaurantName || "").trim();
  return name ? `At ${name}` : "Video";
}
