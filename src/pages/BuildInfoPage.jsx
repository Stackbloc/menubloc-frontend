import { useEffect, useState } from "react";
import { fetchBuildInfo, getBuildInfoUrl } from "../lib/buildInfo.js";

export default function BuildInfoPage() {
  const [info, setInfo]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBuildInfo()
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, []);

  const row = (label, value) => (
    <tr key={label}>
      <td style={{ padding: "6px 16px 6px 0", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{label}</td>
      <td style={{ padding: "6px 0", fontFamily: "monospace", color: "#111827", wordBreak: "break-all" }}>
        {value ?? <span style={{ color: "#9ca3af" }}>null</span>}
      </td>
    </tr>
  );

  return (
    <div style={{ maxWidth: 680, margin: "48px auto", padding: "0 24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#111827" }}>Menuply Build Info</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>
        Identifies the exact code running on this deployment.{" "}
        <a href={getBuildInfoUrl()} style={{ color: "#1d4ed8" }}>View raw JSON</a>
      </p>

      {error && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 6 }}>
          Error: {error}
        </p>
      )}

      {!info && !error && (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      )}

      {info && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <tbody>
            {row("app",           info.app)}
            {row("gitSha",        info.gitSha)}
            {row("gitShortSha",   info.gitShortSha)}
            {row("branch",        info.branch)}
            {row("buildTime",     info.buildTime)}
            {row("buildSource",   info.buildSource)}
            {row("deploymentId",  info.deploymentId)}
            {row("vercelUrl",     info.vercelUrl)}
            {row("nodeEnv",       info.nodeEnv)}
            {row("commitMessage", info.commitMessage)}
          </tbody>
        </table>
      )}
    </div>
  );
}
