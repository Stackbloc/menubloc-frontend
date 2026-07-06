import React from "react";
import { useParams } from "react-router-dom";
import { isValidMenuItemRouteId } from "../lib/menuItemIdentity.js";
import MenuItemDetailPage from "./MenuItemDetailPage.jsx";
import MarketMenuItemPage from "./MarketMenuItemPage.jsx";

/**
 * Canonical menu-item URLs end with either a CK/cmi route id (detail page)
 * or a text slug (legacy SEO resolver via MarketMenuItemPage).
 */
export default function MenuItemCanonicalRoute() {
  const { itemSlug } = useParams();
  if (isValidMenuItemRouteId(itemSlug)) {
    return <MenuItemDetailPage />;
  }
  return <MarketMenuItemPage />;
}
