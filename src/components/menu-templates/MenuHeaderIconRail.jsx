import RestaurantVerificationBadge from "../RestaurantVerificationBadge.jsx";
import {
  useIsNarrowMenuViewport,
  resolveMenuRowSpacing,
} from "./menuPresentationUtils.js";

/** Restaurant name + verification badge, then like + share + comment immediately after. */
export default function MenuHeaderNameWithActions({
  nameSlot,
  onActionsClick,
  leadingAction = null,
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
  const isNarrow = useIsNarrowMenuViewport();
  const spacing = resolveMenuRowSpacing(isNarrow);

  return (
    <div
      data-testid="menu-header-name-actions"
      style={{
        display: "flex",
        alignItems: isNarrow ? "flex-start" : "center",
        gap: isNarrow ? 8 : 10,
        flexWrap: isNarrow ? "wrap" : "nowrap",
        minWidth: 0,
      }}
    >
      <div
        style={{
          minWidth: 0,
          flex: isNarrow ? "1 1 100%" : "0 1 auto",
          display: "flex",
          alignItems: "center",
          gap: 0,
          overflow: isNarrow ? "visible" : "hidden",
        }}
      >
        <div
          style={{
            minWidth: 0,
            overflow: isNarrow ? "visible" : "hidden",
            textOverflow: isNarrow ? undefined : "ellipsis",
            flex: isNarrow ? "1 1 auto" : undefined,
          }}
        >
          {nameSlot}
        </div>
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
          style={{ marginLeft: 8, flexShrink: 0 }}
        />
      </div>
      <div
        onClick={onActionsClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.headerIconGap,
          flexShrink: 0,
        }}
      >
        {leadingAction}
        {actions}
      </div>
    </div>
  );
}
