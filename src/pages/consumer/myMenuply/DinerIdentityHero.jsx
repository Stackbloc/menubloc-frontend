import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileMediaGallery from "./ProfileMediaGallery.jsx";
import AvatarComposeSheet from "./AvatarComposeSheet.jsx";
import * as s from "./myMenuplyStyles.js";
import { GREEN_BRIGHT } from "./myMenuplyStyles.js";

const ABOUT_MAX = 280;
const ABOUT_PLACEHOLDER =
  "LA food explorer. Always looking for great tacos and late-night spots.";

export default function DinerIdentityHero({
  displayName,
  avatarUrl,
  about,
  locationLabel = null,
  connections = [],
  viewerUserId = null,
  busy,
  notice,
  error,
  onAvatarFile,
  onAboutSave,
  profileMedia = [],
  onProfileMediaAdd,
  onProfileMediaRemove,
  readOnly = false,
  monthInFoodHref = null,
}) {
  const [draft, setDraft] = useState(about || "");
  const [saving, setSaving] = useState(false);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [avatarMediaSource, setAvatarMediaSource] = useState(null);

  useEffect(() => {
    setDraft(about || "");
  }, [about]);

  async function saveAbout() {
    const next = String(draft || "").trim().slice(0, ABOUT_MAX);

    if (next === String(about || "").trim()) return;

    setSaving(true);

    try {
      await onAboutSave(next);
    } finally {
      setSaving(false);
    }
  }

  function openAvatarSheet() {
    if (busy || readOnly) return;
    setAvatarMediaSource(null);
    setAvatarSheetOpen(true);
  }

  function closeAvatarSheet() {
    setAvatarSheetOpen(false);
    setAvatarMediaSource(null);
  }

  function handleAvatarFile(file) {
    closeAvatarSheet();
    if (file) onAvatarFile?.(file);
  }

  const initial =
    String(displayName || "You").trim().slice(0, 1).toUpperCase() || "Y";

  const scoreboardHref =
    monthInFoodHref || (readOnly ? null : "/my-menuply/month-in-food");

  return (
    <section style={s.identitySection} data-testid="about-me">
      <p style={{ ...s.kicker, color: GREEN_BRIGHT, marginBottom: 6 }}>
        Diner profile
      </p>

      <div style={s.aboutTitleRow}>
        <h2 style={{ ...s.sectionTitle, margin: 0 }}>About Me</h2>

        {scoreboardHref ? (
          <Link
            to={scoreboardHref}
            data-testid="month-in-food-link"
            title="My Month in Food"
            aria-label="My Month in Food"
            style={s.monthInFoodIconLink}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M3 9.5h18"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M8 3.5v3.5M16 3.5v3.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <circle cx="9" cy="14" r="1.15" fill="currentColor" />
              <circle cx="12.5" cy="14" r="1.15" fill="currentColor" />
              <circle cx="16" cy="14" r="1.15" fill="currentColor" />
              <circle cx="9" cy="17.5" r="1.15" fill="currentColor" />
              <circle cx="12.5" cy="17.5" r="1.15" fill="currentColor" />
            </svg>
          </Link>
        ) : null}
      </div>

      {readOnly ? null : (
        <p style={s.sectionDesc}>Tell people a little about you.</p>
      )}

      <div style={s.identity}>
        {readOnly ? (
          <div style={{ ...s.identityPhotoBtn, cursor: "default" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={s.identityPhoto} />
            ) : (
              <div style={s.identityInitial}>{initial}</div>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              style={s.identityPhotoBtn}
              aria-label="Change profile photo"
              disabled={busy}
              onClick={openAvatarSheet}
              data-testid="diner-avatar-picker"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={s.identityPhoto} />
              ) : (
                <div style={s.identityInitial}>{initial}</div>
              )}

              <span style={s.identityCamera} aria-hidden>
                📷
              </span>
            </button>

            <AvatarComposeSheet
              open={avatarSheetOpen}
              onClose={closeAvatarSheet}
              mediaSource={avatarMediaSource}
              onMediaSourceChange={setAvatarMediaSource}
              busy={busy}
              onFile={handleAvatarFile}
            />
          </>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.identityName}>{displayName}</div>

          {locationLabel ? (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: "#475467",
                fontWeight: 600,
              }}
            >
              📍 {locationLabel}
            </p>
          ) : null}

          {readOnly ? (
            <p style={{ ...s.aboutArea, minHeight: 0 }}>
              {String(about || "").trim() || "No about yet."}
            </p>
          ) : (
            <>
              <textarea
                data-testid="diner-about-input"
                style={s.aboutArea}
                maxLength={ABOUT_MAX}
                rows={3}
                value={draft}
                placeholder={ABOUT_PLACEHOLDER}
                disabled={busy || saving}
                onChange={(e) =>
                  setDraft(e.target.value.slice(0, ABOUT_MAX))
                }
                onBlur={saveAbout}
                aria-label="About"
              />

              <p style={s.aboutCount}>
                {draft.length}/{ABOUT_MAX}
              </p>
            </>
          )}
        </div>
      </div>

      {error ? <p style={s.error}>{error}</p> : null}

      {notice ? (
        <p
          style={{
            ...s.muted,
            color: "#027A48",
            marginBottom: 10,
          }}
        >
          {notice}
        </p>
      ) : null}

      <ProfileMediaGallery
        items={profileMedia}
        readOnly={readOnly}
        busy={busy}
        onAddFile={onProfileMediaAdd}
        onRemove={onProfileMediaRemove}
      />
    </section>
  );
}
