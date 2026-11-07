import React, { useState } from "react";
import { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { formatDateTime } from "./ownerBotFormat.js";

/**
 * Owner → Bots → SEO Bot: the latest run's report.
 *   - Search Console: connected or how to connect; clicks/impressions vs the 28 days before; top searches
 *   - What to fix: findings grouped by kind, worst first, with example pages
 *   - Pages checked: what Google's crawler got back for each sampled page
 * Data: GET /api/owner/bots/seo_bot → latest_report, search_console.
 */

const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };
const SEVERITY = {
  problem: { label: "Problem", color: "#b91c1c" },
  warning: { label: "Warning", color: "#c2410c" },
  note: { label: "Note", color: OWNER_COLORS.muted },
};
const KIND_LABELS = {
  static: "Main page",
  city: "City",
  restaurant: "Restaurant",
  menu: "Menu",
  cluster: "Cluster",
  video: "Clip",
  venue: "Venue",
  dish: "Dish",
  probe: "Made-up URL (should be 404)",
};

function shortUrl(url) {
  return String(url || "").replace(/^https:\/\/menuply\.com/, "") || "/";
}

function Change({ now, before, suffix = "" }) {
  if (before == null || !Number.isFinite(before) || before === 0) return null;
  const pct = Math.round(((now - before) / before) * 100);
  const color = pct < -10 ? "#b91c1c" : OWNER_COLORS.muted;
  return <span style={{ color, fontSize: 12, fontWeight: 600 }}> {pct > 0 ? "+" : ""}{pct}%{suffix}</span>;
}

function SearchConsoleCard({ connection, summary, status }) {
  const traffic = summary?.traffic;
  if (!connection?.configured) {
    return (
      <PageCard style={{ padding: 24 }}>
        <SectionTitle title="Search Console" subtitle="Not connected. The bot checks what the site sends Google; connect Search Console to also see what Google did with it." />
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 14, color: OWNER_COLORS.ink }}>
          <li>In Google Cloud, create a service account, turn on the Google Search Console API, and download a JSON key.</li>
          <li>In Search Console → {connection?.property || "sc-domain:menuply.com"} → Settings → Users and permissions, add the service account&apos;s email with <strong>Full</strong> permission.</li>
          <li>On the backend (Railway), set <code>SEO_BOT_GSC_CREDENTIALS</code> to the key&apos;s JSON, then deploy and run the bot.</li>
        </ol>
      </PageCard>
    );
  }
  return (
    <PageCard style={{ padding: 24 }}>
      <SectionTitle
        title="Search Console"
        subtitle={`Connected to ${connection.property} as ${connection.service_account}.${status === "error" ? " The last run couldn't read it — see What to fix." : ""}`}
      />
      {traffic ? (
        <>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {[
              ["Clicks from Google", "clicks"],
              ["Times shown in Google", "impressions"],
            ].map(([label, key]) => (
              <div key={key}>
                <div style={mutedStyle}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: OWNER_COLORS.ink }}>
                  {Number(traffic.last_28_days[key] || 0).toLocaleString()}
                  <Change now={traffic.last_28_days[key]} before={traffic.previous_28_days[key]} />
                </div>
              </div>
            ))}
            <div>
              <div style={mutedStyle}>Average position</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: OWNER_COLORS.ink }}>{traffic.last_28_days.position ?? "—"}</div>
            </div>
          </div>
          <div style={{ ...mutedStyle, marginTop: 8 }}>
            {traffic.period.start} to {traffic.period.end}, compared with the 28 days before.
            {summary.resubmitted?.length ? " The bot asked Google to re-read the sitemap." : ""}
          </div>
          {summary.top_queries?.length ? (
            <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
                  <th style={{ padding: "6px 0" }}>Top searches</th>
                  <th>Clicks</th>
                  <th>Shown</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {summary.top_queries.map((q) => (
                  <tr key={q.query} style={{ borderTop: `1px solid ${OWNER_COLORS.line}` }}>
                    <td style={{ padding: "6px 0" }}>{q.query}</td>
                    <td>{q.clicks}</td>
                    <td>{q.impressions}</td>
                    <td>{q.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </>
      ) : (
        <div style={mutedStyle}>Run the bot to load search traffic.</div>
      )}
    </PageCard>
  );
}

function FindingGroup({ group }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY[group.severity] || SEVERITY.note;
  const examples = group.examples.filter((e) => e.url);
  return (
    <div style={{ padding: "14px 0", borderTop: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
        <span style={{ color: sev.color, fontWeight: 700, fontSize: 13, minWidth: 64 }}>{sev.label}</span>
        <span style={{ flex: 1, minWidth: 220, fontSize: 14, color: OWNER_COLORS.ink }}>
          {group.count > 1 && examples.length ? group.message.replace(/^This (sitemap )?page/, "Pages") : group.message}
        </span>
        {examples.length ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13 }}
          >
            {group.count} page{group.count === 1 ? "" : "s"} {open ? "▲" : "▼"}
          </button>
        ) : null}
      </div>
      {open ? (
        <ul style={{ margin: "8px 0 0 74px", padding: 0, listStyle: "none", display: "grid", gap: 6, fontSize: 13 }}>
          {examples.map((e) => (
            <li key={e.url}>
              <a href={e.url} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.accent }}>{shortUrl(e.url)}</a>
              {e.detail?.link ? (
                <>
                  {" · "}
                  <a href={e.detail.link} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.muted }}>Open in Search Console</a>
                </>
              ) : null}
              {e.message !== group.message ? <div style={mutedStyle}>{e.message}</div> : null}
            </li>
          ))}
          {group.count > examples.length ? <li style={mutedStyle}>…and {group.count - examples.length} more.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

function PagesChecked({ pages }) {
  const [open, setOpen] = useState(false);
  if (!pages?.length) return null;
  const shown = open ? pages : [];
  return (
    <PageCard style={{ padding: 24 }}>
      <SectionTitle
        title="Pages checked"
        subtitle={`${pages.length} pages from the sitemap, fetched the way Google's crawler fetches them. A fresh sample every run.`}
        action={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13 }}
          >
            {open ? "Hide" : "Show"}
          </button>
        }
      />
      {shown.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
                <th style={{ padding: "6px 8px 6px 0" }}>Page</th>
                <th>Kind</th>
                <th>Answer</th>
                <th>Time</th>
                <th>Title Google sees</th>
                <th>Google</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.url} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
                  <td style={{ padding: "6px 8px 6px 0", maxWidth: 280, wordBreak: "break-all" }}>
                    <a href={p.url} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.accent }}>{shortUrl(p.url)}</a>
                  </td>
                  <td>{KIND_LABELS[p.category] || p.category}</td>
                  <td style={{ color: p.issues?.length ? "#b91c1c" : OWNER_COLORS.ink }}>{p.http_status ?? "—"}</td>
                  <td>{p.response_ms != null ? `${(p.response_ms / 1000).toFixed(1)} s` : "—"}</td>
                  <td style={{ maxWidth: 260 }}>{p.title || "—"}</td>
                  <td style={mutedStyle}>{p.google?.coverage_state || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </PageCard>
  );
}

export default function SeoBotReport({ bot }) {
  const report = bot.latest_report;
  const groups = report?.groups || [];
  const problems = groups.filter((g) => g.severity === "problem").reduce((n, g) => n + g.count, 0);
  return (
    <>
      <SearchConsoleCard connection={bot.search_console} summary={report?.summary} status={report?.search_console} />
      <PageCard style={{ padding: 24 }}>
        <SectionTitle
          title="What to fix"
          subtitle={
            report
              ? `From the run on ${formatDateTime(report.started_at)}: ${report.totals.checked} pages checked${report.summary?.sitemap_pages ? ` of ${Number(report.summary.sitemap_pages).toLocaleString()} in the sitemap` : ""}. ${problems ? `${problems} problem${problems === 1 ? "" : "s"}.` : "No problems."}`
              : "Nothing yet — run the bot to get a report."
          }
        />
        {report && !groups.length ? <EmptyState>Everything checked looks right to Google.</EmptyState> : null}
        {groups.map((g) => <FindingGroup key={g.code} group={g} />)}
      </PageCard>
      <PagesChecked pages={report?.pages} />
    </>
  );
}
