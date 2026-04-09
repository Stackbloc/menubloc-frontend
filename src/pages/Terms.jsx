import React from "react";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { TERMS_DOCUMENT } from "../content/legal.js";

export default function Terms() {
  return <LegalDocumentPage eyebrow="Terms" document={TERMS_DOCUMENT} />;
}
