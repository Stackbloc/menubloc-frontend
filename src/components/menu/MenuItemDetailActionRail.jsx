import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import LikeMenuItemButton from "../LikeMenuItemButton.jsx";
import InviteToEatButton from "../InviteToEatButton.jsx";
import FoodCommentNavButton from "../FoodCommentNavButton.jsx";
import MenuItemSaveToMyMenuplyIcon from "../consumer/MenuItemSaveToMyMenuplyIcon.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import ViewMenuIcon from "../icons/ViewMenuIcon.jsx";
import { MENU_ROW_ICON_GAP, MENU_ROW_ICON_SIZE } from "../menu-templates/menuPresentationUtils.js";

const GHOST_ICON_SIZE = 14;

const ghostIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: MENU_ROW_ICON_SIZE,
  height: MENU_ROW_ICON_SIZE,
  minWidth: MENU_ROW_ICON_SIZE,
  minHeight: MENU_ROW_ICON_SIZE,
  padding: 0,
  borderRadius: "50%",
  border: "1px solid rgba(55,65,81,0.22)",
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  flexShrink: 0,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
  textDecoration: "none",
  cursor: "pointer",
  lineHeight: 0,
  verticalAlign: "middle",
};

function ViewFullMenuLink({ href, label = "View Full Menu" }) {
  return (
    <IconHoverLabel label={label}>
      <Link to={href} aria-label={label} title={label} style={ghostIconStyle}>
        <ViewMenuIcon size={GHOST_ICON_SIZE} />
      </Link>
    </IconHoverLabel>
  );
}

function ReturnToSearchButton({ onClick, label = "Return to results" }) {
  return (
    <IconHoverLabel label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        style={ghostIconStyle}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: GHOST_ICON_SIZE,
            lineHeight: 1,
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          ←
        </span>
      </button>
    </IconHoverLabel>
  );
}

/**
 * Detail-page action icons — same ghost controls as public menu rows.
 * Order: View Full Menu (or return-to-search), Like, Share, Invite, Comment.
 */
export default function MenuItemDetailActionRail({
  menuItemId,
  itemName,
  restaurantId = null,
  restaurantName = "",
  shareData,
  shareAnalyticsContext,
  fullMenuHref,
  fromSearch = false,
  onBack,
  returnLabel = "Return to results",
  iconGap = MENU_ROW_ICON_GAP,
  shareStopPropagation = false,
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        alignSelf: "flex-start",
        flexWrap: "nowrap",
        gap: iconGap,
        flex: "0 0 auto",
        flexShrink: 0,
        height: MENU_ROW_ICON_SIZE,
      }}
    >
      {fromSearch && onBack ? (
        <ReturnToSearchButton onClick={onBack} label={returnLabel} />
      ) : null}
      {fullMenuHref ? (
        <ViewFullMenuLink href={fullMenuHref} />
      ) : null}
      {menuItemId ? <LikeMenuItemButton menuItemId={menuItemId} tone="ghost" size="row" /> : null}
      {shareData ? (
        <ShareButton
          variant="dish"
          iconOnly={true}
          tone="ghost"
          label="Share"
          modalTitle={`Share ${itemName || "dish"}`}
          shareData={shareData}
          analyticsContext={shareAnalyticsContext}
          stopPropagation={shareStopPropagation}
        />
      ) : null}
      {restaurantId ? (
        <InviteToEatButton
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          menuItemId={menuItemId}
          menuItemName={itemName}
          tone="ghost"
          size="row"
        />
      ) : null}
      {menuItemId ? (
        <FoodCommentNavButton
          target="menu_item"
          menuItemId={menuItemId}
          tone="ghost"
          size="row"
        />
      ) : null}
      {showSaveToMyMenuply && menuItemId ? (
        <MenuItemSaveToMyMenuplyIcon
          menuItemId={menuItemId}
          foodName={itemName}
          returnTo={saveReturnTo}
        />
      ) : null}
    </div>
  );
}
