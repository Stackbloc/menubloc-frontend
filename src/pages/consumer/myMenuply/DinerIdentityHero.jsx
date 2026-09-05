import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileMediaGallery from "./ProfileMediaGallery.jsx";
import AvatarComposeSheet from "./AvatarComposeSheet.jsx";
import * as s from "./myMenuplyStyles.js";
import { GREEN_BRIGHT } from "./myMenuplyStyles.js";
import { MY_MENUPLY_MONTH_IN_FOOD_PATH } from "../../../lib/myMenuplyRoutes.js";
import { buildDinerPersonalContextLines } from "../../../lib/dinerPersonalContext.js";
import DinerPersonalContextEditor from "./DinerPersonalContextEditor.jsx";
import { FlashVideosDisplay } from "./FlashVideosBlock.jsx";
import {
  ALL_FAVORITE_FOOD_OPTIONS,
  MAX_FAVORITES,
  normalizeFavoriteFoods,
  summarizeFavoriteFoods,
} from "../../../lib/dinerFavoriteFoods.js";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";

const ABOUT_MAX = 280;
const ABOUT_PLACEHOLDER =
  "LA food explorer. Always looking for great tacos and late-night spots.";

function DinerProfileBasics({
  readOnly,
  dateOfBirth,
  favoriteFoods,
  busy,
  onSaveBasics,
}) {
  const [dob, setDob] = useState(dateOfBirth || "");
  const [favorites, setFavorites] = useState(() => normalizeFavoriteFoods(favoriteFoods));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setDob(dateOfBirth || "");
  }, [dateOfBirth]);

  useEffect(() => {
    setFavorites(normalizeFavoriteFoods(favoriteFoods));
  }, [favoriteFoods]);

  const summary = summarizeFavoriteFoods(favorites);

  function toggleFavorite(opt) {
    setFavorites((prev) => {
      const list = [...prev];
      const idx = list.findIndex((f) => f.key === opt.key);
      if (idx >= 0) {
        list.splice(idx, 1);
        return list;
      }
      if (list.length >= MAX_FAVORITES) return list;
      return [...list, { key: opt.key, label: opt.label, kind: opt.kind }];
    });
  }

  async function save() {
    if (typeof onSaveBasics !== "function") return;
    setSaving(true);
    setErr("");
    setStatus("");
    try {
      await onSaveBasics({
        date_of_birth: dob || null,
        favorite_foods: favorites,
      });
      setStatus("Saved");
    } catch (e) {
      setErr(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (readOnly) {
    if (!summary || summary === "None selected") return null;
    return (
      <div style={basics.wrap} data-testid="diner-profile-basics-readonly">
        <p style={basics.label}>Favorite foods</p>
        <p style={basics.summary}>{summary}</p>
      </div>
    );
  }

  return (
    <div style={basics.wrap} data-testid="diner-profile-basics">
      <p style={basics.label}>Date of birth</p>
      <p style={basics.hint}>
        Optional. Unlocks birthday moments later — full date stays private on your account.
      </p>
      <input
        type="date"
        data-testid="diner-dob-input"
        value={dob || ""}
        disabled={busy || saving}
        onChange={(e) => setDob(e.target.value)}
        style={basics.input}
      />

      <p style={{ ...basics.label, marginTop: 14 }}>Favorite foods</p>
      <p style={basics.hint}>
        Tap foods you love — better nearby discovery, not a preference database for its own sake.
      </p>
      <div style={basics.chipRow} data-testid="diner-favorite-foods">
        {ALL_FAVORITE_FOOD_OPTIONS.map((opt) => {
          const on = favorites.some((f) => f.key === opt.key);
          return (
            <button
              key={opt.key}
              type="button"
              data-testid={`diner-fav-${opt.key}`}
              disabled={busy || saving}
              aria-pressed={on}
              onClick={() => toggleFavorite(opt)}
              style={{
                ...basics.chip,
                ...(on ? basics.chipOn : null),
              }}
            >
              {labelWithFoodIcon(opt.label, opt.key)}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        data-testid="diner-profile-basics-save"
        style={basics.save}
        disabled={busy || saving}
        onClick={save}
      >
        {saving ? "Saving…" : "Save birthday & favorites"}
      </button>
      {err ? <p style={s.error}>{err}</p> : null}
      {status ? <p style={{ ...s.muted, color: "#027A48" }}>{status}</p> : null}
    </div>
  );
}

const basics = {
  wrap: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #e4e7ec",
  },
  label: {
    margin: "0 0 4px",
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
  },
  hint: {
    margin: "0 0 8px",
    fontSize: 12,
    lineHeight: 1.4,
    color: "#667085",
  },
  summary: {
    margin: 0,
    fontSize: 14,
    color: "#344054",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    maxWidth: 220,
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid #d0d5dd",
    padding: "8px 10px",
    fontSize: 14,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    appearance: "none",
    border: "1px solid #d0d5dd",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 600,
    color: "#344054",
    cursor: "pointer",
  },
  chipOn: {
    borderColor: "#16a34a",
    background: "#ecfdf3",
    color: "#166534",
  },
  save: {
    appearance: "none",
    border: "none",
    borderRadius: 10,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    padding: "8px 12px",
    cursor: "pointer",
  },
};

export default function DinerIdentityHero({
  displayName,
  avatarUrl,
  about,
  personalContext = null,
  locationLabel = null,
  connections = [],
  viewerUserId = null,
  busy,
  notice,
  error,
  onAvatarFile,
  onAboutSave,
  onPersonalContextSave,
  flashVideos = [],
  flashBusy = false,
  flashError = "",
  onFlashVideoAdd,
  onFlashVideoRemove,
  profileMedia = [],
  onProfileMediaAdd,
  onProfileMediaRemove,
  readOnly = false,
  monthInFoodHref = null,
  dateOfBirth = "",
  favoriteFoods = [],
  onSaveProfileBasics,
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
    monthInFoodHref || (readOnly ? null : MY_MENUPLY_MONTH_IN_FOOD_PATH);

  const personalContextLines = buildDinerPersonalContextLines(personalContext || {});

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

          {personalContextLines.length ? (
            <div data-testid="diner-personal-context">
              {personalContextLines.map((line) => (
                <p key={line} style={s.personalContextLine}>
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          <FlashVideosDisplay
            items={flashVideos}
            readOnly={readOnly}
            busy={busy || flashBusy}
            onRemove={readOnly ? undefined : onFlashVideoRemove}
          />

          {!readOnly && onPersonalContextSave ? (
            <DinerPersonalContextEditor
              value={personalContext}
              busy={busy || saving}
              onSave={onPersonalContextSave}
              flashVideos={flashVideos}
              flashBusy={flashBusy}
              flashError={flashError}
              onFlashVideoAdd={onFlashVideoAdd}
              onFlashVideoRemove={onFlashVideoRemove}
            />
          ) : null}

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

      {!readOnly || normalizeFavoriteFoods(favoriteFoods).length ? (
        <DinerProfileBasics
          readOnly={readOnly}
          dateOfBirth={dateOfBirth}
          favoriteFoods={favoriteFoods}
          busy={busy}
          onSaveBasics={onSaveProfileBasics}
        />
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
