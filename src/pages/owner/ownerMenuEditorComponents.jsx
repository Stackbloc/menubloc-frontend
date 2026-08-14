/**
 * Owner adapter over the shared CK MenuEditor.
 * Preserves prior imports from OwnerMenuCreateWorkspace / OwnerMenuEditorPage.
 */
import React from "react";
import { EmptyState, OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import {
  MenuEditor as SharedMenuEditor,
  StatusChip as SharedStatusChip,
  inputStyle as sharedInputStyle,
} from "../../components/menuEditor/SharedMenuEditor.jsx";
import {
  addMenuConsoleItem,
  updateMenuConsoleItem,
  deleteMenuConsoleItem,
  updateMenuConsoleMenu,
  publishMenuConsoleMenu,
  unpublishMenuConsoleMenu,
  deleteMenuConsoleMenu,
  putMenuConsoleItemModifierGroups,
  getMenuConsoleItemModifierGroups,
  listMenuConsoleItemPhotos,
  uploadMenuConsoleItemPhoto,
  deleteMenuConsoleItemPhoto,
} from "../../lib/ownerApi.js";

export const inputStyle = sharedInputStyle;
export const StatusChip = SharedStatusChip;

const ownerMenuApi = {
  updateItem: updateMenuConsoleItem,
  deleteItem: deleteMenuConsoleItem,
  addItem: addMenuConsoleItem,
  updateMenu: updateMenuConsoleMenu,
  publishMenu: publishMenuConsoleMenu,
  unpublishMenu: unpublishMenuConsoleMenu,
  deleteMenu: deleteMenuConsoleMenu,
  putModifierGroups: putMenuConsoleItemModifierGroups,
  getModifierGroups: getMenuConsoleItemModifierGroups,
  listItemPhotos: listMenuConsoleItemPhotos,
  uploadItemPhoto: uploadMenuConsoleItemPhoto,
  deleteItemPhoto: deleteMenuConsoleItemPhoto,
};

export function MenuEditor(props) {
  return (
    <SharedMenuEditor
      {...props}
      api={ownerMenuApi}
      colors={OWNER_COLORS}
      PageCard={PageCard}
      EmptyState={EmptyState}
      allowDeleteMenu
    />
  );
}

export default MenuEditor;
