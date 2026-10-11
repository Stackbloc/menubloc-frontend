import { createContext, useContext } from "react";

/**
 * Menu Browser row action overrides. Defaults keep every other surface (public menu page,
 * search) unchanged; CatalogMenuRenderer provides { hideDishShare: true } because Invite
 * already covers sharing on Menu Browser rows.
 */
export const MenuRowActionsContext = createContext({ hideDishShare: false, hideComment: false });

export function useMenuRowActions() {
  return useContext(MenuRowActionsContext);
}
