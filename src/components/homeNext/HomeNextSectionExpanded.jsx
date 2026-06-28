import HomeNextMenuCardRow from "./HomeNextMenuCardRow.jsx";

/** Single category expanded — same card row as preview sections, with Back. */
export default function HomeNextSectionExpanded({ title, reason, menus, onBack }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ padding: "0 16px", marginBottom: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            border: "none",
            background: "transparent",
            padding: "0 0 8px",
            color: "#15803d",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
          {title}
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280", lineHeight: 1.4 }}>
          {reason}
        </p>
      </div>
      <HomeNextMenuCardRow menus={menus} />
    </section>
  );
}
