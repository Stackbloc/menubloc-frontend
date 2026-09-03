/**
 * ============================================================
 * DinerProfilePage.jsx
 * Path: menubloc-frontend/src/pages/consumer/DinerProfilePage.jsx
 *
 * Public-facing diner profile with:
 *   - Profile header (name, avatar)
 *   - @home section — photo grid of home-cooked dishes
 *   - About Me section — Flash Video personality clips
 *
 * Route: /diners/:userId
 *
 * The logged-in diner sees add/delete controls on their own profile.
 * Visitors see the public-visible content only (visibility enforced
 * server-side for homemade dishes; flash videos are always public).
 * ============================================================
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import {
  getHomeDishesForUser,
  uploadHomeDishPhoto,
  createHomeDish,
  deleteHomeDish,
  getPublicFlashVideos,
  uploadProfileMedia,
  deleteProfileMedia,
} from "../../lib/consumerApi.js";

// ── Helpers ───────────────────────────────────────────────────────────────

const API = (
  typeof import.meta !== "undefined"
    ? import.meta.env?.VITE_API_BASE_URL
    : undefined
) || "http://localhost:3001";

function buildApiUrl(path) {
  return `${API.replace(/\/$/, "")}${path}`;
}

async function fetchPublicProfile(userId) {
  // We infer display name from the homemade dishes response (creator_display_name
  // and creator_avatar_url) rather than requiring a separate profile endpoint.
  // This avoids an unnecessary round-trip when dishes are already fetched.
  const res = await fetch(
    buildApiUrl(
      `/api/consumer/homemade-dishes/users/${encodeURIComponent(String(userId))}`
    ),
    { credentials: "include" }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data;
}

// ── Sub-components ────────────────────────────────────────────────────────

function Avatar({ src, name, size = 72 }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        style={{ ...styles.avatar, width: size, height: size }}
      />
    );
  }
  return (
    <div
      style={{
        ...styles.avatarFallback,
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

// Single @home photo cell in the grid.
function HomeDishCell({ dish, isSelf, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(dish.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <div style={styles.dishCell}>
        {dish.photo_url ? (
          <img
            src={dish.photo_url}
            alt={dish.name || "Home dish"}
            style={styles.dishCellImg}
            loading="lazy"
            onClick={() => setLightboxOpen(true)}
          />
        ) : (
          <div style={styles.dishCellPlaceholder}>
            <span style={{ fontSize: 28 }}>🍽️</span>
            <span style={styles.dishCellName}>{dish.name}</span>
          </div>
        )}
        {dish.name && dish.photo_url ? (
          <div style={styles.dishCellCaption}>{dish.name}</div>
        ) : null}
        {isSelf ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              ...styles.dishDeleteBtn,
              ...(confirmDelete ? styles.dishDeleteBtnConfirm : {}),
            }}
            aria-label="Delete photo"
          >
            {deleting ? "…" : confirmDelete ? "Tap again to delete" : "✕"}
          </button>
        ) : null}
      </div>

      {/* Lightbox */}
      {lightboxOpen && dish.photo_url ? (
        <div
          style={styles.lightboxOverlay}
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={dish.photo_url}
            alt={dish.name || "Home dish"}
            style={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}

// @home photo upload button cell.
function AddHomeDishCell({ onAdd, uploading }) {
  const inputRef = useRef(null);
  return (
    <div
      style={{ ...styles.dishCell, ...styles.addDishCell }}
      onClick={() => !uploading && inputRef.current?.click()}
      title="Add home-cooked dish"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAdd(file);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <span style={styles.addDishLabel}>Uploading…</span>
      ) : (
        <>
          <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
          <span style={styles.addDishLabel}>Add photo</span>
        </>
      )}
    </div>
  );
}

// Flash Video item — displays a video thumbnail/player with controls.
function FlashVideoItem({ item, isSelf, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const videoRef = useRef(null);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function handlePlay() {
    setPlaying(true);
    videoRef.current?.play();
  }

  return (
    <div style={styles.flashVideoItem}>
      <div style={styles.flashVideoPlayerWrap}>
        {/* Native video player — tap to play */}
        <video
          ref={videoRef}
          src={item.media_url}
          controls
          playsInline
          style={styles.flashVideoPlayer}
          preload="metadata"
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {!playing ? (
          <div style={styles.flashVideoPlayBtn} onClick={handlePlay}>
            ▶
          </div>
        ) : null}
      </div>
      <div style={styles.flashVideoMeta}>
        <span style={styles.flashVideoLabel}>Flash Video</span>
        <span style={styles.flashVideoDate}>
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : ""}
        </span>
      </div>
      {isSelf ? (
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            ...styles.flashDeleteBtn,
            ...(confirmDelete ? styles.flashDeleteBtnConfirm : {}),
          }}
        >
          {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete"}
        </button>
      ) : null}
    </div>
  );
}

// Flash Video upload button.
function AddFlashVideoCell({ onAdd, uploading }) {
  const inputRef = useRef(null);
  return (
    <div style={styles.addFlashVideoWrap}>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAdd(file);
          e.target.value = "";
        }}
      />
      <button
        style={{
          ...styles.addFlashBtn,
          ...(uploading ? styles.addFlashBtnDisabled : {}),
        }}
        disabled={uploading}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "+ Add Flash Video"}
      </button>
      <p style={styles.addFlashHint}>
        Short video — thoughts, food opinions, anything you.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function DinerProfilePage() {
  const { userId } = useParams();
  const { consumer, isAuthenticated } = useConsumer();
  const isSelf = isAuthenticated && String(consumer?.id) === String(userId);

  // Profile identity (inferred from first homemade dish or flash video)
  const [profileName, setProfileName] = useState(null);
  const [profileAvatar, setProfileAvatar] = useState(null);

  // @home state
  const [dishes, setDishes] = useState([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [dishesError, setDishesError] = useState(null);
  const [dishUploading, setDishUploading] = useState(false);

  // Flash Video state
  const [flashVideos, setFlashVideos] = useState([]);
  const [flashLoading, setFlashLoading] = useState(true);
  const [flashError, setFlashError] = useState(null);
  const [flashUploading, setFlashUploading] = useState(false);
  const [flashUploadError, setFlashUploadError] = useState(null);

  const [dishUploadError, setDishUploadError] = useState(null);

  // Load @home dishes
  const loadDishes = useCallback(async () => {
    setDishesLoading(true);
    setDishesError(null);
    try {
      const data = await getHomeDishesForUser(userId);
      setDishes(data?.dishes || []);
      // Infer profile identity from first dish's creator fields.
      if (!profileName && data?.dishes?.length) {
        setProfileName(data.dishes[0].creator_display_name || null);
        setProfileAvatar(data.dishes[0].creator_avatar_url || null);
      }
    } catch (err) {
      setDishesError(err.message || "Could not load dishes");
    } finally {
      setDishesLoading(false);
    }
  }, [userId, profileName]);

  // Load Flash Videos
  const loadFlashVideos = useCallback(async () => {
    setFlashLoading(true);
    setFlashError(null);
    try {
      const data = await getPublicFlashVideos(userId);
      setFlashVideos(data?.items || []);
    } catch (err) {
      setFlashError(err.message || "Could not load Flash Videos");
    } finally {
      setFlashLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadDishes();
    loadFlashVideos();
  }, [userId, loadDishes, loadFlashVideos]);

  // Add @home dish photo
  async function handleAddDish(file) {
    setDishUploading(true);
    setDishUploadError(null);
    try {
      // 1. Upload photo → get URL
      const uploadResult = await uploadHomeDishPhoto(file);
      const photoUrl = uploadResult?.photo_url || uploadResult?.url;
      if (!photoUrl) throw new Error("Upload did not return a photo URL");

      // 2. Create dish entry with the photo
      await createHomeDish({
        name: "Home dish",
        photo_url: photoUrl,
        visibility: "public",
      });

      // 3. Refresh the list
      await loadDishes();
    } catch (err) {
      setDishUploadError(err.message || "Could not add photo");
    } finally {
      setDishUploading(false);
    }
  }

  // Delete @home dish
  async function handleDeleteDish(dishId) {
    try {
      await deleteHomeDish(dishId);
      setDishes((prev) => prev.filter((d) => d.id !== dishId));
    } catch (err) {
      setDishUploadError(err.message || "Could not delete photo");
    }
  }

  // Add Flash Video
  async function handleAddFlashVideo(file) {
    setFlashUploading(true);
    setFlashUploadError(null);
    try {
      await uploadProfileMedia(file, { media_subtype: "flash_video" });
      await loadFlashVideos();
    } catch (err) {
      setFlashUploadError(err.message || "Could not upload Flash Video");
    } finally {
      setFlashUploading(false);
    }
  }

  // Delete Flash Video
  async function handleDeleteFlashVideo(mediaId) {
    try {
      await deleteProfileMedia(mediaId);
      setFlashVideos((prev) => prev.filter((v) => v.id !== mediaId));
    } catch (err) {
      setFlashUploadError(err.message || "Could not delete Flash Video");
    }
  }

  const displayName = profileName || (isSelf ? consumer?.display_name || "You" : "Diner");

  return (
    <>
      <StickyPageHeader title={isSelf ? "My Profile" : "Profile"} />
      <div style={styles.page}>
        <div style={styles.pageInner}>

          {/* ── Profile header ── */}
          <div style={styles.profileHeader}>
            <Avatar src={profileAvatar} name={displayName} size={76} />
            <div style={styles.profileHeaderInfo}>
              <h1 style={styles.profileName}>{displayName}</h1>
              {isSelf ? (
                <Link to="/account" style={styles.editProfileLink}>
                  Edit account settings
                </Link>
              ) : null}
            </div>
          </div>

          {/* ── @home section ── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>@home</h2>
            <p style={styles.sectionSubtitle}>
              {isSelf
                ? "Your home-cooked dishes."
                : `Dishes ${displayName} has made at home.`}
            </p>

            {dishesLoading ? (
              <p style={styles.loadingText}>Loading…</p>
            ) : dishesError ? (
              <p style={styles.errorText}>{dishesError}</p>
            ) : null}

            {!dishesLoading && (
              <div style={styles.dishGrid}>
                {/* Add button — only on own profile */}
                {isSelf ? (
                  <AddHomeDishCell
                    onAdd={handleAddDish}
                    uploading={dishUploading}
                  />
                ) : null}

                {dishes.map((dish) => (
                  <HomeDishCell
                    key={dish.id}
                    dish={dish}
                    isSelf={isSelf}
                    onDelete={handleDeleteDish}
                  />
                ))}

                {/* Empty state */}
                {dishes.length === 0 && !isSelf ? (
                  <p style={styles.emptyText}>
                    No home dishes shared yet.
                  </p>
                ) : null}
              </div>
            )}

            {isSelf && dishes.length === 0 && !dishesLoading ? (
              <p style={styles.ownEmptyHint}>
                Add your first home-cooked dish.
              </p>
            ) : null}

            {dishUploadError ? (
              <p style={styles.errorText}>{dishUploadError}</p>
            ) : null}
          </section>

          {/* ── About Me / Flash Video section ── */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>About Me</h2>

            <div style={styles.flashVideoSection}>
              <h3 style={styles.flashVideoHeading}>Flash Video</h3>
              <p style={styles.flashVideoDesc}>
                {isSelf
                  ? "A quick video about you — food thoughts, opinions, favorite things."
                  : `${displayName}'s Flash Videos.`}
              </p>

              {flashLoading ? (
                <p style={styles.loadingText}>Loading…</p>
              ) : flashError ? (
                <p style={styles.errorText}>{flashError}</p>
              ) : null}

              {!flashLoading && (
                <>
                  {flashVideos.length === 0 && !isSelf ? (
                    <p style={styles.emptyText}>No Flash Videos yet.</p>
                  ) : null}

                  {isSelf && flashVideos.length === 0 ? (
                    <p style={styles.ownEmptyHint}>
                      Say something about food—or just say something.
                    </p>
                  ) : null}

                  <div style={styles.flashVideoList}>
                    {flashVideos.map((item) => (
                      <FlashVideoItem
                        key={item.id}
                        item={item}
                        isSelf={isSelf}
                        onDelete={handleDeleteFlashVideo}
                      />
                    ))}
                  </div>

                  {isSelf ? (
                    <AddFlashVideoCell
                      onAdd={handleAddFlashVideo}
                      uploading={flashUploading}
                    />
                  ) : null}

                  {flashUploadError ? (
                    <p style={{ ...styles.errorText, marginTop: 10 }}>
                      {flashUploadError}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </section>

        </div>
      </div>
      <BottomNav />
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #0B0F0C)",
    fontFamily: "Inter, Arial, sans-serif",
    paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
    color: "#FFFFFF",
  },
  pageInner: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "0 16px 32px",
  },

  // ── Profile header ──
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "24px 0 20px",
    borderBottom: "1px solid #1F2937",
    marginBottom: 28,
  },
  avatar: {
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    background: "#1A2419",
  },
  avatarFallback: {
    borderRadius: "50%",
    background: "#22C55E",
    color: "#0B0F0C",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    letterSpacing: "-0.02em",
  },
  profileHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 800,
    color: "#FFFFFF",
    margin: "0 0 6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  editProfileLink: {
    fontSize: 13,
    fontWeight: 600,
    color: "#22C55E",
    textDecoration: "none",
  },

  // ── Section ──
  section: {
    background: "#121A14",
    borderRadius: 14,
    padding: "24px 20px",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#FFFFFF",
    margin: "0 0 4px",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    margin: 0,
  },
  errorText: {
    fontSize: 13,
    color: "#F87171",
    margin: 0,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    gridColumn: "1/-1",
    margin: 0,
    padding: "12px 0",
  },
  ownEmptyHint: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 8,
  },

  // ── @home dish grid ──
  dishGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 3,
  },
  dishCell: {
    position: "relative",
    aspectRatio: "1",
    borderRadius: 6,
    overflow: "hidden",
    background: "#1A2419",
    cursor: "pointer",
  },
  dishCellImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  dishCellPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dishCellName: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    padding: "0 4px",
    wordBreak: "break-word",
  },
  dishCellCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(0,0,0,0.55)",
    color: "#FFF",
    fontSize: 10,
    fontWeight: 600,
    padding: "4px 6px",
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dishDeleteBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    background: "rgba(0,0,0,0.65)",
    border: "none",
    borderRadius: "50%",
    color: "#FFF",
    fontSize: 11,
    fontWeight: 700,
    width: 22,
    height: 22,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 1,
  },
  dishDeleteBtnConfirm: {
    background: "#DC2626",
    borderRadius: 6,
    width: "auto",
    height: "auto",
    padding: "4px 6px",
    fontSize: 10,
  },
  addDishCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    border: "1.5px dashed #374151",
    cursor: "pointer",
    userSelect: "none",
    color: "#6B7280",
    fontSize: 14,
    fontWeight: 700,
  },
  addDishLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6B7280",
    marginTop: 2,
  },

  // ── Lightbox ──
  lightboxOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImg: {
    maxWidth: "94vw",
    maxHeight: "90vh",
    objectFit: "contain",
    borderRadius: 10,
  },
  lightboxClose: {
    position: "absolute",
    top: 20,
    right: 20,
    background: "rgba(255,255,255,0.12)",
    border: "none",
    borderRadius: "50%",
    color: "#FFF",
    fontSize: 18,
    fontWeight: 700,
    width: 40,
    height: 40,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Flash Video ──
  flashVideoSection: {
    marginTop: 4,
  },
  flashVideoHeading: {
    fontSize: 14,
    fontWeight: 700,
    color: "#D1D5DB",
    margin: "0 0 4px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  flashVideoDesc: {
    fontSize: 13,
    color: "#6B7280",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  flashVideoList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  flashVideoItem: {
    background: "#0B0F0C",
    borderRadius: 12,
    padding: "12px 14px",
    border: "1px solid #1F2937",
  },
  flashVideoPlayerWrap: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    background: "#000",
    marginBottom: 10,
    aspectRatio: "16/9",
  },
  flashVideoPlayer: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  flashVideoPlayBtn: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    background: "rgba(0,0,0,0.18)",
  },
  flashVideoMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  flashVideoLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#22C55E",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  flashVideoDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  flashDeleteBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: "#9CA3AF",
    background: "none",
    border: "1px solid #374151",
    borderRadius: 6,
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  flashDeleteBtnConfirm: {
    color: "#F87171",
    borderColor: "#F87171",
  },
  addFlashVideoWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  addFlashBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 18px",
    borderRadius: 10,
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
  },
  addFlashBtnDisabled: {
    opacity: 0.65,
    cursor: "default",
  },
  addFlashHint: {
    fontSize: 12,
    color: "#6B7280",
    margin: 0,
    lineHeight: 1.5,
  },
};
