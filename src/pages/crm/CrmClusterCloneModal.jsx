import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cloneCrmCluster } from "../../lib/crmApi.js";
import { CRM_COLORS, ErrorBanner, SuccessBanner } from "./CrmShared.jsx";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${CRM_COLORS.line}`,
  background: "#fff",
  fontSize: 14,
};

const buttonStyle = {
  border: "none",
  background: CRM_COLORS.accent,
  color: "#fff",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#fff",
  color: CRM_COLORS.ink,
  border: `1px solid ${CRM_COLORS.line}`,
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['‘’"`“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const DEFAULT_COPY = {
  metadata: true,
  short_description: true,
  description: true,
  website: false,
  hero_image_url: false,
  settings: true,
  restaurant_assignments: false,
  featured_ordering: false,
};

/**
 * Clone Cluster workflow modal.
 * Reserved future copy targets are listed as disabled checkboxes.
 */
export default function CrmClusterCloneModal({ source, types = [], onClose, onCreated }) {
  const navigate = useNavigate();
  const [copy, setCopy] = useState(DEFAULT_COPY);
  const [restaurantMode, setRestaurantMode] = useState("none");
  const [radiusMiles, setRadiusMiles] = useState("0.5");
  const [overrides, setOverrides] = useState({
    name: source?.name ? `${source.name} Copy` : "",
    slug: source?.slug ? `${source.slug}-copy` : "",
    type: source?.type || "other",
    city: source?.city || "",
    state: source?.state || "",
    address_line1: source?.address_line1 || "",
    lat: source?.lat ?? "",
    lng: source?.lng ?? "",
  });
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("configure"); // configure | recalculate | done

  useEffect(() => {
    setOverrides({
      name: source?.name ? `${source.name} Copy` : "",
      slug: source?.slug ? `${source.slug}-copy` : "",
      type: source?.type || "other",
      city: source?.city || "",
      state: source?.state || "",
      address_line1: source?.address_line1 || "",
      lat: source?.lat ?? "",
      lng: source?.lng ?? "",
    });
    setCopy(DEFAULT_COPY);
    setRestaurantMode("none");
    setCandidates([]);
    setSelectedIds([]);
    setStep("configure");
  }, [source?.id]);

  const futureTargets = useMemo(
    () => ["Events", "Attractions", "Parking", "Hotels", "Deals", "Maps", "QR Codes", "Analytics configuration"],
    []
  );

  function toggleCopy(key) {
    setCopy((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === "restaurant_assignments" && !next.restaurant_assignments) {
        next.featured_ordering = false;
        if (restaurantMode === "keep") setRestaurantMode("none");
      }
      if (key === "featured_ordering" && next.featured_ordering) {
        next.restaurant_assignments = true;
      }
      return next;
    });
  }

  function buildPayload({ previewOnly = false, restaurantIds = null } = {}) {
    const mode =
      restaurantMode === "keep"
        ? "keep"
        : restaurantMode === "recalculate"
          ? "recalculate"
          : "none";

    return {
      overrides: {
        ...overrides,
        lat: overrides.lat === "" ? null : Number(overrides.lat),
        lng: overrides.lng === "" ? null : Number(overrides.lng),
      },
      copy: {
        ...copy,
        restaurant_assignments: mode === "keep" ? true : copy.restaurant_assignments,
        featured_ordering: mode === "keep" ? copy.featured_ordering : false,
      },
      restaurant_mode: mode,
      radius_miles: Number(radiusMiles),
      preview_only: previewOnly,
      restaurant_ids: restaurantIds,
    };
  }

  async function handlePreviewRecalculate() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const json = await cloneCrmCluster(source.id, buildPayload({ previewOnly: true }));
      const rows = Array.isArray(json.candidates) ? json.candidates : [];
      setCandidates(rows);
      setSelectedIds(rows.map((row) => Number(row.restaurant_id)));
      setStep("recalculate");
    } catch (err) {
      setError(err.message || "Unable to preview recalculated restaurants");
    } finally {
      setBusy(false);
    }
  }

  async function handleClone() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (restaurantMode === "recalculate" && step !== "recalculate") {
        await handlePreviewRecalculate();
        setBusy(false);
        return;
      }

      const payload = buildPayload({
        previewOnly: false,
        restaurantIds: restaurantMode === "recalculate" ? selectedIds : null,
      });
      if (restaurantMode === "keep") {
        payload.copy.restaurant_assignments = true;
      }

      const json = await cloneCrmCluster(source.id, payload);
      if (!json?.cluster?.id) throw new Error("Clone did not return a new cluster");
      if (json.source_unchanged === false) {
        setError("Clone completed but source cluster may have changed — investigate before continuing.");
      } else {
        setSuccess(`Created “${json.cluster.name}”. Source cluster was not modified.`);
      }
      onCreated?.(json.cluster);
      setStep("done");
      navigate(`/clusters/admin/${json.cluster.id}`);
    } catch (err) {
      setError(err.message || "Unable to clone cluster");
    } finally {
      setBusy(false);
    }
  }

  function moveSelected(index, direction) {
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  function toggleSelected(restaurantId, checked) {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(restaurantId) ? prev : [...prev, restaurantId];
      return prev.filter((id) => id !== restaurantId);
    });
  }

  if (!source) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clone Cluster"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,32,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 80,
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 18,
          border: `1px solid ${CRM_COLORS.line}`,
          padding: 20,
          boxShadow: "0 24px 60px rgba(15,23,32,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Clone Cluster</h2>
            <div style={{ marginTop: 6, color: CRM_COLORS.muted, fontSize: 13 }}>
              Source: {source.name} ({source.slug}) — original is never modified.
            </div>
          </div>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Close
          </button>
        </div>

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <section style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Copy options</h3>
            {[
              ["metadata", "Cluster metadata"],
              ["short_description", "Short description"],
              ["description", "Full description"],
              ["website", "Website"],
              ["hero_image_url", "Hero image URL"],
              ["settings", "Cluster settings"],
              ["restaurant_assignments", "Restaurant assignments"],
              ["featured_ordering", "Featured restaurant ordering"],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={Boolean(copy[key])}
                  disabled={key === "featured_ordering" && !copy.restaurant_assignments && restaurantMode !== "keep"}
                  onChange={() => toggleCopy(key)}
                />
                {label}
              </label>
            ))}

            <div style={{ marginTop: 8, paddingTop: 10, borderTop: `1px dashed ${CRM_COLORS.line}` }}>
              <div style={{ fontSize: 12, color: CRM_COLORS.muted, marginBottom: 8 }}>Future expansion (not implemented)</div>
              {futureTargets.map((label) => (
                <label key={label} style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13, color: CRM_COLORS.muted, marginRight: 12 }}>
                  <input type="checkbox" disabled />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>New cluster values</h3>
            <input
              value={overrides.name}
              onChange={(e) =>
                setOverrides((prev) => ({
                  ...prev,
                  name: e.target.value,
                  slug:
                    prev.slug === slugify(`${source.slug}-copy`) || prev.slug === slugify(prev.name)
                      ? slugify(`${e.target.value}`)
                      : prev.slug,
                }))
              }
              placeholder="Cluster Name"
              style={inputStyle}
            />
            <input
              value={overrides.slug}
              onChange={(e) => setOverrides({ ...overrides, slug: slugify(e.target.value) })}
              placeholder="Slug"
              style={inputStyle}
            />
            <select value={overrides.type} onChange={(e) => setOverrides({ ...overrides, type: e.target.value })} style={inputStyle}>
              {(types.length ? types : [overrides.type || "other"]).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8 }}>
              <input value={overrides.city} onChange={(e) => setOverrides({ ...overrides, city: e.target.value })} placeholder="City" style={inputStyle} />
              <input
                value={overrides.state}
                onChange={(e) => setOverrides({ ...overrides, state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="ST"
                style={inputStyle}
              />
            </div>
            <input
              value={overrides.address_line1}
              onChange={(e) => setOverrides({ ...overrides, address_line1: e.target.value })}
              placeholder="Address"
              style={inputStyle}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={overrides.lat} onChange={(e) => setOverrides({ ...overrides, lat: e.target.value })} placeholder="Latitude" style={inputStyle} />
              <input value={overrides.lng} onChange={(e) => setOverrides({ ...overrides, lng: e.target.value })} placeholder="Longitude" style={inputStyle} />
            </div>
          </section>
        </div>

        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Restaurant recalculation</h3>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="radio"
              name="restaurantMode"
              checked={restaurantMode === "none"}
              onChange={() => {
                setRestaurantMode("none");
                setCopy((prev) => ({ ...prev, restaurant_assignments: false, featured_ordering: false }));
              }}
            />
            Start with no restaurants (default)
          </label>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="radio"
              name="restaurantMode"
              checked={restaurantMode === "keep"}
              onChange={() => {
                setRestaurantMode("keep");
                setCopy((prev) => ({ ...prev, restaurant_assignments: true }));
              }}
            />
            Option 1 — Keep restaurant assignments from source
          </label>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input
              type="radio"
              name="restaurantMode"
              checked={restaurantMode === "recalculate"}
              onChange={() => setRestaurantMode("recalculate")}
            />
            Option 2 — Recalculate restaurants from new lat/lng + radius
          </label>
          {restaurantMode === "recalculate" ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(e.target.value)}
                placeholder="Radius miles"
                style={{ ...inputStyle, maxWidth: 140 }}
              />
              <button type="button" onClick={handlePreviewRecalculate} disabled={busy} style={secondaryButtonStyle}>
                Preview recalculation
              </button>
            </div>
          ) : null}
        </section>

        {step === "recalculate" ? (
          <section style={{ marginTop: 16 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Recalculation preview ({selectedIds.length} selected)</h3>
            <div style={{ maxHeight: 260, overflow: "auto", border: `1px solid ${CRM_COLORS.line}`, borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["", "Restaurant", "Distance", "Address", "Order"].map((label) => (
                      <th
                        key={label}
                        style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, color: CRM_COLORS.muted, borderBottom: `1px solid ${CRM_COLORS.line}` }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((row) => {
                    const id = Number(row.restaurant_id);
                    const selectedIndex = selectedIds.indexOf(id);
                    const checked = selectedIndex >= 0;
                    return (
                      <tr key={id} style={{ borderBottom: `1px solid ${CRM_COLORS.line}` }}>
                        <td style={{ padding: 8 }}>
                          <input type="checkbox" checked={checked} onChange={(e) => toggleSelected(id, e.target.checked)} />
                        </td>
                        <td style={{ padding: 8, fontWeight: 650 }}>{row.restaurant_name}</td>
                        <td style={{ padding: 8 }}>{row.distance_miles} mi</td>
                        <td style={{ padding: 8 }}>{[row.address_line1, row.city, row.state].filter(Boolean).join(", ")}</td>
                        <td style={{ padding: 8 }}>
                          {checked ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button type="button" onClick={() => moveSelected(selectedIndex, -1)} style={secondaryButtonStyle}>
                                ↑
                              </button>
                              <button type="button" onClick={() => moveSelected(selectedIndex, 1)} style={secondaryButtonStyle}>
                                ↓
                              </button>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button type="button" onClick={handleClone} disabled={busy} style={buttonStyle}>
            {busy
              ? "Working…"
              : restaurantMode === "recalculate" && step !== "recalculate"
                ? "Preview then clone"
                : "Create cloned cluster"}
          </button>
        </div>
      </div>
    </div>
  );
}
