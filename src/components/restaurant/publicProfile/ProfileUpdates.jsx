/**
 * Compact Updates feed for planned restaurant activity.
 * Hides when empty. Not a social wall.
 */
import { PROFILE_INK, PROFILE_MUTED, profileCardBorderVar } from "./profilePrimitives.jsx";

export default function ProfileUpdates({ updates = [], isMobile = false }) {
  const list = (Array.isArray(updates) ? updates : []).filter((u) =>
    String(u?.title || "").trim()
  );
  if (!list.length) return null;

  return (
    <section
      data-testid="profile-updates"
      aria-label="Updates"
      style={{ marginBottom: isMobile ? 20 : 28 }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: PROFILE_INK,
          marginBottom: 12,
        }}
      >
        Updates
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 8,
        }}
      >
        {list.map((update) => (
          <li
            key={update.id || update.title}
            data-testid="profile-update-row"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${profileCardBorderVar}`,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: PROFILE_INK, lineHeight: 1.35 }}>
              {update.title}
            </div>
            {update.body ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: PROFILE_MUTED,
                  lineHeight: 1.45,
                }}
              >
                {update.body}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
