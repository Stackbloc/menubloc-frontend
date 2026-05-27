import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { TERMS_DOCUMENT } from "../content/legal.js";

export default function Terms() {
  const { t } = useLanguage();
  return (
    <LegalDocumentPage
      eyebrow={t("terms.title", "Terms of use")}
      titleKey="terms.title"
      document={TERMS_DOCUMENT}
    />
  );
}
