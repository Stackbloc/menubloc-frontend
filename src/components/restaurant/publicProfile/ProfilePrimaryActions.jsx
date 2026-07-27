/**
 * Primary profile actions — Order / Claim only.
 * Phone, website, directions live once in the hero (Maps + contact).
 */
import { Link } from "react-router-dom";
import { actionChipStyle, canShowOrderAction } from "./profilePrimitives.jsx";

export default function ProfilePrimaryActions({
  profile = null,
  menuHref = null,
  directionsUrl = null,
  phone = "",
  website = "",
  claimHref = null,
  claimState = null,
  claimLabel = "Claim This Profile",
  isMobile = false,
}) {
  void directionsUrl;
  void phone;
  void website;
  const showOrder = canShowOrderAction(profile, menuHref);

  const chips = [];
  if (showOrder) {
    chips.push(
      <Link key="order" to={menuHref} style={actionChipStyle()} data-testid="profile-action-order">
        Order
      </Link>
    );
  }
  if (claimHref) {
    chips.push(
      <Link
        key="claim"
        to={claimHref}
        state={claimState || undefined}
        style={actionChipStyle()}
        data-testid="profile-action-claim"
      >
        {claimLabel}
      </Link>
    );
  }

  if (!chips.length) return null;

  return (
    <div
      data-testid="profile-primary-actions"
      style={{
        display: "flex",
        flexWrap: isMobile ? "nowrap" : "wrap",
        gap: 8,
        overflowX: isMobile ? "auto" : "visible",
        paddingBottom: isMobile ? 4 : 0,
        marginBottom: 16,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {chips}
    </div>
  );
}
