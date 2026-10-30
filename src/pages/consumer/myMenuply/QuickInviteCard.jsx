/**
 * Quick Invite on My Profile, above My Social Calendar (Andre 2026-10-29; moved out of Post:
 * an invite isn't a post). Same five phrases as the app; each opens the invite flow with it preset.
 * The flow asks who first (2026-10-29): Connect → in Menuply or by text; anyone else → by text.
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
        <p style={styles.lead}>Pick who it's for. Connects can get it in Menuply; anyone else by text, even without an account.</p>
        <div style={styles.list}>
          {QUICK_INVITE_PHRASES.map((q) => (
            <Link key={q.code} to={quickInvitePath(q.code)} style={styles.row} data-testid={`quick-invite-${q.code.toLowerCase()}`}>
              {q.phrase}
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
  list: { display: "flex", flexWrap: "wrap", gap: 8 },
  row: { padding: "8px 12px", border: "1px solid #e1e6e1", borderRadius: 999, background: "#f5f7f4", color: "#111613", fontWeight: 600, fontSize: 13, textDecoration: "none" },
};
