import { LEGAL_VERSIONS } from "../content/legal.js";

export const REQUIRED_LEGAL_CONSENT_LABEL =
  "I agree to the Terms of Use and Privacy Policy and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.";

/** Guest Feed publish — affirmative Terms checkbox; Privacy is notice acknowledgment on server. */
export const GUEST_PUBLICATION_CONSENT_LABEL = "I agree to the Terms of Use";

export const GUEST_PUBLICATION_NOTICE =
  "By posting, you agree to Menuply's Terms of Use and acknowledge the Privacy Policy.";

export function buildGuestPublicationLegalPayload() {
  return {
    legal_consent: true,
    terms_version: LEGAL_VERSIONS.consumerTerms,
    privacy_version: LEGAL_VERSIONS.privacyPolicy,
    legal_acceptances: [
      {
        document_key: "terms_of_use",
        document_version: LEGAL_VERSIONS.consumerTerms,
      },
    ],
  };
}

export function buildLegalConsentPayload({ marketingOptIn = false } = {}) {
  return {
    legal_consent: true,
    terms_version: LEGAL_VERSIONS.consumerTerms,
    privacy_version: LEGAL_VERSIONS.privacyPolicy,
    marketing_opt_in: Boolean(marketingOptIn),
    legal_acceptances: [
      {
        document_key: "terms_of_use",
        document_version: LEGAL_VERSIONS.consumerTerms,
      },
      {
        document_key: "privacy_policy",
        document_version: LEGAL_VERSIONS.privacyPolicy,
      },
    ],
  };
}
