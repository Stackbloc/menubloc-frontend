import { useEffect } from "react";
import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Deals",               href: "/deals",             icon: "🏷️" },
  { label: "Top Picks Near You",  href: "/top-picks",         icon: "⭐" },
  { label: "Food Truck Directory", href: "/foodtrucks",       icon: "🚚" },
];

const META_ITEMS = [
  { label: "Restaurant Sign Up",  href: "/restaurant/signup", icon: "🍴" },
  { label: "Food Truck Sign Up",  href: "/foodtruck/signup",  icon: "🛻" },
  { label: "Terms of Use",        href: "/terms",             icon: "📄" },
  { label: "Privacy Policy",      href: "/privacy",           icon: "🔒" },
  { label: "About Menuply",       href: "/about",             icon: "ℹ️" },
  { label: "Contact Us",          href: "/contact",           icon: "💬" },
];

function SheetRow({ icon, label, href, onClick }) {
  return (
    <Link
      to={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 20px",
        fontSize: 15,
        fontWeight: 600,
        color: "#101828",
        textDecoration: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontSize: 19, width: 26, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      {label}
    </Link>
  );
}

function Divider() {
  return <div style={{ height: 1, margin: "4px 20px", background: "#f2f4f7" }} />;
}

export default function AppMenuSheet({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 400 }}
      />
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 401,
          background: "#fff",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          paddingBottom: 40,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.16)",
          animation: "amSlideUp 210ms cubic-bezier(.22,.68,0,1.1) both",
        }}
      >
        <style>{`@keyframes amSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>

        {/* drag handle */}
        <div style={{ paddingTop: 14, paddingBottom: 4, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e4e7ec" }} />
        </div>

        {/* Discover */}
        <div style={{ padding: "8px 20px 2px", fontSize: 11, fontWeight: 900, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Discover
        </div>
        {NAV_ITEMS.map((item) => (
          <SheetRow key={item.href} {...item} onClick={onClose} />
        ))}

        <Divider />

        {/* More */}
        <div style={{ padding: "10px 20px 2px", fontSize: 11, fontWeight: 900, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          More
        </div>
        {META_ITEMS.map((item) => (
          <SheetRow key={item.href} {...item} onClick={onClose} />
        ))}
      </div>
    </>
  );
}
