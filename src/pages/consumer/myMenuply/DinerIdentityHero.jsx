import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AvatarComposeSheet from "./AvatarComposeSheet.jsx";
import * as s from "./myMenuplyStyles.js";
import { MY_MENUPLY_MONTH_IN_FOOD_PATH } from "../../../lib/myMenuplyRoutes.js";
import { buildDinerPersonalContextLines } from "../../../lib/dinerPersonalContext.js";
import DinerPersonalContextEditor from "./DinerPersonalContextEditor.jsx";
import SectionHeader, { PROFILE_SECTION_HEADERS } from "./SectionHeader.jsx";
import { FlashVideosDisplay } from "./FlashVideosBlock.jsx";
import { normalizeFavoriteFoods } from "../../../lib/dinerFavoriteFoods.js";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";
import {
  formatEduSchoolAffiliation,
  getEduVerificationFromConsumer,
} from "../../../lib/eduVerificationDisplay.js";
import { clearStuckMediaChrome } from "./pendingHighlightMedia.js";
import CatchMePanel from "./CatchMePanel.jsx";
import { catchMeProfileLine } from "../../../lib/dinerCatchMeDisplay.js";
import CurrentVibeAvatarControl from "./CurrentVibeAvatarControl.jsx";
import CurrentVibeProfileSection from "./CurrentVibeProfileSection.jsx";
import { DEFAULT_CURRENT_VIBE } from "../../../lib/currentVibeDisplay.js";

const ABOUT_MAX = 280;
const ABOUT_PLACEHOLDER =
  "LA food explorer. Always looking for great tacos and late-night spots.";

function FavoriteFoodsReadonly({ favoriteFoods }) {
  const favorites = normalizeFavoriteFoods(favoriteFoods);
  if (!favorites.length) return null;
  return (
    <div style={{ marginTop: 12 }} data-testid="diner-favorite-foods-display">
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "#667085",
        }}
      >
        Favorite foods
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {favorites.map((f) => (
          <span
            key={f.key}
            data-testid={`diner-fav-shown-${f.key}`}
            style={{
              display: "inline-flex",
              borderRadius: 999,
              padding: "5px 10px",
              fontSize: 13,
              fontWeight: 600,
              color: "#166534",
              background: "#ecfdf3",
              border: "1px solid #bbf7d0",
            }}
          >
            {labelWithFoodIcon(f.key, f.label)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DinerIdentityHero({
  displayName,
  avatarUrl,
  about,
  personalContext = null,
  locationLabel = null,
  catchMe = null,
  onCatchMeSave = null,
  onCatchMeClear = null,
  currentVibe = DEFAULT_CURRENT_VIBE,
  currentVibeCatalog = null,
  onCurrentVibeChange = null,
  busy,
  notice,
  error,
  onAvatarFile,
  onAboutSave,
  onSaveProfileSettings,
  flashVideos = [],
  flashBusy = false,
  onFlashVideoRemove,
  readOnly = false,
  monthInFoodHref = null,
  dateOfBirth = "",
  dinerSex = "",
  favoriteFoods = [],
  eduConsumer = null,
  /** When false, defer Flash Video + gallery below activity signals. */
  showRichMedia = true,
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
  const edu = getEduVerificationFromConsumer(eduConsumer);
  const schoolAffiliation =
    edu.school_affiliation ||
    formatEduSchoolAffiliation({
      institutionShort: edu.institution_short || eduConsumer?.edu_institution_short,
      institutionName: edu.institution_name || eduConsumer?.edu_institution_name,
      edu_verified: eduConsumer?.edu_verified === true || edu.edu_verified === true,
    });

  return (
    <section style={s.identitySection} data-testid="about-me">
      <SectionHeader
        {...PROFILE_SECTION_HEADERS.about}
        testId="about-me-section-header"
        aside={
          scoreboardHref ? (
            <Link
              to={scoreboardHref}
              data-testid="month-in-food-link"
              title="My Month in Food"
              aria-label="My Month in Food"
              style={s.monthInFoodIconLink}
              onClick={() => clearStuckMediaChrome()}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.75" />
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
          ) : null
        }
      />

      {readOnly ? null : (
        <p style={s.sectionDesc}>Tell people a little about you.</p>
      )}

      <div style={s.identity}>
        {readOnly ? (
          <div style={s.identityAvatarWrap} data-testid="diner-avatar-readonly">
            <div style={{ ...s.identityPhotoBtn, cursor: "default", overflow: "hidden" }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={s.identityPhoto} />
              ) : (
                <div style={s.identityInitial}>{initial}</div>
              )}
            </div>
            <CurrentVibeAvatarControl
              value={currentVibe}
              catalog={currentVibeCatalog}
              readOnly
              busy={busy}
            />
          </div>
        ) : (
          <div style={s.identityAvatarWrap} data-testid="diner-avatar-owner-wrap">
            <button
              type="button"
              style={{ ...s.identityPhotoBtn, overflow: "hidden" }}
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
              <span style={{ ...s.identityCamera, right: "auto", left: 4 }} aria-hidden>
                📷
              </span>
            </button>
            <CurrentVibeAvatarControl
              value={currentVibe}
              catalog={currentVibeCatalog}
              readOnly={false}
              busy={busy}
              onChange={onCurrentVibeChange}
            />

            <AvatarComposeSheet
              open={avatarSheetOpen}
              onClose={closeAvatarSheet}
              mediaSource={avatarMediaSource}
              onMediaSourceChange={setAvatarMediaSource}
              busy={busy}
              onFile={handleAvatarFile}
            />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.identityName}>{displayName}</div>

          {schoolAffiliation ? (
            <p
              style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}
              data-testid="diner-school-affiliation"
            >
              {schoolAffiliation}
              <span style={{ fontWeight: 600, color: "#64748b", fontSize: 12 }}> · .edu</span>
            </p>
          ) : null}

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
            items={showRichMedia ? flashVideos : []}
            readOnly={readOnly}
            busy={busy || flashBusy}
            onRemove={readOnly || !showRichMedia ? undefined : onFlashVideoRemove}
          />

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
            catchMeProfileLine(catchMe) ? (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 14,
                  color: "#475467",
                  fontWeight: 600,
                }}
                data-testid="diner-catch-me-profile"
              >
                ✈️ {catchMeProfileLine(catchMe)}
              </p>
            ) : null
          ) : (
            <CatchMePanel
              catchMe={catchMe}
              busy={busy}
              onSave={onCatchMeSave}
              onClear={onCatchMeClear}
            />
          )}

          {readOnly ? (
            String(about || "").trim() ? (
              <p style={{ ...s.aboutArea, minHeight: 0 }} data-testid="diner-about-readonly">
                {String(about).trim()}
              </p>
            ) : null
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
                onChange={(e) => setDraft(e.target.value.slice(0, ABOUT_MAX))}
                onBlur={saveAbout}
                aria-label="About"
              />
              <p style={s.aboutCount}>
                {draft.length}/{ABOUT_MAX}
              </p>
            </>
          )}

          {readOnly ? (
            <>
              <FavoriteFoodsReadonly favoriteFoods={favoriteFoods} />
              <CurrentVibeProfileSection
                value={currentVibe}
                catalog={currentVibeCatalog}
                readOnly
                busy={false}
                onChange={null}
              />
            </>
          ) : onSaveProfileSettings ? (
            <DinerPersonalContextEditor
              value={personalContext}
              dateOfBirth={dateOfBirth}
              dinerSex={dinerSex}
              favoriteFoods={favoriteFoods}
              busy={busy || saving}
              onSave={onSaveProfileSettings}
              afterFavorites={
                <CurrentVibeProfileSection
                  value={currentVibe}
                  catalog={currentVibeCatalog}
                  readOnly={typeof onCurrentVibeChange !== "function"}
                  busy={busy}
                  onChange={onCurrentVibeChange}
                />
              }
            />
          ) : (
            <CurrentVibeProfileSection
              value={currentVibe}
              catalog={currentVibeCatalog}
              readOnly={typeof onCurrentVibeChange !== "function"}
              busy={busy}
              onChange={onCurrentVibeChange}
            />
          )}
        </div>
      </div>

      {error ? <p style={s.error}>{error}</p> : null}

      {notice ? (
        <p style={{ ...s.muted, color: "#027A48", marginBottom: 10 }}>{notice}</p>
      ) : null}
    </section>
  );
}
