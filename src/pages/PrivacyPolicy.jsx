import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { PRIVACY_DOCUMENT } from "../content/legal.js";

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  return <LegalDocumentPage eyebrow="Privacy" document={PRIVACY_DOCUMENT} />;
}
