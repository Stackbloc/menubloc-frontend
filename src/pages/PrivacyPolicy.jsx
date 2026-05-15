import React from "react";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { PRIVACY_DOCUMENT } from "../content/legal.js";
import { usePageMeta } from "../hooks/usePageMeta.js";

export default function PrivacyPolicy() {
  usePageMeta();
  return <LegalDocumentPage eyebrow="Privacy" document={PRIVACY_DOCUMENT} />;
}
