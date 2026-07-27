/**
 * Primary profile actions — Order / Call / Website / Claim only.
 * View Menu is the hero icon + compact preview; Maps is the hero address.
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
  const showOrder = canShowOrderAction(profile, menuHref);
  const tel = phone ? `tel:${String(phone).replace(/\s+/g, "")}` : "";

  const chips = [];
  if (showOrder) {
    chips.push(
      <Link key="order" to={menuHref} style={actionChipStyle()} data-testid="profile-action-order">
        Order
      </Link>
    );
  }
  if (tel) {
    chips.push(
      <a key="call" href={tel} style={actionChipStyle()} data-testid="profile-action-call">
        Call
      </a>
    );
  }
  if (website) {
    chips.push(
      <a
        key="website"
        href={website}
        target="_blank"
        rel="noreferrer"
        style={actionChipStyle()}
        data-testid="profile-action-website"
      >
        Website
      </a>
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
        marginBottom: 20,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {chips}
    </div>
  );
}
