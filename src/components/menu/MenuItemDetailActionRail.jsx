import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import LikeMenuItemButton from "../LikeMenuItemButton.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import ViewMenuIcon from "../icons/ViewMenuIcon.jsx";
import { MENU_ROW_ICON_GAP } from "../menu-templates/menuPresentationUtils.js";

const GHOST_ICON_DIM = 28;

const ghostIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: GHOST_ICON_DIM,
  height: GHOST_ICON_DIM,
  padding: 0,
  borderRadius: "50%",
  border: "1px solid rgba(55,65,81,0.22)",
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  flexShrink: 0,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
  textDecoration: "none",
  cursor: "pointer",
};

function ViewFullMenuLink({ href, label = "View Full Menu" }) {
  return (
    <IconHoverLabel label={label}>
      <Link to={href} aria-label={label} title={label} style={ghostIconStyle}>
        <ViewMenuIcon size={14} />
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
        <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 700 }} aria-hidden="true">
          ←
        </span>
      </button>
    </IconHoverLabel>
  );
}

/**
 * Detail-page action icons — same ghost controls as public menu rows.
 * Order: View Full Menu (or return-to-search), Like, Share.
 */
export default function MenuItemDetailActionRail({
  menuItemId,
  itemName,
  shareData,
  shareAnalyticsContext,
  fullMenuHref,
  fromSearch = false,
  onBack,
  returnLabel = "Return to results",
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: MENU_ROW_ICON_GAP,
        flex: "0 0 auto",
        flexShrink: 0,
      }}
    >
      {fromSearch ? (
        <ReturnToSearchButton onClick={onBack} label={returnLabel} />
      ) : fullMenuHref ? (
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
        />
      ) : null}
    </div>
  );
}
