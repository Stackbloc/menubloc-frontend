/**
 * Quick Invite on My Profile, above My Social Calendar (Andre 2026-10-29; moved out of Post:
 * an invite isn't a post). Same five phrases as the app; each opens the invite flow with it preset.
 */
import { Link } from "react-router-dom";
import * as s from "./myMenuplyStyles.js";

const QUICK_INVITE_PHRASES = [
  { code: "LDL", phrase: "Let's do lunch" },
  { code: "LDD", phrase: "Let's do dinner" },
  { code: "LHC", phrase: "Let's have coffee" },
  { code: "LGD", phrase: "Let's get drinks" },
  { code: "MMH", phrase: "Meet me here" },
];

function quickInvitePath(code) {
  return `/account/invite-to-eat?${new URLSearchParams({ seed_code: code, quick_invite: "1" }).toString()}`;
}

export default function QuickInviteCard() {
  return (
    <section style={s.section} data-testid="profile-quick-invite">
      <div style={styles.card}>
        <strong style={{ fontSize: 18, color: "#0f172a" }}>Quick Invite</strong>
        <p style={styles.lead}>Share by text or Copy Link. Friends not on Menuply can still open it and RSVP.</p>
        <div style={styles.list}>
          {QUICK_INVITE_PHRASES.map((q) => (
            <Link key={q.code} to={quickInvitePath(q.code)} style={styles.row} data-testid={`quick-invite-${q.code.toLowerCase()}`}>
              <span>{q.phrase}</span>
              <span aria-hidden style={{ color: "#94a3b8" }}>
                ›
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles = {
  card: { background: "#fff", border: "1px solid #d1fae5", borderRadius: 16, padding: 14, display: "grid", gap: 10 },
  lead: { margin: 0, fontSize: 13, color: "#64748b" },
  list: { display: "grid", gap: 8 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 12, color: "#0f172a", fontWeight: 700, fontSize: 15, textDecoration: "none" },
};
