import {
  buildMenuVerificationAttributionText,
  buildRestaurantStatusLightProps,
  shouldShowMenuVerificationAttribution,
} from "../../lib/restaurantStatusLight.js";

/** Footer attribution for verified / paid restaurant menus. */
export default function MenuVerificationFooter({ data, tone, menuLastVerifiedAt, color = "#64748b" }) {
  const props = buildRestaurantStatusLightProps(data);
  const resolvedTone = tone || props.tone;
  const verifiedAt = menuLastVerifiedAt || props.menuLastVerifiedAt;
  if (!shouldShowMenuVerificationAttribution(resolvedTone)) return null;

  const text = buildMenuVerificationAttributionText(verifiedAt);
  if (!text) return null;

  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 16,
        borderTop: "1px solid rgba(15, 23, 42, 0.08)",
        fontSize: 12,
        lineHeight: 1.5,
        color,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
