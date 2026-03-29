import React from "react";
import { PageNav } from "../components/NavButton.jsx";
import { PageHero, PageShell } from "../components/grubbid/GrubbidPrimitives.jsx";

const headingStyle = {
  margin: "32px 0 8px",
  color: "var(--gb-color-ink-strong)",
  fontSize: "16px",
  fontWeight: 800,
};

const paragraphStyle = {
  margin: "0 0 12px",
  color: "var(--gb-color-ink-soft)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const listStyle = {
  ...paragraphStyle,
  paddingLeft: 22,
};

export default function Terms() {
  return (
    <PageShell width="reading">
      <PageNav back />

      <PageHero
        title="Grubbid Terms of Use"
        description="Effective Date: 2026-03-16"
      />

      <div style={{ maxWidth: 680 }}>
        <p style={paragraphStyle}>
          These Terms of Use govern all use of Grubbid, including use of the Grubbid Discovery
          platform by consumers and use of restaurant signup, menu upload, and listing services
          by restaurants. By using Grubbid you agree to these terms.
        </p>

        <h2 style={headingStyle}>Not medical advice</h2>
        <p style={paragraphStyle}>
          Grubbid is a food discovery and menu intelligence platform. Nothing on Grubbid,
          including nutrition estimates, ingredient information, dietary labels, health scores,
          or any other content, constitutes medical advice, dietary advice, or any other form
          of professional health guidance.
        </p>
        <p style={paragraphStyle}>
          You agree that you will not rely on any information provided by Grubbid for medical,
          dietary, or health-related decisions. Always seek the advice of a qualified physician,
          registered dietitian, or other licensed health professional with any questions you may
          have regarding a medical condition, dietary restriction, food allergy, or nutritional need.
        </p>

        <h2 style={headingStyle}>Estimated nutrition data</h2>
        <p style={paragraphStyle}>
          Nutrition information, calorie counts, macronutrient values, ingredient inferences,
          and any related health or insight data displayed on Grubbid are <strong>estimates only</strong>.
          They are generated using automated tools and may not be accurate, complete, or
          up to date. Actual values will vary based on preparation method, portion size,
          ingredient sourcing, and other factors.
        </p>
        <p style={paragraphStyle}>
          Grubbid makes no warranty, expressed or implied, regarding the accuracy or
          completeness of any nutrition or health-related data on the platform. You use
          this information at your own risk.
        </p>

        <h2
          style={{
            ...headingStyle,
            marginTop: 40,
            paddingTop: 28,
            borderTop: "1px solid var(--gb-color-border)",
          }}
        >
          Restaurant terms
        </h2>
        <p style={paragraphStyle}>
          The following terms apply to restaurants using Grubbid&rsquo;s signup, menu upload,
          and listing services.
        </p>

        <h2 style={headingStyle}>Authorized users</h2>
        <p style={paragraphStyle}>
          You may use Grubbid only if you are authorized to act on behalf of the
          restaurant. You confirm that the information you submit is accurate and
          that you have permission to submit menu files and restaurant information.
        </p>

        <h2 style={headingStyle}>Menu uploads</h2>
        <p style={paragraphStyle}>Restaurants retain ownership of their menu files.</p>
        <p style={paragraphStyle}>By uploading menus you grant Grubbid permission to:</p>
        <ul style={listStyle}>
          <li>store</li>
          <li>process</li>
          <li>format</li>
          <li>display</li>
        </ul>
        <p style={paragraphStyle}>your menu information for operation of the service.</p>

        <h2 style={headingStyle}>Accuracy of listings</h2>
        <p style={paragraphStyle}>
          Menus may be processed using automated tools including OCR or
          AI-assisted extraction. Restaurants are responsible for reviewing menu
          information for accuracy.
        </p>

        <h2 style={headingStyle}>Paid services</h2>
        <p style={paragraphStyle}>
          Certain features such as subscription plans or OCR menu uploads may
          require payment. Fees are generally non-refundable once processing has
          begun.
        </p>

        <h2 style={headingStyle}>Acceptable use</h2>
        <p style={paragraphStyle}>
          Users may not submit false listings, impersonate another business,
          upload malicious files, or misuse the platform. Grubbid may suspend
          accounts that violate these terms.
        </p>

        <h2 style={headingStyle}>Platform visibility</h2>
        <p style={paragraphStyle}>
          Grubbid determines how restaurants and menus appear within the platform.
          Subscription tiers may affect features and visibility.
        </p>

        <h2 style={headingStyle}>Limitation of liability</h2>
        <p style={paragraphStyle}>
          The service is provided as-is. Grubbid is not liable for indirect or
          consequential damages resulting from platform use.
        </p>

        <h2 style={headingStyle}>Changes to terms</h2>
        <p style={paragraphStyle}>
          These terms may be updated periodically. Continued use of the platform
          indicates acceptance of updated terms.
        </p>
      </div>
    </PageShell>
  );
}
