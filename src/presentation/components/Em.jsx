import React from "react";
import { PRESENTATION_THEME } from "../theme.js";

export default function Em({ children }) {
  return <span style={{ color: PRESENTATION_THEME.accent }}>{children}</span>;
}
