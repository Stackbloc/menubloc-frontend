import { Fragment } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const GREEN = "#1F4E3D";
const AMBER = "#92400e";

const MATRIX = [
  {
    category: "Discovery & Presence",
    rows: [
      { label: "Fully searchable restaurant listing on Menuply", v: true, p: true, f: true },
      { label: "Premiere hosted restaurant profile page, including logo, billboard, about us, featured dish", v: true, vNote: "(Limited)", p: true, f: true },
      { label: "Dynamic QR Code & menus that are sharable by restaurant", v: true, p: true, f: true },
      { label: "Diners Social Share Menu and Menu Items", v: false, p: true, f: true },
      { label: "Restaurant profile that diner may follow and receive restaurant offers and updates", v: false, p: true, f: true },
      { label: "Place displayable billboards on profile page with optional display in search results (additional fee may apply)", v: false, p: true, f: true },
    ],
  },
  {
    category: "Menu Management",
    rows: [
      { label: "Unlimited menus, unlimited menu items, with scheduled/timed menu display options", v: true, vNote: "(Limited to one menu)", p: true, f: true },
      { label: "Edit menu, menu items, with advanced pricing tools", v: true, p: true, f: true },
      { label: "Option to include Menu Item Photos", v: false, p: true, f: true },
    ],
  },
  {
    category: "Menu Intelligence",
    rows: [
      { label: "Ingredient rich, fully searchable menu content", v: false, p: true, f: true },
    ],
  },
  {
    category: "Pricing & Deals",
    rows: [
      { label: "Post restaurant created deals on deals page free of charge", v: false, p: true, f: true },
    ],
  },
  {
    category: "Marketplace & Commerce",
    rows: [
      { label: "Marketplace ordering (pickup and delivery options)", v: false, p: true, f: true },
    ],
  },
];

function CategoryHeader({ label }) {
  return (
    <tr>
      <td colSpan={4} style={{ padding: "18px 16px 8px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8a9ab0", background: "#f8faf9", borderTop: "1px solid #e4e9f0" }}>
        {label}
      </td>
    </tr>
  );
}

function FeatureRow({ label, v, vNote, p, shade }) {
  const check = (flag, note) => flag ? (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{ color: GREEN, fontWeight: 800, fontSize: 15 }}>✓</span>
      {note && <span style={{ fontSize: 10, color: "#8a9ab0", fontWeight: 500, whiteSpace: "nowrap" }}>{note}</span>}
    </span>
  ) : (
    <span style={{ color: "#d1d5db", fontSize: 15 }}>—</span>
  );
  return (
    <tr style={{ background: shade ? "#f8faf9" : "#fff" }}>
      <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151", fontWeight: 500, borderRight: "1px solid #f0f4f8" }}>{label}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90 }}>{check(v, vNote)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90, background: shade ? "#f0f7f4" : "#f8fdf9" }}>{check(p)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 90, background: shade ? "#fef9f0" : "#fffdf7" }} />
    </tr>
  );
}

export default function PlanComparisonTable() {
  const { t } = useLanguage();
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e9f0", borderRadius: 14, overflow: "hidden", marginBottom: 32 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8faf9", borderBottom: "1px solid #e4e9f0" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 800, color: "#0f1720", width: "55%" }}>Feature</th>
            <th colSpan={3} style={{ padding: "12px 0", textAlign: "center", fontSize: 13, fontWeight: 800, color: "#0f1720" }}>Subscription</th>
          </tr>
          <tr style={{ background: "#f8faf9", borderBottom: "2px solid #e4e9f0" }}>
            <th style={{ padding: "6px 16px 10px", width: "55%" }} />
            <th style={{ padding: "6px 0 10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: GREEN, width: 90 }}>Verified</th>
            <th style={{ padding: "6px 0 10px", textAlign: "center", fontSize: 12, fontWeight: 800, color: GREEN, width: 90, background: "#f0f7f4" }}>Pro</th>
            <th style={{ padding: "4px 8px 10px", textAlign: "center", width: 110 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: AMBER }}>Founder</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, background: "#fef3c7", borderRadius: 999, padding: "2px 7px", display: "inline-block", marginTop: 3, whiteSpace: "nowrap" }}>Limited Time</div>
              <div style={{ fontSize: 10, color: AMBER, marginTop: 5, lineHeight: 1.35, fontWeight: 500 }}>Same features as Pro Plan, plus 24‑month pricing guarantee</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {MATRIX.map((section) => (
            <Fragment key={section.category}>
              <CategoryHeader label={section.category} />
              {section.rows.map((row, idx) => (
                <FeatureRow key={row.label} label={row.label} v={row.v} vNote={row.vNote} p={row.p} shade={idx % 2 === 1} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
