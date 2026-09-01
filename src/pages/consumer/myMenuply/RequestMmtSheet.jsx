/**
 * Owner flow: Request Make Me This for a specific I Wanna Eat item.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import MmtAudiencePicker from "./MmtAudiencePicker.jsx";
import { createMakeMeThisRequest } from "../../../lib/makeMeThisApi.js";
import * as s from "./myMenuplyStyles.js";

export default function RequestMmtSheet({
  open,
  want,
  candidates = [],
  onClose,
  onCreated,
}) {
  const [audience, setAudience] = useState("connections");
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open || !want || typeof document === "undefined") return null;

  const foodLabel =
    String(want.item_name || want.food_name || "").trim() || "This dish";
  const place = String(want.restaurant_name || "").trim();

  async function handleSubmit() {
    setBusy(true);
    setError("");
    try {
      const data = await createMakeMeThisRequest({
        wantToEatId: want.id,
        audience,
        allowedUserIds: audience === "selected" ? selectedIds : [],
      });
      onCreated?.(data?.request || data);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to send request");
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
        <h2 style={styles.title}>Request Make Me This</h2>
        <p style={styles.lead}>
          Ask someone who can cook to show you how to make <strong>{foodLabel}</strong>
          {place ? ` from ${place}` : ""}. This stays private — not on the public Feed.
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
        <div style={s.actions}>
          <button type="button" style={s.chipBtn} disabled={busy} onClick={() => onClose?.()}>
            Cancel
          </button>
          <button type="button" style={s.primaryBtn} disabled={busy} onClick={handleSubmit}>
            {busy ? "Sending…" : "Send request"}
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
    zIndex: 360,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "min(420px, 100%)",
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    fontFamily: "Inter, Arial, sans-serif",
    boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
  },
  title: { margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#0f172a" },
  lead: { margin: "0 0 12px", fontSize: 14, lineHeight: 1.45, color: "#475569" },
  error: { margin: "10px 0 0", color: "#b91c1c", fontSize: 13, fontWeight: 600 },
};
