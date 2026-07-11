import React from "react";
import { CLUSTER_GROWING_NOTICE } from "../../lib/clusterUrl.js";

export default function ClusterGrowingNotice() {
  return (
    <section
      aria-label="Growing cluster notice"
      style={{
        marginBottom: "1rem",
        padding: "0.9rem 1rem",
        borderRadius: 12,
        border: "1px solid #fde68a",
        background: "#fffbeb",
        color: "#78350f",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{CLUSTER_GROWING_NOTICE.title}</div>
      <p style={{ margin: 0, lineHeight: 1.5, fontSize: "0.95rem", overflowWrap: "anywhere" }}>{CLUSTER_GROWING_NOTICE.body}</p>
    </section>
  );
}
