import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  beginPageView,
  getCurrentPageView,
  observeImpression,
  trackEngagement,
} from "../lib/engagementTracking.js";

/**
 * Engagement tracking for one page.
 *
 * 1. Sends one page_view per navigation once `ready` (entity loaded): on mount and when the
 *    pathname or page entity changes. Query-string-only changes (tabs, filters) are not new
 *    views. Re-renders and StrictMode double effects reuse the same page view.
 * 2. Delegated clicks inside rootRef (resolved at click time): the closest element with
 *    data-mp-event is recorded, else classifyLink(anchor) is consulted.
 * 3. Impressions: elements with data-mp-impression="<event_name>" are measured
 *    (>= 50% visible for >= 1s), re-scanned when the DOM changes.
 *
 * Attributes (on the same element as data-mp-event / data-mp-impression):
 *   data-mp-restaurant-id, data-mp-menu-item-id, data-mp-deal-id, data-mp-ad-id,
 *   data-mp-ad-banner-id, data-mp-ad-inventory-id, data-mp-venue-event-id,
 *   data-mp-subtype, data-mp-label, data-mp-position
 *   data-mp-placement may sit on the element or any ancestor inside rootRef.
 *
 * classifyLink(anchor) — optional fallback for links without data-mp-event; return
 *   { event, fields, navigation } or null.
 */
export default function useEngagementPage(rootRef, { pageType, ready, restaurantId, clusterId, dealId, menuId, classifyLink } = {}) {
  const location = useLocation();
  const classifyRef = useRef(classifyLink);
  useEffect(() => {
    classifyRef.current = classifyLink;
  });

  useEffect(() => {
    if (!ready || !pageType) return;
    beginPageView({ pageType, restaurantId, clusterId, dealId, menuId, navigationKey: location.pathname });
  }, [ready, pageType, restaurantId, clusterId, dealId, menuId, location.pathname]);

  // Listeners live on document and resolve rootRef at event time: pages can render a splash or
  // loading tree first and mount the tracked root later.
  useEffect(() => {
    if (!ready || typeof document === "undefined") return undefined;

    function onClick(evt) {
      try {
        const root = rootRef?.current;
        if (!root || !getCurrentPageView()) return;
        const target = evt.target instanceof Element ? evt.target : null;
        if (!target || !root.contains(target)) return;
        const tagged = target.closest("[data-mp-event]");
        if (tagged && root.contains(tagged)) {
          const fields = fieldsFrom(tagged, root);
          // Franchise canonical (cmi:) items have no menu_items id — not countable as item clicks.
          if (tagged.dataset.mpEvent === "menu_item_click" && !fields.menu_item_id) return;
          const anchor = tagged.closest("a[href]");
          trackEngagement(tagged.dataset.mpEvent, fields, {
            target_restaurant_id: fields.restaurant_id,
            target_deal_id: fields.deal_id,
            href: anchor?.getAttribute("href") || null,
          });
          return;
        }
        const anchor = target.closest("a[href]");
        if (anchor && root.contains(anchor) && classifyRef.current) {
          const classified = classifyRef.current(anchor);
          if (classified?.event) trackEngagement(classified.event, classified.fields || {}, classified.navigation || null);
        }
      } catch {
        // tracking must never interfere with the click
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [rootRef, ready]);

  useEffect(() => {
    if (!ready || typeof document === "undefined") return undefined;
    let timer = null;

    function scan() {
      timer = null;
      try {
        const root = rootRef?.current;
        if (!root) return;
        root.querySelectorAll("[data-mp-impression]").forEach((el) => {
          observeImpression(el, el.dataset.mpImpression, fieldsFrom(el, root));
        });
      } catch {
        // ignore
      }
    }

    // Wait for the page view effect to register before the first scan.
    timer = setTimeout(scan, 0);
    let mutationObserver = null;
    if (typeof MutationObserver === "function" && document.body) {
      mutationObserver = new MutationObserver(() => {
        if (!timer) timer = setTimeout(scan, 300);
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      if (timer) clearTimeout(timer);
      mutationObserver?.disconnect();
    };
  }, [rootRef, ready, location.pathname]);
}

function fieldsFrom(el, root) {
  const d = el.dataset || {};
  const placementEl = el.closest("[data-mp-placement]");
  const placement = placementEl && root.contains(placementEl) ? placementEl.dataset.mpPlacement : null;
  const fields = {
    restaurant_id: num(d.mpRestaurantId),
    menu_item_id: num(d.mpMenuItemId),
    deal_id: num(d.mpDealId),
    advertisement_id: num(d.mpAdId),
    ad_default_banner_id: num(d.mpAdBannerId),
    ad_inventory_id: num(d.mpAdInventoryId),
    venue_event_id: num(d.mpVenueEventId),
    subtype: d.mpSubtype || null,
    label: d.mpLabel || null,
    position: d.mpPosition != null && d.mpPosition !== "" ? Number(d.mpPosition) : null,
    placement: placement || null,
  };
  const out = {};
  for (const [key, value] of Object.entries(fields)) if (value != null && value !== "" && !Number.isNaN(value)) out[key] = value;
  return out;
}

function num(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
