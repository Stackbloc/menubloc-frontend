/**
 * Invite to Eat entry — pick a restaurant, then open the existing InviteToEatModal flow.
 * LGD quick invite adds optional attached-menu selection on this page.
 *
 * Quick Invite (?quick_invite=1) follows the app (quick-invite.tsx, Andre 2026-11-13: "trying to do
 * too much on one screen") in two steps:
 *   1. "Quick Invite": a checklist of Connects (Open Invite · All my Connects checks everyone), plus
 *      typed names for people who aren't Connects; Next (n) › pinned to the bottom.
 *   2. "For <who> · Change", then What for? (only without a seed_code: Breakfast, Brunch, Lunch,
 *      Dinner, Late night, Coffee, Drinks, Meet me here), then the place (typed places allowed).
 * Checked Connects get it in Menuply (20 per request); typed names get the link via the share sheet.
 * From someone's row (to_user_id + to_name) that Connect is checked and it opens on step 2.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import InviteToEatModal from "../../components/InviteToEatModal.jsx";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";
import UnlistedPlaceLocation from "../../components/UnlistedPlaceLocation.jsx";
import { cleanPlaceLocation } from "../../lib/unlistedPlace.js";
import QuickInviteWhoStep from "./QuickInviteWhoStep.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listConnections } from "../../lib/consumerApi.js";
import { connectPeersFromResponse, groupName, QUICK_INVITES, quickInviteFor } from "../../lib/quickInviteWho.js";
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
  const urlSeedCode = String(searchParams.get("seed_code") || "").trim().toUpperCase();
  const quickInvite = searchParams.get("quick_invite") === "1";
  // From Today the meal is already picked (seed_code); from Profile step 2 asks What for? first.
  const [pickedCode, setPickedCode] = useState(null);
  const seedCode = urlSeedCode || pickedCode || "";
  const invite = quickInviteFor(seedCode);
  const isLgdQuickInvite = seedCode === "LGD";
  const { isAuthenticated } = useConsumer();
  // Today's Invite on a Connect (Andre 2026-11-13, as the app's /quick-invite?to=&toName=): that
  // Connect starts checked and the page opens on step 2 (Change still goes to step 1).
  const fromRow = useMemo(() => {
    const id = Number(searchParams.get("to_user_id"));
    const name = String(searchParams.get("to_name") || "").trim();
    return Number.isInteger(id) && id > 0 && name ? { id, name } : null;
  }, [searchParams]);
  const [step, setStep] = useState(() => (fromRow ? "details" : "who"));
  const [connects, setConnects] = useState(null);
  const [checked, setChecked] = useState(() => new Set(fromRow ? [fromRow.id] : []));
  const [picked, setPicked] = useState([]);

  useEffect(() => {
    if (!quickInvite || !isAuthenticated) return undefined;
    let alive = true;
    listConnections("accepted")
      .then((body) => alive && setConnects(connectPeersFromResponse(body)))
      .catch(() => alive && setConnects([]));
    return () => {
      alive = false;
    };
  }, [quickInvite, isAuthenticated]);

  // From a Connect's row before the list loads: still name them.
  const peers = useMemo(() => {
    if (connects == null && !fromRow) return null;
    const list = connects || [];
    return fromRow && !list.some((p) => p.id === fromRow.id) ? [{ id: fromRow.id, name: fromRow.name, avatarUrl: null, favoriteFoods: [] }, ...list] : list;
  }, [connects, fromRow]);
  const allOn = Boolean(peers?.length) && peers.every((p) => checked.has(p.id));
  const group = useMemo(
    () => ({
      connects: (peers || []).filter((p) => checked.has(p.id)).map((p) => ({ userId: p.id, name: p.name })),
      contacts: picked,
      ...(allOn && peers.length > 1 ? { allConnects: true } : {}),
    }),
    [peers, checked, picked, allOn]
  );
  const count = group.connects.length + group.contacts.length;
  const to = quickInvite && count ? { name: groupName(group), single: count === 1, group } : null;
  const needsWho = quickInvite && (step === "who" || !to);
  const needsWhat = quickInvite && !needsWho && !invite;

  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setChecked(allOn ? new Set() : new Set((peers || []).map((p) => p.id)));
  }
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
  // The app's header: step 1 "Quick Invite" (or the Today meal's phrase), step 2 the phrase or "What for?".
  const headerTitle = quickInvite
    ? step === "who"
      ? urlSeedCode && invite
        ? invite.phrase
        : "Quick Invite"
      : invite
        ? invite.phrase
        : "What for?"
    : isLgdQuickInvite
      ? "Let's Get Drinks"
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

  // A place the diner typed that is not on Menuply yet: no id, just a name.
  const unlistedPlaceName = !(selected?.restaurant_id || selected?.id)
    ? String(selected?.unlisted ? selected?.restaurant_name || "" : "").trim()
    : "";
  const hasPlace = Boolean(selected?.restaurant_id || selected?.id || unlistedPlaceName);
  // City/state (+ optional street) for that typed place; goes on the invitation (mig 0400).
  const [placeLocation, setPlaceLocation] = useState({ city: "", state: "", address: "" });

  function openFromPicker() {
    const restaurantId = selected?.restaurant_id || selected?.id;
    if (!restaurantId && !unlistedPlaceName) return;
    setResolved({
      restaurantId: restaurantId || null,
      restaurantName: restaurantId ? selected?.restaurant_name || selected?.name || "" : unlistedPlaceName,
      menuItemId: selected?.menu_item_id || null,
      menuItemName: selected?.item_name || null,
      attachedMenuId: isLgdQuickInvite ? attachedMenuId || null : null,
      placeLocation: restaurantId ? null : cleanPlaceLocation(placeLocation),
    });
    setModalOpen(true);
  }

  return (
    <>
      <StickyPageHeader title={headerTitle} />
      <main style={styles.main} data-testid="invite-to-eat-start">
        {isLgdQuickInvite && !needsWho ? (
          <h1 style={styles.lgdTitle} data-testid="lgd-quick-invite-title">
            {pageTitle}
          </h1>
        ) : null}
        {quickInvite ? null : (
          <p style={styles.lead}>
            {isLgdQuickInvite
              ? "Pick the bar or venue, optionally attach a drinks or full menu, then share the link. Friends can RSVP without a Menuply account."
              : "Pick a restaurant, set a time, then share your invitation."}
          </p>
        )}
        {loadingPrefill ? <p style={styles.muted}>Loading restaurant…</p> : null}
        {needsWho ? (
          <QuickInviteWhoStep
            peers={peers}
            checked={checked}
            onToggle={toggle}
            onToggleAll={toggleAll}
            picked={picked}
            onPicked={setPicked}
            signedIn={isAuthenticated}
            count={count}
            onNext={() => count && setStep("details")}
          />
        ) : null}
        {quickInvite && !needsWho ? (
          <div style={styles.chosen} data-testid="quick-invite-who-chosen">
            <div style={styles.chosenText}>
              <span style={styles.muted}>For</span>
              <strong style={styles.name}>{to.name}</strong>
            </div>
            <button type="button" style={styles.link} onClick={() => setStep("who")} data-testid="quick-invite-who-change">
              Change
            </button>
          </div>
        ) : null}
        {quickInvite && !needsWho && invite && !urlSeedCode ? (
          <div style={styles.chosen} data-testid="quick-invite-what-chosen">
            <div style={styles.chosenText}>
              <strong style={styles.name}>{invite.label}</strong>
              <span style={styles.muted}>{invite.phrase}</span>
            </div>
            <button type="button" style={styles.link} onClick={() => setPickedCode(null)} data-testid="quick-invite-what-change">
              Change
            </button>
          </div>
        ) : null}
        {needsWhat ? (
          <>
            <div style={styles.step}>What for?</div>
            <div style={styles.whatList} data-testid="quick-invite-what">
              {QUICK_INVITES.map((q) => (
                <button key={q.code} type="button" style={styles.whatRow} onClick={() => setPickedCode(q.code)} data-testid={`quick-invite-what-${q.code.toLowerCase()}`}>
                  <strong style={styles.name}>{q.label}</strong>
                  <span style={styles.link}>›</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
        {needsWho || needsWhat ? null : (
        <>
        {quickInvite ? <div style={styles.step}>{seedCode === "MMH" ? "Where should they meet you?" : "Pick the place"}</div> : null}
        <DiningCrewFoodEntityPicker
          messageType={messageType}
          onMessageTypeChange={setMessageType}
          selected={selected}
          onSelectedChange={setSelected}
          forceRestaurantOnly
          allowUnlisted
          hideNote
        />
        {unlistedPlaceName ? (
          <UnlistedPlaceLocation placeName={unlistedPlaceName} value={placeLocation} onChange={setPlaceLocation} />
        ) : null}
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
          style={hasPlace ? styles.primary : { ...styles.primary, color: "#a8a29e", cursor: "default" }}
          disabled={!hasPlace}
          onClick={openFromPicker}
          data-testid="invite-start-continue"
        >
          Continue ›
        </button>
        {quickInvite && invite ? (
          <p style={styles.muted}>Next you pick a time. &quot;{invite.phrase}&quot; is already in the message.</p>
        ) : null}
        </>
        )}
      </main>
      <InviteToEatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        restaurantId={resolved.restaurantId}
        restaurantName={resolved.restaurantName}
        menuItemId={resolved.menuItemId}
        menuItemName={resolved.menuItemName}
        attachedMenuId={resolved.attachedMenuId}
        placeLocation={resolved.placeLocation || null}
        initialSeedCode={seedCode || null}
        initialInviteeName={(to?.single ? to.name : "") || String(searchParams.get("invitee_name") || "").trim()}
        initialInviteKind={
          to?.single ||
          String(searchParams.get("invite_kind") || "").trim().toLowerCase() === "private" ||
          String(searchParams.get("invitee_name") || "").trim()
            ? "private"
            : String(searchParams.get("invite_kind") || "").trim().toLowerCase() === "group"
              ? "group"
              : to
                ? "group"
                : null
        }
        /* Typed names get the link from the share sheet; checked Connects get it in Menuply. */
        autoOpenShareOnReady={quickInvite && (!to || to.group.contacts.length > 0)}
        sendInAppGroup={to?.group.connects.length ? to.group.connects : null}
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
  step: { fontSize: 13, fontWeight: 700, color: "#0f7a24", margin: "4px 0 8px" },
  chosen: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 12, borderRadius: 12, border: "1px solid #e1e6e1", background: "#fff" },
  chosenText: { display: "grid", gap: 2, flex: 1, minWidth: 0 },
  name: { fontSize: 15, color: "#111613" },
  link: { border: "none", background: "none", padding: 0, color: "#0f7a24", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" },
  whatList: { borderRadius: 12, border: "1px solid #e1e6e1", background: "#fff", overflow: "hidden" },
  whatRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: 48,
    padding: "0 16px",
    border: "none",
    borderBottom: "1px solid #e1e6e1",
    background: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
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
  // Compact text action, no full-width bar or green pill (Andre 2026-10-29 / 2026-11-06).
  primary: {
    display: "block",
    marginTop: 16,
    marginLeft: "auto",
    padding: "8px 4px",
    border: "none",
    background: "none",
    color: "#15803d",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  },
};
