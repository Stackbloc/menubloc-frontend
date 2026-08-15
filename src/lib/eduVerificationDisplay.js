/**
 * Public-safe .edu verification display helpers (no email addresses).
 */

export function formatEduVerificationBadge({ institutionShort, institutionName } = {}) {
  const label = String(institutionShort || institutionName || "").trim();
  if (!label) return "✓ Verified .edu address";
  return `✓ Verified .edu address — ${label}`;
}

export function getEduVerificationFromConsumer(consumer) {
  if (!consumer || consumer.edu_verified !== true) {
    return {
      edu_verified: false,
      badge: null,
      institution_name: null,
      institution_short: null,
      email_domain: null,
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
  };
}
