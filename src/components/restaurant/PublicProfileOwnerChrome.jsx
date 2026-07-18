/**
 * Owner-only notice on the public restaurant profile.
 * Profile + status editing lives on /operator/my-account — not duplicated here.
 */
import { Link } from "react-router-dom";

export default function PublicProfileOwnerChrome() {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid #86efac",
        background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
          You own this listing
        </div>
        <div style={{ marginTop: 2, fontSize: 12, color: "#166534" }}>
          Review or edit your public profile in My Account.
        </div>
      </div>
      <Link
        to="/operator/my-account"
        style={{
          background: "#1F4E3D",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Edit
      </Link>
    </div>
  );
}
