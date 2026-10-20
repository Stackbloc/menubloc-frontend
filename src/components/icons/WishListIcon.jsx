/**
 * Wish List — fork, plate, knife on a 24 grid so it stays legible at row size (14px).
 * Same glyph on the Feed rail, menu rows and the profile Wish List header.
 */
export default function WishListIcon({ size = 15, filled = false, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 3v4.5a2 2 0 0 0 4 0V3M5.5 9.5V21" />
      <circle cx="13.5" cy="12.5" r="4.6" fill={filled ? color : "none"} />
      <path d="M20.5 3c-1.4.9-1.9 2.9-1.9 5.2V12h1.9v9" />
    </svg>
  );
}
