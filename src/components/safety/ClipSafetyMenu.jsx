import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { blockDiner, reportContent } from "../../lib/consumerApi.js";

/**
 * ⋯ on a clip or dish video comment → Report clip / Block {name} (Play Store safety, Andre approved
 * 2026-11-02, plan 18). Reasons match the backend (contentReportService REPORT_REASONS).
 * onHidden() runs after a report or block so the surface can move past the clip.
 */
const REASONS = [
  ["not_food_spam", "Not food / spam"],
  ["hateful", "Rude or hateful"],
  ["nudity_violence", "Nudity or violence"],
  ["impersonation", "Pretends to be someone"],
  ["other", "Something else"],
];

const sheet = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300000, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  panel: { background: "#fff", color: "#111613", width: "100%", maxWidth: 480, borderRadius: "16px 16px 0 0", padding: "18px 16px calc(18px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box" },
  title: { margin: 0, fontSize: 17, fontWeight: 700 },
  row: { textAlign: "left", background: "none", border: 0, borderBottom: "1px solid #e1e6e1", padding: "12px 2px", fontSize: 16, color: "#111613", cursor: "pointer" },
  danger: { color: "#b42318" },
  muted: { margin: 0, fontSize: 14, color: "#5c665f", lineHeight: 1.4 },
  input: { fontSize: 15, padding: "9px 11px", borderRadius: 10, border: "1px solid #e1e6e1", width: "100%", boxSizing: "border-box" },
  pill: { alignSelf: "flex-start", borderRadius: 999, padding: "9px 18px", fontSize: 15, fontWeight: 600, border: 0, cursor: "pointer", background: "#b42318", color: "#fff" },
  link: { alignSelf: "flex-start", background: "none", border: 0, padding: 0, color: "#0f7a24", fontSize: 15, cursor: "pointer" },
};

export default function ClipSafetyMenu({ kind, contentId, dinerId = null, dinerName = "", onHidden, buttonStyle, label = "More" }) {
  const { isAuthenticated, consumer } = useConsumer();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("menu"); // menu | reasons | block | done
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneText, setDoneText] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("menu");
      setReason("");
      setNote("");
      setError("");
    }
  }, [open]);

  if (!kind || contentId == null) return null;
  const isOwn = dinerId != null && consumer?.id != null && Number(consumer.id) === Number(dinerId);
  const name = dinerName || "this diner";

  async function run(fn, text) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setDoneText(text);
      setStep("done");
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    const hide = step === "done";
    setOpen(false);
    if (hide) onHidden?.();
  }

  const stop = (e) => e.stopPropagation();
  return (
    <>
      <button
        type="button"
        aria-label={label}
        data-testid="clip-safety-menu"
        style={buttonStyle}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        ⋯
      </button>
      {open ? (
        <div style={sheet.backdrop} onClick={close} onTouchStart={stop} onTouchEnd={stop} role="presentation">
          <div style={sheet.panel} onClick={stop} role="dialog" aria-modal="true" aria-label="Clip options">
            {!isAuthenticated ? (
              <>
                <p style={sheet.title}>Sign in to report or block</p>
                <Link to={`/account/login?next=${encodeURIComponent(location.pathname + location.search)}`} style={sheet.link}>Sign in</Link>
              </>
            ) : step === "menu" ? (
              <>
                {isOwn ? <p style={sheet.muted}>This is your clip.</p> : null}
                {!isOwn ? (
                  <button type="button" style={sheet.row} onClick={() => setStep("reasons")} data-testid="clip-safety-report">
                    Report clip
                  </button>
                ) : null}
                {!isOwn && dinerId != null ? (
                  <button type="button" style={{ ...sheet.row, ...sheet.danger }} onClick={() => setStep("block")} data-testid="clip-safety-block">
                    Block {name}
                  </button>
                ) : null}
                <button type="button" style={{ ...sheet.row, borderBottom: 0 }} onClick={close}>Cancel</button>
              </>
            ) : step === "reasons" ? (
              <>
                <p style={sheet.title}>Why are you reporting this clip?</p>
                {REASONS.map(([value, text]) => (
                  <label key={value} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 16 }}>
                    <input type="radio" name="report-reason" value={value} checked={reason === value} onChange={() => setReason(value)} />
                    {text}
                  </label>
                ))}
                <input style={sheet.input} placeholder="Add a note (optional)" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
                {error ? <p style={{ ...sheet.muted, color: "#b42318" }} role="alert">{error}</p> : null}
                <button
                  type="button"
                  disabled={!reason || busy}
                  style={{ ...sheet.pill, opacity: reason && !busy ? 1 : 0.5 }}
                  data-testid="clip-safety-send-report"
                  onClick={() => run(() => reportContent({ kind, contentId, reason, note }), "Thanks, we'll take a look. You won't see this clip again.")}
                >
                  {busy ? "Sending…" : "Send report"}
                </button>
              </>
            ) : step === "block" ? (
              <>
                <p style={sheet.title}>Block {name}?</p>
                <p style={sheet.muted}>You won&apos;t see each other&apos;s clips, and they can&apos;t connect with you or invite you. You can unblock them in Settings.</p>
                {error ? <p style={{ ...sheet.muted, color: "#b42318" }} role="alert">{error}</p> : null}
                <button type="button" disabled={busy} style={sheet.pill} data-testid="clip-safety-confirm-block" onClick={() => run(() => blockDiner(dinerId), `${name} is blocked.`)}>
                  {busy ? "Blocking…" : "Block"}
                </button>
                <button type="button" style={sheet.link} onClick={() => setStep("menu")}>Back</button>
              </>
            ) : (
              <>
                <p style={sheet.title}>{doneText}</p>
                <button type="button" style={sheet.link} onClick={close}>Done</button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
