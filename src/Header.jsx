import { Link } from "react-router-dom";
import { BrandLogo } from "./components/BrandLogo.jsx";

export default function Header({ title = "Grubbid", subtitle = "Restaurants" }) {
  return (
    <div
      style={{
        padding: "18px 20px",
        borderBottom: "1px solid #eee",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <BrandLogo width={74} height={48} radius={14} pageColor="#ffffff" />

      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>{subtitle}</div>
      </div>
    </div>
  );
}
