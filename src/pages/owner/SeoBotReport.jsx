import React, { useState } from "react";
import { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { formatDateTime } from "./ownerBotFormat.js";

/**
 * Owner → Bots → SEO Bot: the latest run's report.
 *   - Search Console: connected or how to connect; clicks/impressions vs the 28 days before; top searches
 *   - What to fix: findings grouped by kind, worst first, with example pages
 *   - Page types: every kind of page on the site (seo-pages.json) and whether Google gets the right thing
 *   - Clips: the clip sitemap, clip files, clip pages Google indexed, Google Videos traffic
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
  // duplicate_title is one finding per shared title; list every page that shares it.
  const examples = group.code === "duplicate_title"
    ? group.examples.flatMap((e) => (e.detail?.urls || [e.url]).map((url) => ({ ...e, url })))
    : group.examples.filter((e) => e.url);
  const pageCount = group.code === "duplicate_title" ? examples.length : group.count;
  return (
    <div style={{ padding: "14px 0", borderTop: `1px solid ${OWNER_COLORS.line}` }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
        <span style={{ color: sev.color, fontWeight: 700, fontSize: 13, minWidth: 64 }}>{sev.label}</span>
        <span style={{ flex: 1, minWidth: 220, fontSize: 14, color: OWNER_COLORS.ink }}>
          {pageCount > 1 && examples.length ? group.message.replace(/^This (sitemap )?page/, "Pages") : group.message}
        </span>
        {examples.length ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13 }}
          >
            {pageCount} page{pageCount === 1 ? "" : "s"} {open ? "▲" : "▼"}
          </button>
        ) : null}
      </div>
      {open ? (
        <ul style={{ margin: "8px 0 0 74px", padding: 0, listStyle: "none", display: "grid", gap: 6, fontSize: 13 }}>
          {examples.map((e) => (
            <li key={`${e.url}-${e.message}`}>
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
          {pageCount > examples.length ? <li style={mutedStyle}>…and {pageCount - examples.length} more.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

const KIND_GROUPS = [
  ["index", "Should be in Google", "Own title, own canonical, no noindex."],
  ["private", "Kept out of Google", "Accounts, tools, checkout and private links: should say noindex."],
  ["alias", "Old addresses", "Should redirect to the main page."],
  ["either", "Other public pages", "Not search landing pages; should at least have their own title."],
];

function PageTypes({ types }) {
  const [open, setOpen] = useState(false);
  if (!types?.length) return null;
  const bad = types.filter((t) => !t.ok);
  return (
    <PageCard style={{ padding: 24 }}>
      <SectionTitle
        title="Page types"
        subtitle={`Every kind of page on menuply.com, sitemap or not: ${types.length} types, ${bad.length ? `${bad.length} not right for Google` : "all right for Google"}. One example of each is fetched the way Google fetches it.`}
        action={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13 }}
          >
            {open ? "Show only what's wrong" : "Show all"}
          </button>
        }
      />
      {KIND_GROUPS.map(([kind, title, hint]) => {
        const rows = types.filter((t) => t.kind === kind && (open || !t.ok));
        if (!rows.length) return null;
        return (
          <div key={kind} style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink }}>{title}</div>
            <div style={{ ...mutedStyle, marginBottom: 6 }}>{hint}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.route} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" }}>
                      <td style={{ padding: "6px 8px 6px 0", width: "34%" }}>
                        <div style={{ color: OWNER_COLORS.ink, fontWeight: 600 }}>{t.label}</div>
                        <div style={{ ...mutedStyle, fontSize: 12, wordBreak: "break-all" }}>{t.route}</div>
                      </td>
                      <td style={{ padding: "6px 0" }}>
                        {t.examples.map((e, i) => (
                          <div key={e.url || e.from_sample || i} style={{ color: e.ok === false ? "#b91c1c" : OWNER_COLORS.ink }}>
                            {e.verdict}
                            {e.url ? (
                              <>
                                {" · "}
                                <a href={e.url} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.muted }}>
                                  {e.made_up ? "made-up address" : shortUrl(e.url)}
                                </a>
                              </>
                            ) : null}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </PageCard>
  );
}

function Clips({ clips }) {
  if (!clips) return null;
  const traffic = clips.video_traffic;
  const rows = [
    ["Clips in the clip sitemap", clips.video_sitemap ? Number(clips.in_video_sitemap || 0).toLocaleString() : "No clip sitemap"],
    ["Clip pages in the sitemap", Number(clips.clip_pages_in_sitemap || 0).toLocaleString()],
    ["Clip pages missing from the clip sitemap", Number(clips.missing_from_video_sitemap || 0).toLocaleString(), clips.missing_from_video_sitemap > 0],
    ["Clip files checked (video + thumbnail)", clips.media ? `${clips.media.checked}${clips.media.broken ? ` · ${clips.media.broken} broken` : " · all load"}` : "—", clips.media?.broken > 0],
    ["Clip pages checked", `${clips.pages_checked}${clips.pages_with_video_data_issues ? ` · ${clips.pages_with_video_data_issues} with video data problems` : ""}`, clips.pages_with_video_data_issues > 0],
    ["Asked Google about", clips.inspected ? `${clips.inspected} clip page${clips.inspected === 1 ? "" : "s"} · ${clips.indexed} indexed` : "—", clips.inspected > clips.indexed],
  ];
  if (clips.console_sitemap) {
    rows.push(["Clip sitemap in Search Console", `Read ${clips.console_sitemap.last_downloaded ? formatDateTime(clips.console_sitemap.last_downloaded) : "not yet"}${clips.console_sitemap.errors ? ` · ${clips.console_sitemap.errors} errors` : ""}`, clips.console_sitemap.errors > 0]);
  }
  return (
    <PageCard style={{ padding: 24 }}>
      <SectionTitle title="Clips" subtitle="Whether Google can find, play and show Menuply clips as videos." />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {rows.map(([label, value, bad]) => (
            <tr key={label} style={{ borderTop: `1px solid ${OWNER_COLORS.line}` }}>
              <td style={{ padding: "7px 8px 7px 0", color: OWNER_COLORS.muted }}>{label}</td>
              <td style={{ padding: "7px 0", color: bad ? "#b91c1c" : OWNER_COLORS.ink, fontWeight: 600 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {traffic ? (
        <div style={{ ...mutedStyle, marginTop: 10 }}>
          Google Videos, {traffic.period.start} to {traffic.period.end}: {Number(traffic.last_28_days.impressions || 0).toLocaleString()} times shown,{" "}
          {Number(traffic.last_28_days.clicks || 0).toLocaleString()} clicks
          <Change now={traffic.last_28_days.impressions} before={traffic.previous_28_days?.impressions} suffix=" shown" />.
        </div>
      ) : null}
      {clips.not_indexed?.length ? (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13, display: "grid", gap: 4 }}>
          {clips.not_indexed.map((c) => (
            <li key={c.url}>
              <a href={c.url} target="_blank" rel="noreferrer" style={{ color: OWNER_COLORS.accent }}>{shortUrl(c.url)}</a>
              <span style={mutedStyle}> — {c.state || "not indexed"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </PageCard>
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
      <PageTypes types={report?.page_types} />
      <Clips clips={report?.clips} />
      <PagesChecked pages={report?.pages} />
    </>
  );
}
