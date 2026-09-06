/**
 * Public-safe .edu verification display helpers (no email addresses).
 */

export function formatEduVerificationBadge({ institutionShort, institutionName } = {}) {
  const label = String(institutionShort || institutionName || "").trim();
  if (!label) return "✓ Verified .edu address";
  return `✓ Verified .edu address — ${label}`;
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
    badge:
      consumer.edu_verification_badge ||
      formatEduVerificationBadge({ institutionShort, institutionName }),
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
