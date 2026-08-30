/**
 * Invite to Eat entry — pick a restaurant, then open the existing InviteToEatModal flow.
 */

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import InviteToEatModal from "../../components/InviteToEatModal.jsx";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";
import { resolveEatingPrefill } from "../../lib/foodActivityApi.js";

export default function InviteToEatStartPage() {
  const [searchParams] = useSearchParams();
  const seedCode = String(searchParams.get("seed_code") || "").trim().toUpperCase();
  const quickInvite = searchParams.get("quick_invite") === "1";
  const [messageType, setMessageType] = useState("restaurant");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolved, setResolved] = useState({ restaurantId: null, restaurantName: "", menuItemId: null, menuItemName: null });
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  useEffect(() => {
    const restaurantId = searchParams.get("restaurant_id");
    const menuItemId = searchParams.get("menu_item_id");
    if (!restaurantId && !menuItemId) return undefined;
    let cancelled = false;
    setLoadingPrefill(true);
    resolveEatingPrefill({ restaurantId, menuItemId })
      .then((next) => {
        if (cancelled) return;
        const restaurant = next.restaurant;
        const menuItem = next.menuItem;
        if (restaurant?.restaurant_id) {
          setResolved({
            restaurantId: restaurant.restaurant_id,
            restaurantName: restaurant.restaurant_name || "",
            menuItemId: menuItem?.menu_item_id || null,
            menuItemName: menuItem?.item_name || null,
          });
          setModalOpen(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPrefill(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function openFromPicker() {
    const restaurantId = selected?.restaurant_id || selected?.id;
    if (!restaurantId) return;
    setResolved({
      restaurantId,
      restaurantName: selected?.restaurant_name || selected?.name || "",
      menuItemId: selected?.menu_item_id || null,
      menuItemName: selected?.item_name || null,
    });
    setModalOpen(true);
  }

  return (
    <>
      <StickyPageHeader title="Invite to Eat" />
      <main style={styles.main} data-testid="invite-to-eat-start">
        <p style={styles.lead}>
          {quickInvite
            ? "Pick a restaurant, set the details, then share the link by text or Copy Link. Your friend can RSVP without a Menuply account."
            : "Pick a restaurant, set a time, then share your invitation."}
        </p>
        {loadingPrefill ? <p style={styles.muted}>Loading restaurant…</p> : null}
        <DiningCrewFoodEntityPicker
          messageType={messageType}
          onMessageTypeChange={setMessageType}
          selected={selected}
          onSelectedChange={setSelected}
          forceRestaurantOnly
          hideNote
        />
        <button
          type="button"
          style={styles.primary}
          disabled={!(selected?.restaurant_id || selected?.id)}
          onClick={openFromPicker}
        >
          Continue
        </button>
      </main>
      <InviteToEatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        restaurantId={resolved.restaurantId}
        restaurantName={resolved.restaurantName}
        menuItemId={resolved.menuItemId}
        menuItemName={resolved.menuItemName}
        initialSeedCode={seedCode || null}
        autoOpenShareOnReady={quickInvite}
      />
      <BottomNav />
    </>
  );
}

const styles = {
  main: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "12px 16px calc(var(--bottom-nav-h, 72px) + 24px)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  lead: { margin: "0 0 16px", fontSize: 14, color: "#4b5563", lineHeight: 1.45 },
  muted: { fontSize: 13, color: "#6b7280" },
  primary: {
    marginTop: 16,
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  },
};
