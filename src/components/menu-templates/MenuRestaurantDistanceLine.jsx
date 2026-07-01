const MAX_DISPLAY_MILES = 50;

export function formatRestaurantDistanceMiles(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > MAX_DISPLAY_MILES) return null;
  if (n < 0.1) return "< 0.1 mi away";
  return `${n.toFixed(1)} mi away`;
}

/** Shown below restaurant address on nearby browse menus. */
export default function MenuRestaurantDistanceLine({
  miles,
  color = "inherit",
  indent = 18,
  style = {},
}) {
  const text = formatRestaurantDistanceMiles(miles);
  if (!text) return null;

  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 500,
        color,
        marginTop: 4,
        paddingLeft: indent,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
