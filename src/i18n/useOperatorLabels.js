import { useLanguage } from "../context/LanguageContext.jsx";

/** Shared operator UI strings (save, cancel, deals filters, etc.). */
export function useOperatorLabels() {
  const { t } = useLanguage();
  const labels = {
    save: t("operator.common.save", "Save"),
    saving: t("operator.common.saving", "Saving…"),
    loading: t("operator.common.loading", "Loading…"),
    cancel: t("operator.common.cancel", "Cancel"),
    delete: t("operator.common.delete", "Delete"),
    edit: t("operator.common.edit", "Edit"),
    publish: t("operator.common.publish", "Publish"),
    unpublish: t("operator.common.unpublish", "Unpublish"),
    add: t("operator.common.add", "Add"),
    search: t("operator.common.search", "Search"),
    noResults: t("operator.common.noResults", "No results"),
    newDeal: t("operator.deals.newDeal", "New deal"),
    filterAll: t("operator.deals.filterAll", "All"),
    filterActive: t("operator.deals.filterActive", "Active"),
    filterDraft: t("operator.deals.filterDraft", "Draft"),
    filterPaused: t("operator.deals.filterPaused", "Paused"),
    filterExpired: t("operator.deals.filterExpired", "Expired"),
    noDeals: t("operator.deals.noDeals", "No deals yet"),
    dealName: t("operator.deals.dealName", "Deal name"),
    dealType: t("operator.deals.dealType", "Deal type"),
    saveDeal: t("operator.deals.saveDeal", "Save deal"),
    statusLabel: (status) =>
      t(`operator.deals.status.${status}`, status || ""),
    noOrders: t("operator.orders.noOrders", "No orders yet"),
    view: t("operator.orders.view", "View"),
    markReady: t("operator.orders.markReady", "Mark ready"),
    complete: t("operator.orders.complete", "Complete"),
    addSection: t("operator.menu.addSection", "Add section"),
    addItem: t("operator.menu.addItem", "Add item"),
    unsaved: t("operator.menu.unsaved", "You have unsaved changes"),
    signOut: t("operator.myAccount.signOut", "Sign out"),
    pause: t("operator.deals.pause", "Pause"),
  };
  return { ...labels, t };
}
