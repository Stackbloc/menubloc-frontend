import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { FEEDBACK_CATEGORIES, FEEDBACK_MESSAGE_MAX, submitFeedback } from "../lib/feedbackApi.js";

/**
 * Send Feedback (Andre 2026-11-07). Two fields: what kind + what happened.
 * The page the person came from (?from=/path) is sent along; no technical questions asked.
 */
export default function SendFeedback() {
  const [searchParams] = useSearchParams();
  const from = (searchParams.get("from") || "").split(/[?#]/)[0].slice(0, 300);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const trimmed = message.trim();
  const canSend = Boolean(category) && trimmed.length >= 3 && trimmed.length <= FEEDBACK_MESSAGE_MAX && !sending;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      await submitFeedback({ category, message: trimmed, screen: from || null });
      setSent(true);
      window.scrollTo?.({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.message && Number(err?.status) > 0 ? err.message : "We couldn't send that right now. Please try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageShell width="reading">
        <div style={{ marginBottom: 16 }}>
          <BrandLogo height={36} radius={8} matchPageBackground={false} />
        </div>
        <PageHero title="Send Feedback" description="Tell us what's working, what isn't, or what you'd like to see." />

        <div style={{ maxWidth: 620 }}>
          {sent ? (
            <div role="status" style={doneBox}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0B0F0C" }}>Thanks — we got it.</div>
              <div style={{ marginTop: 6, color: "#374151", fontSize: 15, lineHeight: 1.6 }}>
                Every message is read by the Menuply team.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <Link to={from || "/"} style={pillPrimary}>Done</Link>
                <button
                  type="button"
                  style={pillSecondary}
                  onClick={() => { setSent(false); setMessage(""); setCategory(""); }}
                >
                  Send more
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={labelStyle}>What is it about?</legend>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {FEEDBACK_CATEGORIES.map((c) => (
                    <label key={c.value} style={{ ...choiceStyle, ...(category === c.value ? choiceOn : null) }}>
                      <input
                        type="radio"
                        name="feedback-category"
                        value={c.value}
                        checked={category === c.value}
                        onChange={() => setCategory(c.value)}
                        style={{ accentColor: "#111827" }}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="feedback-message" style={{ ...labelStyle, display: "block", marginTop: 22 }}>
                Tell us more
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, FEEDBACK_MESSAGE_MAX))}
                rows={6}
                maxLength={FEEDBACK_MESSAGE_MAX}
                placeholder="What happened, or what would make Menuply better?"
                style={textareaStyle}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6, color: "#6B7280", fontSize: 12 }}>
                <span>Please don't include passwords or card numbers.</span>
                <span>{message.length}/{FEEDBACK_MESSAGE_MAX}</span>
              </div>

              {error ? <div role="alert" style={errorBox}>{error}</div> : null}

              <div style={{ marginTop: 18 }}>
                <button type="submit" disabled={!canSend} style={{ ...pillPrimary, opacity: canSend ? 1 : 0.45, cursor: canSend ? "pointer" : "default" }}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}

const labelStyle = { color: "#0B0F0C", fontSize: 15, fontWeight: 800, padding: 0 };
const choiceStyle = {
  display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12,
  border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 15, color: "#111827",
};
const choiceOn = { borderColor: "#111827", boxShadow: "0 0 0 1px #111827" };
const textareaStyle = {
  width: "100%", boxSizing: "border-box", marginTop: 8, padding: 12, borderRadius: 12,
  border: "1px solid #D1D5DB", fontSize: 15, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical",
};
const pillPrimary = {
  display: "inline-block", padding: "10px 22px", borderRadius: 999, border: 0, background: "#111827",
  color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "inherit",
};
const pillSecondary = { ...pillPrimary, background: "#fff", color: "#111827", border: "1px solid #D1D5DB", cursor: "pointer" };
const errorBox = { marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#FEF2F2", color: "#991B1B", fontSize: 14 };
const doneBox = { padding: 20, borderRadius: 14, border: "1px solid #E5E7EB", background: "#fff" };
