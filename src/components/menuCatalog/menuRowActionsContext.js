import { createContext, useContext } from "react";

/**
 * Menu Browser row action overrides. Every menu row shows Wish List · Like · Invite · Share;
 * hideDishShare stays for surfaces that already share the dish elsewhere. tapRowToAdd: on Menu Browser the menu is the
 * ordering surface — tapping an orderable row adds it to the basket instead of leaving for the
 * dish page (Andre, 2026-10-12).
 */
export const MenuRowActionsContext = createContext({ hideDishShare: false, tapRowToAdd: false });

export function useMenuRowActions() {
  return useContext(MenuRowActionsContext);
}
