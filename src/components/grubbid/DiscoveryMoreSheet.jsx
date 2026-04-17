import React, { useEffect } from "react";

export default function DiscoveryMoreSheet({ open, menu, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const name = menu?.restaurant_name || "this restaurant";

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)", zIndex: 200,
      }} />
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 201,
        background: "#fff",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: "12px 0 40px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        animation: "msSlideUp 220ms cubic-bezier(.22,.68,0,1.1) both",
      }}>
        <style>{`@keyframes msSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>

        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "#e4e7ec", margin: "0 auto 16px",
        }} />

        <div style={{ fontSize: 13, fontWeight: 700, color: "#667085", padding: "0 20px 8px" }}>
          {name}
        </div>

        {[
          { label: "Save", icon: "🔖" },
          { label: "See less like this", icon: "👎" },
          { label: "Not interested in this restaurant", icon: "🚫" },
          { label: "Report issue", icon: "⚠️" },
          { label: "Send feedback", icon: "💬" },
        ].map((item) => (
          <button key={item.label} type="button" onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 14,
            width: "100%", padding: "13px 20px",
            border: "none", background: "transparent",
            fontSize: 15, fontWeight: 600, color: "#101828",
            cursor: "pointer", textAlign: "left",
          }}>
            <span style={{ fontSize: 20, width: 28, flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
