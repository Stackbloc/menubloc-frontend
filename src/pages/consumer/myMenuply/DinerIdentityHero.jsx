import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ConsumerCameraSheet from "../../../components/consumer/ConsumerCameraSheet.jsx";
import { inlineCameraSupported, preferInlineCamera } from "../../../lib/consumerCameraCapture.js";
import ProfileMediaGallery from "./ProfileMediaGallery.jsx";
import * as s from "./myMenuplyStyles.js";

const ABOUT_MAX = 280;
const ABOUT_PLACEHOLDER = "LA food explorer. Always looking for great tacos and late-night spots.";

export default function DinerIdentityHero({
  displayName,
  avatarUrl,
  about,
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
}) {
  const fileRef = useRef(null);
  const [draft, setDraft] = useState(about || "");
  const [saving, setSaving] = useState(false);
  const [avatarCameraOpen, setAvatarCameraOpen] = useState(false);

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

  const initial = String(displayName || "You").trim().slice(0, 1).toUpperCase() || "Y";

  function openAvatarPicker() {
    if (busy) return;
    if (inlineCameraSupported() && preferInlineCamera()) {
      setAvatarCameraOpen(true);
      return;
    }
    fileRef.current?.click();
  }

  return (
    <section style={s.section} data-testid="about-me">
      <p style={s.kicker}>Diner profile</p>
      <h2 style={s.sectionTitle}>About Me</h2>
      {readOnly ? null : <p style={s.sectionDesc}>Tell people a little about you.</p>}

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
          <button
            type="button"
            style={s.identityPhotoBtn}
            aria-label="Change profile photo"
            disabled={busy}
            onClick={openAvatarPicker}
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
        )}
        {readOnly ? null : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture=""
              style={{ display: "none" }}
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onAvatarFile(file);
              }}
            />
            <ConsumerCameraSheet
              open={avatarCameraOpen}
              mode="photo"
              facingMode="user"
              onClose={() => setAvatarCameraOpen(false)}
              onCapture={(file) => {
                setAvatarCameraOpen(false);
                if (file) onAvatarFile(file);
              }}
            />
          </>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.identityName}>{displayName}</div>
          {readOnly ? (
            <p style={{ ...s.aboutArea, minHeight: 0 }}>{String(about || "").trim() || "No about yet."}</p>
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
              <p style={s.aboutCount}>{draft.length}/{ABOUT_MAX}</p>
            </>
          )}
        </div>
      </div>

      {error ? <p style={s.error}>{error}</p> : null}
      {notice ? <p style={{ ...s.muted, color: "#027A48", marginBottom: 10 }}>{notice}</p> : null}

      <ProfileMediaGallery
        items={profileMedia}
        readOnly={readOnly}
        busy={busy}
        onAddFile={onProfileMediaAdd}
        onRemove={onProfileMediaRemove}
      />

      <div style={{ marginTop: 16 }} data-testid="about-me-connections">
        <h3 style={s.sectionTitle}>
          {readOnly ? (
            "My Connections"
          ) : (
            <Link to="/my-menuply/connections-eating" style={s.sectionTitleLink}>
              My Connections
            </Link>
          )}
        </h3>
        {connections.length === 0 ? (
          <p style={s.muted}>No connections yet.</p>
        ) : (
          <div style={s.nameList}>
            {connections.slice(0, 12).map((c) => {
              const peerId = c.peer?.id;
              const name = c.peer?.display_name || "Connection";
              if (!peerId) return null;
              const isSelf = viewerUserId != null && Number(peerId) === Number(viewerUserId);
              return (
                <Link
                  key={c.id || peerId}
                  to={isSelf ? "/my-menuply" : `/account/connections/${encodeURIComponent(String(peerId))}`}
                  style={s.nameLink}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
