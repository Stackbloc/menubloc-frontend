import { createContext, useContext } from "react";

/**
 * Menu Browser row action overrides. Defaults keep every other surface (public menu page,
 * search) unchanged; CatalogMenuRenderer provides { hideDishShare: true } because Invite
 * already covers sharing on Menu Browser rows. tapRowToAdd: on Menu Browser the menu is the
 * ordering surface — tapping an orderable row adds it to the basket instead of leaving for the
 * dish page (Andre, 2026-10-12).
 */
export const MenuRowActionsContext = createContext({ hideDishShare: false, hideComment: false, tapRowToAdd: false });

export function useMenuRowActions() {
  return useContext(MenuRowActionsContext);
}
