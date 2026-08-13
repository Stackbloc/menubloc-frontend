import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ShareModal from "./share/ShareModal.jsx";
import { createEatInvitation } from "../lib/eatInvitationsApi.js";

function tomorrowIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLabel(isoDate) {
  if (!isoDate) return "";
  const raw = String(isoDate).trim();
  const ymd = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  try {
    const d = ymd ? new Date(`${ymd}T12:00:00`) : new Date(raw);
    if (Number.isNaN(d.getTime())) return ymd || raw;
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return ymd || raw;
  }
}

function formatTimeLabel(time) {
  if (!time) return "";
  const parts = String(time).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (!Number.isFinite(h)) return time;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function buildShareText({ organizerName, restaurantName, dateLabel, timeLabel, menuItemName, url }) {
  const who = organizerName || "A Menuply diner";
  const place = restaurantName || "a restaurant";
  const when = [dateLabel, timeLabel].filter(Boolean).join(" at ");
  const dish = menuItemName ? ` and recommends the ${menuItemName}` : "";
  const whenPart = when ? ` ${when}` : "";
  return `${who} invited you to eat at ${place}${whenPart}${dish}. View the invitation: ${url}`;
}

/**
 * Compose Invite to Eat → Invitation Ready → Menuply ShareModal (no SMS blast).
 */
export default function InviteToEatModal({
  open,
  onClose,
  restaurantId,
  restaurantName = "",
  menuItemId = null,
  menuItemName = null,
}) {
  const [date, setDate] = useState(tomorrowIsoDate);
  const [time, setTime] = useState("19:00");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const shareData = useMemo(() => {
    if (!created?.url) return null;
    const dateLabel = formatDateLabel(created.scheduled_date || date);
    const timeLabel = formatTimeLabel(created.scheduled_time || time);
    const dishName = created.menu_item_name || menuItemName || null;
    const place = created.restaurant_name || restaurantName || "a restaurant";
    const text = buildShareText({
      organizerName: created.organizer_display_name,
      restaurantName: place,
      dateLabel,
      timeLabel,
      menuItemName: dishName,
      url: created.url,
    });
    return {
      title: `Invite to Eat — ${place}`,
      text,
      url: created.url,
    };
  }, [created, date, time, restaurantName, menuItemName]);

  if (!open) return null;

  async function handleCreate(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await createEatInvitation({
        restaurant_id: restaurantId,
        menu_item_id: menuItemId || undefined,
        scheduled_date: date,
        scheduled_time: time,
        message: message.trim() || undefined,
      });
      const invitation = data?.invitation || null;
      if (!invitation?.url) {
        throw new Error(data?.error || "Could not create invitation");
      }
      setCreated(invitation);
    } catch (err) {
      setError(err?.message || "Could not create invitation");
    } finally {
      setBusy(false);
    }
  }

  // ShareModal uses z-index 1200; Invite overlay is 12000. While sharing, unmount the
  // invite sheet so Copy Link / SMS / etc. are not trapped under a higher dim layer.
  if (shareOpen && shareData) {
    return createPortal(
      <ShareModal
        open
        onClose={() => setShareOpen(false)}
        modalTitle="Share invitation"
        shareData={shareData}
        analyticsContext={{
          pageType: "invite_to_eat",
          restaurantId,
          menuItemId,
          shareTarget: "eat_invitation",
        }}
      />,
      document.body
    );
  }

  const dateLabel = formatDateLabel(created?.scheduled_date || date);
  const timeLabel = formatTimeLabel(created?.scheduled_time || time);
  const placeName = created?.restaurant_name || restaurantName || "Restaurant";
  const dishName = created?.menu_item_name || menuItemName || null;
  const statusLabel = created?.status_label || "Ready to Send";

  const overlay = (
    <div
      data-testid="invite-to-eat-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Invite to Eat"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 12000,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          color: "#1c1917",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {created ? "Invitation Ready" : "Invite to Eat"}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              color: "#78716c",
            }}
          >
            ×
          </button>
        </div>

        {!created ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{placeName}</div>
            {dishName ? (
              <div style={{ fontSize: 13, color: "#57534e", marginBottom: 12 }}>
                Recommended: <strong>{dishName}</strong>
              </div>
            ) : (
              <div style={{ height: 8 }} />
            )}
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                Date
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="invite-date"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                Time
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  data-testid="invite-time"
                  style={inputStyle}
                />
              </label>
              <div style={{ fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>
                After you create the invitation, send it through Messages or another app. Menuply
                does not send SMS for you and does not need your contacts.
              </div>
              <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                Message (optional)
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Want to grab dinner?"
                  data-testid="invite-message"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
              {error ? (
                <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={busy || !restaurantId}
                data-testid="invite-create"
                style={{
                  marginTop: 4,
                  height: 44,
                  borderRadius: 999,
                  border: "none",
                  background: busy ? "#a3a3a3" : "#166534",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "Creating…" : "Create Invitation"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: "grid", gap: 12 }} data-testid="invite-created">
            <div
              data-testid="invite-status-label"
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                padding: "4px 10px",
                borderRadius: 999,
                background: "#ecfdf5",
                color: "#166534",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {statusLabel}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{placeName}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#44403c" }}>
              {dateLabel}
              {dateLabel && timeLabel ? " · " : ""}
              {timeLabel}
            </div>
            {dishName ? (
              <div style={{ fontSize: 13, color: "#57534e" }}>
                Recommended: <strong>{dishName}</strong>
              </div>
            ) : null}
            {created.message || message.trim() ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#f5f5f4",
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: "#292524",
                }}
              >
                “{created.message || message.trim()}”
              </div>
            ) : null}
            <input
              readOnly
              value={created.url}
              data-testid="invite-url"
              onFocus={(e) => e.target.select()}
              style={inputStyle}
            />
            <button
              type="button"
              data-testid="invite-share-send"
              onClick={() => setShareOpen(true)}
              style={{
                height: 44,
                borderRadius: 999,
                border: "none",
                background: "#166534",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Share / Send
            </button>
            <div style={{ fontSize: 12, color: "#78716c", lineHeight: 1.4 }}>
              Opens Menuply share options (Copy Link, Messages, and more). Menuply does not send SMS
              for you.
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40,
                borderRadius: 999,
                border: "1px solid #d6d3d1",
                background: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #d6d3d1",
  padding: "10px 12px",
  fontSize: 14,
};
