import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  createFranchiseBotBrand,
  getFranchiseBotJob,
  listFranchiseBotChains,
  listFranchiseBotClusters,
  parseFranchiseBotPaste,
  startFranchiseBotInstall,
  startFranchiseBotPreview,
} from "../../lib/ownerApi.js";

/**
 * Owner → Bots → Franchise Bot.
 *   1. Choose the chain (and its official store locator)
 *   2. Paste a store list (Google Maps results, CSV, plain addresses)
 *   3. Check stores: the locator fills missing addresses by phone; stores we
 *      already have are matched; messy old menus are flagged
 *   4. Install: stores, clusters, chain menu — each store on its own
 */

export const inputStyle = {
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "9px 12px",
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff",
};

export function primaryButtonStyle({ busy = false, disabled = false } = {}) {
  return {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
    opacity: disabled ? 0.45 : busy ? 0.7 : 1,
    whiteSpace: "nowrap",
  };
}

export const secondaryButtonStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "9px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: OWNER_COLORS.ink };
export const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };
export const errorStyle = { color: "#b42318", fontSize: 13, marginTop: 8 };
export const thStyle = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: OWNER_COLORS.muted, borderBottom: `1px solid ${OWNER_COLORS.line}`, whiteSpace: "nowrap" };
export const tdStyle = { padding: "8px 10px", fontSize: 13, borderBottom: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" };

const TONES = {
  green: { bg: "#e7f6ec", fg: "#146c2e" },
  blue: { bg: "#e8f0fe", fg: "#1849a9" },
  amber: { bg: "#fff4e5", fg: "#93370d" },
  red: { bg: "#fde8e8", fg: "#b42318" },
  grey: { bg: "#f2f4f7", fg: "#475467" },
};

export function Pill({ tone = "grey", children }) {
  const t = TONES[tone] || TONES.grey;
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function rowPill(row) {
  if (row.status !== "ready") return <Pill tone="amber">Needs address</Pill>;
  if (row.action === "update") return <Pill tone="blue">Already in Menuply #{row.existing?.restaurant_id}</Pill>;
  return <Pill tone="green">New store</Pill>;
}

/** Poll a background job every 2 s until it finishes. */
export function useJob() {
  const [job, setJob] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function follow(started) {
    clearTimeout(timer.current);
    setJob(started);
    const tick = async () => {
      try {
        const data = await getFranchiseBotJob(started.id);
        setJob(data.job);
        if (data.job.status === "running") timer.current = setTimeout(tick, 2000);
      } catch (err) {
        if (err?.status === 404) setJob((j) => ({ ...j, status: "failed", error: err.message }));
        else timer.current = setTimeout(tick, 4000);
      }
    };
    timer.current = setTimeout(tick, 1500);
  }
  return [job, follow, setJob];
}

export function Step({ number, title, subtitle, children, done }) {
  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle
        title={`${number}. ${title}`}
        subtitle={subtitle}
        action={done ? <Pill tone="green">Done</Pill> : null}
      />
      {children}
    </PageCard>
  );
}

/**
 * A brand Menuply doesn't have yet. Large company-owned brands (CAVA) are added here as
 * chains so every store is findable; small multi-location groups belong in Menubot (MLE).
 */
function NewBrandForm({ initialName, onCreated }) {
  const [name, setName] = useState(initialName || "");
  const [website, setWebsite] = useState("");
  const [companyOwned, setCompanyOwned] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await createFranchiseBotBrand({ name: name.trim(), website_url: website.trim() || null, company_owned: companyOwned });
      onCreated(data.chain);
    } catch (err) {
      const existing = err?.payload?.chain;
      if (existing) onCreated(existing);
      else setError(err?.payload?.error || err?.message || "Could not add the brand");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={create} style={{ marginTop: 14, padding: 12, border: `1px dashed ${OWNER_COLORS.line}`, borderRadius: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Add a new brand</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, flex: "1 1 180px" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name, e.g. CAVA" />
        <input style={{ ...inputStyle, flex: "1 1 220px" }} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://cava.com (optional)" />
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, fontSize: 13 }}>
        <input type="checkbox" checked={companyOwned} onChange={(e) => setCompanyOwned(e.target.checked)} />
        Company-owned (not franchised) — one menu for every store
      </label>
      <div style={{ ...mutedStyle, marginTop: 4 }}>
        For brands with many stores. A small group with a few locations is an MLE — add it in Menubot instead.
      </div>
      {error ? <div style={errorStyle}>{error}</div> : null}
      <button type="submit" style={{ ...primaryButtonStyle({ busy, disabled: name.trim().length < 2 }), marginTop: 10 }} disabled={busy || name.trim().length < 2}>
        {busy ? "Adding…" : "Add brand"}
      </button>
    </form>
  );
}

export function ChainPicker({ chain, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await listFranchiseBotChains(query.trim());
      setResults(data.chains || []);
    } catch (err) {
      setError(err?.message || "Could not search chains");
    } finally {
      setBusy(false);
    }
  }

  if (chain) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{chain.name}</div>
          <div style={mutedStyle}>
            {chain.default_ownership_type === "company_owned" ? "Company-owned" : "Franchise"} #{chain.id} · {chain.store_count} stores ·{" "}
            {chain.menu_item_count ? `${chain.menu_item_count} menu items` : "no chain menu yet"}
          </div>
        </div>
        <button type="button" style={secondaryButtonStyle} disabled={disabled} onClick={() => onChange(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={search}>
      <label style={labelStyle} htmlFor="franchise-bot-chain">Chain</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          id="franchise-bot-chain"
          style={{ ...inputStyle, flex: "1 1 260px" }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chains, e.g. Carl's Jr."
        />
        <button type="submit" style={primaryButtonStyle({ busy })} disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {results ? (
        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {results.length === 0 ? (
            <NewBrandForm initialName={query.trim()} onCreated={onChange} />
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c)}
                style={{ ...secondaryButtonStyle, textAlign: "left", fontWeight: 400, display: "flex", justifyContent: "space-between", gap: 12 }}
              >
                <span style={{ fontWeight: 700 }}>{c.name}</span>
                <span style={mutedStyle}>
                  {c.default_ownership_type === "company_owned" ? "Company-owned · " : ""}
                  {c.store_count} stores · {c.menu_item_count} menu items
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </form>
  );
}

function ClusterPicker({ cluster, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);

  async function search(e) {
    e.preventDefault();
    const data = await listFranchiseBotClusters(query.trim()).catch(() => ({ clusters: [] }));
    setResults(data.clusters || []);
  }

  if (cluster) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span>
          Cluster: <strong>{cluster.name}</strong> <span style={mutedStyle}>({cluster.slug})</span>
        </span>
        <button type="button" style={secondaryButtonStyle} onClick={() => onChange(null)}>Remove</button>
      </div>
    );
  }
  return (
    <form onSubmit={search} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <input style={{ ...inputStyle, flex: "1 1 200px" }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a cluster, e.g. USC" />
      <button type="submit" style={secondaryButtonStyle}>Find</button>
      {results ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%" }}>
          {results.length === 0 ? <span style={mutedStyle}>No clusters found.</span> : null}
          {results.map((c) => (
            <button key={c.id} type="button" style={secondaryButtonStyle} onClick={() => onChange(c)}>
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}

function AddressCell({ row, onEdit, editable }) {
  const flags = [
    row.coordinatesApproximate ? "map: city centre" : null,
    row.cityGuessed ? "city guessed" : null,
  ].filter(Boolean);
  if (!editable) {
    return (
      <>
        {row.label ? <div style={{ fontWeight: 700 }}>{row.label}</div> : null}
        <div>{row.addressLine1 || <span style={mutedStyle}>—</span>}</div>
        <div style={mutedStyle}>
          {[row.city, row.state].filter(Boolean).join(", ")} {row.postalCode || ""}
        </div>
        {flags.length ? <div style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>{flags.join(" · ")}</div> : null}
      </>
    );
  }
  const field = (key, placeholder, width) => (
    <input
      style={{ ...inputStyle, padding: "6px 8px", fontSize: 13, width }}
      value={row[key] || ""}
      placeholder={placeholder}
      onChange={(e) => onEdit({ [key]: e.target.value })}
    />
  );
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {field("addressLine1", "Street address", "100%")}
      <div style={{ display: "flex", gap: 4 }}>
        {field("city", "City", 120)}
        {field("state", "ST", 48)}
        {field("postalCode", "ZIP", 70)}
      </div>
    </div>
  );
}

export default function OwnerFranchiseBot() {
  const [chain, setChain] = useState(null);
  const [locatorUrl, setLocatorUrl] = useState("");
  const [defaultState, setDefaultState] = useState("");
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewJob, followPreview, setPreviewJob] = useJob();
  const [installJob, followInstall, setInstallJob] = useJob();
  const [cluster, setCluster] = useState(null);
  const [hideLegacy, setHideLegacy] = useState(false);
  const [startError, setStartError] = useState("");

  const installing = installJob?.status === "running";

  function chooseChain(c) {
    setChain(c);
    setLocatorUrl(c?.suggested_locator_url || "");
    resetFrom("chain");
  }

  function resetFrom(step) {
    if (step === "chain") {
      setParsed(null);
      setPaste("");
    }
    setRows(null);
    setPreview(null);
    setPreviewJob(null);
    setInstallJob(null);
    setStartError("");
  }

  async function readList() {
    setParsing(true);
    setParseError("");
    resetFrom("paste");
    try {
      const data = await parseFranchiseBotPaste(paste, defaultState.trim() || null);
      setParsed(data);
    } catch (err) {
      setParseError(err?.message || "Could not read the list");
    } finally {
      setParsing(false);
    }
  }

  async function checkStores() {
    setStartError("");
    // Clear the previous job first, or its result would be shown again while the new one starts.
    setPreviewJob(null);
    setRows(null);
    setPreview(null);
    setInstallJob(null);
    try {
      const data = await startFranchiseBotPreview({
        chain_id: chain.id,
        locations: parsed.locations,
        locator_base_url: locatorUrl.trim() || null,
        default_state: defaultState.trim() || null,
      });
      followPreview(data.job);
    } catch (err) {
      setStartError(err?.message || "Could not start the check");
    }
  }

  useEffect(() => {
    if (previewJob?.status === "done" && previewJob.result && !preview) {
      setPreview(previewJob.result);
      setRows(previewJob.result.rows.map((r) => ({ ...r, include: r.status === "ready", inCluster: false })));
    }
  }, [previewJob, preview]);

  function editRow(key, patch) {
    setRows((cur) =>
      cur.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.state) next.state = patch.state.toUpperCase().slice(0, 2);
        const ready = Boolean(next.addressLine1?.trim() && next.city?.trim() && next.state?.trim());
        // Edited rows are re-matched against existing stores during install.
        next.status = ready ? "ready" : "needs_address";
        next.action = ready ? next.action || "insert" : null;
        if (patch.include === undefined && ready && r.status !== "ready") next.include = true;
        return next;
      })
    );
  }

  const selected = useMemo(() => (rows || []).filter((r) => r.include && r.status === "ready"), [rows]);
  const legacyCount = selected.filter((r) => r.legacy_menu_rows > 0).length;

  async function install() {
    if (!selected.length) return;
    const ok = window.confirm(
      `Install ${selected.length} ${chain.name} store${selected.length === 1 ? "" : "s"} in production?` +
        (hideLegacy && legacyCount ? `\n\nOld menu rows at ${legacyCount} existing store(s) will be hidden (not deleted).` : "")
    );
    if (!ok) return;
    setStartError("");
    try {
      const data = await startFranchiseBotInstall({
        chain_id: chain.id,
        hide_legacy: hideLegacy,
        rows: selected.map((r) => ({ ...r, clusterSlug: cluster && r.inCluster ? cluster.slug : null })),
      });
      followInstall(data.job);
    } catch (err) {
      setStartError(err?.message || "Could not start the install");
    }
  }

  const installResult = installJob?.status === "done" ? installJob.result : null;

  return (
    <OwnerLayout title="Franchise Bot">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={mutedStyle}>
          Paste a chain's store list — a brand's locations page (store name + address), Google Maps results, a CSV,
          or plain addresses. New brand? Search for it and add it, company-owned or franchise. The bot fills in missing
          addresses from the chain's official store locator, matches stores Menuply already has, and adds the rest
          with the chain menu. Nothing is written until you press Install. <Link to="/owner/bots">All bots</Link>
        </div>

        <Step number={1} title="Chain" subtitle="Which franchise are these stores?" done={Boolean(chain)}>
          <ChainPicker chain={chain} onChange={chooseChain} disabled={installing} />
          {chain ? (
            <div style={{ display: "grid", gap: 12, marginTop: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
              <div>
                <label style={labelStyle} htmlFor="franchise-bot-locator">Official store locator</label>
                <input
                  id="franchise-bot-locator"
                  style={{ ...inputStyle, width: "100%" }}
                  value={locatorUrl}
                  onChange={(e) => setLocatorUrl(e.target.value)}
                  placeholder="https://locations.example.com"
                />
                <div style={{ ...mutedStyle, marginTop: 4 }}>Used to fill in addresses by phone number. Leave empty to skip.</div>
              </div>
              <div>
                <label style={labelStyle} htmlFor="franchise-bot-state">State (if the list doesn't say)</label>
                <input
                  id="franchise-bot-state"
                  style={{ ...inputStyle, width: 90 }}
                  value={defaultState}
                  maxLength={2}
                  onChange={(e) => setDefaultState(e.target.value.toUpperCase())}
                  placeholder="CA"
                />
              </div>
            </div>
          ) : null}
          {chain && chain.menu_item_count === 0 ? (
            <div style={{ ...errorStyle, color: "#93370d" }}>This chain has no menu yet — stores will be added without menu items.</div>
          ) : null}
        </Step>

        {chain ? (
          <Step number={2} title="Paste stores" subtitle="Copy straight from Google Maps or a spreadsheet." done={Boolean(parsed)}>
            <textarea
              aria-label="Store list"
              style={{ ...inputStyle, width: "100%", minHeight: 180, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
              value={paste}
              onChange={(e) => { setPaste(e.target.value); if (parsed) resetFrom("chain-keep"); setParsed(null); }}
              placeholder={"2912 S Figueroa St · (213) 747-5801\nInglewood, CA · (310) 671-1686\n123 Main St, Los Angeles, CA 90007"}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={primaryButtonStyle({ busy: parsing, disabled: !paste.trim() })} disabled={!paste.trim() || parsing} onClick={readList}>
                {parsing ? "Reading…" : "Read list"}
              </button>
              {parsed ? (
                <span style={mutedStyle}>
                  Found <strong>{parsed.locations.length}</strong> stores
                  {parsed.duplicates.length ? ` · ${parsed.duplicates.length} listed twice (merged)` : ""}
                  {parsed.ignored_lines ? ` · ${parsed.ignored_lines} other lines skipped (reviews, hours…)` : ""}
                </span>
              ) : null}
            </div>
            {parseError ? <div style={errorStyle}>{parseError}</div> : null}
          </Step>
        ) : null}

        {parsed && parsed.locations.length ? (
          <Step
            number={3}
            title="Check stores"
            subtitle="Fills missing addresses from the store locator and finds stores Menuply already has. Read-only."
            done={Boolean(preview)}
          >
            <button
              type="button"
              style={primaryButtonStyle({ busy: previewJob?.status === "running", disabled: installing })}
              disabled={previewJob?.status === "running" || installing}
              onClick={checkStores}
            >
              {previewJob?.status === "running" ? "Checking…" : preview ? "Check again" : `Check ${parsed.locations.length} stores`}
            </button>
            {previewJob?.status === "running" ? <div style={{ ...mutedStyle, marginTop: 8 }}>{previewJob.progress?.message}</div> : null}
            {previewJob?.status === "failed" ? <div style={errorStyle}>{previewJob.error}</div> : null}
            {startError && !installJob ? <div style={errorStyle}>{startError}</div> : null}

            {preview ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <Pill tone="green">{preview.summary.insert} new</Pill>
                  <Pill tone="blue">{preview.summary.update} already in Menuply</Pill>
                  {preview.summary.needs_address ? <Pill tone="amber">{preview.summary.needs_address} need an address</Pill> : null}
                  {preview.summary.with_legacy_menu ? <Pill tone="red">{preview.summary.with_legacy_menu} with an old menu</Pill> : null}
                  {preview.summary.approximate_location ? <Pill tone="amber">{preview.summary.approximate_location} placed at city centre</Pill> : null}
                  {preview.locator.used ? (
                    <span style={mutedStyle}>Store locator: {preview.locator.pages_fetched} pages read</span>
                  ) : null}
                </div>
                {preview.locator.used && preview.locator.directory_urls.length === 0 ? (
                  <div style={{ ...errorStyle, marginBottom: 8 }}>
                    Couldn't read the store locator at {locatorUrl}. Addresses came from your paste only.
                  </div>
                ) : null}
                {(preview.warnings || []).map((w) => (
                  <div key={w} style={{ ...errorStyle, color: "#93370d" }}>{w}</div>
                ))}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <input
                            type="checkbox"
                            aria-label="Select all ready stores"
                            checked={rows.filter((r) => r.status === "ready").every((r) => r.include)}
                            onChange={(e) => setRows((cur) => cur.map((r) => (r.status === "ready" ? { ...r, include: e.target.checked } : r)))}
                          />
                        </th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Address</th>
                        <th style={thStyle}>Phone</th>
                        <th style={thStyle}>Address from</th>
                        <th style={thStyle}>Old menu rows</th>
                        {cluster ? <th style={thStyle}>Add to {cluster.name}</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.key}>
                          <td style={tdStyle}>
                            <input
                              type="checkbox"
                              aria-label={`Include ${r.addressLine1 || r.raw}`}
                              disabled={r.status !== "ready"}
                              checked={Boolean(r.include)}
                              onChange={(e) => editRow(r.key, { include: e.target.checked })}
                            />
                          </td>
                          <td style={tdStyle}>{rowPill(r)}</td>
                          <td style={tdStyle}>
                            <AddressCell row={r} editable={r.status !== "ready" || r.edited} onEdit={(p) => editRow(r.key, { ...p, edited: true })} />
                            {r.existing && r.existing.address_line1 !== r.addressLine1 ? (
                              <div style={mutedStyle}>Currently: {r.existing.address_line1 || "no address"}</div>
                            ) : null}
                          </td>
                          <td style={tdStyle}>{r.phone || <span style={mutedStyle}>—</span>}</td>
                          <td style={tdStyle}>
                            {r.source === "locator" ? (
                              r.locatorUrl ? <a href={r.locatorUrl} target="_blank" rel="noreferrer">Store locator</a> : "Store locator"
                            ) : (
                              "Your paste"
                            )}
                          </td>
                          <td style={tdStyle}>{r.legacy_menu_rows ? <Pill tone="red">{r.legacy_menu_rows}</Pill> : <span style={mutedStyle}>—</span>}</td>
                          {cluster ? (
                            <td style={tdStyle}>
                              <input
                                type="checkbox"
                                aria-label={`Add ${r.addressLine1 || r.raw} to ${cluster.name}`}
                                disabled={r.status !== "ready"}
                                checked={Boolean(r.inCluster)}
                                onChange={(e) => editRow(r.key, { inCluster: e.target.checked })}
                              />
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </Step>
        ) : null}

        {preview ? (
          <Step number={4} title="Install" subtitle="Adds the stores to production. Each store is saved on its own." done={Boolean(installResult)}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={labelStyle}>Cluster (optional)</div>
                <ClusterPicker cluster={cluster} onChange={setCluster} />
                {cluster ? <div style={{ ...mutedStyle, marginTop: 4 }}>Tick “Add to {cluster.name}” on the stores that belong in it.</div> : null}
              </div>
              {legacyCount ? (
                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
                  <input type="checkbox" checked={hideLegacy} onChange={(e) => setHideLegacy(e.target.checked)} style={{ marginTop: 3 }} />
                  <span>
                    Hide the old menu rows at {legacyCount} existing store{legacyCount === 1 ? "" : "s"} so only the chain menu shows.
                    <span style={{ ...mutedStyle, display: "block" }}>Rows are hidden, never deleted, and every hidden row is recorded in the audit log.</span>
                  </span>
                </label>
              ) : null}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={primaryButtonStyle({ busy: installing, disabled: !selected.length })}
                  disabled={!selected.length || installing}
                  onClick={install}
                >
                  {installing ? "Installing…" : `Install ${selected.length} store${selected.length === 1 ? "" : "s"}`}
                </button>
                {installing ? <span style={mutedStyle}>{installJob.progress?.message}</span> : null}
              </div>
              {startError && installJob === null ? <div style={errorStyle}>{startError}</div> : null}
              {installJob?.status === "failed" ? <div style={errorStyle}>{installJob.error}</div> : null}

              {installResult ? (
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <Pill tone="green">{installResult.summary.inserted} added</Pill>
                    <Pill tone="blue">{installResult.summary.updated} updated</Pill>
                    {installResult.summary.failed ? <Pill tone="red">{installResult.summary.failed} failed</Pill> : null}
                    {installResult.summary.legacy_rows_hidden ? (
                      <Pill tone="grey">{installResult.summary.legacy_rows_hidden} old menu rows hidden</Pill>
                    ) : null}
                  </div>
                  {installResult.results.length === 0 ? (
                    <EmptyState>No stores were installed.</EmptyState>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Store</th>
                            <th style={thStyle}>Result</th>
                            <th style={thStyle}>Menu items</th>
                            <th style={thStyle}>Map location from</th>
                            <th style={thStyle}>Cluster</th>
                          </tr>
                        </thead>
                        <tbody>
                          {installResult.results.map((r) => (
                            <tr key={r.key}>
                              <td style={tdStyle}>
                                {r.restaurant_id ? <Link to={`/restaurants/${r.restaurant_id}`}>{r.label}</Link> : r.label}
                                {r.restaurant_id ? <div style={mutedStyle}>#{r.restaurant_id}</div> : null}
                              </td>
                              <td style={tdStyle}>
                                {r.ok ? (
                                  <Pill tone={r.action === "inserted" ? "green" : "blue"}>{r.action === "inserted" ? "Added" : "Updated"}</Pill>
                                ) : (
                                  <>
                                    <Pill tone="red">Failed</Pill>
                                    <div style={{ ...errorStyle, marginTop: 4 }}>{r.error}</div>
                                  </>
                                )}
                              </td>
                              <td style={tdStyle}>
                                {r.ok ? `${r.menu_items_synced} added${r.menu_items_mirrored ? `, ${r.menu_items_mirrored} published` : ""}` : "—"}
                                {r.hidden_legacy_rows?.length ? <div style={mutedStyle}>{r.hidden_legacy_rows.length} old rows hidden</div> : null}
                              </td>
                              <td style={tdStyle}>{r.coordinates_source === "locator" ? "Store locator" : r.coordinates_source === "openstreetmap" ? "OpenStreetMap" : "—"}</td>
                              <td style={tdStyle}>
                                {r.cluster?.error ? (
                                  <span style={errorStyle}>{r.cluster.error}</span>
                                ) : r.cluster ? (
                                  <>
                                    {r.cluster.cluster}
                                    {r.cluster.position ? (
                                      <div style={{ ...mutedStyle, color: r.cluster.position.on_first_page ? OWNER_COLORS.muted : "#93370d" }}>
                                        #{r.cluster.position.position} of {r.cluster.position.total}
                                        {r.cluster.position.on_first_page
                                          ? ""
                                          : " · behind “Load more” — move it in the restaurant's cluster settings"}
                                      </div>
                                    ) : null}
                                  </>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {installResult.summary.failed ? (
                    <div style={{ ...mutedStyle, marginTop: 8 }}>
                      Failed stores weren't saved. Fix them above and install again — stores already added are matched, not duplicated.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Step>
        ) : null}
      </div>
    </OwnerLayout>
  );
}
