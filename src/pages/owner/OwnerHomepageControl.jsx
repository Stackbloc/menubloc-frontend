import React, { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  addOwnerHomepageMembership,
  disableOwnerHomepageMembership,
  getOwnerHomepageMemberships,
  getOwnerHomepageSections,
  getOwnerRestaurantMarkets,
  patchOwnerHomepageMembership,
  patchOwnerHomepageSection,
  searchOwnerHomepageRestaurants,
} from "../../lib/ownerApi.js";

const MARKETS_ALL = { key: "all", label: "All markets" };

function Badge({ children, tone = "neutral" }) {
  const bg =
    tone === "ok"
      ? "#d4edda"
      : tone === "warn"
        ? "#fff3cd"
        : tone === "bad"
          ? "#f8d7da"
          : "#eef1f0";
  const color =
    tone === "ok"
      ? "#155724"
      : tone === "warn"
        ? "#856404"
        : tone === "bad"
          ? "#721c24"
          : OWNER_COLORS.muted;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 99,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function eligibilityTone(membership) {
  const e = membership?.eligibility;
  if (!e) return "neutral";
  if (e.currently_renderable) return "ok";
  if (e.membership_enabled === false || e.section_enabled === false) return "neutral";
  return "warn";
}

export default function OwnerHomepageControl() {
  const [marketKey, setMarketKey] = useState("all");
  const [regionKey, setRegionKey] = useState("all");
  const [markets, setMarkets] = useState([MARKETS_ALL]);
  const [sections, setSections] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [titleDrafts, setTitleDrafts] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const scopeParams = useMemo(() => {
    const params = {};
    if (marketKey && marketKey !== "all") params.market_key = marketKey;
    if (regionKey && regionKey !== "all") params.region_key = regionKey;
    return params;
  }, [marketKey, regionKey]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [secRes, memRes] = await Promise.all([
        getOwnerHomepageSections(scopeParams),
        getOwnerHomepageMemberships(scopeParams),
      ]);
      const nextSections = secRes.sections || [];
      setSections(nextSections);
      setMemberships(memRes.memberships || []);
      setTitleDrafts(
        Object.fromEntries(nextSections.map((s) => [s.id, s.display_title]))
      );
      if (!selectedSectionId && nextSections[0]) {
        setSelectedSectionId(nextSections[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load homepage controls");
    } finally {
      setLoading(false);
    }
  }, [scopeParams, selectedSectionId]);

  useEffect(() => {
    getOwnerRestaurantMarkets()
      .then((res) => {
        const list = Array.isArray(res.markets)
          ? res.markets
          : Array.isArray(res)
            ? res
            : [];
        const mapped = list
          .map((m) => {
            if (typeof m === "string") return { key: m, label: m };
            const key = m.market || m.city || m.key || m.label;
            if (!key) return null;
            return { key: String(key), label: String(m.label || key) };
          })
          .filter(Boolean);
        setMarkets([MARKETS_ALL, ...mapped]);
      })
      .catch(() => setMarkets([MARKETS_ALL]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const sectionMemberships = useMemo(
    () =>
      memberships.filter((m) =>
        selectedSectionId ? m.section_id === selectedSectionId : true
      ),
    [memberships, selectedSectionId]
  );

  async function saveSectionTitle(section) {
    const nextTitle = String(titleDrafts[section.id] || "").trim();
    if (!nextTitle || nextTitle === section.display_title) return;
    setBusy(true);
    try {
      await patchOwnerHomepageSection(section.id, { display_title: nextTitle });
      await reload();
    } catch (err) {
      setError(err.message || "Title update failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSection(section) {
    setBusy(true);
    try {
      await patchOwnerHomepageSection(section.id, { enabled: !section.enabled });
      await reload();
    } catch (err) {
      setError(err.message || "Section toggle failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveSection(section, delta) {
    setBusy(true);
    try {
      await patchOwnerHomepageSection(section.id, {
        display_order: Number(section.display_order) + delta,
      });
      await reload();
    } catch (err) {
      setError(err.message || "Section reorder failed");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    setBusy(true);
    try {
      const res = await searchOwnerHomepageRestaurants({
        q: searchQ,
        ...scopeParams,
        limit: 30,
      });
      setSearchResults(res.restaurants || []);
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function addRestaurant(restaurantId) {
    if (!selectedSectionId) return;
    setBusy(true);
    try {
      await addOwnerHomepageMembership({
        restaurant_id: restaurantId,
        section_id: selectedSectionId,
        market_key: marketKey === "all" ? null : marketKey,
        region_key: regionKey === "all" ? null : regionKey,
        enabled: true,
        display_order: sectionMemberships.length,
      });
      await reload();
    } catch (err) {
      setError(err.message || "Add membership failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeMembership(membershipId) {
    setBusy(true);
    try {
      await disableOwnerHomepageMembership(membershipId);
      await reload();
    } catch (err) {
      setError(err.message || "Disable membership failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveMembership(membership, targetSectionId) {
    setBusy(true);
    try {
      await patchOwnerHomepageMembership(membership.id, {
        section_id: targetSectionId,
      });
      await reload();
    } catch (err) {
      setError(err.message || "Move membership failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeMembershipOrder(membership, delta) {
    setBusy(true);
    try {
      await patchOwnerHomepageMembership(membership.id, {
        display_order: Number(membership.display_order || 0) + delta,
      });
      await reload();
    } catch (err) {
      setError(err.message || "Order update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <OwnerLayout>
      <SectionTitle
        title="Homepage Controls"
        subtitle="Manual section titles and restaurant membership. Membership survives cache rebuild and temporary ineligibility."
      />

      {error ? (
        <PageCard style={{ padding: 14, marginBottom: 16, color: "#721c24", background: "#f8d7da" }}>
          {error}
        </PageCard>
      ) : null}

      <PageCard style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
            Market
            <select
              value={marketKey}
              onChange={(e) => setMarketKey(e.target.value)}
              style={{ display: "block", marginTop: 4, minWidth: 180, padding: 8 }}
            >
              {markets.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
            Region
            <select
              value={regionKey}
              onChange={(e) => setRegionKey(e.target.value)}
              style={{ display: "block", marginTop: 4, minWidth: 120, padding: 8 }}
            >
              <option value="all">All</option>
              <option value="CA">CA</option>
              <option value="AL">AL</option>
              <option value="IL">IL</option>
              <option value="TX">TX</option>
            </select>
          </label>
          <button
            type="button"
            onClick={reload}
            disabled={busy || loading}
            style={{ marginTop: 18, padding: "8px 14px" }}
          >
            Refresh
          </button>
        </div>
      </PageCard>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(360px, 1.4fr)", gap: 16 }}>
        <PageCard style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Sections</h3>
          {loading ? (
            <div style={{ color: OWNER_COLORS.muted }}>Loading…</div>
          ) : sections.length === 0 ? (
            <EmptyState>
              No sections. Run the homepage_sections migration to seed popular/nearby/discover/more.
            </EmptyState>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {sections.map((section) => (
                <li
                  key={section.id}
                  style={{
                    border: `1px solid ${OWNER_COLORS.line}`,
                    borderRadius: 12,
                    padding: 12,
                    background:
                      selectedSectionId === section.id ? OWNER_COLORS.accentSoft : OWNER_COLORS.panel,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(section.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>{section.internal_key}</strong>
                      <Badge tone={section.enabled ? "ok" : "neutral"}>
                        {section.enabled ? "enabled" : "disabled"}
                      </Badge>
                    </div>
                  </button>
                  <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
                    Stable key (immutable): {section.internal_key}
                  </div>
                  <input
                    value={titleDrafts[section.id] ?? ""}
                    onChange={(e) =>
                      setTitleDrafts((prev) => ({ ...prev, [section.id]: e.target.value }))
                    }
                    style={{ width: "100%", marginTop: 8, padding: 8 }}
                    aria-label={`Display title for ${section.internal_key}`}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    <button type="button" disabled={busy} onClick={() => saveSectionTitle(section)}>
                      Save title
                    </button>
                    <button type="button" disabled={busy} onClick={() => toggleSection(section)}>
                      {section.enabled ? "Disable" : "Enable"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => moveSection(section, -1)}>
                      Order ↑
                    </button>
                    <button type="button" disabled={busy} onClick={() => moveSection(section, 1)}>
                      Order ↓
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PageCard>

        <div style={{ display: "grid", gap: 16 }}>
          <PageCard style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Add restaurant</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search restaurants"
                style={{ flex: 1, padding: 8 }}
              />
              <button type="button" disabled={busy} onClick={runSearch}>
                Search
              </button>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
              {searchResults.map((r) => (
                <li
                  key={r.restaurant_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                    borderBottom: `1px solid ${OWNER_COLORS.line}`,
                    paddingBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.restaurant_name}</div>
                    <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                      {r.city}, {r.state} ·{" "}
                      <Badge tone={r.classification === "active_menu" ? "ok" : "neutral"}>
                        {r.classification === "active_menu" ? "active menu" : "profile-only"}
                      </Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy || !selectedSectionId}
                    onClick={() => addRestaurant(r.restaurant_id)}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </PageCard>

          <PageCard style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Memberships</h3>
            {sectionMemberships.length === 0 ? (
              <EmptyState>
                No memberships in this section. Search and add restaurants. Non-renderable rows stay listed with reasons.
              </EmptyState>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                {sectionMemberships.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      border: `1px solid ${OWNER_COLORS.line}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <strong>{m.restaurant_name || `(restaurant ${m.restaurant_id})`}</strong>
                        <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
                          {m.city}, {m.state}
                        </div>
                      </div>
                      <Badge tone={eligibilityTone(m)}>
                        {m.eligibility?.currently_renderable
                          ? "renderable"
                          : m.eligibility?.primary_reason || "ineligible"}
                      </Badge>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <Badge tone={m.eligibility?.classification === "active_menu" ? "ok" : "neutral"}>
                        {m.eligibility?.classification || "unknown"}
                      </Badge>
                      {!m.enabled ? <Badge>membership disabled</Badge> : null}
                      {!m.section_enabled ? <Badge tone="warn">section disabled</Badge> : null}
                      {(m.eligibility?.ineligibility_reasons || []).map((reason) => (
                        <Badge key={reason} tone="warn">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      <button type="button" disabled={busy} onClick={() => changeMembershipOrder(m, -1)}>
                        Order ↑
                      </button>
                      <button type="button" disabled={busy} onClick={() => changeMembershipOrder(m, 1)}>
                        Order ↓
                      </button>
                      <select
                        defaultValue=""
                        disabled={busy}
                        onChange={(e) => {
                          if (e.target.value) moveMembership(m, e.target.value);
                        }}
                      >
                        <option value="">Move to section…</option>
                        {sections
                          .filter((s) => s.id !== m.section_id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.internal_key}
                            </option>
                          ))}
                      </select>
                      <button type="button" disabled={busy} onClick={() => removeMembership(m.id)}>
                        Disable
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PageCard>
        </div>
      </div>
    </OwnerLayout>
  );
}
