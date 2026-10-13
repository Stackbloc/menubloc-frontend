import { createContext } from "react";

/**
 * Optional extra icon at the end of the restaurant header row (after Comment).
 * Only the Menu Browser (CatalogMenuRenderer) provides it — the Bookmark toggle; every other
 * menu surface leaves it null, so headers render exactly as before.
 */
export const MenuHeaderTrailingActionContext = createContext(null);
