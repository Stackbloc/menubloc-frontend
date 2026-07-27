/**
 * At a Glance — concise snapshot from real profile fields only.
 * Collapses when nothing meaningful is available.
 */
import { Link } from "react-router-dom";
import { clusterTypeLabel } from "../../../lib/clusterUrl.js";
import {
  firstNonEmpty,
  humanizeRestaurantType,
  PROFILE_GREEN,
  PROFILE_INK,
  PROFILE_MUTED,
} from "./profilePrimitives.jsx";

function GlanceRow({ label, children, testId }) {
  if (!children) return null;
  return (
    <div
      data-testid={testId}
      style={{
        display: "grid",
        gridTemplateColumns: "110px minmax(0, 1fr)",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #f5f5f4",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <span style={{ fontWeight: 700, color: "#57534e" }}>{label}</span>
      <span style={{ color: PROFILE_INK, minWidth: 0 }}>{children}</span>
    </div>
  );
}

function summarizeHours(hoursRows) {
  if (!Array.isArray(hoursRows) || !hoursRows.length) return "";
  const open = hoursRows.filter((r) => r?.text && !/closed/i.test(String(r.text)));
  if (!open.length) return hoursRows.length ? "Hours posted" : "";
  if (open.length === 1) return `${open[0].day}: ${open[0].text}`;
  const same = open.every((r) => r.text === open[0].text);
  if (same) return open[0].text;
  return `${open.length} days posted`;
}

function orderingLabel(profile) {
  const mode = String(profile?.public_ordering_mode || "").toLowerCase();
  if (mode === "display_only") return "Browse menu only";
  const status = String(profile?.order_acceptance_status || "").toLowerCase();
  if (status === "accepting" || status === "open") return "Ordering available";
  if (status === "paused" || status === "closed") return "Ordering paused";
  if (mode === "standard" || mode === "full") return "Menu on Menuply";
  return "";
}

export default function ProfileAtAGlance({
  cuisine = "",
  category = "",
  city = "",
  restaurantType = "",
  displayCluster = null,
  hoursRows = [],
  profile = null,
  pickup = false,
  delivery = false,
  dineIn = false,
  priceTier = "",
  menuItemCount = 0,
  menuCount = 0,
  isMobile = false,
}) {
  const cuisineLabel = firstNonEmpty(cuisine);
  const categoryLabel = firstNonEmpty(category);
  const cityLabel = firstNonEmpty(city);
  const typeLabel = humanizeRestaurantType(restaurantType);
  const hoursSummary = summarizeHours(hoursRows);
  const orderSummary = orderingLabel(profile);
  const priceLabel = firstNonEmpty(priceTier);
  const clusterName = firstNonEmpty(displayCluster?.name);
  const clusterHref = displayCluster?.public_url || null;
  const clusterExtra = displayCluster?.cluster_type
    ? clusterTypeLabel(displayCluster.cluster_type)
    : "";

  const services = [];
  if (pickup) services.push("Pickup");
  if (delivery) services.push("Delivery");
  if (dineIn) services.push("Dine-in");

  const menuSummary =
    menuItemCount > 0
      ? menuCount > 1
        ? `${menuItemCount} items · ${menuCount} menus`
        : `${menuItemCount} items`
      : menuCount > 0
        ? `${menuCount} menu${menuCount === 1 ? "" : "s"}`
        : "";

  const rows = [];
  if (cuisineLabel) rows.push({ key: "cuisine", label: "Cuisine", value: cuisineLabel, testId: "glance-cuisine" });
  if (categoryLabel && categoryLabel.toLowerCase() !== cuisineLabel.toLowerCase()) {
    rows.push({ key: "category", label: "Category", value: categoryLabel, testId: "glance-category" });
  }
  if (typeLabel) rows.push({ key: "type", label: "Type", value: typeLabel, testId: "glance-type" });
  if (clusterName) {
    rows.push({
      key: "cluster",
      label: "Cluster",
      value: clusterHref ? (
        <Link to={clusterHref} style={{ color: PROFILE_GREEN, fontWeight: 700, textDecoration: "none" }}>
          {clusterName}
          {clusterExtra ? ` · ${clusterExtra}` : ""}
        </Link>
      ) : (
        `${clusterName}${clusterExtra ? ` · ${clusterExtra}` : ""}`
      ),
      testId: "glance-cluster",
    });
  }
  if (cityLabel) rows.push({ key: "city", label: "City", value: cityLabel, testId: "glance-city" });
  if (hoursSummary) rows.push({ key: "hours", label: "Hours", value: hoursSummary, testId: "glance-hours" });
  if (services.length) {
    rows.push({ key: "services", label: "Services", value: services.join(" · "), testId: "glance-services" });
  }
  if (orderSummary) {
    rows.push({ key: "ordering", label: "Ordering", value: orderSummary, testId: "glance-ordering" });
  }
  if (priceLabel) rows.push({ key: "price", label: "Price", value: priceLabel, testId: "glance-price" });
  if (menuSummary) rows.push({ key: "menu", label: "Menu", value: menuSummary, testId: "glance-menu" });

  if (!rows.length) return null;

  return (
    <section
      data-testid="profile-at-a-glance"
      aria-label="At a glance"
      style={{
        marginBottom: isMobile ? 16 : 0,
        padding: isMobile ? "16px 14px" : "18px 18px",
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e7e5e4",
        boxShadow: "0 8px 28px rgba(28, 25, 23, 0.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: PROFILE_GREEN,
          marginBottom: 4,
        }}
      >
        At a glance
      </div>
      <div style={{ color: PROFILE_MUTED, fontSize: 12, marginBottom: 8 }}>
        What Menuply already knows about this restaurant
      </div>
      <div>
        {rows.map((row) => (
          <GlanceRow key={row.key} label={row.label} testId={row.testId}>
            {row.value}
          </GlanceRow>
        ))}
      </div>
    </section>
  );
}
