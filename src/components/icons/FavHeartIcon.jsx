/** Fav heart — restaurants only (My Favs). Filled red when the restaurant is a Fav. */
export default function FavHeartIcon({ size = 15, filled = false, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.6-4.6-9.4-9.3C1.4 7.9 3.5 4.5 7.1 4.5c2.1 0 3.6 1.1 4.9 2.9 1.3-1.8 2.8-2.9 4.9-2.9 3.6 0 5.7 3.4 4.5 6.7-1.8 4.7-9.4 9.3-9.4 9.3Z" />
    </svg>
  );
}
