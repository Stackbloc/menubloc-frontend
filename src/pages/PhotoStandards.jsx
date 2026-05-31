import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { PHOTO_STANDARDS_DOCUMENT } from "../content/legal.js";

export default function PhotoStandards() {
  const { t } = useLanguage();
  return (
    <LegalDocumentPage
      eyebrow={t("photoStandards.eyebrow", "Photo standards")}
      titleKey="photoStandards.title"
      document={PHOTO_STANDARDS_DOCUMENT}
    />
  );
}
