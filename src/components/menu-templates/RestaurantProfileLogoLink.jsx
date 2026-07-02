import { Link } from "react-router-dom";

/** Wraps restaurant logo in a profile link when href is available. */
export default function RestaurantProfileLogoLink({
  profileHref,
  restaurantName,
  children,
}) {
  if (!profileHref) return children;

  return (
    <Link
      to={profileHref}
      aria-label={`Open ${restaurantName} profile`}
      title={`Open ${restaurantName} profile`}
      style={{
        display: "inline-flex",
        flexShrink: 0,
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </Link>
  );
}
