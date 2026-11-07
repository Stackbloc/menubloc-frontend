import { useEffect, useMemo, useRef, useState } from "react";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { createWallBlock, uploadWallClip } from "../../lib/clusterWallApi.js";
import { createGuestWallBlock } from "../../lib/clusterWallGuest.js";
import {
  wallName,
  DEFAULT_WALL_STYLE,
  WALL_CAPTION_LIMIT,
  WALL_CLIP_MAX_BYTES,
  WALL_CLIP_MAX_SECONDS,
  WALL_ANGLES,
  WALL_FONTS,
  WALL_INKS,
  WALL_SIZES,
  WALL_THEMES,
  wallInkShadow,
  wallSurfaceStyle,
  wallLimitFor,
} from "../../lib/clusterWallStyles.js";
import WallBlockTile from "./WallBlockTile.jsx";
import "./clusterWall.css";

const ACK_KEY = "menuply.wall.publicAck";

function readAck(consumerId) {
  try {
    return window.localStorage.getItem(`${ACK_KEY}.${consumerId}`) === "1";
  } catch {
    return false;
  }
}
function writeAck(consumerId) {
  try {
    window.localStorage.setItem(`${ACK_KEY}.${consumerId}`, "1");
  } catch {
    /* private mode */
  }
}

function newToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16)
  );
}

/** Reads the clip's length in the browser so a too-long clip is caught before uploading. */
function readClipDuration(file) {
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

function Seg({ label, value, options, onChange, className = "cw-seg" }) {
  return (
    <div>
      <span className="cw-field-label">{label}</span>
      <div className={className} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.key} type="button" role="radio" aria-checked={value === o.key} onClick={() => onChange(o.key)} style={o.style}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Write on the Wall. Words publish at once; clips go to review first (Andre decision 2).
 * Signed out = guest (Andre 2026-11-06, clusterWallGuest.js): words only, no name shown; clips still
 * need an account (onNeedAccount). If the guest path is off, the server says 401 → onNeedAccount.
 */
export default function WallComposerSheet({ clusterSlug, clusterLabel = "USC", onClose, onPosted, onNeedAccount }) {
  const { consumer } = useConsumer();
  const isGuest = !consumer?.id;
  const ackId = consumer?.id || "guest";
  const [size, setSize] = useState("medium");
  const [kind, setKind] = useState("text");
  const [body, setBody] = useState("");
  const [style, setStyle] = useState(DEFAULT_WALL_STYLE);
  const [file, setFile] = useState(null);
  const [clipPreview, setClipPreview] = useState(null);
  const [ack, setAck] = useState(() => readAck(ackId));
  const [ackChecked, setAckChecked] = useState(false);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const token = useRef(newToken());
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  useEffect(() => () => clipPreview && URL.revokeObjectURL(clipPreview), [clipPreview]);

  const limit = kind === "video" ? WALL_CAPTION_LIMIT : wallLimitFor(size);
  const count = [...body].length;
  const tooLong = count > limit;
  const canPost =
    !busy && !tooLong && (ack || ackChecked) && (kind === "text" ? body.trim().length > 0 : Boolean(file));

  const preview = useMemo(
    () => ({
      public_id: "preview",
      size,
      kind,
      body: body.trim() || (kind === "text" ? "Your words here" : ""),
      style,
      video_url: kind === "video" ? clipPreview : null,
      author: { first_name: isGuest ? null : "You" },
    }),
    [size, kind, body, style, clipPreview, isGuest]
  );

  const pickClip = async (f) => {
    setError("");
    if (!f) return;
    if (!String(f.type || "").startsWith("video/")) {
      setError("Pick a video file.");
      return;
    }
    if (f.size > WALL_CLIP_MAX_BYTES) {
      setError("That clip is too big. Keep it under 60 MB.");
      return;
    }
    const secs = await readClipDuration(f);
    if (secs != null && secs > WALL_CLIP_MAX_SECONDS + 0.75) {
      setError(`Clips can be up to ${WALL_CLIP_MAX_SECONDS} seconds. This one is ${Math.round(secs)}.`);
      return;
    }
    if (clipPreview) URL.revokeObjectURL(clipPreview);
    setFile(f);
    setClipPreview(URL.createObjectURL(f));
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
      let video_storage_key;
      if (kind === "video") {
        setProgress(0);
        video_storage_key = await uploadWallClip(file, { onProgress: setProgress });
      }
      const out = await (isGuest ? createGuestWallBlock : createWallBlock)({
        cluster_slug: clusterSlug,
        size,
        kind,
        body: body.trim(),
        style,
        video_storage_key,
        client_token: token.current,
      });
      setDone(out.block);
      onPosted?.(out.block);
    } catch (err) {
      if (isGuest && err?.status === 401 && onNeedAccount) {
        onNeedAccount();
        return;
      }
      setError(err?.message || "Couldn't post. Try again.");
      // A new token only after a definite refusal, so a network retry can't double-post.
      if (err?.status && err.status < 500) token.current = newToken();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  if (done) {
    const inReview = done.status !== "published";
    return (
      <div className="cw-overlay" role="dialog" aria-modal="true" aria-label="Posted" onClick={onClose}>
        <div className="cw-sheet" onClick={(e) => e.stopPropagation()} data-testid="cluster-wall-posted">
          <p className="cw-title">{inReview ? "Thanks — it's in review" : `It's on the ${wallName(clusterLabel)}`}</p>
          <p className="cw-sub" style={{ margin: "6px 0 14px" }}>
            {inReview
              ? done.kind === "video"
                ? "Clips show on the Wall once we've checked them. Usually soon."
                : "This one needs a quick look before it shows."
              : "Tap it on the Wall to share it."}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="cw-btn cw-btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-overlay" role="dialog" aria-modal="true" aria-label={`Write on the ${wallName(clusterLabel)}`} onClick={() => !busy && onClose?.()}>
      <div className="cw-sheet" onClick={(e) => e.stopPropagation()} data-testid="cluster-wall-composer" style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="cw-title">Write on the {wallName(clusterLabel)}</p>
          <button type="button" className="cw-btn cw-btn-quiet" onClick={onClose} disabled={busy}>Cancel</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Seg label="Size" value={size} onChange={setSize} options={WALL_SIZES} />
          <Seg
            label="Post"
            value={kind}
            onChange={(k) => {
              if (k === "video" && isGuest) {
                // Clips need an account (uploads + review); words don't.
                onNeedAccount?.();
                return;
              }
              setKind(k);
              setError("");
            }}
            options={[
              { key: "text", label: "Words" },
              { key: "video", label: isGuest ? "Clip (sign up)" : "Clip" },
            ]}
          />
        </div>

        {kind === "video" ? (
          <div style={{ display: "grid", gap: 6 }}>
            <span className="cw-field-label">Clip (up to {WALL_CLIP_MAX_SECONDS} seconds)</span>
            <div>
              <button type="button" className="cw-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
                {file ? "Pick another clip" : "Pick or record a clip"}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                hidden
                onChange={(e) => {
                  void pickClip(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label className="cw-field-label" htmlFor="cw-body">
            {kind === "video" ? "Caption (optional)" : "Your words"}
          </label>
          <textarea
            id="cw-body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError("");
            }}
            rows={kind === "video" ? 2 : 4}
            maxLength={limit + 40}
            placeholder={kind === "video" ? "Say what it is" : "Write something for the Wall"}
            style={{ width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 4, padding: "8px 10px", font: "500 15px/1.35 system-ui", resize: "vertical" }}
          />
          <p className="cw-sub" style={{ textAlign: "right", color: tooLong ? "#b91c1c" : undefined }}>
            {count}/{limit}
          </p>
        </div>

        {kind === "text" ? (
          <div style={{ display: "grid", gap: 10 }}>
            <Seg
              label="Font"
              className="cw-seg cw-fontpick"
              value={style.font}
              onChange={(font) => setStyle((s) => ({ ...s, font }))}
              options={Object.entries(WALL_FONTS).map(([key, f]) => ({
                key,
                label: f.label,
                style: { fontFamily: f.family, fontWeight: f.weight, textTransform: f.upper ? "uppercase" : "none" },
              }))}
            />
            <div>
              <span className="cw-field-label">Surface</span>
              <div role="radiogroup" aria-label="Surface" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(WALL_THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={style.theme === key}
                    aria-label={t.label}
                    title={t.label}
                    className="cw-swatch"
                    onClick={() => setStyle((s) => ({ ...s, theme: key }))}
                    style={{ ...wallSurfaceStyle(key), color: t.ink, textShadow: wallInkShadow(key) }}
                  >
                    Aa
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="cw-field-label">Paint</span>
              <div role="radiogroup" aria-label="Paint colour" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(WALL_INKS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={(style.ink || "auto") === key}
                    aria-label={key === "auto" ? "Surface colour" : p.label}
                    title={key === "auto" ? "Surface colour" : p.label}
                    className="cw-paint"
                    onClick={() => setStyle((s) => ({ ...s, ink: key }))}
                    style={p.color ? { background: p.color } : undefined}
                  >
                    {key === "auto" ? "Auto" : ""}
                  </button>
                ))}
              </div>
            </div>
            <Seg
              label="Turn"
              className="cw-seg cw-fontpick"
              value={style.angle || 0}
              onChange={(angle) => setStyle((s) => ({ ...s, angle }))}
              options={WALL_ANGLES.map((a) => ({ key: a.key, label: a.label }))}
            />
            <Seg
              label="Line up"
              value={style.align}
              onChange={(align) => setStyle((s) => ({ ...s, align }))}
              options={[
                { key: "center", label: "Center" },
                { key: "left", label: "Left" },
              ]}
            />
          </div>
        ) : null}

        <div>
          <span className="cw-field-label">Preview</span>
          <div className="cw-mosaic" style={{ maxWidth: 380, pointerEvents: "none" }} aria-hidden="true">
            <WallBlockTile block={preview} />
          </div>
        </div>

        <p className="cw-notice" data-testid="cluster-wall-public-notice">
          Posts on the Wall are public. Anyone can see them and share them outside Menuply, and they stay in past
          weeks.{" "}
          {isGuest
            ? "No account needed and no name shows. You can delete yours from this browser."
            : "Your first name shows, linked to your profile if it's public. You can delete yours anytime."}
        </p>
        {!ack ? (
          <label style={{ display: "flex", gap: 8, alignItems: "center", font: "600 14px/1.3 system-ui" }}>
            <input type="checkbox" checked={ackChecked} onChange={(e) => setAckChecked(e.target.checked)} data-testid="cluster-wall-ack" />
            I understand my post is public
          </label>
        ) : null}

        {error ? <p role="alert" style={{ color: "#b91c1c", margin: 0, font: "600 14px/1.3 system-ui" }}>{error}</p> : null}

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
          {progress != null ? <span className="cw-sub">Uploading {Math.round(progress * 100)}%</span> : null}
          <button type="button" className="cw-btn cw-btn-primary" onClick={post} disabled={!canPost} data-testid="cluster-wall-post">
            {busy ? "Posting…" : kind === "video" ? "Send for review" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
