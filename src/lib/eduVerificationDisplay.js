/**
 * Public-safe .edu verification display helpers (no email addresses).
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "✓ Verified USC student · since Nov 2026" (Andre 2026-11-06: any school, with the date). */
export function formatEduVerificationBadge({ institutionShort, institutionName, verifiedAt = null } = {}) {
  const label = String(institutionShort || institutionName || "").trim();
  const d = verifiedAt ? new Date(verifiedAt) : null;
  const since = d && Number.isFinite(d.getTime()) ? ` · since ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "";
  if (!label) return `✓ Verified student${since}`;
  return `✓ Verified ${label} student${since}`;
}

/** Short school line for diner profiles (affiliation, not enrollment proof). */
export function formatEduSchoolAffiliation({
  institutionShort,
  institutionName,
  edu_verified: eduVerified,
} = {}) {
  if (eduVerified === false) return null;
  const label = String(institutionShort || institutionName || "").trim();
  if (!label && eduVerified !== true) return null;
  if (!label) return ".edu school";
  return label;
}

export function getEduVerificationFromConsumer(consumer) {
  if (!consumer || consumer.edu_verified !== true) {
    return {
      edu_verified: false,
      badge: null,
      institution_name: null,
      institution_short: null,
      email_domain: null,
      school_affiliation: null,
    };
  }

  const institutionName = consumer.edu_institution_name || null;
  const institutionShort = consumer.edu_institution_short || institutionName;
  return {
    edu_verified: true,
    // Our wording + date, not the server's "Verified .edu address — X" (Andre 2026-11-06).
    badge: formatEduVerificationBadge({ institutionShort, institutionName, verifiedAt: consumer.edu_verified_at }),
    institution_name: institutionName,
    institution_short: institutionShort,
    email_domain: consumer.edu_email_domain || null,
    school_affiliation: formatEduSchoolAffiliation({
      institutionShort,
      institutionName,
      edu_verified: true,
    }),
  };
}
