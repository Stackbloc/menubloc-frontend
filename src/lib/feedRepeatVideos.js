/**
 * Drops Feed rows already in the list: same id, or the same video file under another id (two
 * managed rows can share one upload). Sponsored clips come back on purpose (one per 12 clips),
 * so only their id counts. Same rule as the app (menuply-mobile useFeed appendFeedPage, 2026-10-31).
 */
function videoKey(row) {
  const url = String(row?.video_url || "").split("#")[0].trim();
  return url || null;
}

function isSponsored(row) {
  return String(row?.kind || "").toLowerCase() === "sponsored" || Boolean(row?.sponsored);
}

export function appendUniqueFeedRows(existing, rows) {
  const before = Array.isArray(existing) ? existing : [];
  const seenId = new Set(before.map((row) => String(row?.id || "")));
  const seenVideo = new Set(before.filter((row) => !isSponsored(row)).map(videoKey).filter(Boolean));
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.id || "");
    if (!id || seenId.has(id)) continue;
    const key = videoKey(row);
    if (!isSponsored(row) && key && seenVideo.has(key)) continue;
    seenId.add(id);
    if (!isSponsored(row) && key) seenVideo.add(key);
    out.push(row);
  }
  return out;
}
