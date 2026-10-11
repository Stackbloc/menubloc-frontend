import { createContext } from "react";

/**
 * Optional extra icon at the end of the restaurant header row (after Comment).
 * Only the Feed's Menu Browser provides it (Order button); every other menu surface
 * leaves it null, so headers render exactly as before.
 */
export const MenuHeaderTrailingActionContext = createContext(null);
