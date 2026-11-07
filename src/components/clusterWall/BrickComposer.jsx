import { useEffect, useMemo, useRef, useState } from "react";
import { createWallBlock, uploadWallClip, uploadWallPhoto } from "../../lib/clusterWallApi.js";
import { createGuestWallBlock } from "../../lib/clusterWallGuest.js";
import {
  wallName,
  WALL_CAPTION_LIMIT,
  WALL_CLIP_MAX_BYTES,
  WALL_CLIP_MAX_SECONDS,
  WALL_EMOJI_PICKS,
  WALL_MATERIALS,
  WALL_THEMES,
  WALL_UNDERLINES,
  randomWallTilt,
  wallSurfaceStyle,
} from "../../lib/clusterWallStyles.js";
import Brick from "./Brick.jsx";

/**
 * "Write a Brick" (2026-11-06 redesign). The student picks the material (never random), writes up to
 * TEXT_LIMIT characters, and can add a photo or a clip, a marker underline and one emoji. The tilt
 * (±3°) is rolled when the sheet opens and shown in the live preview, so what you see is what posts.
 * Signed out = guest: words only (photo/clip → sign up), no name. Photos and clips are checked by a
 * person before they show.
 */

const TEXT_LIMIT = 160;
const PHOTO_MAX_BYTES = 15 * 1024 * 1024;
const ACK_KEY = "menuply.wall.publicAck";

function readAck(id) {
  try {
    return window.localStorage.getItem(`${ACK_KEY}.${id}`) === "1";
  } catch {
    return false;
  }
}
function writeAck(id) {
  try {
    window.localStorage.setItem(`${ACK_KEY}.${id}`, "1");
  } catch {
    /* private mode */
  }
}
function newToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
}
function clipSeconds(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v.duration) ? v.duration : null);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    v.src = url;
  });
}

function Choice({ label, children }) {
  return (
    <div className="bc-field">
      <span className="bc-label">{label}</span>
      <div className="bc-choices" role="radiogroup" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

export default function BrickComposer({ clusterSlug, clusterLabel = "USC", isSignedIn = false, onClose, onPosted, onNeedAccount }) {
  const ackId = isSignedIn ? "me" : "guest";
  const [material, setMaterial] = useState("brick");
  const [body, setBody] = useState("");
  const [underline, setUnderline] = useState("none");
  const [emoji, setEmoji] = useState(null);
  const [tilt] = useState(() => randomWallTilt());
  const [media, setMedia] = useState(null); // { kind: "photo" | "video", file, url }
  const [ack, setAck] = useState(() => readAck(ackId));
  const [ackChecked, setAckChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const token = useRef(newToken());
  const photoInput = useRef(null);
  const clipInput = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);
  useEffect(() => () => media?.url && URL.revokeObjectURL(media.url), [media]);

  const kind = media?.kind || "text";
  const limit = kind === "text" ? TEXT_LIMIT : WALL_CAPTION_LIMIT;
  const count = [...body].length;
  const canPost = !busy && count <= limit && (ack || ackChecked) && (kind === "text" ? body.trim().length > 0 : true);
  const style = useMemo(() => ({ font: "marker", theme: material, align: "center", ink: "auto", angle: 0, tilt, underline, emoji }), [material, tilt, underline, emoji]);

  const preview = useMemo(
    () => ({
      public_id: "preview",
      kind,
      size: "medium",
      body: body.trim() || (kind === "text" ? "Your words here" : ""),
      style,
      photo_url: kind === "photo" ? media.url : null,
      poster_url: null,
      author: { first_name: isSignedIn ? "You" : null },
      published_at: new Date().toISOString(),
    }),
    [kind, body, style, media, isSignedIn]
  );

  const needAccount = () => {
    onClose?.();
    onNeedAccount?.();
  };

  const pickPhoto = (f) => {
    setError("");
    if (!f) return;
    if (!String(f.type || "").startsWith("image/")) return setError("Pick a photo.");
    if (f.size > PHOTO_MAX_BYTES) return setError("That photo is too big (15 MB max).");
    setMedia({ kind: "photo", file: f, url: URL.createObjectURL(f) });
  };
  const pickClip = async (f) => {
    setError("");
    if (!f) return;
    if (!String(f.type || "").startsWith("video/")) return setError("Pick a video.");
    if (f.size > WALL_CLIP_MAX_BYTES) return setError("That clip is too big. Keep it under 60 MB.");
    const secs = await clipSeconds(f);
    if (secs != null && secs > WALL_CLIP_MAX_SECONDS + 0.75) {
      return setError(`Clips can be up to ${WALL_CLIP_MAX_SECONDS} seconds. This one is ${Math.round(secs)}.`);
    }
    setMedia({ kind: "video", file: f, url: URL.createObjectURL(f) });
  };

  const post = async () => {
    if (!canPost) return;
    setBusy(true);
    setError("");
    try {
      if (!ack) {
        writeAck(ackId);
        setAck(true);
      }
      const payload = {
        cluster_slug: clusterSlug,
        size: kind === "text" && count <= 80 ? "small" : "medium",
        kind,
        body: body.trim(),
        style,
        client_token: token.current,
      };
      if (kind === "photo") {
        setProgress(0);
        const up = await uploadWallPhoto(media.file, { onProgress: (p) => setProgress(typeof p === "number" ? p : p?.percent / 100 || 0) });
        payload.photo_storage_key = up.storage_key;
      } else if (kind === "video") {
        setProgress(0);
        payload.video_storage_key = await uploadWallClip(media.file, { onProgress: setProgress });
      }
      const out = await (isSignedIn ? createWallBlock : createGuestWallBlock)(payload);
      setDone(out.block);
      onPosted?.(out.block);
    } catch (err) {
      if (!isSignedIn && err?.status === 401 && onNeedAccount) return needAccount();
      setError(err?.message || "Couldn't post. Try again.");
      if (err?.status && err.status < 500) token.current = newToken();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  if (done) {
    const inReview = done.status && done.status !== "published";
    return (
      <div className="bc-overlay" role="dialog" aria-modal="true" aria-label="Posted" onClick={onClose}>
        <div className="bc-sheet" onClick={(e) => e.stopPropagation()} data-testid="cluster-wall-posted">
          <p className="bc-title">{inReview ? "Thanks — it's in review" : `Your brick is on the ${wallName(clusterLabel)}`}</p>
          <p className="bc-sub">
            {inReview
              ? `${done.kind === "photo" ? "Photos" : done.kind === "video" ? "Clips" : "This one"} show once we've had a quick look. Usually soon.`
              : "It's at the top. Tap it to share it."}
          </p>
          <div className="bc-actions">
            <button type="button" className="bc-post" onClick={onClose} data-testid="cluster-wall-posted-done">Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bc-overlay" role="dialog" aria-modal="true" aria-label="Write a Brick" onClick={() => !busy && onClose?.()}>
      <div className="bc-sheet" onClick={(e) => e.stopPropagation()} data-testid="cluster-wall-composer">
        <div className="bc-head">
          <p className="bc-title">Write a Brick</p>
          <button type="button" className="bc-link" onClick={onClose} disabled={busy}>Cancel</button>
        </div>

        <div className="bc-preview" aria-label="Preview" data-testid="brick-preview" style={kind === "text" ? undefined : { aspectRatio: "12 / 7.4" }}>
          <Brick block={preview} onOpen={() => {}} tall={kind !== "text"} />
        </div>

        {kind === "text" ? (
          <Choice label="Material">
            {WALL_MATERIALS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={material === key}
                aria-label={WALL_THEMES[key].label}
                title={WALL_THEMES[key].label}
                className="bc-swatch"
                data-testid={`brick-material-${key}`}
                onClick={() => setMaterial(key)}
                style={wallSurfaceStyle(key)}
              />
            ))}
          </Choice>
        ) : null}

        <label className="bc-field">
          <span className="bc-label">{kind === "text" ? "Your words" : "Caption (optional)"}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={kind === "text" ? 3 : 2}
            placeholder={kind === "text" ? `Say something to ${clusterLabel}` : "Say what it is"}
            className="bc-input"
            data-testid="wall-body"
            maxLength={limit + 40}
          />
          <span className={`bc-count${count > limit ? " bc-over" : ""}`}>{count}/{limit}</span>
        </label>

        <div className="bc-field">
          <span className="bc-label">Add</span>
          <div className="bc-choices">
            {media ? (
              <button type="button" className="bc-chip" onClick={() => setMedia(null)} data-testid="brick-remove-media">
                ✕ Remove {media.kind === "photo" ? "photo" : "clip"}
              </button>
            ) : (
              <>
                <button type="button" className="bc-chip" onClick={() => (isSignedIn ? photoInput.current?.click() : needAccount())} data-testid="brick-add-photo">
                  📷 Photo{isSignedIn ? "" : " (sign up)"}
                </button>
                <button type="button" className="bc-chip" onClick={() => (isSignedIn ? clipInput.current?.click() : needAccount())} data-testid="brick-add-clip">
                  🎬 Clip{isSignedIn ? "" : " (sign up)"}
                </button>
              </>
            )}
            <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
            <input ref={clipInput} type="file" accept="video/*" hidden onChange={(e) => pickClip(e.target.files?.[0])} />
          </div>
        </div>

        {kind === "text" ? (
          <>
            <Choice label="Underline">
              {Object.entries(WALL_UNDERLINES).map(([key, u]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={underline === key}
                  className="bc-chip"
                  data-testid={`brick-underline-${key}`}
                  onClick={() => setUnderline(key)}
                >
                  {u.color ? <span className="bc-ul" style={{ background: u.color }} aria-hidden="true" /> : null}
                  {u.label}
                </button>
              ))}
            </Choice>
            <Choice label="Emoji (one)">
              <button type="button" role="radio" aria-checked={!emoji} className="bc-chip" onClick={() => setEmoji(null)}>None</button>
              {WALL_EMOJI_PICKS.map((e) => (
                <button key={e} type="button" role="radio" aria-checked={emoji === e} className="bc-chip bc-emoji" onClick={() => setEmoji(e)} data-testid={`brick-emoji-${e}`}>
                  {e}
                </button>
              ))}
            </Choice>
          </>
        ) : null}

        <p className="bc-note" data-testid="wall-public-notice">
          Bricks are public and stay on the Wall. Anyone can see and share them.{" "}
          {isSignedIn ? "Your first name shows. You can delete yours anytime." : "No account needed and no name shows. You can delete yours from this browser."}
          {kind !== "text" ? " Photos and clips are checked before they show." : ""}
        </p>
        {!ack ? (
          <label className="bc-ack">
            <input type="checkbox" checked={ackChecked} onChange={(e) => setAckChecked(e.target.checked)} data-testid="wall-ack" />
            I understand
          </label>
        ) : null}
        {error ? <p className="bc-error" role="alert">{error}</p> : null}
        <div className="bc-actions">
          {progress != null ? <span className="bc-sub">Uploading… {Math.round(progress * 100)}%</span> : null}
          <button type="button" className="bc-post" onClick={post} disabled={!canPost} data-testid="wall-post">
            {busy ? "Posting…" : kind === "text" ? "Post brick" : "Send for review"}
          </button>
        </div>
      </div>
    </div>
  );
}
