/**
 * Standard public-menu address: street on line 1, city/state(/zip) on line 2.
 * Used by menu header templates so locality never runs inline after the street.
 */
export default function MenuAddressLines({
  addressLine1,
  addressLine2,
  addressLine,
  style,
}) {
  const line1 = String(addressLine1 || "").trim();
  const line2 = String(addressLine2 || "").trim();
  const fallback = String(addressLine || "").trim();

  if (!line1 && !line2 && !fallback) return null;

  if (line1 || line2) {
    return (
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1,
          ...style,
        }}
      >
        {line1 ? <span>{line1}</span> : null}
        {line2 ? <span>{line2}</span> : null}
      </span>
    );
  }

  return <span style={style}>{fallback}</span>;
}
