import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { createCluster, fetchClustersDirectory } from "../lib/clusterApi.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import ClusterDirectoryCard, { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import ClusterBackButton from "../components/cluster/ClusterBackButton.jsx";
import { stateDisplayName, clusterCoverageBadge, CLUSTER_GROWING_HELP_TEXT, CLUSTER_VIEW_PROMPTS } from "../lib/clusterUrl.js";
import { resolveClusterAutoOpenPath, resolveClusterMarketFromStoredLocation } from "../lib/clusterLocation.js";

const TYPE_ACCENTS = {
  university: { border: "#8b5cf6", bg: "#f5f3ff" },
  airport: { border: "#0ea5e9", bg: "#ecfeff" },
  downtown: { border: "#f97316", bg: "#fff7ed" },
  entertainment_complex: { border: "#ec4899", bg: "#fdf2f8" },
  tourist_destination: { border: "#16a34a", bg: "#f0fdf4" },
  stadium: { border: "#2563eb", bg: "#eff6ff" },
  convention_district: { border: "#14b8a6", bg: "#f0fdfa" },
  historic_district: { border: "#a16207", bg: "#fefce8" },
  waterfront: { border: "#0891b2", bg: "#ecfeff" },
  casino: { border: "#b91c1c", bg: "#fef2f2" },
  theme_park: { border: "#7c3aed", bg: "#f5f3ff" },
  business_district: { border: "#4b5563", bg: "#f9fafb" },
};

const TYPE_OPTIONS = [
  { id: "university", label: "University", radius: 2 },
  { id: "downtown", label: "Downtown", radius: 3 },
  { id: "airport", label: "Airport", radius: 2 },
  { id: "entertainment_district", label: "Entertainment District", radius: 1 },
  { id: "tourist_destination", label: "Tourist Destination", radius: 2 },
  { id: "stadium_arena", label: "Stadium / Arena", radius: 1 },
  { id: "shopping_district", label: "Shopping District", radius: 1 },
  { id: "hospital_medical_district", label: "Hospital / Medical District", radius: 1 },
  { id: "neighborhood", label: "Neighborhood", radius: 2 },
  { id: "custom", label: "Custom", radius: 2 },
];

const INITIAL_FORM = {
  name: "",
  state: "",
  city: "",
  type: "university",
  visibility: "PRIVATE",
  anchor_location: "",
  lat: "",
  lng: "",
  radius_miles: "2",
  short_description: "",
};

const US_STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const FIELD_STYLE = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "0.55rem 0.6rem",
};

const FORM_LABEL_STYLE = {
  display: "grid",
  gap: 4,
  minWidth: 0,
  width: "100%",
};

const STACKED_FIELDS = {
  display: "grid",
  gap: "0.65rem",
  gridTemplateColumns: "1fr",
  width: "100%",
  minWidth: 0,
};

export default function ClustersDirectoryPage() {
  const { isAuthenticated, consumer } = useConsumer();
  const storedMarket = useMemo(() => resolveClusterMarketFromStoredLocation(), []);
  const [clusters, setClusters] = useState([]);
  const autoOpenPath = useMemo(
    () => resolveClusterAutoOpenPath(clusters, storedMarket),
    [clusters, storedMarket]
  );
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const json = await fetchClustersDirectory({ limit: 200 });
        setClusters(Array.isArray(json.clusters) ? json.clusters : []);
      } catch (err) {
        setError(toConsumerErrorMessage(err, "Could not load clusters."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedClusters = useMemo(
    () =>
      [...clusters].sort(
        (a, b) =>
          String(a.city || "").localeCompare(String(b.city || "")) ||
          String(a.name || "").localeCompare(String(b.name || ""))
      ),
    [clusters]
  );

  async function submitCluster(event) {
    event.preventDefault();
    if (!isAuthenticated) return;
    if (consumer?.email_verified !== true) return;
    setSubmitBusy(true);
    setError("");
    try {
      const json = await createCluster({
        ...form,
        cluster_type: form.type,
        state: String(form.state || "").trim().toUpperCase(),
        latitude: form.lat === "" ? null : Number(form.lat),
        longitude: form.lng === "" ? null : Number(form.lng),
        formatted_address: form.anchor_location,
        radius_miles: Number(form.radius_miles),
      });
      if (json?.cluster) {
        const created = json.cluster;
        const visibility = String(created.visibility || "").toUpperCase();
        if (visibility === "PUBLIC") {
          setClusters((current) => [created, ...current]);
        } else {
          setPendingSubmissions((current) => [created, ...current]);
        }
      }
      setForm(INITIAL_FORM);
    } catch (err) {
      const message = toConsumerErrorMessage(err, "Could not submit cluster request.");
      if (String(message).toLowerCase().includes("authentication required")) {
        setError("Your session expired. Please sign in again, then submit your cluster.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitBusy(false);
    }
  }

  function clusterStatusLabel(cluster) {
    const growingBadge = clusterCoverageBadge(cluster);
    if (growingBadge) {
      return { label: growingBadge, title: CLUSTER_GROWING_HELP_TEXT };
    }
    const visibility = String(cluster?.visibility || "").toUpperCase();
    if (visibility === "PRIVATE") return { label: "🔒 Private", title: null };
    if (visibility === "SHARED") return { label: "🔗 Shared", title: null };
    const status = String(cluster?.status || "").toLowerCase();
    if (status === "draft" || status === "review") return { label: "🟠 Draft", title: null };
    return { label: null, title: null };
  }

  function renderClusterCard(cluster, isPending = false) {
    const type = String(cluster.type || "").toLowerCase();
    const accent = TYPE_ACCENTS[type] || { border: "#d1d5db", bg: "#f9fafb" };
    const status = clusterStatusLabel(cluster);
    return (
      <ClusterDirectoryCard
        key={`${cluster.id || cluster.slug}-${isPending ? "pending" : "active"}`}
        cluster={cluster}
        accent={accent}
        statusLabel={status.label}
        statusTitle={status.title}
        isPending={isPending}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "0 1rem 5rem",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "clip",
      }}
    >
      <StickyPageHeader />
      <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", minWidth: 0, paddingTop: "1rem" }}>
        <header
          style={{
            border: "1px solid #dbe7df",
            background: "#ffffff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <ClusterBackButton fallbackTo="/" label="Home" />
          <h1 style={{ margin: 0, fontSize: "1.7rem", lineHeight: 1.2, color: "#0B0F0C" }}>
            Clusters
          </h1>
          <p style={{ margin: 0, color: "#475569", maxWidth: 760 }}>
            A Cluster groups every restaurant in a real-world destination into one browsable food guide — campuses,
            downtowns, airports, entertainment districts, and more. Tap any card below to explore what you can eat
            there.
          </p>
          <p style={{ margin: "0.65rem 0 0", color: "#111827", fontWeight: 600, fontSize: "1.05rem" }}>
            {CLUSTER_VIEW_PROMPTS.directory}
          </p>
        </header>

        {autoOpenPath && storedMarket?.label ? (
          <section
            style={{
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              borderRadius: 14,
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0, color: "#1e3a8a", fontSize: "0.95rem", lineHeight: 1.45 }}>
              Near {storedMarket.label}?{" "}
              <Link to={autoOpenPath} style={{ color: "#1d4ed8", fontWeight: 700 }}>
                Open my local Cluster →
              </Link>
            </p>
          </section>
        ) : null}

        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        <section
          style={{
            border: "1px solid #dbe7df",
            background: "#fff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>All clusters on Menuply</h2>
          <p style={{ margin: "0.4rem 0 0.9rem", color: "#64748b", fontSize: 14 }}>
            Every public Cluster on Menuply — tap a card to explore.
          </p>
          {loading ? <p style={{ color: "#64748b" }}>Loading clusters…</p> : null}
          {!loading && sortedClusters.length === 0 ? (
            <p style={{ color: "#64748b" }}>No public clusters yet.</p>
          ) : null}
          {!loading && sortedClusters.length > 0 ? (
            <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
              {sortedClusters.map((cluster) => renderClusterCard(cluster, false))}
              {pendingSubmissions.map((cluster) => renderClusterCard(cluster, true))}
            </div>
          ) : null}
        </section>

        <section
          style={{
            border: "1px solid #dbe7df",
            background: "#fff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Create a Cluster</h2>
          <p style={{ margin: "0.4rem 0 0.9rem", color: "#64748b", fontSize: 14 }}>
            Public clusters publish immediately as <strong>Growing</strong> while restaurant and menu coverage
            expands. Private and shared clusters stay off the public directory.
          </p>

          {!isAuthenticated ? (
            <p style={{ margin: 0, color: "#475569" }}>
              <Link to="/account/login" state={{ redirectTo: "/clusters" }}>
                Sign in
              </Link>{" "}
              to submit a cluster.
            </p>
          ) : consumer?.email_verified !== true ? (
            <p style={{ margin: 0, color: "#475569" }}>
              Verify your email first to submit a cluster.
            </p>
          ) : (
            <form onSubmit={submitCluster} style={{ display: "grid", gap: "0.75rem", minWidth: 0, width: "100%" }}>
              <label style={FORM_LABEL_STYLE}>
                <span style={{ fontSize: 13, color: "#334155" }}>Cluster name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
                  style={FIELD_STYLE}
                />
              </label>
              <div style={STACKED_FIELDS}>
                <label style={FORM_LABEL_STYLE}>
                  <span style={{ fontSize: 13, color: "#334155" }}>State</span>
                  <select
                    required
                    value={form.state}
                    onChange={(event) => setForm((c) => ({ ...c, state: event.target.value }))}
                    style={FIELD_STYLE}
                  >
                    <option value="">Select</option>
                    {US_STATE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {stateDisplayName(code)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={FORM_LABEL_STYLE}>
                  <span style={{ fontSize: 13, color: "#334155" }}>City</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))}
                    placeholder="Los Angeles"
                    style={FIELD_STYLE}
                  />
                </label>
              </div>
              <label style={FORM_LABEL_STYLE}>
                <span style={{ fontSize: 13, color: "#334155" }}>Cluster type</span>
                <select
                  required
                  value={form.type}
                  onChange={(event) => {
                    const type = event.target.value;
                    const defaults = TYPE_OPTIONS.find((entry) => entry.id === type);
                    setForm((c) => ({ ...c, type, radius_miles: String(defaults?.radius || 2) }));
                  }}
                  style={FIELD_STYLE}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={FORM_LABEL_STYLE}>
                <span style={{ fontSize: 13, color: "#334155" }}>Visibility</span>
                <select
                  required
                  value={form.visibility}
                  onChange={(event) => setForm((c) => ({ ...c, visibility: event.target.value }))}
                  style={FIELD_STYLE}
                >
                  <option value="PRIVATE">Private</option>
                  <option value="SHARED">Shared (link only)</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </label>
              <label style={FORM_LABEL_STYLE}>
                <span style={{ fontSize: 13, color: "#334155" }}>Anchor location</span>
                <input
                  required
                  value={form.anchor_location}
                  onChange={(event) => setForm((c) => ({ ...c, anchor_location: event.target.value }))}
                  placeholder="Street address or landmark"
                  style={FIELD_STYLE}
                />
              </label>
              <div style={STACKED_FIELDS}>
                <label style={FORM_LABEL_STYLE}>
                  <span style={{ fontSize: 13, color: "#334155" }}>Radius (mi)</span>
                  <input
                    required
                    type="number"
                    min="0.25"
                    max="25"
                    step="0.25"
                    value={form.radius_miles}
                    onChange={(event) => setForm((c) => ({ ...c, radius_miles: event.target.value }))}
                    style={FIELD_STYLE}
                  />
                </label>
                <label style={FORM_LABEL_STYLE}>
                  <span style={{ fontSize: 13, color: "#334155" }}>Latitude (optional)</span>
                  <input
                    value={form.lat}
                    onChange={(event) => setForm((c) => ({ ...c, lat: event.target.value }))}
                    placeholder="34.0224"
                    style={FIELD_STYLE}
                  />
                </label>
                <label style={FORM_LABEL_STYLE}>
                  <span style={{ fontSize: 13, color: "#334155" }}>Longitude (optional)</span>
                  <input
                    value={form.lng}
                    onChange={(event) => setForm((c) => ({ ...c, lng: event.target.value }))}
                    placeholder="-118.2851"
                    style={FIELD_STYLE}
                  />
                </label>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  Anchor location is required. Latitude/longitude is optional.
                </div>
              </div>
              <label style={FORM_LABEL_STYLE}>
                <span style={{ fontSize: 13, color: "#334155" }}>Short description</span>
                <textarea
                  required
                  rows={3}
                  value={form.short_description}
                  onChange={(event) => setForm((c) => ({ ...c, short_description: event.target.value }))}
                  style={FIELD_STYLE}
                />
              </label>
              <button
                type="submit"
                disabled={submitBusy}
                style={{
                  justifySelf: "start",
                  border: "none",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#fff",
                  padding: "0.58rem 0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {submitBusy ? "Submitting..." : "Submit Cluster"}
              </button>
            </form>
          )}
        </section>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <p style={{ marginTop: "0.85rem", color: "#64748b", fontSize: 12 }}>
          Private and shared clusters are not indexed. Growing public clusters are searchable and included in the
          sitemap.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
