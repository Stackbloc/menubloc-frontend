import { Fragment } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const GREEN = "#1F4E3D";
const AMBER = "#92400e";

const MATRIX = [
  {
    category: "Founder's Membership",
    rows: [
      { label: "All benefits in Verified, plus much more.", v: false, f: true },
      { label: "Guaranteed, no increase pricing for 24 months", v: false, f: true },
    ],
  },
  {
    category: "Discovery & Presence",
    rows: [
      { label: "Fully searchable restaurant listing on Menuply", v: true, f: true },
      { label: "Premiere hosted restaurant profile page, including logo, about us, featured dish", v: true, vNote: "(Limited)", f: true },
      { label: "Dynamic QR Code & menus that are sharable by restaurant", v: true, f: true },
      { label: "Diners Social Share Menu and Menu Items", v: false, f: true },
      { label: "Restaurant profile that diner may follow and receive restaurant offers and updates", v: false, f: true },
    ],
  },
  {
    category: "Menu Management",
    rows: [
      { label: "Unlimited menus, unlimited menu items, with scheduled/timed menu display options", v: true, vNote: "(Limited to one menu)", f: true },
      { label: "Edit menu, menu items, with advanced pricing tools", v: true, f: true },
      { label: "Premium menu tools", v: false, f: true },
      { label: "Option to include Menu Item Photos", v: false, f: true },
    ],
  },
  {
    category: "Menu Intelligence",
    rows: [
      { label: "Ingredient rich, fully searchable menu content", v: false, f: true },
    ],
  },
  {
    category: "Pricing & Deals",
    rows: [
      { label: "Publish Deals free during first year (subject to quantity limits)", v: false, f: true },
    ],
  },
  {
    category: "Marketplace & Commerce",
    rows: [
      { label: "Marketplace ordering (pickup and delivery options)", v: false, f: true },
    ],
  },
];

function CategoryHeader({ label }) {
  return (
    <tr>
      <td colSpan={3} style={{ padding: "18px 16px 8px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8a9ab0", background: "#f8faf9", borderTop: "1px solid #e4e9f0" }}>
        {label}
      </td>
    </tr>
  );
}

function FeatureRow({ label, v, vNote, f, shade }) {
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
      <td style={{ padding: "11px 0", textAlign: "center", width: 110 }}>{check(v, vNote)}</td>
      <td style={{ padding: "11px 0", textAlign: "center", width: 120, background: shade ? "#fef9f0" : "#fffdf7" }}>{check(f)}</td>
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
            <th colSpan={2} style={{ padding: "12px 0", textAlign: "center", fontSize: 13, fontWeight: 800, color: "#0f1720" }}>Subscription</th>
          </tr>
          <tr style={{ background: "#f8faf9", borderBottom: "2px solid #e4e9f0" }}>
            <th style={{ padding: "6px 16px 10px", width: "55%" }} />
            <th style={{ padding: "6px 0 10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: GREEN, width: 110 }}>Verified</th>
            <th style={{ padding: "4px 8px 10px", textAlign: "center", width: 120, background: "#fffdf7" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: AMBER }}>{t("signup.entry.plan.founder.name", "Founder's")}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#b42318", background: "#fee2e2", borderRadius: 999, padding: "2px 7px", display: "inline-block", marginTop: 3, whiteSpace: "nowrap" }}>
                {t("signup.entry.limitedAvailability", "Limited Availability")}
              </div>
              <div style={{ fontSize: 10, color: AMBER, marginTop: 5, lineHeight: 1.35, fontWeight: 500 }}>
                {t("signup.entry.plan.founder.price", "$299/year")}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {MATRIX.map((section) => (
            <Fragment key={section.category}>
              <CategoryHeader label={section.category} />
              {section.rows.map((row, idx) => (
                <FeatureRow key={row.label} label={row.label} v={row.v} vNote={row.vNote} f={row.f} shade={idx % 2 === 1} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
