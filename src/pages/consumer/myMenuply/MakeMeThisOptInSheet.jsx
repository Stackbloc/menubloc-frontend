/**
 * After adding a menu-item craving: ask Make Me This? + who is eligible.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MmtAudiencePicker from "./MmtAudiencePicker.jsx";
import { createMakeMeThisRequest } from "../../../lib/makeMeThisApi.js";
import * as s from "./myMenuplyStyles.js";

export default function MakeMeThisOptInSheet({
  open,
  want = null,
  candidates = [],
  onClose,
  onSaved,
}) {
  const [audience, setAudience] = useState("connections");
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAudience("connections");
    setSelectedIds([]);
    setError("");
  }, [open, want?.id]);

  if (!open || !want?.id || typeof document === "undefined") return null;

  const food =
    String(want.item_name || want.food_name || "this dish").trim() || "this dish";

  async function handleYes() {
    if (audience === "selected" && selectedIds.length === 0) {
      setError("Select at least one person who can Make Me This.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createMakeMeThisRequest({
        wantToEatId: want.id,
        audience,
        allowedUserIds: audience === "selected" ? selectedIds : [],
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to open Make Me This");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="presentation"
      data-testid="mmt-opt-in-sheet"
      style={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div role="dialog" aria-modal="true" style={styles.sheet}>
        <h2 style={styles.title}>Make Me This?</h2>
        <p style={styles.lead}>
          Open <strong>{food}</strong> so eligible people can offer to make it for you.
        </p>
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
        <div style={styles.actions}>
          <button
            type="button"
            style={s.primaryBtn}
            disabled={busy}
            data-testid="mmt-opt-in-yes"
            onClick={handleYes}
          >
            {busy ? "Saving…" : "Yes — Make Me This"}
          </button>
          <button
            type="button"
            style={s.chipBtn}
            disabled={busy}
            data-testid="mmt-opt-in-no"
            onClick={() => onClose?.()}
          >
            Not now
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
    zIndex: 380,
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
  actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  error: { margin: "10px 0 0", color: "#b91c1c", fontSize: 13, fontWeight: 600 },
};
