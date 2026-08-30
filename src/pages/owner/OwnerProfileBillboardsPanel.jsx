/**
 * Owner Profile Manager — entrance splash billboards + profile Windows panel photos.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  createOwnerRestaurantBillboard,
  createOwnerRestaurantWindow,
  listOwnerRestaurantBillboards,
  listOwnerRestaurantWindows,
  pauseOwnerRestaurantBillboard,
  pauseOwnerRestaurantWindow,
  updateOwnerRestaurantBillboard,
  updateOwnerRestaurantWindow,
  uploadOwnerRestaurantBillboardPhoto,
  uploadOwnerRestaurantWindowPhoto,
} from "../../lib/ownerApi.js";
import { resolveBillboardMediaUrl } from "../../lib/billboardMediaUrl.js";

const IMAGE_FITS = ["cover", "contain", "fill"];
const MAX_SPLASH = 6;
const MAX_WINDOWS = 4;

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: OWNER_COLORS.muted,
        marginBottom: 6,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function statusLabel(post) {
  const raw = post?.billboard_status || post?.status || "";
  if (raw === "active" && post?.status === "active") return "Active";
  if (raw === "paused") return "Paused";
  return raw ? String(raw) : "Unknown";
}

function isActivePost(post) {
  const status = post?.billboard_status || post?.status;
  return status === "active";
}

function SplashBillboardEditor({ restaurantId, initial, onCancel, onSaved }) {
  const photoRef = useRef(null);
  const [promoHeadline, setPromoHeadline] = useState(() => {
    const override = String(initial?.headline_override || "").trim();
    if (override) return override;
    const title = String(initial?.title || "").trim();
    if (!title || title === "Entrance billboard") return "";
    return title;
  });
  const [body, setBody] = useState(initial?.body || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [imageFit, setImageFit] = useState(() => {
    const fit = String(initial?.image_fit || "cover").toLowerCase();
    return IMAGE_FITS.includes(fit) ? fit : "cover";
  });
  const [slideOrder, setSlideOrder] = useState(() => {
    const order = Number(initial?.display_order);
    return Number.isInteger(order) && order >= 0 ? Math.min(order + 1, MAX_SPLASH) : 1;
  });
  const [active, setActive] = useState(() => !initial || isActivePost(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = pendingPhoto
    ? URL.createObjectURL(pendingPhoto)
    : resolveBillboardMediaUrl(imageUrl) || null;

  async function handleSave(event) {
    event.preventDefault();
    if (!restaurantId) return;
    setError("");

    if (!initial?.id && !pendingPhoto && !imageUrl) {
      setError("Upload a billboard graphic (PNG, JPG, or WEBP, max 10 MB).");
      return;
    }
    if (!promoHeadline.trim() && !pendingPhoto && !imageUrl) {
      setError("Upload a graphic or enter a promo headline.");
      return;
    }

    setBusy(true);
    try {
      let finalImageUrl = imageUrl || null;
      if (pendingPhoto) {
        const uploaded = await uploadOwnerRestaurantBillboardPhoto(restaurantId, pendingPhoto, {
          postId: initial?.id || null,
        });
        if (!uploaded?.photo_url) throw new Error(uploaded?.error || "Photo upload failed");
        finalImageUrl = uploaded.photo_url;
      }

      const promo = promoHeadline.trim();
      const payload = {
        title: promo || "Entrance billboard",
        body: body.trim(),
        headline_override: promo || null,
        image_url: finalImageUrl,
        image_fit: imageFit,
        display_order: Math.max(0, Math.min(MAX_SPLASH - 1, Number(slideOrder) - 1)),
        status: active ? "active" : "paused",
      };

      if (initial?.id) {
        await updateOwnerRestaurantBillboard(restaurantId, initial.id, payload);
      } else {
        await createOwnerRestaurantBillboard(restaurantId, payload);
      }

      onSaved?.();
    } catch (err) {
      setError(err?.message || "Could not save billboard.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      data-testid={initial?.id ? "owner-profile-billboard-edit" : "owner-profile-billboard-create"}
      style={{
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 10,
        padding: 14,
        background: "#fafaf9",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink }}>
        {initial?.id ? "Edit entrance billboard" : "Add entrance billboard"}
      </div>
      <div>
        <FieldLabel>Graphic</FieldLabel>
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => setPendingPhoto(e.target.files?.[0] || null)}
          data-testid="owner-profile-billboard-photo-input"
        />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            style={{
              width: "100%",
              maxWidth: 280,
              maxHeight: 180,
              objectFit: imageFit,
              borderRadius: 8,
              border: `1px solid ${OWNER_COLORS.line}`,
              background: "#fff",
            }}
          />
        ) : (
          <div
            style={{
              padding: 24,
              borderRadius: 8,
              border: `1px dashed ${OWNER_COLORS.line}`,
              color: OWNER_COLORS.muted,
              fontSize: 12,
              textAlign: "center",
            }}
          >
            No image yet
          </div>
        )}
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          data-testid="owner-profile-billboard-choose-photo"
        >
          {previewUrl ? "Replace photo" : "Upload photo"}
        </button>
      </div>
      <div>
        <FieldLabel>Promo headline (optional)</FieldLabel>
        <input
          style={inputStyle}
          value={promoHeadline}
          onChange={(e) => setPromoHeadline(e.target.value)}
          placeholder="e.g. Happy hour · game day specials"
          data-testid="owner-profile-billboard-title"
        />
        <div style={{ marginTop: 6, fontSize: 11, color: OWNER_COLORS.muted, lineHeight: 1.45 }}>
          Your restaurant name already appears on the profile hero. Leave blank for graphic-only
          entrance billboards.
        </div>
      </div>
      <div>
        <FieldLabel>Terms / description (optional)</FieldLabel>
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Fine print or short promo copy on the splash"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div>
          <FieldLabel>Slide order (1–{MAX_SPLASH})</FieldLabel>
          <input
            style={inputStyle}
            type="number"
            min={1}
            max={MAX_SPLASH}
            value={slideOrder}
            onChange={(e) => setSlideOrder(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Image fit</FieldLabel>
          <select style={inputStyle} value={imageFit} onChange={(e) => setImageFit(e.target.value)}>
            {IMAGE_FITS.map((fit) => (
              <option key={fit} value={fit}>
                {fit}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Show on public profile entrance splash
      </label>
      {error ? (
        <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }} data-testid="owner-profile-billboard-error">
          {error}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="submit"
          disabled={busy}
          data-testid="owner-profile-billboard-save"
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            background: OWNER_COLORS.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {busy ? "Saving…" : initial?.id ? "Save billboard" : "Publish billboard"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function WindowPhotoEditor({ restaurantId, initial, onCancel, onSaved }) {
  const photoRef = useRef(null);
  const [title, setTitle] = useState(initial?.title || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [slideOrder, setSlideOrder] = useState(() => {
    const order = Number(initial?.display_order);
    return Number.isInteger(order) && order >= 0 ? Math.min(order + 1, MAX_WINDOWS) : 1;
  });
  const [active, setActive] = useState(() => !initial || isActivePost(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = pendingPhoto
    ? URL.createObjectURL(pendingPhoto)
    : resolveBillboardMediaUrl(imageUrl) || null;

  async function handleSave(event) {
    event.preventDefault();
    if (!restaurantId) return;
    setError("");

    if (!initial?.id && !pendingPhoto && !imageUrl) {
      setError("Upload a Windows panel photo.");
      return;
    }

    setBusy(true);
    try {
      let finalImageUrl = imageUrl || null;
      if (pendingPhoto) {
        const uploaded = await uploadOwnerRestaurantWindowPhoto(restaurantId, pendingPhoto, {
          postId: initial?.id || null,
        });
        if (!uploaded?.photo_url) throw new Error(uploaded?.error || "Photo upload failed");
        finalImageUrl = uploaded.photo_url;
      }

      const payload = {
        title: title.trim() || "Window",
        image_url: finalImageUrl,
        display_order: Math.max(0, Math.min(MAX_WINDOWS - 1, Number(slideOrder) - 1)),
        status: active ? "active" : "paused",
        image_fit: "cover",
      };

      if (initial?.id) {
        await updateOwnerRestaurantWindow(restaurantId, initial.id, payload);
      } else {
        await createOwnerRestaurantWindow(restaurantId, payload);
      }

      onSaved?.();
    } catch (err) {
      setError(err?.message || "Could not save Windows photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      data-testid={initial?.id ? "owner-profile-window-edit" : "owner-profile-window-create"}
      style={{
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 10,
        padding: 14,
        background: "#fafaf9",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink }}>
        {initial?.id ? "Edit Windows panel photo" : "Add Windows panel photo"}
      </div>
      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => setPendingPhoto(e.target.files?.[0] || null)}
        data-testid="owner-profile-window-photo-input"
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          style={{
            width: "100%",
            maxWidth: 200,
            maxHeight: 280,
            objectFit: "cover",
            borderRadius: 8,
            border: `1px solid ${OWNER_COLORS.line}`,
          }}
        />
      ) : null}
      <button
        type="button"
        onClick={() => photoRef.current?.click()}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: `1px solid ${OWNER_COLORS.line}`,
          background: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          justifySelf: "start",
        }}
        data-testid="owner-profile-window-choose-photo"
      >
        {previewUrl ? "Replace photo" : "Upload photo"}
      </button>
      <div>
        <FieldLabel>Label (optional)</FieldLabel>
        <input
          style={inputStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Internal label"
        />
      </div>
      <div>
        <FieldLabel>Panel order (1–{MAX_WINDOWS})</FieldLabel>
        <input
          style={inputStyle}
          type="number"
          min={1}
          max={MAX_WINDOWS}
          value={slideOrder}
          onChange={(e) => setSlideOrder(e.target.value)}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Show on profile Windows panel
      </label>
      {error ? (
        <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }} data-testid="owner-profile-window-error">
          {error}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="submit"
          disabled={busy}
          data-testid="owner-profile-window-save"
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            background: OWNER_COLORS.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {busy ? "Saving…" : "Save Windows photo"}
        </button>
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function OwnerProfileBillboardsPanel({ restaurantId }) {
  const [billboards, setBillboards] = useState([]);
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [splashEditor, setSplashEditor] = useState(null);
  const [windowEditor, setWindowEditor] = useState(null);
  const [pausingId, setPausingId] = useState(null);

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setBillboards([]);
      setWindows([]);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [billboardRes, windowRes] = await Promise.all([
        listOwnerRestaurantBillboards(restaurantId),
        listOwnerRestaurantWindows(restaurantId),
      ]);
      setBillboards(Array.isArray(billboardRes?.billboards) ? billboardRes.billboards : []);
      setWindows(Array.isArray(windowRes?.windows) ? windowRes.windows : []);
    } catch (err) {
      setLoadError(err?.message || "Could not load billboards.");
      setBillboards([]);
      setWindows([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    setSplashEditor(null);
    setWindowEditor(null);
    reload();
  }, [reload]);

  async function handlePauseBillboard(postId) {
    if (!restaurantId || !postId) return;
    setPausingId(`splash-${postId}`);
    try {
      await pauseOwnerRestaurantBillboard(restaurantId, postId);
      await reload();
    } catch (err) {
      setLoadError(err?.message || "Could not pause billboard.");
    } finally {
      setPausingId(null);
    }
  }

  async function handlePauseWindow(postId) {
    if (!restaurantId || !postId) return;
    setPausingId(`window-${postId}`);
    try {
      await pauseOwnerRestaurantWindow(restaurantId, postId);
      await reload();
    } catch (err) {
      setLoadError(err?.message || "Could not pause Windows photo.");
    } finally {
      setPausingId(null);
    }
  }

  if (!restaurantId) return null;

  return (
    <PageCard style={{ padding: 22, marginBottom: 18 }} data-testid="owner-profile-manager-billboards">
      <div style={{ fontSize: 14, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 6 }}>
        Billboards &amp; Windows photos
      </div>
      <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 14, lineHeight: 1.45 }}>
        Upload graphics for the public profile entrance splash (up to {MAX_SPLASH} active) and the
        profile Windows panel (up to {MAX_WINDOWS} active). Saves here publish immediately — no need
        to click Save profile above.
      </div>

      {loadError ? (
        <div style={{ fontSize: 12, color: "#b91c1c", marginBottom: 12, fontWeight: 600 }}>{loadError}</div>
      ) : null}
      {loading ? <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 12 }}>Loading…</div> : null}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 8 }}>
          Entrance splash billboards
        </div>
        {splashEditor === "new" ? (
          <SplashBillboardEditor
            restaurantId={restaurantId}
            onCancel={() => setSplashEditor(null)}
            onSaved={() => {
              setSplashEditor(null);
              reload();
            }}
          />
        ) : typeof splashEditor === "object" && splashEditor?.id ? (
          <SplashBillboardEditor
            restaurantId={restaurantId}
            initial={splashEditor}
            onCancel={() => setSplashEditor(null)}
            onSaved={() => {
              setSplashEditor(null);
              reload();
            }}
          />
        ) : (
          <>
            <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
              {billboards.length === 0 ? (
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>No billboards yet.</div>
              ) : (
                billboards.map((post) => (
                  <div
                    key={post.id}
                    data-testid={`owner-profile-billboard-row-${post.id}`}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                    }}
                  >
                    {post.image_url ? (
                      <img
                        src={resolveBillboardMediaUrl(post.image_url)}
                        alt=""
                        style={{
                          width: 56,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>
                        {post.title || "Billboard"}
                      </div>
                      <div style={{ fontSize: 11, color: OWNER_COLORS.muted }}>
                        {statusLabel(post)} · slide {(Number(post.display_order) || 0) + 1}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSplashEditor(post)}
                      data-testid={`owner-profile-billboard-edit-${post.id}`}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: `1px solid ${OWNER_COLORS.line}`,
                        background: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Edit
                    </button>
                    {isActivePost(post) ? (
                      <button
                        type="button"
                        onClick={() => handlePauseBillboard(post.id)}
                        disabled={pausingId === `splash-${post.id}`}
                        data-testid={`owner-profile-billboard-pause-${post.id}`}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid #fecaca",
                          background: "#fff",
                          color: "#b91c1c",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Pause
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setSplashEditor("new")}
              data-testid="owner-profile-billboard-add"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: OWNER_COLORS.accent,
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Add entrance billboard
            </button>
          </>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: OWNER_COLORS.ink, marginBottom: 8 }}>
          Windows panel photos
        </div>
        {windowEditor === "new" ? (
          <WindowPhotoEditor
            restaurantId={restaurantId}
            onCancel={() => setWindowEditor(null)}
            onSaved={() => {
              setWindowEditor(null);
              reload();
            }}
          />
        ) : typeof windowEditor === "object" && windowEditor?.id ? (
          <WindowPhotoEditor
            restaurantId={restaurantId}
            initial={windowEditor}
            onCancel={() => setWindowEditor(null)}
            onSaved={() => {
              setWindowEditor(null);
              reload();
            }}
          />
        ) : (
          <>
            <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
              {windows.length === 0 ? (
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>No Windows photos yet.</div>
              ) : (
                windows.map((post) => (
                  <div
                    key={post.id}
                    data-testid={`owner-profile-window-row-${post.id}`}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                    }}
                  >
                    {post.image_url ? (
                      <img
                        src={resolveBillboardMediaUrl(post.image_url)}
                        alt=""
                        style={{
                          width: 48,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: 6,
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>
                        {post.title || "Window"}
                      </div>
                      <div style={{ fontSize: 11, color: OWNER_COLORS.muted }}>
                        {statusLabel(post)} · panel {(Number(post.display_order) || 0) + 1}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWindowEditor(post)}
                      data-testid={`owner-profile-window-edit-${post.id}`}
                    >
                      Edit
                    </button>
                    {isActivePost(post) ? (
                      <button
                        type="button"
                        onClick={() => handlePauseWindow(post.id)}
                        disabled={pausingId === `window-${post.id}`}
                        data-testid={`owner-profile-window-pause-${post.id}`}
                      >
                        Pause
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setWindowEditor("new")}
              data-testid="owner-profile-window-add"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Add Windows photo
            </button>
          </>
        )}
      </div>
    </PageCard>
  );
}
