import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";

export default function StickyPageHeader({ onBack, title, children }) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  const { isAuthenticated, loading: consumerLoading } = useConsumer();

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#0B0F0C",
      borderBottom: "1px solid #1F2937",
      paddingBottom: title || children ? 12 : 0,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
      }}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          style={{
            border: "none", background: "transparent",
            fontSize: 22, color: "#9CA3AF", cursor: "pointer",
            padding: 4, lineHeight: 1, flexShrink: 0,
          }}
        >
          ←
        </button>
        <Link to="/" style={{ display: "inline-flex", textDecoration: "none" }}>
          <BrandLogo width={113} height={48} radius={14} pageColor="#0B0F0C" />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Link
            to="/deals"
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              minHeight: 32, padding: "0 12px",
              borderRadius: 999,
              border: "1.5px solid rgba(34,197,94,0.3)",
              background: "rgba(34,197,94,0.08)",
              color: "#22C55E",
              fontSize: 13, fontWeight: 800,
              textDecoration: "none", whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
          >
            🔥 Deals
          </Link>
          {!consumerLoading && (
            isAuthenticated ? (
              <Link to="/account" style={{ fontSize: 22, textDecoration: "none" }}>
                👤
              </Link>
            ) : (
              <Link to="/account/login" style={{
                fontSize: 13, fontWeight: 700, color: "#22C55E", textDecoration: "none",
              }}>
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
      {title && (
        <div style={{ padding: "0 16px" }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
