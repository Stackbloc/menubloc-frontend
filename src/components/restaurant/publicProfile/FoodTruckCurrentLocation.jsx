/**
 * Food-truck current location module — restrained when unset.
 */
import MapPinIcon from "../../menu-templates/MapPinIcon.jsx";
import { PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

export default function FoodTruckCurrentLocation({
  locationText = "",
  directionsUrl = "",
  hasPostedLocation = false,
  statusLabel = "",
  name = "Food truck",
  onPhoto = false,
}) {
  const ink = onPhoto ? "#fafaf9" : PROFILE_INK;
  const muted = onPhoto ? "rgba(250,250,249,0.88)" : PROFILE_MUTED;
  const pinStroke = onPhoto ? "#fafaf9" : PROFILE_GREEN;
  return (
    <div
      data-testid="food-truck-current-location"
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.45, color: muted }}>
        {statusLabel ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: onPhoto ? "rgba(187,247,208,0.95)" : PROFILE_GREEN,
              marginBottom: 4,
            }}
          >
            {statusLabel}
          </div>
        ) : null}
        <span style={{ fontWeight: 700, color: ink }}>Current Location:</span>{" "}
        {hasPostedLocation && directionsUrl && locationText ? (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: muted, textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            {locationText}
          </a>
        ) : hasPostedLocation && locationText ? (
          <span>{locationText}</span>
        ) : (
          <span style={{ fontStyle: "italic" }}>Current location has not been posted.</span>
        )}
      </div>
      {directionsUrl ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open directions to ${name} in Google Maps`}
          title="Directions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            color: pinStroke,
            textDecoration: "none",
            background: onPhoto ? "rgba(28,25,23,0.28)" : "#ecfdf5",
            border: onPhoto ? "1px solid rgba(250,250,249,0.35)" : "1px solid #bbf7d0",
          }}
        >
          <MapPinIcon size={16} stroke={pinStroke} />
        </a>
      ) : null}
    </div>
  );
}
