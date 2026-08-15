/**
 * Compact restaurant information — hours, phone, address, website, social.
 * Unclaimed missing fields render as fill-in-the-blank claim prompts.
 */
import { Link } from "react-router-dom";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileAccentVar,
  formatHoursRows,
  firstNonEmpty,
  profileReadableSurfaceStyle,
} from "./profilePrimitives.jsx";
import { formatWebsiteHostLabel } from "../../../lib/formatWebsiteHostLabel.js";
import { formatFoodTruckHoursTodayHeading } from "../../../lib/formatOperatingHours.js";

function InfoBlank({ testId, label }) {
  return (
    <div data-testid={testId}>
      <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: PROFILE_MUTED, fontStyle: "italic" }}>
        Claim this profile to complete
      </div>
    </div>
  );
}

export default function ProfileRestaurantInfo({
  operatingHours = [],
  timezone = null,
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
  const hoursRows = formatHoursRows(operatingHours, {
    timezone,
    includeTodayLine: false,
  });
  const hoursLabel = `${formatFoodTruckHoursTodayHeading(timezone)}:`;
  const websiteLabel = formatWebsiteHostLabel(websiteRaw || website);
  const ig = firstNonEmpty(instagram);
  const igHref = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${String(ig).replace(/^@/, "")}`
    : "";

  const hasContact = Boolean(phone || streetAddr || cityLine || website || igHref);
  const hasAnything = hoursRows.length > 0 || hasContact || showClaimInvites;
  if (!hasAnything) return null;

  const claimTo = claimHref && claimHref !== "#claim-profile" ? claimHref : "/onboarding";

  return (
    <section
      data-testid="profile-restaurant-info"
      data-profile-surface="card"
      aria-label="Restaurant Information"
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 24 : 32,
        padding: isMobile ? "12px 14px" : "14px 16px",
      })}
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
              {hoursLabel}
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              {hoursRows.map((row) => (
                <div
                  key={row.day}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: PROFILE_MUTED, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {row.day}
                  </span>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : showClaimInvites ? (
          <InfoBlank testId="profile-info-hours-blank" label="Hours" />
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
        ) : showClaimInvites ? (
          <InfoBlank testId="profile-info-phone-blank" label="Phone" />
        ) : null}

        {streetAddr || cityLine ? (
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
        ) : showClaimInvites ? (
          <InfoBlank testId="profile-info-address-blank" label="Address" />
        ) : null}

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
        ) : showClaimInvites ? (
          <InfoBlank testId="profile-info-website-blank" label="Website" />
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
        ) : showClaimInvites ? (
          <InfoBlank testId="profile-info-instagram-blank" label="Instagram" />
        ) : null}

        {showClaimInvites ? (
          <Link
            to={claimTo}
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
            Claim this profile to complete →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
