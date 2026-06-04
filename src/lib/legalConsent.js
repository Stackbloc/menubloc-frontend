import { LEGAL_VERSIONS } from "../content/legal.js";

export const REQUIRED_LEGAL_CONSENT_LABEL =
  "I agree to the Terms of Use and Privacy Policy and consent to receive electronic communications from Menuply regarding my account, orders, services, and important updates.";

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
