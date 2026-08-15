import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ShareModal from "./share/ShareModal.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { createEatInvitation } from "../lib/eatInvitationsApi.js";
import {
  getEatInviteGuestDisplayName,
  getOrCreateEatInviteGuestKey,
  rememberOrganizerInviteToken,
  setEatInviteGuestDisplayName,
} from "../lib/eatInviteGuestIdentity.js";
import {
  buildEatInviteMessageDraft,
  buildEatInviteShareText,
  formatInviteDateLabel,
  formatInviteTimeLabel,
  listInviteMessageOptions,
  pickInviteCopySeed,
} from "../lib/eatInviteShareCopy.js";

function tomorrowIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Invite to Eat: Who → Compose → Invitation Ready → ShareModal.
 * invite_kind: private (1:1) | group (shared outing).
 * No Menuply account required — guests provide a short display name.
 */
export default function InviteToEatModal({
  open,
  onClose,
  restaurantId,
  restaurantName = "",
  menuItemId = null,
  menuItemName = null,
  diningCrewId = null,
}) {
  const { isAuthenticated } = useConsumer();
  const [inviteKind, setInviteKind] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [scheduleMode, setScheduleMode] = useState("organizer");
  const [date, setDate] = useState(tomorrowIsoDate);
  const [time, setTime] = useState("19:00");
  const [messageMode, setMessageMode] = useState("LDD");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInviteKind(diningCrewId ? "group" : null);
    setGuestName(getEatInviteGuestDisplayName());
    setInviteeName("");
    setScheduleMode("organizer");
    setDate(tomorrowIsoDate());
    setTime("19:00");
    const seed = pickInviteCopySeed({ scheduledTime: "19:00" });
    setMessageMode(seed.code);
    setMessage("");
    setBusy(false);
    setError("");
    setCreated(null);
    setShareOpen(false);
  }, [open, diningCrewId]);

  const resolvedKind =
    created?.invite_kind === "private" || inviteKind === "private" ? "private" : "group";

  const placeName = created?.restaurant_name || restaurantName || "Restaurant";
  const recipientChooses =
    (created?.schedule_mode || scheduleMode) === "recipient_chooses";
  const dateLabel = recipientChooses
    ? ""
    : formatInviteDateLabel(created?.scheduled_date || date);
  const timeLabel = recipientChooses
    ? ""
    : formatInviteTimeLabel(created?.scheduled_time || time);

  const messageOptions = useMemo(
    () =>
      listInviteMessageOptions({
        inviteKind: inviteKind || "group",
        restaurantName: placeName,
        dateLabel: scheduleMode === "recipient_chooses" ? "" : formatInviteDateLabel(date),
        timeLabel: scheduleMode === "recipient_chooses" ? "" : formatInviteTimeLabel(time),
        scheduledTime: scheduleMode === "recipient_chooses" ? null : time,
      }),
    [inviteKind, placeName, date, time, scheduleMode]
  );

  const selectedDraft =
    messageMode === "custom"
      ? message
      : messageOptions.find((opt) => opt.code === messageMode)?.text ||
        buildEatInviteMessageDraft({
          inviteKind: inviteKind || "group",
          restaurantName: placeName,
          dateLabel: scheduleMode === "recipient_chooses" ? "" : formatInviteDateLabel(date),
          timeLabel: scheduleMode === "recipient_chooses" ? "" : formatInviteTimeLabel(time),
          scheduledTime: scheduleMode === "recipient_chooses" ? null : time,
          seedCode: messageMode,
        });

  const shareData = useMemo(() => {
    if (!created?.url) return null;
    const place = created.restaurant_name || restaurantName || "a restaurant";
    const chooses =
      created.schedule_mode === "recipient_chooses" || scheduleMode === "recipient_chooses";
    const text = buildEatInviteShareText({
      inviteKind: created.invite_kind || resolvedKind,
      restaurantName: place,
      dateLabel: chooses ? "" : formatInviteDateLabel(created.scheduled_date || date),
      timeLabel: chooses ? "" : formatInviteTimeLabel(created.scheduled_time || time),
      scheduledTime: chooses ? null : created.scheduled_time || time,
      message: created.message || selectedDraft || message,
      url: created.url,
    });
    return {
      title: `Invite to Eat — ${place}`,
      text,
      url: created.url,
    };
  }, [created, date, time, restaurantName, resolvedKind, selectedDraft, message, scheduleMode]);

  if (!open) return null;

  async function handleCreate(e) {
    e.preventDefault();
    if (busy || !inviteKind) return;
    setBusy(true);
    setError("");
    try {
      const resolvedMessage =
        messageMode === "custom" ? String(message || "").trim() : String(selectedDraft || "").trim();
      const body = {
        restaurant_id: restaurantId,
        menu_item_id: menuItemId || undefined,
        schedule_mode: scheduleMode,
        message: resolvedMessage || undefined,
        invite_kind: inviteKind,
      };
      if (diningCrewId) {
        body.dining_crew_id = diningCrewId;
        body.invite_kind = "group";
      }
      if (scheduleMode === "organizer") {
        body.scheduled_date = date;
        body.scheduled_time = time;
      }
      if (inviteKind === "private") {
        const invitee = String(inviteeName || "").trim();
        if (!invitee) {
          throw new Error("Enter the name of the person you are inviting");
        }
        body.invitee_display_name = invitee;
      }
      if (!isAuthenticated) {
        const name = String(guestName || "").trim();
        if (!name) {
          throw new Error("Enter your name so friends know who invited them");
        }
        const guestKey = getOrCreateEatInviteGuestKey();
        body.guest_key = guestKey;
        body.display_name = name;
        setEatInviteGuestDisplayName(name);
      }
      const data = await createEatInvitation(body);
      const invitation = data?.invitation || null;
      if (!invitation?.url) {
        throw new Error(data?.error || "Could not create invitation");
      }
      if (invitation.invitation_token && invitation.organizer_guest_key) {
        rememberOrganizerInviteToken(
          invitation.invitation_token,
          invitation.organizer_guest_key
        );
      } else if (!isAuthenticated) {
        const tokenFromUrl = String(invitation.url || "")
          .split("/invite/")
          .pop()
          ?.split(/[?#]/)[0];
        if (tokenFromUrl) {
          rememberOrganizerInviteToken(tokenFromUrl, getOrCreateEatInviteGuestKey());
        }
      }
      setCreated(invitation);
    } catch (err) {
      setError(err?.message || "Could not create invitation");
    } finally {
      setBusy(false);
    }
  }

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
          inviteKind: resolvedKind,
        }}
      />,
      document.body
    );
  }

  const dishName = created?.menu_item_name || menuItemName || null;
  const statusLabel = created?.status_label || "Ready to Send";
  const kindLabel = resolvedKind === "private" ? "One person" : "Group";

  const choiceBtn = {
    height: 48,
    borderRadius: 12,
    border: "1px solid #d6d3d1",
    background: "#fff",
    color: "#1c1917",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  };

  const radioLabel = {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e7e5e4",
    background: "#fafaf9",
    cursor: "pointer",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 600,
    color: "#292524",
  };

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
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          color: "#1c1917",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {created
              ? "Invitation Ready"
              : !inviteKind
                ? "Invite to Eat"
                : inviteKind === "private"
                  ? "Invite one person"
                  : "Invite a group"}
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

        {!created && !inviteKind ? (
          <div data-testid="invite-kind-choice" style={{ display: "grid", gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#44403c" }}>
              Who do you want to invite?
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>{placeName}</div>
            <button
              type="button"
              data-testid="invite-kind-private"
              onClick={() => {
                setInviteKind("private");
                setMessageMode(pickInviteCopySeed({ scheduledTime: time }).code);
              }}
              style={choiceBtn}
            >
              One Person
            </button>
            <button
              type="button"
              data-testid="invite-kind-group"
              onClick={() => {
                setInviteKind("group");
                setMessageMode(pickInviteCopySeed({ scheduledTime: time }).code);
              }}
              style={choiceBtn}
            >
              A Group
            </button>
          </div>
        ) : null}

        {!created && inviteKind ? (
          <>
            <button
              type="button"
              data-testid="invite-kind-back"
              onClick={() => {
                setInviteKind(null);
                setError("");
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#166534",
                fontWeight: 700,
                fontSize: 13,
                padding: 0,
                marginBottom: 8,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              ← Who do you want to invite?
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{placeName}</div>
            {dishName ? (
              <div style={{ fontSize: 13, color: "#57534e", marginBottom: 12 }}>
                Recommended: <strong>{dishName}</strong>
              </div>
            ) : (
              <div style={{ height: 8 }} />
            )}
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
              {!isAuthenticated ? (
                <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                  Your name
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="So friends know who invited them"
                    data-testid="invite-guest-name"
                    autoComplete="nickname"
                    style={inputStyle}
                  />
                </label>
              ) : null}
              {inviteKind === "private" ? (
                <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700 }}>
                  Invitee&apos;s name
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    placeholder="Who are you inviting?"
                    data-testid="invite-invitee-name"
                    autoComplete="name"
                    style={inputStyle}
                  />
                </label>
              ) : null}
              <fieldset
                data-testid="invite-schedule-mode"
                style={{
                  margin: 0,
                  padding: 0,
                  border: "none",
                  display: "grid",
                  gap: 8,
                }}
              >
                <legend style={{ fontSize: 12, fontWeight: 700, padding: 0, marginBottom: 4 }}>
                  Date &amp; time
                </legend>
                <label
                  style={{
                    ...radioLabel,
                    borderColor: scheduleMode === "organizer" ? "#86efac" : "#e7e5e4",
                    background: scheduleMode === "organizer" ? "#f0fdf4" : "#fafaf9",
                  }}
                >
                  <input
                    type="radio"
                    name="invite-schedule-mode"
                    value="organizer"
                    checked={scheduleMode === "organizer"}
                    onChange={() => setScheduleMode("organizer")}
                    data-testid="invite-schedule-organizer"
                    style={{ marginTop: 3 }}
                  />
                  <span>I&apos;ll pick the date &amp; time</span>
                </label>
                <label
                  style={{
                    ...radioLabel,
                    borderColor: scheduleMode === "recipient_chooses" ? "#86efac" : "#e7e5e4",
                    background: scheduleMode === "recipient_chooses" ? "#f0fdf4" : "#fafaf9",
                  }}
                >
                  <input
                    type="radio"
                    name="invite-schedule-mode"
                    value="recipient_chooses"
                    checked={scheduleMode === "recipient_chooses"}
                    onChange={() => setScheduleMode("recipient_chooses")}
                    data-testid="invite-schedule-recipient-chooses"
                    style={{ marginTop: 3 }}
                  />
                  <span>Let them choose the date &amp; time</span>
                </label>
              </fieldset>
              {scheduleMode === "organizer" ? (
                <>
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
                </>
              ) : (
                <p
                  data-testid="invite-recipient-chooses-note"
                  style={{ margin: 0, fontSize: 13, color: "#57534e", lineHeight: 1.45 }}
                >
                  Recipients will propose a date and time when they respond. Each person can suggest
                  a different time — the invitation itself stays open.
                </p>
              )}
              <div style={{ fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>
                After you create the invitation, send it through Messages or another app. Menuply
                does not send SMS for you and does not need your contacts.
              </div>

              <fieldset
                data-testid="invite-message-options"
                style={{
                  margin: 0,
                  padding: 0,
                  border: "none",
                  display: "grid",
                  gap: 8,
                }}
              >
                <legend style={{ fontSize: 12, fontWeight: 700, padding: 0, marginBottom: 4 }}>
                  Message
                </legend>
                {messageOptions.map((opt) => (
                  <label
                    key={opt.code}
                    style={{
                      ...radioLabel,
                      borderColor: messageMode === opt.code ? "#86efac" : "#e7e5e4",
                      background: messageMode === opt.code ? "#f0fdf4" : "#fafaf9",
                    }}
                  >
                    <input
                      type="radio"
                      name="invite-message-mode"
                      value={opt.code}
                      checked={messageMode === opt.code}
                      onChange={() => {
                        setMessageMode(opt.code);
                      }}
                      data-testid={`invite-message-option-${opt.code}`}
                      style={{ marginTop: 3 }}
                    />
                    <span style={{ whiteSpace: "pre-wrap" }}>{opt.text}</span>
                  </label>
                ))}
                <label
                  style={{
                    ...radioLabel,
                    borderColor: messageMode === "custom" ? "#86efac" : "#e7e5e4",
                    background: messageMode === "custom" ? "#f0fdf4" : "#fafaf9",
                  }}
                >
                  <input
                    type="radio"
                    name="invite-message-mode"
                    value="custom"
                    checked={messageMode === "custom"}
                    onChange={() => setMessageMode("custom")}
                    data-testid="invite-message-option-custom"
                    style={{ marginTop: 3 }}
                  />
                  <span>Write your own</span>
                </label>
                {messageMode === "custom" ? (
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Write a short invitation message"
                    data-testid="invite-message"
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                ) : null}
              </fieldset>

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
        ) : null}

        {created ? (
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
              {statusLabel} · {kindLabel}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{placeName}</div>
            {created.invitee_display_name ? (
              <div style={{ fontSize: 14, color: "#44403c" }} data-testid="invite-created-invitee">
                Inviting <strong>{created.invitee_display_name}</strong>
              </div>
            ) : null}
            <div style={{ fontSize: 15, fontWeight: 700, color: "#44403c" }} data-testid="invite-created-schedule">
              {recipientChooses
                ? "Recipients choose the date & time"
                : `${dateLabel}${dateLabel && timeLabel ? " · " : ""}${timeLabel}`}
            </div>
            {dishName ? (
              <div style={{ fontSize: 13, color: "#57534e" }}>
                Recommended: <strong>{dishName}</strong>
              </div>
            ) : null}
            {created.message || selectedDraft || message.trim() ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#f5f5f4",
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: "#292524",
                  whiteSpace: "pre-wrap",
                }}
              >
                {created.message || selectedDraft || message.trim()}
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
        ) : null}
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
