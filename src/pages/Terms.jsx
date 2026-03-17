// menubloc-frontend/src/pages/Terms.jsx
import React from "react";
import { PageNav } from "../components/NavButton.jsx";

const s = {
  page: {
    maxWidth: 680,
    margin: "40px auto",
    padding: "0 20px 80px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
    lineHeight: 1.7,
  },
  brand: { fontWeight: 800, fontSize: 18, marginBottom: 4 },
  back: { fontSize: 13, color: "#555", textDecoration: "underline", display: "inline-block", marginBottom: 28 },
  h1: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  effective: { fontSize: 13, color: "#888", marginBottom: 32 },
  h2: { fontSize: 16, fontWeight: 800, marginTop: 28, marginBottom: 6 },
  p: { fontSize: 14, color: "#333", margin: "0 0 10px" },
  ul: { fontSize: 14, color: "#333", paddingLeft: 20, margin: "0 0 10px" },
};

export default function Terms() {
  return (
    <div style={s.page}>
      <div style={s.brand}>Grubbid</div>
      <PageNav back />

      <h1 style={s.h1}>Grubbid Terms of Use</h1>
      <div style={s.effective}>Effective Date: 2026-03-16</div>

      <p style={s.p}>
        These Terms of Use govern all use of Grubbid, including use of the Grubbid Discovery
        platform by consumers and use of restaurant signup, menu upload, and listing services
        by restaurants. By using Grubbid you agree to these terms.
      </p>

      <h2 style={s.h2}>Not medical advice</h2>
      <p style={s.p}>
        Grubbid is a food discovery and menu intelligence platform. Nothing on Grubbid —
        including nutrition estimates, ingredient information, dietary labels, health scores,
        or any other content — constitutes medical advice, dietary advice, or any other form
        of professional health guidance.
      </p>
      <p style={s.p}>
        You agree that you will not rely on any information provided by Grubbid for medical,
        dietary, or health-related decisions. Always seek the advice of a qualified physician,
        registered dietitian, or other licensed health professional with any questions you may
        have regarding a medical condition, dietary restriction, food allergy, or nutritional need.
      </p>

      <h2 style={s.h2}>Estimated nutrition data</h2>
      <p style={s.p}>
        Nutrition information, calorie counts, macronutrient values, ingredient inferences,
        and any related health or insight data displayed on Grubbid are <strong>estimates only</strong>.
        They are generated using automated tools and may not be accurate, complete, or
        up to date. Actual values will vary based on preparation method, portion size,
        ingredient sourcing, and other factors.
      </p>
      <p style={s.p}>
        Grubbid makes no warranty, expressed or implied, regarding the accuracy or
        completeness of any nutrition or health-related data on the platform. You use
        this information at your own risk.
      </p>

      <h2 style={{ ...s.h2, marginTop: 40, paddingTop: 32, borderTop: "1px solid #e4e7ec" }}>
        Restaurant terms
      </h2>
      <p style={s.p}>
        The following terms apply to restaurants using Grubbid&rsquo;s signup, menu upload,
        and listing services.
      </p>

      <h2 style={s.h2}>Authorized users</h2>
      <p style={s.p}>
        You may use Grubbid only if you are authorized to act on behalf of the
        restaurant. You confirm that the information you submit is accurate and
        that you have permission to submit menu files and restaurant information.
      </p>

      <h2 style={s.h2}>Menu uploads</h2>
      <p style={s.p}>Restaurants retain ownership of their menu files.</p>
      <p style={s.p}>By uploading menus you grant Grubbid permission to:</p>
      <ul style={s.ul}>
        <li>store</li>
        <li>process</li>
        <li>format</li>
        <li>display</li>
      </ul>
      <p style={s.p}>your menu information for operation of the service.</p>

      <h2 style={s.h2}>Accuracy of listings</h2>
      <p style={s.p}>
        Menus may be processed using automated tools including OCR or
        AI-assisted extraction. Restaurants are responsible for reviewing menu
        information for accuracy.
      </p>

      <h2 style={s.h2}>Paid services</h2>
      <p style={s.p}>
        Certain features such as subscription plans or OCR menu uploads may
        require payment. Fees are generally non-refundable once processing has
        begun.
      </p>

      <h2 style={s.h2}>Acceptable use</h2>
      <p style={s.p}>
        Users may not submit false listings, impersonate another business,
        upload malicious files, or misuse the platform. Grubbid may suspend
        accounts that violate these terms.
      </p>

      <h2 style={s.h2}>Platform visibility</h2>
      <p style={s.p}>
        Grubbid determines how restaurants and menus appear within the platform.
        Subscription tiers may affect features and visibility.
      </p>

      <h2 style={s.h2}>Limitation of liability</h2>
      <p style={s.p}>
        The service is provided as-is. Grubbid is not liable for indirect or
        consequential damages resulting from platform use.
      </p>

      <h2 style={s.h2}>Changes to terms</h2>
      <p style={s.p}>
        These terms may be updated periodically. Continued use of the platform
        indicates acceptance of updated terms.
      </p>
    </div>
  );
}
