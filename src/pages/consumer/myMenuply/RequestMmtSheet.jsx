/**
 * Owner flow: choose which I Wanna Eat items show Make Me This on the profile.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MmtAudiencePicker from "./MmtAudiencePicker.jsx";
import {
  closeMakeMeThisRequest,
  createMakeMeThisRequest,
} from "../../../lib/makeMeThisApi.js";
import * as s from "./myMenuplyStyles.js";

export default function RequestMmtSheet({
  open,
  wants = [],
  candidates = [],
  onClose,
  onCreated,
}) {
  const [audience, setAudience] = useState("connections");
  const [selectedIds, setSelectedIds] = useState([]);
  const [checkedWantIds, setCheckedWantIds] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const initial = new Set(
      (wants || [])
        .filter((w) => w?.mmt_request?.id && w.mmt_request.status !== "closed")
        .map((w) => Number(w.id))
        .filter((id) => Number.isFinite(id))
    );
    setCheckedWantIds(initial);
    setError("");
    setAudience("connections");
    setSelectedIds([]);
  }, [open, wants]);

  if (!open || typeof document === "undefined") return null;

  function toggleWant(id) {
    const n = Number(id);
    setCheckedWantIds((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      const rows = Array.isArray(wants) ? wants : [];
      for (const want of rows) {
        const id = Number(want.id);
        if (!Number.isFinite(id)) continue;
        const shouldHave = checkedWantIds.has(id);
        const existingId = want?.mmt_request?.id;
        const isOpen = existingId && want.mmt_request.status !== "closed";
        if (shouldHave && !isOpen) {
          await createMakeMeThisRequest({
            wantToEatId: id,
            audience,
            allowedUserIds: audience === "selected" ? selectedIds : [],
          });
        } else if (!shouldHave && isOpen) {
          await closeMakeMeThisRequest(existingId);
        }
      }
      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to update Make Me This");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="presentation"
      data-testid="request-mmt-sheet"
      style={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div role="dialog" aria-modal="true" style={styles.sheet}>
        <h2 style={styles.title}>Make Me This</h2>
        <p style={styles.lead}>
          Check which <strong>What I Wanna Eat</strong> items should show Make Me This on your
          profile. Eligible Connections can offer to make them — not on the public Feed.
        </p>
        {wants.length === 0 ? (
          <p style={s.muted} data-testid="mmt-picker-empty">
            Add something you wanna eat first, then choose Make Me This items here.
          </p>
        ) : (
          <ul style={styles.checkList} data-testid="mmt-want-checklist">
            {wants.map((want) => {
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
                      disabled={busy}
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
        <MmtAudiencePicker
          audience={audience}
          onAudienceChange={setAudience}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          candidates={candidates}
          disabled={busy}
        />
        {error ? (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        ) : null}
        <div style={s.actions}>
          <button type="button" style={s.chipBtn} disabled={busy} onClick={() => onClose?.()}>
            Cancel
          </button>
          <button
            type="button"
            style={s.primaryBtn}
            disabled={busy || wants.length === 0}
            onClick={handleSubmit}
            data-testid="mmt-request-submit"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
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
  lead: { margin: "0 0 12px", fontSize: 14, lineHeight: 1.45, color: "#475569" },
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
