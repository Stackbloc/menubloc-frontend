/**
 * Own-hub Cravings sheet: Invite Me Out who + Wanna Go! Invite + Make Me This dishes.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import InviteToEatModal from "../../../components/InviteToEatModal.jsx";
import InviteMeOutAudiencePicker from "./InviteMeOutAudiencePicker.jsx";
import MmtAudiencePicker from "./MmtAudiencePicker.jsx";
import {
  closeMakeMeThisRequest,
  createMakeMeThisRequest,
} from "../../../lib/makeMeThisApi.js";
import * as s from "./myMenuplyStyles.js";

export default function CravingsInviteSheet({
  open,
  wants = [],
  diningIntents = [],
  mmtCandidates = [],
  inviteMeOutOpen = false,
  inviteMeOutAudience = "connections",
  inviteMeOutSelectedIds = [],
  inviteMeOutCandidates = [],
  onInviteMeOutSave,
  inviteMeOutToggleBusy = false,
  onClose,
  onMmtSaved,
}) {
  const [draftInviteOpen, setDraftInviteOpen] = useState(false);
  const [draftAudience, setDraftAudience] = useState("connections");
  const [draftSelectedIds, setDraftSelectedIds] = useState([]);
  const [mmtAudience, setMmtAudience] = useState("connections");
  const [mmtSelectedIds, setMmtSelectedIds] = useState([]);
  const [checkedWantIds, setCheckedWantIds] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invitePlace, setInvitePlace] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDraftInviteOpen(Boolean(inviteMeOutOpen));
    setDraftAudience(inviteMeOutAudience === "selected" ? "selected" : "connections");
    setDraftSelectedIds(
      Array.isArray(inviteMeOutSelectedIds) ? [...inviteMeOutSelectedIds] : []
    );
    const initial = new Set(
      (wants || [])
        .filter((w) => w?.mmt_request?.id && w.mmt_request.status !== "closed")
        .map((w) => Number(w.id))
        .filter((id) => Number.isFinite(id))
    );
    setCheckedWantIds(initial);
    setMmtAudience("connections");
    setMmtSelectedIds([]);
    setError("");
    setInvitePlace(null);
  }, [open, wants, inviteMeOutOpen, inviteMeOutAudience, inviteMeOutSelectedIds]);

  if (!open || typeof document === "undefined") return null;

  const places = Array.isArray(diningIntents) ? diningIntents : [];
  const dishWants = Array.isArray(wants) ? wants : [];
  const saving = busy || inviteMeOutToggleBusy;

  function toggleWant(id) {
    const n = Number(id);
    setCheckedWantIds((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function handleSave() {
    if (
      draftInviteOpen &&
      draftAudience === "selected" &&
      draftSelectedIds.length === 0
    ) {
      setError("Select at least one Connection for Invite Me Out.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (typeof onInviteMeOutSave === "function") {
        await onInviteMeOutSave({
          open: draftInviteOpen,
          audience: draftAudience,
          selectedIds: draftSelectedIds,
        });
      }
      for (const want of dishWants) {
        const id = Number(want.id);
        if (!Number.isFinite(id)) continue;
        const shouldHave = checkedWantIds.has(id);
        const existingId = want?.mmt_request?.id;
        const isOpen = existingId && want.mmt_request.status !== "closed";
        if (shouldHave && !isOpen) {
          await createMakeMeThisRequest({
            wantToEatId: id,
            audience: mmtAudience,
            allowedUserIds: mmtAudience === "selected" ? mmtSelectedIds : [],
          });
        } else if (!shouldHave && isOpen) {
          await closeMakeMeThisRequest(existingId);
        }
      }
      onMmtSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to save Cravings settings");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="presentation"
      data-testid="cravings-invite-sheet"
      style={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invite and Make Me This"
        style={styles.sheet}
      >
        <h2 style={styles.title}>Invite & Make Me This</h2>
        <p style={styles.lead}>
          Choose who can invite you out, invite someone to a Wanna Go! place, or open dishes for
          Make Me This.
        </p>

        <section style={styles.block} data-testid="cravings-invite-who">
          <h3 style={styles.sectionTitle}>Who can Invite Me Out</h3>
          <InviteMeOutAudiencePicker
            open={draftInviteOpen}
            onOpenChange={setDraftInviteOpen}
            audience={draftAudience}
            onAudienceChange={setDraftAudience}
            selectedIds={draftSelectedIds}
            onSelectedIdsChange={setDraftSelectedIds}
            candidates={inviteMeOutCandidates}
            disabled={saving}
          />
        </section>

        <section style={styles.block} data-testid="cravings-wanna-go-places">
          <h3 style={styles.sectionTitle}>Wanna Go! places</h3>
          {places.length === 0 ? (
            <p style={s.muted} data-testid="cravings-wanna-go-empty">
              No Wanna Go! places yet. Save a restaurant from Feed or a profile.
            </p>
          ) : (
            <ul style={styles.placeList}>
              {places.map((intent) => {
                const place =
                  String(intent.restaurant_name || "").trim() || "Restaurant";
                return (
                  <li key={intent.id || intent.restaurant_id} style={styles.placeRow}>
                    <span style={styles.placeName}>{place}</span>
                    <button
                      type="button"
                      style={styles.inviteBtn}
                      data-testid={`cravings-wanna-go-invite-${intent.restaurant_id}`}
                      disabled={saving || !intent.restaurant_id}
                      onClick={() =>
                        setInvitePlace({
                          restaurantId: intent.restaurant_id,
                          restaurantName: place,
                        })
                      }
                    >
                      Invite
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section style={styles.block} data-testid="cravings-mmt-dishes">
          <h3 style={styles.sectionTitle}>Make Me This dishes</h3>
          {dishWants.length === 0 ? (
            <p style={s.muted} data-testid="cravings-mmt-empty">
              Add a dish to What I Wanna Eat, then open it for Make Me This here.
            </p>
          ) : (
            <ul style={styles.checkList} data-testid="mmt-want-checklist">
              {dishWants.map((want) => {
                const id = Number(want.id);
                const label =
                  String(want.item_name || want.food_name || "").trim() || "Want";
                const place = String(want.restaurant_name || "").trim();
                return (
                  <li key={want.id} style={styles.checkRow}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={checkedWantIds.has(id)}
                        disabled={saving}
                        onChange={() => toggleWant(id)}
                        data-testid={`mmt-want-check-${id}`}
                      />
                      <span>
                        {label}
                        {place ? ` · ${place}` : ""}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {dishWants.length > 0 ? (
            <MmtAudiencePicker
              audience={mmtAudience}
              onAudienceChange={setMmtAudience}
              selectedIds={mmtSelectedIds}
              onSelectedIdsChange={setMmtSelectedIds}
              candidates={mmtCandidates}
              disabled={saving}
            />
          ) : null}
        </section>

        {error ? (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        ) : null}

        <div style={s.actions}>
          <button type="button" style={s.chipBtn} disabled={saving} onClick={() => onClose?.()}>
            Cancel
          </button>
          <button
            type="button"
            style={s.primaryBtn}
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
            data-testid="cravings-invite-save"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <InviteToEatModal
        open={Boolean(invitePlace?.restaurantId)}
        onClose={() => setInvitePlace(null)}
        restaurantId={invitePlace?.restaurantId}
        restaurantName={invitePlace?.restaurantName}
      />
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 370,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "min(420px, 100%)",
    maxHeight: "85vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    fontFamily: "Inter, Arial, sans-serif",
    boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
  },
  title: { margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#0f172a" },
  lead: { margin: "0 0 14px", fontSize: 14, lineHeight: 1.45, color: "#475569" },
  block: { marginBottom: 16 },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  placeList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  placeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  placeName: { fontSize: 14, fontWeight: 700, color: "#0f172a", minWidth: 0 },
  inviteBtn: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    padding: "4px 0",
    flexShrink: 0,
  },
  checkList: { listStyle: "none", margin: "0 0 14px", padding: 0, display: "grid", gap: 8 },
  checkRow: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  checkLabel: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    cursor: "pointer",
  },
  error: { margin: "10px 0 0", color: "#b91c1c", fontSize: 13, fontWeight: 600 },
};
