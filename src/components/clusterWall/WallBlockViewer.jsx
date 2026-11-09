import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { withConsumerAuthNext } from "../../lib/consumerAuthNext.js";
import { WALL_REPORT_REASONS, deleteWallBlock, reportWallBlock } from "../../lib/clusterWallApi.js";
import { deleteGuestWallBlock } from "../../lib/clusterWallGuest.js";
import {
  canShareFiles,
  copyWallLink,
  fetchWallShareFile,
  saveWallFile,
  shareWallBlock,
  trackWallShare,
  wallSmsHref,
} from "../../lib/clusterWallShare.js";
import { wallAgo, wallName } from "../../lib/clusterWallStyles.js";
import Brick from "./Brick.jsx";
import "./brickWall.css";
import "./clusterWall.css";
import { trackEngagement } from "../../lib/engagementTracking.js";

// Owner Analytics: a Wall clip counts as played once per viewer screen (the clip loops).
const playedClips = new Set();
function onFirstClipPlay(event) {
  const key = event?.currentTarget?.currentSrc || event?.currentTarget?.src;
  if (!key || playedClips.has(key)) return;
  playedClips.add(key);
  trackEngagement("wall_interaction", { subtype: "clip_play" });
}

/** The block, big — words on their paper, or the clip with sound. Used by the viewer and /wall/:id. */
export function WallBlockLarge({ block }) {
  if (block.kind === "photo") {
    return (
      <div style={{ background: "#111", borderRadius: 4, overflow: "hidden", position: "relative", margin: "0 auto" }}>
        {block.photo_url ? (
          <img src={block.photo_url} alt={block.body || "Photo on the Wall"} style={{ width: "100%", maxHeight: "62vh", objectFit: "contain", display: "block" }} />
        ) : null}
        {block.body || block.author?.first_name ? (
          <p style={{ position: "absolute", left: 0, right: 0, bottom: 0, margin: 0, padding: "18px 12px 10px", color: "#fff", background: "linear-gradient(transparent, rgba(0,0,0,.7))", font: "700 15px/1.3 system-ui", pointerEvents: "none" }}>
            {block.body}
            {block.author?.first_name ? <span style={{ float: "right", fontWeight: 600 }}>— {block.author.first_name}</span> : null}
          </p>
        ) : null}
      </div>
    );
  }
  if (block.kind === "video") {
    return (
      <div style={{ background: "#111827", borderRadius: 4, overflow: "hidden", aspectRatio: "9 / 16", maxHeight: "62vh", margin: "0 auto", position: "relative" }}>
        {block.video_url ? (
          <video
            src={block.video_url}
            poster={block.poster_url || undefined}
            controls
            autoPlay
            playsInline
            loop
            onPlay={onFirstClipPlay}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        ) : (
          <div style={{ color: "#fff", display: "grid", placeItems: "center", height: "100%", font: "600 14px/1.4 system-ui", padding: 16, textAlign: "center" }}>
            {block.media_status === "failed"
              ? block.media_error || "We couldn't process that clip."
              : "Your clip is in review. It shows on the Wall once it's approved."}
          </div>
        )}
        {block.body ? (
          <p style={{ position: "absolute", left: 0, right: 0, bottom: 0, margin: 0, padding: "18px 12px 10px", color: "#fff", background: "linear-gradient(transparent, rgba(0,0,0,.7))", font: "700 15px/1.3 system-ui", pointerEvents: "none" }}>
            {block.body}
          </p>
        ) : null}
      </div>
    );
  }
  // Words: the same brick as on the Wall (material, tilt, underline, emoji, "— Name · age"), big.
  return (
    <div className="bw-large" style={{ position: "relative", aspectRatio: "12 / 7", borderRadius: 4, overflow: "hidden" }}>
      <Brick block={block} onOpen={() => {}} />
    </div>
  );
}

function AuthorLine({ block }) {
  // The Wall is one continuous wall (2026-11-06): age instead of "Week of …". Guests show as Guest.
  const name = block.official ? "Menuply" : block.author?.first_name || (block.public_id ? "Guest" : null);
  const ago = wallAgo(block.published_at || block.created_at);
  return (
    <p className="cw-sub" style={{ margin: "8px 0 0" }}>
      {name ? (
        block.author?.profile_path ? (
          <Link to={block.author.profile_path} style={{ color: "#111827", fontWeight: 800 }}>
            {name}
          </Link>
        ) : (
          <span style={{ color: "#111827", fontWeight: 800 }}>{name}</span>
        )
      ) : null}
      {name ? " · " : ""}
      {wallName(block.cluster_label)}{ago ? ` · ${ago === "now" ? "just now" : `${ago} ago`}` : ""}
    </p>
  );
}

/** Share controls for one block (all sizes, words and clips). */
export function WallShareControls({ block }) {
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fileShare = useMemo(() => canShareFiles(), []);
  const isClip = block.kind === "video";
  const shareable = !isClip || Boolean(block.share_video_url);

  // Fetch the branded file when the controls open, so the Share tap itself stays a user gesture.
  useEffect(() => {
    if (!shareable) return undefined;
    const ctrl = new AbortController();
    fetchWallShareFile(block, { signal: ctrl.signal })
      .then(setFile)
      .catch(() => {});
    return () => ctrl.abort();
  }, [block, shareable]);

  if (block.is_mine && block.status && block.status !== "published") {
    return <p className="cw-sub">You can share it once it's on the Wall.</p>;
  }

  const onShare = async () => {
    setBusy(true);
    try {
      const how = await shareWallBlock(block, { file });
      if (how !== "cancelled") trackWallShare(block, how === "shared_file" ? "native_file" : how === "shared_link" ? "native" : "copy_link");
      if (how === "copied") setNote("Link copied.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="cluster-wall-share" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="cw-btn cw-btn-primary" onClick={onShare} disabled={busy} data-testid="cluster-wall-share-button">
          <span aria-hidden="true">↗</span> Share
        </button>
        <button
          type="button"
          className="cw-btn"
          onClick={async () => {
            await copyWallLink(block);
            trackWallShare(block, "copy_link");
            setNote("Link copied.");
          }}
        >
          Copy link
        </button>
        {shareable ? (
          <button
            type="button"
            className="cw-btn"
            onClick={async () => {
              try {
                await saveWallFile(block, { file });
                trackWallShare(block, "download");
              } catch (err) {
                setNote(err?.message || "Couldn't save it.");
              }
            }}
          >
            {isClip ? "Save clip" : "Save image"}
          </button>
        ) : null}
        <a className="cw-btn" href={wallSmsHref(block)} onClick={() => trackWallShare(block, "sms")}>
          Text
        </a>
      </div>
      <p className="cw-sub" style={{ margin: 0 }}>
        {fileShare
          ? `Instagram, Snapchat, TikTok: tap Share and pick the app. The ${isClip ? "clip" : "picture"} has a small Menuply mark.`
          : `For Instagram, Snapchat or TikTok, save the ${isClip ? "clip" : "image"} and post it.`}
      </p>
      {note ? <p className="cw-sub" role="status" style={{ margin: 0, color: "#047857" }}>{note}</p> : null}
    </div>
  );
}

/**
 * Tap a tile → this sheet: the block big, who wrote it, Share, and Report (or Delete if it's yours).
 */
export default function WallBlockViewer({ block, onClose, onRemoved }) {
  const { isAuthenticated } = useConsumer();
  const location = useLocation();
  const [mode, setMode] = useState("view"); // view | report | reported | confirm-delete
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sendReport = async () => {
    if (!reason) return;
    setBusy(true);
    setErr("");
    try {
      await reportWallBlock(block.public_id, { reason });
      setMode("reported");
    } catch (e) {
      setErr(e?.message || "Couldn't send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      await (block.guest ? deleteGuestWallBlock : deleteWallBlock)(block.public_id);
      onRemoved?.(block.public_id);
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Couldn't delete. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="cw-overlay" role="dialog" aria-modal="true" aria-label="Wall post" onClick={onClose}>
      <div className="cw-sheet" onClick={(e) => e.stopPropagation()} data-testid="cluster-wall-viewer">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
          <button type="button" className="cw-btn cw-btn-quiet" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <WallBlockLarge block={block} />
        <AuthorLine block={block} />

        {mode === "view" ? (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            <WallShareControls block={block} />
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
              {block.is_mine ? (
                <button type="button" className="cw-btn cw-btn-quiet" onClick={() => setMode("confirm-delete")}>
                  Delete my post
                </button>
              ) : isAuthenticated ? (
                <button type="button" className="cw-btn cw-btn-quiet" onClick={() => setMode("report")}>
                  ⚑ Report
                </button>
              ) : (
                <Link className="cw-btn cw-btn-quiet" to={withConsumerAuthNext("/account/login", `${location.pathname}${location.search}`)}>
                  ⚑ Sign in to report
                </Link>
              )}
            </div>
          </div>
        ) : null}

        {mode === "report" ? (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }} role="radiogroup" aria-label="Why are you reporting this?">
            <p className="cw-title" style={{ fontSize: 15 }}>What's wrong with it?</p>
            {WALL_REPORT_REASONS.map((r) => (
              <label key={r.value} style={{ display: "flex", gap: 8, alignItems: "center", font: "500 14px/1.3 system-ui" }}>
                <input type="radio" name="wall-report" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
            {err ? <p style={{ color: "#b91c1c", margin: 0 }}>{err}</p> : null}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="cw-btn" onClick={() => setMode("view")}>Cancel</button>
              <button type="button" className="cw-btn cw-btn-primary" disabled={!reason || busy} onClick={sendReport}>Send report</button>
            </div>
          </div>
        ) : null}

        {mode === "reported" ? (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <p className="cw-notice">Thanks. We'll take a look, and you won't see this post again.</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="cw-btn cw-btn-primary"
                onClick={() => {
                  onRemoved?.(block.public_id);
                  onClose?.();
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : null}

        {mode === "confirm-delete" ? (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <p className="cw-notice">Delete this post? Its link stops working for everyone.</p>
            {err ? <p style={{ color: "#b91c1c", margin: 0 }}>{err}</p> : null}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="cw-btn" onClick={() => setMode("view")}>Keep it</button>
              <button type="button" className="cw-btn cw-btn-primary" style={{ background: "#b91c1c", borderColor: "#b91c1c" }} disabled={busy} onClick={doDelete}>
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
