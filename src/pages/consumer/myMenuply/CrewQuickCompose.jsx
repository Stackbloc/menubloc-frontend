/**
 * Crew name + purpose compose for My Menuply hub.
 */

import { useState } from "react";

export default function CrewQuickCompose({
  onSubmit,
  busy = false,
  testId = "compose-crew",
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = String(name || "").trim();
    if (!trimmedName) return;
    await onSubmit({
      name: trimmedName,
      purpose: String(purpose || "").trim() || null,
    });
    setName("");
    setPurpose("");
  }

  return (
    <form onSubmit={handleSubmit} data-testid={testId} style={styles.form}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Crew name"
        disabled={busy}
        maxLength={80}
        autoComplete="off"
        style={styles.input}
      />
      <input
        type="text"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Purpose (optional)"
        disabled={busy}
        maxLength={160}
        autoComplete="off"
        style={styles.input}
      />
      <button type="submit" disabled={busy || !String(name).trim()} style={styles.post}>
        {busy ? "…" : "Post"}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "8px 0 0",
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 140px",
    minWidth: 0,
    minHeight: 44,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #d1d5db",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0f172a",
    background: "#fff",
    boxSizing: "border-box",
  },
  post: {
    appearance: "none",
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
};
