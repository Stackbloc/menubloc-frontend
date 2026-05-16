import React from "react";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { TERMS_DOCUMENT } from "../content/legal.js";
import { usePageMeta } from "../hooks/usePageMeta.js";

export default function Terms() {
  usePageMeta();
  return <LegalDocumentPage eyebrow="Terms" document={TERMS_DOCUMENT} />;
}
