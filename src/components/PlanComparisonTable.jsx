const GREEN = "#1F4E3D";
const AMBER = "#92400e";

/**
 * Restaurant subscription feature comparison.
 * Display-only marketing content for the public signup and operator
 * subscription pages. Not sourced from Stripe, entitlements, or the backend.
 */
const FEATURES = [
  { label: "Searchable restaurant listing on Menuply", published: true, starter: true, founders: true },
  { label: "Searchable menu items", published: true, starter: true, founders: true },
  { label: "Professional restaurant profile", published: "Limited", starter: true, founders: true },
  { label: "Restaurant logo on profile", published: false, starter: true, founders: true },
  { label: "Logo and product photos", published: false, starter: true, founders: true },
  { label: "Claim restaurant listing", published: true, starter: true, founders: true },
  { label: "QR Code", published: false, starter: true, founders: true },
  { label: "Unlimited menus and menu items", published: false, starter: true, founders: true },
  { label: "Edit menus and menu items", published: false, starter: true, founders: true },
  { label: "Premium menu management tools", published: false, starter: false, founders: true },
  { label: "Rich searchable menu data", published: false, starter: true, founders: true },
  { label: "Social sharing of menus and menu items", published: false, starter: true, founders: true },
  { label: "Customers can follow your restaurant", published: false, starter: true, founders: true },
  { label: "Create deals and promotions free of charge", published: false, starter: false, founders: true },
  { label: "Online ordering", published: false, starter: true, founders: true },
  { label: "Marketplace commission rate", published: false, starter: "Standard", founders: "Lowest" },
  { label: "Two-year commission rate guarantee", published: false, starter: false, founders: true },
];

const PLAN_COLUMNS = [
  {
    key: "published",
    name: "Published",
    prices: ["Free"],
    nameColor: GREEN,
    highlight: false,
  },
  {
    key: "starter",
    name: "Starter",
    prices: ["$20/month", "or $199/year"],
    nameColor: GREEN,
    highlight: false,
  },
  {
    key: "founders",
    name: "Founder's*",
    prices: ["$39/month", "or $319/year"],
    nameColor: AMBER,
    highlight: true,
  },
];

function CellValue({ value }) {
  if (value === true) {
    return <span style={{ color: GREEN, fontWeight: 800, fontSize: 15 }}>✓</span>;
  }
  if (typeof value === "string" && value.trim()) {
    const display = value === "Limited" ? `(${value})` : value;
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", lineHeight: 1.25 }}>
        {display}
      </span>
    );
  }
  return <span style={{ color: "#d1d5db", fontSize: 15 }}>—</span>;
}

function FeatureRow({ label, published, starter, founders, shade }) {
  return (
    <tr style={{ background: shade ? "#f8faf9" : "#fff" }}>
      <td
        style={{
          padding: "11px 16px",
          fontSize: 13,
          color: "#374151",
          fontWeight: 500,
          borderRight: "1px solid #f0f4f8",
        }}
      >
        {label}
      </td>
      <td style={{ padding: "11px 6px", textAlign: "center", width: 100 }}>
        <CellValue value={published} />
      </td>
      <td style={{ padding: "11px 6px", textAlign: "center", width: 110 }}>
        <CellValue value={starter} />
      </td>
      <td
        style={{
          padding: "11px 6px",
          textAlign: "center",
          width: 120,
          background: shade ? "#fef9f0" : "#fffdf7",
        }}
      >
        <CellValue value={founders} />
      </td>
    </tr>
  );
}

function PlanHeaderCell({ plan }) {
  return (
    <th
      style={{
        padding: "6px 8px 10px",
        textAlign: "center",
        width: plan.key === "founders" ? 120 : plan.key === "starter" ? 110 : 100,
        background: plan.highlight ? "#fffdf7" : undefined,
        verticalAlign: "top",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: plan.nameColor, lineHeight: 1.3 }}>
        {plan.name}
      </div>
      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
        {plan.prices.map((line) => (
          <div
            key={line}
            style={{
              fontSize: 10,
              color: plan.highlight ? AMBER : "#6b7280",
              lineHeight: 1.35,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </th>
  );
}

export default function PlanComparisonTable() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e9f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8faf9", borderBottom: "1px solid #e4e9f0" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f1720",
                    width: "42%",
                  }}
                >
                  Feature
                </th>
                <th
                  colSpan={3}
                  style={{
                    padding: "12px 0",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0f1720",
                  }}
                >
                  Subscription
                </th>
              </tr>
              <tr style={{ background: "#f8faf9", borderBottom: "2px solid #e4e9f0" }}>
                <th style={{ padding: "6px 16px 10px", width: "42%" }} />
                {PLAN_COLUMNS.map((plan) => (
                  <PlanHeaderCell key={plan.key} plan={plan} />
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((row, idx) => (
                <FeatureRow
                  key={row.label}
                  label={row.label}
                  published={row.published}
                  starter={row.starter}
                  founders={row.founders}
                  shade={idx % 2 === 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p
        style={{
          margin: "14px 4px 0",
          fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        * Window QR Code included with Founder&apos;s Annual plan.
        {" "}
        Founder&apos;s Membership is available for a limited time to early restaurant partners.
      </p>
    </div>
  );
}
