import { createContext } from "react";

/**
 * Optional extra icon at the end of the restaurant header row (after Comment).
 * Only the Menu Browser (CatalogMenuRenderer) provides it — the Bookmark toggle; every other
 * menu surface leaves it null, so headers render exactly as before.
 */
export const MenuHeaderTrailingActionContext = createContext(null);

/**
 * The menu's share data ({ shareData, analyticsContext }). When provided, the header shows the app's
 * labeled "Share menu" pill under the name instead of the template's icon row (app wins, Andre
 * 2026-10-29: menuply-mobile MenuScreen header is ‹ name ⓘ + Share menu).
 */
export const MenuHeaderShareContext = createContext(null);
