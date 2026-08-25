/**
 * Invite Me Out — pick one of a peer's want-to-eat items, then standard Invite to Eat date/time.
 */

import { useEffect, useMemo, useState } from "react";
import InviteToEatModal from "../../../components/InviteToEatModal.jsx";

function wantRestaurantId(want) {
  const id = want?.restaurant_id;
  if (id == null || String(id).trim() === "") return null;
  return id;
}

export default function InviteMeOutFlow({ open, onClose, peerName = "", wants = [] }) {
  const [selectedWant, setSelectedWant] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const invitableWants = useMemo(
    () => (wants || []).filter((row) => wantRestaurantId(row) != null),
    [wants]
  );

  useEffect(() => {
    if (!open) {
      setSelectedWant(null);
      setInviteOpen(false);
    }
  }, [open]);

  function closeAll() {
    setSelectedWant(null);
    setInviteOpen(false);
    onClose?.();
  }

  function handlePick(want) {
    if (!wantRestaurantId(want)) return;
    setSelectedWant(want);
    setInviteOpen(true);
  }

  function handleInviteClose() {
    closeAll();
  }

  if (!open && !inviteOpen) return null;

  const restaurantId = selectedWant ? wantRestaurantId(selectedWant) : null;

  return (
    <>
      {open && !inviteOpen ? (
        <div
          role="presentation"
          data-testid="invite-me-out-sheet"
          style={styles.backdrop}
          onClick={closeAll}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Invite Me Out"
            style={styles.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.head}>
              <p style={styles.title}>Invite Me Out</p>
              <button type="button" style={styles.close} onClick={closeAll} aria-label="Close">
                ✕
              </button>
            </div>
            <p style={styles.lead}>
              Pick something {peerName ? `${peerName} wants` : "they want"} to eat. You&apos;ll choose
              the date and time next.
            </p>
            {invitableWants.length === 0 ? (
              <p style={styles.empty} data-testid="invite-me-out-empty">
                No restaurant-linked wants yet — they need to link a place before you can invite them
                out.
              </p>
            ) : (
              <ul style={styles.list} data-testid="invite-me-out-options">
                {invitableWants.map((want) => {
                  const food = String(want.food_name || "").trim() || "Want";
                  const place = String(want.restaurant_name || "").trim();
                  return (
                    <li key={want.id} style={styles.item}>
                      <button
                        type="button"
                        style={styles.option}
                        data-testid={`invite-me-out-option-${want.id}`}
                        onClick={() => handlePick(want)}
                      >
                        <span style={styles.optionTitle}>{food}</span>
                        {place ? <span style={styles.optionMeta}>{place}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {(wants || []).length > invitableWants.length ? (
              <p style={styles.note} data-testid="invite-me-out-skipped">
                Wants without a linked restaurant can&apos;t be used for an outing invite yet.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {inviteOpen && restaurantId ? (
        <InviteToEatModal
          open
          onClose={handleInviteClose}
          restaurantId={restaurantId}
          restaurantName={selectedWant?.restaurant_name || ""}
          menuItemId={selectedWant?.menu_item_id || null}
          menuItemName={selectedWant?.food_name || null}
          initialInviteKind="private"
          initialInviteeName={peerName}
          lockInviteKind
          flowTitle="Invite Me Out"
        />
      ) : null}
    </>
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
    maxHeight: "min(88vh, 640px)",
    overflowY: "auto",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
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
  lead: {
    margin: "0 0 14px",
    fontSize: 14,
    lineHeight: 1.45,
    color: "#57534e",
  },
  empty: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    color: "#78716c",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 8,
  },
  item: {
    margin: 0,
  },
  option: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    border: "1px solid #e7e5e4",
    borderRadius: 12,
    background: "#fafaf9",
    padding: "12px 14px",
    cursor: "pointer",
    display: "grid",
    gap: 4,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
  },
  optionMeta: {
    fontSize: 13,
    color: "#57534e",
  },
  note: {
    margin: "12px 0 0",
    fontSize: 12,
    lineHeight: 1.4,
    color: "#78716c",
  },
};
