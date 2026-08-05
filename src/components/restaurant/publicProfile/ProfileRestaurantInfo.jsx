/**
 * Compact restaurant information — hours, phone, address, website, social.
 */
import { Link } from "react-router-dom";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileCardBorderVar,
  profileAccentVar,
  formatHoursRows,
  firstNonEmpty,
} from "./profilePrimitives.jsx";
import { formatWebsiteHostLabel } from "../../../lib/formatWebsiteHostLabel.js";

export default function ProfileRestaurantInfo({
  operatingHours = [],
  phone = "",
  streetAddr = "",
  cityLine = "",
  directionsUrl = "",
  website = "",
  websiteRaw = "",
  instagram = "",
  claimHref = null,
  claimState = null,
  showClaimInvites = false,
  isMobile = false,
}) {
  const hoursRows = formatHoursRows(operatingHours);
  const websiteLabel = formatWebsiteHostLabel(websiteRaw || website);
  const ig = firstNonEmpty(instagram);
  const igHref = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${String(ig).replace(/^@/, "")}`
    : "";

  const hasContact = Boolean(phone || streetAddr || cityLine || website || igHref);
  const hasAnything = hoursRows.length > 0 || hasContact || (showClaimInvites && claimHref);
  if (!hasAnything) return null;

  return (
    <section
      data-testid="profile-restaurant-info"
      aria-label="Restaurant Information"
      style={{ marginBottom: isMobile ? 24 : 32 }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: PROFILE_INK,
          marginBottom: 12,
        }}
      >
        Information
      </div>
      <div
        style={{
          padding: isMobile ? "12px 14px" : "14px 16px",
          borderRadius: 14,
          border: `1px solid ${profileCardBorderVar}`,
          background: "#fff",
          display: "grid",
          gap: 10,
          fontSize: 14,
          color: PROFILE_INK,
          lineHeight: 1.45,
        }}
      >
        {hoursRows.length ? (
          <div data-testid="profile-info-hours">
            <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 6 }}>
              Hours
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              {hoursRows.map((row) => (
                <div
                  key={row.day}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: PROFILE_MUTED, fontWeight: 600 }}>{row.day}</span>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {phone ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 2 }}>
              Phone
            </div>
            <a
              href={`tel:${String(phone).replace(/\s+/g, "")}`}
              style={{ color: PROFILE_INK, textDecoration: "none", fontWeight: 600 }}
            >
              {phone}
            </a>
          </div>
        ) : null}

        {(streetAddr || cityLine) && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 2 }}>
              Address
            </div>
            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: PROFILE_INK, textDecoration: "none", fontWeight: 600 }}
              >
                {streetAddr ? <div>{streetAddr}</div> : null}
                {cityLine ? <div>{cityLine}</div> : null}
              </a>
            ) : (
              <>
                {streetAddr ? <div>{streetAddr}</div> : null}
                {cityLine ? <div>{cityLine}</div> : null}
              </>
            )}
          </div>
        )}

        {website ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 2 }}>
              Website
            </div>
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              style={{ color: profileAccentVar, textDecoration: "none", fontWeight: 600 }}
            >
              {websiteLabel} ↗
            </a>
          </div>
        ) : null}

        {igHref ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 2 }}>
              Instagram
            </div>
            <a
              href={igHref}
              target="_blank"
              rel="noreferrer"
              style={{ color: profileAccentVar, textDecoration: "none", fontWeight: 600 }}
            >
              {ig.startsWith("@") ? ig : `@${String(ig).replace(/^@/, "")}`}
            </a>
          </div>
        ) : null}

        {showClaimInvites && claimHref ? (
          <Link
            to={claimHref}
            state={claimState || undefined}
            data-testid="profile-info-claim"
            style={{
              marginTop: 4,
              fontSize: 13,
              fontWeight: 700,
              color: profileAccentVar,
              textDecoration: "none",
            }}
          >
            Claim this profile →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
