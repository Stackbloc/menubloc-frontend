// "Ask for review" under a CK moderation block (plan 73 PM1b, 2026-11-23). Signed-in diners only; one
// tap sends the exact text to CK, which re-checks it. Nothing is published by asking.
import { useState } from "react";
import { createCkAppeal, isAppealableCode } from "../lib/ckAppealsApi.js";

export default function AskForReview({ code, surface, text, size, caption, signedIn = true, style }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | failed
  const [note, setNote] = useState("");
  if (!signedIn || !isAppealableCode(code) || !String(text || "").trim()) return null;

  const send = async () => {
    setState("sending");
    try {
      await createCkAppeal({ surface, text, size, caption });
      setState("sent");
      setNote("");
    } catch (err) {
      setState("failed");
      setNote(err?.message || "Couldn't send. Try again.");
    }
  };

  if (state === "sent") {
    return (
      <p data-testid="ask-for-review-sent" style={{ margin: "4px 0 0", fontSize: 13, color: "#4b5563", ...style }}>
        Sent. We'll take a look. It stays off until then.
      </p>
    );
  }
  return (
    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4b5563", ...style }}>
      Think we got it wrong?{" "}
      <button
        type="button"
        onClick={send}
        disabled={state === "sending"}
        data-testid="ask-for-review"
        style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 600, color: "#1d4ed8", textDecoration: "underline", cursor: "pointer" }}
      >
        {state === "sending" ? "Sending…" : "Ask for review"}
      </button>
      {state === "failed" && note ? <span style={{ display: "block", color: "#b91c1c" }}>{note}</span> : null}
    </p>
  );
}
