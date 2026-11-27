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

/**
 * Whether the menu header address shows its map pin. False on a franchise canonical (HQ)
 * record, whose line is "Franchise HQ: City, ST" with no pin and no link (Andre 2026-11-27).
 */
export const MenuAddressPinContext = createContext(true);
