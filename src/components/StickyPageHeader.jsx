import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.jsx";

export default function StickyPageHeader({ onBack, title, children }) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#f7f6f1",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
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
            fontSize: 22, color: "#101828", cursor: "pointer",
            padding: 4, lineHeight: 1, flexShrink: 0,
          }}
        >
          ←
        </button>
        <Link to="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
          <BrandLogo width={72} height={48} radius={14} pageColor="#f7f6f1" />
          <div style={{
            width: 72, marginTop: -1, padding: "4px 0 6px",
            background: "linear-gradient(180deg, #1a6b47 0%, #0d3d28 100%)",
            color: "#6ee7b7", fontSize: 8, fontWeight: 900,
            letterSpacing: "0.13em", textTransform: "uppercase",
            borderRadius: "0 0 7px 7px",
            boxShadow: "0 6px 16px rgba(13,61,40,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
            userSelect: "none",
            display: "flex", justifyContent: "center",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span>✦ BidFree</span>
              <span style={{ paddingLeft: "1.4em" }}>Bidding</span>
            </div>
          </div>
        </Link>
        <div style={{ width: 30, flexShrink: 0 }} />
      </div>
      {title && (
        <div style={{ padding: "0 16px" }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#101828", letterSpacing: "-0.02em" }}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
