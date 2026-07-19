/**
 * Deep-link wrapper for Delivery Portal (Finish setup / onboarding).
 * Primary surface: My Account → Delivery Portal (?tab=delivery).
 */
import { Link } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import OperatorDeliveryPortalPanel from "./OperatorDeliveryPortalPanel.jsx";

export default function OperatorDeliveryPage() {
  return (
    <OperatorLayout title="Delivery Portal">
      <div style={{ marginBottom: 14 }}>
        <Link
          to="/operator/my-account?tab=delivery"
          style={{
            fontSize: 13,
            fontWeight: 650,
            color: "#1F4E3D",
            textDecoration: "none",
          }}
        >
          ← My Account · Delivery Portal
        </Link>
      </div>
      <OperatorDeliveryPortalPanel />
    </OperatorLayout>
  );
}
