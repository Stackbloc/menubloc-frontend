/**
 * Quick Invite on My Profile, below My Social Calendar (Andre 2026-10-29; moved out of Post: an
 * invite isn't a post). Since 2026-11-13 one link, same as the app's QuickInviteCard: tap it →
 * Quick Invite (who, as a checklist) → What for? (Breakfast, Brunch, Lunch, Dinner, Late night, then
 * Coffee, Drinks, Meet me here) → the place → the invite. A plain link, no oval pills (2026-11-12).
 */
import { Link } from "react-router-dom";
import * as s from "./myMenuplyStyles.js";

/** No seed code: step 2 asks What for? (the Today meal buttons pass their meal's code). */
export const QUICK_INVITE_PATH = `/account/invite-to-eat?${new URLSearchParams({ quick_invite: "1" }).toString()}`;

export default function QuickInviteCard() {
  return (
    <section style={s.section} data-testid="profile-quick-invite">
      <Link to={QUICK_INVITE_PATH} style={styles.card} data-testid="x-quick-invite">
        <span style={{ display: "grid", gap: 4, flex: 1, minWidth: 0 }}>
          <strong style={styles.heading}>Quick Invite</strong>
          <span style={styles.lead}>Breakfast, brunch, lunch, dinner, late night, coffee or drinks. Connects get it in Menuply; anyone else gets a link from you.</span>
        </span>
        <span style={styles.chevron} aria-hidden>
          ›
        </span>
      </Link>
    </section>
  );
}

const styles = {
  card: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e1e6e1", borderRadius: 12, padding: 16, textDecoration: "none", color: "inherit" },
  heading: { fontSize: 18, lineHeight: "24px", color: "#111613" },
  lead: { fontSize: 13, color: "#5c665f", lineHeight: 1.4 },
  chevron: { fontSize: 22, fontWeight: 700, color: "#0f7a24" },
};
