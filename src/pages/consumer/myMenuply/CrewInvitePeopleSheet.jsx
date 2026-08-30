/**
 * Invite people to a Dining Crew — share link or pick an existing Connection.
 */

import { formatDinerPeerLabel } from "../../../lib/dinerPublicIdentity.js";

export default function CrewInvitePeopleSheet({
  open,
  crewName = "",
  connections = [],
  memberUserIds = [],
  busy = false,
  onClose,
  onShareLink,
  onInviteConnection,
}) {
  if (!open) return null;

  const memberSet = new Set((memberUserIds || []).map((id) => Number(id)).filter(Boolean));
  const inviteable = (connections || []).filter((row) => {
    const peerId = Number(row?.peer?.id || row?.id);
    return peerId && !memberSet.has(peerId);
  });

  return (
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid="crew-invite-people-sheet"
      onClick={() => onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invite people to join"
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.head}>
          <p style={styles.title}>Invite people to join</p>
          <button type="button" style={styles.close} onClick={() => onClose?.()} aria-label="Close">
            ✕
          </button>
        </div>
        {crewName ? (
          <p style={styles.lead}>
            Invite someone to <strong>{crewName}</strong>.
          </p>
        ) : (
          <p style={styles.lead}>Share a join link or invite a Connection directly.</p>
        )}

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Share join link</h3>
          <p style={styles.hint}>Anyone with the link can open it and join (subject to crew approval rules).</p>
          <button
            type="button"
            style={styles.primaryBtn}
            disabled={busy}
            data-testid="crew-invite-share-link"
            onClick={() => onShareLink?.()}
          >
            Copy Link / share
          </button>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Invite a Connection</h3>
          <p style={styles.hint}>
            Pick someone you&apos;re already connected with on Menuply. You&apos;ll get a link to send them.
          </p>
          {inviteable.length === 0 ? (
            <p style={styles.empty} data-testid="crew-invite-no-connections">
              No Connections available to invite yet. Use Find Diners or your Diner QR to connect first.
            </p>
          ) : (
            <ul style={styles.list}>
              {inviteable.map((row) => {
                const peer = row.peer || row;
                const peerId = Number(peer.id);
                const label = formatDinerPeerLabel(peer) || "Connection";
                return (
                  <li key={peerId}>
                    <button
                      type="button"
                      style={styles.rowBtn}
                      disabled={busy}
                      data-testid={`crew-invite-connection-${peerId}`}
                      onClick={() => onInviteConnection?.(peerId, peer)}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
    maxHeight: "min(78vh, 560px)",
    overflowY: "auto",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
  },
  lead: { margin: "0 0 12px", fontSize: 13, color: "#64748b", lineHeight: 1.45 },
  section: {
    borderTop: "1px solid #f2f4f7",
    paddingTop: 14,
    marginTop: 14,
  },
  sectionTitle: { margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#0f172a" },
  hint: { margin: "0 0 10px", fontSize: 13, color: "#64748b", lineHeight: 1.45 },
  primaryBtn: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  empty: { margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.45 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  rowBtn: {
    width: "100%",
    textAlign: "left",
    border: 0,
    background: "transparent",
    padding: "12px 4px",
    borderTop: "1px solid #f2f4f7",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    color: "#1F4E3D",
  },
};
