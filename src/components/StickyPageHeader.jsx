import { useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import DiscoveryDrawer from "./grubbid/DiscoveryDrawer.jsx";

export default function StickyPageHeader({ title, children }) {
  const { isAuthenticated, loading: consumerLoading } = useConsumer();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#0B0F0C",
      borderBottom: "1px solid #1F2937",
      paddingBottom: title || children ? 12 : 0,
    }}>
      <DiscoveryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div style={{ maxWidth: 576, margin: "0 auto" }}>
        <div style={{
          display: "flex", alignItems: "center",
          padding: "14px 16px 10px",
        }}>
          <div style={{ flex: 1, display: "flex" }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                border: "none", background: "transparent",
                fontSize: 22, color: "#9CA3AF", cursor: "pointer",
                padding: 4, lineHeight: 1,
              }}
            >
              ☰
            </button>
          </div>
          <Link to="/" style={{ display: "inline-flex", textDecoration: "none" }}>
            <BrandLogo width={113} height={48} radius={14} pageColor="#0B0F0C" />
          </Link>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
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
    </div>
  );
}
