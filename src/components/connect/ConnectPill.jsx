/**
 * Small green "Connect" pill — shared by search video cards and campus posts.
 */

import React from "react";

export const CONNECT_PILL_STYLE = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.2,
  color: "#166534",
  background: "#dcfce7",
  borderRadius: 999,
  padding: "1px 6px",
  flex: "0 0 auto",
};

export default function ConnectPill({ "data-testid": testId = "connect-pill" }) {
  return (
    <span data-testid={testId} style={CONNECT_PILL_STYLE}>
      Connect
    </span>
  );
}
