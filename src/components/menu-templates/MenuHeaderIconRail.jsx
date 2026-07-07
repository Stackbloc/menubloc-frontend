import RestaurantVerificationBadge from "../RestaurantVerificationBadge.jsx";
import { MENU_ROW_HEADER_ICON_GAP } from "./menuPresentationUtils.js";

/** Restaurant name + verification badge, then like + share immediately after. */
export default function MenuHeaderNameWithActions({
  nameSlot,
  onActionsClick,
  actions,
  tone,
  claimStatus,
  subscriptionPlan,
  menuStatus,
  profileTier,
  listingStatus,
  planSlug,
  isPro,
  isPaidSubscriber,
  orderAcceptanceStatus,
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", minWidth: 0 }}>
      <div
        style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{nameSlot}</div>
        <RestaurantVerificationBadge
          size="md"
          tone={tone}
          claimStatus={claimStatus}
          subscriptionPlan={subscriptionPlan}
          menuStatus={menuStatus}
          profileTier={profileTier}
          listingStatus={listingStatus}
          planSlug={planSlug}
          isPro={isPro}
          isPaidSubscriber={isPaidSubscriber}
          orderAcceptanceStatus={orderAcceptanceStatus}
          style={{ marginLeft: 8 }}
        />
      </div>
      <div
        onClick={onActionsClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: MENU_ROW_HEADER_ICON_GAP,
          flexShrink: 0,
        }}
      >
        {actions}
      </div>
    </div>
  );
}
