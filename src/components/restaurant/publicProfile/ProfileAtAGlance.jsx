/**
 * At a Glance — diner-facing profile summary + claim invitations for missing fields.
 * Not a database dump. Real values when present; claim CTAs when missing (unclaimed).
 */
import { Link } from "react-router-dom";
import {
  firstNonEmpty,
  PROFILE_GREEN,
  PROFILE_INK,
  PROFILE_MUTED,
} from "./profilePrimitives.jsx";

function GlanceRow({ label, children, testId, muted = false }) {
  if (children == null || children === false || children === "") return null;
  return (
    <div
      data-testid={testId}
      style={{
        display: "grid",
        gridTemplateColumns: "120px minmax(0, 1fr)",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid #f5f5f4",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <span style={{ fontWeight: 700, color: "#57534e" }}>{label}</span>
      <span style={{ color: muted ? PROFILE_MUTED : PROFILE_INK, minWidth: 0 }}>{children}</span>
    </div>
  );
}

function ClaimInvite({ text }) {
  return <span style={{ color: PROFILE_MUTED }}>{text}</span>;
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

export default function ProfileAtAGlance({
  aboutText = "",
  foundedText = "",
  signatureText = "",
  teamIntro = "",
  hoursRows = [],
  phone = "",
  website = "",
  websiteRaw = "",
  showClaimInvites = false,
  claimHref = "#claim-profile",
  showHiringInvite = false,
  isMobile = false,
}) {
  const about = firstNonEmpty(aboutText);
  const founded = firstNonEmpty(foundedText);
  const signature = firstNonEmpty(signatureText);
  const team = firstNonEmpty(teamIntro);
  const hoursSummary = summarizeHours(hoursRows);
  const phoneVal = firstNonEmpty(phone);
  const webVal = firstNonEmpty(website);

  const invite = (suffix) =>
    showClaimInvites ? <ClaimInvite text={`Claim your profile ${suffix}`} /> : null;

  const rows = [];

  if (about) {
    rows.push({
      key: "about",
      label: "About Us",
      testId: "glance-about",
      value: about.length > 220 ? `${about.slice(0, 217).trim()}…` : about,
    });
  } else if (showClaimInvites) {
    rows.push({
      key: "about",
      label: "About Us",
      testId: "glance-about",
      muted: true,
      value: invite("to tell diners about your restaurant."),
    });
  }

  if (founded) {
    rows.push({ key: "founded", label: "Founded", testId: "glance-founded", value: founded });
  } else if (showClaimInvites) {
    rows.push({
      key: "founded",
      label: "Founded",
      testId: "glance-founded",
      muted: true,
      value: invite("to add when the restaurant was founded."),
    });
  }

  if (signature) {
    rows.push({
      key: "signature",
      label: "Signature Dish",
      testId: "glance-signature",
      value: signature,
    });
  } else if (showClaimInvites) {
    rows.push({
      key: "signature",
      label: "Signature Dish",
      testId: "glance-signature",
      muted: true,
      value: invite("to feature the dish every first-time guest should try."),
    });
  }

  if (team) {
    rows.push({ key: "team", label: "Meet the Team", testId: "glance-team", value: team });
  } else if (showClaimInvites) {
    rows.push({
      key: "team",
      label: "Meet the Team",
      testId: "glance-team",
      muted: true,
      value: invite("to introduce the people behind the restaurant."),
    });
  }

  if (hoursSummary) {
    rows.push({ key: "hours", label: "Hours", testId: "glance-hours", value: hoursSummary });
  } else if (showClaimInvites) {
    rows.push({
      key: "hours",
      label: "Hours",
      testId: "glance-hours",
      muted: true,
      value: invite("to publish accurate business hours."),
    });
  }

  if (phoneVal) {
    rows.push({
      key: "phone",
      label: "Phone",
      testId: "glance-phone",
      value: (
        <a href={`tel:${String(phoneVal).replace(/\s+/g, "")}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
          {phoneVal}
        </a>
      ),
    });
  } else if (showClaimInvites) {
    rows.push({
      key: "phone",
      label: "Phone",
      testId: "glance-phone",
      muted: true,
      value: invite("to add a customer contact number."),
    });
  }

  if (webVal) {
    rows.push({
      key: "website",
      label: "Website",
      testId: "glance-website",
      value: (
        <a href={webVal} target="_blank" rel="noopener noreferrer" style={{ color: PROFILE_GREEN, fontWeight: 700, textDecoration: "none" }}>
          {websiteRaw || webVal} ↗
        </a>
      ),
    });
  } else if (showClaimInvites) {
    rows.push({
      key: "website",
      label: "Website",
      testId: "glance-website",
      muted: true,
      value: invite("to add your official website."),
    });
  }

  if (showHiringInvite && showClaimInvites) {
    rows.push({
      key: "hiring",
      label: "Now Hiring?",
      testId: "glance-hiring-invite",
      muted: true,
      value: (
        <span style={{ color: PROFILE_MUTED }}>
          Claim your profile to tell potential applicants when you are hiring.
        </span>
      ),
    });
  }

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
          marginBottom: 8,
        }}
      >
        At a glance
      </div>
      <div>
        {rows.map((row) => (
          <GlanceRow key={row.key} label={row.label} testId={row.testId} muted={row.muted}>
            {row.value}
          </GlanceRow>
        ))}
      </div>
      {showClaimInvites ? (
        <div style={{ marginTop: 12, fontSize: 12, color: PROFILE_MUTED }}>
          Already the owner?{" "}
          <Link to="/onboarding" style={{ color: PROFILE_GREEN, fontWeight: 700, textDecoration: "none" }}>
            Claim this profile
          </Link>{" "}
          to complete these details.
        </div>
      ) : null}
    </section>
  );
}
