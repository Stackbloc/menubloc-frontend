import { useContext, useState } from "react";
import RestaurantVerificationBadge from "../RestaurantVerificationBadge.jsx";
import ShareModal from "../share/ShareModal.jsx";
import { trackShareEvent } from "../share/shareUtils.js";
import AppIcon from "../icons/AppIcon.jsx";
import {
  MenuHeaderShareContext,
  MenuHeaderTrailingActionContext,
} from "../menuCatalog/menuHeaderTrailingActionContext.js";
import {
  useIsNarrowMenuViewport,
  resolveMenuRowSpacing,
} from "./menuPresentationUtils.js";

/**
 * The app's "Share menu" pill (menuply-mobile MenuScreen): a compact labeled chip under the name,
 * in the menu's accent color, not a full-width bar.
 */
function ShareMenuPill({ share }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Share this menu"
        data-testid="menu-share"
        onClick={(e) => {
          e.stopPropagation();
          trackShareEvent("menu_share_clicked", share.analyticsContext);
          setOpen(true);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 999,
          border: "1.5px solid currentColor",
          background: "transparent",
          color: "inherit",
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.2,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        <AppIcon name="share" size={15} color="currentColor" />
        Share menu
      </button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        shareData={share.shareData}
        analyticsContext={share.analyticsContext}
        modalTitle="Share menu"
        variant="menu"
      />
    </>
  );
}

/**
 * Restaurant name + verification badge, then the header actions. Where the menu provides its share
 * data (Menu Browser, public menu page) the row is the app's: Share menu pill + ⓘ / bookmark;
 * elsewhere the template's icons (like + share + comment) as before.
 */
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
  const trailingAction = useContext(MenuHeaderTrailingActionContext);
  const share = useContext(MenuHeaderShareContext);
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
        {share?.shareData ? (
          <ShareMenuPill share={share} />
        ) : (
          <>
            {leadingAction}
            {actions}
          </>
        )}
        {trailingAction}
      </div>
    </div>
  );
}
