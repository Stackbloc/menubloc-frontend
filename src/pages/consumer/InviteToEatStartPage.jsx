/**
 * Invite to Eat entry — pick a restaurant, then open the existing InviteToEatModal flow.
 * LGD quick invite adds optional attached-menu selection on this page.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import InviteToEatModal from "../../components/InviteToEatModal.jsx";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";
import { resolveEatingPrefill } from "../../lib/foodActivityApi.js";
import { fetchRestaurantMenuCatalog } from "../../lib/api.js";
import { buildLgdQuickInviteFormTitle } from "../../lib/eatInviteShareCopy.js";

function menuAttachmentLabel(menu) {
  const label =
    String(menu?.tab_label || menu?.display_name || menu?.name || "Menu").trim() || "Menu";
  const type = String(menu?.menu_type || "").trim().toLowerCase();
  if (type === "drinks") return `${label} (drinks menu)`;
  if (type === "main") return `${label} (full menu)`;
  if (type) return `${label} (${type.replace(/_/g, " ")})`;
  return label;
}

function sortMenusForLgd(menus = []) {
  return [...menus].sort((a, b) => {
    const aDrinks = String(a?.menu_type || "").toLowerCase() === "drinks" ? 0 : 1;
    const bDrinks = String(b?.menu_type || "").toLowerCase() === "drinks" ? 0 : 1;
    if (aDrinks !== bDrinks) return aDrinks - bDrinks;
    const aPrimary = a?.is_primary ? 0 : 1;
    const bPrimary = b?.is_primary ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return String(menuAttachmentLabel(a)).localeCompare(String(menuAttachmentLabel(b)));
  });
}

export default function InviteToEatStartPage() {
  const [searchParams] = useSearchParams();
  const seedCode = String(searchParams.get("seed_code") || "").trim().toUpperCase();
  const isLgdQuickInvite = seedCode === "LGD";
  const quickInvite = searchParams.get("quick_invite") === "1";
  const [messageType, setMessageType] = useState("restaurant");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolved, setResolved] = useState({
    restaurantId: null,
    restaurantName: "",
    menuItemId: null,
    menuItemName: null,
    attachedMenuId: null,
  });
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [menuOptions, setMenuOptions] = useState([]);
  const [menuOptionsLoading, setMenuOptionsLoading] = useState(false);
  const [menuOptionsError, setMenuOptionsError] = useState("");
  const [attachedMenuId, setAttachedMenuId] = useState(null);

  const selectedPlaceName = useMemo(() => {
    return String(selected?.restaurant_name || selected?.name || "").trim();
  }, [selected]);

  const pageTitle = isLgdQuickInvite
    ? buildLgdQuickInviteFormTitle(selectedPlaceName)
    : "Invite to Eat";

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
            attachedMenuId: null,
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

  useEffect(() => {
    if (!isLgdQuickInvite) {
      setMenuOptions([]);
      setMenuOptionsError("");
      setAttachedMenuId(null);
      return undefined;
    }
    const restaurantId = selected?.restaurant_id || selected?.id;
    if (!restaurantId) {
      setMenuOptions([]);
      setMenuOptionsError("");
      setAttachedMenuId(null);
      return undefined;
    }
    let cancelled = false;
    setMenuOptionsLoading(true);
    setMenuOptionsError("");
    fetchRestaurantMenuCatalog(restaurantId)
      .then((data) => {
        if (cancelled) return;
        const menus = sortMenusForLgd(Array.isArray(data?.menus) ? data.menus : []);
        setMenuOptions(menus);
        setAttachedMenuId(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setMenuOptions([]);
        setAttachedMenuId(null);
        setMenuOptionsError(err?.message || "Could not load menus for this place");
      })
      .finally(() => {
        if (!cancelled) setMenuOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLgdQuickInvite, selected]);

  function openFromPicker() {
    const restaurantId = selected?.restaurant_id || selected?.id;
    if (!restaurantId) return;
    setResolved({
      restaurantId,
      restaurantName: selected?.restaurant_name || selected?.name || "",
      menuItemId: selected?.menu_item_id || null,
      menuItemName: selected?.item_name || null,
      attachedMenuId: isLgdQuickInvite ? attachedMenuId || null : null,
    });
    setModalOpen(true);
  }

  return (
    <>
      <StickyPageHeader title={isLgdQuickInvite ? "Let's Get Drinks" : "Invite to Eat"} />
      <main style={styles.main} data-testid="invite-to-eat-start">
        {isLgdQuickInvite ? (
          <h1 style={styles.lgdTitle} data-testid="lgd-quick-invite-title">
            {pageTitle}
          </h1>
        ) : null}
        <p style={styles.lead}>
          {isLgdQuickInvite
            ? "Pick the bar or venue, optionally attach a drinks or full menu, then share the link. Friends can RSVP without a Menuply account."
            : quickInvite
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
        {isLgdQuickInvite && (selected?.restaurant_id || selected?.id) ? (
          <fieldset
            data-testid="lgd-attached-menu-fieldset"
            style={styles.menuFieldset}
            disabled={menuOptionsLoading}
          >
            <legend style={styles.menuLegend}>Attach a menu (optional)</legend>
            {menuOptionsLoading ? (
              <p style={styles.muted}>Loading menus…</p>
            ) : menuOptionsError ? (
              <p style={styles.menuError} role="alert">
                {menuOptionsError}
              </p>
            ) : menuOptions.length === 0 ? (
              <p style={styles.muted}>No published menus yet — you can still send the invite.</p>
            ) : (
              <div style={styles.menuOptions}>
                <label style={styles.menuOption}>
                  <input
                    type="radio"
                    name="lgd-attached-menu"
                    checked={!attachedMenuId}
                    onChange={() => setAttachedMenuId(null)}
                    data-testid="lgd-attached-menu-none"
                  />
                  <span>No menu attached</span>
                </label>
                {menuOptions.map((menu) => (
                  <label key={menu.id} style={styles.menuOption}>
                    <input
                      type="radio"
                      name="lgd-attached-menu"
                      checked={Number(attachedMenuId) === Number(menu.id)}
                      onChange={() => setAttachedMenuId(menu.id)}
                      data-testid={`lgd-attached-menu-${menu.id}`}
                    />
                    <span>{menuAttachmentLabel(menu)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ) : null}
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
        attachedMenuId={resolved.attachedMenuId}
        initialSeedCode={seedCode || null}
        autoOpenShareOnReady={quickInvite}
        flowTitle={
          isLgdQuickInvite
            ? buildLgdQuickInviteFormTitle(resolved.restaurantName || selectedPlaceName)
            : "Invite to Eat"
        }
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
  lgdTitle: {
    margin: "0 0 12px",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.35,
    color: "#1c1917",
  },
  lead: { margin: "0 0 16px", fontSize: 14, color: "#4b5563", lineHeight: 1.45 },
  muted: { fontSize: 13, color: "#6b7280", margin: 0 },
  menuFieldset: {
    margin: "16px 0 0",
    padding: 0,
    border: "none",
    display: "grid",
    gap: 10,
  },
  menuLegend: { fontSize: 12, fontWeight: 700, padding: 0, marginBottom: 4, color: "#292524" },
  menuOptions: { display: "grid", gap: 8 },
  menuOption: {
    display: "grid",
    gridTemplateColumns: "16px minmax(0, 1fr)",
    columnGap: 10,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e7e5e4",
    background: "#fafaf9",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 600,
    color: "#292524",
    cursor: "pointer",
  },
  menuError: { margin: 0, fontSize: 13, color: "#b91c1c" },
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
