import { copyText, toConsumerShareAbsolute } from "../components/share/shareUtils.js";
import { wallShareImageUrl } from "./clusterWallApi.js";

/**
 * Sharing one Wall block outside Menuply.
 * Phones: the system share sheet with the branded picture / clip as a FILE — that's what lets
 * Instagram, Snapchat, TikTok and Messages show up (they don't take web links in posts).
 * Everywhere else: link, save the file, text. Every share is a short note with the link (house style).
 */

export function wallShareUrl(block) {
  return toConsumerShareAbsolute(`${block.path}?ref=wall_share`);
}

export function wallShareText(block) {
  const where = `the ${block.cluster_label || "Menuply"} Wall`;
  const url = wallShareUrl(block);
  return block.is_mine
    ? `I wrote on ${where} on Menuply ✍️ ${url}`
    : `Saw this on ${where} on Menuply 👀 ${url}`;
}

function fileName(block, ext) {
  return `menuply-${block.cluster_slug || "wall"}-wall-${block.public_id}.${ext}`;
}

/** Branded file for this block: the share clip for clips, the picture for words. */
export async function fetchWallShareFile(block, { signal } = {}) {
  const isClip = block.kind === "video" && block.share_video_url;
  const url = isClip ? block.share_video_url : wallShareImageUrl(block.public_id);
  const res = await fetch(url, { signal, credentials: "omit" });
  if (!res.ok) throw new Error(res.status === 410 ? "This post was removed." : "Couldn't get the file.");
  const blob = await res.blob();
  const type = isClip ? "video/mp4" : "image/png";
  return new File([blob], fileName(block, isClip ? "mp4" : "png"), { type });
}

export function canShareFiles() {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File([new Blob(["x"], { type: "image/png" })], "x.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * The main Share button. Returns "shared_file" | "shared_link" | "copied" | "cancelled".
 * A prefetched file (from when the sheet opened) keeps the tap inside the user gesture on iOS.
 */
export async function shareWallBlock(block, { file = null } = {}) {
  const text = wallShareText(block);
  const url = wallShareUrl(block);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return "shared_file";
      }
      await navigator.share({ text, url });
      return "shared_link";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      // Some browsers refuse files after a slow fetch; fall back to the link.
      try {
        await navigator.share({ text, url });
        return "shared_link";
      } catch (err2) {
        if (err2?.name === "AbortError") return "cancelled";
      }
    }
  }
  await copyText(text);
  return "copied";
}

export async function copyWallLink(block) {
  return copyText(wallShareUrl(block));
}

/** Save the branded picture / clip to the device. */
export async function saveWallFile(block, { file = null } = {}) {
  const f = file || (await fetchWallShareFile(block));
  const href = URL.createObjectURL(f);
  const a = document.createElement("a");
  a.href = href;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
}

export function wallSmsHref(block) {
  return `sms:?&body=${encodeURIComponent(wallShareText(block))}`;
}

export function trackWallShare(block, channel) {
  if (typeof window === "undefined") return;
  const payload = {
    page_type: "cluster_wall",
    share_target: channel,
    cluster_slug: block.cluster_slug,
    wall_kind: block.kind,
    wall_size: block.size,
  };
  if (typeof window.gtag === "function") window.gtag("event", "wall_share", payload);
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: "wall_share", ...payload });
}
